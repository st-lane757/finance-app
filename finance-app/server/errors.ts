export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: 'INVALID_SYMBOL' | 'INVALID_REQUEST' | 'UPSTREAM',
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/** Maps an unknown error from the Yahoo client to a client-safe HttpError. */
export function mapUpstreamError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  const message = error instanceof Error ? error.message : '';
  if (/not found|no data found|delisted/i.test(message)) {
    return new HttpError(404, 'INVALID_SYMBOL', 'Symbol not found');
  }
  return new HttpError(502, 'UPSTREAM', 'Market data provider is unavailable');
}
