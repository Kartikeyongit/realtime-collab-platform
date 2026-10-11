'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Reply, Trash2, Check, Send, X } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { MentionInput, type MentionPerson } from './MentionInput';

interface Comment {
  id: string;
  content: string;
  userId: string;
  parentId?: string | null;
  resolved: boolean;
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

export function CommentThread({ comments, onResolve, onDelete, onClose, documentId, editor, emitComment, addToast, people = [] }: CommentThreadProps) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [newComment, setNewComment] = useState('');
  const [flashId, setFlashId] = useState<string | null>(null);

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

  const getSelectionPosition = () => {
    if (!editor) return {};
    const { from, to } = editor.state.selection;
    if (from === to) return {};
    return { from, to };
  };

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

  const handleResolve = (id: string) => {
    onResolve?.(id);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this comment?')) {
      onDelete?.(id);
    }
  };

  return (
    <div id="comment-thread" style={{ width: '320px', background: 'white', borderLeft: '1.5px solid #e7e5e4', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      <div style={{ padding: '16px 18px', borderBottom: '1.5px solid #e7e5e4', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={16} color="#f97316" />
        <h3 style={{ fontWeight: 600, fontSize: '14px' }}>Comments</h3>
        <span style={{ fontSize: '12px', color: '#a8a29e', background: '#f5f5f4', padding: '2px 8px', borderRadius: '10px' }}>{comments.length}</span>
        <div style={{ flex: 1 }} />
        {onClose && (
          <button onClick={onClose} style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#a8a29e', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f4'} onMouseLeave={(e) => e.currentTarget.style.background = 'none'} title="Close">
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* Add Comment Input */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '8px' }}>
          <div className="avatar avatar-sm" style={{ background: '#fed7aa', color: '#c2410c', flexShrink: 0, marginTop: '2px' }}>
            {session?.user?.name?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1 }}>
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              onSubmit={handleAddComment}
              people={people}
              placeholder="Add a comment... (type @ to mention)"
              style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '10px' }}
            />
            {newComment.trim() && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button onClick={handleAddComment} className="btn btn-primary btn-sm" style={{ padding: '5px 12px', fontSize: '12px' }}>
                  <Send size={12} style={{ marginRight: '4px' }} />
                  Comment
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a8a29e', fontSize: '13px', paddingTop: '20px' }}>No comments yet</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {comments.map((comment) => (
              <div
                key={comment.id}
                id={`comment-${comment.id}`}
                style={{
                  opacity: comment.resolved ? 0.6 : 1,
                  background: flashId === comment.id ? '#fff7ed' : 'transparent',
                  borderRadius: 10,
                  padding: flashId === comment.id ? 8 : 0,
                  transition: 'background 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div className="avatar avatar-sm" style={{ background: '#fed7aa', color: '#c2410c', flexShrink: 0 }}>
                    {comment.user?.name?.charAt(0) || '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 600, fontSize: '12px' }}>{comment.user?.name || 'User'}</span>
                      <span style={{ fontSize: '10px', color: '#d6d3d1' }}>
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#44403c', marginBottom: '6px', lineHeight: 1.5, textDecoration: comment.resolved ? 'line-through' : 'none' }}>
                      {comment.content}
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#a8a29e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Reply size={11} /> Reply
                      </button>
                      {!comment.resolved && (
                        <button onClick={() => handleResolve(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={11} /> Resolve
                        </button>
                      )}
                      {comment.userId === session?.user?.id && (
                        <button onClick={() => handleDelete(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Trash2 size={11} /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reply Input */}
                {replyTo === comment.id && (
                  <div style={{ marginTop: '8px', marginLeft: '34px', display: 'flex', gap: '6px' }}>
                    <MentionInput
                      value={replyText}
                      onChange={setReplyText}
                      onSubmit={() => {
                        if (!replyText.trim()) return;
                        emitComment?.({
                          documentId,
                          content: replyText.trim(),
                          parentId: comment.id,
                        });
                        setReplyText('');
                        setReplyTo(null);
                      }}
                      people={people}
                      placeholder="Write a reply... (type @ to mention)"
                      style={{ flex: 1, padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}
                    />
                    <button onClick={() => {
                      if (!replyText.trim()) return;
                      emitComment?.({
                        documentId,
                        content: replyText.trim(),
                        parentId: comment.id,
                      });
                      setReplyText('');
                      setReplyTo(null);
                    }} className="btn btn-primary btn-sm" style={{ padding: '5px 8px', fontSize: '11px' }}>Reply</button>
                  </div>
                )}

                {/* Nested Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ marginTop: '8px', marginLeft: '34px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        id={`comment-${reply.id}`}
                        style={{
                          display: 'flex',
                          gap: '8px',
                          background: flashId === reply.id ? '#fff7ed' : 'transparent',
                          borderRadius: 8,
                          padding: flashId === reply.id ? 6 : 0,
                          transition: 'background 0.3s ease',
                        }}
                      >
                        <div className="avatar avatar-sm" style={{ background: '#d6d3d1', color: '#78716c', width: '22px', height: '22px', fontSize: '10px' }}>
                          {reply.user?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <span style={{ fontWeight: 600, fontSize: '11px' }}>{reply.user?.name}</span>
                          <p style={{ fontSize: '12px', color: '#44403c' }}>{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
