import { useMemo } from 'react';
import { DashboardPage } from './pages/DashboardPage';
import { createMarketDataService, type MarketDataService } from './services';
import { MarketServiceProvider } from './state/MarketServiceContext';

export default function App({ service }: { service?: MarketDataService }) {
  const resolved = useMemo(() => service ?? createMarketDataService(), [service]);
  return (
    <MarketServiceProvider service={resolved}>
      <DashboardPage />
    </MarketServiceProvider>
  );
}
