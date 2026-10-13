// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { EmojiSuggestion } from './EmojiSuggestion';
import { DocLinkSuggest } from './DocLinkSuggest';

let editor: Editor | null = null;

afterEach(() => {
  editor?.destroy();
  editor = null;
  document.body.innerHTML = '';
  vi.useRealTimers();
});

function makeEditor() {
  const el = document.createElement('div');
  document.body.appendChild(el);
  editor = new Editor({
    element: el,
    extensions: [StarterKit, EmojiSuggestion, DocLinkSuggest],
    content: '<p></p>',
  });
  return editor;
}

const popupCount = () => document.body.querySelectorAll('.tippy-box').length;

async function type(text: string) {
  editor!.chain().focus().insertContent(text).run();
  // Suggestion's view update is async (items may promise).
  await vi.waitFor(() => {
    if (popupCount() === 0) throw new Error('no popup yet');
  }, { timeout: 2000 });
}

async function settle() {
  await new Promise((r) => setTimeout(r, 50));
}

describe('emoji suggestion lifecycle', () => {
  it('opens on :query', async () => {
    makeEditor();
    await type(':fire');
    expect(popupCount()).toBe(1);
  });

  it('closes when the trigger is deleted', async () => {
    makeEditor();
    await type(':fire');
    expect(popupCount()).toBe(1);
    // Select-all + delete the whole trigger text.
    editor!.chain().focus().selectAll().deleteSelection().run();
    await settle();
    expect(popupCount()).toBe(0);
  });

  it('reopens after close without remount', async () => {
    makeEditor();
    await type(':fire');
    expect(popupCount()).toBe(1);
    // Close by moving selection away (like clicking elsewhere in the doc).
    editor!.commands.setTextSelection(1);
    await settle();
    expect(popupCount()).toBe(0);
    // Retype: must open again on the SAME editor instance.
    await type(':joy');
    expect(popupCount()).toBe(1);
  });
});
