import { QuoteCard } from '../components/cards/QuoteCard';
import { useHistories, useQuotes } from '../state/useMarketData';
import { ComparisonSection } from './ComparisonSection';

/** Current-day market summary: live quote cards plus the intraday comparison. */
export function DayView() {
  const quotes = useQuotes();
  const histories = useHistories('day');

  return (
    <>
      <section aria-label="Current quotes" className="quote-grid">
        {quotes.status === 'loading' && <p role="status">Loading quotes…</p>}
        {quotes.status === 'error' && (
          <div role="alert" className="state state-error">
            <p>{quotes.error.message}</p>
            <button type="button" onClick={quotes.refetch}>
              Retry
            </button>
          </div>
        )}
        {quotes.status === 'success' && quotes.data.map((q) => <QuoteCard key={q.symbol} quote={q} />)}
      </section>
      <ComparisonSection window="day" histories={histories} />
    </>
  );
}
