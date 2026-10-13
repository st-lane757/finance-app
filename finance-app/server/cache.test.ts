// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { TtlCache } from './cache';

describe('TtlCache', () => {
  it('serves cached values until the TTL expires', async () => {
    let time = 0;
    const cache = new TtlCache(() => time);
    const load = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');

    expect(await cache.get('k', 100, load)).toBe('a');
    time = 50;
    expect(await cache.get('k', 100, load)).toBe('a');
    time = 150;
    expect(await cache.get('k', 100, load)).toBe('b');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('serves a stale value when the loader fails after expiry', async () => {
    let time = 0;
    const cache = new TtlCache(() => time);
    await cache.get('k', 10, async () => 'fresh');
    time = 100;
    expect(await cache.get('k', 10, () => Promise.reject(new Error('down')))).toBe('fresh');
  });

  it('propagates the error when nothing is cached', async () => {
    const cache = new TtlCache();
    await expect(cache.get('k', 10, () => Promise.reject(new Error('down')))).rejects.toThrow('down');
  });
});
