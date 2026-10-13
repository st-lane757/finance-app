import express, { type NextFunction, type Request, type Response } from 'express';
import { getTimeWindow } from '../src/config/timeWindows';
import type { TimeWindow } from '../src/domain/types';
import { TtlCache } from './cache';
import { HttpError, mapUpstreamError } from './errors';
import { normalizeHistory, normalizeQuote } from './normalize';
import { parseSymbol, parseSymbols, parseWindow } from './validate';
import type { YahooSource } from './yahooClient';

const DAY_MS = 24 * 60 * 60 * 1000;
const QUOTE_TTL_MS = 30_000;
const HISTORY_TTL_MS: Record<TimeWindow, number> = {
  day: 60_000,
  week: 5 * 60_000,
  quarter: 15 * 60_000,
};
/** The day view looks back further so weekends/holidays still yield the latest session. */
const LOOKBACK_DAYS: Record<TimeWindow, number> = { day: 5, week: 7, quarter: 91 };

export function createApp(source: YahooSource, now: () => number = Date.now) {
  const app = express();
  const cache = new TtlCache(now);

  const upstream = async <T>(work: () => Promise<T>): Promise<T> => {
    try {
      return await work();
    } catch (error) {
      throw mapUpstreamError(error);
    }
  };

  app.get('/api/quotes', async (req, res) => {
    const symbols = parseSymbols(req.query.symbols);
    const results = await Promise.allSettled(
      symbols.map((symbol) =>
        cache.get(`q:${symbol}`, QUOTE_TTL_MS, () =>
          upstream(async () => normalizeQuote(symbol, await source.quote(symbol))),
        ),
      ),
    );
    const quotes = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    if (quotes.length === 0) {
      const failure = results.find((r) => r.status === 'rejected');
      throw failure?.status === 'rejected' ? failure.reason : new HttpError(502, 'UPSTREAM', 'No quotes');
    }
    res.json({ quotes });
  });

  app.get('/api/history', async (req, res) => {
    const symbol = parseSymbol(req.query.symbol);
    const window = parseWindow(req.query.window);
    const { interval } = getTimeWindow(window);
    const series = await cache.get(`h:${symbol}:${window}`, HISTORY_TTL_MS[window], () =>
      upstream(async () => {
        const period1 = new Date(now() - LOOKBACK_DAYS[window] * DAY_MS);
        return normalizeHistory(symbol, window, await source.chart(symbol, { period1, interval }));
      }),
    );
    res.json(series);
  });

  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'INVALID_REQUEST', 'Unknown endpoint')));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express needs the 4-arg signature
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const http = error instanceof HttpError ? error : mapUpstreamError(error);
    res.status(http.status).json({ error: { code: http.code, message: http.message } });
  });

  return app;
}
