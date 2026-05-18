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
