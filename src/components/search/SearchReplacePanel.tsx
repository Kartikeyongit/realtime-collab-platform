'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowUp, ArrowDown, Replace } from 'lucide-react';

interface SearchReplacePanelProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function SearchReplacePanel({ editor, isOpen, onClose, addToast }: SearchReplacePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [results, setResults] = useState<Array<{ from: number; to: number }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isOpen]);
  useEffect(() => { if (!isOpen) { setSearchTerm(''); setReplaceTerm(''); setResults([]); } }, [isOpen]);

  const performSearch = useCallback(() => {
    if (!searchTerm || !editor) { setResults([]); return; }
    const positions: Array<{ from: number; to: number }> = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let idx = node.text.toLowerCase().indexOf(searchTerm.toLowerCase());
        while (idx !== -1) {
          positions.push({ from: pos + idx, to: pos + idx + searchTerm.length });
          idx = node.text.toLowerCase().indexOf(searchTerm.toLowerCase(), idx + 1);
        }
      }
    });
    setResults(positions);
    if (positions.length > 0) { setCurrentIndex(0); scrollTo(positions[0]); }
  }, [searchTerm, editor]);

  useEffect(() => { const t = setTimeout(performSearch, 200); return () => clearTimeout(t); }, [searchTerm, performSearch]);

  const scrollTo = (r: { from: number; to: number }) => {
    if (!editor) return;
    editor.commands.setTextSelection({ from: r.from, to: r.to });
    editor.commands.scrollIntoView();
  };

  const navigate = (dir: 'next' | 'prev') => {
    if (!results.length) return;
    const idx = dir === 'next' ? (currentIndex + 1) % results.length : (currentIndex - 1 + results.length) % results.length;
    setCurrentIndex(idx);
    scrollTo(results[idx]);
  };

  const replaceOne = () => {
    if (!editor || !results.length) return;
    const r = results[currentIndex];
    editor.chain().focus().setTextSelection({ from: r.from, to: r.to }).insertContent(replaceTerm).run();
    setTimeout(performSearch, 100);
  };

  const replaceAll = () => {
    if (!editor || !results.length) return;
    const count = results.length;
    [...results].sort((a, b) => b.from - a.from).forEach(r => {
      editor.chain().focus().setTextSelection({ from: r.from, to: r.to }).insertContent(replaceTerm).run();
    });
    addToast(`Replaced ${count} occurrences`, 'success');
    setResults([]);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: '72px', right: '20px', width: '360px', background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', zIndex: 40, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1.5px solid #e7e5e4', background: '#fafaf9' }}>
        <h3 style={{ fontWeight: 600, fontSize: '14px' }}>Find & Replace</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '4px' }}><X size={16} /></button>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input ref={searchInputRef} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') navigate(e.shiftKey ? 'prev' : 'next'); }} placeholder="Find..." className="input" style={{ paddingLeft: '36px', paddingRight: '80px' }} />
          {results.length > 0 && (
            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#a8a29e', minWidth: '32px', textAlign: 'center' }}>{currentIndex + 1}/{results.length}</span>
              <button onClick={() => navigate('prev')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#78716c' }}><ArrowUp size={13} /></button>
              <button onClick={() => navigate('next')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#78716c' }}><ArrowDown size={13} /></button>
            </div>
          )}
        </div>
        <div style={{ position: 'relative' }}>
          <Replace size={14} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input value={replaceTerm} onChange={(e) => setReplaceTerm(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') replaceOne(); }} placeholder="Replace with..." className="input" style={{ paddingLeft: '36px' }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={replaceOne} disabled={!results.length} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Replace</button>
          <button onClick={replaceAll} disabled={!results.length} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Replace All</button>
        </div>
        {searchTerm && <p style={{ textAlign: 'center', fontSize: '12px', color: '#a8a29e' }}>{results.length ? `${results.length} matches` : 'No matches'}</p>}
      </div>
    </div>
  );
}
