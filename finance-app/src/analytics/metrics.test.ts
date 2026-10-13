import { describe, expect, it } from 'vitest';
import type { PriceSeries } from '../domain/types';
import {
  focusVsPeers,
  pctChange,
  rankByChange,
  seriesStats,
  toComparisonData,
} from './metrics';

const series = (symbol: string, closes: number[], times?: number[]): PriceSeries => ({
  symbol,
  window: 'week',
  points: closes.map((close, i) => ({ t: times?.[i] ?? i, close })),
});

describe('pctChange', () => {
  it('computes percent change first to last', () => {
    expect(pctChange(series('A', [100, 110]))).toBeCloseTo(10);
    expect(pctChange(series('A', [100, 50]))).toBeCloseTo(-50);
  });

  it('returns 0 for short or zero-based series', () => {
    expect(pctChange(series('A', []))).toBe(0);
    expect(pctChange(series('A', [100]))).toBe(0);
    expect(pctChange(series('A', [0, 5]))).toBe(0);
  });
});

describe('toComparisonData', () => {
  it('rebases series to 100', () => {
    const rows = toComparisonData([series('A', [50, 100]), series('B', [200, 100])]);
    expect(rows[0]).toMatchObject({ A: 100, B: 100 });
    expect(rows[1]).toMatchObject({ A: 200, B: 50 });
  });

  it('merges on timestamp so offset series do not misalign', () => {
    const rows = toComparisonData([series('A', [10, 20], [1, 3]), series('B', [10, 15], [2, 3])]);
    expect(rows).toEqual([
      { t: 1, A: 100 },
      { t: 2, B: 100 },
      { t: 3, A: 200, B: 150 },
    ]);
  });

  it('skips empty and zero-based series and handles no input', () => {
    expect(toComparisonData([])).toEqual([]);
    expect(toComparisonData([series('A', []), series('B', [0, 5])])).toEqual([]);
  });
});

describe('rankByChange', () => {
  it('ranks by change descending', () => {
    const ranked = rankByChange([series('A', [100, 101]), series('B', [100, 120]), series('C', [100, 90])]);
    expect(ranked).toEqual([
      { symbol: 'B', pct: 20 },
      { symbol: 'A', pct: 1 },
      { symbol: 'C', pct: -10 },
    ]);
  });
});

describe('seriesStats', () => {
  it('summarizes high, low, last and change', () => {
    expect(seriesStats(series('A', [10, 30, 20]))).toEqual({
      symbol: 'A',
      pct: 100,
      high: 30,
      low: 10,
      last: 20,
    });
  });

  it('returns undefined for an empty series', () => {
    expect(seriesStats(series('A', []))).toBeUndefined();
  });
});

describe('focusVsPeers', () => {
  const ranked = [
    { symbol: 'MSFT', pct: 6 },
    { symbol: 'IBM', pct: 2 },
    { symbol: 'ORCL', pct: -2 },
    { symbol: 'SAP', pct: -4 },
  ];

  it('reports rank, peer average and gap', () => {
    expect(focusVsPeers(ranked, 'IBM')).toEqual({
      symbol: 'IBM',
      pct: 2,
      rank: 2,
      total: 4,
      peerAverage: 0,
      delta: 2,
    });
  });

  it('omits peer figures when the focus is alone', () => {
    expect(focusVsPeers([{ symbol: 'IBM', pct: 1 }], 'IBM')).toEqual({
      symbol: 'IBM',
      pct: 1,
      rank: 1,
      total: 1,
    });
  });

  it('returns undefined when the focus company has no data', () => {
    expect(focusVsPeers([{ symbol: 'MSFT', pct: 1 }], 'IBM')).toBeUndefined();
  });
});
