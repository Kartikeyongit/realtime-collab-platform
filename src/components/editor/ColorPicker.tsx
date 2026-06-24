'use client';

import { useState, useRef, useEffect } from 'react';
import { Palette } from 'lucide-react';

const COLORS = [
  '#DC2626', '#EA580C', '#D97706', '#65A30D', '#16A34A', '#059669',
  '#0D9488', '#0891B2', '#2563EB', '#4F46E5', '#7C3AED', '#9333EA',
  '#C026D3', '#DB2777', '#E11D48', '#78716C', '#57534E', '#1C1917',
  '#FEE2E2', '#FFEDD5', '#FEF3C7', '#ECFCCB', '#DCFCE7', '#D1FAE5',
  '#CCFBF1', '#CFFAFE', '#DBEAFE', '#E0E7FF', '#EDE9FE', '#F3E8FF',
  '#FAE8FF', '#FCE7F3', '#FFE4E6', '#F5F5F4', '#E7E5E4', '#FFFFFF',
];

interface ColorPickerProps {
  currentColor?: string;
  onColorChange: (color: string) => void;
  onRemoveColor?: () => void;
}

export function ColorPicker({ currentColor, onColorChange, onRemoveColor }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.left;
      const popoverWidth = 184;
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left,
        zIndex: 30,
        background: 'white',
        border: '1.5px solid #e7e5e4',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '8px',
        width: '184px',
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '3px',
      });
    }
    setOpen(true);
  };

  return (
    <div style={{ display: 'inline-flex', position: 'static' }}>
      <button
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openPopover()}
        onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
        style={{
          padding: '6px 7px', border: 'none', background: open ? '#fff7ed' : 'transparent',
          color: '#78716c', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px', flexShrink: 0,
          outline: 'none',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title="Text color"
      >
        <Palette size={16} />
        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: currentColor || 'transparent', border: '1px solid #e7e5e4', display: 'inline-block' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpen(false)} />
          <div ref={popoverRef} style={popoverStyle}>
            {onRemoveColor && (
              <button
                onClick={() => { onRemoveColor(); setOpen(false); }}
                style={{ gridColumn: 'span 6', fontSize: '11px', padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#78716c', borderRadius: '6px', marginBottom: '2px' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                Remove color
              </button>
            )}
            {COLORS.map(c => (
              <button
                key={c} onClick={() => { onColorChange(c); setOpen(false); }}
                style={{
                  width: '26px', height: '26px', borderRadius: '6px', border: c === '#FFFFFF' ? '1.5px solid #e7e5e4' : 'none',
                  background: c, cursor: 'pointer', outline: currentColor === c ? '2px solid #f97316' : 'none',
                  outlineOffset: '1px',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
