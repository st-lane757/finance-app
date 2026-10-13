import type { PriceSeries, Quote, TimeWindow } from '../domain/types';
import { MarketError, type MarketErrorCode } from './errors';
import type { MarketDataService } from './MarketDataService';

type FetchLike = typeof fetch;

const SERVER_CODES: Record<string, MarketErrorCode> = {
  INVALID_SYMBOL: 'INVALID_SYMBOL',
  UPSTREAM: 'UPSTREAM',
};

/** Talks to the Node proxy in `server/`, which in turn calls Yahoo Finance. */
export class HttpMarketProvider implements MarketDataService {
  constructor(
    private readonly baseUrl: string = '',
    private readonly fetchFn: FetchLike = (...args) => fetch(...args),
  ) {}

  async getQuotes(symbols: readonly string[], signal?: AbortSignal): Promise<Quote[]> {
    const query = new URLSearchParams({ symbols: symbols.join(',') });
    const body = await this.request<{ quotes: Quote[] }>(`/api/quotes?${query}`, signal);
    return body.quotes;
  }

  getHistory(symbol: string, window: TimeWindow, signal?: AbortSignal): Promise<PriceSeries> {
    const query = new URLSearchParams({ symbol, window });
    return this.request<PriceSeries>(`/api/history?${query}`, signal);
  }

  private async request<T>(path: string, signal?: AbortSignal): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.baseUrl}${path}`, { signal });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') throw error;
      throw new MarketError('NETWORK', 'Unable to reach the market data service');
    }

    if (!response.ok) {
      let code: MarketErrorCode = 'UPSTREAM';
      let message = `Market data request failed (${response.status})`;
      try {
        const payload = (await response.json()) as { error?: { code?: string; message?: string } };
        code = SERVER_CODES[payload.error?.code ?? ''] ?? code;
        message = payload.error?.message ?? message;
      } catch {
        // Non-JSON error body (e.g. proxy down): keep the generic message.
      }
      throw new MarketError(code, message);
    }
    return (await response.json()) as T;
  }
}
