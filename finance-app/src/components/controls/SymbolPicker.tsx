import { type FormEvent, useId, useRef, useState } from 'react';
import { normalizeSymbol, validateSymbol } from '../../services/validateSymbol';

interface Props {
  /** Called with the normalised upper-case symbol when the form is submitted successfully. */
  onSelect: (symbol: string) => void;
}

export function SymbolPicker({ onSelect }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const err = validateSymbol(value);
    if (err) {
      setError(err);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    onSelect(normalizeSymbol(value));
  }

  function handleChange(v: string) {
    setValue(v);
    if (error) setError(validateSymbol(v));
  }

  return (
    <form className="symbol-picker" onSubmit={handleSubmit} noValidate aria-label="Add company chart">
      <label htmlFor={inputId} className="symbol-picker__label">
        Add a company chart
      </label>
      <div className="symbol-picker__row">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="e.g. AAPL"
          aria-describedby={error ? errorId : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={`symbol-picker__input${error ? ' invalid' : ''}`}
          maxLength={12}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <button type="submit" className="symbol-picker__btn">
          Add chart
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="symbol-picker__error">
          {error}
        </p>
      )}
    </form>
  );
}
