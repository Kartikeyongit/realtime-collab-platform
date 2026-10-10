'use client';

import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';

interface WordCountProps {
  editor: Editor | null;
}

function countOf(text: string) {
  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, chars };
}

export function WordCount({ editor }: WordCountProps) {
  const [counts, setCounts] = useState({ words: 0, chars: 0 });

  useEffect(() => {
    if (!editor) return;

    const updateCounts = () => {
      const { words, chars } = countOf(editor.state.doc.textContent);
      // Bail out without re-render when nothing changed.
      setCounts((prev) => (prev.words === words && prev.chars === chars ? prev : { words, chars }));
    };

    editor.on('update', updateCounts);
    updateCounts();

    // Safety net: Yjs-driven content (template seeding, session-load editor
    // recreation, slow/cold WebSocket sync, IndexedDB restore) can land without
    // an `update` event ever reaching this listener. Recompute periodically so
    // the count can never stick stale — cheap (one text read/sec) and silent
    // when unchanged thanks to the bail-out above.
    const pollTimer = setInterval(updateCounts, 1000);

    return () => {
      editor.off('update', updateCounts);
      clearInterval(pollTimer);
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
