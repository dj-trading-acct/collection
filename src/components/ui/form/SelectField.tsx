import { useCallback, useEffect, useRef, useState } from 'react';
import { assetUrl } from '../../../assetUrl';

function resolveImageUrl(url: string): string {
  // Already-absolute URLs (external sprites, etc.) should not be prefixed
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return assetUrl(url);
}

export interface SelectOption {
  value: string;
  label: string;
  image?: string | null;
}

interface SelectFieldProps {
  label: string;
  required?: boolean;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  imageClassName?: string;
}

import { inputClass, labelClass, errorClass } from './styles';

const hasAnyImages = (options: SelectOption[]) => options.some((o) => o.image);

export function SelectField({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = '-- Select --',
  disabled = false,
  error,
  imageClassName,
}: SelectFieldProps) {
  const showImages = hasAnyImages(options);

  // For options without images, use a native select for simplicity
  if (!showImages) {
    return (
      <div>
        <label className={labelClass}>
          {label}
          {required && <span className="text-red-500"> *</span>}
        </label>
        <select
          className={inputClass + ' disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        >
          <option value="">{placeholder}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className={errorClass}>{error}</p>}
      </div>
    );
  }

  // Custom dropdown for options with images
  return (
    <div>
      <label className={labelClass}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <ImageSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        imageClassName={imageClassName}
      />
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}

function ImageSelect({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  imageClassName,
}: {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
  imageClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);
  const focusSourceRef = useRef<'keyboard' | 'mouse'>('keyboard');
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef('');
  const typeaheadTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const selected = options.find((o) => o.value === value);

  const close = useCallback(() => {
    setOpen(false);
    setFocusIndex(-1);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  // Scroll focused item into view (only for keyboard-driven focus changes)
  useEffect(() => {
    if (!open || focusIndex < 0 || !listRef.current) return;
    if (focusSourceRef.current !== 'keyboard') return;
    const items = listRef.current.children;
    // +1 to skip the placeholder <li> at index 0
    items[focusIndex + 1]?.scrollIntoView({ block: 'nearest' });
  }, [focusIndex, open]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (disabled) return;
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
        focusSourceRef.current = 'keyboard';
        setFocusIndex(options.findIndex((o) => o.value === value));
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusSourceRef.current = 'keyboard';
        setFocusIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusSourceRef.current = 'keyboard';
        setFocusIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (focusIndex >= 0) {
          onChange(options[focusIndex].value);
        }
        close();
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      default:
        // Type-ahead: match options by typed characters
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          clearTimeout(typeaheadTimerRef.current);
          typeaheadRef.current += e.key.toLowerCase();
          typeaheadTimerRef.current = setTimeout(() => { typeaheadRef.current = ''; }, 500);
          const match = options.findIndex((o) =>
            o.label.toLowerCase().startsWith(typeaheadRef.current),
          );
          if (match >= 0) {
            if (open) {
              focusSourceRef.current = 'keyboard';
              setFocusIndex(match);
            } else {
              onChange(options[match].value);
            }
          }
        }
        break;
    }
  }

  const btnClass = [
    inputClass,
    'relative text-left cursor-pointer pr-8',
    disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : '',
  ].join(' ');

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={btnClass}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="flex items-center gap-2 truncate">
          {selected?.image && (
            <img
              src={resolveImageUrl(selected.image)}
              alt=""
              className={'w-5 h-5 flex-shrink-0' + (imageClassName ? ' ' + imageClassName : '')}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          )}
          <span className={!selected ? 'text-gray-400' : ''}>
            {selected?.label ?? placeholder}
          </span>
        </span>
        {/* Chevron */}
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 20 20" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8l4 4 4-4" />
          </svg>
        </span>
      </button>
      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-none"
        >
          {/* Empty/placeholder option */}
          <li
            role="option"
            aria-selected={!value}
            className={[
              'flex items-center gap-2 cursor-pointer px-3 py-1.5',
              !value ? 'bg-blue-50 text-blue-700' : 'text-gray-400 hover:bg-gray-50',
              focusIndex === -1 ? 'bg-gray-100' : '',
            ].join(' ')}
            onMouseEnter={() => { focusSourceRef.current = 'mouse'; setFocusIndex(-1); }}
            onClick={() => {
              onChange('');
              close();
            }}
          >
            {placeholder}
          </li>
          {options.map((option, i) => {
            const isSelected = option.value === value;
            const isFocused = i === focusIndex;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                className={[
                  'flex items-center gap-2 cursor-pointer px-3 py-1.5',
                  isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-900',
                  isFocused ? 'bg-gray-100' : 'hover:bg-gray-50',
                ].join(' ')}
                onMouseEnter={() => { focusSourceRef.current = 'mouse'; setFocusIndex(i); }}
                onClick={() => {
                  onChange(option.value);
                  close();
                }}
              >
                {option.image && (
                  <img
                    src={resolveImageUrl(option.image)}
                    alt=""
                    className={'w-5 h-5 flex-shrink-0' + (imageClassName ? ' ' + imageClassName : '')}
                          onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                {option.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
