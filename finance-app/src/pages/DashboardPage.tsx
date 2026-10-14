import { useState } from 'react';
import { SymbolPicker } from '../components/controls/SymbolPicker';
import { TimeWindowTabs } from '../components/layout/TimeWindowTabs';
import type { TimeWindow } from '../domain/types';
import { DayView } from './DayView';
import { QuarterView } from './QuarterView';
import { SelectedCompanySection } from './SelectedCompanySection';
import { WeekView } from './WeekView';

const VIEWS: Record<TimeWindow, () => JSX.Element> = {
  day: DayView,
  week: WeekView,
  quarter: QuarterView,
};

/** Page shell: title, window tabs, existing views, and the optional user-selected chart. */
export function DashboardPage() {
  const [window, setWindow] = useState<TimeWindow>('day');
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const View = VIEWS[window];

  return (
    <main className="dashboard">
      <h1>IBM Market Dashboard</h1>
      <SymbolPicker onSelect={setSelectedSymbol} />
      <TimeWindowTabs value={window} onChange={setWindow} />
      <div role="tabpanel" id="dashboard-panel" aria-labelledby={`tab-${window}`}>
        <View />
      </div>
      {selectedSymbol && (
        <SelectedCompanySection symbol={selectedSymbol} window={window} />
      )}
    </main>
  );
}
