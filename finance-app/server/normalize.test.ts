// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { normalizeHistory, normalizeQuote } from './normalize';

describe('normalizeQuote', () => {
  it('maps a full payload and prefers configured company names', () => {
    const quote = normalizeQuote('IBM', {
      regularMarketPrice: 230.456,
      regularMarketChange: 1.234,
      regularMarketChangePercent: 0.5391,
      currency: 'USD',
      shortName: 'INTL BUSINESS MACHINES',
      regularMarketTime: new Date(1_700_000_000_000),
    });
    expect(quote).toEqual({
      symbol: 'IBM',
      name: 'IBM',
      price: 230.46,
      change: 1.23,
      changePct: 0.54,
      currency: 'USD',
      asOf: 1_700_000_000_000,
    });
  });

  it('defaults missing change fields to 0 and uses provider name for unknown symbols', () => {
    const quote = normalizeQuote('XYZ', { regularMarketPrice: 10, shortName: 'XYZ Corp' });
    expect(quote).toMatchObject({ name: 'XYZ Corp', change: 0, changePct: 0, currency: 'USD' });
  });

  it('throws 404 for missing payload and 502 when no price exists', () => {
    expect(() => normalizeQuote('XYZ', undefined)).toThrowError(expect.objectContaining({ status: 404 }));
    expect(() => normalizeQuote('XYZ', {})).toThrowError(expect.objectContaining({ status: 502 }));
  });
});

describe('normalizeHistory', () => {
  it('drops null closes, sorts by time and rounds', () => {
    const series = normalizeHistory('IBM', 'week', [
      { date: new Date(3000), close: 3.456 },
      { date: new Date(1000), close: 1 },
      { date: new Date(2000), close: null },
      { date: 'not a date', close: 5 },
    ]);
    expect(series.points).toEqual([
      { t: 1000, close: 1 },
      { t: 3000, close: 3.46 },
    ]);
  });

  it('keeps only the latest session for the day window', () => {
    const hour = 60 * 60 * 1000;
    const series = normalizeHistory('IBM', 'day', [
      { date: new Date(0), close: 1 },
      { date: new Date(30 * hour), close: 2 },
      { date: new Date(31 * hour), close: 3 },
    ]);
    expect(series.points.map((p) => p.close)).toEqual([2, 3]);
  });

  it('returns an empty series for empty input', () => {
    expect(normalizeHistory('IBM', 'day', []).points).toEqual([]);
  });
});
