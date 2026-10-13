'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Plus, Pencil, Trash2, Check, LayoutGrid } from 'lucide-react';

export interface Workspace {
  id: string;
  name: string;
  color: string;
  _count?: { documents: number; folders: number };
}

const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#16a34a', '#eab308', '#ec4899', '#06b6d4'];

function Dot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: color,
        flexShrink: 0,
        display: 'inline-block',
      }}
    />
  );
}

/**
 * Workspace switcher + inline manager. Value: 'all' | 'none' (Unsorted) | id.
 * Persisted per browser by the parent (localStorage, $0).
 */
export function WorkspaceSwitcher({
  workspaces,
  value,
  onChange,
  onCreate,
  onRename,
  onDelete,
}: {
  workspaces: Workspace[];
  value: string;
  onChange: (v: string) => void;
  onCreate: (name: string, color: string) => Promise<void>;
  onRename: (id: string, name: string) => Promise<void>;
  onDelete: (ws: Workspace) => void;
}) {
  const [open, setOpen] = useState(false);
  const [managing, setManaging] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setManaging(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setManaging(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open ]);

  const current =
    value === 'all'
      ? { label: 'All workspaces', color: null as string | null }
      : value === 'none'
        ? { label: 'Unsorted', color: '#a8a29e' }
        : (() => {
          const ws = workspaces.find((w) => w.id === value);
          return ws ? { label: ws.name, color: ws.color } : { label: 'All workspaces', color: null };
        })();

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    setManaging(false);
  };

  const submitCreate = async () => {
    const name = newName.trim().slice(0, 40);
    if (!name || busy) return;
    setBusy(true);
    try {
      await onCreate(name, newColor);
      setNewName('');
    } finally {
      setBusy(false);
    }
  };

  const submitRename = async (id: string) => {
    const name = renameValue.trim().slice(0, 40);
    setRenamingId(null);
    if (!name) return;
    await onRename(id, name);
  };

  return (
    <div ref={rootRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        title="Switch workspace"
        className="dash-filter"
        style={{
          height: 38,
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 10px 0 12px',
          fontSize: 14,
          fontWeight: 600,
          color: '#44403c',
          background: open ? '#fff7ed' : 'white',
          border: open ? '1.5px solid #f97316' : '1.5px solid #e7e5e4',
          borderRadius: 10,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: open ? '0 0 0 3px rgba(249,115,22,0.1)' : 'none',
        }}
      >
        {current.color ? <Dot color={current.color} /> : <LayoutGrid size={15} color="#a8a29e" />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 130 }}>{current.label}</span>
        <ChevronDown size={15} color={open ? '#f97316' : '#a8a29e'} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            minWidth: 250,
            maxWidth: 'min(300px, calc(100vw - 48px))',
            maxHeight: 340,
            overflowY: 'auto',
            background: 'white',
            border: '1.5px solid #e7e5e4',
            borderRadius: 16,
            boxShadow: '0 16px 40px rgba(28,25,23,0.12)',
            padding: 6,
            zIndex: 50,
            animation: 'dropdownIn 0.18s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <button
            onClick={() => pick('all')}
            style={rowStyle(value === 'all')}
          >
            <LayoutGrid size={14} color="#a8a29e" /> All workspaces
            {value === 'all' && <Check size={14} color="#ea580c" style={{ marginLeft: 'auto' }} />}
          </button>
          <button
            onClick={() => pick('none')}
            style={rowStyle(value === 'none')}
          >
            <Dot color="#a8a29e" /> Unsorted
            {value === 'none' && <Check size={14} color="#ea580c" style={{ marginLeft: 'auto' }} />}
          </button>

          {workspaces.map((ws) => (
            <div key={ws.id}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <button onClick={() => pick(ws.id)} style={{ ...rowStyle(value === ws.id), flex: 1 }} title={`${ws.name} (${ws._count?.documents ?? 0} docs)`}>
                  <Dot color={ws.color} />
                  {renamingId === ws.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') submitRename(ws.id);
                        if (e.key === 'Escape') setRenamingId(null);
                      }}
                      onBlur={() => submitRename(ws.id)}
                      style={{ flex: 1, minWidth: 0, fontSize: 13, border: '1.5px solid #f97316', borderRadius: 6, padding: '2px 6px', outline: 'none' }}
                    />
                  ) : (
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                  )}
                  <span style={{ fontSize: 11, color: '#a8a29e', flexShrink: 0 }}>{ws._count?.documents ?? 0}</span>
                  {value === ws.id && renamingId !== ws.id && <Check size={14} color="#ea580c" style={{ flexShrink: 0 }} />}
                </button>
                {managing && renamingId !== ws.id && (
                  <>
                    <button
                      onClick={() => {
                        setRenamingId(ws.id);
                        setRenameValue(ws.name);
                      }}
                      title={`Rename ${ws.name}`}
                      style={iconBtn()}
                    >
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => onDelete(ws)} title={`Delete ${ws.name}`} style={{ ...iconBtn(), color: '#ef4444' }}>
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #f5f5f4', marginTop: 4, paddingTop: 8 }}>
            {!managing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') submitCreate(); }}
                    placeholder="New workspace…"
                    style={{ flex: 1, minWidth: 90, fontSize: 13, border: '1.5px solid #e7e5e4', borderRadius: 8, padding: '6px 9px', outline: 'none' }}
                  />
                </div>
                <button onClick={submitCreate} disabled={busy || !newName.trim()} title="Create workspace" style={{ border: 'none', background: '#f97316', color: 'white', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', flexShrink: 0 }}>
                  <Plus size={14} />
                </button>
              </div>
            ) : null}
            {!managing && newName.trim() && (
              <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    title={c}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: c,
                      border: 'none',
                      cursor: 'pointer',
                      outline: newColor === c ? '2px solid #1c1917' : 'none',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
            )}
            <button
              onClick={() => setManaging((m) => !m)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', fontSize: 12, fontWeight: 600, padding: '8px 4px 2px', width: '100%', textAlign: 'center' }}
            >
              {managing ? 'Done managing' : workspaces.length > 0 ? 'Manage workspaces' : 'Pick a color, then + to create'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function rowStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '8px 10px',
    border: 'none',
    borderRadius: 10,
    background: active ? '#fff7ed' : 'transparent',
    color: active ? '#c2410c' : '#44403c',
    fontSize: 14,
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    textAlign: 'left' as const,
  };
}

function iconBtn(): React.CSSProperties {
  return {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#a8a29e',
    padding: 6,
    borderRadius: 8,
    display: 'inline-flex',
    flexShrink: 0,
  };
}
