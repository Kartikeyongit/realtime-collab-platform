'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Users, Search, Sparkles, ArrowRight, Zap, Shield, Globe } from 'lucide-react';

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [typedText, setTypedText] = useState('');
  const fullText = 'together, in sync';

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.substring(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const createDocument = async () => {
    setCreating(true);
    try {
      const { data } = await axios.post('/api/documents', { title: 'Untitled' });
      router.push(`/documents/${data.id}`);
    } catch {
      toast.error('Failed');
    } finally {
      setCreating(false);
    }
  };

  const stats = [
    { icon: Users, value: '10K+', label: 'Teams' },
    { icon: Globe, value: '50K+', label: 'Documents' },
    { icon: Shield, value: '99.9%', label: 'Uptime' },
  ];

  const features = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Real-time sync across all devices with zero lag.', color: '#f97316', bg: '#fff7ed' },
    { icon: Users, title: 'Team Collaboration', desc: 'Live cursors show who\'s editing what in real-time.', color: '#8b5cf6', bg: '#f5f3ff' },
    { icon: Search, title: 'Find & Replace', desc: 'Search and replace text across your document instantly.', color: '#3b82f6', bg: '#eff6ff' },
    { icon: Sparkles, title: 'Rich Formatting', desc: 'Tables, images, code blocks, and more built right in.', color: '#22c55e', bg: '#f0fdf4' },
    { icon: Shield, title: 'Secure Storage', desc: 'Enterprise-grade encryption keeps your data safe.', color: '#ef4444', bg: '#fef2f2' },
    { icon: Globe, title: 'Export Anywhere', desc: 'Export to PDF, Word, Markdown, HTML, and plain text.', color: '#06b6d4', bg: '#ecfeff' },
  ];

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', maxWidth: '750px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '20px', fontSize: '13px', color: '#c2410c', fontWeight: 500, marginBottom: '24px' }}>
          <Sparkles size={14} /> The future of document collaboration
        </div>
        
        <h1 style={{ fontSize: '52px', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '16px', color: '#1c1917' }}>
          Write <span style={{ color: '#f97316' }}>{typedText}</span>
          <span style={{ animation: 'blink 1s infinite', color: '#f97316' }}>|</span>
        </h1>
        
        <p style={{ fontSize: '18px', color: '#78716c', marginBottom: '40px', lineHeight: 1.6, maxWidth: '500px', margin: '0 auto 40px' }}>
          A beautiful collaborative editor where teams create documents together in real-time.
        </p>
        
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
          {session ? (
            <button onClick={createDocument} disabled={creating} className="btn btn-primary btn-lg">
              <Plus size={20} /> {creating ? 'Creating...' : 'New Document'}
            </button>
          ) : (
            <>
              <Link href="/auth/register" className="btn btn-primary btn-lg" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Start writing free <ArrowRight size={18} />
              </Link>
              <Link href="/auth/signin" className="btn btn-secondary btn-lg">Sign in</Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', flexWrap: 'wrap' }}>
          {stats.map((s, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100px' }}>
              <s.icon size={20} color="#d6d3d1" style={{ marginBottom: '6px' }} />
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#1c1917' }}>{s.value}</div>
              <div style={{ fontSize: '12px', color: '#a8a29e' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 24px', maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '8px' }}>Everything you need</h2>
          <p style={{ color: '#78716c', fontSize: '15px' }}>Powerful features to help your team work better together</p>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {features.map((f, i) => (
            <div key={i} className="card" style={{ padding: '28px 24px', textAlign: 'center', border: '1.5px solid #e7e5e4' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <f.icon size={22} color={f.color} />
              </div>
              <h3 style={{ fontWeight: 600, marginBottom: '6px', fontSize: '15px' }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!session && (
        <section style={{ padding: '60px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '550px', margin: '0 auto', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: '24px', padding: '48px 32px', color: 'white' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 700, marginBottom: '10px' }}>Ready to collaborate?</h2>
            <p style={{ fontSize: '15px', opacity: 0.9, marginBottom: '24px' }}>Join teams who already create together on CollabDocs.</p>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#f97316', padding: '14px 28px', borderRadius: '12px', fontWeight: 600, textDecoration: 'none', fontSize: '15px' }}>
              Get started free <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
