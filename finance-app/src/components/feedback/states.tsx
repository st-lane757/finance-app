export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p role="status" className="state state-loading">
      {label}
    </p>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="state state-error">
      <p>{message}</p>
      {onRetry && (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message = 'No data available.' }: { message?: string }) {
  return <p className="state state-empty">{message}</p>;
}
