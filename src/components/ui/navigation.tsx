'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import axios from 'axios';
import { showError } from '@/lib/toast';
import { Plus, FileText, LayoutDashboard, LogOut, ChevronDown, Trash2, Settings, LayoutTemplate } from 'lucide-react';

export function Navigation() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleNewDocument = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post('/api/documents', { title: 'Untitled' });
      router.push(`/documents/${data.id}`);
    } catch {
      showError('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <nav style={{ 
      background: 'rgba(253,251,247,0.9)', 
      backdropFilter: 'blur(12px)',
      borderBottom: '1.5px solid #e7e5e4', 
      position: 'sticky', 
      top: 0, 
      zIndex: 40,
      height: '52px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ 
              width: '30px', height: '30px', 
              background: 'linear-gradient(135deg, #f97316, #ea580c)', 
              borderRadius: '8px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700, fontSize: '17px', color: '#1c1917', letterSpacing: '-0.02em' }}>CollabDocs</span>
          </Link>
          {session && (
            <>
              <Link href="/dashboard" style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LayoutDashboard size={15} />
                Documents
              </Link>
              <Link href="/templates" style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <LayoutTemplate size={15} />
                Templates
              </Link>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {session ? (
            <>
              <button onClick={handleNewDocument} disabled={creating} className="btn btn-primary btn-sm">
                <Plus size={14} />
                {creating ? '...' : 'New'}
              </button>
              <div style={{ position: 'relative' }}>
                <button onClick={() => setMenuOpen(!menuOpen)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '10px', border: 'none', background: 'none', cursor: 'pointer' }}>
                  <div className="avatar avatar-sm">{session.user?.name?.charAt(0) || 'U'}</div>
                  <ChevronDown size={14} color="#a8a29e" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {menuOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 30 }} onClick={() => setMenuOpen(false)} />
                    <div className="dropdown" style={{ right: 0 }}>
                      <div style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>{session.user?.name}</div>
                        <div style={{ fontSize: '11px', color: '#a8a29e' }}>{session.user?.email}</div>
                      </div>
                      <div className="dropdown-divider" />
                      <button onClick={() => { setMenuOpen(false); router.push('/dashboard'); }} className="dropdown-item">
                        <LayoutDashboard size={15} /> Dashboard
                      </button>
                      <button onClick={() => { setMenuOpen(false); router.push('/templates'); }} className="dropdown-item">
                        <LayoutTemplate size={15} /> Templates
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => { setMenuOpen(false); router.push('/trash'); }} className="dropdown-item">
                        <Trash2 size={15} /> Trash
                      </button>
                      <button onClick={() => { setMenuOpen(false); router.push('/settings'); }} className="dropdown-item">
                        <Settings size={15} /> Settings
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => signOut({ callbackUrl: '/auth/signin' })} className="dropdown-item danger">
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/signin" className="btn btn-ghost btn-sm">Sign in</Link>
              <Link href="/auth/register" className="btn btn-primary btn-sm">Get started</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
