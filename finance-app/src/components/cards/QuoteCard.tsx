import type { Quote } from '../../domain/types';

export function QuoteCard({ quote }: { quote: Quote }) {
  const direction = quote.change >= 0 ? 'up' : 'down';
  const sign = quote.change >= 0 ? '+' : '';
  return (
    <article className={`card quote-card ${direction}`} aria-label={`${quote.symbol} quote`}>
      <h3>
        {quote.symbol}
        {quote.name !== quote.symbol && <span className="muted"> {quote.name}</span>}
      </h3>
      <p className="price">
        {quote.price.toFixed(2)} <span className="muted">{quote.currency}</span>
      </p>
      <p className="delta">
        {sign}
        {quote.change.toFixed(2)} ({sign}
        {quote.changePct.toFixed(2)}%)
      </p>
    </article>
  );
}
