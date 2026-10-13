import { COMPANIES } from '../src/config/companies';
import type { PricePoint, PriceSeries, Quote, TimeWindow } from '../src/domain/types';
import { HttpError } from './errors';

/** Minimal shapes of the Yahoo payload that we rely on. Everything may be missing. */
export interface RawQuote {
  regularMarketPrice?: number | null;
  regularMarketChange?: number | null;
  regularMarketChangePercent?: number | null;
  currency?: string | null;
  shortName?: string | null;
  longName?: string | null;
  regularMarketTime?: Date | number | null;
}

export interface RawChartPoint {
  date: Date | number | string;
  close: number | null | undefined;
}

/** Day view shows only the latest session: keep points within this span of the last point. */
const SESSION_SPAN_MS = 12 * 60 * 60 * 1000;

const round2 = (n: number) => Number(n.toFixed(2));

function toMillis(value: Date | number | string | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const ms = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isFinite(ms) ? ms : undefined;
}

export function normalizeQuote(symbol: string, raw: RawQuote | undefined | null): Quote {
  if (!raw) throw new HttpError(404, 'INVALID_SYMBOL', 'Symbol not found');
  const price = raw.regularMarketPrice;
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new HttpError(502, 'UPSTREAM', `No price available for ${symbol}`);
  }
  const change = Number.isFinite(raw.regularMarketChange) ? (raw.regularMarketChange as number) : 0;
  const changePct = Number.isFinite(raw.regularMarketChangePercent)
    ? (raw.regularMarketChangePercent as number)
    : 0;
  return {
    symbol,
    name: COMPANIES.find((c) => c.symbol === symbol)?.name ?? raw.shortName ?? raw.longName ?? symbol,
    price: round2(price),
    change: round2(change),
    changePct: round2(changePct),
    currency: raw.currency ?? 'USD',
    asOf: toMillis(raw.regularMarketTime) ?? Date.now(),
  };
}

/** Drops null/invalid points, sorts by time, and trims the day window to the latest session. */
export function normalizeHistory(
  symbol: string,
  window: TimeWindow,
  raw: readonly RawChartPoint[],
): PriceSeries {
  let points: PricePoint[] = [];
  for (const p of raw) {
    const t = toMillis(p.date);
    if (t === undefined || typeof p.close !== 'number' || !Number.isFinite(p.close)) continue;
    points.push({ t, close: round2(p.close) });
  }
  points.sort((a, b) => a.t - b.t);

  if (window === 'day' && points.length > 0) {
    const cutoff = points[points.length - 1].t - SESSION_SPAN_MS;
    points = points.filter((p) => p.t >= cutoff);
  }
  return { symbol, window, points };
}
