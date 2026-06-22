import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import TurndownService from 'turndown';
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, AlignmentType,
} from 'docx';

export class ExportService {
  // PDF Export — Multi-page A4 with margins and page numbers
  static async toPDF(element: HTMLElement, filename: string) {
    const margin = 40;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin;

    // Clone the editor content into a hidden A4-width container
    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
      position: absolute; left: 0; top: 0; z-index: -1;
      width: ${contentWidth}px; height: auto;
      background: white; padding: ${margin}px ${margin}px 0;
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6; color: #333;
    `;
    wrapper.innerHTML = element.innerHTML;
    document.body.appendChild(wrapper);

    const fullHeight = wrapper.scrollHeight;
    const clip = document.createElement('div');
    clip.style.cssText = `
      position: absolute; left: 0; top: -10000px; z-index: -1;
      width: ${contentWidth}px; height: ${contentHeight}px;
      overflow: hidden; background: white;
    `;
    const inner = document.createElement('div');
    inner.style.cssText = `width: 100%; padding: ${margin}px ${margin}px 0;`;
    inner.innerHTML = element.innerHTML;
    clip.appendChild(inner);
    document.body.appendChild(clip);

    const numPages = Math.max(1, Math.ceil(fullHeight / contentHeight));

    for (let i = 0; i < numPages; i++) {
      if (i > 0) pdf.addPage();

      // Slide content up so the current page is visible
      inner.style.transform = `translateY(-${i * contentHeight}px)`;
      inner.style.margin = '0';

      // Let the browser settle layout
      await new Promise((r) => requestAnimationFrame(r));

      const canvas = await html2canvas(clip, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);

      // Page number footer
      pdf.setFontSize(8);
      pdf.setTextColor(180, 180, 180);
      pdf.text(`${i + 1} / ${numPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    document.body.removeChild(wrapper);
    document.body.removeChild(clip);
    pdf.save(`${filename}.pdf`);
  }

  // Word Export — Proper .docx using the docx package
  static async toDOCX(html: string, filename: string) {
    const children = await ExportService.htmlToDocxChildren(html);
    const doc = new Document({
      title: filename,
      sections: [{ children }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  }

  // --- HTML → DOCX conversion ---

  private static async htmlToDocxChildren(html: string): Promise<(Paragraph | Table)[]> {
    const body = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html').body;
    const result: (Paragraph | Table)[] = [];
    for (const node of body.childNodes) {
      result.push(...await ExportService.convertNode(node));
    }
    return result;
  }

  private static async convertNode(node: Node): Promise<(Paragraph | Table)[]> {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      return text ? [new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text })] })] : [];
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return [];
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    switch (tag) {
      case 'h1': return [ExportService.makeHeading(el, 1)];
      case 'h2': return [ExportService.makeHeading(el, 2)];
      case 'h3': return [ExportService.makeHeading(el, 3)];
      case 'h4': return [ExportService.makeHeading(el, 4)];
      case 'h5': return [ExportService.makeHeading(el, 5)];
      case 'h6': return [ExportService.makeHeading(el, 6)];
      case 'p': return [ExportService.makeParagraph(el)];
      case 'ul': return ExportService.makeBulletList(el);
      case 'ol': return ExportService.makeOrderedList(el);
      case 'table': return [await ExportService.makeTable(el)];
      case 'blockquote': return [ExportService.makeBlockquote(el)];
      case 'pre': return [ExportService.makeCodeBlock(el)];
      case 'hr': return [new Paragraph({ thematicBreak: true, spacing: { before: 200, after: 200 } })];
      default: return [];
    }
  }

  private static textRuns(el: HTMLElement): TextRun[] {
    const runs: TextRun[] = [];
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        const t = node.textContent || '';
        if (t) runs.push(new TextRun({ text: t }));
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const e = node as HTMLElement;
        const tg = e.tagName.toLowerCase();
        const txt = e.textContent || '';
        switch (tg) {
          case 'strong': case 'b':      if (txt) runs.push(new TextRun({ text: txt, bold: true })); break;
          case 'em': case 'i':           if (txt) runs.push(new TextRun({ text: txt, italics: true })); break;
          case 'u':                      if (txt) runs.push(new TextRun({ text: txt, underline: { type: 'single' } })); break;
          case 's': case 'strike':       if (txt) runs.push(new TextRun({ text: txt, strike: true })); break;
          case 'code':                   if (txt) runs.push(new TextRun({ text: txt, font: 'Consolas', size: 20 })); break;
          case 'a':                      if (txt) runs.push(new TextRun({ text: txt, color: '0563C1', underline: { type: 'single' } })); break;
          case 'br':                     runs.push(new TextRun({ break: 1 })); break;
          case 'span': case 'mark': {
            if (!txt) break;
            const st = e.getAttribute('style') || '';
            const c = st.match(/color:\s*(#[a-f0-9]+)/i)?.[1];
            runs.push(new TextRun({ text: txt, color: c }));
            break;
          }
          default:
            if (txt) runs.push(...ExportService.textRuns(e));
        }
      }
    }
    return runs;
  }

  // --- Element builders ---

  private static hlMap = {
    1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2, 3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4, 5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6,
  };

  private static makeHeading(el: HTMLElement, level: number): Paragraph {
    return new Paragraph({
      heading: (ExportService.hlMap as any)[level],
      spacing: { before: 240, after: 120 },
      children: ExportService.textRuns(el),
    });
  }

  private static makeParagraph(el: HTMLElement): Paragraph {
    return new Paragraph({
      spacing: { after: 80 },
      children: ExportService.textRuns(el),
    });
  }

  private static makeBulletList(el: HTMLElement): Paragraph[] {
    const items: Paragraph[] = [];
    for (const child of el.children) {
      if (child.tagName.toLowerCase() === 'li') {
        items.push(new Paragraph({
          spacing: { after: 40 },
          indent: { left: 720 },
          children: [new TextRun({ text: '\u2022  ' }), ...ExportService.textRuns(child as HTMLElement)],
        }));
      }
    }
    return items;
  }

  private static makeOrderedList(el: HTMLElement): Paragraph[] {
    const items: Paragraph[] = [];
    let idx = 1;
    for (const child of el.children) {
      if (child.tagName.toLowerCase() === 'li') {
        items.push(new Paragraph({
          spacing: { after: 40 },
          indent: { left: 720 },
          children: [new TextRun({ text: `${idx}.  ` }), ...ExportService.textRuns(child as HTMLElement)],
        }));
        idx++;
      }
    }
    return items;
  }

  private static async makeTable(el: HTMLElement): Promise<Table> {
    const rows: TableRow[] = [];
    for (const tr of el.children) {
      if (tr.tagName.toLowerCase() !== 'tr') continue;
      const cells: TableCell[] = [];
      for (const td of tr.children) {
        const tag = td.tagName.toLowerCase();
        if (tag !== 'td' && tag !== 'th') continue;
        const pars: Paragraph[] = [];
        for (const child of td.childNodes) {
          for (const item of await ExportService.convertNode(child)) {
            if (item instanceof Paragraph) pars.push(item);
          }
        }
        if (!pars.length) pars.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
        const isH = tag === 'th';
        cells.push(new TableCell({
          children: pars,
          ...(isH ? { shading: { type: 'clear', fill: 'f2f2f2' } as any } : {}),
        }));
      }
      rows.push(new TableRow({ children: cells }));
    }
    return new Table({ rows });
  }

  private static makeBlockquote(el: HTMLElement): Paragraph {
    return new Paragraph({
      spacing: { before: 120, after: 120 },
      indent: { left: ExportService.inchToTwip(0.5) },
      children: ExportService.textRuns(el),
    });
  }

  private static makeCodeBlock(el: HTMLElement): Paragraph {
    return new Paragraph({
      spacing: { before: 80, after: 80 },
      indent: { left: ExportService.inchToTwip(0.3) },
      children: [new TextRun({ text: el.textContent || '', font: 'Consolas', size: 18 })],
    });
  }

  private static inchToTwip(inches: number): number {
    return Math.round(inches * 1440);
  }

  // --- Markdown ---
  static toMarkdown(html: string, filename: string) {
    const md = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced', emDelimiter: '*' }).turndown(html);
    saveAs(new Blob([md], { type: 'text/markdown;charset=utf-8' }), `${filename}.md`);
  }

  // --- HTML ---
  static toHTML(html: string, filename: string) {
    saveAs(new Blob([`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;line-height:1.6;color:#333}
h1{font-size:2em;margin-top:1.5em} h2{font-size:1.5em;margin-top:1.3em} h3{font-size:1.25em;margin-top:1.1em}
table{border-collapse:collapse;width:100%;margin:1em 0} td,th{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f5f5f5}
img{max-width:100%;height:auto} pre{background:#f5f5f5;padding:15px;border-radius:8px;overflow-x:auto}
code{background:#f5f5f5;padding:2px 6px;border-radius:4px;font-size:.9em}
blockquote{border-left:4px solid #3b82f6;padding-left:16px;margin:1em 0;color:#666}
</style></head><body>${html}</body></html>`], { type: 'text/html;charset=utf-8' }), `${filename}.html`);
  }

  // --- Plain Text ---
  static toText(text: string, filename: string) {
    saveAs(new Blob([text], { type: 'text/plain;charset=utf-8' }), `${filename}.txt`);
  }
}
