import Link from 'next/link';
import { FileText } from 'lucide-react';

export function Footer() {
  const linkStyle = { display: 'block', fontSize: 13, color: '#a8a29e', textDecoration: 'none', lineHeight: '2.2', transition: 'color 0.15s' };

  return (
    <footer style={{ background: '#1c1917', color: '#fff', padding: '48px 24px 32px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={14} color="#fff" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>CollabDocs</span>
            </div>
            <p style={{ fontSize: 12, color: '#78716c', lineHeight: 1.5, maxWidth: 200 }}>Write together, in sync. A beautiful collaborative editor for teams and individuals.</p>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#d6d3d1' }}>Product</div>
            <Link href="/templates" style={linkStyle}>Templates</Link>
            <Link href="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link href="#" style={linkStyle}>Features</Link>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#d6d3d1' }}>Support</div>
            <Link href="#" style={linkStyle}>Documentation</Link>
            <Link href="#" style={linkStyle}>Contact</Link>
            <Link href="#" style={linkStyle}>Status</Link>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, color: '#d6d3d1' }}>Legal</div>
            <Link href="#" style={linkStyle}>Privacy Policy</Link>
            <Link href="#" style={linkStyle}>Terms of Service</Link>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #292524', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#78716c' }}>&copy; {new Date().getFullYear()} CollabDocs. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 12 }}>
            {['X', 'GitHub', 'Discord'].map((s) => (
              <span key={s} style={{ fontSize: 12, color: '#78716c', cursor: 'default' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
