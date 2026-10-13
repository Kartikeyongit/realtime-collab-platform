// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { ParagraphFocus } from './ParagraphFocus';

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
});

function dimmedIndices(): boolean[] {
  const kids = Array.from(editor!.view.dom.children);
  return kids.map((el) => (el as HTMLElement).classList.contains('focus-dim'));
}

describe('ParagraphFocus', () => {
  it('dims every block except the active one, and keeps membership while typing', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: [StarterKit, ParagraphFocus],
      content: '<p>one</p><p>two</p><p>three</p>',
    });
    // No dimming before enabling.
    expect(dimmedIndices()).toEqual([false, false, false]);

    editor.commands.setTextSelection(2);
    editor.commands.setParagraphFocus(true);
    expect(dimmedIndices()).toEqual([false, true, true]);

    // Typing inside the active block must preserve dim membership
    // (mapped, not rebuilt — the perf fix).
    editor.chain().focus().insertContent(' hello').run();
    expect(dimmedIndices()).toEqual([false, true, true]);
  });

  it('moves the bright block when the cursor crosses blocks', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: [StarterKit, ParagraphFocus],
      content: '<p>one</p><p>two</p><p>three</p>',
    });
    editor.commands.setParagraphFocus(true);
    // Cursor at doc start area (first block active).
    editor.commands.setTextSelection(1);
    expect(dimmedIndices()[0]).toBe(false);
    // Jump into the last block.
    const end = editor.state.doc.content.size - 1;
    editor.commands.setTextSelection(end);
    const dimmed = dimmedIndices();
    expect(dimmed[2]).toBe(false);
    expect(dimmed.filter(Boolean).length).toBe(2);
  });

  it('clears all dimming when disabled', () => {
    editor = new Editor({
      element: document.createElement('div'),
      extensions: [StarterKit, ParagraphFocus],
      content: '<p>one</p><p>two</p>',
    });
    editor.commands.setParagraphFocus(true);
    expect(dimmedIndices().some(Boolean)).toBe(true);
    editor.commands.setParagraphFocus(false);
    expect(dimmedIndices()).toEqual([false, false]);
  });
});
