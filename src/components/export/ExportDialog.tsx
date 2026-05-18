'use client';

import { useState } from 'react';
import { ExportService } from '@/lib/exportService';
import { FileText, FileType, FileCode, Globe, Download, X, Loader2, CheckSquare, Square } from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  editorElementId: string;
  editor?: any;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function ExportDialog({ isOpen, onClose, documentTitle, editor, addToast }: ExportDialogProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportSelectionOnly, setExportSelectionOnly] = useState(false);
  const hasSelection = editor?.state?.selection && !editor.state.selection.empty;

  const getContent = () => {
    if (!editor) return document.querySelector('.ProseMirror')?.innerHTML || '';
    if (exportSelectionOnly && !editor.state.selection.empty) {
      const { from, to } = editor.state.selection;
      return editor.view.dom.innerHTML.substring(
        editor.view.dom.innerHTML.indexOf(editor.view.nodeDOM(from)?.outerHTML || ''),
        editor.view.dom.innerHTML.lastIndexOf(editor.view.nodeDOM(to)?.outerHTML || '') + (editor.view.nodeDOM(to)?.outerHTML?.length || 0)
      );
    }
    return document.querySelector('.ProseMirror')?.innerHTML || '';
  };

  const handleExport = async (format: string) => {
    setExporting(format);
    try {
      const content = getContent();
      if (!content) { addToast('No content to export', 'error'); setExporting(null); return; }

      switch (format) {
        case 'pdf': {
          const el = document.querySelector('.ProseMirror') as HTMLElement;
          if (el) await ExportService.toPDF(el, documentTitle + (exportSelectionOnly ? ' (Selection)' : ''));
          break;
        }
        case 'docx': await ExportService.toDOCXFromHTML(content, documentTitle); break;
        case 'markdown': ExportService.toMarkdown(content, documentTitle); break;
        case 'html': ExportService.toHTML(content, documentTitle); break;
        case 'txt': {
          const div = document.createElement('div');
          div.innerHTML = content;
          ExportService.toText(div.innerText, documentTitle);
          break;
        }
      }
      addToast(`${exportSelectionOnly ? 'Selection' : 'Document'} exported!`, 'success');
      onClose();
    } catch { addToast('Export failed', 'error'); }
    finally { setExporting(null); }
  };

  const formats = [
    { id: 'pdf', name: 'PDF', icon: FileText, desc: 'Best for sharing', color: '#ef4444' },
    { id: 'docx', name: 'Word', icon: FileType, desc: 'Editable document', color: '#3b82f6' },
    { id: 'markdown', name: 'Markdown', icon: FileCode, desc: 'Text with formatting', color: '#8b5cf6' },
    { id: 'html', name: 'HTML', icon: Globe, desc: 'Web page', color: '#f97316' },
    { id: 'txt', name: 'Text', icon: FileText, desc: 'Plain text', color: '#78716c' },
  ];

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
      <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e7e5e4', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', width: '440px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 20px 0' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '17px' }}>Export</h2>
            <p style={{ fontSize: '13px', color: '#78716c' }}>{documentTitle}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e', padding: '4px' }}><X size={18} /></button>
        </div>
        <div style={{ padding: '20px' }}>
          {hasSelection && (
            <button onClick={() => setExportSelectionOnly(!exportSelectionOnly)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: exportSelectionOnly ? '#fff7ed' : '#fafaf9', border: `1.5px solid ${exportSelectionOnly ? '#f97316' : '#e7e5e4'}`, borderRadius: '10px', cursor: 'pointer', width: '100%', marginBottom: '16px', fontSize: '13px', color: exportSelectionOnly ? '#c2410c' : '#78716c' }}>
              {exportSelectionOnly ? <CheckSquare size={16} color="#f97316" /> : <Square size={16} color="#d6d3d1" />}
              Export selection only
            </button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {formats.map((f) => (
              <button key={f.id} onClick={() => handleExport(f.id)} disabled={exporting !== null} className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '10px 14px', width: '100%' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${f.color}15`, flexShrink: 0 }}>
                  {exporting === f.id ? <Loader2 size={16} color={f.color} className="animate-spin" /> : <f.icon size={16} color={f.color} />}
                </div>
                <div style={{ flex: 1, textAlign: 'left', marginLeft: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px' }}>{f.name}</div>
                  <div style={{ fontSize: '11px', color: '#a8a29e' }}>{f.desc}</div>
                </div>
                <Download size={14} color="#d6d3d1" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
