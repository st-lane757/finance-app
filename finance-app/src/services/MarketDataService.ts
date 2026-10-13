import type { PriceSeries, Quote, TimeWindow } from '../domain/types';

/**
 * The only data contract the UI depends on. Implementations (mock, HTTP proxy
 * to Yahoo Finance, ...) are interchangeable.
 */
export interface MarketDataService {
  getQuotes(symbols: readonly string[], signal?: AbortSignal): Promise<Quote[]>;
  getHistory(symbol: string, window: TimeWindow, signal?: AbortSignal): Promise<PriceSeries>;
}
