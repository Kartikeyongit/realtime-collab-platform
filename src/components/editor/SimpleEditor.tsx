'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Toolbar } from './Toolbar';
import axios from 'axios';
import { showSuccess, showError } from '@/lib/toast';
import { Save, Loader2 } from 'lucide-react';

interface SimpleEditorProps {
  documentId: string;
  initialContent?: any;
  onSave?: () => void;
}

export function SimpleEditor({ documentId, initialContent, onSave }: SimpleEditorProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveDocument = useCallback(async (content: any, force?: boolean) => {
    if (!isDirty && !force) return;
    
    setIsSaving(true);
    try {
      await axios.put(`/api/documents/${documentId}`, { content });
      setLastSaved(new Date());
      setIsDirty(false);
      onSave?.();
    } catch (error) {
      console.error('Failed to save document:', error);
      showError('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  }, [documentId, isDirty, onSave]);

  const debouncedSave = useCallback((content: any) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveDocument(content), 2000);
  }, [saveDocument]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
      Underline,
    ],
    content: initialContent || {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to CollabDocs!' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a collaborative document editor. Start typing to begin!' },
          ],
        },
      ],
    },
    editorProps: {
      attributes: {
        class: 'prose max-w-none focus:outline-none min-h-[500px] px-8 py-4',
      },
    },
    onUpdate: ({ editor }) => {
      setIsDirty(true);
      debouncedSave(editor.getJSON());
    },
  });

  const handleManualSave = () => {
    if (editor) {
      const content = editor.getJSON();
      saveDocument(content, true);
      showSuccess('Document saved!');
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editor, isDirty]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 h-10">
        <div className="flex items-center gap-2 text-sm text-gray-500 min-w-[200px]">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
              <span>Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </>
          ) : (
            <span>Ready</span>
          )}
        </div>
        
        <div className="flex items-center min-w-[120px] justify-end">
          <button
            onClick={handleManualSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            <Save className="w-3 h-3" />
            Save
          </button>
        </div>
      </div>

      <Toolbar editor={editor} />
      
      <div className="max-w-4xl mx-auto mt-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
