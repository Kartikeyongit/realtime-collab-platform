'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Check, ArrowLeft, FileText } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const justRegistered = searchParams.get('registered') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) setError('Invalid email or password');
      else { router.push('/'); router.refresh(); }
    } catch {
      setError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fdfbf7' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#78716c', textDecoration: 'none', fontSize: '14px', marginBottom: '32px' }}>
            <ArrowLeft size={16} /> Back to home
          </Link>
          
          <div className="card" style={{ padding: '36px' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(249,115,22,0.2)' }}>
                <FileText size={24} color="white" />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Welcome back</h1>
              <p style={{ fontSize: '14px', color: '#78716c' }}>Sign in to your account</p>
            </div>

            {justRegistered && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '22px', height: '22px', background: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={12} color="white" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#15803d' }}>Account created!</div>
                  <div style={{ fontSize: '12px', color: '#16a34a' }}>Please sign in.</div>
                </div>
              </div>
            )}

            <button type="button" onClick={() => signIn('google', { callbackUrl: '/' })} className="btn btn-secondary" style={{ width: '100%', padding: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '14px', fontWeight: 600, border: '1.5px solid #e7e5e4', background: 'white' }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '4px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#e7e5e4' }} />
              <span style={{ fontSize: '12px', color: '#a8a29e', fontWeight: 500 }}>or continue with email</span>
              <div style={{ flex: 1, height: '1px', background: '#e7e5e4' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>
              )}
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#44403c', marginBottom: '6px' }}>Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" autoComplete="email" />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#44403c', marginBottom: '6px' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: '40px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#78716c' }}>
              Don't have an account? <Link href="/auth/register" style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>Create one</Link>
            </div>

            <div style={{ marginTop: '20px', padding: '14px 16px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#c2410c', marginBottom: '8px' }}>Demo Account</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" onClick={() => { setEmail('test@example.com'); setPassword('password123'); }} style={{ padding: '6px 12px', background: 'white', border: '1px solid #fed7aa', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: '#c2410c', fontWeight: 500 }}>
                  Fill credentials
                </button>
                <button type="button" onClick={async () => { setEmail('test@example.com'); setPassword('password123'); setLoading(true); setError(''); const result = await signIn('credentials', { email: 'test@example.com', password: 'password123', redirect: false }); if (result?.error) setError('Demo account not found. Create one first.'); else { router.push('/'); router.refresh(); } setLoading(false); }} style={{ padding: '6px 12px', background: '#f97316', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', color: 'white', fontWeight: 500 }}>
                  Sign in as demo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'none', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', color: 'white', maxWidth: '400px' }}>
          <FileText size={48} style={{ marginBottom: '20px', opacity: 0.9 }} />
          <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '12px' }}>CollabDocs</h2>
          <p style={{ fontSize: '16px', opacity: 0.9, lineHeight: 1.6 }}>Create and edit documents together in real-time with your team.</p>
        </div>
      </div>
      <style>{`@media (min-width: 768px) { .hidden-md { display: flex !important; } }`}</style>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
