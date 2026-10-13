// @vitest-environment node
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from './app';
import type { YahooSource } from './yahooClient';

function fakeSource(overrides: Partial<YahooSource> = {}): YahooSource {
  return {
    quote: vi.fn(async (symbol: string) =>
      symbol === 'BAD'
        ? Promise.reject(new Error('Quote not found for symbol: BAD'))
        : { regularMarketPrice: 100, regularMarketChange: 1, regularMarketChangePercent: 1 },
    ),
    chart: vi.fn(async () => [
      { date: new Date(1000), close: 10 },
      { date: new Date(2000), close: 11 },
    ]),
    ...overrides,
  };
}

describe('GET /api/quotes', () => {
  it('returns normalized quotes and tolerates one failing symbol', async () => {
    const res = await request(createApp(fakeSource())).get('/api/quotes?symbols=ibm,BAD');
    expect(res.status).toBe(200);
    expect(res.body.quotes).toHaveLength(1);
    expect(res.body.quotes[0]).toMatchObject({ symbol: 'IBM', price: 100 });
  });

  it('returns 404 INVALID_SYMBOL when every symbol fails with not-found', async () => {
    const res = await request(createApp(fakeSource())).get('/api/quotes?symbols=BAD');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('INVALID_SYMBOL');
  });

  it('rejects missing, malformed and excessive symbols with 400', async () => {
    const app = createApp(fakeSource());
    expect((await request(app).get('/api/quotes')).status).toBe(400);
    expect((await request(app).get('/api/quotes?symbols=IBM,$$$')).status).toBe(400);
    const many = Array.from({ length: 11 }, (_, i) => `S${i}`).join(',');
    expect((await request(app).get(`/api/quotes?symbols=${many}`)).status).toBe(400);
  });

  it('returns 502 UPSTREAM for unexpected provider failures', async () => {
    const source = fakeSource({ quote: vi.fn().mockRejectedValue(new Error('socket hang up')) });
    const res = await request(createApp(source)).get('/api/quotes?symbols=IBM');
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('UPSTREAM');
  });

  it('caches repeated requests', async () => {
    const source = fakeSource();
    const app = createApp(source);
    await request(app).get('/api/quotes?symbols=IBM');
    await request(app).get('/api/quotes?symbols=IBM');
    expect(source.quote).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/history', () => {
  it('returns a normalized series', async () => {
    const res = await request(createApp(fakeSource())).get('/api/history?symbol=IBM&window=week');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ symbol: 'IBM', window: 'week' });
    expect(res.body.points).toEqual([
      { t: 1000, close: 10 },
      { t: 2000, close: 11 },
    ]);
  });

  it('validates symbol and window', async () => {
    const app = createApp(fakeSource());
    expect((await request(app).get('/api/history?symbol=IBM&window=year')).status).toBe(400);
    expect((await request(app).get('/api/history?symbol=&window=day')).status).toBe(400);
  });

  it('maps provider not-found errors to 404', async () => {
    const source = fakeSource({ chart: vi.fn().mockRejectedValue(new Error('No data found, symbol may be delisted')) });
    const res = await request(createApp(source)).get('/api/history?symbol=ZZZZ&window=day');
    expect(res.status).toBe(404);
  });
});

describe('unknown routes', () => {
  it('returns a JSON 404 under /api', async () => {
    const res = await request(createApp(fakeSource())).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Unknown endpoint');
  });
});
