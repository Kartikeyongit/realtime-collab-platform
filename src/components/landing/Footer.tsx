import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { FileText } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

export function Footer() {
  const { data: session } = useSession();
  const router = useRouter();
  const linkStyle: React.CSSProperties = { display: 'block', fontSize: 13, color: '#78716c', textDecoration: 'none', lineHeight: '2.2' };

  const handleDashboard = (e: React.MouseEvent) => {
    if (!session) {
      e.preventDefault();
      router.push('/auth/signin');
    }
  };

  return (
    <footer style={{ background: '#fdfbf7', color: '#1c1917', padding: '48px 24px 32px', borderTop: '1.5px solid #e7e5e4' }}>
      <AnimatedSection>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={14} color="#fff" />
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1c1917' }}>CollabDocs</span>
              </div>
              <p style={{ fontSize: 12, color: '#78716c', lineHeight: 1.5, maxWidth: 200 }}>Write together, in sync. A beautiful collaborative editor for teams and individuals.</p>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#1c1917' }}>Product</div>
              <Link href="/templates" className="footer-link" style={linkStyle}>Templates</Link>
              <Link href="/dashboard" onClick={handleDashboard} className="footer-link" style={linkStyle}>Dashboard</Link>
              <Link href="/features" className="footer-link" style={linkStyle}>Features</Link>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#1c1917' }}>Support</div>
              <Link href="/docs" className="footer-link" style={linkStyle}>Documentation</Link>
              <Link href="/contact" className="footer-link" style={linkStyle}>Contact</Link>
              <Link href="/status" className="footer-link" style={linkStyle}>Status</Link>
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#1c1917' }}>Legal</div>
              <Link href="/privacy" className="footer-link" style={linkStyle}>Privacy Policy</Link>
              <Link href="/terms" className="footer-link" style={linkStyle}>Terms of Service</Link>
            </div>
          </div>
          <div style={{ borderTop: '1.5px solid #e7e5e4', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#78716c' }}>&copy; {new Date().getFullYear()} CollabDocs. All rights reserved.</span>
            <div style={{ display: 'flex', gap: 12 }}>
              {['X', 'GitHub', 'Discord'].map((s) => (
                <span key={s} className="footer-social" style={{ fontSize: 12, color: '#78716c', cursor: 'default' }}>{s}</span>
              ))}
            </div>
          </div>
        </div>
      </AnimatedSection>
      <style>{`
        .footer-link:hover { color: #f97316 !important; }
        .footer-social:hover { color: #f97316 !important; }
      `}</style>
    </footer>
  );
}
