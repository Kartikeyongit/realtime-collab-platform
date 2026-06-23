'use client';

import { Toast } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

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
        boxShadow: '0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'stretch',
        overflow: 'hidden',
        maxWidth: '380px',
        pointerEvents: 'auto',
      }}
    >
      <div style={{
        width: '4px',
        flexShrink: 0,
        background: color,
      }} />
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '8px',
        padding: '12px 14px',
        flex: 1,
      }}>
        <Icon size={14} color={color} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {title && (
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '2px', lineHeight: 1.3 }}>
              {title}
            </div>
          )}
          <div style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.4 }}>
            {description}
          </div>
        </div>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            border: 'none', background: 'none', padding: '2px', cursor: 'pointer',
            color: '#d6d3d1', flexShrink: 0, marginTop: '3px', borderRadius: '4px',
            lineHeight: 0,
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
