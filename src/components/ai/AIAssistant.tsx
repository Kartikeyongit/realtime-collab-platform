'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { Sparkles, X, Wand2, FileSearch, Loader2, Send, Pencil, MessageSquarePlus, ListChecks } from 'lucide-react';
import { Plugin, PluginKey } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

interface AIAssistantProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

type AIMode = 'improve' | 'summarize' | 'grammar' | 'expand' | 'custom' | 'actions';

const modes: { id: AIMode; label: string; icon: any }[] = [
  { id: 'improve', label: 'Improve', icon: Wand2 },
  { id: 'grammar', label: 'Grammar', icon: FileSearch },
  { id: 'summarize', label: 'Summarize', icon: Sparkles },
  { id: 'expand', label: 'Expand', icon: Pencil },
  { id: 'actions', label: 'Actions', icon: ListChecks },
  { id: 'custom', label: 'Custom', icon: MessageSquarePlus },
];

const ACTIONS_PROMPT =
  'Extract the concrete action items from the following text. ' +
  'Return one per line, each starting with "- ". No numbering, no headers, no commentary. ' +
  'If there are none, return exactly: No action items found.';

type Tone = 'formal' | 'casual' | 'confident' | 'concise';

const TONES: Array<{ id: Tone; label: string; prompt: string }> = [
  { id: 'formal', label: 'Formal', prompt: 'Rewrite it in a formal, professional tone suitable for business communication, preserving meaning' },
  { id: 'casual', label: 'Casual', prompt: 'Rewrite it in a warm, casual, conversational tone, preserving meaning' },
  { id: 'confident', label: 'Confident', prompt: 'Rewrite it in a confident, assertive tone — cut hedging and weak phrasing, preserving meaning' },
  { id: 'concise', label: 'Concise', prompt: 'Rewrite it more concisely — cut filler and redundancy while preserving every key point' },
];

const selKey = new PluginKey('ai-selection');

