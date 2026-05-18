import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';

export const getEditorExtensions = (isCollaborative = false) => {
  const extensions = [
    StarterKit.configure({
      history: isCollaborative ? false : {},
      codeBlock: false,
    }),
    Placeholder.configure({
      placeholder: 'Start typing...',
    }),
    Underline,
    Table.configure({ resizable: true }),
    TableRow,
    TableCell,
    TableHeader,
    Image.configure({ inline: true, allowBase64: true }),
    Link.configure({
      openOnClick: true,
      HTMLAttributes: { class: 'text-blue-500 underline cursor-pointer' },
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Highlight.configure({ multicolor: true }),
  ];

  return extensions;
};
