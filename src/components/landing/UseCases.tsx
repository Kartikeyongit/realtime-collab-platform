import { Users, GraduationCap, PenLine, Code2, Palette, Briefcase } from 'lucide-react';
import { AnimatedSection } from './AnimatedSection';

const cases = [
  {
    icon: Users, title: 'For Teams', color: '#8b5cf6', bg: '#f5f3ff', bullets: ['Real-time co-authoring', 'Threaded comments & replies', 'Role-based sharing (editor/viewer)', 'Works across departments'],
  },
  {
    icon: GraduationCap, title: 'For Students', color: '#3b82f6', bg: '#eff6ff', bullets: ['Rich formatting for essays', 'Export to PDF & Word for submissions', 'Collaborate on group projects', 'Access from any device'],
  },
  {
    icon: PenLine, title: 'For Writers', color: '#22c55e', bg: '#f0fdf4', bullets: ['Distraction-free editor', 'Word count & readability stats', 'Markdown export for publishing', 'Version history & backups'],
  },
  {
    icon: Code2, title: 'For Developers', color: '#ef4444', bg: '#fef2f2', bullets: ['Code blocks with syntax highlighting', 'Markdown export for docs', 'Collaborate on technical specs', 'API-friendly document format'],
  },
  {
    icon: Palette, title: 'For Designers', color: '#ec4899', bg: '#fdf2f8', bullets: ['Visual document templates', 'Drag-and-drop image support', 'Custom typography & branding', 'High-quality PDF export'],
  },
  {
    icon: Briefcase, title: 'For Freelancers', color: '#14b8a6', bg: '#f0fdfa', bullets: ['Professional client proposals', 'Ready-to-use contract templates', 'Collaborate on project specs', 'Export deliverables in any format'],
  },
];

export function UseCases() {
  return (
    <section style={{ padding: '70px 24px', maxWidth: 900, margin: '0 auto' }}>
      <AnimatedSection>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, color: '#1c1917' }}>Built for everyone</h2>
          <p style={{ color: '#78716c', fontSize: 15 }}>From solo writers to entire organizations — CollabDocs adapts to how you work.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 16 }}>
          {cases.map((c, i) => (
            <div key={i} className="card" style={{ padding: '24px', border: '1.5px solid #e7e5e4' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <c.icon size={20} color={c.color} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: 15, marginBottom: 10, color: '#1c1917' }}>{c.title}</h3>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5 }}>
                {c.bullets.map((b, j) => (
                  <li key={j} style={{ fontSize: 13, color: '#57534e', lineHeight: 1.4, paddingLeft: 16, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 0, color: c.color }}>•</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
