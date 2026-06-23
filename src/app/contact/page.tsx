'use client';

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Clock } from 'lucide-react';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

export default function ContactPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: '#1c1917' }}>Contact</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: 36 }}>Get in touch with the CollabDocs team.</p>

        <AnimatedSection>
          <div className="card" style={{ padding: 24, marginBottom: 20, border: '1.5px solid #e7e5e4' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <Mail size={20} color="#f97316" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1c1917' }}>Email</h2>
                <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6, margin: 0 }}>
                  Send us an email at{' '}
                  <a href="mailto:support@collabdocs.app" style={{ color: '#f97316', textDecoration: 'underline' }}>support@collabdocs.app</a>.
                  We typically respond within 24 hours on business days.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="card" style={{ padding: 24, marginBottom: 20, border: '1.5px solid #e7e5e4' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <MessageSquare size={20} color="#8b5cf6" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1c1917' }}>Support Resources</h2>
                <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6, margin: 0 }}>
                  Before reaching out, check our{' '}
                  <Link href="/docs" style={{ color: '#f97316', textDecoration: 'underline' }}>Documentation</Link> for guides and
                  answers to common questions. You can also visit our{' '}
                  <Link href="/status" style={{ color: '#f97316', textDecoration: 'underline' }}>Status page</Link> for service availability.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection>
          <div className="card" style={{ padding: 24, border: '1.5px solid #e7e5e4' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <Clock size={20} color="#22c55e" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1c1917' }}>Response Time</h2>
                <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6, margin: 0 }}>
                  We aim to respond to all inquiries within 24 hours during business days (Monday–Friday). Emails sent on weekends
                  or holidays will be answered the next business day.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
      <Footer />
    </div>
  );
}
