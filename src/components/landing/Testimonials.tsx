const testimonials = [
  {
    quote: 'CollabDocs transformed how our remote team writes proposals. Real-time editing means no more emailing drafts back and forth.',
    name: 'Sarah Chen', role: 'Product Manager, TechFlow',
  },
  {
    quote: 'I use it for all my university essays. The export to Word is flawless, and sharing with my study group is instant.',
    name: 'Marcus Johnson', role: 'Computer Science Student',
  },
  {
    quote: 'The code blocks and markdown export make it perfect for our engineering documentation. And it\'s completely free.',
    name: 'Priya Patel', role: 'Senior Developer, OpenSource Co.',
  },
];

export function Testimonials() {
  return (
    <section style={{ padding: '70px 24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, color: '#1c1917' }}>Loved by users</h2>
        <p style={{ color: '#78716c', fontSize: 15 }}>Here is what people are saying about CollabDocs.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {testimonials.map((t, i) => (
          <div key={i} className="card" style={{ padding: 24, border: '1.5px solid #e7e5e4', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#57534e', fontStyle: 'italic', margin: '0 0 16px' }}>&ldquo;{t.quote}&rdquo;</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar avatar-sm" style={{ background: '#fff7ed', color: '#c2410c', flexShrink: 0 }}>{t.name.charAt(0)}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#1c1917' }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#a8a29e' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
