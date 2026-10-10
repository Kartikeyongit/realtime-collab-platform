'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { FileText, Star, Pin, Folder as FolderIcon, Tag as TagIcon, Trash2, X } from 'lucide-react';
import { showSuccess, showError } from '@/lib/toast';
import { CommandPalette } from '@/components/ui/CommandPalette';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

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
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const barTimer = useRef<NodeJS.Timeout | null>(null);
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
  const firstLoad = useRef(true);
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
      if (firstLoad.current) setInitialLoading(true);
      else {
        setRefetching(true);
        // Keep the shimmer bar mounted for at least one full sweep (~1.2s).
        // The fetch itself finishes in ~200ms, so without this the bar flashes
        // and the animation never gets far enough to be perceived as motion.
        if (barTimer.current) clearTimeout(barTimer.current);
        setBarVisible(true);
      }
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
    finally {
      setInitialLoading(false);
      setRefetching(false);
      firstLoad.current = false;
      // Let the bar finish its sweep instead of vanishing mid-flash
      if (barTimer.current) clearTimeout(barTimer.current);
      barTimer.current = setTimeout(() => setBarVisible(false), 1200);
    }
  }, [page, debouncedSearch, folderFilter, tagFilter, favOnly, sort]);

  useEffect(() => { if (status === 'authenticated') fetchMeta(); }, [status, fetchMeta]);
  useEffect(() => { if (status === 'authenticated') fetchDocuments(); }, [status, fetchDocuments]);
  // Refetch when returning to dashboard (back from document) so list is fresh but skeleton shows on first paint
  useEffect(() => {
    const onFocus = () => { if (status === 'authenticated' && !firstLoad.current) fetchDocuments(); };
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      if (barTimer.current) clearTimeout(barTimer.current);
    };
  }, [status, fetchDocuments]);

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

  const deleteFolder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this folder? Documents inside will be kept (moved to No folder).')) return;
    try {
      await axios.delete(`/api/folders/${id}`);
      setFolders((p) => p.filter((f) => f.id !== id));
      if (folderFilter === id) { setFolderFilter(''); setPage(1); }
      fetchDocuments();
      showSuccess('Folder deleted');
    } catch { showError('Failed to delete folder'); }
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

  if (status === 'loading' || initialLoading) return <DashboardSkeleton />;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginRight: 'auto' }}>
          Documents {total > 0 && <span style={{ fontSize: 13, color: '#a8a29e', fontWeight: 400 }}>({total})</span>}
        </h1>
        <button className="btn btn-secondary btn-sm" onClick={() => setPaletteOpen(true)} title="Command palette (Ctrl+K)">⌘K Search</button>
      </div>

      {barVisible && <div className="dash-shimmer" style={{ height: 3, borderRadius: 3, marginBottom: 12 }} />}

      <div className="card" style={{ padding: '14px 16px', marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input dash-filter" placeholder="Search title…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ maxWidth: 220, flex: '1 1 160px' }} />
        <FilterSelect
          ariaLabel="Filter by folder"
          maxWidth={190}
          value={folderFilter}
          onChange={(v) => { setFolderFilter(v); setPage(1); }}
          options={[
            { value: '', label: 'All folders' },
            { value: 'none', label: 'No folder' },
            ...folders.map((f) => ({ value: f.id, label: f.name })),
          ]}
        />
        <FilterSelect
          ariaLabel="Filter by tag"
          maxWidth={170}
          value={tagFilter}
          onChange={(v) => { setTagFilter(v); setPage(1); }}
          options={[
            { value: '', label: 'All tags' },
            ...tags.map((t) => ({ value: t.name, label: `#${t.name}` })),
          ]}
        />
        <FilterSelect
          ariaLabel="Sort documents"
          maxWidth={150}
          value={sort}
          onChange={(v) => setSort(v)}
          options={[
            { value: 'updated', label: 'Recent' },
            { value: 'title', label: 'Title A–Z' },
            { value: 'created', label: 'Newest' },
          ]}
        />
        <button className={`btn btn-sm dash-filter ${favOnly ? '' : 'btn-secondary'}`} onClick={() => { setFavOnly(!favOnly); setPage(1); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 14px' }}>
          <Star size={15} fill={favOnly ? 'currentColor' : 'none'} /> Favorites
        </button>
        {(folderFilter || tagFilter || favOnly || debouncedSearch) && (
          <button className="btn btn-ghost btn-sm dash-filter" onClick={() => { setFolderFilter(''); setTagFilter(''); setFavOnly(false); setSearch(''); setPage(1); }} style={{ padding: '0 14px' }}>
            <X size={14} /> Clear
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '12px 16px', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: folders.length ? 10 : 0 }}>
          <input className="input dash-filter" placeholder="New folder…" value={newFolder} onChange={(e) => setNewFolder(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && createFolder()} style={{ maxWidth: 200, flex: '1 1 140px' }} />
          <button className="btn btn-secondary btn-sm dash-filter" onClick={createFolder}>+ Folder</button>
          <span style={{ fontSize: 12, color: '#a8a29e' }}>{folders.length} folders · {tags.length} tags</span>
        </div>
        {folders.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => { setFolderFilter(''); setPage(1); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: !folderFilter ? '1.5px solid #f97316' : '1.5px solid #e7e5e4', background: !folderFilter ? '#fff7ed' : 'white', color: !folderFilter ? '#c2410c' : '#78716c', fontSize: 13, cursor: 'pointer' }}
            >
              <FolderIcon size={14} /> All
            </button>
            {folders.map((f) => {
              const active = folderFilter === f.id;
              return (
                <span key={f.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 6px 4px 12px', borderRadius: 999, border: active ? '1.5px solid #f97316' : '1.5px solid #e7e5e4', background: active ? '#fff7ed' : '#fafaf9', color: active ? '#c2410c' : '#57534e', fontSize: 13 }}>
                  <button onClick={() => { setFolderFilter(active ? '' : f.id); setPage(1); }} style={{ border: 'none', background: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, color: 'inherit', fontSize: 13 }}>
                    <FolderIcon size={14} /> {f.name} {typeof f._count?.documents === 'number' && <span style={{ color: '#a8a29e' }}>({f._count.documents})</span>}
                  </button>
                  <button onClick={(e) => deleteFolder(f.id, e)} title={`Delete ${f.name}`} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#d6d3d1', display: 'inline-flex', padding: 4, borderRadius: 999 }}>
                    <Trash2 size={13} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: folders.length ? 10 : 0 }}>
            {tags.slice(0, 12).map((t) => {
              const active = tagFilter === t.name;
              return (
                <button key={t.id} onClick={() => { setTagFilter(active ? '' : t.name); setPage(1); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 999, border: active ? '1.5px solid #8b5cf6' : '1.5px solid #ede9fe', background: active ? '#f5f3ff' : 'white', color: active ? '#6d28d9' : '#78716c', fontSize: 12, cursor: 'pointer' }}>
                  <TagIcon size={12} /> #{t.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {documents.length === 0 && !refetching ? (
        <p style={{ color: '#a8a29e', padding: '40px 0', textAlign: 'center' }}>No documents. Create one with + New.</p>
      ) : (
        <div style={{ display: 'grid', gap: 8, opacity: refetching ? 0.6 : 1, transition: 'opacity 0.15s' }}>
          {documents.map((doc) => (
            <div key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)} className="card" style={{ padding: '12px 16px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ width: 34, height: 34, borderRadius: 10, background: doc.isPinned ? '#fff7ed' : '#fafaf9', border: '1.5px solid #e7e5e4', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: doc.isPinned ? '#f97316' : '#a8a29e', flexShrink: 0 }}>
                  {doc.isPinned ? <Pin size={16} /> : <FileText size={16} />}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {doc.folder && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#57534e', background: '#fafaf9', border: '1px solid #e7e5e4', borderRadius: 999, padding: '2px 8px' }}>
                        <FolderIcon size={11} /> {doc.folder.name}
                      </span>
                    )}
                    {(doc.tags || []).map((t) => (
                      <span key={t.tag.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6d28d9', background: '#f5f3ff', border: '1px solid #ede9fe', borderRadius: 999, padding: '2px 8px' }}>
                        #{t.tag.name}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={(e) => togglePin(doc, e)} title={doc.isPinned ? 'Unpin' : 'Pin'} style={{ border: 'none', background: 'none', cursor: 'pointer', color: doc.isPinned ? '#f97316' : '#d6d3d1', padding: 6 }}>
                  <Pin size={17} fill={doc.isPinned ? 'currentColor' : 'none'} />
                </button>
                <button onClick={(e) => toggleFav(doc, e)} title={doc.isFavorite ? 'Unfavorite' : 'Favorite'} style={{ border: 'none', background: 'none', cursor: 'pointer', color: doc.isFavorite ? '#f59e0b' : '#d6d3d1', padding: 6 }}>
                  <Star size={20} fill={doc.isFavorite ? 'currentColor' : 'none'} />
                </button>
                <span onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
                  <FilterSelect
                    ariaLabel="Move to folder"
                    size="sm"
                    maxWidth={130}
                    value={doc.folder?.id || ''}
                    onChange={(v) => moveDoc(doc.id, v)}
                    options={[
                      { value: '', label: 'No folder' },
                      ...folders.map((f) => ({ value: f.id, label: f.name })),
                    ]}
                  />
                </span>
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
