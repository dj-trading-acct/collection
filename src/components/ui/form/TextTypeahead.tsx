import { useState, useRef, useEffect, useMemo, useId } from 'react';
import { inputClass, labelClass } from './styles';

interface TextTypeaheadProps {
  label: string;
  value: string | null;
  onChange: (value: string | null) => void;
  suggestions: string[];
  placeholder?: string;
}

const MAX_SUGGESTIONS = 20;

export function TextTypeahead({
  label,
  value,
  onChange,
  suggestions,
  placeholder,
}: TextTypeaheadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const filtered = useMemo(() => {
    const v = value ?? '';
    return suggestions
      .filter((s) => s.toLowerCase().includes(v.toLowerCase()))
      .slice(0, MAX_SUGGESTIONS);
  }, [value, suggestions]);

  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered]);

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

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filtered[highlightIndex];
      if (selected) {
        onChange(selected);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div ref={containerRef} className="relative">
        <input
          type="text"
          className={inputClass}
          value={value ?? ''}
          onChange={(e) => {
            onChange(e.target.value || null);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && filtered.length > 0}
          aria-controls={listboxId}
          aria-activedescendant={isOpen && filtered.length > 0 ? `${listboxId}-option-${highlightIndex}` : undefined}
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
                  i === highlightIndex ? 'bg-blue-100 text-blue-900' : 'text-gray-900 hover:bg-gray-50'
                }`}
                onMouseEnter={() => setHighlightIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setIsOpen(false);
                }}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
