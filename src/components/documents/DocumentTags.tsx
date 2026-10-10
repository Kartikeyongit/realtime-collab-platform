'use client';

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Tag as TagIcon, X } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';

/**
 * Tag editor for the document header. Tags are free-form labels you attach
 * to a document (e.g. "work", "ideas", "invoice") so you can later find
 * and group documents by tag from the dashboard's "All tags" filter.
 */
export function DocumentTags({
  documentId,
  tags,
  onChanged,
}: {
  documentId: string;
  tags: Array<{ tag: { id: string; name: string } }>;
  onChanged: (tags: Array<{ tag: { id: string; name: string } }>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: string; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const names = tags.map((t) => t.tag.name);

  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
    axios.get('/api/tags').then(({ data }) => {
      const mine: Array<{ id: string; name: string }> = data.tags || [];
      setSuggestions(mine.filter((t) => !names.includes(t.name)).slice(0, 8));
    }).catch(() => {});
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  const save = async (next: string[]) => {
    const clean = [...new Set(next.map((n) => n.trim().slice(0, 30)).filter(Boolean))].slice(0, 10);
    setSaving(true);
    try {
      await axios.put(`/api/documents/${documentId}`, { tags: clean, skipVersion: true });
      // Rebuild tag objects for instant UI (ids come from server on refetch)
      onChanged(clean.map((name, i) => {
        const existing = tags.find((t) => t.tag.name === name);
        return existing ?? { tag: { id: `tmp-${i}-${name}`, name } };
      }));
      const { data } = await axios.get('/api/tags').catch(() => ({ data: { tags: [] } }));
      const mine: Array<{ id: string; name: string }> = data.tags || [];
      setSuggestions(mine.filter((t) => !clean.includes(t.name)).slice(0, 8));
    } catch {
      showError('Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  const add = (raw: string) => {
    const name = raw.trim().slice(0, 30);
    if (!name || names.includes(name)) {
      setInput('');
      return;
    }
    setInput('');
    save([...names, name]);
    showSuccess(`Tagged “${name}”`);
  };

  const remove = (name: string) => save(names.filter((n) => n !== name));

  return (
    <div ref={rootRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost btn-sm"
        style={{ padding: '5px 6px', position: 'relative', color: names.length > 0 ? '#7c3aed' : undefined }}
        title={names.length > 0 ? `Tags: ${names.join(', ')}` : 'Add tags'}
      >
        <TagIcon size={15} />
        {names.length > 0 && (
          <span style={{ position: 'absolute', top: 0, right: 0, minWidth: 14, height: 14, borderRadius: 999, background: '#7c3aed', color: 'white', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
            {names.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div className="dropdown" style={{ right: 0, width: 280, padding: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Tags</div>
            <div style={{ fontSize: 11, color: '#a8a29e', marginBottom: 10 }}>
              Label this doc (e.g. work, ideas). Filter by tag on the dashboard.
            </div>
            {names.length > 0 ? (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {tags.map((t) => (
                  <span key={t.tag.id + t.tag.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 999, padding: '3px 6px 3px 10px' }}>
                    #{t.tag.name}
                    <button onClick={() => remove(t.tag.name)} disabled={saving} title={`Remove ${t.tag.name}`} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#a78bfa', display: 'inline-flex', padding: 1 }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: '#a8a29e', marginBottom: 10 }}>No tags yet — add one below.</div>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(input); }}
              placeholder="Type a tag, press Enter"
              className="input"
              style={{ fontSize: 13, marginBottom: suggestions.length > 0 ? 8 : 0 }}
            />
            {suggestions.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {suggestions.map((s) => (
                  <button key={s.id} onClick={() => add(s.name)} style={{ fontSize: 12, color: '#78716c', background: '#fafaf9', border: '1.5px solid #e7e5e4', borderRadius: 999, padding: '3px 10px', cursor: 'pointer' }}>
                    + {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
