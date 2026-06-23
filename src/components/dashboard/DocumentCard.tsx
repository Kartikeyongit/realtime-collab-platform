'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { InlineRename } from '@/components/ui/InlineRename';
import { 
  FileText, Clock, Users, MoreVertical, 
  Trash2, Copy, ExternalLink 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { showSuccess, showError } from '@/lib/toast';

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    updatedAt: string;
    owner: { name: string };
    collaborators?: Array<{ user: { name: string } }>;
  };
  viewMode: 'grid' | 'list';
  onDelete?: () => void;
  onRename?: (id: string, newTitle: string) => void;
}

export function DocumentCard({ document, viewMode, onDelete, onRename }: DocumentCardProps) {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    
    try {
      await axios.delete(`/api/documents/${document.id}`);
      showSuccess('Document deleted');
      onDelete?.();
    } catch (error) {
      showError('Failed to delete document');
    }
    setShowMenu(false);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: doc } = await axios.get(`/api/documents/${document.id}`);
      const response = await axios.post('/api/documents', {
        title: `${document.title} (Copy)`,
        content: doc.content,
      });
      showSuccess('Document duplicated');
      router.push(`/documents/${response.data.id}`);
    } catch (error) {
      showError('Failed to duplicate document');
    }
    setShowMenu(false);
  };

  if (viewMode === 'list') {
    return (
      <div className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer group animate-fade-in">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div onClick={(e) => e.stopPropagation()}>
            <InlineRename
              documentId={document.id}
              initialTitle={document.title}
              onRename={(newTitle) => onRename?.(document.id, newTitle)}
            />
          </div>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-xs text-gray-500">
              {document.owner.name}
            </p>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {document.collaborators && document.collaborators.length > 0 && (
            <div className="flex -space-x-2">
              {document.collaborators.slice(0, 2).map((collab, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gray-300 ring-2 ring-white" />
              ))}
            </div>
          )}
          
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <button
                    onClick={() => { router.push(`/documents/${document.id}`); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <ExternalLink className="w-4 h-4" /> Open
                  </button>
                  <button
                    onClick={handleDuplicate}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    <Copy className="w-4 h-4" /> Duplicate
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <div className="card-hover p-5 cursor-pointer group animate-scale">
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                <button
                  onClick={() => { router.push(`/documents/${document.id}`); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <ExternalLink className="w-4 h-4" /> Open
                </button>
                <button
                  onClick={handleDuplicate}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="mb-3">
        <InlineRename
          documentId={document.id}
          initialTitle={document.title}
          onRename={(newTitle) => onRename?.(document.id, newTitle)}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          {formatDistanceToNow(new Date(document.updatedAt), { addSuffix: true })}
        </div>
        {document.collaborators && document.collaborators.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Users className="w-3 h-3" />
            {document.collaborators.length}
          </div>
        )}
      </div>
    </div>
  );
}
