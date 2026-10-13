import { useHistories } from '../state/useMarketData';
import { ComparisonSection } from './ComparisonSection';

/** Last-7-days trend comparison with IBM headline stats. */
export function WeekView() {
  const histories = useHistories('week');
  return <ComparisonSection window="week" histories={histories} showFocus />;
}
