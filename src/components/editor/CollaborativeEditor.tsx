'use client';

import { useEffect, useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { CustomTable, CustomTableRow, CustomTableCell, CustomTableHeader } from './extensions/tableExtensions';
import { Toolbar } from './Toolbar';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import axios from 'axios';

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: any;
  onEditorReady?: (editor: Editor) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const CollaborativeEditor = forwardRef<any, CollaborativeEditorProps>(
  function CollaborativeEditor({ documentId, initialContent, onEditorReady, onConnectionChange }, ref) {
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const editorRef = useRef<Editor | null>(null);
    const documentIdRef = useRef(documentId);
    documentIdRef.current = documentId;
    const initialContentLoaded = useRef(false);
    const { yDoc, provider, awareness, connected, synced, isEmpty, userInfo } = useYjsCollaboration(documentId);

    const isDirtyRef = useRef(false);
    const flushSaveRef = useRef<(() => void) | null>(null);

    const saveDocument = useCallback(async () => {
      if (!editorRef.current) return;
      let content: any;
      try {
        content = editorRef.current.getJSON();
      } catch {
        return;
      }

      try {
        await axios.put(`/api/documents/${documentIdRef.current}`, { content });
        isDirtyRef.current = false;
      } catch (error) {
        console.error('Save failed:', error);
      }
    }, []);

    const debouncedSave = useCallback(() => {
      isDirtyRef.current = true;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveDocument(), 1000);
    }, [saveDocument]);

    // Trigger saves directly from Yjs content changes, bypassing ProseMirror transaction quirks
    useEffect(() => {
      const fragment = yDoc.getXmlFragment('default');
      const observer = () => debouncedSave();
      fragment.observeDeep(observer);
      return () => { fragment.unobserveDeep(observer); };
    }, [yDoc, debouncedSave]);

    // Periodic save every 5s if dirty (catch-all fallback)
    useEffect(() => {
      const interval = setInterval(() => {
        if (isDirtyRef.current) saveDocument();
      }, 5000);
      return () => clearInterval(interval);
    }, [saveDocument]);

    // Save on page unload
    useEffect(() => {
      const handleBeforeUnload = () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (isDirtyRef.current) {
          // Synchronous save attempt via sendBeacon
          if (editorRef.current) {
            try {
              const content = editorRef.current.getJSON();
              navigator.sendBeacon(
                `/api/documents/${documentIdRef.current}`,
                JSON.stringify({ content }),
              );
            } catch {}
          }
        }
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Stable cursor provider using shared awareness — never changes, so extensions are stable
    const cursorProvider = useMemo(() => ({ awareness }), [awareness]);

    const extensions = useMemo(() => {
      const exts: any[] = [
        StarterKit.configure({ history: false }),
        Placeholder.configure({ placeholder: 'Start typing...' }),
        Underline,
        CustomTable,
        CustomTableRow,
        CustomTableCell,
        CustomTableHeader,
        Image.configure({ inline: true, allowBase64: true }),
        Link.configure({ openOnClick: true, HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }),
        Collaboration.configure({ document: yDoc }),
        CollaborationCursor.configure({
          provider: cursorProvider,
          user: userInfo,
        }),
      ];
      return exts;
    }, [yDoc, cursorProvider, userInfo]);

    const editor = useEditor({
      immediatelyRender: false,
      extensions,
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[500px] px-8 py-4',
        },
      },
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
        if (initialContent && !initialContentLoaded.current) {
          const fragment = yDoc.getXmlFragment('default');
          if (fragment.length === 0 || (fragment.length === 1 && fragment.get(0).length === 0)) {
            initialContentLoaded.current = true;
            ed.commands.setContent(initialContent);
          }
        }
        onEditorReady?.(ed);
      },
    }, [extensions]);

    // Fallback: load initial DB content once Yjs sync completes and Y.Doc is still empty
    useEffect(() => {
      if (!synced || !initialContent || !editorRef.current || initialContentLoaded.current) return;
      const fragment = yDoc.getXmlFragment('default');
      if (fragment.length === 0 || (fragment.length === 1 && fragment.get(0).length === 0)) {
        initialContentLoaded.current = true;
        editorRef.current.commands.setContent(initialContent);
      }
    }, [synced, initialContent]);

    useEffect(() => {
      onConnectionChange?.(connected);
    }, [connected, onConnectionChange]);

    useImperativeHandle(ref, () => ({
      get editor() { return editorRef.current; }
    }), []);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveDocument();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveDocument]);

    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      };
    }, []);

    if (!editor) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen pb-4">
        <Toolbar editor={editor} />
        <div className="max-w-4xl mx-auto my-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
