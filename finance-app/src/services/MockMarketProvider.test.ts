import { describe, expect, it } from 'vitest';
import { COMPANY_SYMBOLS } from '../config/companies';
import { MarketError } from './errors';
import { MockMarketProvider } from './MockMarketProvider';

const provider = new MockMarketProvider(() => 1_700_000_000_000);

describe('MockMarketProvider', () => {
  it('returns a quote for every tracked company', async () => {
    const quotes = await provider.getQuotes(COMPANY_SYMBOLS);
    expect(quotes.map((q) => q.symbol)).toEqual([...COMPANY_SYMBOLS]);
  });

  it('is deterministic per symbol and window', async () => {
    const a = await provider.getHistory('IBM', 'week');
    const b = await provider.getHistory('IBM', 'week');
    expect(a).toEqual(b);
    expect(a.points.length).toBeGreaterThan(1);
  });

  it('limits the day window to a single trading session of 5-minute bars', async () => {
    const { points } = await provider.getHistory('IBM', 'day');
    const spanHours = (points[points.length - 1].t - points[0].t) / 3_600_000;
    expect(spanHours).toBeLessThanOrEqual(6.5);
    expect(points[1].t - points[0].t).toBe(5 * 60 * 1000);
  });

  it('rejects unknown symbols with INVALID_SYMBOL', async () => {
    await expect(provider.getHistory('NOPE', 'day')).rejects.toBeInstanceOf(MarketError);
    await expect(provider.getHistory('NOPE', 'day')).rejects.toMatchObject({ code: 'INVALID_SYMBOL' });
  });
});
