'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock, FileText, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function SharedPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  useEffect(() => {
    resolveToken();
  }, [token]);

  const resolveToken = async (pwd?: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`/api/share/${token}`, { password: pwd });
      if (data.needsPassword) {
        setNeedsPassword(true);
        setDocumentTitle(data.documentTitle);
      } else {
        const expires = data.expiresAt ? new Date(data.expiresAt).toUTCString() : '';
        document.cookie = `share_${data.documentId}=${token}${expires ? '; expires=' + expires : '; max-age=2592000'}; path=/; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        router.push(`/documents/${data.documentId}`);
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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#a8a29e' }}>
        Opening shared document...
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#fdfbf7' }}>
        <div style={{ background: 'white', borderRadius: '16px', border: '1.5px solid #e7e5e4', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', padding: '32px', width: '380px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Lock size={24} color="#f97316" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontWeight: 700, fontSize: '17px', marginBottom: '4px' }}>Password Required</h2>
            <p style={{ fontSize: '13px', color: '#78716c' }}>{documentTitle || 'This document'}</p>
          </div>
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e7e5e4', borderRadius: '10px', fontSize: '14px', marginBottom: '12px', outline: 'none' }}
            />
            {error && <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '12px' }}>{error}</p>}
            <button type="submit" style={{ width: '100%', padding: '10px', background: '#f97316', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              Open Document
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', gap: '16px', background: '#fdfbf7' }}>
      <FileText size={40} color="#d6d3d1" />
      <p style={{ fontSize: '15px', color: '#78716c' }}>{error || 'Opening document...'}</p>
      {error && (
        <button onClick={() => router.push('/')} className="btn btn-secondary btn-sm">
          Go Home
        </button>
      )}
    </div>
  );
}
