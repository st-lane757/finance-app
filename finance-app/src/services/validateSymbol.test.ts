import { describe, expect, it } from 'vitest';
import { normalizeSymbol, validateSymbol } from './validateSymbol';

describe('validateSymbol', () => {
  it('returns null for valid symbols', () => {
    expect(validateSymbol('IBM')).toBeNull();
    expect(validateSymbol('BRK.B')).toBeNull();
    expect(validateSymbol('0700.HK')).toBeNull();
    expect(validateSymbol('A')).toBeNull();
  });

  it('accepts and normalises lower-case input', () => {
    expect(validateSymbol('aapl')).toBeNull();
    expect(normalizeSymbol('aapl')).toBe('AAPL');
  });

  it('rejects empty and whitespace-only strings', () => {
    expect(validateSymbol('')).not.toBeNull();
    expect(validateSymbol('   ')).not.toBeNull();
  });

  it('rejects symbols that are too long or contain invalid characters', () => {
    expect(validateSymbol('TOOLONGSYMBOL')).not.toBeNull();
    expect(validateSymbol('IBM!')).not.toBeNull();
    expect(validateSymbol('IBM MSFT')).not.toBeNull();
  });

  it('normalizeSymbol throws for invalid input', () => {
    expect(() => normalizeSymbol('')).toThrow();
    expect(() => normalizeSymbol('!!')).toThrow();
  });
});
