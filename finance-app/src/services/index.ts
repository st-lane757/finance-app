import { HttpMarketProvider } from './HttpMarketProvider';
import type { MarketDataService } from './MarketDataService';
import { MockMarketProvider } from './MockMarketProvider';

/**
 * Provider factory. `VITE_DATA_SOURCE=http` uses the Yahoo Finance proxy
 * (`npm run dev:server`); anything else uses the deterministic mock.
 */
export function createMarketDataService(source: string | undefined = import.meta.env.VITE_DATA_SOURCE): MarketDataService {
  return source === 'http' ? new HttpMarketProvider() : new MockMarketProvider();
}

export type { MarketDataService } from './MarketDataService';
export { MarketError, toMarketError } from './errors';
