'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useCollaboration } from '@/hooks/useCollaboration';
import { PresenceIndicators } from '@/components/collaboration/PresenceIndicators';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { Editor } from '@tiptap/react';
import { CollaborativeEditor } from '@/components/editor/CollaborativeEditor';
import { CommentThread } from '@/components/comments/CommentThread';
import { ExportDialog } from '@/components/export/ExportDialog';
import { SearchReplacePanel } from '@/components/search/SearchReplacePanel';
import { AIAssistant } from '@/components/ai/AIAssistant';
import { ShareDialog } from '@/components/share/ShareDialog';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useDocumentStore } from '@/store/documentStore';
import { InlineRename } from '@/components/ui/InlineRename';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from 'react-hot-toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { WordCount } from '@/components/editor/WordCount';
import { 
  MessageSquare, Share2, ArrowLeft, 
  MoreHorizontal, Trash2, Copy,
  Download, Search, Sparkles, Clock, Wifi, WifiOff,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.documentId as string;
  const { data: session } = useSession();
  const { document, setDocument, reset } = useDocumentStore();
  
  const [showComments, setShowComments] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const abortRef = useRef(new AbortController());
  const [error, setError] = useState('');
  const [title, setTitle] = useState('Untitled');
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const wasEverConnected = useRef(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'live' | 'reconnecting' | 'offline'>('connecting');

  const { emitComment } = useCollaboration(documentId);
  useEffect(() => { fetchDocument(); }, [documentId]);
  useEffect(() => { return () => { reset(); }; }, [documentId]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') { e.preventDefault(); setShowSearch(prev => !prev); }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') { e.preventDefault(); setShowAI(prev => !prev); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchDocument = async () => {
    abortRef.current.abort();
    abortRef.current = new AbortController();
    setError('');
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/documents/${documentId}`, { signal: abortRef.current.signal });
      setDocument(response.data);
      setTitle(response.data.title || 'Untitled');
    } catch (err: any) {
      if (axios.isCancel(err)) return;
      if (err.response?.status === 404) setError('Document not found');
      else if (err.response?.status === 403) setError('Access denied');
      else setError('Failed to load');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditorReady = useCallback((editor: Editor) => setEditorInstance(editor), []);
  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    if (connected) {
      wasEverConnected.current = true;
      setConnectionStatus('live');
    } else if (wasEverConnected.current) {
      setConnectionStatus('reconnecting');
    } else {
      setConnectionStatus('connecting');
    }
  }, []);
  const handleRename = (newTitle: string) => { setTitle(newTitle); if (document) setDocument({ ...document, title: newTitle }); };

  const addToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info') => {
    if (type === 'success') toast.success(msg);
    else if (type === 'error') toast.error(msg);
    else if (type === 'warning') toast(msg, { icon: '⚠️' });
    else toast(msg);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/documents/${documentId}`);
      toast.success('Document deleted');
      setTimeout(() => router.push('/dashboard'), 500);
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleDuplicate = async () => {
    try {
      const { data } = await axios.post('/api/documents', { title: `${title} (Copy)`, content: document?.content });
      toast.success('Duplicated');
      router.push(`/documents/${data.id}`);
    } catch {
      toast.error('Failed to duplicate');
    }
  };

  if (isLoading) return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
      <Skeleton width="300px" height="24px" style={{ marginBottom: '16px' }} />
      <Skeleton width="100%" height="500px" borderRadius="12px" />
    </div>
  );
  if (error) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '16px' }}>
      <p style={{ fontSize: '18px', color: '#78716c' }}>{error}</p>
      <button onClick={() => router.push('/')} className="btn btn-secondary">Back to Home</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#fdfbf7' }}>
      {/* Document Header - matches nav height */}
      <header style={{ 
        background: 'white', 
        borderBottom: '1.5px solid #e7e5e4', 
        padding: '0 20px', 
        height: '52px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
          <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '6px', flexShrink: 0 }}>
            <ArrowLeft size={17} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <InlineRename documentId={documentId} initialTitle={title} onRename={handleRename} canRename={!!session} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#a8a29e', marginTop: '1px' }}>
              {connectionStatus === 'live' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#16a34a' }}>
                  <Wifi size={10} /> Live
                </span>
              ) : connectionStatus === 'reconnecting' ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f97316' }}>
                  <WifiOff size={10} /> Reconnecting...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#a8a29e' }}>
                  <WifiOff size={10} /> Connecting...
                </span>
              )}
              <span style={{ color: '#d6d3d1' }}>·</span>
              <WordCount editor={editorInstance} />
              <span style={{ color: '#d6d3d1' }}>·</span>
              <Clock size={10} />
              <span>{document?.updatedAt ? formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true }) : 'Just now'}</span>
              {document?.owner && <><span style={{ color: '#d6d3d1' }}>·</span><span>{document.owner.name}</span></>}
              <PresenceIndicators />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          <NotificationCenter />
          <div style={{ width: '1px', height: '18px', background: '#e7e5e4', margin: '0 4px' }} />
          <button onClick={() => setShowAI(!showAI)} className="btn btn-ghost btn-sm hide-mobile" style={{ padding: '5px 6px' }} title="AI Assistant"><Sparkles size={15} /></button>
          <button onClick={() => setShowSearch(!showSearch)} className="btn btn-ghost btn-sm hide-mobile" style={{ padding: '5px 6px' }} title="Find & Replace"><Search size={15} /></button>
          <button onClick={() => setShowExport(true)} className="btn btn-ghost btn-sm" style={{ padding: '5px 6px' }} title="Export"><Download size={15} /></button>
          <div className="hide-mobile" style={{ width: '1px', height: '18px', background: '#e7e5e4', margin: '0 4px' }} />
          <button onClick={() => setShowComments(!showComments)} className="btn btn-ghost btn-sm hide-mobile" style={{ padding: '5px 6px' }} title="Comments"><MessageSquare size={15} /></button>
          <button onClick={() => setShowShare(true)} className="btn btn-ghost btn-sm" style={{ padding: '5px 6px' }} title="Share"><Share2 size={15} /></button>
          <div className="hide-mobile" style={{ width: '1px', height: '18px', background: '#e7e5e4', margin: '0 4px' }} />
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowMenu(!showMenu)} className="btn btn-ghost btn-sm" style={{ padding: '5px 4px' }} title="More"><MoreHorizontal size={15} /></button>
            {showMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setShowMenu(false)} />
                <div className="dropdown" style={{ right: 0 }}>
                  <button onClick={() => { setShowSearch(true); setShowMenu(false); }} className="dropdown-item show-mobile"><Search size={15} /> Find & Replace</button>
                  <button onClick={() => { setShowAI(true); setShowMenu(false); }} className="dropdown-item show-mobile"><Sparkles size={15} /> AI Assistant</button>
                  <button onClick={() => { setShowComments(true); setShowMenu(false); }} className="dropdown-item show-mobile"><MessageSquare size={15} /> Comments</button>
                  <div className="dropdown-divider show-mobile" />
                  <button onClick={() => { handleDuplicate(); setShowMenu(false); }} className="dropdown-item"><Copy size={15} /> Duplicate</button>
                  <div className="dropdown-divider" />
                  <button onClick={() => { setShowDeleteDialog(true); setShowMenu(false); }} className="dropdown-item danger"><Trash2 size={15} /> Delete</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Editor Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'auto' }} id="editor-container">
          <ErrorBoundary>
            <CollaborativeEditor 
              documentId={documentId} 
              initialContent={document?.content} 
              onEditorReady={handleEditorReady} 
              onConnectionChange={handleConnectionChange}
            />
          </ErrorBoundary>
        </div>
        {showComments && (
          <CommentThread 
            comments={document?.comments || []} 
            documentId={documentId}
            editor={editorInstance}
            emitComment={emitComment}
            onResolve={async (id) => { 
              await axios.patch(`/api/documents/${documentId}/comments/${id}`, { resolved: true }); 
              const updatedComments = (document?.comments || []).map(c => 
                c.id === id ? { ...c, resolved: true } : c
              );
              if (document) setDocument({ ...document, comments: updatedComments });
            }} 
            onDelete={async (id) => { 
              await axios.delete(`/api/documents/${documentId}/comments/${id}`); 
              const filteredComments = (document?.comments || []).filter(c => c.id !== id);
              if (document) setDocument({ ...document, comments: filteredComments });
            }}
            addToast={addToast}
          />
        )}
      </div>

      {/* Panels & Dialogs */}
      {editorInstance && (
        <>
          <SearchReplacePanel editor={editorInstance} isOpen={showSearch} onClose={() => setShowSearch(false)} addToast={addToast} />
          <AIAssistant editor={editorInstance} isOpen={showAI} onClose={() => setShowAI(false)} addToast={addToast} />
        </>
      )}
      <ExportDialog isOpen={showExport} onClose={() => setShowExport(false)} documentTitle={title} editor={editorInstance} addToast={addToast} />
      <ShareDialog isOpen={showShare} onClose={() => setShowShare(false)} documentId={documentId} documentTitle={title} collaborators={document?.collaborators || []} addToast={addToast} onCollaboratorChange={() => fetchDocument()} />
      <ConfirmDialog isOpen={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} onConfirm={handleDelete} title="Delete document?" description={`"${title}" will be permanently deleted.`} confirmText="Delete" variant="danger" />
    </div>
  );
}
