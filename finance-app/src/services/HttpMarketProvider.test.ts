import { describe, expect, it, vi } from 'vitest';
import { HttpMarketProvider } from './HttpMarketProvider';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('HttpMarketProvider', () => {
  it('requests quotes and unwraps the payload', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ quotes: [{ symbol: 'IBM' }] }));
    const provider = new HttpMarketProvider('http://x', fetchFn);

    const quotes = await provider.getQuotes(['IBM', 'MSFT']);

    expect(quotes).toEqual([{ symbol: 'IBM' }]);
    expect(fetchFn.mock.calls[0][0]).toBe('http://x/api/quotes?symbols=IBM%2CMSFT');
  });

  it('requests history with symbol and window', async () => {
    const fetchFn = vi.fn().mockResolvedValue(json({ symbol: 'IBM', window: 'day', points: [] }));
    await new HttpMarketProvider('', fetchFn).getHistory('IBM', 'day');
    expect(fetchFn.mock.calls[0][0]).toBe('/api/history?symbol=IBM&window=day');
  });

  it('maps server error codes to MarketError', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValue(json({ error: { code: 'INVALID_SYMBOL', message: 'Symbol not found' } }, 404));
    await expect(new HttpMarketProvider('', fetchFn).getHistory('ZZ', 'day')).rejects.toMatchObject({
      code: 'INVALID_SYMBOL',
      message: 'Symbol not found',
    });
  });

  it('falls back to UPSTREAM for non-JSON error bodies', async () => {
    const fetchFn = vi.fn().mockResolvedValue(new Response('Bad Gateway', { status: 502 }));
    await expect(new HttpMarketProvider('', fetchFn).getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'UPSTREAM',
    });
  });

  it('maps fetch failures to NETWORK', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(new HttpMarketProvider('', fetchFn).getQuotes(['IBM'])).rejects.toMatchObject({
      code: 'NETWORK',
    });
  });
});
