// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, act, cleanup } from '@testing-library/react';
import { WordCount } from './WordCount';

/**
 * Minimal fake editor: exposes exactly what WordCount uses
 * (state.doc.textContent, on/off) so we can simulate Yjs-driven content
 * arriving WITHOUT an `update` event — the stuck-at-0 scenario.
 */
function makeFakeEditor(initialText = '') {
  const handlers = new Map<string, Set<() => void>>();
  return {
    text: initialText,
    get state() {
      return { doc: { textContent: this.text } };
    },
    on(event: string, cb: () => void) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(cb);
    },
    off(event: string, cb: () => void) {
      handlers.get(event)?.delete(cb);
    },
    emit(event: string) {
      handlers.get(event)?.forEach((cb) => cb());
    },
    handlerCount(event: string) {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

describe('WordCount', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows 0 for an empty document', () => {
    const editor = makeFakeEditor('') as any;
    render(<WordCount editor={editor} />);
    expect(screen.getByText('0 words')).toBeTruthy();
    expect(screen.getByText('0 chars')).toBeTruthy();
  });

  it('updates instantly on editor update events', () => {
    const editor = makeFakeEditor('') as any;
    render(<WordCount editor={editor} />);
    act(() => {
      editor.text = 'hello world';
      editor.emit('update');
    });
    expect(screen.getByText('2 words')).toBeTruthy();
    expect(screen.getByText('11 chars')).toBeTruthy();
  });

  it('self-heals when content lands without an update event (Yjs race)', () => {
    const editor = makeFakeEditor('') as any;
    render(<WordCount editor={editor} />);
    expect(screen.getByText('0 words')).toBeTruthy();

    // Simulate template/Yjs content arriving with no `update` reaching us.
    act(() => {
      editor.text = 'Meeting notes template content here';
    });
    // Still stale immediately (no event fired)...
    expect(screen.getByText('0 words')).toBeTruthy();
    // ...but the safety-net interval picks it up within ~1s.
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText('5 words')).toBeTruthy();
    expect(screen.getByText('35 chars')).toBeTruthy();
  });

  it('does not re-render or leak when content is unchanged', () => {
    const editor = makeFakeEditor('same text') as any;
    render(<WordCount editor={editor} />);
    expect(editor.handlerCount('update')).toBe(1);
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    // Still exactly one listener, counts stable.
    expect(editor.handlerCount('update')).toBe(1);
    expect(screen.getByText('2 words')).toBeTruthy();
  });
});
