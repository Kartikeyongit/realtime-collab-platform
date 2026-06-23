'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { AnimatedSection } from '@/components/landing/AnimatedSection';
import { Footer } from '@/components/landing/Footer';

const sections = [
  {
    title: 'Getting Started',
    items: [
      { heading: 'Creating a document', text: 'Click the "New Document" button on the home page or dashboard. You can choose a blank document or start from a template. Documents are saved automatically as you type.' },
      { heading: 'Using templates', text: 'Browse the Templates page for pre-built documents including meeting notes, project proposals, resumes, and more. Templates include placeholder content you can customize.' },
      { heading: 'Editor basics', text: 'The editor supports common formatting via the toolbar: headings, bold, italic, lists, tables, code blocks, and images. Use Ctrl+Z / Cmd+Z to undo and Ctrl+Shift+Z / Cmd+Shift+Z to redo.' },
    ],
  },
  {
    title: 'Collaboration',
    items: [
      { heading: 'Inviting collaborators', text: 'Open a document and click the Share button. You can invite users by entering their email address or generate a shareable link. Each collaborator can be assigned an Editor or Viewer role.' },
      { heading: 'Live cursors', text: 'When multiple people edit the same document, you will see colored cursors with each user\'s name. Changes appear in real-time — no page refresh needed.' },
      { heading: 'Comments', text: 'Select any text in the document and click the comment icon that appears. Comments are visible to all collaborators in real-time. Reply or resolve threads to keep discussions organized.' },
      { heading: 'Permissions', text: 'Editors can modify the document content. Viewers can only read the document. The document owner can change roles or remove collaborators at any time.' },
    ],
  },
  {
    title: 'Exporting',
    items: [
      { heading: 'PDF', text: 'Export to PDF via the File menu. The PDF preserves your document layout — headings, tables, images, and code blocks all render correctly. A print dialog will open; choose "Save as PDF" as the destination.' },
      { heading: 'Word (.docx)', text: 'Export to Word format for sharing with users who need to edit in Microsoft Word. Images, tables, text formatting, and lists are all preserved in the export.' },
      { heading: 'Markdown, HTML & Plain Text', text: 'These lightweight export formats are useful for developers or when you need the document content without rich formatting. Markdown is ideal for documentation, README files, and static site generators.' },
    ],
  },
  {
    title: 'Account',
    items: [
      { heading: 'Profile settings', text: 'Update your name and profile details from the Settings page. Your display name appears on live cursors and comments shared with collaborators.' },
      { heading: 'Password', text: 'Change your password from the Settings page. You must confirm your current password before setting a new one. Passwords are stored securely using bcrypt hashing.' },
      { heading: 'Trash', text: 'Deleted documents go to the Trash where they can be restored for up to 30 days. After 30 days, documents are permanently deleted.' },
    ],
  },
];

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '36px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#78716c', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}>
          <ArrowLeft size={16} /> Back to home
        </Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4, color: '#1c1917' }}>Documentation</h1>
        <p style={{ color: '#78716c', fontSize: 14, marginBottom: 36 }}>Learn how to use CollabDocs effectively.</p>

        {sections.map((section, i) => (
          <AnimatedSection key={i}>
            <div className="card" style={{ padding: 24, marginBottom: 20, border: '1.5px solid #e7e5e4' }}>
              <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 16, color: '#1c1917' }}>{section.title}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {section.items.map((item, j) => (
                  <div key={j}>
                    <h3 style={{ fontWeight: 500, fontSize: 14, marginBottom: 4, color: '#292524' }}>{item.heading}</h3>
                    <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6, margin: 0 }}>{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        ))}
      </div>
      <Footer />
    </div>
  );
}
