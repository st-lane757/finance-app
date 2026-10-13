export type MarketErrorCode = 'NETWORK' | 'INVALID_SYMBOL' | 'UPSTREAM' | 'UNKNOWN';

export class MarketError extends Error {
  readonly code: MarketErrorCode;

  constructor(code: MarketErrorCode, message: string) {
    super(message);
    this.name = 'MarketError';
    this.code = code;
  }
}

export function toMarketError(error: unknown): MarketError {
  if (error instanceof MarketError) return error;
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return new MarketError('UNKNOWN', message);
}
