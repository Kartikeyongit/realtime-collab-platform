'use client';

import { useEffect, useState, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
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
import { useSession } from 'next-auth/react';
import axios from 'axios';
import { History } from '@tiptap/extension-history';

let Y: any = null;
let WebsocketProvider: any = null;

if (typeof window !== 'undefined') {
  Y = require('yjs');
  WebsocketProvider = require('y-websocket').WebsocketProvider;
}

interface CollaborativeEditorProps {
  documentId: string;
  initialContent?: any;
  onEditorReady?: (editor: Editor) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export const CollaborativeEditor = forwardRef<any, CollaborativeEditorProps>(
  function CollaborativeEditor({ documentId, initialContent, onEditorReady, onConnectionChange }, ref) {
    const { data: session } = useSession();
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const editorRef = useRef<Editor | null>(null);

    const yDoc = useMemo(() => {
      if (typeof window !== 'undefined' && Y) {
        const doc = new Y.Doc();
        // Set up undo manager on the Yjs document
        return doc;
      }
      return null;
    }, []);

    const provider = useMemo(() => {
      if (typeof window !== 'undefined' && yDoc && WebsocketProvider) {
        const wsProvider = new WebsocketProvider(
          process.env.NEXT_PUBLIC_YJS_URL || 'ws://localhost:1234',
          `document-${documentId}`,
          yDoc,
          { connect: true, maxBackoffTime: 2500 }
        );

        wsProvider.awareness.setLocalState({
          user: {
            name: session?.user?.name || 'Anonymous',
            color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          },
        });

        wsProvider.on('status', (event: { status: string }) => {
          onConnectionChange?.(event.status === 'connected');
        });

        return wsProvider;
      }
      return null;
    }, [yDoc, documentId, session]);

    const yXmlFragment = useMemo(() => {
      if (yDoc) return yDoc.getXmlFragment('prosemirror');
      return null;
    }, [yDoc]);

    const saveDocument = useCallback(async () => {
      if (!yDoc) return;
      const content = yDoc.getXmlFragment('prosemirror').toJSON();
      if (!content?.content || content.content.length === 0) return;
      try {
        await axios.put(`/api/documents/${documentId}`, { content });
      } catch (error) {
        console.error('Save failed:', error);
      }
    }, [documentId, yDoc]);

    const debouncedSave = useCallback(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveDocument(), 3000);
    }, [saveDocument]);

    const editor = useEditor({
      extensions: [
        StarterKit.configure({ history: false }),
        History,
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
        ...(yXmlFragment && provider ? [
          Collaboration.configure({ document: yDoc, field: 'prosemirror' }),
          CollaborationCursor.configure({ provider, user: { name: session?.user?.name || 'Anon', color: '#f97316' } }),
        ] : []),
      ],
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[500px] px-8 py-4',
        },
      },
      onUpdate: () => debouncedSave(),
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
        onEditorReady?.(ed);      
      },
    }, [yXmlFragment, provider, session]);

    useImperativeHandle(ref, () => ({
      get editor() { return editorRef.current; }
    }), []);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveDocument();
        }
        // Ctrl+Z and Ctrl+Y are handled by Yjs undo manager automatically
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveDocument]);

    useEffect(() => {
      return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        provider?.destroy();
        yDoc?.destroy();
      };
    }, [provider, yDoc]);

    if (!editor) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-white pb-4">
        <Toolbar editor={editor} />
        <div className="max-w-4xl mx-auto mt-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    );
  }
);
