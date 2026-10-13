import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import { searchEmojis, recordRecentEmoji, type EmojiEntry } from '../emojiData';

/**
 * `:shortcode` autocomplete (e.g. type `:fire:` + Enter).
 * Vanilla-DOM popup styled like the app's dropdowns — no extra deps.
 */
export const EmojiSuggestion = Extension.create({
  name: 'emojiSuggestion',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        // Unique key: DocLinkSuggest registers its own Suggestion instance,
        // and ProseMirror rejects two plugins sharing the default key.
        pluginKey: new PluginKey('emojiSuggestion'),
        editor: this.editor,
        char: ':',
        allowSpaces: false,
        startOfLine: false,
        items: ({ query, editor }) => {
          // Stay out of code — `:joy:` there is literal text.
          if (editor.isActive('code') || editor.isActive('codeBlock')) return [];
          return searchEmojis(query, 8);
        },
        command: ({ editor, range, props }: any) => {
          const item = props as EmojiEntry;
          recordRecentEmoji(item.char);
          editor.chain().focus().deleteRange(range).insertContent(item.char).run();
        },
        render: () => {
          let popup: TippyInstance | null = null;
          let listEl: HTMLDivElement | null = null;
          let items: EmojiEntry[] = [];
          let selected = 0;

          const paint = () => {
            if (!listEl) return;
            const buttons = listEl.querySelectorAll<HTMLButtonElement>('[data-idx]');
            buttons.forEach((btn) => {
              const i = Number(btn.dataset.idx);
              const active = i === selected;
              btn.style.background = active ? '#fff7ed' : 'transparent';
              btn.style.outline = active ? '1.5px solid #fed7aa' : 'none';
              if (active) btn.scrollIntoView({ block: 'nearest' });
            });
          };

          const hide = () => {
            popup?.destroy();
            popup = null;
            listEl = null;
          };

          // Deterministic dismissal: if the trigger is gone after an edit key,
          // close regardless of what the matcher reports.
          const textBeforeCursor = (view: any): string => {
            try {
              const { $from } = view.state.selection;
              return $from.parent.textBetween(0, $from.parentOffset);
            } catch {
              return '';
            }
          };

          const build = (props: any) => {
            items = props.items as EmojiEntry[];
            selected = 0;
            if (!listEl) {
              listEl = document.createElement('div');
              listEl.style.cssText =
                'background:white;border:1.5px solid #e7e5e4;border-radius:14px;' +
                'box-shadow:0 16px 40px rgba(28,25,23,0.12);padding:6px;min-width:210px;max-width:260px;';
            }
            listEl.innerHTML = '';
            if (items.length === 0) {
              const empty = document.createElement('div');
              empty.textContent = 'No match';
              empty.style.cssText = 'padding:10px 12px;font-size:13px;color:#a8a29e;';
              listEl.appendChild(empty);
            }
            items.forEach((item, i) => {
              const btn = document.createElement('button');
              btn.dataset.idx = String(i);
              btn.type = 'button';
              btn.style.cssText =
                'display:flex;align-items:center;gap:10px;width:100%;padding:7px 10px;' +
                'border:none;border-radius:9px;cursor:pointer;font-size:14px;color:#44403c;background:transparent;';
              const glyph = document.createElement('span');
              glyph.textContent = item.char;
              glyph.style.fontSize = '17px';
              const label = document.createElement('span');
              label.textContent = `:${item.name}:`;
              label.style.cssText = 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
              btn.append(glyph, label);
              btn.addEventListener('mouseenter', () => {
                selected = i;
                paint();
              });
              btn.addEventListener('mousedown', (e) => {
                // Don't let the editor lose focus before command runs.
                e.preventDefault();
              });
              btn.addEventListener('click', () => {
                props.command({ ...item });
              });
              listEl!.appendChild(btn);
            });
            paint();
          };

          return {
            onStart: (props: any) => {
              build(props);
              const { clientRect } = props;
              if (!clientRect) return;
              popup = tippy('body', {
                getReferenceClientRect: clientRect,
                appendTo: () => document.body,
                content: listEl!,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
                arrow: false,
                offset: [0, 6],
              }) as unknown as TippyInstance;
            },
            onUpdate: (props: any) => {
              build(props);
              popup?.setProps({ getReferenceClientRect: props.clientRect });
            },
            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                hide();
                return true;
              }
              if (props.event.key === 'Backspace' || props.event.key === 'Delete') {
                const view = props.view;
                setTimeout(() => {
                  if (!textBeforeCursor(view).includes(':')) hide();
                }, 0);
                return false;
              }
              if (props.event.key === 'ArrowDown') {
                selected = (selected + 1) % Math.max(items.length, 1);
                paint();
                return true;
              }
              if (props.event.key === 'ArrowUp') {
                selected = (selected - 1 + items.length) % Math.max(items.length, 1);
                paint();
                return true;
              }
              if (props.event.key === 'Enter') {
                if (items[selected]) {
                  props.command({ ...items[selected] });
                  return true;
                }
                return false;
              }
              return false;
            },
            onExit: () => {
              popup?.destroy();
              popup = null;
              listEl = null;
            },
          };
        },
      }),
    ];
  },
});
