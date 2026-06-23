'use client';

import { Editor } from '@tiptap/react';
import { useCallback, useRef, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Code2,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Undo, Redo, Image, Link,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Minus, Table, CheckSquare,
  Subscript, Superscript, RemoveFormatting,
  Indent, Outdent, Focus,
  Rows, Columns,
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';

const FONT_FAMILIES = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana',
  'Helvetica', 'Tahoma', 'Trebuchet MS', 'Impact',
];
const FONT_SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  const [focusMode, setFocusMode] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState('');

  if (!editor) return null;

  const toggleFocus = useCallback(() => {
    const next = !focusMode;
    setFocusMode(next);
    document.body.classList.toggle('editor-focus', next);
  }, [focusMode]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      editor.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);

  const tools = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: () => editor.isActive('bold') },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: () => editor.isActive('italic') },
    { icon: Underline, action: () => editor.chain().focus().toggleUnderline().run(), active: () => editor.isActive('underline') },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: () => editor.isActive('strike') },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), active: () => editor.isActive('code') },
    { icon: Highlighter, action: () => editor.chain().focus().toggleHighlight().run(), active: () => editor.isActive('highlight') },
  ];

  const headings = [
    { icon: Heading1, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: () => editor.isActive('heading', { level: 1 }) },
    { icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: () => editor.isActive('heading', { level: 2 }) },
    { icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: () => editor.isActive('heading', { level: 3 }) },
    { icon: Heading4, action: () => editor.chain().focus().toggleHeading({ level: 4 }).run(), active: () => editor.isActive('heading', { level: 4 }) },
    { icon: Heading5, action: () => editor.chain().focus().toggleHeading({ level: 5 }).run(), active: () => editor.isActive('heading', { level: 5 }) },
    { icon: Heading6, action: () => editor.chain().focus().toggleHeading({ level: 6 }).run(), active: () => editor.isActive('heading', { level: 6 }) },
  ];

  const aligns = [
    { icon: AlignLeft, action: () => editor.chain().focus().setTextAlign('left').run(), active: () => editor.isActive({ textAlign: 'left' }) },
    { icon: AlignCenter, action: () => editor.chain().focus().setTextAlign('center').run(), active: () => editor.isActive({ textAlign: 'center' }) },
    { icon: AlignRight, action: () => editor.chain().focus().setTextAlign('right').run(), active: () => editor.isActive({ textAlign: 'right' }) },
  ];

  const lists = [
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: () => editor.isActive('bulletList') },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: () => editor.isActive('orderedList') },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), active: () => editor.isActive('taskList') },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: () => editor.isActive('blockquote') },
  ];

  const isTable = editor.isActive('table');

  const ToolButton = ({ icon: Icon, action, active, title }: any) => (
    <button
      onClick={action}
      onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); action(); }}
      style={{
        padding: '6px 7px', border: 'none',
        background: active() ? '#fff7ed' : 'transparent',
        color: active() ? '#f97316' : '#78716c',
        borderRadius: '8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease', fontSize: '14px', flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!active()) e.currentTarget.style.background = '#f5f5f4'; }}
      onMouseLeave={(e) => { if (!active()) e.currentTarget.style.background = 'transparent'; }}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  const Select = ({ value, onChange, options, title }: any) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      style={{
        padding: '4px 6px', border: '1px solid #e7e5e4', borderRadius: '8px',
        background: 'white', fontSize: '12px', color: '#57534e', cursor: 'pointer',
        maxWidth: '110px', flexShrink: 0,
      }}
    >
      <option value="">{title}</option>
      {options.map((o: string) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  );

  const Divider = () => <div style={{ width: '1px', height: '20px', background: '#e7e5e4', margin: '0 3px', flexShrink: 0 }} />;

  return (
    <div style={{
      background: 'white', borderBottom: '1.5px solid #e7e5e4',
      padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '1px',
      overflowX: 'auto', flexShrink: 0,
    }}>
      {tools.map((t, i) => <ToolButton key={`t-${i}`} {...t} />)}
      <Divider />
      {headings.map((t, i) => <ToolButton key={`h-${i}`} {...t} />)}
      <Divider />
      {aligns.map((t, i) => <ToolButton key={`a-${i}`} {...t} />)}
      <Divider />
      {lists.map((t, i) => <ToolButton key={`l-${i}`} {...t} />)}
      <Divider />
      <ToolButton icon={Table} action={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} active={() => editor.isActive('table')} title="Table" />
      <ToolButton icon={Image} action={() => imageInputRef.current?.click()} active={() => false} title="Insert image" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      <ToolButton icon={Link} action={() => { const url = prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} active={() => editor.isActive('link')} title="Link" />
      <ToolButton icon={Minus} action={() => editor.chain().focus().setHorizontalRule().run()} active={() => false} title="Horizontal rule" />
      <Divider />
      {isTable && (
        <>
          <ToolButton icon={Columns} title="Add column after" action={() => editor.chain().focus().addColumnAfter().run()} active={() => false} />
          <ToolButton icon={Columns} title="Add column before" action={() => editor.chain().focus().addColumnBefore().run()} active={() => false} />
          <ToolButton icon={Rows} title="Add row after" action={() => editor.chain().focus().addRowAfter().run()} active={() => false} />
          <ToolButton icon={Rows} title="Add row before" action={() => editor.chain().focus().addRowBefore().run()} active={() => false} />
          <ToolButton icon={RemoveFormatting} title="Delete column" action={() => editor.chain().focus().deleteColumn().run()} active={() => false} />
          <ToolButton icon={RemoveFormatting} title="Delete row" action={() => editor.chain().focus().deleteRow().run()} active={() => false} />
          <Divider />
        </>
      )}
      <Select value={fontFamily} onChange={(v: string) => { setFontFamily(v); editor.chain().focus().setFontFamily(v).run(); }} options={FONT_FAMILIES} title="Font" />
      <Select value={fontSize} onChange={(v: string) => { setFontSize(v); editor.chain().focus().setFontSize(v).run(); }} options={FONT_SIZES} title="Size" />
      <ColorPicker
        currentColor={editor.getAttributes('textStyle').color}
        onColorChange={(c) => editor.chain().focus().setColor(c).run()}
        onRemoveColor={() => editor.chain().focus().unsetColor().run()}
      />
      <Divider />
      <ToolButton icon={Subscript} action={() => editor.chain().focus().toggleSubscript().run()} active={() => editor.isActive('subscript')} title="Subscript" />
      <ToolButton icon={Superscript} action={() => editor.chain().focus().toggleSuperscript().run()} active={() => editor.isActive('superscript')} title="Superscript" />
      <ToolButton icon={Code2} action={() => editor.chain().focus().toggleCodeBlock().run()} active={() => editor.isActive('codeBlock')} title="Code block" />
      <ToolButton icon={Indent} action={() => editor.chain().focus().sinkListItem('listItem').run()} active={() => false} title="Indent" />
      <ToolButton icon={Outdent} action={() => editor.chain().focus().liftListItem('listItem').run()} active={() => false} title="Outdent" />
      <EmojiPicker onSelect={(emoji) => editor.chain().focus().insertContent(emoji).run()} />
      <div style={{ flex: 1 }} />
      <ToolButton icon={RemoveFormatting} action={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} active={() => false} title="Clear formatting" />
      <ToolButton icon={Focus} action={toggleFocus} active={() => focusMode} title="Focus mode" />
      <ToolButton icon={Undo} action={() => editor.commands.undo()} active={() => false} title="Undo" />
      <ToolButton icon={Redo} action={() => editor.commands.redo()} active={() => false} title="Redo" />
    </div>
  );
}
