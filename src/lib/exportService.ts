import { saveAs } from 'file-saver';
import TurndownService from 'turndown';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell } from 'docx';

// TipTap JSON node shape
interface TNode {
  type?: string;
  content?: TNode[];
  text?: string;
  marks?: { type: string; attrs?: Record<string, any> }[];
  attrs?: Record<string, any>;
}

export class ExportService {
  // ── PDF — uses browser native print (handles any HTML, multi-page, tables, images) ──
  static toPDF(element: HTMLElement, _filename: string): Promise<void> {
    return new Promise((resolve) => {
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position: fixed; width: 0; height: 0; border: 0; visibility: hidden;';
      document.body.appendChild(iframe);

      const w = iframe.contentWindow!;
      const d = w.document;
      d.open();
      d.write(`<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @page { size: A4; margin: 20mm; }
  @media print {
    html, body { margin: 0; padding: 0; background: white; }
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #222; font-size: 11pt; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; page-break-inside: avoid; }
    td, th { border: 1px solid #bbb; padding: 6px 8px; text-align: left; font-size: 10pt; }
    th { background: #f5f5f5; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; page-break-inside: avoid; font-size: 9pt; }
    code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px; font-size: 0.9em; }
    blockquote { border-left: 4px solid #888; padding-left: 14px; margin: 1em 0; color: #555; page-break-inside: avoid; }
    h1, h2, h3, h4 { page-break-after: avoid; }
    pre, blockquote, table, img { page-break-inside: avoid; }
    a { color: #0563C1; text-decoration: underline; }
  }
</style>
</head><body>${element.innerHTML}</body></html>`);
      d.close();

      // Wait for images/fonts to settle, then print
      setTimeout(() => {
        w.focus();
        w.print();  // blocks until user closes the print dialog
        document.body.removeChild(iframe);
        resolve();
      }, 600);
    });
  }

