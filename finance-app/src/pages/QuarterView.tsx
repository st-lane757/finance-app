import { useHistories } from '../state/useMarketData';
import { ComparisonSection } from './ComparisonSection';

/** Last-quarter comparison with IBM headline stats and its absolute price trend. */
export function QuarterView() {
  const histories = useHistories('quarter');
  return <ComparisonSection window="quarter" histories={histories} showFocus showTrend />;
}
