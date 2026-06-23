'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Zap, Users, Search, Sparkles, Shield, Globe, Wand2 } from 'lucide-react';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

const features = [
  {
    icon: Zap, title: 'Lightning Fast', color: '#f97316', bg: '#fff7ed',
    description: 'Real-time sync powered by CRDT technology ensures zero-lag collaboration across all devices.',
    points: ['Sub-100ms sync latency', 'Offline-aware with automatic merge', 'Works on any device with a browser', 'No page refreshes needed for updates'],
  },
  {
    icon: Users, title: 'Team Collaboration', color: '#8b5cf6', bg: '#f5f3ff',
    description: 'See exactly what your teammates are doing with live cursors and instant document updates.',
    points: ['Live cursors with user names', 'Role-based access (Editor / Viewer)', 'Share via email or link', 'Real-time comments on any selection'],
  },
  {
    icon: Search, title: 'Find & Replace', color: '#3b82f6', bg: '#eff6ff',
    description: 'Quickly search through your document and replace text across the entire page.',
    points: ['Case-sensitive and whole-word modes', 'Replace individual or all matches', 'Regex search support', 'Keyboard shortcuts (Ctrl+F / Cmd+F)'],
  },
  {
    icon: Sparkles, title: 'Rich Formatting', color: '#22c55e', bg: '#f0fdf4',
    description: 'A full-featured editor with support for tables, images, code blocks, and every text style.',
    points: ['Headings, bold, italic, strikethrough, code', 'Tables with row/column management', 'Code blocks with syntax highlighting', 'Images (inline, drag-and-drop, URL)'],
  },
  {
    icon: Shield, title: 'Secure Storage', color: '#ef4444', bg: '#fef2f2',
    description: 'Your documents are encrypted and stored safely in PostgreSQL with industry-standard practices.',
    points: ['Encryption in transit (TLS) and at rest', 'Regular automated database backups', 'Access controlled per-document', 'Session-based authentication via NextAuth'],
  },
  {
    icon: Globe, title: 'Export Anywhere', color: '#06b6d4', bg: '#ecfeff',
    description: 'Export your documents in multiple formats while preserving layout, images, and styling.',
    points: ['PDF export with proper page breaks', 'Word (.docx) with full formatting', 'Markdown for developers', 'HTML and plain text exports'],
  },
  {
    icon: Wand2, title: 'AI Assistant', color: '#f97316', bg: '#fff7ed',
    description: 'Improve, summarize, grammar-check, or expand your writing with AI — including custom instructions.',
    points: ['Improve writing clarity and tone', 'Fix grammar and spelling instantly', 'Summarize or expand any selection', 'Custom instructions ("make it funnier", "translate to Spanish")'],
  },
];

export default function FeaturesPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: '#1c1917' }}>Features</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: 36 }}>Everything CollabDocs offers to make real-time collaboration seamless.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {features.map((f, i) => (
            <AnimatedSection key={i}>
              <div className="card" style={{ padding: 24, border: '1.5px solid #e7e5e4' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <f.icon size={22} color={f.color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 4, color: '#1c1917' }}>{f.title}</h2>
                    <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6, marginBottom: 12 }}>{f.description}</p>
                    <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {f.points.map((pt, j) => (
                        <li key={j} style={{ fontSize: 13, color: '#78716c', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ width: 4, height: 4, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        <AnimatedSection>
          <div style={{ textAlign: 'center', margin: '48px 0', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderRadius: 24, padding: '40px 24px', color: 'white' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Ready to try them out?</h2>
            <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 20 }}>Create a free account and start collaborating in seconds.</p>
            <Link href="/auth/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', color: '#f97316', padding: '12px 24px', borderRadius: 12, fontWeight: 600, textDecoration: 'none', fontSize: 14 }}>
              Get started free <ArrowRight size={16} />
            </Link>
          </div>
        </AnimatedSection>
      </div>
      <Footer />
    </div>
  );
}
