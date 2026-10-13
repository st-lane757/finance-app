import { describe, expect, it } from 'vitest';
import { tickFormatter } from './ComparisonSection';

describe('tickFormatter', () => {
  const morning = new Date(2026, 9, 13, 9, 5).getTime();
  const afternoon = new Date(2026, 9, 13, 14, 5).getTime();

  it('shows a time of day for the day window', () => {
    expect(tickFormatter('day')(afternoon)).toMatch(/\d{1,2}:05/);
  });

  it('distinguishes bars on the same date in the week window', () => {
    const format = tickFormatter('week');
    expect(format(afternoon)).toMatch(/13/);
    expect(format(morning)).not.toBe(format(afternoon));
  });

  it('shows only the date for the quarter window', () => {
    const format = tickFormatter('quarter');
    expect(format(afternoon)).toMatch(/13/);
    expect(format(afternoon)).not.toMatch(/:/);
    expect(format(morning)).toBe(format(afternoon));
  });
});
