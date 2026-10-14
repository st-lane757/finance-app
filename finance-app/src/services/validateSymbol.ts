/** Shared symbol validation rule used by both the client picker and the server proxy. */
export const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.-]{0,9}$/;

/**
 * Returns an error message string when the symbol is invalid, or `null` when it is fine.
 * Normalises to upper-case before checking so "aapl" is accepted.
 */
export function validateSymbol(raw: string): string | null {
  const trimmed = raw.trim().toUpperCase();
  if (trimmed === '') return 'Please enter a ticker symbol.';
  if (!SYMBOL_PATTERN.test(trimmed)) {
    return 'Symbols are 1–10 letters, digits, "." or "-" (e.g. IBM, BRK.B).';
  }
  return null;
}

/** Returns the upper-cased symbol, or throws if invalid. */
export function normalizeSymbol(raw: string): string {
  const error = validateSymbol(raw);
  if (error) throw new Error(error);
  return raw.trim().toUpperCase();
}
