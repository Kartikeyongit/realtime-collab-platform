'use client';

import { useRef, useState } from 'react';
import { marked } from 'marked';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/lib/toast';

/**
 * Markdown import ($0, zero *new* runtime behavior beyond the tiny
 * @tiptap/html parser): .md/.txt → HTML via marked → TipTap JSON →
 * new document. Failures toast clearly; blank docs are never created.
 */
export function MarkdownImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    if (file.size > 1024 * 1024) {
      showError('File too large — 1MB max for import');
      return;
    }
    setBusy(true);
    try {
      const text = await file.text();
      if (!text.trim()) throw new Error('empty file');
      const html = marked.parse(text, { breaks: true, async: false }) as string;
      const json = generateJSON(html, [
        StarterKit.configure({ history: false }),
        Underline,
        Link.configure({ openOnClick: false }),
        Highlight.configure({ multicolor: true }),
        TaskList,
        TaskItem.configure({ nested: true }),
      ]);
      const hasContent =
        Array.isArray((json as any)?.content) && (json as any).content.length > 0;
      if (!hasContent) throw new Error('nothing importable');
      const title = file.name.replace(/\.(md|markdown|txt)$/i, '').replace(/[-_]+/g, ' ').trim() || 'Imported document';
      const { data } = await axios.post('/api/documents', { title: title.slice(0, 120), content: json });
      showSuccess(`Imported “${title}”`);
      router.push(`/documents/${data.id}`);
    } catch {
      showError('Could not import that file — is it markdown or plain text?');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <button
        className="btn btn-secondary btn-sm dash-filter"
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        title="Import a Markdown or text file"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );
}
