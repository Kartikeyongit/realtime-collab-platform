'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface Props {
  open: boolean;
  onClose: () => void;
  folders?: Array<{ id: string; name: string }>;
  onNavigate?: (id: string) => void;
}

export function CommandPalette({ open, onClose, onNavigate }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string }>>([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQ('');
      setResults([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open ]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ limit: '8', sort: 'updated' });
        if (q.trim()) params.set('search', q.trim());
        const { data } = await axios.get(`/api/documents?${params}`);
        setResults((data.documents || []).map((d: any) => ({ id: d.id, title: d.title })));
        setActive(0);
      } catch {}
    }, 200);
    return () => clearTimeout(t);
  }, [q, open]);

  const actions = useMemo(() => {
    const list = [
      { label: 'New document', run: async () => {
        const { data } = await axios.post('/api/documents', { title: 'Untitled Document' });
        (onNavigate || router.push)(`/documents/${data.id}`);
      }},
      { label: 'Quick note', run: async () => {
        const { data } = await axios.post('/api/documents', { title: 'Quick note', tags: ['inbox'] });
        (onNavigate || router.push)(`/documents/${data.id}`);
      }},
      { label: "Open today's journal", run: async () => {
        const { data } = await axios.get('/api/documents/daily');
        (onNavigate || router.push)(`/documents/${data.document.id}`);
      }},
      { label: 'Go to dashboard', run: () => router.push('/dashboard') },
      { label: 'Go to trash', run: () => router.push('/trash') },
    ];
    if (!q) return list;
    return list.filter((a) => a.label.toLowerCase().includes(q.toLowerCase()));
  }, [q, router, onNavigate]);

  if (!open) return null;

  const goDoc = (id: string) => {
    onClose();
    if (onNavigate) onNavigate(id);
    else router.push(`/documents/${id}`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', paddingTop: '12vh' }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 92vw)', height: 'fit-content', background: 'white', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length + actions.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter') {
              const all = [...results.map((r) => ({ id: r.id, doc: true })), ...actions.map((a) => ({ action: a }))];
              const sel: any = all[active];
              if (sel?.doc) goDoc(sel.id);
              else if (sel?.action) { onClose(); sel.action.run(); }
              else if (results[0]) goDoc(results[0].id);
            }
          }}
          placeholder="Type doc title or action… (Esc to close)"
          style={{ width: '100%', padding: '14px 16px', border: 'none', outline: 'none', fontSize: 15, borderBottom: '1px solid #f5f5f4' }}
        />
        <div style={{ maxHeight: 320, overflowY: 'auto', padding: 6 }}>
          {results.map((r, i) => (
            <button key={r.id} onClick={() => goDoc(r.id)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderRadius: 8, background: i === active ? '#fff7ed' : 'white', cursor: 'pointer', fontSize: 14 }}>
              📄 {r.title}
            </button>
          ))}
          {actions.map((a, i) => (
            <button key={a.label} onClick={() => { onClose(); a.run(); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 12px', border: 'none', borderRadius: 8, background: results.length + i === active ? '#f5f5f4' : 'white', cursor: 'pointer', fontSize: 13, color: '#78716c' }}>
              ⚡ {a.label}
            </button>
          ))}
          {results.length === 0 && actions.length === 0 && <div style={{ padding: 16, fontSize: 13, color: '#a8a29e' }}>No matches</div>}
        </div>
      </div>
    </div>
  );
}
