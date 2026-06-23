'use client';

import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJIS = [
  '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂',
  '😉', '😌', '😍', '🥰', '😘', '😗', '😋', '😛', '😜', '🤪',
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '😐', '😑', '😶',
  '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷',
  '🤒', '🤕', '🤢', '🤮', '🥴', '😵', '🤯', '🤠', '🥳', '🥸',
  '👍', '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲',
  '🤝', '🙏', '✌️', '🤟', '🤘', '👌', '✋', '🤚', '💪', '🦶',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '🔥', '✨', '⭐', '🌟', '💡', '📝', '✅', '❌', '❗', '❓',
  '🎉', '🎊', '🎈', '🎁', '🏆', '🚀', '💯', '🔔', '🔕', '♻️',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '6px 7px', border: 'none', background: open ? '#fff7ed' : 'transparent',
          color: '#78716c', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0,
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title="Insert emoji"
      >
        <Smile size={16} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: '4px', zIndex: 30,
            background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '6px',
            width: '300px', display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '2px',
          }}>
            {EMOJIS.map((emoji, i) => (
              <button
                key={i} onClick={() => { onSelect(emoji); setOpen(false); }}
                style={{
                  width: '26px', height: '26px', borderRadius: '4px', border: 'none',
                  background: 'none', cursor: 'pointer', fontSize: '16px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                {emoji}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
