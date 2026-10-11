import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    paragraphFocus: {
      /** Dim every top-level block except the one holding the cursor. */
      setParagraphFocus: (enabled: boolean) => ReturnType;
    };
  }
}

interface ParagraphFocusStorage {
  enabled: boolean;
}

const pluginKey = new PluginKey('paragraphFocus');

/**
 * Writer-style paragraph focus: all top-level blocks except the one under
 * the cursor get a `focus-dim` class. Decorations are editor-local —
 * nothing syncs over Yjs, so collaborators are unaffected. ($0)
 */
export const ParagraphFocus = Extension.create<unknown, ParagraphFocusStorage>({
  name: 'paragraphFocus',

  addStorage() {
    return { enabled: false };
  },

  addCommands() {
    return {
      setParagraphFocus:
        (enabled: boolean) =>
        ({ editor }) => {
          this.storage.enabled = enabled;
          // Re-dispatch so decorations recompute immediately.
          editor.view.dispatch(editor.state.tr);
          return true;
        },
    };
  },

  addProseMirrorPlugins() {
    const storage = this.storage;
    return [
      new Plugin({
        key: pluginKey,
        props: {
          decorations: (state) => {
            if (!storage.enabled) return DecorationSet.empty;
            const { $from } = state.selection;
            // Top-level node holding the cursor (NodeSelection safe).
            const activeStart = $from.depth > 0 ? $from.before(1) : $from.pos;
            const decos: Decoration[] = [];
            state.doc.descendants((node, pos, parent) => {
              if (parent === state.doc && pos !== activeStart) {
                decos.push(Decoration.node(pos, pos + node.nodeSize, { class: 'focus-dim' }));
              }
              return false; // top level only
            });
            return DecorationSet.create(state.doc, decos);
          },
        },
      }),
    ];
  },
});
