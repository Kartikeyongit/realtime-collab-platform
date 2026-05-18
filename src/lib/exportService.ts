import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import TurndownService from 'turndown';

export class ExportService {
  // Export to PDF
  static async toPDF(element: HTMLElement, filename: string) {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height, undefined, 'FAST');
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  }

  // Export to Word using HTML
  static async toDOCXFromHTML(html: string, filename: string) {
    try {
      // Create a simple Word-compatible HTML document
      const wordHTML = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:w="urn:schemas-microsoft-com:office:word"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${filename}</title>
          <style>
            body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
            h1 { font-size: 24pt; }
            h2 { font-size: 18pt; }
            h3 { font-size: 14pt; }
            table { border-collapse: collapse; width: 100%; }
            td, th { border: 1px solid #ddd; padding: 8px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `;

      const blob = new Blob(['\ufeff' + wordHTML], {
        type: 'application/msword;charset=utf-8',
      });
      saveAs(blob, `${filename}.doc`);
    } catch (error) {
      console.error('DOCX export error:', error);
      throw error;
    }
  }

  // Export to Markdown
  static toMarkdown(html: string, filename: string) {
    try {
      const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        emDelimiter: '*',
      });
      
      const markdown = turndownService.turndown(html);
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      saveAs(blob, `${filename}.md`);
    } catch (error) {
      console.error('Markdown export error:', error);
      throw error;
    }
  }

  // Export to HTML
  static toHTML(html: string, filename: string) {
    try {
      const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${filename}</title>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      max-width: 800px; 
      margin: 40px auto; 
      padding: 0 20px; 
      line-height: 1.6;
      color: #333;
    }
    h1 { font-size: 2em; margin-top: 1.5em; }
    h2 { font-size: 1.5em; margin-top: 1.3em; }
    h3 { font-size: 1.25em; margin-top: 1.1em; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    td, th { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f5f5f5; }
    img { max-width: 100%; height: auto; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; margin: 1em 0; color: #666; }
  </style>
</head>
<body>${html}</body>
</html>`;
      
      const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' });
      saveAs(blob, `${filename}.html`);
    } catch (error) {
      console.error('HTML export error:', error);
      throw error;
    }
  }

  // Export to Plain Text
  static toText(text: string, filename: string) {
    try {
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      saveAs(blob, `${filename}.txt`);
    } catch (error) {
      console.error('Text export error:', error);
      throw error;
    }
  }
}
