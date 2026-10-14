'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, FileText, ArrowRight } from 'lucide-react';
import axios from 'axios';
import DOMPurify from 'dompurify';
import { formatDistanceToNow } from 'date-fns';

interface ViewData {
  title: string;
  html: string;
  ownerName: string;
  updatedAt: string;
  role: string;
}

export default function PublicSharePage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [doc, setDoc] = useState<ViewData | null>(null);
  const [docTitle, setDocTitle] = useState('');

  useEffect(() => {
    resolveToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const resolveToken = async (pwd?: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`/api/share/${token}/view`, { password: pwd });
      if (data.needsPassword) {
        setNeedsPassword(true);
        setDocTitle(data.documentTitle || 'Shared document');
      } else {
        setDoc(data);
        setNeedsPassword(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to open shared document');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resolveToken(password);
  };

  const cleanHtml = (html: string) =>
    DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'code', 'pre',
        'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4',
        'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'span', 'div', 'img', 'label', 'input',
      ],
      ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'class', 'type', 'checked', 'disabled'],
    });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#a8a29e', background: '#fdfbf7' }}>
        Opening shared document…
      </div>
    );
  }

  if (needsPassword && !doc) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#fdfbf7', padding: 16 }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e7e5e4', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', padding: '32px', width: '380px', maxWidth: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Lock size={24} color="#f97316" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>Password Required</h2>
            <p style={{ fontSize: '13px', color: '#78716c' }}>{docTitle || 'This document'}</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="input"
              style={{ width: '100%', marginBottom: '12px' }}
            />
            {error && <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '12px' }}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Open Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px', background: '#fdfbf7' }}>
        <FileText size={40} color="#d6d3d1" />
        <p style={{ fontSize: '15px', color: '#78716c' }}>{error || 'Opening document...'}</p>
        {error && (
          <Link href="/" className="btn btn-secondary btn-sm">
            Go Home
          </Link>
        )}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fdfbf7' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={18} color="white" />
          </span>
          <div>
            <div style={{ fontSize: 12, color: '#a8a29e' }}>
              Shared by {doc.ownerName} · updated {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 20px', color: '#1c1917' }}>
          {doc.title}
        </h1>
        <div style={{ background: 'white', border: '1.5px solid #e7e5e4', borderRadius: 16, padding: '40px 44px' }}>
          {doc.html ? (
            <div className="ProseMirror public-doc" dangerouslySetInnerHTML={{ __html: cleanHtml(doc.html) }} />
          ) : (
            <p style={{ color: '#a8a29e', fontSize: 14 }}>This document has no readable content.</p>
          )}
        </div>
        <div
          style={{
            marginTop: 24,
            background: 'white',
            border: '1.5px solid #e7e5e4',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Like collaborating like this?</div>
            <div style={{ fontSize: 12, color: '#78716c' }}>CollabDocs is free — docs, realtime co-editing, AI help.</div>
          </div>
          <Link href="/" className="btn btn-primary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            Try it free <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
