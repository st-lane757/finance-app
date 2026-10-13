import { COMPANIES } from '../config/companies';
import { getTimeWindow } from '../config/timeWindows';
import type { PricePoint, PriceSeries, Quote, TimeWindow } from '../domain/types';
import { MarketError } from './errors';
import type { MarketDataService } from './MarketDataService';

const BASE_PRICES: Record<string, number> = {
  IBM: 230,
  MSFT: 420,
  ORCL: 170,
  SAP: 260,
  CRM: 310,
};

const POINTS: Record<TimeWindow, number> = { day: 78, week: 65, quarter: 63 };

/** Small deterministic PRNG (mulberry32) so mock data is stable per symbol. */
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const DAY_BAR_MS = 5 * 60 * 1000;

export class MockMarketProvider implements MarketDataService {
  constructor(private readonly now: () => number = Date.now) {}

  async getHistory(symbol: string, window: TimeWindow): Promise<PriceSeries> {
    const base = BASE_PRICES[symbol];
    if (base === undefined) {
      throw new MarketError('INVALID_SYMBOL', `Unknown symbol: ${symbol}`);
    }
    const { days } = getTimeWindow(window);
    const count = POINTS[window];
    const end = this.now();
    // Day view mimics one 6.5h session at 5-minute bars, like the live provider.
    const step = window === 'day' ? DAY_BAR_MS : (days * 24 * 60 * 60 * 1000) / (count - 1);
    const rand = seeded(hash(`${symbol}:${window}`));

    let price = base;
    const points: PricePoint[] = [];
    for (let i = 0; i < count; i++) {
      price = Math.max(1, price * (1 + (rand() - 0.5) * 0.01));
      points.push({ t: Math.round(end - (count - 1 - i) * step), close: Number(price.toFixed(2)) });
    }
    return { symbol, window, points };
  }

  async getQuotes(symbols: readonly string[]): Promise<Quote[]> {
    return Promise.all(
      symbols.map(async (symbol) => {
        const { points } = await this.getHistory(symbol, 'day');
        const first = points[0].close;
        const last = points[points.length - 1];
        const change = last.close - first;
        return {
          symbol,
          name: COMPANIES.find((c) => c.symbol === symbol)?.name ?? symbol,
          price: last.close,
          change: Number(change.toFixed(2)),
          changePct: Number(((change / first) * 100).toFixed(2)),
          currency: 'USD',
          asOf: last.t,
        };
      }),
    );
  }
}
