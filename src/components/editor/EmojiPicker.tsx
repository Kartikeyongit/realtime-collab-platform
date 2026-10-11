'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Smile, Search, Clock } from 'lucide-react';
import {
  EMOJI_CATEGORIES,
  getRecentEmojis,
  recordRecentEmoji,
  searchEmojis,
  type EmojiEntry,
} from './emojiData';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(EMOJI_CATEGORIES[0].id);
  const [recents, setRecents] = useState<EmojiEntry[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({ display: 'none' });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPopover = () => {
    setRecents(getRecentEmojis());
    setQuery('');
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // border-box: declared width includes padding+border so clamp math holds.
      const popoverWidth = Math.min(320, window.innerWidth - 16);
      setPopoverStyle({
        position: 'fixed',
        top: Math.min(rect.bottom + 6, Math.max(8, window.innerHeight - 380)),
        left: Math.max(8, Math.min(rect.left, window.innerWidth - popoverWidth - 8)),
        zIndex: 30,
        background: 'white',
        border: '1.5px solid #e7e5e4',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(28,25,23,0.12)',
        padding: '10px',
        width: popoverWidth + 'px',
        maxWidth: 'calc(100vw - 16px)',
        boxSizing: 'border-box',
      });
    }
    setOpen(true);
    setTimeout(() => searchRef.current?.focus(), 30);
  };

  const pick = (char: string) => {
    recordRecentEmoji(char);
    onSelect(char);
    setOpen(false);
  };

  const trimmed = query.trim();
  const results = useMemo(
    () => (trimmed ? searchEmojis(trimmed, 48) : null),
    [trimmed]
  );
  const activeCategory = EMOJI_CATEGORIES.find((c) => c.id === category) ?? EMOJI_CATEGORIES[0];

  const grid = (list: EmojiEntry[]) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
        gap: '2px',
      }}
    >
      {list.map((emoji) => (
        <button
          key={emoji.char + emoji.name}
          onClick={() => pick(emoji.char)}
          title={`:${emoji.name}:`}
          style={{
            width: '100%', aspectRatio: '1', borderRadius: '8px', border: 'none',
            background: 'none', cursor: 'pointer', fontSize: '19px', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = '#fff7ed'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
        >
          {emoji.char}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ display: 'inline-flex', position: 'static' }}>
      <button
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openPopover()}
        onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
        style={{
          padding: '6px 7px', border: 'none', background: open ? '#fff7ed' : 'transparent',
          color: open ? '#f97316' : '#78716c', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
          outline: 'none',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title="Insert emoji (or type :name:)"
      >
        <Smile size={16} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpen(false)} />
          <div ref={popoverRef} style={popoverStyle}>
            <div style={{ position: 'relative', marginBottom: 8 }}>
              <Search size={14} color="#a8a29e" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search emoji…"
                className="input"
                style={{ paddingLeft: '32px', fontSize: '13px' }}
              />
            </div>

            {trimmed ? (
              <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                {results && results.length > 0 ? grid(results) : (
                  <div style={{ padding: 16, fontSize: 13, color: '#a8a29e', textAlign: 'center' }}>
                    No emoji for “{trimmed}”
                  </div>
                )}
              </div>
            ) : (
              <>
                {recents.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> Recent
                    </div>
                    {grid(recents.slice(0, 8))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 2, marginBottom: 8, borderBottom: '1.5px solid #f5f5f4', paddingBottom: 6 }}>
                  {EMOJI_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setCategory(c.id)}
                      title={c.label}
                      style={{
                        flex: 1, border: 'none', cursor: 'pointer', fontSize: 17, padding: '5px 0',
                        borderRadius: 8, background: category === c.id ? '#fff7ed' : 'transparent',
                        outline: category === c.id ? '1.5px solid #fed7aa' : 'none', outlineOffset: -1,
                      }}
                    >
                      {c.icon}
                    </button>
                  ))}
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {grid(activeCategory.emojis)}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
