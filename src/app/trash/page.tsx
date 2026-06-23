'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface TrashedDoc {
  id: string;
  title: string;
  updatedAt: string;
  owner: { name: string };
}

export default function TrashPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<TrashedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TrashedDoc | null>(null);
  const [emptyTarget, setEmptyTarget] = useState(false);

  useEffect(() => { if (session) fetchTrash(); }, [session]);

  const fetchTrash = async () => {
    try {
      const { data } = await axios.get('/api/documents/trash');
      setDocuments(data);
    } catch { toast.error('Failed to load trash'); }
    finally { setLoading(false); }
  };

  const handleRestore = async (id: string) => {
    try {
      await axios.patch(`/api/documents/${id}/restore`);
      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('Document restored');
    } catch { toast.error('Failed to restore'); }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/documents/${deleteTarget.id}/permanent`);
      setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
      toast.success('Permanently deleted');
    } catch { toast.error('Failed to delete'); }
    setDeleteTarget(null);
  };

  const handleEmptyTrash = async () => {
    try {
      await axios.delete('/api/documents/trash');
      setDocuments([]);
      toast.success('Trash emptied');
    } catch { toast.error('Failed to empty trash'); }
    setEmptyTarget(false);
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#a8a29e' }}>Please sign in</p>
      </div>
    );
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0', color: '#a8a29e' }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Link href="/dashboard" style={{ color: '#a8a29e', display: 'flex' }}>
              <ArrowLeft size={17} />
            </Link>
            <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>Trash</h1>
          </div>
          <p style={{ color: '#78716c', fontSize: '14px', marginLeft: '28px' }}>
            {documents.length} document{documents.length !== 1 ? 's' : ''} in trash
          </p>
        </div>
        {documents.length > 0 && (
          <button onClick={() => setEmptyTarget(true)} className="btn btn-danger btn-sm">
            <Trash2 size={14} /> Empty Trash
          </button>
        )}
      </div>

      {documents.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', marginTop: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#fafaf9', border: '1.5px solid #e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <Trash2 size={32} color="#d6d3d1" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#57534e', marginBottom: '6px' }}>Trash is empty</p>
          <p style={{ fontSize: '14px', color: '#a8a29e', margin: 0 }}>Deleted documents will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {documents.map((doc) => (
            <div key={doc.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{doc.title}</div>
                <div style={{ fontSize: '11px', color: '#a8a29e' }}>
                  Deleted {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => handleRestore(doc.id)} className="btn btn-ghost btn-sm" style={{ color: '#22c55e', padding: '6px 10px' }}>
                  <RotateCcw size={14} /> Restore
                </button>
                <button onClick={() => setDeleteTarget(doc)} className="btn btn-ghost btn-sm" style={{ color: '#ef4444', padding: '6px 10px' }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handlePermanentDelete}
        title="Permanently delete?"
        description={`"${deleteTarget?.title}" will be permanently deleted and cannot be recovered.`}
        confirmText="Delete Forever"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={emptyTarget}
        onClose={() => setEmptyTarget(false)}
        onConfirm={handleEmptyTrash}
        title="Empty trash?"
        description="All documents in trash will be permanently deleted."
        confirmText="Empty Trash"
        variant="danger"
      />

    </div>
  );
}
