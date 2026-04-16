import { useState, useRef, useEffect, useId } from 'react';
import { inputClass, labelClass } from './styles';

interface ChipInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  /** If true, forces lowercase and validates tag format */
  tagMode?: boolean;
}

const MAX_SUGGESTIONS = 20;

export function ChipInput({
  label,
  values,
  onChange,
  suggestions,
  placeholder,
  tagMode,
}: ChipInputProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  const filtered = suggestions
    ? suggestions
        .filter(
          (s) =>
            s.toLowerCase().includes(input.toLowerCase()) &&
            !values.includes(s),
        )
        .slice(0, MAX_SUGGESTIONS)
    : [];

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length, input]);

  useEffect(() => {
    if (listRef.current && isOpen) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  function addValue(val: string) {
    const trimmed = tagMode ? val.trim().toLowerCase() : val.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setInput('');
    setIsOpen(false);
  }

  function removeValue(val: string) {
    onChange(values.filter((v) => v !== val));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filtered.length > 0) {
        addValue(filtered[highlightIndex]);
      } else if (input.trim()) {
        addValue(input);
      }
    } else if (e.key === 'Backspace' && !input && values.length > 0) {
      removeValue(values[values.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (isOpen && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
      }
    }
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div ref={containerRef} className="relative">
        <input
          ref={inputRef}
          type="text"
          className={inputClass}
          value={input}
          onChange={(e) => {
            const val = tagMode ? e.target.value.toLowerCase() : e.target.value;
            setInput(val);
            if (suggestions && val) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions && input) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role={suggestions ? 'combobox' : undefined}
          aria-autocomplete={suggestions ? 'list' : undefined}
          aria-expanded={suggestions ? isOpen && filtered.length > 0 : undefined}
          aria-controls={suggestions ? listboxId : undefined}
          aria-activedescendant={
            isOpen && filtered.length > 0
              ? `${listboxId}-option-${highlightIndex}`
              : undefined
          }
        />
        {isOpen && filtered.length > 0 && (
          <ul
            ref={listRef}
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
          >
            {filtered.map((s, i) => (
              <li
                key={s}
                id={`${listboxId}-option-${i}`}
                role="option"
                aria-selected={i === highlightIndex}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === highlightIndex
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  addValue(s);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-xs font-medium text-blue-800"
            >
              {v}
              <button
                type="button"
                className="ml-0.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-blue-200 text-blue-600 hover:text-blue-800"
                onClick={() => removeValue(v)}
                aria-label={`Remove ${v}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
