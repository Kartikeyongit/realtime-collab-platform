'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { showSuccess, showError } from '@/lib/toast';

interface V { id: string; title: string; createdAt: string; creator?: { name: string } }

export function VersionHistory({ documentId, onRestored }: { documentId: string; onRestored?: () => void }) {
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
      await axios.post(`/api/documents/${documentId}/versions`);
      showSuccess('Snapshot saved (max 20 kept)');
      load();
    } catch { showError('Snapshot failed'); }
  };

  const restore = async (id: string) => {
    if (!confirm('Restore this version? Current content will be snapshotted first.')) return;
    try {
      setRestoring(id);
      await axios.post(`/api/documents/${documentId}/versions/${id}/restore`);
      showSuccess('Restored');
      onRestored?.();
      load();
    } catch { showError('Restore failed'); }
    finally { setRestoring(null); }
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>Version history</strong>
        <span style={{ fontSize: 11, color: '#a8a29e' }}>auto every 10 min · max 20 · free</span>
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={snapshot}>Save now</button>
      </div>
      {loading ? <div style={{ fontSize: 13, color: '#a8a29e' }}>Loading…</div>
      : versions.length === 0 ? <div style={{ fontSize: 13, color: '#a8a29e' }}>No snapshots yet. Edit and save, then check back.</div>
      : <div style={{ display: 'grid', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
        {versions.map((v) => (
          <div key={v.id} className="card" style={{ padding: '8px 10px', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.title}</div>
              <div style={{ fontSize: 11, color: '#a8a29e' }}>{new Date(v.createdAt).toLocaleString()} {v.creator?.name ? `· ${v.creator.name}` : ''}</div>
            </div>
            <button className="btn btn-secondary btn-sm" disabled={restoring === v.id} onClick={() => restore(v.id)}>{restoring === v.id ? '…' : 'Restore'}</button>
          </div>
        ))}
      </div>}
    </div>
  );
}
