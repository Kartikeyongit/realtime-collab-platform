'use client';

import { Users } from 'lucide-react';

interface OnlineUser {
  name: string;
  color: string;
  clientId: number;
}

interface OnlineUsersProps {
  users: OnlineUser[];
  isOpen: boolean;
  onClose: () => void;
}

export function OnlineUsers({ users, isOpen, onClose }: OnlineUsersProps) {
  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 44 }} onClick={onClose} />
      <div style={{ 
        position: 'fixed', right: 0, top: 0, bottom: 0, width: '280px',
        background: 'white', borderLeft: '1.5px solid #e7e5e4', zIndex: 45,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1.5px solid #e7e5e4', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#f97316" />
          <h3 style={{ fontWeight: 600, fontSize: '15px' }}>Online Users</h3>
          <span style={{ fontSize: '12px', color: '#a8a29e', background: '#f5f5f4', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>{users.length}</span>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
          {users.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#a8a29e', fontSize: '13px', padding: '20px 0' }}>No one else is here</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {users.map((user) => (
                <div key={user.clientId} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '10px', background: '#fafaf9' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 600, flexShrink: 0 }}>
                    {user.name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{user.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                      <span style={{ fontSize: '11px', color: '#a8a29e' }}>Online</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
