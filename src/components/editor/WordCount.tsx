'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

interface WordCountProps {
  editor: Editor | null;
}

export function WordCount({ editor }: WordCountProps) {
  const [counts, setCounts] = useState({ words: 0, chars: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateCounts = () => {
      const text = editor.state.doc.textContent;
      const chars = text.length;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setCounts({ words, chars });
    };

    editor.on('update', updateCounts);
    updateCounts();

    return () => {
      editor.off('update', updateCounts);
    };
  }, [editor]);

  if (!editor) return null;

  return (
    <span style={{ fontSize: '11px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{counts.words} words</span>
      <span style={{ color: '#d6d3d1' }}>·</span>
      <span>{counts.chars} chars</span>
    </span>
  );
}
