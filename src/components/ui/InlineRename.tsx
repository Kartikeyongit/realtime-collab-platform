'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface InlineRenameProps {
  documentId: string;
  initialTitle: string;
  onRename?: (newTitle: string) => void;
  canRename?: boolean;
}

export function InlineRename({ documentId, initialTitle, onRename, canRename = true }: InlineRenameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const inputRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!isEditing) setTitle(initialTitle);
  }, [initialTitle, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const range = document.createRange();
      range.selectNodeContents(inputRef.current);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      inputRef.current.focus();
    }
  }, [isEditing]);

  const save = async () => {
    const trimmed = inputRef.current?.textContent?.trim() || title.trim();
    if (!trimmed) { setTitle(initialTitle); setIsEditing(false); return; }
    if (trimmed === initialTitle) { setIsEditing(false); return; }
    setTitle(trimmed);
    setIsEditing(false);
    try {
      await axios.patch(`/api/documents/${documentId}/rename`, { title: trimmed });
      onRename?.(trimmed);
    } catch {
      toast.error('Failed to rename');
      setTitle(initialTitle);
    }
  };

  if (!canRename) {
    return (
      <span style={{ fontWeight: 700, fontSize: '16px', color: '#1c1917', letterSpacing: '-0.02em', lineHeight: '1' }}>
        {title || 'Untitled'}
      </span>
    );
  }

  if (isEditing) {
    return (
      <span
        ref={inputRef}
        contentEditable
        suppressContentEditableWarning
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); inputRef.current?.blur(); }
          if (e.key === 'Escape') { setTitle(initialTitle); setIsEditing(false); }
        }}
        onBlur={save}
        style={{
          fontWeight: 700,
          fontSize: '16px',
          color: '#1c1917',
          letterSpacing: '-0.02em',
          lineHeight: '1',
          outline: 'none',
          border: 'none',
          background: 'transparent',
          display: 'inline',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      style={{
        fontWeight: 700,
        fontSize: '16px',
        color: '#1c1917',
        letterSpacing: '-0.02em',
        lineHeight: '1',
        cursor: 'pointer',
        display: 'inline',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: '400px',
        borderRadius: '3px',
        padding: '1px 3px',
        margin: '0 -3px',
        transition: 'background 0.15s ease',
        verticalAlign: 'middle',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f4'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      title="Click to rename"
    >
      {title || 'Untitled'}
    </span>
  );
}
