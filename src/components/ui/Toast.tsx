'use client';

import { useEffect, useState } from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', onClose, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', icon: Check },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#dc2626', icon: X },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: AlertTriangle },
    info: { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', icon: Info },
  };

  const s = styles[type];
  const Icon = s.icon;

  return (
    <div
      style={{
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.color,
        padding: '12px 16px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '13px',
        fontWeight: 500,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.3s ease',
        maxWidth: '380px',
      }}
    >
      <Icon size={16} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: s.color, opacity: 0.6, padding: '2px', flexShrink: 0 }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// Toast container to manage multiple toasts
export function ToastContainer({ toasts, removeToast }: { toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'warning' | 'info' }>; removeToast: (id: string) => void }) {
  return (
    <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 200, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {toasts.map((toast) => (
        <Toast key={toast.id} message={toast.message} type={toast.type} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}
