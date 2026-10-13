import { TIME_WINDOWS } from '../src/config/timeWindows';
import type { TimeWindow } from '../src/domain/types';
import { HttpError } from './errors';

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,9}$/;
export const MAX_SYMBOLS = 10;

export function parseSymbol(raw: unknown): string {
  const symbol = typeof raw === 'string' ? raw.trim().toUpperCase() : '';
  if (!SYMBOL_PATTERN.test(symbol)) {
    throw new HttpError(400, 'INVALID_SYMBOL', 'Symbol must be 1-10 letters, digits, "." or "-"');
  }
  return symbol;
}

export function parseSymbols(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.trim() === '') {
    throw new HttpError(400, 'INVALID_REQUEST', 'Query parameter "symbols" is required');
  }
  const symbols = [...new Set(raw.split(',').map(parseSymbol))];
  if (symbols.length > MAX_SYMBOLS) {
    throw new HttpError(400, 'INVALID_REQUEST', `At most ${MAX_SYMBOLS} symbols are allowed`);
  }
  return symbols;
}

export function parseWindow(raw: unknown): TimeWindow {
  const found = TIME_WINDOWS.find((w) => w.id === raw);
  if (!found) {
    const allowed = TIME_WINDOWS.map((w) => w.id).join(', ');
    throw new HttpError(400, 'INVALID_REQUEST', `Query parameter "window" must be one of: ${allowed}`);
  }
  return found.id;
}
