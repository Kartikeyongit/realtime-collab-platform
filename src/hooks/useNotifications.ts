'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export interface LiveNotification {
  id: string;
  type: string;
  actor: { name: string };
  documentId?: string;
  documentTitle?: string;
  commentId?: string;
  excerpt?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Lightweight user-only socket (no document room) that joins `user:<id>`
 * so notification pushes arrive anywhere — dashboard included.
 * Multi-tab safe: consumers must dedupe by id.
 */
export function useNotifications(onNotification: (n: LiveNotification) => void) {
  const { data: session } = useSession();
  const cbRef = useRef(onNotification);
  cbRef.current = onNotification;

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    let socket: Socket | null = null;

    axios
      .get('/api/auth/ws-token')
      .then(({ data }) => {
        if (cancelled || !data.token) return;
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
          auth: { token: data.token },
        });
        socket.on('notification:new', (n: LiveNotification) => cbRef.current(n));
      })
      .catch(() => {
        // Socket server asleep/down — polling fallback in the center covers it.
      });

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [session?.user?.id]);
}
