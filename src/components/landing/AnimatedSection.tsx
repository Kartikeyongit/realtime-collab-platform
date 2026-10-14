'use client';

import type { ReactNode } from 'react';

export function AnimatedSection({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return <div style={style}>{children}</div>;
}
