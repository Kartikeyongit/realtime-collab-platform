import { Mark } from '@tiptap/core';

export interface FontSizeOptions {
  types: string[];
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (size: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return { types: ['textStyle'] };
  },

  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: el => (el as HTMLElement).style.fontSize?.replace('px', ''),
        renderHTML: attrs => {
          if (!attrs.size) return {};
          return { style: `font-size: ${attrs.size}px` };
        },
      },
    };
  },

  parseHTML() {
    return [{ style: 'font-size' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },

  addCommands() {
    return {
      setFontSize: (size: string) => ({ commands }) => {
        return commands.setMark(this.name, { size });
      },
      unsetFontSize: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
});
