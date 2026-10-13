import YahooFinance from 'yahoo-finance2';
import type { RawChartPoint, RawQuote } from './normalize';

/** The only surface of Yahoo Finance the server depends on (easy to fake in tests). */
export interface YahooSource {
  quote(symbol: string): Promise<RawQuote | undefined>;
  chart(
    symbol: string,
    options: { period1: Date; interval: '5m' | '30m' | '1d' },
  ): Promise<RawChartPoint[]>;
}

/** The only file that imports yahoo-finance2. */
export function createYahooSource(): YahooSource {
  const yahoo = new YahooFinance();
  return {
    async quote(symbol) {
      return (await yahoo.quote(symbol)) as RawQuote | undefined;
    },
    async chart(symbol, options) {
      const result = await yahoo.chart(symbol, options);
      return result.quotes;
    },
  };
}
