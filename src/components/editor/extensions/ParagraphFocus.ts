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

interface FocusState {
  set: DecorationSet;
  active: number;
  childCount: number;
}

const pluginKey = new PluginKey('paragraphFocus');

function buildSet(doc: any, activeStart: number): DecorationSet {
  const decos: Decoration[] = [];
  doc.descendants((node: any, pos: number, parent: any) => {
    if (parent === doc && pos !== activeStart) {
      decos.push(Decoration.node(pos, pos + node.nodeSize, { class: 'focus-dim' }));
    }
    return false; // top level only
  });
  return DecorationSet.create(doc, decos);
}

function activeStartOf(state: any): number {
  const { $from } = state.selection;
  return $from.depth > 0 ? $from.before(1) : $from.pos;
}

/**
 * Writer-style paragraph focus: all top-level blocks except the one under
 * the cursor get a `focus-dim` class. Decorations are editor-local —
 * nothing syncs over Yjs, so collaborators are unaffected. ($0)
 *
 * Performance: the common case (typing inside the active block) only MAPS
 * the existing set through the transaction — no tree walk, and ProseMirror
 * sees equivalent decorations so the DOM is left alone. Full rebuilds happen
 * only when the cursor crosses into another block, the top-level structure
 * changes, or focus mode toggles, since only those alter dim membership.
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
        state: {
          init(): FocusState {
            return { set: DecorationSet.empty, active: -2, childCount: -1 };
          },
          apply(tr, prev: FocusState, _oldState: any, newState: any): FocusState {
            if (!storage.enabled) {
              return prev.set === DecorationSet.empty
                ? prev
                : { set: DecorationSet.empty, active: -2, childCount: -1 };
            }
            const doc = newState.doc;
            const active = activeStartOf(newState);
            const childCount = doc.childCount;
            if (prev.active === active && prev.childCount === childCount && prev.set !== DecorationSet.empty) {
              // Same block, same structure: map positions only.
              return { set: prev.set.map(tr.mapping, doc), active, childCount };
            }
            return { set: buildSet(doc, active), active, childCount };
          },
        },
        props: {
          decorations(state) {
            return pluginKey.getState(state)?.set ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});
