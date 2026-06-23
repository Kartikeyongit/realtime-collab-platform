'use client';

import { useMemo } from 'react';

interface TNode {
  type?: string;
  content?: TNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
  attrs?: Record<string, any>;
}

function renderText(n: TNode): string {
  if (n.type === 'text') return n.text || '';
  if (n.content) return n.content.map(renderText).join('');
  return '';
}

function renderMarkedText(n: TNode, i: number): React.ReactNode {
  const text = n.text || '';
  if (!text) return null;
  const marks = n.marks || [];
  let el: React.ReactNode = text;
  for (const m of marks) {
    switch (m.type) {
      case 'bold':      el = <strong key={i}>{el}</strong>; break;
      case 'italic':    el = <em key={i}>{el}</em>; break;
      case 'underline': el = <u key={i}>{el}</u>; break;
      case 'strike':    el = <s key={i}>{el}</s>; break;
      case 'code':      el = <code key={i} style={{ background: '#f0f0f0', padding: '1px 4px', borderRadius: 3, fontSize: '0.9em', fontFamily: 'monospace' }}>{el}</code>; break;
      case 'link':      el = <span key={i} style={{ color: '#0563C1' }}>{el}</span>; break;
    }
  }
  return el;
}

function renderInline(nodes: TNode[] | undefined): React.ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => {
    if (n.type === 'image') return <span key={i} style={{ fontSize: 16, opacity: 0.4 }}>🖼️</span>;
    if (n.type === 'hardBreak') return <br key={i} />;
    return renderMarkedText(n, i);
  });
}

function renderNode(n: TNode, key: number): React.ReactNode {
  switch (n.type) {
    case 'doc':
      return <div key={key}>{n.content?.map((c, i) => renderNode(c, i))}</div>;

    case 'paragraph': {
      const text = extractPlainText(n);
      if (!text) return null;
      return <p key={key} style={{ margin: '0 0 6px', lineHeight: 1.5, fontSize: 12 }}>{renderInline(n.content)}</p>;
    }

    case 'heading': {
      const level = n.attrs?.level || 1;
      const sizes: Record<number, number> = { 1: 16, 2: 14, 3: 13, 4: 12, 5: 11, 6: 11 };
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      return <Tag key={key} style={{ margin: '0 0 4px', fontWeight: 700, fontSize: sizes[level] || 13, lineHeight: 1.3 }}>{renderInline(n.content)}</Tag>;
    }

    case 'bulletList':
      return (
        <ul key={key} style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12, lineHeight: 1.5 }}>
          {n.content?.map((li, i) => (
            <li key={i}>{renderInline(li.content)}</li>
          ))}
        </ul>
      );

    case 'orderedList':
      return (
        <ol key={key} style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12, lineHeight: 1.5 }}>
          {n.content?.map((li, i) => (
            <li key={i}>{renderInline(li.content)}</li>
          ))}
        </ol>
      );

    case 'taskList':
      return (
        <ul key={key} style={{ margin: '0 0 6px', paddingLeft: 18, fontSize: 12, lineHeight: 1.5, listStyle: 'none' }}>
          {n.content?.map((li, i) => (
            <li key={i}>{li.attrs?.checked ? '☑ ' : '☐ '}{renderInline(li.content)}</li>
          ))}
        </ul>
      );

    case 'codeBlock':
      return (
        <pre key={key} style={{ margin: '0 0 6px', padding: '6px 8px', background: '#f5f5f5', borderRadius: 4, fontSize: 11, lineHeight: 1.4, overflow: 'hidden', fontFamily: 'monospace' }}>
          {n.content?.map(c => c.text).join('\n')}
        </pre>
      );

    case 'blockquote':
      return (
        <blockquote key={key} style={{ margin: '0 0 6px', paddingLeft: 10, borderLeft: '3px solid #ccc', fontSize: 12, lineHeight: 1.5, color: '#666' }}>
          {renderInline(n.content)}
        </blockquote>
      );

    case 'horizontalRule':
      return <hr key={key} style={{ margin: '6px 0', border: 'none', borderTop: '1px solid #eee' }} />;

    case 'image':
      return <div key={key} style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>🖼️ {n.attrs?.alt || 'Image'}</div>;

    default:
      if (n.content) {
        return <div key={key}>{n.content.map((c, i) => renderNode(c, i))}</div>;
      }
      return null;
  }
}

function extractPlainText(node: TNode): string {
  if (node.text) return node.text;
  if (node.content) return node.content.map(extractPlainText).join('');
  return '';
}

export function DocumentThumbnail({ content }: { content: any }) {
  const preview = useMemo(() => {
    try {
      if (!content || !content.content || !Array.isArray(content.content)) return null;
      const nodes = content.content.slice(0, 3);
      let hasContent = false;
      for (const n of nodes) {
        if (extractPlainText(n).trim() || n.type === 'image' || n.type === 'horizontalRule') {
          hasContent = true;
          break;
        }
      }
      if (!hasContent) return null;
      return nodes.map((n: TNode, i: number) => renderNode(n, i));
    } catch { return null; }
  }, [content]);

  return (
    <div style={{ height: 150, overflow: 'hidden', position: 'relative', padding: 16, background: '#fff' }}>
      <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#444' }}>
        {preview || <div style={{ color: '#bbb', fontSize: 12, fontStyle: 'italic' }}>Empty document</div>}
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom, transparent, white)', pointerEvents: 'none' }} />
    </div>
  );
}
