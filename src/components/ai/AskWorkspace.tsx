'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { X, Send, Loader2, Sparkles, Database, FileText, AlertTriangle } from 'lucide-react';
import { Markdown } from './Markdown';
import { docToChunks } from '@/lib/ai/chunks';
import { embedTextsWithLoadProgress, describeEmbeddingProblem } from '@/lib/ai/embeddings';
import { showError } from '@/lib/toast';

interface Citation {
  documentId: string;
  title: string;
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  citations?: Citation[];
}

interface IndexStatus {
  totalDocs: number;
  indexedDocs: number;
  totalChunks: number;
}

async function indexAllDocs(
  onProgress: (pct: number, stage: string) => void,
  signal: { cancelled: boolean }
): Promise<{ docs: number; chunks: number; failed: string[] }> {
  // Page through the user's docs (bounded, personal scale).
  const docs: Array<{ id: string; title: string; content: any }> = [];
  let page = 1;
  for (;;) {
    const { data } = await axios.get(`/api/documents?page=${page}&limit=50&sort=updated`);
    const list = data.documents || [];
    if (list.length === 0) break;
    for (const d of list) docs.push({ id: d.id, title: d.title || 'Untitled', content: (d as any).content });
    if (list.length < 50 || docs.length >= 200 || page >= 10) break;
    page++;
    if (signal.cancelled) throw new Error('cancelled');
  }

  let doneChunks = 0;
  let docCount = 0;
  const failed: string[] = [];
  for (let i = 0; i < docs.length; i++) {
    if (signal.cancelled) throw new Error('cancelled');
    try {
      const chunks = docToChunks(docs[i].content);
      if (chunks.length === 0) continue;
      const vecs = await embedTextsWithLoadProgress(
        chunks.map((c) => c.text),
        (_pct, _stage, done, total) => {
          onProgress(
            Math.min(99, Math.round(((i + (done || 0) / Math.max(total || 1, 1)) / Math.max(docs.length, 1)) * 100)),
            `Embedding doc ${i + 1}/${docs.length}…`
          );
        }
      );
      const problem = describeEmbeddingProblem(vecs, chunks.length);
      if (problem) {
        throw new Error(`bad engine output (${problem})`);
      }
      await axios.post('/api/ai/index', {
        documentId: docs[i].id,
        chunks: chunks.map((c, k) => ({ index: c.index, text: c.text, embedding: vecs[k] })),
      }).catch((err: any) => {
        // Re-throw with the server's validation message (or HTTP status) intact —
        // "Request failed with status 400" alone tells us nothing.
        const serverMsg = err?.response?.data?.error;
        const status = err?.response?.status;
        // Client-side snapshot: proves what WE sent, so a mismatch with what the
        // server claims to receive is diagnosable (stale build, proxy mangling…).
        const firstVec: unknown = (vecs as unknown[])[0];
        const snapshot =
          ` [client: ${chunks.length} chunks, ${Array.isArray(vecs) ? vecs.length : typeof vecs} vecs` +
          `, firstVecLen=${Array.isArray(firstVec) ? firstVec.length : typeof firstVec}` +
          `, firstVal=${Array.isArray(firstVec) ? String(firstVec.slice(0, 2)) : 'n/a'}]`;
        throw new Error(
          serverMsg
            ? `rejected: ${serverMsg}${serverMsg.includes('No usable chunks') ? snapshot : ''}`
            : `save failed${status ? ` (HTTP ${status})` : ''}: ${err?.message || 'unknown error'}`
        );
      });
      doneChunks += chunks.length;
      docCount++;
    } catch (err: any) {
      if (err?.message === 'cancelled') throw err;
      // One bad doc must not abort the whole workspace run.
      failed.push(`${docs[i].title}: ${err?.message || 'failed'}`);
      console.error(`Indexing skipped doc ${docs[i].id}:`, err);
    }
    onProgress(Math.round(((i + 1) / docs.length) * 100), `Indexed ${docCount}/${docs.length} docs…`);
  }
  return { docs: docCount, chunks: doneChunks, failed };
}

