import { TIME_WINDOWS } from '../../config/timeWindows';
import type { TimeWindow } from '../../domain/types';

interface Props {
  value: TimeWindow;
  onChange: (next: TimeWindow) => void;
}

export function TimeWindowTabs({ value, onChange }: Props) {
  return (
    <div role="tablist" aria-label="Time window" className="tabs">
      {TIME_WINDOWS.map((w) => (
        <button
          key={w.id}
          id={`tab-${w.id}`}
          type="button"
          role="tab"
          aria-selected={w.id === value}
          aria-controls="dashboard-panel"
          className={w.id === value ? 'tab active' : 'tab'}
          onClick={() => onChange(w.id)}
        >
          {w.label}
        </button>
      ))}
    </div>
  );
}
