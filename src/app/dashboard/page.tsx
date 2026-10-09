'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { showSuccess, showError } from '@/lib/toast';
import { CommandPalette } from '@/components/ui/CommandPalette';

interface DocTag { tag: { id: string; name: string } }
interface DocItem {
  id: string;
  title: string;
  updatedAt: string;
  folder?: { id: string; name: string } | null;
  tags?: DocTag[];
  isFavorite?: boolean;
  isPinned?: boolean;
  owner: { name: string };
  collaborators: Array<{ user: { name: string } }>;
}
interface Folder { id: string; name: string; _count?: { documents: number } }
interface Tag { id: string; name: string; _count?: { documents: number } }

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [sort, setSort] = useState('updated');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [newFolder, setNewFolder] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const searchTimer = useRef<NodeJS.Timeout | null>(null);
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
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const fetchMeta = useCallback(async () => {
    try {
      const [f, t] = await Promise.all([axios.get('/api/folders'), axios.get('/api/tags')]);
      setFolders(f.data.folders || []);
      setTags(t.data.tags || []);
    } catch {}
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), sort });
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (folderFilter) params.set('folderId', folderFilter);
      if (tagFilter) params.set('tag', tagFilter);
      if (favOnly) params.set('favorite', '1');
      const { data } = await axios.get(`/api/documents?${params}`);
      setDocuments(data.documents);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { showError('Failed to load documents'); }
    finally { setInitialLoading(false); }
  }, [page, debouncedSearch, folderFilter, tagFilter, favOnly, sort]);

  useEffect(() => { if (session) { fetchMeta(); } }, [session, fetchMeta]);
  useEffect(() => { if (session) fetchDocuments(); }, [session, fetchDocuments]);

  const createFolder = async () => {
    const name = newFolder.trim();
    if (!name) return;
    try {
      const { data } = await axios.post('/api/folders', { name });
      setFolders((p) => [...p, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewFolder('');
      showSuccess('Folder created');
    } catch { showError('Failed to create folder'); }
  };

  const toggleFav = async (doc: DocItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/documents/${doc.id}`, { isFavorite: !doc.isFavorite, skipVersion: true });
      setDocuments((p) => p.map((d) => (d.id === doc.id ? { ...d, isFavorite: !d.isFavorite } : d)));
    } catch { showError('Failed to update'); }
  };

  const togglePin = async (doc: DocItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await axios.put(`/api/documents/${doc.id}`, { isPinned: !doc.isPinned, skipVersion: true });
      setDocuments((p) => p.map((d) => (d.id === doc.id ? { ...d, isPinned: !d.isPinned } : d)));
    } catch { showError('Failed to update'); }
  };

  const moveDoc = async (docId: string, folderId: string) => {
    try {
      await axios.put(`/api/documents/${docId}`, { folderId: folderId || null, skipVersion: true });
      fetchDocuments();
      showSuccess('Moved');
    } catch { showError('Failed to move'); }
  };

  if (initialLoading) return <div style={{ maxWidth: 1000, margin: '0 auto', padding: 36 }}>Loading…</div>;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginRight: 'auto' }}>Documents {total > 0 && <span style={{ fontSize: 13, color: '#a8a29e', fontWeight: 400 }}>({total})</span>}</h1>
        <button className="btn btn-secondary btn-sm" onClick={() => setPaletteOpen(true)} title="Command palette (Ctrl+K)">⌘K Search</button>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <input className="input" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
        <select className="input" value={folderFilter} onChange={(e) => { setFolderFilter(e.target.value); setPage(1); }} style={{ maxWidth: 170 }}>
          <option value="">All folders</option>
          <option value="none">No folder</option>
          {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
        <select className="input" value={tagFilter} onChange={(e) => { setTagFilter(e.target.value); setPage(1); }} style={{ maxWidth: 150 }}>
          <option value="">All tags</option>
          {tags.map((t) => <option key={t.id} value={t.name}>#{t.name}</option>)}
        </select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} style={{ maxWidth: 130 }}>
          <option value="updated">Recent</option>
          <option value="title">Title A–Z</option>
          <option value="created">Newest</option>
        </select>
        <button className={`btn btn-sm ${favOnly ? '' : 'btn-secondary'}`} onClick={() => { setFavOnly(!favOnly); setPage(1); }}>★ Favorites</button>
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
        <input className="input" placeholder="New folder…" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} style={{ maxWidth: 200 }} />
        <button className="btn btn-secondary btn-sm" onClick={createFolder}>+ Folder</button>
        <span style={{ fontSize: 12, color: '#a8a29e' }}>{folders.length} folders · {tags.length} tags — free, stored in Neon</span>
      </div>

      {documents.length === 0 ? (
        <p style={{ color: '#a8a29e', padding: '40px 0', textAlign: 'center' }}>No documents. Create one with + New.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {documents.map((doc) => (
            <div key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)} className="card" style={{ padding: '12px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 14 }}>{doc.isPinned ? '📌' : '📄'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                  <div style={{ fontSize: 11, color: '#a8a29e', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {doc.folder && <span>📁 {doc.folder.name}</span>}
                    {(doc.tags || []).map((t) => <span key={t.tag.id}>#{t.tag.name}</span>)}
                  </div>
                </div>
                <button onClick={(e) => togglePin(doc, e)} title="Pin" style={{ border: 'none', background: 'none', cursor: 'pointer', opacity: doc.isPinned ? 1 : 0.4 }}>📌</button>
                <button onClick={(e) => toggleFav(doc, e)} title="Favorite" style={{ border: 'none', background: 'none', cursor: 'pointer', color: doc.isFavorite ? '#f59e0b' : '#d6d3d1' }}>★</button>
                <select value={doc.folder?.id || ''} onClick={(e) => e.stopPropagation()} onChange={(e) => moveDoc(doc.id, e.target.value)} style={{ fontSize: 12, maxWidth: 120 }}>
                  <option value="">No folder</option>
                  {folders.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="btn btn-secondary btn-sm">Prev</button>
          <span style={{ fontSize: 13, color: '#78716c' }}>{page}/{totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="btn btn-secondary btn-sm">Next</button>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} folders={folders} onNavigate={(id) => router.push(`/documents/${id}`)} />
    </div>
  );
}
