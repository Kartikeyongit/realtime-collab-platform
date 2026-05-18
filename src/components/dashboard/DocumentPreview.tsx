'use client';

import { useState, useEffect } from 'react';

interface DocumentPreviewProps {
  content: any;
  style?: React.CSSProperties;
}

export function DocumentPreview({ content, style }: DocumentPreviewProps) {
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    if (!content?.content) return;
    
    // Extract first few paragraphs of text
    const texts: string[] = [];
    const extractText = (nodes: any[]) => {
      for (const node of nodes) {
        if (node.type === 'text' && node.text) {
          texts.push(node.text);
        }
        if (node.content) {
          extractText(node.content);
        }
        if (texts.length >= 3) break;
      }
    };
    
    extractText(content.content);
    setPreviewText(texts.join(' ').substring(0, 120));
  }, [content]);

  if (!previewText) {
    return (
      <div style={{ 
        ...style,
        background: '#fafaf9', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#d6d3d1',
        fontSize: '12px',
      }}>
        Empty document
      </div>
    );
  }

  return (
    <div style={{
      ...style,
      background: '#fafaf9',
      padding: '12px',
      fontSize: '11px',
      color: '#78716c',
      lineHeight: 1.5,
      overflow: 'hidden',
      borderRadius: '8px',
      border: '1px solid #e7e5e4',
    }}>
      {previewText}{previewText.length >= 120 ? '...' : ''}
    </div>
  );
}
