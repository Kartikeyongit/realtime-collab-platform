import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

export const CustomTable = Table.configure({
  resizable: true,
  allowTableNodeSelection: true,
});

export const CustomTableRow = TableRow;

export const CustomTableCell = TableCell;

export const CustomTableHeader = TableHeader;
