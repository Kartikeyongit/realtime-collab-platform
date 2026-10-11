'use client';

import { Editor } from '@tiptap/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowUp, ArrowDown, Replace, CaseSensitive, WholeWord, Regex, TriangleAlert } from 'lucide-react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface SearchReplacePanelProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface Match {
  from: number;
  to: number;
  snippet: string;
}

const searchKey = new PluginKey('search-highlight');
const MAX_MATCHES = 1000;
const MAX_LIST_ROWS = 200;

export function buildSearchRegex(term: string, caseSensitive: boolean, wholeWord: boolean, regex: boolean): RegExp | null {
  try {
    let pattern = regex ? term : term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (wholeWord) pattern = `\\b${pattern}\\b`;
    return new RegExp(pattern, caseSensitive ? 'g' : 'gi');
  } catch { return null; }
}

export function SearchReplacePanel({ editor, isOpen, onClose, addToast }: SearchReplacePanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [results, setResults] = useState<Match[]>([]);
  const [truncated, setTruncated] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [regexError, setRegexError] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pluginRef = useRef<Plugin | null>(null);

  const clearDecorations = useCallback(() => {
    if (!editor) return;
    try {
      const tr = editor.state.tr.setMeta(searchKey, DecorationSet.empty);
      editor.view.dispatch(tr);
    } catch {}
  }, [editor]);

  // Always computed from the LIVE document in the same tick as use —
  // stored positions go stale the moment anyone (or Yjs) edits.
  const computeMatches = useCallback((): { matches: Match[]; truncated: boolean; invalid: boolean } => {
    const empty = { matches: [] as Match[], truncated: false, invalid: false };
    if (!searchTerm || !editor) return empty;
    const regex = buildSearchRegex(searchTerm, caseSensitive, wholeWord, useRegex);
    if (!regex) return { ...empty, invalid: true };
    const matches: Match[] = [];
    let truncated = false;
    editor.state.doc.descendants((node, pos) => {
      if (matches.length >= MAX_MATCHES) {
        truncated = true;
        return false;
      }
      if (node.isText && node.text) {
        regex.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = regex.exec(node.text)) !== null) {
          if (match[0].length === 0) {
            regex.lastIndex++;
            continue;
          }
          const from = pos + match.index;
          const before = node.text.slice(Math.max(0, match.index - 24), match.index);
          const after = node.text.slice(match.index + match[0].length, match.index + match[0].length + 24);
          matches.push({
            from,
            to: from + match[0].length,
            snippet: `${before}${match[0]}${after}`,
          });
          if (matches.length >= MAX_MATCHES) {
            truncated = true;
            break;
          }
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      }
      return undefined;
    });
    return { matches, truncated, invalid: false };
  }, [searchTerm, caseSensitive, wholeWord, useRegex, editor]);

  const applyDecorations = useCallback((positions: Match[], activeIdx: number) => {
    if (!editor) return;
    try {
      const decorations = positions.map((p, i) =>
        Decoration.inline(p.from, p.to, {
          class: i === activeIdx ? 'search-match search-match-active' : 'search-match',
        })
      );
      const tr = editor.state.tr.setMeta(searchKey, DecorationSet.create(editor.state.doc, decorations));
      editor.view.dispatch(tr);
    } catch {}
  }, [editor]);

  const jumpTo = useCallback((positions: Match[], idx: number, opts?: { focus?: boolean }) => {
    if (!positions.length || !editor) return;
    const r = positions[idx];
    const chain = editor.chain().setTextSelection({ from: r.from, to: r.to }).scrollIntoView();
    if (opts?.focus !== false) chain.focus();
    chain.run();
    applyDecorations(positions, idx);
  }, [editor, applyDecorations]);

  // Live search as you type (debounced). Jumps to the first match.
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      const { matches, truncated, invalid } = computeMatches();
      setResults(matches);
      setTruncated(truncated);
      setRegexError(invalid);
      setCurrentIndex(0);
      // No focus steal: highlight + scroll only while the user is still typing.
      if (matches.length > 0) jumpTo(matches, 0, { focus: false });
      else clearDecorations();
    }, 200);
    return () => clearTimeout(t);
  }, [isOpen, computeMatches, jumpTo, clearDecorations]);

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

  // Close clears highlights but preserves the term + options for next time.
  useEffect(() => {
    if (!isOpen) clearDecorations();
  }, [isOpen, clearDecorations]);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isOpen]);

  const navigate = (dir: 'next' | 'prev') => {
    const { matches, truncated } = computeMatches();
    if (!matches.length) {
      setResults([]);
      setTruncated(truncated);
      return;
    }
    setResults(matches);
    setTruncated(truncated);
    const idx = dir === 'next'
      ? (currentIndex + 1) % matches.length
      : (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(idx);
    jumpTo(matches, idx);
  };

  const replaceAt = (positions: Match[], idx: number): boolean => {
    const r = positions[idx];
    if (!r || !editor) return false;
    // Guard: only replace if the text under the range still fully matches.
    // (Positions are computed fresh in the same tick, so this only trips if
    // the doc changed underneath us.)
    const current = editor.state.doc.textBetween(r.from, r.to);
    const re = buildSearchRegex(searchTerm, caseSensitive, wholeWord, useRegex);
    if (!re) return false;
    const full = new RegExp(`^(?:${re.source})$`, re.flags.replace('g', ''));
    if (!full.test(current)) return false;
    editor.chain().focus().setTextSelection({ from: r.from, to: r.to }).insertContent(replaceTerm).run();
    return true;
  };

  const refreshAfterEdit = (preferredIdx: number) => {
    const { matches, truncated } = computeMatches();
    setResults(matches);
    setTruncated(truncated);
    if (!matches.length) {
      setCurrentIndex(0);
      clearDecorations();
      return;
    }
    const idx = Math.min(preferredIdx, matches.length - 1);
    setCurrentIndex(idx);
    jumpTo(matches, idx);
  };

  const replaceOne = () => {
    const { matches } = computeMatches();
    if (!matches.length || !editor) return;
    const idx = Math.min(currentIndex, matches.length - 1);
    if (!replaceAt(matches, idx)) {
      addToast('Match moved — list refreshed', 'warning');
    }
    refreshAfterEdit(idx);
  };

  const replaceAll = () => {
    const { matches } = computeMatches();
    if (!matches.length || !editor) return;
    if (matches.length > 50 && !confirm(`Replace all ${matches.length} occurrences?`)) return;
    // One transaction, back-to-front so positions stay valid. Replacement is
    // literal text (no $1 expansion) to avoid regex-injection surprises.
    editor.chain().focus().command(({ tr }) => {
      [...matches]
        .sort((a, b) => b.from - a.from)
        .forEach((m) => {
          tr.replaceWith(m.from, m.to, editor.state.schema.text(replaceTerm));
        });
      return true;
    }).run();
    addToast(`Replaced ${matches.length} occurrence${matches.length === 1 ? '' : 's'}`, 'success');
    setResults([]);
    setTruncated(false);
    setCurrentIndex(0);
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

  const visibleRows = results.slice(0, MAX_LIST_ROWS);

  return (
    <div
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      style={{
        position: 'fixed', top: '72px', right: '20px', width: '360px', maxWidth: 'calc(100vw - 40px)',
        background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '16px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.08)', zIndex: 40, overflow: 'hidden',
      }}
    >
      <style>{`
        .search-match { background: #fef08a; border-radius: 2px; }
        .search-match-active { background: #fbbf24; box-shadow: 0 0 0 1.5px #f97316; }
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
            style={{ paddingLeft: '36px', paddingRight: results.length ? '80px' : '12px', borderColor: regexError ? '#ef4444' : undefined }}
          />
          {results.length > 0 && (
            <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#a8a29e', minWidth: '40px', textAlign: 'center' }}>{currentIndex + 1}/{results.length}{truncated ? '+' : ''}</span>
              <button onClick={() => navigate('prev')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#78716c' }} title="Previous (Shift+Enter)"><ArrowUp size={13} /></button>
              <button onClick={() => navigate('next')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#78716c' }} title="Next (Enter)"><ArrowDown size={13} /></button>
            </div>
          )}
        </div>

        {regexError && (
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#dc2626', background: '#fef2f2', borderRadius: '8px', padding: '7px 10px' }}>
            <TriangleAlert size={13} /> Invalid regular expression
          </p>
        )}

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setCaseSensitive(!caseSensitive)} style={toggleStyle(caseSensitive)} title="Case-sensitive (Aa)">
            <CaseSensitive size={15} />
          </button>
          <button onClick={() => setWholeWord(!wholeWord)} style={toggleStyle(wholeWord)} title="Whole word">
            <WholeWord size={15} />
          </button>
          <button onClick={() => setUseRegex(!useRegex)} style={toggleStyle(useRegex)} title="Regular expression">
            <Regex size={15} />
          </button>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: '11px', color: '#a8a29e', alignSelf: 'center' }}>
            {searchTerm && !regexError ? (results.length ? `${results.length}${truncated ? '+' : ''} match${results.length === 1 ? '' : 'es'}` : 'No matches') : ''}
          </span>
        </div>

        {/* Match list */}
        {results.length > 0 && (
          <div style={{ border: '1.5px solid #f5f5f4', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
              {visibleRows.map((m, i) => (
                <div
                  key={`${m.from}-${m.to}-${i}`}
                  onClick={() => { setCurrentIndex(i); jumpTo(results, i); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '7px 10px', cursor: 'pointer', fontSize: '12px',
                    background: i === currentIndex ? '#fff7ed' : 'transparent',
                    borderBottom: '1px solid #fafaf9',
                  }}
                  onMouseEnter={(e) => { if (i !== currentIndex) e.currentTarget.style.background = '#fafaf9'; }}
                  onMouseLeave={(e) => { if (i !== currentIndex) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: i === currentIndex ? '#f97316' : '#d6d3d1', minWidth: '24px' }}>{i + 1}</span>
                  <span style={{ flex: 1, color: '#57534e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    …{m.snippet}…
                  </span>
                </div>
              ))}
              {results.length > MAX_LIST_ROWS && (
                <div style={{ padding: '7px 10px', fontSize: '11px', color: '#a8a29e', textAlign: 'center' }}>
                  +{results.length - MAX_LIST_ROWS} more — refine your search
                </div>
              )}
            </div>
          </div>
        )}

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
          <button onClick={replaceOne} disabled={!results.length} className="btn btn-primary btn-sm" style={{ flex: 1 }} title="Replace current match">Replace</button>
          <button onClick={replaceAll} disabled={!results.length} className="btn btn-danger btn-sm" style={{ flex: 1 }} title="Replace all matches at once">Replace All</button>
        </div>
      </div>
    </div>
  );
}
