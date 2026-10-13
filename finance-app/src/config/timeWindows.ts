import type { TimeWindow } from '../domain/types';

export interface TimeWindowConfig {
  id: TimeWindow;
  label: string;
  /** Lookback in days. */
  days: number;
  /** Provider-agnostic sampling hint. */
  interval: '5m' | '30m' | '1d';
}

export const TIME_WINDOWS: readonly TimeWindowConfig[] = [
  { id: 'day', label: 'Current day', days: 1, interval: '5m' },
  { id: 'week', label: 'Last 7 days', days: 7, interval: '30m' },
  { id: 'quarter', label: 'Last quarter', days: 91, interval: '1d' },
];

export function getTimeWindow(id: TimeWindow): TimeWindowConfig {
  const found = TIME_WINDOWS.find((w) => w.id === id);
  if (!found) throw new Error(`Unknown time window: ${id}`);
  return found;
}
