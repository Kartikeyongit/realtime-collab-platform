'use client';

import React from 'react';

interface EmptyAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export function EmptyState({
  icon,
  title,
  body,
  actions = [],
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  actions?: EmptyAction[];
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '48px 24px',
        background: 'white',
        border: '1.5px dashed #e7e5e4',
        borderRadius: 16,
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: '#fff7ed',
          border: '1.5px solid #fed7aa',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ea580c',
          marginBottom: 14,
        }}
      >
        {icon}
      </span>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#292524', marginBottom: 4 }}>{title}</div>
      {body && <div style={{ fontSize: 13, color: '#a8a29e', maxWidth: 340, lineHeight: 1.6, marginBottom: actions.length ? 16 : 0 }}>{body}</div>}
      {actions.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={a.onClick}
              className={`btn btn-sm ${a.primary ? '' : 'btn-secondary'}`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
