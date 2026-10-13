import { useCallback, useEffect, useState } from 'react';
import type { MarketError } from '../services';
import { toMarketError } from '../services';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: MarketError }
  | { status: 'success'; data: T };

/** Runs `load` on mount and whenever `deps` change; aborts stale requests. */
export function useAsync<T>(
  load: (signal: AbortSignal) => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> & { refetch: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: 'loading' });
    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data });
      },
      (err: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error: toMarketError(err) });
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const refetch = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, refetch };
}
