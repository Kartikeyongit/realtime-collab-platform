'use client';

import { useState } from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles, X, Wand2, FileSearch, Loader2, Send } from 'lucide-react';
import axios from 'axios';

interface AIAssistantProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export function AIAssistant({ editor, isOpen, onClose, addToast }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'improve' | 'summarize' | 'grammar' | 'expand'>('improve');

  const modes = [
    { id: 'improve', label: 'Improve', icon: Wand2 },
    { id: 'grammar', label: 'Grammar', icon: FileSearch },
    { id: 'summarize', label: 'Summarize', icon: FileSearch },
    { id: 'expand', label: 'Expand', icon: Sparkles },
  ];

  const handleAction = async () => {
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (!text) { addToast('Select text first', 'warning'); return; }
    
    setProcessing(true);
    try {
      const { data } = await axios.post('/api/ai/process', { text, action: mode });
      editor.chain().focus().setTextSelection({ from, to }).insertContent(data.result).run();
      addToast('Done!', 'success');
    } catch { addToast('Failed', 'error'); }
    finally { setProcessing(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '360px', background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', zIndex: 40, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '16px 18px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} /><span style={{ fontWeight: 600 }}>AI Assistant</span></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: 0.8, padding: '4px' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Select text and choose an action</p>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '16px' }}>
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id as any)}
              style={{ padding: '8px 4px', border: '1.5px solid', borderColor: mode === m.id ? '#f97316' : '#e7e5e4', background: mode === m.id ? '#fff7ed' : 'white', color: mode === m.id ? '#f97316' : '#78716c', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 500, transition: 'all 0.15s ease' }}>
              <m.icon size={16} />{m.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Or describe what you want..." className="input" style={{ flex: 1 }} onKeyDown={(e) => { if (e.key === 'Enter') handleAction(); }} />
          <button onClick={handleAction} disabled={processing} className="btn btn-primary btn-sm">{processing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}</button>
        </div>
      </div>
    </div>
  );
}
