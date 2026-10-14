import { seriesStats } from '../analytics/metrics';
import { AreaTrendChart } from '../components/charts/AreaTrendChart';
import { ChartCard } from '../components/charts/ChartCard';
import { COMPANIES } from '../config/companies';
import type { TimeWindow } from '../domain/types';
import { useHistories } from '../state/useMarketData';
import { tickFormatter } from './ComparisonSection';

/** Fallback color for symbols not in the tracked company list. */
const CUSTOM_COLOR = '#6929c4';

interface Props {
  symbol: string;
  window: TimeWindow;
}

/**
 * Fetches and displays an absolute-price area chart for any user-entered symbol.
 * Uses the same data layer as the fixed dashboards; shows a clear message when no
 * data is available rather than falling back to another company's data.
 */
export function SelectedCompanySection({ symbol, window }: Props) {
  const histories = useHistories(window, [symbol]);
  const series = histories.status === 'success' ? histories.data[0] : undefined;
  const stats = series ? seriesStats(series) : undefined;
  const color = COMPANIES.find((c) => c.symbol === symbol)?.color ?? CUSTOM_COLOR;
  const isEmpty = histories.status === 'success' && (!series || series.points.length < 2);

  return (
    <ChartCard
      title={`${symbol} price`}
      subtitle={
        stats
          ? `Low ${stats.low.toFixed(2)} · High ${stats.high.toFixed(2)} · Last ${stats.last.toFixed(2)}`
          : undefined
      }
      status={histories.status}
      errorMessage={
        histories.status === 'error'
          ? histories.error.code === 'INVALID_SYMBOL'
            ? `"${symbol}" is not a recognised ticker symbol.`
            : histories.error.message
          : undefined
      }
      onRetry={histories.refetch}
      isEmpty={isEmpty}
      emptyMessage={`No price data is available for "${symbol}".`}
    >
      {series && (
        <AreaTrendChart
          points={series.points}
          color={color}
          label={symbol}
          formatTick={tickFormatter(window)}
        />
      )}
    </ChartCard>
  );
}
