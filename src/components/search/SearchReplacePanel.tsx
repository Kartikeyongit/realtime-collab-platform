'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowUp, ArrowDown, Replace, CaseSensitive, WholeWord, Regex } from 'lucide-react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface SearchReplacePanelProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

const searchKey = new PluginKey('search-highlight');

function buildSearchRegex(term: string, caseSensitive: boolean, wholeWord: boolean, regex: boolean): RegExp | null {
  try {
    let pattern = regex ? term : term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  } catch { return null; }
}

export function SearchReplacePanel({ editor, isOpen, onClose, addToast }: SearchReplacePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [results, setResults] = useState<Array<{ from: number; to: number }>>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pluginRef = useRef<Plugin | null>(null);

  const clearDecorations = useCallback(() => {
    if (!editor) return;
    try {
      const tr = editor.state.tr.setMeta(searchKey, DecorationSet.empty);
      editor.view.dispatch(tr);
    } catch {}
  }, [editor]);

  const performSearch = useCallback(() => {
    if (!searchTerm || !editor) {
      setResults([]);
      clearDecorations();
      return;
    }
    const regex = buildSearchRegex(searchTerm, caseSensitive, wholeWord, useRegex);
    if (!regex) { setResults([]); clearDecorations(); return; }
    const positions: Array<{ from: number; to: number }> = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(node.text)) !== null) {
          positions.push({ from: pos + match.index, to: pos + match.index + match[0].length });
          if (!regex.global) break;
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      }
    });
    setResults(positions);
    if (positions.length > 0) {
      setCurrentIndex(0);
      editor
        .chain()
        .setTextSelection({ from: positions[0].from, to: positions[0].to })
        .scrollIntoView()
        .command(({ tr }) => {
          const decorations = positions.map((p, i) =>
            Decoration.inline(p.from, p.to, {
              class: i === 0 ? 'search-match search-match-active' : 'search-match',
            })
          );
          tr.setMeta(searchKey, DecorationSet.create(tr.doc, decorations));
          return true;
        })
        .run();
    } else {
      clearDecorations();
    }
  }, [searchTerm, caseSensitive, wholeWord, useRegex, editor, clearDecorations]);

  useEffect(() => { const t = setTimeout(performSearch, 200); return () => clearTimeout(t); }, [performSearch]);

  useEffect(() => {
    if (!editor || !isOpen) return;
    if (!pluginRef.current) {
      const plugin = new Plugin({
        key: searchKey,
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, set) {
            const meta = tr.getMeta(searchKey);
            return meta !== undefined ? meta : set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) { return searchKey.getState(state); },
        },
      });
      pluginRef.current = plugin;
      editor.registerPlugin(plugin);
    }
    return () => {
      clearDecorations();
      if (pluginRef.current) {
        try { editor.unregisterPlugin(searchKey); } catch {}
        pluginRef.current = null;
      }
    };
  }, [editor, isOpen, clearDecorations]);

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('');
      setReplaceTerm('');
      setResults([]);
      setCurrentIndex(0);
      setCaseSensitive(false);
      setWholeWord(false);
      setUseRegex(false);
      clearDecorations();
    }
  }, [isOpen, clearDecorations]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) searchInputRef.current.focus();
  }, [isOpen]);

  const navigate = (dir: 'next' | 'prev') => {
    if (!results.length || !editor) return;
    const idx = dir === 'next'
      ? (currentIndex + 1) % results.length
      : (currentIndex - 1 + results.length) % results.length;
    setCurrentIndex(idx);
    const r = results[idx];
    editor
      .chain()
      .focus()
      .setTextSelection({ from: r.from, to: r.to })
      .scrollIntoView()
      .command(({ tr }) => {
        const decorations = results.map((p, i) =>
          Decoration.inline(p.from, p.to, {
            class: i === idx ? 'search-match search-match-active' : 'search-match',
          })
        );
        tr.setMeta(searchKey, DecorationSet.create(tr.doc, decorations));
        return true;
      })
      .run();
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
    clearDecorations();
  };

  if (!isOpen) return null;

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    background: active ? '#fff7ed' : 'transparent',
    border: `1px solid ${active ? '#fed7aa' : '#e7e5e4'}`,
    color: active ? '#f97316' : '#78716c',
    borderRadius: 6,
    padding: '5px 6px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    lineHeight: 1,
  });

  return (
    <div
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      style={{
        position: 'fixed', top: '72px', right: '20px', width: '360px',
        background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '16px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)', zIndex: 40, overflow: 'hidden',
      }}
    >
      <style>{`
        .search-match { background: #fef08a; border-radius: 2px; }
        .search-match-active { background: #fde047; box-shadow: 0 0 0 1.5px #eab308; }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1.5px solid #e7e5e4', background: '#fafaf9' }}>
        <h3 style={{ fontWeight: 600, fontSize: '14px' }}>Find & Replace</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '4px' }}><X size={16} /></button>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(e.shiftKey ? 'prev' : 'next'); }}
            placeholder="Find..."
            className="input"
            style={{ paddingLeft: '36px', paddingRight: '80px' }}
          />
          {results.length > 0 && (
            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#a8a29e', minWidth: '32px', textAlign: 'center' }}>{currentIndex + 1}/{results.length}</span>
              <button onClick={() => navigate('prev')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#78716c' }}><ArrowUp size={13} /></button>
              <button onClick={() => navigate('next')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#78716c' }}><ArrowDown size={13} /></button>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setCaseSensitive(!caseSensitive)} style={toggleStyle(caseSensitive)} title="Case-sensitive">
            <CaseSensitive size={15} />
          </button>
          <button onClick={() => setWholeWord(!wholeWord)} style={toggleStyle(wholeWord)} title="Whole word">
            <WholeWord size={15} />
          </button>
          <button onClick={() => setUseRegex(!useRegex)} style={toggleStyle(useRegex)} title="Regex">
            <Regex size={15} />
          </button>
        </div>

        <div style={{ position: 'relative' }}>
          <Replace size={14} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') replaceOne(); }}
            placeholder="Replace with..."
            className="input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={replaceOne} disabled={!results.length} className="btn btn-primary btn-sm" style={{ flex: 1 }}>Replace</button>
          <button onClick={replaceAll} disabled={!results.length} className="btn btn-danger btn-sm" style={{ flex: 1 }}>Replace All</button>
        </div>

        {searchTerm && (
          <p style={{ textAlign: 'center', fontSize: '12px', color: '#a8a29e' }}>
            {results.length ? `${results.length} matches` : 'No matches'}
          </p>
        )}
      </div>
    </div>
  );
}