export function AskWorkspace({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [progress, setProgress] = useState({ pct: 0, stage: '' });
  const [indexError, setIndexError] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [asking, setAsking] = useState(false);
  const cancelRef = useRef({ cancelled: false });
  const bottomRef = useRef<HTMLDivElement>(null);

  const refreshStatus = async () => {
    setStatusLoading(true);
    try {
      const { data } = await axios.get('/api/ai/index/status');
      setStatus(data);
    } catch {
      // Offline/s asleep backend — chat simply stays unavailable.
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      refreshStatus();
      cancelRef.current.cancelled = false;
    } else {
      cancelRef.current.cancelled = true;
      setIndexing(false);
      setIndexError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, asking]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const startIndexing = async () => {
    setIndexing(true);
    setIndexError('');
    setProgress({ pct: 1, stage: 'Starting…' });
    try {
      const res = await indexAllDocs(
        (pct, stage) => setProgress({ pct, stage }),
        cancelRef.current
      );
      if (res.docs > 0) {
        try {
          localStorage.setItem('ai-index-optin', '1');
        } catch {}
      }
      await refreshStatus();
      const failedNote =
        res.failed.length > 0
          ? ` Skipped ${res.failed.length}: ${res.failed.slice(0, 3).join(' · ')}${res.failed.length > 3 ? '…' : ''} — retry to pick these up.`
          : '';
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text:
            res.docs > 0
              ? `Memory ready — indexed ${res.docs} document${res.docs === 1 ? '' : 's'} (${res.chunks} passages).${failedNote} Ask me anything about your notes.`
              : `Couldn't index anything.${failedNote || ' Check the error above and retry.'}`,
        },
      ]);
      if (res.failed.length > 0) {
        setIndexError(`Some docs were skipped:${res.failed.length > 0 ? ' ' + res.failed.slice(0, 3).join(' · ') : ''}`);
      }
    } catch (err: any) {
      if (err?.message !== 'cancelled') {
        console.error('Workspace index failed:', err);
        const detail = typeof err?.message === 'string' ? err.message.slice(0, 160) : '';
        setIndexError(
          detail
            ? `Could not build the index: ${detail}`
            : 'Could not build the index (model download needs network the first time, ~90MB). Check your connection and retry — nothing was charged or broken.'
        );
      }
    } finally {
      setIndexing(false);
    }
  };

  const ask = async () => {
    const q = input.trim();
    if (!q || asking) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: q }]);
    setAsking(true);
    try {
      const vecs = await embedTextsWithLoadProgress([q]);
      const problem = describeEmbeddingProblem(vecs, 1);
      if (problem) throw new Error(`Engine output unusable (${problem})`);
      const [vec] = vecs;
      const { data } = await axios.post('/api/ai/ask', { question: q, embedding: vec });
      if (data.needsIndex) {
        setMessages((m) => [...m, { role: 'ai', text: 'Your workspace memory is empty — index it first (button above), then ask away.' }]);
      } else {
        setMessages((m) => [...m, { role: 'ai', text: data.answer, citations: data.citations || [] }]);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to answer — try again in a moment.';
      if (err?.response?.status === 503) {
        showError('AI answering needs an AI_API_KEY on the server');
      }
      setMessages((m) => [...m, { role: 'ai', text: msg }]);
    } finally {
      setAsking(false);
    }
  };

  if (!open) return null;
  const indexed = (status?.indexedDocs ?? 0) > 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '7vh', paddingLeft: 12, paddingRight: 12 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: 'min(620px, 100%)', maxHeight: '82vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}
      >
        <div style={{ padding: '16px 20px 12px', borderBottom: '1.5px solid #f5f5f4', background: '#fdfbf7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 12, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
              <Sparkles size={18} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.01em' }}>Ask my workspace</div>
              <div style={{ fontSize: 12, color: '#a8a29e' }}>
                {statusLoading
                  ? 'Checking memory…'
                  : status
                    ? `${status.indexedDocs}/${status.totalDocs} docs indexed · answers cite your notes`
                    : 'Answers come only from your notes, with citations'}
              </div>
            </div>
            <button onClick={onClose} title="Close" style={{ background: '#fafaf9', border: '1.5px solid #e7e5e4', borderRadius: 999, cursor: 'pointer', color: '#78716c', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>

          {!statusLoading && status && (
            <div style={{ marginTop: 12 }}>
              {!indexing ? (
                status.indexedDocs === 0 ? (
                  <button className="btn btn-primary btn-sm" onClick={startIndexing} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Database size={14} /> Index {status.totalDocs} document{status.totalDocs === 1 ? '' : 's'} (one-time, on-device)
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-secondary btn-sm" onClick={startIndexing} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Database size={13} /> Re-index workspace
                    </button>
                    {status.indexedDocs < status.totalDocs && (
                      <span style={{ fontSize: 12, color: '#b45309' }}>
                        {status.totalDocs - status.indexedDocs} doc{status.totalDocs - status.indexedDocs === 1 ? '' : 's'} still unindexed
                      </span>
                    )}
                  </div>
                )
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#78716c', marginBottom: 4 }}>
                    <span>{progress.stage}</span>
                    <span>{progress.pct}%</span>
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: '#f5f5f4', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress.pct}%`, borderRadius: 999, background: 'linear-gradient(90deg,#fdba74,#f97316)', transition: 'width 0.3s ease' }} />
                  </div>
                </div>
              )}
              {indexError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', display: 'flex', gap: 6 }}>
                  <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {indexError}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 180 }}>
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#a8a29e', fontSize: 13, padding: '28px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <FileText size={26} color="#e7e5e4" />
              </div>
              <div style={{ fontWeight: 600, color: '#78716c' }}>Ask anything across your notes</div>
              <div>e.g. “What did we decide about the launch?” · “Summarize my trip ideas”</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
              <div
                style={{
                  background: m.role === 'user' ? '#f97316' : '#fafaf9',
                  color: m.role === 'user' ? 'white' : '#292524',
                  border: m.role === 'user' ? 'none' : '1.5px solid #f5f5f4',
                  borderRadius: 14,
                  padding: '9px 13px',
                  fontSize: 14,
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {m.role === 'user' ? m.text : <Markdown text={m.text} />}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  {m.citations.map((c) => (
                    <button
                      key={c.documentId}
                      onClick={() => {
                        onClose();
                        router.push(`/documents/${c.documentId}`);
                      }}
                      style={{ fontSize: 12, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 999, padding: '3px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <FileText size={11} /> {c.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {asking && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#a8a29e' }}>
              <Loader2 size={14} className="animate-spin" /> Thinking across your notes…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div style={{ padding: 12, borderTop: '1.5px solid #f5f5f4', display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(); } }}
            placeholder={indexed ? 'Ask about your notes…' : 'Index first, then ask…'}
            className="input"
            style={{ flex: 1 }}
          />
          <button onClick={ask} disabled={asking || !input.trim()} className="btn btn-primary btn-sm" style={{ padding: '0 16px' }} title="Ask">
            {asking ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
