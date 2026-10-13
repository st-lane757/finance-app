import { createContext, useContext, type ReactNode } from 'react';
import type { MarketDataService } from '../services';

const ServiceContext = createContext<MarketDataService | null>(null);

export function MarketServiceProvider({
  service,
  children,
}: {
  service: MarketDataService;
  children: ReactNode;
}) {
  return <ServiceContext.Provider value={service}>{children}</ServiceContext.Provider>;
}

export function useMarketService(): MarketDataService {
  const service = useContext(ServiceContext);
  if (!service) throw new Error('useMarketService must be used inside MarketServiceProvider');
  return service;
}
