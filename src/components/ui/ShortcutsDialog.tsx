'use client';

import { useState, useEffect } from 'react';
import { X, Command } from 'lucide-react';

const shortcuts = [
  { category: 'Editor', items: [
    { keys: ['Ctrl', 'B'], desc: 'Bold' },
    { keys: ['Ctrl', 'I'], desc: 'Italic' },
    { keys: ['Ctrl', 'U'], desc: 'Underline' },
    { keys: ['Ctrl', 'S'], desc: 'Save document' },
    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
    { keys: ['Ctrl', 'Y'], desc: 'Redo' },
    { keys: ['Ctrl', 'F'], desc: 'Find & Replace' },
  ]},
  { category: 'Navigation', items: [
    { keys: ['Ctrl', 'K'], desc: 'Add link' },
    { keys: ['?'], desc: 'Show shortcuts' },
  ]},
];

export function ShortcutsDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        if (!activeElement || activeElement === document.body || (activeElement as HTMLElement).isContentEditable === false) {
          e.preventDefault();
          setIsOpen(prev => !prev);
        }
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e7e5e4', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: '1.5px solid #e7e5e4' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Command size={18} color="#f97316" />
            <h2 style={{ fontWeight: 600, fontSize: '16px' }}>Keyboard Shortcuts</h2>
          </div>
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '4px' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px', maxHeight: '60vh', overflow: 'auto' }}>
          {shortcuts.map((group) => (
            <div key={group.category} style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: 600, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>{group.category}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {group.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <span style={{ fontSize: '13px', color: '#44403c' }}>{item.desc}</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {item.keys.map((key, j) => (
                        <kbd key={j} style={{ background: '#f5f5f4', border: '1px solid #e7e5e4', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontFamily: 'monospace', color: '#78716c' }}>{key}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
