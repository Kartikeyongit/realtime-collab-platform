'use client';

import { useDocumentStore } from '@/store/documentStore';

const COLORS = [
  '#f97316', '#3b82f6', '#22c55e', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f59e0b', '#6366f1',
];

function getColor(seed: string): string {
  const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return COLORS[index % COLORS.length];
}

export function PresenceIndicators() {
  const presences = useDocumentStore((state) => state.presences);
  const activeUsers = Array.from(presences.values());

  if (activeUsers.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {activeUsers.map((presence) => (
        <div
          key={presence.userId}
          className="relative group"
          title={presence.user?.name || 'Anonymous'}
        >
          <div
            className="flex items-center justify-center rounded-full text-white font-medium"
            style={{
              width: '18px',
              height: '18px',
              fontSize: '9px',
              backgroundColor: getColor(presence.userId),
              lineHeight: 1,
            }}
          >
            {presence.user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>
      ))}
    </div>
  );
}
