'use client';

import { Toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';

interface CustomToastProps {
  t: Toast;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  description: string;
}

const config = {
  success: { icon: CheckCircle2, color: '#059669' },
  error: { icon: XCircle, color: '#DC2626' },
  warning: { icon: AlertTriangle, color: '#f97316' },
  info: { icon: Info, color: '#3b82f6' },
};

export function CustomToast({ t, type, title, description }: CustomToastProps) {
  const { icon: Icon, color } = config[type];

  return (
    <div
      className={t.visible ? 'rt-custom-toast enter' : 'rt-custom-toast exit'}
      style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        maxWidth: '360px',
        pointerEvents: 'auto',
      }}
    >
      <Icon size={14} color={color} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917', lineHeight: 1.4 }}>{title}
            <span style={{ fontWeight: 400, color: '#78716c' }}>{' '}{description}</span>
          </span>
        ) : (
          <span style={{ fontSize: '13px', color: '#1c1917', lineHeight: 1.4 }}>{description}</span>
        )}
      </div>
    </div>
  );
}
