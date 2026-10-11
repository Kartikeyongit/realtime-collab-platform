'use client';

import { useRef, useState } from 'react';

export interface MentionPerson {
  id: string;
  name: string | null;
}

/** Find an `@query` token ending at the caret (null when absent). */
function tokenAtCaret(value: string, caret: number): { start: number; query: string } | null {
  const before = value.slice(0, caret);
  const m = /@([A-Za-z0-9_. -]*)$/.exec(before);
  if (!m) return null;
  // Ignore email addresses: letter directly before @
  const at = caret - m[0].length;
  if (at > 0 && /[A-Za-z0-9_.]/.test(value[at - 1])) return null;
  return { start: at, query: m[1] };
}

/**
 * Single-line input with @-mention autocomplete over doc people.
 * Enter submits (when no suggestion is being picked), Esc closes the list.
 */
export function MentionInput({
  value,
  onChange,
  onSubmit,
  people,
  placeholder,
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  people: MentionPerson[];
  placeholder?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const caretToken = (): { start: number; query: string } | null => {
    const el = inputRef.current;
    if (!el) return null;
    return tokenAtCaret(value, el.selectionStart ?? value.length);
  };

  const matches = (() => {
    const t = caretToken();
    if (!t) return [];
    const q = t.query.toLowerCase();
    return people
      .filter((p) => p.name && p.name.toLowerCase().includes(q))
      .slice(0, 6);
  })();

  const dropdownOpen = open && matches.length > 0;

  const pick = (name: string) => {
    const el = inputRef.current;
    const t = caretToken();
    if (!el || !t) return;
    const next = value.slice(0, t.start) + `@${name} ` + value.slice(el.selectionStart ?? value.length);
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      const pos = t.start + name.length + 2;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (dropdownOpen) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % matches.length);
              return;
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a - 1 + matches.length) % matches.length);
              return;
            }
            if (e.key === 'Enter' && matches[active]) {
              e.preventDefault();
              pick(matches[active].name!);
              return;
            }
            if (e.key === 'Escape') {
              e.preventDefault();
              setOpen(false);
              return;
            }
          }
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            setOpen(false);
            onSubmit();
          }
        }}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        className="input"
        style={style}
      />
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
            left: 0,
            minWidth: 190,
            maxWidth: 250,
            background: 'white',
            border: '1.5px solid #e7e5e4',
            borderRadius: 12,
            boxShadow: '0 12px 32px rgba(28,25,23,0.12)',
            padding: 4,
            zIndex: 40,
          }}
        >
          {matches.map((p, i) => (
            <button
              key={p.id}
              onMouseDown={(e) => {
                e.preventDefault();
                pick(p.name!);
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '7px 10px',
                border: 'none',
                borderRadius: 8,
                background: i === active ? '#fff7ed' : 'transparent',
                cursor: 'pointer',
                fontSize: 13,
                color: '#292524',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: '#fed7aa',
                  color: '#c2410c',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {p.name!.charAt(0).toUpperCase()}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
