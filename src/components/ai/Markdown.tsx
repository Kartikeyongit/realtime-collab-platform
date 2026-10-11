'use client';

import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

/** Render untrusted model markdown safely (XSS-sanitized) in app styling. */
export function Markdown({ text, compact = false }: { text: string; compact?: boolean }) {
  const html = useMemo(() => {
    let raw: string;
    try {
      raw = marked.parse(text || '', { breaks: true, async: false }) as string;
    } catch {
      raw = (text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    }
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4',
        'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    });
  }, [text]);

  return (
    <div
      className={compact ? 'md-compact' : 'md'}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
