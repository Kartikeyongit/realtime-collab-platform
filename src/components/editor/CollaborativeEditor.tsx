'use client';

import { useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { CustomTable, CustomTableRow, CustomTableCell, CustomTableHeader } from './extensions/tableExtensions';
import { Toolbar } from './Toolbar';
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

    const saveDocument = useCallback(async () => {
      if (!editorRef.current) return;
      const content = editorRef.current.getJSON();
      if (!content?.content) return;
      
      try {
        await axios.put(`/api/documents/${documentId}`, { content });
      } catch (error) {
        console.error('Save failed:', error);
      }
    }, [documentId]);

    const debouncedSave = useCallback(() => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveDocument(), 2000);
    }, [saveDocument]);

    const editor = useEditor({
      extensions: [
        StarterKit,
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
      ],
      content: initialContent || { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Start typing...' }] }] },
      editorProps: {
        attributes: {
          class: 'prose max-w-none focus:outline-none min-h-[500px] px-8 py-4',
        },
      },
      onUpdate: () => debouncedSave(),
      onCreate: ({ editor: ed }) => {
        editorRef.current = ed;
        onEditorReady?.(ed);
        onConnectionChange?.(true);
      },
    }, [initialContent]);

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
