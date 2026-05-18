'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Eye, EyeOff, Check, X, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (pw: string) => ({
    length: pw.length >= 6,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /\d/.test(pw),
  });

  const reqs = validate(form.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    
    setLoading(true);
    try {
      await axios.post('/api/auth/register', { name: form.name, email: form.email, password: form.password });
      setSuccess(true);
      setTimeout(() => router.push('/auth/signin?registered=true'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const update = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  if (success) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fdfbf7' }}>
        <div className="card" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ width: '56px', height: '56px', background: '#f0fdf4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Check size={28} color="#22c55e" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Account created!</h2>
          <p style={{ color: '#78716c', fontSize: '14px' }}>Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#fdfbf7' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#78716c', textDecoration: 'none', fontSize: '14px', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Back
        </Link>
        
        <div className="card" style={{ padding: '36px' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '4px' }}>Create account</h1>
            <p style={{ fontSize: '14px', color: '#78716c' }}>Start collaborating today</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', fontSize: '13px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <X size={14} /> {error}
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#44403c', marginBottom: '6px' }}>Full Name</label>
              <input type="text" name="name" required value={form.name} onChange={update} className="input" placeholder="John Doe" />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#44403c', marginBottom: '6px' }}>Email</label>
              <input type="email" name="email" required value={form.email} onChange={update} className="input" placeholder="you@example.com" />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#44403c', marginBottom: '6px' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} name="password" required value={form.password} onChange={update} className="input" placeholder="••••••••" style={{ paddingRight: '40px' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { key: 'length', label: 'At least 6 characters' },
                    { key: 'upper', label: 'One uppercase letter' },
                    { key: 'lower', label: 'One lowercase letter' },
                    { key: 'number', label: 'One number' },
                  ].map(({ key, label }) => {
                    const valid = reqs[key as keyof typeof reqs];
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: valid ? '#16a34a' : '#a8a29e' }}>
                        {valid ? <Check size={12} /> : <X size={12} />} {label}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#44403c', marginBottom: '6px' }}>Confirm Password</label>
              <input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={update} className="input" placeholder="••••••••" />
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>Passwords don't match</p>
              )}
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }}>
              {loading ? 'Creating...' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#78716c' }}>
            Already have an account? <Link href="/auth/signin" style={{ color: '#f97316', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
