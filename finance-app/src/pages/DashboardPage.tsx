import { useState } from 'react';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import type { TimeWindow } from '../domain/types';
import { DayView } from './DayView';
import { QuarterView } from './QuarterView';
import { WeekView } from './WeekView';

const VIEWS: Record<TimeWindow, () => JSX.Element> = {
  day: DayView,
  week: WeekView,
  quarter: QuarterView,
};

/** Page shell: title, window tabs, and the one active view (so only it fetches data). */
export function DashboardPage() {
  const [window, setWindow] = useState<TimeWindow>('day');
  const View = VIEWS[window];

  return (
    <main className="dashboard">
      <h1>IBM Market Dashboard</h1>
      <TimeWindowTabs value={window} onChange={setWindow} />
      <div role="tabpanel" id="dashboard-panel" aria-labelledby={`tab-${window}`}>
        <View />
      </div>
    </main>
  );
}