  // ── Word — build proper .docx from TipTap JSON ──
  static async toDOCX(json: TNode, filename: string) {
    const children = ExportService.convertDoc(json.content || []);
    const doc = new Document({
      title: filename,
      creator: 'CollabDocs',
      description: `Exported from CollabDocs`,
      sections: [{ children }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  }

  // ── Convert TipTap nodes → docx Paragraph / Table ──
  private static convertDoc(nodes: TNode[]): (Paragraph | Table)[] {
    const out: (Paragraph | Table)[] = [];
    for (const n of nodes) {
      try {
        const t = n.type || '';
        switch (t) {
          case 'paragraph':          out.push(ExportService.p(n)); break;
          case 'heading':            out.push(ExportService.h(n)); break;
          case 'bulletList':         out.push(...ExportService.ul(n)); break;
          case 'orderedList':        out.push(...ExportService.ol(n)); break;
          case 'taskList':           out.push(...ExportService.tl(n)); break;
          case 'table':              out.push(ExportService.tbl(n)); break;
          case 'blockquote':         out.push(ExportService.bq(n)); break;
          case 'codeBlock':          out.push(ExportService.cb(n)); break;
          case 'horizontalRule':     out.push(new Paragraph({ thematicBreak: true, spacing: { before: 200, after: 200 } })); break;
          case 'image':              out.push(ExportService.img(n)); break;
          case 'text':               /* handled inline */ break;
          default:                   if (n.content) out.push(...ExportService.convertDoc(n.content)); break;
        }
      } catch (e) {
        console.warn('Skipping unsupported node type:', n.type, e);
      }
    }
    return out;
  }

  // ── Build text runs from marks ──
  private static tr(n: TNode): TextRun[] {
    if (!n.text && !n.content) return [];
    const text = n.text || n.content?.map(c => c.text || '').join('') || '';
    if (!text) return [];
    const marks = n.marks || [];
    const opts: Record<string, any> = { text };

    for (const m of marks) {
      switch (m.type) {
        case 'bold':           opts.bold = true; break;
        case 'italic':         opts.italics = true; break;
        case 'underline':      opts.underline = { type: 'single' }; break;
        case 'strike':         opts.strike = true; break;
        case 'code':           opts.font = 'Consolas'; opts.size = 20; break;
        case 'link':           opts.color = '0563C1'; opts.underline = { type: 'single' }; break;
        case 'highlight':      /* skip highlight in docx */ break;
        case 'textStyle':      if (m.attrs?.color) opts.color = m.attrs.color; break;
      }
    }
    return [new TextRun(opts)];
  }

  // ── Inline content → TextRun[] ──
  private static inline(nodes: TNode[] | undefined): TextRun[] {
    if (!nodes) return [];
    return nodes.flatMap(n => ExportService.tr(n));
  }

  // ── Paragraph ──
  private static p(n: TNode): Paragraph {
    return new Paragraph({ spacing: { after: 80 }, children: ExportService.inline(n.content) });
  }

  // ── Heading ──
  private static h(n: TNode): Paragraph {
    const lvl = n.attrs?.level ? Number(n.attrs.level) : 1;
    const hh: any = { 1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4, 5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6 };
    return new Paragraph({ heading: hh[lvl] || HeadingLevel.HEADING_1, spacing: { before: 240, after: 120 }, children: ExportService.inline(n.content) });
  }

  // ── Bullet list ──
  private static ul(n: TNode): Paragraph[] {
    const out: Paragraph[] = [];
    const items = n.content || [];
    for (const li of items) {
      const textRuns = ExportService.inline(li.content);
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: '\u2022  ' }), ...textRuns] }));
      // Handle nested lists in list items
      if (li.content) {
        for (const child of li.content) {
          if (child.type === 'bulletList') out.push(...ExportService.ul(child));
          if (child.type === 'orderedList') out.push(...ExportService.ol(child));
        }
      }
    }
    return out;
  }

  // ── Ordered list ──
  private static ol(n: TNode): Paragraph[] {
    const out: Paragraph[] = [];
    const items = n.content || [];
    let idx = 1;
    for (const li of items) {
      const textRuns = ExportService.inline(li.content);
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: `${idx}.  ` }), ...textRuns] }));
      idx++;
      if (li.content) {
        for (const child of li.content) {
          if (child.type === 'bulletList') out.push(...ExportService.ul(child));
          if (child.type === 'orderedList') out.push(...ExportService.ol(child));
        }
      }
    }
    return out;
  }

  // ── Task list ──
  private static tl(n: TNode): Paragraph[] {
    const out: Paragraph[] = [];
    const items = n.content || [];
    for (const li of items) {
      const checked = li.attrs?.checked;
      const prefix = checked ? '\u2611  ' : '\u2610  ';
      const textRuns = ExportService.inline(li.content);
      out.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: prefix }), ...textRuns] }));
    }
    return out;
  }

  // ── Table ──
  private static tbl(n: TNode): Table {
    const rows: TableRow[] = [];
    const tbody = n.content || [];
    for (const trNode of tbody) {
      const cells: TableCell[] = [];
      const tds = trNode.content || [];
      for (const tdNode of tds) {
        const pars: Paragraph[] = ExportService.convertDoc(tdNode.content || []) as Paragraph[];
        if (!pars.length) pars.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
          const isH = tdNode.type === 'tableHeader' || tdNode.type === 'th';
        cells.push(new TableCell({
          children: pars.filter(p => p instanceof Paragraph),
          ...(isH ? { shading: { type: 'clear', fill: 'f2f2f2' } as any } : {}),
        }));
      }
      rows.push(new TableRow({ children: cells }));
    }
    return new Table({ rows });
  }

  // ── Blockquote ──
  private static bq(n: TNode): Paragraph {
    return new Paragraph({ spacing: { before: 120, after: 120 }, indent: { left: ExportService.twip(0.5) }, children: ExportService.inline(n.content) });
  }

  // ── Code block ──
  private static cb(n: TNode): Paragraph {
    const text = n.content?.map(c => c.text || '').join('\n') || '';
    return new Paragraph({ spacing: { before: 80, after: 80 }, indent: { left: ExportService.twip(0.3) }, children: [new TextRun({ text, font: 'Consolas', size: 18 })] });
  }

  // ── Image — placeholder paragraph ──
  private static img(n: TNode): Paragraph {
    const alt = n.attrs?.alt || 'image';
    const src = n.attrs?.src || '';
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({ text: `[Image: ${alt}]`, italics: true, color: '888888' }),
        ...(src ? [new TextRun({ text: ` (${src})`, size: 16, color: 'aaaaaa' })] : []),
      ],
    });
  }

  // ── Helpers ──
  private static twip(inches: number) { return Math.round(inches * 1440); }

  // ── Markdown ──
  static toMarkdown(html: string, filename: string) {
    saveAs(new Blob([new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*' }).turndown(html)], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
  }

  // ── HTML ──
  static toHTML(html: string, filename: string) {
    saveAs(new Blob([`<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}h1{font-size:2em;margin-top:1.5em}h2{font-size:1.5em;margin-top:1.3em}h3{font-size:1.25em;margin-top:1.1em}table{border-collapse:collapse;width:100%;margin:1em 0}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#f5f5f5}img{max-width:100%;height:auto}pre{background:#f5f5f5;padding:15px;border-radius:8px;overflow-x:auto}code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:.9em}blockquote{border-left:4px solid #3b82f6;padding-left:16px;margin:1em 0;color:#666}</style></head><body>${html}</body></html>`], { type: 'text/html;charset=utf-8' }), `${filename}.html`);
  }

  // ── Text ──
  static toText(text: string, filename: string) {
    saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`);
  }
}
