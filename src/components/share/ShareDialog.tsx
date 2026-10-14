'use client';

import { useState, useEffect } from 'react';
import { X, Link, Mail, Copy, Check, Loader2, Clock, Lock, Globe, Trash2, Plus, UserX, ChevronDown, Share2 } from 'lucide-react';
import axios from 'axios';

interface ShareLink {
  id: string;
  token: string;
  password: string | null;
  expiresAt: string | null;
  role?: string | null;
  createdAt: string;
}

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  collaborators: Array<{ id: string; user: { name?: string | null; email?: string | null }; role: string }>;
  addToast: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  onCollaboratorChange?: () => void;
}

export function ShareDialog({ isOpen, onClose, documentId, documentTitle, collaborators, addToast, onCollaboratorChange }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showCreateLink, setShowCreateLink] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [linkExpiry, setLinkExpiry] = useState('');
  const [linkRole, setLinkRole] = useState<'viewer' | 'editor'>('viewer');
  const [creatingLink, setCreatingLink] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => { if (isOpen) fetchShareLinks(); }, [isOpen, documentId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const fetchShareLinks = async () => {
    setLoadingLinks(true);
    try {
      const { data } = await axios.get(`/api/documents/${documentId}/share-links`);
      setShareLinks(data);
    } catch { /* ignore */ }
    finally { setLoadingLinks(false); }
  };

  const handleRemove = async (collaboratorId: string) => {
    setRemovingId(collaboratorId);
    try {
      await axios.delete(`/api/documents/${documentId}/share`, { data: { collaboratorId } });
      addToast('Collaborator removed', 'success');
      onCollaboratorChange?.();
    } catch { addToast('Failed to remove', 'error'); }
    finally { setRemovingId(null); }
  };

  const handleAdd = async () => {
    if (!email) return;
    setSharing(true);
    try {
      await axios.post(`/api/documents/${documentId}/share`, { email, role });
      setEmail('');
      addToast('Collaborator added!', 'success');
    } catch (err: any) { addToast(err.response?.data?.error || 'Failed', 'error'); }
    finally { setSharing(false); }
  };

  const createShareLink = async () => {
    setCreatingLink(true);
    try {
      const { data } = await axios.post(`/api/documents/${documentId}/share-links`, { password: linkPassword || null, expiresAt: linkExpiry || null, role: linkRole });
      setShareLinks(prev => [data, ...prev]);
      setShowCreateLink(false);
      setLinkPassword('');
      setLinkExpiry('');
      setLinkRole('viewer');
      addToast('Share link created!', 'success');
    } catch { addToast('Failed', 'error'); }
    finally { setCreatingLink(false); }
  };

  const deleteShareLink = async (id: string) => {
    try {
      await axios.delete(`/api/documents/${documentId}/share-links/${id}`);
      setShareLinks(prev => prev.filter(l => l.id !== id));
      addToast('Link removed', 'success');
    } catch { addToast('Failed', 'error'); }
  };

  const copyLink = async (token: string) => {
    const link = `${window.location.origin}/s/${token}`;
    await navigator.clipboard.writeText(link);
    setCopied(token);
    addToast('Link copied!', 'success');
    setTimeout(() => setCopied(null), 2000);
  };

  const expiresIn = (iso: string): string => {
    const ms = new Date(iso).getTime() - Date.now();
    if (ms <= 0) return 'expired';
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m left`;
    const hours = Math.floor(mins / 60);
    if (hours < 48) return `${hours}h left`;
    return `${Math.floor(hours / 24)}d left`;
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '20px', border: '1.5px solid #e7e5e4', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', width: 'min(480px, 100%)', maxHeight: '84vh', overflow: 'auto', animation: 'scaleIn 0.2s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 14px', borderBottom: '1.5px solid #f5f5f4', background: '#fdfbf7', borderRadius: '20px 20px 0 0', position: 'sticky', top: 0, zIndex: 2 }}>
          <span style={{ width: 36, height: 36, borderRadius: 12, background: '#fff7ed', border: '1.5px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c', flexShrink: 0 }}>
            <Share2 size={18} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Share “{documentTitle}”</h2>
            <p style={{ fontSize: '12px', color: '#a8a29e' }}>Invite people or create a link</p>
          </div>
          <button onClick={onClose} title="Close" style={{ background: '#fafaf9', border: '1.5px solid #e7e5e4', borderRadius: 999, cursor: 'pointer', color: '#78716c', width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={15} /></button>
        </div>
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>Add People</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Mail size={14} color="#a8a29e" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="input" style={{ paddingLeft: '36px' }} onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
              </div>
              <div style={{ position: 'relative', width: '95px' }}>
                <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'space-between', gap: 4, padding: '10px 12px', fontSize: 14, borderRadius: 8, background: '#fafaf9', border: '1.5px solid #e7e5e4' }}>
                  {role === 'editor' ? 'Editor' : 'Viewer'}
                  <ChevronDown size={14} style={{ transition: 'transform 0.2s', transform: showRoleMenu ? 'rotate(180deg)' : 'none' }} />
                </button>
                {showRoleMenu && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setShowRoleMenu(false)} />
                    <div className="dropdown" style={{ right: 0, left: 0, minWidth: 'unset', padding: 4 }}>
                      <button onClick={() => { setRole('editor'); setShowRoleMenu(false); }} className="dropdown-item" style={{ fontSize: 13, padding: '7px 10px', ...role === 'editor' ? { background: '#fff7ed', color: '#f97316' } : {} }}>
                        Editor
                      </button>
                      <button onClick={() => { setRole('viewer'); setShowRoleMenu(false); }} className="dropdown-item" style={{ fontSize: 13, padding: '7px 10px', ...role === 'viewer' ? { background: '#fff7ed', color: '#f97316' } : {} }}>
                        Viewer
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button onClick={handleAdd} disabled={sharing} className="btn btn-primary btn-sm">
                {sharing ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
              </button>
            </div>
          </div>
          {collaborators.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>People with access</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {collaborators.map((c) => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '12px', background: '#fafaf9', border: '1.5px solid #f5f5f4' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar avatar-sm" style={{ background: '#fed7aa', color: '#c2410c' }}>{c.user.name?.charAt(0) || '?'}</div>
                        <div><div style={{ fontSize: '13px', fontWeight: 500 }}>{c.user.name}</div><div style={{ fontSize: '11px', color: '#a8a29e' }}>{c.user.email}</div></div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge badge-orange" style={{ fontSize: '10px' }}>{c.role}</span>
                        <button onClick={() => handleRemove(c.id)} disabled={removingId === c.id} className="btn btn-ghost btn-sm" style={{ padding: '4px', color: '#ef4444' }}>
                          {removingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Share Links</label>
              <button onClick={() => setShowCreateLink(!showCreateLink)} className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}><Plus size={13} /> New Link</button>
            </div>
            {showCreateLink && (
              <div style={{ padding: '12px', background: '#fff7ed', border: '1.5px solid #fed7aa', borderRadius: '12px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['viewer', 'editor'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setLinkRole(r)}
                      title={r === 'viewer' ? 'Read-only public page' : 'Full access in the editor'}
                      style={{
                        flex: 1, fontSize: '12px', fontWeight: 600, padding: '7px 0', borderRadius: 8,
                        border: '1.5px solid', borderColor: linkRole === r ? '#f97316' : '#e7e5e4',
                        background: linkRole === r ? 'white' : 'transparent',
                        color: linkRole === r ? '#c2410c' : '#78716c', cursor: 'pointer',
                      }}
                    >
                      {r === 'viewer' ? 'Can view' : 'Can edit'}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}><Lock size={13} color="#a8a29e" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} /><input type="password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} placeholder="Password (optional)" className="input" style={{ paddingLeft: '32px', fontSize: '12px' }} /></div>
                  <div style={{ flex: 1, position: 'relative' }}><Clock size={13} color="#a8a29e" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} /><input type="datetime-local" value={linkExpiry} onChange={(e) => setLinkExpiry(e.target.value)} className="input" style={{ paddingLeft: '32px', fontSize: '12px' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowCreateLink(false)} className="btn btn-ghost btn-sm" style={{ fontSize: '12px' }}>Cancel</button>
                  <button onClick={createShareLink} disabled={creatingLink} className="btn btn-primary btn-sm" style={{ fontSize: '12px' }}>{creatingLink ? <Loader2 size={12} className="animate-spin" /> : 'Create'}</button>
                </div>
              </div>
            )}
            {loadingLinks ? (
              <div style={{ textAlign: 'center', padding: '12px' }}><Loader2 size={14} className="animate-spin" color="#a8a29e" /></div>
            ) : shareLinks.length === 0 && !showCreateLink ? (
              <p style={{ fontSize: '12px', color: '#a8a29e', textAlign: 'center', padding: '12px' }}>No share links yet</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {shareLinks.map((link) => {
                  const role = link.role === 'editor' ? 'editor' : 'viewer';
                  const expired = link.expiresAt ? new Date(link.expiresAt) < new Date() : false;
                  return (
                  <div key={link.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: '12px', background: expired ? '#fef2f2' : '#fafaf9', border: '1.5px solid #f5f5f4', opacity: expired ? 0.7 : 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
                      {link.password ? <Lock size={13} color="#f97316" /> : <Globe size={13} color="#22c55e" />}
                      <span style={{ fontSize: '12px', color: '#78716c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>.../{link.token.substring(0, 8)}</span>
                      <span
                        title={role === 'editor' ? 'Opens with full edit access' : 'Opens a read-only page'}
                        style={{ fontSize: '10px', fontWeight: 700, borderRadius: 999, padding: '1px 7px', background: role === 'editor' ? '#fff7ed' : '#f0fdf4', color: role === 'editor' ? '#c2410c' : '#15803d', border: role === 'editor' ? '1px solid #fed7aa' : '1px solid #bbf7d0', flexShrink: 0 }}
                      >
                        {role === 'editor' ? 'Can edit' : 'Can view'}
                      </span>
                      {link.expiresAt && (
                        <span title={expired ? 'Expired' : `Expires ${new Date(link.expiresAt).toLocaleString()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: '10px', color: expired ? '#dc2626' : '#a8a29e', flexShrink: 0 }}>
                          <Clock size={11} color={expired ? '#ef4444' : '#a8a29e'} />
                          {expired ? 'expired' : expiresIn(link.expiresAt)}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button onClick={() => copyLink(link.token)} className="btn btn-ghost btn-sm" style={{ padding: '4px' }}>{copied === link.token ? <Check size={13} color="#22c55e" /> : <Copy size={13} />}</button>
                      <button onClick={() => deleteShareLink(link.id)} className="btn btn-ghost btn-sm" style={{ padding: '4px', color: '#ef4444' }} title="Revoke link"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
