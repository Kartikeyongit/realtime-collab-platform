import { Extension } from '@tiptap/core';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import axios from 'axios';

interface DocChoice {
  id: string;
  title: string;
  folder?: string | null;
}

/**
 * `[[Title` doc-link autocomplete. The suggestion trigger is a single `[`;
 * the popup only appears once the query starts with a second `[`, so plain
 * `[bracket]` typing never pops anything up.
 */
export const DocLinkSuggest = Extension.create({
  name: 'docLinkSuggest',

  addProseMirrorPlugins() {
    return [
      Suggestion({
        // Unique key: EmojiSuggestion registers its own Suggestion instance,
        // and ProseMirror rejects two plugins sharing the default key.
        pluginKey: new PluginKey('docLinkSuggest'),
        editor: this.editor,
        char: '[',
        allowSpaces: true,
        startOfLine: false,
        items: async ({ query, editor }) => {
          if (!query.startsWith('[')) return [];
          if (editor.isActive('code') || editor.isActive('codeBlock')) return [];
          const q = query.slice(1).trim();
          try {
            const params = new URLSearchParams({ limit: '8', sort: 'updated' });
            if (q) params.set('search', q);
            const { data } = await axios.get(`/api/documents?${params}`);
            return ((data.documents || []) as any[]).map((d) => ({
              id: d.id,
              title: d.title || 'Untitled',
              folder: d.folder?.name ?? null,
            })) as DocChoice[];
          } catch {
            return [];
          }
        },
        command: ({ editor, range, props }: any) => {
          const item = props as DocChoice;
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({ type: 'docLink', attrs: { documentId: item.id, title: item.title } })
            .run();
        },
        render: () => {
          let popup: TippyInstance | null = null;
          let listEl: HTMLDivElement | null = null;
          let items: DocChoice[] = [];
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

          const build = (props: any) => {
            items = (props.items as DocChoice[]) ?? [];
            selected = 0;
            if (items.length === 0) {
              hide();
              return;
            }
            if (!listEl) {
              listEl = document.createElement('div');
              listEl.style.cssText =
                'background:white;border:1.5px solid #e7e5e4;border-radius:14px;' +
                'box-shadow:0 16px 40px rgba(28,25,23,0.12);padding:6px;min-width:230px;max-width:280px;';
            }
            listEl.innerHTML = '';
            const head = document.createElement('div');
            head.textContent = 'Link to document';
            head.style.cssText =
              'font-size:11px;font-weight:700;color:#a8a29e;text-transform:uppercase;' +
              'letter-spacing:0.05em;padding:4px 10px 6px;';
            listEl.appendChild(head);
            items.forEach((item, i) => {
              const btn = document.createElement('button');
              btn.dataset.idx = String(i);
              btn.type = 'button';
              btn.style.cssText =
                'display:flex;align-items:center;gap:8px;width:100%;padding:7px 10px;' +
                'border:none;border-radius:9px;cursor:pointer;font-size:14px;color:#292524;background:transparent;text-align:left;';
              const glyph = document.createElement('span');
              glyph.textContent = '📄';
              glyph.style.fontSize = '15px';
              const text = document.createElement('span');
              text.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
              text.textContent = item.title;
              btn.append(glyph, text);
              if (item.folder) {
                const tag = document.createElement('span');
                tag.textContent = item.folder;
                tag.style.cssText =
                  'font-size:10px;color:#78716c;background:#fafaf9;border:1px solid #e7e5e4;' +
                  'border-radius:999px;padding:1px 7px;flex-shrink:0;max-width:90px;overflow:hidden;' +
                  'text-overflow:ellipsis;white-space:nowrap;';
                btn.appendChild(tag);
              }
              btn.addEventListener('mouseenter', () => {
                selected = i;
                paint();
              });
              btn.addEventListener('mousedown', (e) => {
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
              if (!listEl) return;
              const { clientRect } = props;
              if (!clientRect) return;
              popup = tippy('body', {
                getReferenceClientRect: clientRect,
                appendTo: () => document.body,
                content: listEl,
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
              if (!listEl) {
                hide();
                return;
              }
              if (!popup) {
                const { clientRect } = props;
                if (!clientRect) return;
                popup = tippy('body', {
                  getReferenceClientRect: clientRect,
                  appendTo: () => document.body,
                  content: listEl,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                  arrow: false,
                  offset: [0, 6],
                }) as unknown as TippyInstance;
              } else {
                popup.setProps({ getReferenceClientRect: props.clientRect });
              }
            },
            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                hide();
                return true;
              }
              if (!items.length) return false;
              if (props.event.key === 'ArrowDown') {
                selected = (selected + 1) % items.length;
                paint();
                return true;
              }
              if (props.event.key === 'ArrowUp') {
                selected = (selected - 1 + items.length) % items.length;
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
              hide();
            },
          };
        },
      }),
    ];
  },
});
