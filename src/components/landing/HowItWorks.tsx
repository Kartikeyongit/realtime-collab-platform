import { FileText, UserPlus, Users, Download } from 'lucide-react';

const steps = [
  { icon: FileText, title: 'Create a document', desc: 'Start with a blank page or choose from 17+ templates designed for every need.' },
  { icon: UserPlus, title: 'Invite your team', desc: 'Share via email or link. Set roles — editor or viewer — for each collaborator.' },
  { icon: Users, title: 'Edit together', desc: 'See live cursors, comments, and changes as they happen. No more version conflicts.' },
  { icon: Download, title: 'Export anywhere', desc: 'Download as PDF, Word, Markdown, HTML, or plain text. Share the final copy instantly.' },
];

export function HowItWorks() {
  return (
    <section style={{ padding: '70px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, color: '#1c1917' }}>How it works</h2>
        <p style={{ color: '#78716c', fontSize: 15, maxWidth: 450, margin: '0 auto' }}>From blank page to finished document in four simple steps.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 24 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontWeight: 700, fontSize: 15 }}>
              {i + 1}
            </div>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <s.icon size={22} color="#f97316" />
            </div>
            <h3 style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: '#1c1917' }}>{s.title}</h3>
            <p style={{ fontSize: 13, color: '#78716c', lineHeight: 1.5 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
