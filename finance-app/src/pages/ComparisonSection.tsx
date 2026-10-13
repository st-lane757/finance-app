import { focusVsPeers, rankByChange, seriesStats, toComparisonData } from '../analytics/metrics';
import { FocusStats } from '../components/cards/FocusStats';
import { AreaTrendChart } from '../components/charts/AreaTrendChart';
import { ChartCard } from '../components/charts/ChartCard';
import { ComparisonLineChart } from '../components/charts/ComparisonLineChart';
import { RankingTable } from '../components/tables/RankingTable';
import { COMPANIES, FOCUS_SYMBOL } from '../config/companies';
import { getTimeWindow } from '../config/timeWindows';
import type { TimeWindow } from '../domain/types';
import type { useHistories } from '../state/useMarketData';

/** Day: time of day. Week: date + hour (several bars per day would otherwise repeat labels). Quarter: date. */
export function tickFormatter(window: TimeWindow): (t: number) => string {
  return (t) => {
    const d = new Date(t);
    if (window === 'day') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (window === 'week') return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };
}

interface Props {
  window: TimeWindow;
  histories: ReturnType<typeof useHistories>;
  /** Show the focus company's change / rank / gap-to-peers cards. */
  showFocus?: boolean;
  /** Show an absolute-price area chart for the focus company. */
  showTrend?: boolean;
}

/** Comparison chart + ranking (+ optional focus cards and trend) for one time window. */
export function ComparisonSection({ window, histories, showFocus = false, showTrend = false }: Props) {
  const { label } = getTimeWindow(window);
  const data = histories.status === 'success' ? histories.data : [];
  const usable = data.filter((s) => s.points.length >= 2);
  const missing = histories.status === 'success'
    ? COMPANIES.filter((c) => !usable.some((s) => s.symbol === c.symbol)).map((c) => c.symbol)
    : [];

  const ranked = rankByChange(usable);
  const focus = focusVsPeers(ranked, FOCUS_SYMBOL);
  const focusSeries = usable.find((s) => s.symbol === FOCUS_SYMBOL);
  const focusStats = focusSeries && seriesStats(focusSeries);
  const focusColor = COMPANIES.find((c) => c.symbol === FOCUS_SYMBOL)?.color ?? '#0f62fe';
  const formatTick = tickFormatter(window);

  return (
    <>
      {showFocus && focus && <FocusStats focus={focus} periodLabel={label} />}

      <ChartCard
        title={`Relative performance — ${label}`}
        subtitle="Each series rebased to 100 at the start of the window"
        status={histories.status}
        errorMessage={histories.status === 'error' ? histories.error.message : undefined}
        onRetry={histories.refetch}
        isEmpty={usable.length === 0}
      >
        <ComparisonLineChart data={toComparisonData(usable)} companies={COMPANIES} formatTick={formatTick} />
        {missing.length > 0 && (
          <p role="note" className="muted notice">
            Data unavailable for: {missing.join(', ')}
          </p>
        )}
        <RankingTable rows={ranked} caption={`Change — ${label}`} />
      </ChartCard>

      {showTrend && focusSeries && focusStats && (
        <ChartCard
          title={`${FOCUS_SYMBOL} price — ${label}`}
          subtitle={`Low ${focusStats.low.toFixed(2)} · High ${focusStats.high.toFixed(2)} · Last ${focusStats.last.toFixed(2)}`}
          status="success"
        >
          <AreaTrendChart
            points={focusSeries.points}
            color={focusColor}
            label={FOCUS_SYMBOL}
            formatTick={formatTick}
          />
        </ChartCard>
      )}
    </>
  );
}
