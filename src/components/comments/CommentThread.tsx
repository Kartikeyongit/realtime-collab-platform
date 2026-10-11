'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Reply, Trash2, Check, Send, X, RotateCcw, LocateFixed, BadgeCheck } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { MentionInput, type MentionPerson } from './MentionInput';

interface Comment {
  id: string;
  content: string;
  userId: string;
  parentId?: string | null;
  resolved: boolean;
  position?: any;
  createdAt: string;
  user: { id?: string; name?: string | null; image?: string | null };
  replies?: Comment[];
}

interface CommentThreadProps {
  comments: Comment[];
  onResolve?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClose?: () => void;
  documentId?: string;
  editor?: Editor | null;
  emitComment?: (comment: any) => void;
  addToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  people?: MentionPerson[];
}

/** Render @Name tokens as pills when they match a known person. */
function renderRichText(text: string, people: MentionPerson[]) {
  const known = people.filter((p): p is { id: string; name: string } => !!p.name)
    .sort((a, b) => b.name.length - a.name.length);
  const parts = text.split(/(@[A-Za-z0-9_.][A-Za-z0-9_. -]*)/g);
  return parts.map((part, i) => {
    if (!part.startsWith('@')) return <span key={i}>{part}</span>;
    const clean = part.slice(1).replace(/[.,;:!?]+$/, '');
    const hit = known.find((p) => {
      const lower = part.slice(1).toLowerCase();
      return lower.startsWith(p.name.toLowerCase()) &&
        (lower.length === p.name.length || !/[A-Za-z0-9_.]/.test(lower[p.name.length]));
    });
    if (!hit) return <span key={i}>{part}</span>;
    const rest = part.slice(1 + hit.name.length);
    void clean;
    return (
      <span key={i}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 600,
            color: '#6d28d9',
            background: '#f5f3ff',
            border: '1px solid #ede9fe',
            borderRadius: 999,
            padding: '0 7px',
            lineHeight: 1.6,
            whiteSpace: 'nowrap',
          }}
        >
          @{hit.name}
        </span>
        {rest}
      </span>
    );
  });
}

function actionBtn(
  onClick: () => void,
  color: string,
  icon: React.ReactNode,
  label: string,
  title?: string
) {
  return (
    <button
      onClick={onClick}
      title={title || label}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '11px',
        fontWeight: 600,
        color,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: 999,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f4'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
    >
      {icon}
      {label}
    </button>
  );
}

