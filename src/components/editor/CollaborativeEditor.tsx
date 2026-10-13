'use client';

import { useEffect, useCallback, useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import { CustomTable, CustomTableRow, CustomTableCell, CustomTableHeader } from './extensions/tableExtensions';
import { FontSize } from './extensions/FontSize';
import { EmojiSuggestion } from './extensions/EmojiSuggestion';
import { ParagraphFocus } from './extensions/ParagraphFocus';
import { DocLink } from './extensions/DocLink';
import { DocLinkSuggest } from './extensions/DocLinkSuggest';
import { Toolbar } from './Toolbar';
import { useYjsCollaboration } from '@/hooks/useYjsCollaboration';
import { maybeAutoIndex } from '@/lib/ai/autoIndex';
import { perfStats, resetPerfStats, vectorsEqual } from '@/lib/perf';
import { PerfHud } from './PerfHud';
import * as Y from 'yjs';
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
    // Reset per document so navigating doc→doc without remount still loads content.
    useEffect(() => {
      initialContentLoaded.current = false;
      lastSavedVectorRef.current = null;
      resetPerfStats();
    }, [documentId]);
    const { yDoc, provider, awareness, connected, synced, isEmpty, userInfo } = useYjsCollaboration(documentId);
    const yDocRef = useRef(yDoc);
    yDocRef.current = yDoc;
    const lastSavedVectorRef = useRef<Uint8Array | null>(null);

    const isDirtyRef = useRef(false);
    const offlineBannerRef = useRef(false);
    const [showPerf] = useState(
      () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('perf')
    );

    const saveDocument = useCallback(async () => {
      if (!editorRef.current) return;
      let content: any;
      try {
        content = editorRef.current.getJSON();
      } catch {
        return;
      }

      // Skip when the Yjs clock hasn't advanced since the last save: avoids a
      // full stringify + PUT for unchanged content (idle interval ticks, or
      // saves triggered without real edits). Yjs realtime persistence is
      // unaffected — this only gates the durable REST snapshot.
      let vector: Uint8Array | null = null;
      try {
        vector = Y.encodeStateVector(yDocRef.current);
        if (lastSavedVectorRef.current && vectorsEqual(vector, lastSavedVectorRef.current)) {
          isDirtyRef.current = false;
          perfStats.skipped++;
          return;
        }
      } catch {}

      // Offline queue ($0): stash last content locally when save fails / offline.
      const queueKey = `offline-queue-${documentIdRef.current}`;
      try {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          try {
            localStorage.setItem(queueKey, JSON.stringify({ content, at: Date.now() }));
          } catch {}
          isDirtyRef.current = true;
          return;
        }
        const t0 = performance.now();
        await axios.put(`/api/documents/${documentIdRef.current}`, { content });
        perfStats.lastPutMs = performance.now() - t0;
        perfStats.saves++;
        isDirtyRef.current = false;
        if (vector) lastSavedVectorRef.current = vector;
        try {
          localStorage.removeItem(queueKey);
        } catch {}
        // Best-effort memory refresh (no-op unless workspace indexed once).
        // Deferred to a full idle period: embedding runs ONNX inference on
        // the main thread and must never compete with typing.
        maybeAutoIndex(documentIdRef.current, () => {
          try {
            return editorRef.current?.getJSON() ?? null;
          } catch {
            return null;
          }
        });
      } catch (error) {
        console.error('Save failed:', error);
        try {
          localStorage.setItem(queueKey, JSON.stringify({ content, at: Date.now() }));
        } catch {}
      }
    }, []);

    const debouncedSave = useCallback(() => {
      isDirtyRef.current = true;
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      // 2.5s trailing edge: Yjs carries realtime durability, so the REST
      // snapshot can trail typing instead of stringifying mid-burst.
      saveTimeoutRef.current = setTimeout(() => saveDocument(), 2500);
    }, [saveDocument]);

    useEffect(() => {
      const fragment = yDoc.getXmlFragment('default');
      const observer = () => {
        perfStats.updates++;
        debouncedSave();
      };
      fragment.observeDeep(observer);
      return () => { fragment.unobserveDeep(observer); };
    }, [yDoc, debouncedSave]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (isDirtyRef.current) saveDocument();
      }, 5000);
      const onOnline = () => {
        if (isDirtyRef.current) saveDocument();
      };
      window.addEventListener('online', onOnline);
      return () => {
        clearInterval(interval);
        window.removeEventListener('online', onOnline);
      };
    }, [saveDocument]);

    useEffect(() => {
      const handleBeforeUnload = () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        if (isDirtyRef.current) {
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

    const cursorProvider = useMemo(() => ({ awareness }), [awareness]);

    const extensions = useMemo(() => {
      const exts: any[] = [
        StarterKit.configure({ history: false }),
        Placeholder.configure({ placeholder: 'Start typing...' }),
        Underline,
        TextStyle,
        Color,
        FontFamily,
        FontSize,
        CustomTable,
        CustomTableRow,
        CustomTableCell,
        CustomTableHeader,
        Image.configure({ inline: true, allowBase64: true }),
        Link.configure({ openOnClick: true, HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' } }),
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
        Highlight.configure({ multicolor: true }),
        TaskList,
        TaskItem.configure({ nested: true }),
        Subscript,
        Superscript,
        EmojiSuggestion,
        ParagraphFocus,
        DocLink,
        DocLinkSuggest,
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
        onEditorReady?.(ed);
      },
    }, [extensions]);

    useEffect(() => {
      if (!synced || !initialContent || !editorRef.current || initialContentLoaded.current) return;
      const fragment = yDoc.getXmlFragment('default');
      if (fragment.length === 0 || (fragment.length === 1 && fragment.get(0).length === 0)) {
        try {
          editorRef.current.commands.setContent(initialContent);
          initialContentLoaded.current = true;
        } catch (error) {
          // Editor may have been recreated mid-effect (session load) — leave the
          // flag unset so a later run retries instead of stranding a blank doc.
          console.error('Initial content load failed, will retry:', error);
        }
      } else {
        initialContentLoaded.current = true;
      }
      // `connected` in deps retries seeding after reconnect/recreation races.
    }, [synced, initialContent, connected, yDoc]);

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
      <div className="min-h-screen pb-4 editor-wrapper">
        {showPerf && <PerfHud />}
        <div className="toolbar-area">
          <Toolbar editor={editor} />
        </div>
        <div className="max-w-4xl mx-auto my-4 editor-content-area">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
