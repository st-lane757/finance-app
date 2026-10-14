import type { ReactNode } from 'react';
import { ErrorBoundary } from '../feedback/ErrorBoundary';
import { EmptyState, ErrorState, LoadingState } from '../feedback/states';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  status: 'loading' | 'error' | 'success';
  /** Message shown when status is 'error'. */
  errorMessage?: string;
  onRetry?: () => void;
  /** When true on success, renders the empty state instead of children. */
  isEmpty?: boolean;
  /** Custom message for the empty state. */
  emptyMessage?: string;
  children: ReactNode;
}

/** Reusable card that owns loading / error / empty / boundary handling for any chart. */
export function ChartCard({
  title,
  subtitle,
  status,
  errorMessage = 'Unable to load data.',
  onRetry,
  isEmpty = false,
  emptyMessage,
  children,
}: ChartCardProps) {
  return (
    <section className="card chart-card" aria-label={title}>
      <header>
        <h2>{title}</h2>
        {subtitle && <p className="muted">{subtitle}</p>}
      </header>
      <ErrorBoundary>
        {status === 'loading' && <LoadingState />}
        {status === 'error' && <ErrorState message={errorMessage} onRetry={onRetry} />}
        {status === 'success' && (isEmpty ? <EmptyState message={emptyMessage} /> : children)}
      </ErrorBoundary>
    </section>
  );
}