export function CommentThread({ comments, onResolve, onDelete, onClose, documentId, editor, emitComment, addToast, people = [] }: CommentThreadProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);
  const [selPreview, setSelPreview] = useState('');

  // Deep link (?comment=): scroll to the thread and flash it.
  useEffect(() => {
    const target = searchParams.get('comment');
    if (!target || comments.length === 0) return;
    const t = setTimeout(() => {
      const el = window.document.getElementById(`comment-${target}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setFlashId(target);
        setTimeout(() => setFlashId(null), 2200);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchParams, comments]);

  // Live selection preview for the composer ("commenting on …").
  useEffect(() => {
    if (!editor) return;
    const update = () => {
      try {
        const { from, to } = editor.state.selection;
        setSelPreview(from !== to ? editor.state.doc.textBetween(from, to, ' ').slice(0, 70) : '');
      } catch {
        setSelPreview('');
      }
    };
    update();
    editor.on('selectionUpdate', update);
    return () => { editor.off('selectionUpdate', update); };
  }, [editor]);

  const getSelectionPosition = () => {
    if (!editor) return {};
    const { from, to } = editor.state.selection;
    if (from === to) return {};
    return { from, to };
  };

  const jumpToPosition = (position: any) => {
    if (!editor || typeof position?.from !== 'number') return;
    try {
      editor.chain().focus().setTextSelection({ from: position.from, to: position.to ?? position.from }).scrollIntoView().run();
    } catch {}
  };

  const hasAnchor = (position: any) =>
    position && typeof position.from === 'number' && typeof position.to === 'number' && position.from !== position.to;

  const handleAddComment = () => {
    if (!newComment.trim() || !documentId) return;
    emitComment?.({
      documentId,
      content: newComment.trim(),
      position: getSelectionPosition(),
    });
    setNewComment('');
    addToast?.('Comment added', 'success');
  };

  const submitReply = (commentId: string) => {
    if (!replyText.trim()) return;
    emitComment?.({ documentId, content: replyText.trim(), parentId: commentId });
    setReplyText('');
    setReplyTo(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this comment?')) {
      onDelete?.(id);
    }
  };

  const openCount = comments.filter((c) => !c.resolved).length;

  return (
    <div id="comment-thread" style={{ width: '320px', background: '#fdfbf7', borderLeft: '1.5px solid #e7e5e4', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '14px 16px', borderBottom: '1.5px solid #e7e5e4', background: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ width: 28, height: 28, borderRadius: 10, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MessageSquare size={14} color="#ea580c" />
        </span>
        <h3 style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em' }}>Comments</h3>
        <span style={{ fontSize: '11px', fontWeight: 700, color: openCount > 0 ? '#c2410c' : '#a8a29e', background: openCount > 0 ? '#fff7ed' : '#f5f5f4', border: openCount > 0 ? '1px solid #fed7aa' : '1px solid transparent', padding: '2px 9px', borderRadius: 999 }}>
          {openCount > 0 ? `${openCount} open` : 'All resolved'}
        </span>
        <div style={{ flex: 1 }} />
        {onClose && (
          <button onClick={onClose} style={{ padding: '5px', border: 'none', background: 'none', cursor: 'pointer', color: '#a8a29e', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Close">
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 14px 20px' }}>
        {/* Composer */}
        <div style={{ marginBottom: '16px', background: 'white', border: '1.5px solid #e7e5e4', borderRadius: 14, padding: '10px 10px 8px', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="avatar avatar-sm" style={{ background: '#fed7aa', color: '#c2410c', flexShrink: 0, marginTop: '2px' }}>
              {session?.user?.name?.charAt(0) || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onSubmit={handleAddComment}
                people={people}
                placeholder="Add a comment... (type @ to mention)"
                style={{ padding: '8px 10px', fontSize: '13px', borderRadius: '10px', border: 'none', background: '#fafaf9' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: '8px', paddingLeft: '34px' }}>
            <div style={{ flex: 1, minWidth: 0, fontSize: '11px', color: '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {selPreview ? (
                <span>On “{selPreview}{selPreview.length >= 70 ? '…' : ''}”</span>
              ) : (
                <span>Tip: select text first to anchor your comment</span>
              )}
            </div>
            {newComment.trim() && (
              <button onClick={handleAddComment} className="btn btn-primary btn-sm" style={{ padding: '5px 12px', fontSize: '12px', flexShrink: 0 }}>
                <Send size={12} style={{ marginRight: '4px' }} />
                Comment
              </button>
            )}
          </div>
        </div>

        {/* Threads */}
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', background: 'white', border: '1.5px dashed #e7e5e4', borderRadius: 14 }}>
            <span style={{ width: 44, height: 44, borderRadius: 14, background: '#fff7ed', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <MessageSquare size={20} color="#fed7aa" />
            </span>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#57534e', marginBottom: 2 }}>No comments yet</p>
            <p style={{ fontSize: '12px', color: '#a8a29e' }}>Discuss, ask questions, mention teammates with @.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {comments.map((comment) => {
              const isMine = comment.userId === session?.user?.id;
              const flashed = flashId === comment.id;
              return (
                <div
                  key={comment.id}
                  id={`comment-${comment.id}`}
                  style={{
                    background: 'white',
                    border: flashed ? '1.5px solid #f97316' : '1.5px solid #e7e5e4',
                    borderRadius: 14,
                    padding: '11px 12px',
                    opacity: comment.resolved ? 0.72 : 1,
                    boxShadow: flashed ? '0 0 0 3px rgba(249,115,22,0.15)' : '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease, opacity 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '9px' }}>
                    <div className="avatar avatar-sm" style={{ background: '#fed7aa', color: '#c2410c', flexShrink: 0 }}>
                      {comment.user?.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: '#1c1917' }}>{comment.user?.name || 'User'}</span>
                        {isMine && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#c2410c', background: '#fff7ed', borderRadius: 999, padding: '1px 7px' }}>you</span>
                        )}
                        {comment.resolved && (
                          <span style={{ fontSize: '10px', fontWeight: 700, color: '#15803d', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '1px 7px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <BadgeCheck size={10} /> Resolved
                          </span>
                        )}
                        <span style={{ fontSize: '10px', color: '#a8a29e', marginLeft: 'auto', flexShrink: 0 }}>
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#44403c', margin: '0 0 4px', lineHeight: 1.55 }}>
                        {renderRichText(comment.content, people)}
                      </p>
                      {hasAnchor(comment.position) && (
                        <button
                          onClick={() => jumpToPosition(comment.position)}
                          title="Jump to the commented text"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '11px', fontWeight: 600, color: '#0369a1', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 999, padding: '2px 9px', cursor: 'pointer', marginBottom: 4 }}
                        >
                          <LocateFixed size={11} /> On selection
                        </button>
                      )}
                      <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                        {actionBtn(
                          () => setReplyTo(replyTo === comment.id ? null : comment.id),
                          replyTo === comment.id ? '#f97316' : '#a8a29e',
                          <Reply size={11} />,
                          comment.replies?.length ? `Reply (${comment.replies.length})` : 'Reply'
                        )}
                        {comment.resolved
                          ? actionBtn(() => onResolve?.(comment.id), '#b45309', <RotateCcw size={11} />, 'Reopen')
                          : actionBtn(() => onResolve?.(comment.id), '#16a34a', <Check size={11} />, 'Resolve')}
                        {isMine && actionBtn(() => handleDelete(comment.id), '#ef4444', <Trash2 size={11} />, 'Delete')}
                      </div>
                    </div>
                  </div>

                  {/* Reply Input */}
                  {replyTo === comment.id && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '6px', background: '#fafaf9', border: '1.5px dashed #e7e5e4', borderRadius: 10, padding: 6 }}>
                      <MentionInput
                        value={replyText}
                        onChange={setReplyText}
                        onSubmit={() => submitReply(comment.id)}
                        people={people}
                        placeholder="Write a reply... (type @ to mention)"
                        style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}
                      />
                      <button onClick={() => submitReply(comment.id)} className="btn btn-primary btn-sm" style={{ padding: '5px 10px', fontSize: '11px', flexShrink: 0, alignSelf: 'flex-end' }}>Reply</button>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '2px solid #fed7aa', paddingLeft: '10px', marginLeft: '6px' }}>
                      {comment.replies.map((reply) => {
                        const replyMine = reply.userId === session?.user?.id;
                        return (
                          <div
                            key={reply.id}
                            id={`comment-${reply.id}`}
                            style={{
                              display: 'flex',
                              gap: '8px',
                              background: flashId === reply.id ? '#fff7ed' : '#fafaf9',
                              border: flashId === reply.id ? '1.5px solid #f97316' : '1px solid transparent',
                              borderRadius: 10,
                              padding: '7px 9px',
                              transition: 'background 0.3s ease, border-color 0.3s ease',
                            }}
                          >
                            <div className="avatar avatar-sm" style={{ background: '#e7e5e4', color: '#78716c', width: '22px', height: '22px', fontSize: '10px', flexShrink: 0 }}>
                              {reply.user?.name?.charAt(0) || '?'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 700, fontSize: '11px', color: '#1c1917' }}>{reply.user?.name}</span>
                                {replyMine && (
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#c2410c', background: '#fff7ed', borderRadius: 999, padding: '0 6px' }}>you</span>
                                )}
                                <span style={{ fontSize: '10px', color: '#a8a29e', marginLeft: 'auto' }}>
                                  {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                </span>
                                {replyMine && (
                                  <button onClick={() => handleDelete(reply.id)} title="Delete reply" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d6d3d1', padding: 2, display: 'inline-flex', borderRadius: 6 }}>
                                    <Trash2 size={11} />
                                  </button>
                                )}
                              </div>
                              <p style={{ fontSize: '12px', color: '#44403c', margin: '2px 0 0', lineHeight: 1.5 }}>
                                {renderRichText(reply.content, people)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
