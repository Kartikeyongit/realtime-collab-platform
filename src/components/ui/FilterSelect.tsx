'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterOption {
  value: string;
  label: string;
}

/**
 * Custom dropdown replacing native <select> on the dashboard.
 * A native select's OPEN list is drawn by the OS and cannot be styled —
 * this renders button + list ourselves so open/closed both match the app.
 */
export function FilterSelect({
  value,
  options,
  onChange,
  maxWidth,
  ariaLabel,
  size = 'md',
}: {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  maxWidth?: number;
  ariaLabel?: string;
  size?: 'md' | 'sm';
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];
  const btnHeight = size === 'sm' ? 30 : 38;
  const fontSize = size === 'sm' ? 12 : 14;

  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, options.findIndex((o) => o.value === value)));
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, options, value]);

  return (
    <div ref={rootRef} style={{ position: 'relative', maxWidth, flex: '0 1 auto' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="dash-filter"
        style={{
          height: btnHeight,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          padding: size === 'sm' ? '0 8px 0 10px' : '0 10px 0 12px',
          fontSize,
          color: '#44403c',
          background: open ? '#fff7ed' : 'white',
          border: open ? '1.5px solid #f97316' : '1.5px solid #e7e5e4',
          borderRadius: 10,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: open ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'left' }}>
          {selected?.label}
        </span>
        <ChevronDown
          size={15}
          color={open ? '#f97316' : '#a8a29e'}
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: '100%',
            width: 'max-content',
            maxWidth: 'min(260px, calc(100vw - 48px))',
            maxHeight: 280,
            overflowY: 'auto',
            background: 'white',
            border: '1.5px solid #e7e5e4',
            borderRadius: 16,
            boxShadow: '0 16px 40px rgba(28,25,23,0.12), 0 2px 8px rgba(28,25,23,0.06)',
            padding: 6,
            zIndex: 50,
            animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {options.map((opt, i) => {
            const isSel = opt.value === value;
            const isActive = i === active;
            return (
              <button
                key={opt.value + opt.label}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  padding: size === 'sm' ? '7px 10px' : '9px 12px',
                  fontSize,
                  fontWeight: isSel ? 600 : 400,
                  color: isSel ? '#c2410c' : '#44403c',
                  background: isSel ? '#fff7ed' : isActive ? '#fafaf9' : 'white',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
