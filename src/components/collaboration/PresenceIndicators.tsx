'use client';

import { useDocumentStore } from '@/store/documentStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function PresenceIndicators() {
  const presences = useDocumentStore((state) => state.presences);
  const activeUsers = Array.from(presences.values());

  return (
    <div className="flex -space-x-2 overflow-hidden p-2">
      {activeUsers.map((presence) => (
        <div
          key={presence.userId}
          className="relative group"
          title={presence.user?.name || 'Anonymous'}
        >
          <Avatar className="h-8 w-8 border-2 border-white">
            <AvatarImage src={presence.user?.image || ''} />
            <AvatarFallback
              className="text-xs"
              style={{
                backgroundColor: getRandomColor(presence.userId),
              }}
            >
              {presence.user?.name?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white" />
        </div>
      ))}
    </div>
  );
}

function getRandomColor(seed: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
  ];
  const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[index % colors.length];
}
