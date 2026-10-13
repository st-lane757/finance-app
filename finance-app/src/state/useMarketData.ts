import { COMPANY_SYMBOLS } from '../config/companies';
import type { PriceSeries, Quote, TimeWindow } from '../domain/types';
import { useMarketService } from './MarketServiceContext';
import { useAsync } from './useAsync';

export function useQuotes(symbols: readonly string[] = COMPANY_SYMBOLS) {
  const service = useMarketService();
  const key = symbols.join(',');
  return useAsync<Quote[]>((signal) => service.getQuotes(symbols, signal), [service, key]);
}

/** Fetches every symbol's history; a failing symbol is dropped, not fatal. */
export function useHistories(window: TimeWindow, symbols: readonly string[] = COMPANY_SYMBOLS) {
  const service = useMarketService();
  const key = symbols.join(',');
  return useAsync<PriceSeries[]>(async (signal) => {
    const results = await Promise.allSettled(
      symbols.map((s) => service.getHistory(s, window, signal)),
    );
    const series = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
    if (series.length === 0) {
      const firstFailure = results.find((r) => r.status === 'rejected');
      throw firstFailure && firstFailure.status === 'rejected'
        ? firstFailure.reason
        : new Error('No data');
    }
    return series;
  }, [service, window, key]);
}
