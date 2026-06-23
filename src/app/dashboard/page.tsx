'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { Search, Clock, Users, Trash2, FileText } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { showSuccess, showError } from '@/lib/toast';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

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
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  useEffect(() => {
    if (session) fetchDocuments(page, debouncedSearch);
  }, [session, page, debouncedSearch]);

  const fetchDocuments = useCallback(async (pageNum: number, searchTerm: string) => {
    try {
      if (initialLoading) setInitialLoading(true);
      else setRefetching(true);
      const params = new URLSearchParams({ page: String(pageNum), limit: String(limit) });
      if (searchTerm) params.set('search', searchTerm);
      const { data } = await axios.get(`/api/documents?${params}`);
      setDocuments(data.documents);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { showError('Failed to load documents'); }
    finally { setInitialLoading(false); setRefetching(false); }
  }, [initialLoading]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`/api/documents/${deleteTarget.id}`);
      setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
      setTotal(prev => prev - 1);
      showSuccess('Deleted');
    } catch { showError('Failed to delete'); }
    setDeleteTarget(null);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (initialLoading) return <DashboardSkeleton />;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Documents</h1>
        <p style={{ color: '#78716c', fontSize: '14px' }}>
          {debouncedSearch
            ? `${total} result${total !== 1 ? 's' : ''} for "${debouncedSearch}"`
            : totalPages > 1
              ? `Page ${page} of ${totalPages}`
              : `${total} document${total !== 1 ? 's' : ''}`
          }
        </p>
      </div>

      <div style={{ marginBottom: '24px', position: 'relative', maxWidth: '340px' }}>
        <Search size={15} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input" style={{ paddingLeft: '36px', paddingRight: '36px' }} />
        {refetching && (
          <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px' }}>
            <div className="search-spinner" />
          </div>
        )}
      </div>
      <style>{`.search-spinner { width: 14px; height: 14px; border: 2px solid #e7e5e4; border-top-color: #f97316; border-radius: 50%; animation: searchSpin 0.6s linear infinite; } @keyframes searchSpin { to { transform: rotate(360deg); } }`}</style>

      {documents.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', marginTop: '20px' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '20px', background: '#fafaf9', border: '1.5px solid #e7e5e4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <FileText size={32} color="#d6d3d1" />
          </div>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#57534e', marginBottom: '6px' }}>No documents yet</p>
          <p style={{ fontSize: '14px', color: '#a8a29e', margin: 0 }}>{search ? 'Try another search' : 'Click + New in the navbar to create your first document'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '8px' }}>
          {documents.map((doc) => (
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

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
          <button disabled={page <= 1} onClick={() => handlePageChange(page - 1)} className="btn btn-secondary btn-sm">Previous</button>
          <span style={{ display: 'flex', alignItems: 'center', fontSize: '13px', color: '#78716c', padding: '0 8px' }}>{page} / {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => handlePageChange(page + 1)} className="btn btn-secondary btn-sm">Next</button>
        </div>
      )}

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete document?" description={`"${deleteTarget?.title}" will be permanently deleted.`} confirmText="Delete" variant="danger" />
    </div>
  );
}
