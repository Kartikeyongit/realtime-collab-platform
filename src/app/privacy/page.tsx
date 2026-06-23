'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

const sections = [
  {
    heading: 'Information We Collect',
    content: 'When you create an account, we collect your name, email address, and a password (stored as a bcrypt hash). We also collect document content you create and store it in our database. Usage data such as page views, feature interactions, and error logs may be collected to improve the service.',
  },
  {
    heading: 'How We Use Your Information',
    content: 'Your information is used to provide and maintain the CollabDocs service: authenticating you, storing and syncing your documents, enabling collaboration features, and sending service-related communications (such as password reset emails). We do not sell your personal information to third parties.',
  },
  {
    heading: 'Data Sharing',
    content: 'When you share a document with other users, those users can view and edit the document based on the permissions you set. We do not share your personal information with third parties except as required by law, to protect our rights, or with your explicit consent.',
  },
  {
    heading: 'Data Security',
    content: 'All data is encrypted in transit using TLS. Document content is stored in a PostgreSQL database with encryption at rest. Passwords are hashed using bcrypt. Access controls limit document visibility to authorized collaborators only.',
  },
  {
    heading: 'Data Retention',
    content: 'Your account and documents are retained until you delete them. Deleted documents are moved to Trash and permanently removed after 30 days. You can request account deletion at any time by contacting support@collabdocs.app.',
  },
  {
    heading: 'Cookies',
    content: 'We use essential cookies for authentication and session management. No third-party tracking cookies are used. You can control cookie settings through your browser preferences, though disabling cookies may affect core functionality like staying signed in.',
  },
  {
    heading: 'Changes to This Policy',
    content: 'We may update this privacy policy from time to time. Material changes will be communicated via email or through the application. Continued use of CollabDocs after changes constitutes acceptance of the updated policy.',
  },
  {
    heading: 'Contact',
    content: 'If you have questions about this privacy policy or your data, please contact us at support@collabdocs.app.',
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: '#1c1917' }}>Privacy Policy</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: 36 }}>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <AnimatedSection>
          <div className="card" style={{ padding: 24, border: '1.5px solid #e7e5e4' }}>
            {sections.map((sec, i) => (
              <div key={i} style={{ marginBottom: i < sections.length - 1 ? 24 : 0 }}>
                <h2 style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#1c1917' }}>{sec.heading}</h2>
                <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.7, margin: 0 }}>{sec.content}</p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
      <Footer />
    </div>
  );
}