export function AIAssistant({ editor, isOpen, onClose, addToast }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<AIMode>('improve');
  const [tone, setTone] = useState<Tone | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pluginRef = useRef<Plugin | null>(null);

  const clearSelectionDecor = useCallback(() => {
    if (!editor) return;
    try {
      editor.view.dispatch(editor.state.tr.setMeta(selKey, DecorationSet.empty));
    } catch {}
  }, [editor]);

  const applySelectionDecor = useCallback((from: number, to: number) => {
    if (!editor) return;
    const deco = Decoration.inline(from, to, { class: 'ai-selection' });
    const set = DecorationSet.create(editor.state.doc, [deco]);
    editor.view.dispatch(editor.state.tr.setMeta(selKey, set));
  }, [editor]);

  useEffect(() => {
    if (!editor || !isOpen) return;
    if (!pluginRef.current) {
      const plugin = new Plugin({
        key: selKey,
        state: {
          init() { return DecorationSet.empty; },
          apply(tr, set) {
            const meta = tr.getMeta(selKey);
            return meta !== undefined ? meta : set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) { return selKey.getState(state); },
        },
      });
      pluginRef.current = plugin;
      editor.registerPlugin(plugin);

      const onBlur = () => {
        const { from, to } = editor.state.selection;
        if (from !== to) applySelectionDecor(from, to);
      };
      const onFocus = () => clearSelectionDecor();
      editor.on('blur', onBlur);
      editor.on('focus', onFocus);
      return () => {
        clearSelectionDecor();
        editor.off('blur', onBlur);
        editor.off('focus', onFocus);
        if (pluginRef.current) {
          try { editor.unregisterPlugin(selKey); } catch {}
          pluginRef.current = null;
        }
      };
    }
  }, [editor, isOpen, applySelectionDecor, clearSelectionDecor]);

  useEffect(() => {
    if (!isOpen) {
      setPrompt('');
      setMode('improve');
      setTone(null);
      clearSelectionDecor();
    }
  }, [isOpen, clearSelectionDecor]);

  const handleAction = async () => {
    if (mode === 'actions') {
      await handleActions();
      return;
    }
    const { from, to } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to);
    if (!text) { addToast('Select text first', 'warning'); return; }

    if (mode === 'custom' && !tone && !prompt.trim()) {
      addToast('Describe what you want', 'warning');
      return;
    }

    setProcessing(true);
    abortRef.current = new AbortController();
    clearSelectionDecor();

    // A picked tone overrides the mode via the custom-prompt path (same
    // endpoint, same rate limits — no new API surface).
    const tonePrompt = tone ? TONES.find((t) => t.id === tone)?.prompt : undefined;

    try {
      editor.chain().focus().deleteSelection().run();

      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          action: tonePrompt ? 'custom' : mode,
          prompt: tonePrompt ?? (mode === 'custom' ? prompt.trim() : undefined),
        }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || 'AI request failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let hasContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            const content = parsed.content || '';
            if (content) {
              hasContent = true;
              editor.commands.insertContent(content);
            }
          } catch (e: any) {
            if (e.message !== 'Unexpected token') throw e;
          }
        }
      }

      if (!hasContent) throw new Error('No content generated');
      addToast('Done!', 'success');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      const msg = err.message || 'AI processing failed';
      if (msg.includes('429') || msg.includes('Rate limit')) {
        addToast('Rate limited. Please wait a moment.', 'warning');
      } else if (msg.includes('401') || msg.includes('Unauthorized')) {
        addToast('AI API key is invalid', 'error');
      } else {
        addToast(msg, 'error');
      }
    } finally {
      setProcessing(false);
      abortRef.current = null;
    }
  };

  /** Extract action items → real checklist at the cursor (feeds Tasks inbox). */
  const handleActions = async () => {
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to);
    const text = (selected.trim() || editor.state.doc.textContent).slice(0, 6000).trim();
    if (!text) {
      addToast('Nothing to extract from', 'warning');
      return;
    }
    setProcessing(true);
    abortRef.current = new AbortController();
    clearSelectionDecor();
    try {
      editor.chain().focus().deleteSelection().run();
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, action: 'custom', prompt: ACTIONS_PROMPT }),
        signal: abortRef.current.signal,
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(err.error || 'AI request failed');
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');
      const decoder = new TextDecoder();
      let buffer = '';
      let full = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            full += parsed.content || '';
          } catch (e: any) {
            if (e.message !== 'Unexpected token') throw e;
          }
        }
      }
      const items = full
        .split('\n')
        .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').trim())
        .filter((l) => l && !/^no action items found\.?$/i.test(l));
      if (items.length === 0) {
        addToast('No action items found', 'info');
        return;
      }
      editor.chain().focus().insertContent({
        type: 'taskList',
        content: items.slice(0, 20).map((item) => ({
          type: 'taskItem',
          attrs: { checked: false },
          content: [{ type: 'paragraph', content: [{ type: 'text', text: item }] }],
        })),
      }).run();
      addToast(`Added ${Math.min(items.length, 20)} action items`, 'success');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      addToast(err.message || 'AI processing failed', 'error');
    } finally {
      setProcessing(false);
      abortRef.current = null;
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', width: '360px', background: 'white', border: '1.5px solid #e7e5e4', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.08)', zIndex: 40, overflow: 'hidden' }}>
      <style>{`.ai-selection { background: #c7d2fe; border-radius: 2px; }`}</style>
      <div style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', padding: '16px 18px', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Sparkles size={18} /><span style={{ fontWeight: 600 }}>AI Assistant</span></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', opacity: 0.8, padding: '4px' }}><X size={16} /></button>
        </div>
        <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Select text and choose an action</p>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '10px' }}>
          {modes.map((m) => (
            <button key={m.id} onClick={() => setMode(m.id)}
              style={{ padding: '8px 2px', border: '1.5px solid', borderColor: mode === m.id ? '#f97316' : '#e7e5e4', background: mode === m.id ? '#fff7ed' : 'white', color: mode === m.id ? '#f97316' : '#78716c', borderRadius: '10px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 500, transition: 'all 0.15s ease' }}>
              <m.icon size={14} />{m.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '16px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tone</span>
          {TONES.map((t) => {
            const active = tone === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTone(active ? null : t.id)}
                title={`${t.label} tone (applies to the action above)`}
                style={{
                  border: '1.5px solid', borderColor: active ? '#7c3aed' : '#e7e5e4',
                  background: active ? '#f5f3ff' : 'white',
                  color: active ? '#6d28d9' : '#78716c',
                  borderRadius: 999, padding: '4px 11px', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, transition: 'all 0.15s ease',
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        {mode === 'custom' && (
          <div style={{ fontSize: '11px', color: '#78716c', marginBottom: '8px', padding: '8px 10px', background: '#fafaf9', borderRadius: '8px', border: '1px solid #e7e5e4' }}>
            Examples: &quot;make this funnier&quot; · &quot;translate to Spanish&quot; · &quot;rewrite for beginners&quot; · &quot;make it more formal&quot;
          </div>
        )}
        {mode === 'custom' ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what you want..."
              className="input"
              style={{ flex: 1 }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAction(); }}
            />
            <button onClick={handleAction} disabled={processing} className="btn btn-primary btn-sm" style={{ padding: '6px 14px' }} title="Send">
              {processing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        ) : (
          <button onClick={handleAction} disabled={processing} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', gap: 8, padding: '10px 14px', fontSize: 14, fontWeight: 600 }} title={processing ? 'Stop' : 'Apply'}>
            {processing ? <Loader2 size={15} className="animate-spin" /> : <>{mode.charAt(0).toUpperCase() + mode.slice(1)} <Send size={15} /></>}
          </button>
        )}
      </div>
    </div>
  );
}
