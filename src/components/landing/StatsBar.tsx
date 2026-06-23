import { AnimatedSection } from './AnimatedSection';

const stats = [
  { value: '10K+', label: 'Documents created' },
  { value: '500+', label: 'Active users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '4.9', label: 'User rating' },
];

export function StatsBar() {
  return (
    <section style={{ padding: '40px 24px' }}>
      <AnimatedSection>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 120 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: '#f97316', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#78716c' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </AnimatedSection>
    </section>
  );
}
