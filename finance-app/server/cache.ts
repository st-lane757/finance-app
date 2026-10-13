interface Entry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Small in-memory TTL cache. If the loader fails and an expired entry exists,
 * the stale value is served instead of surfacing the error.
 */
export class TtlCache {
  private readonly entries = new Map<string, Entry<unknown>>();

  constructor(private readonly now: () => number = Date.now) {}

  async get<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const hit = this.entries.get(key) as Entry<T> | undefined;
    if (hit && hit.expiresAt > this.now()) return hit.value;
    try {
      const value = await load();
      this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
      return value;
    } catch (error) {
      if (hit) return hit.value;
      throw error;
    }
  }
}
