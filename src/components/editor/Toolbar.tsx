'use client';

import { Editor } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Bold, Italic, Underline, Strikethrough,
  List, ListOrdered, Quote, Code, Code2,
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  Undo, Redo, Image, Link,
  AlignLeft, AlignCenter, AlignRight,
  Highlighter, Minus, Table, CheckSquare,
  Subscript, Superscript, RemoveFormatting,
  Indent, Outdent, Focus,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { ColorPicker } from './ColorPicker';
import { EmojiPicker } from './EmojiPicker';

const FONT_FAMILIES = [
  'Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana',
  'Helvetica', 'Tahoma', 'Trebuchet MS', 'Impact',
];
const FONT_SIZES = ['10', '11', '12', '13', '14', '16', '18', '20', '24', '28', '32', '36', '48', '72'];

function cssFontName(name: string) {
  return name.includes(' ') ? `"${name}"` : name;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  title: string;
  /** Shown when no explicit attribute is set (the document default). */
  fallback?: string;
}

function DropdownPicker({ value, onChange, options, title, fallback }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({ display: 'none' });
  const shown = value || fallback || title;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      let left = rect.left;
      const popoverWidth = 170;
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left,
        zIndex: 30,
        background: 'white',
        border: '1.5px solid #e7e5e4',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        padding: '4px',
        maxHeight: '280px',
        overflowY: 'auto',
        minWidth: popoverWidth + 'px',
      });
    }
    setOpen(true);
  };

  return (
    <div style={{ display: 'inline-flex', position: 'static' }}>
      <button
        ref={triggerRef}
        onClick={() => open ? setOpen(false) : openPopover()}
        onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
        style={{
          padding: '6px 7px', border: 'none', background: open ? '#fff7ed' : 'transparent',
          color: '#78716c', borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', flexShrink: 0,
          outline: 'none', maxWidth: '100px',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent'; }}
        title={shown}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {shown}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpen(false)} />
          <div ref={popoverRef} style={popoverStyle}>
            <button
              onClick={() => { onChange(''); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', fontSize: '13px',
                padding: '6px 10px', border: 'none', background: value === '' ? '#fff7ed' : 'none',
                color: value === '' ? '#c2410c' : '#78716c', cursor: 'pointer', borderRadius: '6px',
                fontWeight: value === '' ? 600 : 400,
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
              onMouseLeave={(e) => e.currentTarget.style.background = value === '' ? '#fff7ed' : 'none'}
            >
              Default{fallback ? ` (${fallback})` : ''}
            </button>
            {options.map((o) => (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '6px 10px', border: 'none', background: value === o ? '#fff7ed' : 'none',
                  color: '#292524', cursor: 'pointer', borderRadius: '6px',
                  fontFamily: title === 'Font' ? cssFontName(o) : undefined,
                  fontSize: title === 'Size' ? Number(o) + 'px' : '13px',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'}
                onMouseLeave={(e) => e.currentTarget.style.background = value === o ? '#fff7ed' : 'none'}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface ToolbarProps {
  editor: Editor | null;
}

const GRID_MAX = 8;

function TableMenu({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ r: 3, c: 3 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({ display: 'none' });
  const inTable = editor.isActive('table');

  const openPopover = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPopoverStyle({
        position: 'fixed',
        top: rect.bottom + 6,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - 260)),
        zIndex: 30,
        background: 'white',
        border: '1.5px solid #e7e5e4',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(28,25,23,0.12)',
        padding: '12px',
        width: '236px',
      });
    }
    setHover({ r: 3, c: 3 });
    setOpen(true);
  };

  const insertAt = (r: number, c: number) => {
    editor.chain().focus().insertTable({ rows: r, cols: c, withHeaderRow: true }).run();
    setOpen(false);
  };

  const structBtn = (label: string, danger: boolean, action: () => void) => (
    <button
      key={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={action}
      onMouseEnter={(e) => { e.currentTarget.style.background = danger ? '#fef2f2' : '#fff7ed'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      style={{
        display: 'block', width: '100%', textAlign: 'left', fontSize: '13px',
        padding: '7px 10px', border: 'none', background: 'transparent',
        color: danger ? '#dc2626' : '#44403c', cursor: 'pointer', borderRadius: '8px',
      }}
    >
      {label}
    </button>
  );

  const run = (fn: () => void) => () => { fn(); };

  return (
    <div style={{ display: 'inline-flex', position: 'static' }}>
      <button
        ref={triggerRef}
        onClick={() => (open ? setOpen(false) : openPopover())}
        onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
        style={{
          padding: '6px 7px', border: 'none', background: open || inTable ? '#fff7ed' : 'transparent',
          color: open || inTable ? '#f97316' : '#78716c',
          borderRadius: '8px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', flexShrink: 0, outline: 'none',
        }}
        onMouseEnter={(e) => { if (!open && !inTable) e.currentTarget.style.background = '#f5f5f4'; }}
        onMouseLeave={(e) => { if (!open && !inTable) e.currentTarget.style.background = 'transparent'; }}
        title={inTable ? 'Table options' : 'Insert table'}
      >
        <Table size={16} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 20 }} onClick={() => setOpen(false)} />
          <div style={popoverStyle}>
            {!inTable ? (
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Insert table
                </div>
                <div
                  style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_MAX}, 1fr)`, gap: 3, marginBottom: 8 }}
                  onMouseLeave={() => setHover({ r: 0, c: 0 })}
                >
                  {Array.from({ length: GRID_MAX * GRID_MAX }, (_, i) => {
                    const r = Math.floor(i / GRID_MAX) + 1;
                    const c = (i % GRID_MAX) + 1;
                    const lit = r <= hover.r && c <= hover.c;
                    return (
                      <div
                        key={i}
                        onMouseEnter={() => setHover({ r, c })}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => insertAt(r, c)}
                        style={{
                          aspectRatio: '1',
                          borderRadius: 4,
                          border: '1.5px solid',
                          borderColor: lit ? '#f97316' : '#e7e5e4',
                          background: lit ? '#ffedd5' : '#fafaf9',
                          cursor: 'pointer',
                        }}
                      />
                    );
                  })}
                </div>
                <div style={{ fontSize: '13px', color: '#44403c', textAlign: 'center' }}>
                  {hover.r > 0 ? `${hover.r} × ${hover.c} table` : 'Hover to choose size'}
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  Row
                </div>
                {structBtn('Add row above', false, run(() => editor.chain().focus().addRowBefore().run()))}
                {structBtn('Add row below', false, run(() => editor.chain().focus().addRowAfter().run()))}
                {structBtn('Delete row', true, run(() => editor.chain().focus().deleteRow().run()))}
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 4px' }}>
                  Column
                </div>
                {structBtn('Add column left', false, run(() => editor.chain().focus().addColumnBefore().run()))}
                {structBtn('Add column right', false, run(() => editor.chain().focus().addColumnAfter().run()))}
                {structBtn('Delete column', true, run(() => editor.chain().focus().deleteColumn().run()))}
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 4px' }}>
                  Table
                </div>
                {structBtn('Toggle header row', false, run(() => editor.chain().focus().toggleHeaderRow().run()))}
                {structBtn('Delete table', true, run(() => { editor.chain().focus().deleteTable().run(); setOpen(false); }))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export function Toolbar({ editor }: ToolbarProps) {
  const [focusMode, setFocusMode] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [fontFamily, setFontFamily] = useState('');
  const [fontSize, setFontSize] = useState('');

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      setFontFamily(editor.getAttributes('textStyle')?.fontFamily || '');
      setFontSize(editor.getAttributes('fontSize')?.size || '');
    };
    update();
    editor.on('selectionUpdate', update);
    editor.on('update', update);
    return () => { editor.off('selectionUpdate', update); editor.off('update', update); };
  }, [editor]);

  useEffect(() => {
    if (!focusMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusMode(false);
        document.body.classList.remove('editor-focus');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusMode]);

  if (!editor) return null;

  const toggleFocus = useCallback(() => {
    const next = !focusMode;
    setFocusMode(next);
    document.body.classList.toggle('editor-focus', next);
  }, [focusMode]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Neon-free guard: base64 images bloat Postgres — cap at 2MB client-side ($0).
    if (file.size > 2 * 1024 * 1024) {
      alert('Image too large (max 2MB to keep free DB small). Please compress first.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      editor.chain().focus().setImage({ src: url }).run();
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [editor]);

  interface ToolButtonProps {
    icon: LucideIcon;
    action: () => void;
    active: () => boolean;
    title?: string;
  }

  const ToolButton = ({ icon: Icon, action, active, title }: ToolButtonProps) => (
    <button
      onClick={action}
      onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
      style={{
        padding: '6px 7px', border: 'none',
        background: active() ? '#fff7ed' : 'transparent',
        color: active() ? '#f97316' : '#78716c',
        borderRadius: '8px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease', fontSize: '14px', flexShrink: 0,
        outline: 'none',
      }}
      onMouseEnter={(e) => { if (!active()) e.currentTarget.style.background = '#f5f5f4'; }}
      onMouseLeave={(e) => { if (!active()) e.currentTarget.style.background = 'transparent'; }}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  const Divider = () => <div style={{ width: '1px', height: '20px', background: '#e7e5e4', margin: '0 3px', flexShrink: 0 }} />;

  return (
    <div className="toolbar-scroll toolbar-strip" style={{
      background: 'white', borderBottom: '1.5px solid #e7e5e4',
      display: 'flex', alignItems: 'stretch', flexShrink: 0,
    }}>
      {/* Scrollable tools — single strip on all screens, safe for mobile (overflowX auto) */}
      <div className="toolbar-scroll-inner" style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '1px',
        padding: '6px 12px', overflowX: 'auto',
        scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch',
      }}>
      <ToolButton icon={Bold} action={() => editor.chain().focus().toggleBold().run()} active={() => editor.isActive('bold')} title="Bold (Ctrl+B)" />
      <ToolButton icon={Italic} action={() => editor.chain().focus().toggleItalic().run()} active={() => editor.isActive('italic')} title="Italic (Ctrl+I)" />
      <ToolButton icon={Underline} action={() => editor.chain().focus().toggleUnderline().run()} active={() => editor.isActive('underline')} title="Underline (Ctrl+U)" />
        <ToolButton icon={Strikethrough} action={() => editor.chain().focus().toggleStrike().run()} active={() => editor.isActive('strike')} title="Strikethrough" />
        <ToolButton icon={Code} action={() => editor.chain().focus().toggleCode().run()} active={() => editor.isActive('code')} title="Inline code" />
        <ToolButton icon={Highlighter} action={() => editor.chain().focus().toggleHighlight().run()} active={() => editor.isActive('highlight')} title="Highlight" />
      <Divider />
      <ToolButton icon={Heading1} action={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={() => editor.isActive('heading', { level: 1 })} title="H1" />
      <ToolButton icon={Heading2} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={() => editor.isActive('heading', { level: 2 })} title="H2" />
      <ToolButton icon={Heading3} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={() => editor.isActive('heading', { level: 3 })} title="H3" />
        <ToolButton icon={Heading4} action={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={() => editor.isActive('heading', { level: 4 })} title="H4" />
        <ToolButton icon={Heading5} action={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} active={() => editor.isActive('heading', { level: 5 })} title="H5" />
        <ToolButton icon={Heading6} action={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} active={() => editor.isActive('heading', { level: 6 })} title="H6" />
        <Divider />
        <ToolButton icon={AlignLeft} action={() => editor.chain().focus().setTextAlign('left').run()} active={() => editor.isActive({ textAlign: 'left' })} title="Align left" />
        <ToolButton icon={AlignCenter} action={() => editor.chain().focus().setTextAlign('center').run()} active={() => editor.isActive({ textAlign: 'center' })} title="Align center" />
        <ToolButton icon={AlignRight} action={() => editor.chain().focus().setTextAlign('right').run()} active={() => editor.isActive({ textAlign: 'right' })} title="Align right" />
      <Divider />
      <ToolButton icon={List} action={() => editor.chain().focus().toggleBulletList().run()} active={() => editor.isActive('bulletList')} title="Bullet list" />
      <ToolButton icon={ListOrdered} action={() => editor.chain().focus().toggleOrderedList().run()} active={() => editor.isActive('orderedList')} title="Ordered list" />
      <ToolButton icon={CheckSquare} action={() => editor.chain().focus().toggleTaskList().run()} active={() => editor.isActive('taskList')} title="Tasks" />
      <ToolButton icon={Quote} action={() => editor.chain().focus().toggleBlockquote().run()} active={() => editor.isActive('blockquote')} title="Quote" />
      <Divider />
      {/* Insert group */}
      <TableMenu editor={editor} />
      <ToolButton icon={Image} action={() => imageInputRef.current?.click()} active={() => false} title="Insert image (max 2MB)" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
      <ToolButton icon={Link} action={() => { const url = prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }} active={() => editor.isActive('link')} title="Link" />
        <ToolButton icon={Minus} action={() => editor.chain().focus().setHorizontalRule().run()} active={() => false} title="Horizontal rule" />
      <Divider />
        <DropdownPicker value={fontFamily} onChange={(v: string) => { setFontFamily(v); if (v) editor.chain().focus().setFontFamily(v).run(); else editor.chain().focus().unsetFontFamily().run(); }} options={FONT_FAMILIES} title="Font" fallback="Inter" />
        <DropdownPicker value={fontSize} onChange={(v: string) => { setFontSize(v); if (v) editor.chain().focus().setFontSize(v).run(); else editor.chain().focus().unsetFontSize().run(); }} options={FONT_SIZES} title="Size" fallback="16" />
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
        <ToolButton icon={RemoveFormatting} action={() => editor.chain().focus().unsetAllMarks().clearNodes().run()} active={() => false} title="Clear formatting" />
        <button
          onClick={toggleFocus}
          onMouseDown={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); }}
          data-focus-toggle="true"
          style={{
            padding: '6px 7px', border: 'none',
            background: focusMode ? '#fff7ed' : 'transparent',
            color: focusMode ? '#f97316' : '#78716c',
            borderRadius: '8px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease', fontSize: '14px', flexShrink: 0,
            outline: 'none',
          }}
          onMouseEnter={(e) => { if (!focusMode) e.currentTarget.style.background = '#f5f5f4'; }}
          onMouseLeave={(e) => { if (!focusMode) e.currentTarget.style.background = 'transparent'; }}
          title="Focus mode"
        >
          <Focus size={16} />
        </button>
      </div>
      {/* Fixed undo/redo on right end — always visible, never scrolls away */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0, padding: '6px 12px 6px 8px', background: 'white', borderLeft: '1.5px solid #e7e5e4' }}>
        <ToolButton icon={Undo} action={() => editor.commands.undo()} active={() => false} title="Undo (Ctrl+Z)" />
        <ToolButton icon={Redo} action={() => editor.commands.redo()} active={() => false} title="Redo (Ctrl+Y)" />
      </div>
    </div>
  );
}
