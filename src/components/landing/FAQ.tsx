'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

const faqs = [
  { q: 'Is CollabDocs really free?', a: 'Yes! CollabDocs is completely free to use. There are no paid plans or hidden fees. All features including real-time collaboration, templates, and exports are available at no cost.' },
  { q: 'Can multiple people edit a document at the same time?', a: 'Absolutely. Multiple collaborators can edit the same document simultaneously. You will see live cursors showing where others are typing, and changes appear in real-time — just like Google Docs.' },
  { q: 'How do I share a document with someone?', a: 'Open any document and click the Share button. You can invite people by email or generate a shareable link. Each collaborator can be assigned an Editor or Viewer role.' },
  { q: 'What export formats are supported?', a: 'You can export documents to PDF, Word (.docx), Markdown, HTML, and plain text. Each format preserves your formatting, tables, images, and code blocks.' },
  { q: 'Is my data secure?', a: 'All data is encrypted in transit and at rest. Documents are stored securely in PostgreSQL. Only people you explicitly invite can access your documents.' },
  { q: 'Do I need an account to view a shared document?', a: 'If you share via email invitation, the recipient needs to sign in. If you use a shareable link with public access, anyone with the link can view the document.' },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>(faqs.map(() => 0));

  useEffect(() => {
    setHeights(faqs.map((_, i) => {
      const el = contentRefs.current[i];
      return el ? el.scrollHeight : 0;
    }));
  }, []);

  return (
    <section style={{ padding: '70px 24px', maxWidth: 700, margin: '0 auto' }}>
      <AnimatedSection>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, color: '#1c1917' }}>Frequently asked questions</h2>
          <p style={{ color: '#78716c', fontSize: 15 }}>Everything you need to know about CollabDocs.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i} style={{ border: '1.5px solid #e7e5e4', borderRadius: 12, background: '#fff', overflow: 'hidden' }}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#1c1917', lineHeight: 1.4 }}
                >
                  {faq.q}
                  <ChevronDown size={16} style={{ flexShrink: 0, color: '#a8a29e', transition: 'transform 0.2s ease', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                <div
                  style={{
                    overflow: 'hidden',
                    transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    height: isOpen ? heights[i] : 0,
                  }}
                >
                  <div ref={(el) => { contentRefs.current[i] = el; }} style={{ padding: '0 20px 16px', fontSize: 13, color: '#57534e', lineHeight: 1.6 }}>{faq.a}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AnimatedSection>
    </section>
  );
}
