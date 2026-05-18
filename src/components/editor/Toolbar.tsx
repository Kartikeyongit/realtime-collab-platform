'use client';

import { Editor } from '@tiptap/react';
import { useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code,
  Heading1, Heading2, Heading3,
  Undo, Redo, Image, Link,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Minus, Table
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [showInsert, setShowInsert] = useState(false);

  if (!editor) return null;

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: () => editor.isActive('bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: () => editor.isActive('italic') },
    { icon: Underline, action: () => editor.chain().focus().toggleUnderline().run(), active: () => editor.isActive('underline') },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: () => editor.isActive('strike') },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: () => editor.isActive('highlight') },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: () => editor.isActive('code') },
  ];

  const headings = [
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: () => editor.isActive('heading', { level: 1 }) },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive('heading', { level: 2 }) },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive('heading', { level: 3 }) },
  ];

  const aligns = [
    { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), active: () => editor.isActive({ textAlign: 'left' }) },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), active: () => editor.isActive({ textAlign: 'center' }) },
    { icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), active: () => editor.isActive({ textAlign: 'right' }) },
  ];

  const lists = [
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: () => editor.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive('orderedList') },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: () => editor.isActive('blockquote') },
  ];

  const ToolButton = ({ icon: Icon, action, active, onMouseDown }: any) => (
    <button
      onClick={action}
      onMouseDown={onMouseDown}
      style={{
        padding: '6px 8px',
        border: 'none',
        background: active() ? '#fff7ed' : 'transparent',
        color: active() ? '#f97316' : '#78716c',
        borderRadius: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.15s ease',
        fontSize: '14px',
      }}
      onMouseEnter={(e) => { if (!active()) e.currentTarget.style.background = '#f5f5f4'; }}
      onMouseLeave={(e) => { if (!active()) e.currentTarget.style.background = 'transparent'; }}
    >
      <Icon size={16} />
    </button>
  );

  const Divider = () => <div style={{ width: '1px', height: '20px', background: '#e7e5e4', margin: '0 2px' }} />;

  return (
    <div style={{ 
      background: 'white', 
      borderBottom: '1.5px solid #e7e5e4', 
      padding: '6px 16px',
      display: 'flex', 
      alignItems: 'center', 
      gap: '1px',
      flexWrap: 'wrap',
      position: 'sticky',
      top: 0,
      zIndex: 10,
    }}>
      {tools.map((t, i) => <ToolButton key={`t-${i}`} {...t} />)}
      <Divider />
      {headings.map((t, i) => <ToolButton key={`h-${i}`} {...t} />)}
      <Divider />
      {aligns.map((t, i) => <ToolButton key={`a-${i}`} {...t} />)}
      <Divider />
      {lists.map((t, i) => <ToolButton key={`l-${i}`} {...t} />)}
      
      <Divider />
      
      {/* Insert menu */}
      <div style={{ position: 'relative' }}>
        <ToolButton 
          icon={Table} 
          action={() => setShowInsert(!showInsert)} 
          active={() => showInsert}
        />
        
        {showInsert && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setShowInsert(false)} />
            <div style={{ 
              position: 'absolute', top: '100%', left: 0, marginTop: '4px',
              background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)', padding: '4px', minWidth: '180px', zIndex: 30
            }}>
              <button onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setShowInsert(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '8px', color: '#44403c' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                <Table size={14} /> Table
              </button>
              <button onClick={() => { const url = prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run(); setShowInsert(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '8px', color: '#44403c' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                <Image size={14} /> Image
              </button>
              <button onClick={() => { const url = prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); setShowInsert(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '8px', color: '#44403c' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                <Link size={14} /> Link
              </button>
              <button onClick={() => { editor.chain().focus().setHorizontalRule().run(); setShowInsert(false); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px', borderRadius: '8px', color: '#44403c' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}>
                <Minus size={14} /> Divider
              </button>
            </div>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <ToolButton 
        icon={Undo} 
        action={() => {}} 
        onMouseDown={(e: React.MouseEvent) => {
          e.preventDefault();
          editor.commands.undo();
        }}
        active={() => false} 
      />
      <ToolButton 
        icon={Redo} 
        action={() => {}} 
        onMouseDown={(e: React.MouseEvent) => {
          e.preventDefault();
          editor.commands.redo();
        }}
        active={() => false} 
      />
    </div>
  );
}
