'use client';

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = '8px', style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: 'linear-gradient(90deg, #f5f5f4 25%, #e7e5e4 50%, #f5f5f4 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        ...style,
      }}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '36px 24px' }}>
      <Skeleton width="200px" height="32px" style={{ marginBottom: '8px' }} />
      <Skeleton width="120px" height="16px" style={{ marginBottom: '28px' }} />
      <Skeleton width="340px" height="40px" style={{ marginBottom: '28px' }} />
      
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="card" style={{ padding: '18px 22px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ flex: 1 }}>
            <Skeleton width="200px" height="16px" style={{ marginBottom: '6px' }} />
            <Skeleton width="150px" height="12px" />
          </div>
          <Skeleton width="28px" height="28px" borderRadius="50%" />
        </div>
      ))}
    </div>
  );
}
