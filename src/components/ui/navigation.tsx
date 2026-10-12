'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { showError, showSuccess, showInfo } from '@/lib/toast';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { useInstallPrompt, getInstallDiagnostics } from '@/lib/pwa';
import { Plus, FileText, LayoutDashboard, LogOut, ChevronDown, Trash2, Settings, LayoutTemplate, CalendarDays, Loader2, CheckSquare, Sparkles, Download } from 'lucide-react';

export function Navigation() {  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openingToday, setOpeningToday] = useState(false);
  const [openTasks, setOpenTasks] = useState(0);

  useEffect(() => {
    if (!session) return;
    axios
      .get('/api/tasks')
      .then(({ data }) => {
        const b = data.buckets || {};
        setOpenTasks(
          (b.overdue?.length || 0) + (b.today?.length || 0) + (b.upcoming?.length || 0) + (b.nodate?.length || 0)
        );
      })
      .catch(() => {});
  }, [session]);

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

  const handleToday = async () => {
    if (openingToday) return;
    setOpeningToday(true);
    try {
      const { data } = await axios.get('/api/documents/daily');
      router.push(`/documents/${data.document.id}`);
    } catch {
      showError("Couldn't open today's note");
    } finally {
      setOpeningToday(false);
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
              <span className="nav-hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
                <Link href="/dashboard" style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LayoutDashboard size={15} />
                  Documents
                </Link>
                <Link href="/templates" style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <LayoutTemplate size={15} />
                  Templates
                </Link>
                <button onClick={handleToday} disabled={openingToday} title="Open today's journal" style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                  {openingToday ? <Loader2 size={15} className="animate-spin" /> : <CalendarDays size={15} />}
                  Today
                </button>
                <Link href="/tasks" style={{ fontSize: '14px', fontWeight: 500, color: '#78716c', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckSquare size={15} />
                  Tasks
                  {openTasks > 0 && (
                    <span style={{ minWidth: 18, height: 18, borderRadius: 999, background: '#f97316', color: 'white', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                      {openTasks > 99 ? '99+' : openTasks}
                    </span>
                  )}
                </Link>
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {session ? (
            <>
              <button onClick={handleNewDocument} disabled={creating} data-tour="new-doc" className="btn btn-primary btn-sm">
                <Plus size={14} />
                {creating ? '...' : 'New'}
              </button>
              <NotificationCenter />
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
                      <button onClick={() => {
                        setMenuOpen(false);
                        if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
                          window.dispatchEvent(new Event('collabdocs-start-tour'));
                        } else {
                          try { sessionStorage.setItem('collabdocs-tour-replay', '1'); } catch {}
                          router.push('/dashboard');
                        }
                      }} className="dropdown-item">
                        <Sparkles size={15} /> Take the tour
                      </button>
                      <button onClick={() => { setMenuOpen(false); handleToday(); }} className="dropdown-item">
                        <CalendarDays size={15} /> Today
                      </button>
                      <button onClick={() => { setMenuOpen(false); router.push('/tasks'); }} className="dropdown-item">
                        <CheckSquare size={15} /> Tasks
                        {openTasks > 0 && (
                          <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, borderRadius: 999, background: '#f97316', color: 'white', fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                            {openTasks > 99 ? '99+' : openTasks}
                          </span>
                        )}
                      </button>
                      <div className="dropdown-divider" />
                      <button onClick={() => { setMenuOpen(false); router.push('/trash'); }} className="dropdown-item">
                        <Trash2 size={15} /> Trash
                      </button>
                      <button onClick={() => { setMenuOpen(false); router.push('/settings'); }} className="dropdown-item">
                        <Settings size={15} /> Settings
                      </button>
                      <InstallMenuItem onDone={() => setMenuOpen(false)} />
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

function InstallMenuItem({ onDone }: { onDone: () => void }) {
  const { canInstall, isIos, isStandalone, install } = useInstallPrompt();
  // Installed already → nothing to offer. Otherwise always show: automatic
  // prompt when Chrome fires it, manual steps when it doesn't (fresh profile,
  // dev build without SW, heuristics not yet met).
  if (isStandalone) return null;
  if (typeof window !== 'undefined' && !('serviceWorker' in navigator) && !isIos) return null;
  return (
    <button
      onClick={async () => {
        onDone();
        if (canInstall) {
          const outcome = await install();
          if (outcome === 'accepted') showSuccess('CollabDocs installed!');
          else if (outcome === 'dismissed') showInfo('Install dismissed — find it here anytime.');
          return;
        }
        if (isIos) {
          showInfo('On iPhone: tap Share, then "Add to Home Screen" to install CollabDocs.');
          return;
        }
        // Diagnose instead of guessing: tell the user the exact blocker.
        const d = await getInstallDiagnostics();
        if (d.alreadyInstalled) {
          showInfo('CollabDocs is already installed — look in your apps list.');
        } else if (!d.secureContext) {
          showInfo('Install needs HTTPS (or localhost) — the live site qualifies, plain HTTP does not.');
        } else if (!d.swRegistered || !d.swActive) {
          showInfo('App shell still activating — browse for a few seconds, then try Install again.');
        } else if (!d.manifestOk) {
          showInfo('Install manifest failed to load — check connection and retry.');
        } else {
          showInfo('Almost there: click around and spend ~30 seconds in the app — Chrome only offers install to engaged visitors. Then use the address-bar install icon or come back here.');
        }
      }}
      className="dropdown-item"
    >
      <Download size={15} /> Install app
    </button>
  );
}
