'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

const sections = [
  {
    heading: 'Acceptance of Terms',
    content: 'By accessing or using CollabDocs, you agree to be bound by these Terms of Service. If you do not agree, you may not use the service. These terms may be updated at any time; continued use after changes constitutes acceptance.',
  },
  {
    heading: 'Account Registration',
    content: 'You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account. Notify us immediately of any unauthorized use at support@collabdocs.app.',
  },
  {
    heading: 'Acceptable Use',
    content: 'You agree not to use CollabDocs for any unlawful purpose or in violation of any applicable laws. Prohibited activities include: uploading malicious content, attempting to disrupt the service, accessing other users\' documents without permission, and using the service to store or share illegal material.',
  },
  {
    heading: 'Intellectual Property',
    content: 'You retain ownership of the content you create in CollabDocs. By using the service, you grant us a limited license to store, process, and transmit your content solely for the purpose of providing the service. We do not claim ownership of your documents.',
  },
  {
    heading: 'Limitation of Liability',
    content: 'CollabDocs is provided "as is" without warranty of any kind. We are not liable for any damages arising from your use of the service, including data loss, service interruption, or any indirect or consequential damages. Our total liability is limited to the amount you have paid to use the service (which is currently $0).',
  },
  {
    heading: 'Termination',
    content: 'We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time from the Settings page. Upon termination, your documents will be deleted after 30 days in accordance with our data retention policy.',
  },
  {
    heading: 'Changes to Service',
    content: 'We may modify, suspend, or discontinue any aspect of CollabDocs at any time. We will make reasonable efforts to notify users of significant changes that affect functionality or data access.',
  },
  {
    heading: 'Contact',
    content: 'For questions about these terms, please contact us at support@collabdocs.app.',
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: '#1c1917' }}>Terms of Service</h1>
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
