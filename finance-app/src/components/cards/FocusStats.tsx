import type { FocusComparison } from '../../analytics/metrics';

const signed = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;

/** Headline cards for the focus company: its change, ranking and gap to peers. */
export function FocusStats({ focus, periodLabel }: { focus: FocusComparison; periodLabel: string }) {
  return (
    <section aria-label={`${focus.symbol} summary`} className="stat-grid">
      <article className="card stat-card">
        <h3>{focus.symbol} change</h3>
        <p className={`stat-value ${focus.pct >= 0 ? 'up' : 'down'}`}>{signed(focus.pct)}%</p>
        <p className="muted">{periodLabel}</p>
      </article>
      <article className="card stat-card">
        <h3>Rank</h3>
        <p className="stat-value">
          {focus.rank} of {focus.total}
        </p>
        <p className="muted">by % change</p>
      </article>
      {focus.delta !== undefined && focus.peerAverage !== undefined && (
        <article className="card stat-card">
          <h3>Vs peer average</h3>
          <p className={`stat-value ${focus.delta >= 0 ? 'up' : 'down'}`}>{signed(focus.delta)} pts</p>
          <p className="muted">peers {signed(focus.peerAverage)}%</p>
        </article>
      )}
    </section>
  );
}
