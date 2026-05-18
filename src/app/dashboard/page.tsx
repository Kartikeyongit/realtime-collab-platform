'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Search, Clock, Users, Trash2, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';

interface Document {
  id: string;
  title: string;
  updatedAt: string;
  owner: { name: string };
  collaborators: Array<{ user: { name: string } }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => { if (session) fetchDocuments(); }, [session]);

  const fetchDocuments = async () => {
    try {
      const { data } = await axios.get('/api/documents');
      setDocuments(data);
    } catch { addToast('Failed to load documents', 'error'); }
    finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/documents/${deleteTarget.id}`);
      setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
      addToast('Deleted', 'success');
    } catch { addToast('Failed to delete', 'error'); }
    setDeleteTarget(null);
  };

  const filtered = documents.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#a8a29e' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Documents</h1>
        <p style={{ color: '#78716c', fontSize: '14px' }}>{documents.length} document{documents.length !== 1 ? 's' : ''}</p>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '340px' }}>
        <Search size={15} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px' }} />
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <FileText size={40} color="#d6d3d1" style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: '#78716c', marginBottom: '4px' }}>No documents</p>
          <p style={{ fontSize: '13px', color: '#a8a29e' }}>{search ? 'Try another search' : 'Click + New in the navbar to create one'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {filtered.map((doc) => (
            <div key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)} className="card" style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '3px' }}>{doc.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#a8a29e' }}>
                  <Clock size={11} />
                  <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                  {doc.collaborators.length > 0 && <><span>·</span><Users size={11} /><span>{doc.collaborators.length}</span></>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                {doc.collaborators.slice(0, 2).map((c, i) => (
                  <div key={i} className="avatar avatar-sm" style={{ background: '#fed7aa', color: '#c2410c', marginLeft: i > 0 ? '-8px' : 0, border: '2px solid white' }}>{c.user.name?.charAt(0) || '?'}</div>
                ))}
                <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(doc); }} className="btn btn-ghost btn-sm" style={{ color: '#d6d3d1', padding: '4px' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete document?" description={`"${deleteTarget?.title}" will be permanently deleted.`} confirmText="Delete" variant="danger" />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
