'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import type { Editor } from '@tiptap/react';
import { History, Clock, RotateCcw, Camera } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';

interface V { id: string; title: string; createdAt: string; creator?: { name: string } }

export function VersionHistory({ documentId, editor, onRestored }: { documentId: string; editor?: Editor | null; onRestored?: () => void }) {
  const [versions, setVersions] = useState<V[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/documents/${documentId}/versions`);
      setVersions(data.versions || []);
    } catch { showError('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [documentId]);

  const snapshot = async () => {
    try {
      if (editor) {
        try {
          await axios.put(`/api/documents/${documentId}`, { content: editor.getJSON(), skipVersion: true });
        } catch {}
      }
      await axios.post(`/api/documents/${documentId}/versions`);
      showSuccess('Snapshot saved (max 20 kept)');
      load();
    } catch { showError('Snapshot failed'); }
  };

  const restore = async (id: string) => {
    if (!confirm('Restore this version? Current content will be snapshotted first.')) return;
    try {
      setRestoring(id);
      const { data: version } = await axios.get(`/api/documents/${documentId}/versions/${id}`);
      if (!version?.content && !version?.title) throw new Error('empty');
      await axios.post(`/api/documents/${documentId}/versions/${id}/restore`);
      if (editor) {
        editor.commands.setContent(version.content ?? { type: 'doc', content: [{ type: 'paragraph' }] });
        try {
          localStorage.removeItem(`offline-queue-${documentId}`);
        } catch {}
        await axios.put(`/api/documents/${documentId}`, {
          title: version.title,
          content: version.content,
          skipVersion: true,
        }).catch(() => {});
      }
      showSuccess('Restored — editor updated');
      onRestored?.();
      load();
    } catch { showError('Restore failed'); }
    finally { setRestoring(null); }
  };

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ padding: '18px 20px 14px', borderBottom: '1.5px solid #f5f5f4', background: '#fdfbf7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
            <History size={18} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Version history</div>
            <div style={{ fontSize: 12, color: '#a8a29e' }}>Auto every 10 min · max 20 kept · free</div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={snapshot} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Camera size={14} /> Save now
          </button>
        </div>
      </div>
      <div style={{ padding: 14 }}>
        {loading ? (
          <div style={{ display: 'grid', gap: 8 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 56, borderRadius: 12, background: 'linear-gradient(90deg,#fafaf9 25%,#f5f5f4 50%,#fafaf9 75%)', backgroundSize: '200% 100%', animation: 'shimmerSlow 2.8s ease-in-out infinite' }} />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 16px', color: '#a8a29e' }}>
            <History size={28} style={{ marginBottom: 8, opacity: 0.5 }} />
            <div style={{ fontSize: 13, fontWeight: 600, color: '#78716c' }}>No snapshots yet</div>
            <div style={{ fontSize: 12 }}>Click Save now, edit, then restore to test.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8, maxHeight: 340, overflowY: 'auto' }}>
            {versions.map((v, idx) => (
              <div key={v.id} style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center', background: idx === 0 ? '#fff7ed' : 'white', border: idx === 0 ? '1.5px solid #fed7aa' : '1.5px solid #f5f5f4', borderRadius: 12, transition: 'border 0.15s' }}>
                <span style={{ width: 32, height: 32, borderRadius: 10, background: '#fafaf9', border: '1px solid #e7e5e4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#78716c', flexShrink: 0 }}>
                  <Clock size={15} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {v.title} {idx === 0 && <span style={{ fontSize: 10, fontWeight: 700, color: '#ea580c', background: '#ffedd5', borderRadius: 999, padding: '2px 7px', marginLeft: 6 }}>LATEST</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#a8a29e' }}>{new Date(v.createdAt).toLocaleString()} {v.creator?.name ? `· ${v.creator.name}` : ''}</div>
                </div>
                <button className="btn btn-secondary btn-sm" disabled={restoring === v.id} onClick={() => restore(v.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <RotateCcw size={13} /> {restoring === v.id ? '…' : 'Restore'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
