'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { showSuccess, showError } from '@/lib/toast';
import { convertFile, importErrorMessage } from '@/lib/importDoc';

/**
 * Universal document import ($0): Word (.docx), Markdown, HTML and plain
 * text → editable TipTap document. Heavy parsers (mammoth) load lazily;
 * failures toast clearly; blank docs are never created.
 */
export function DocumentImport() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || busy) return;
    setBusy(true);
    try {
      const { json, title, skippedImages } = await convertFile(file);
      const { data } = await axios.post('/api/documents', { title, content: json });
      showSuccess(
        skippedImages > 0
          ? `Imported “${title}” (${skippedImages} oversized image${skippedImages === 1 ? '' : 's'} skipped)`
          : `Imported “${title}”`
      );
      router.push(`/documents/${data.id}`);
    } catch (err: any) {
      const code = typeof err?.message === 'string' ? err.message : '';
      showError(importErrorMessage(code));
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
        title="Import Word, Markdown, HTML or text"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
        Import
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".docx,.md,.markdown,.txt,.html,.htm"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </>
  );
}
