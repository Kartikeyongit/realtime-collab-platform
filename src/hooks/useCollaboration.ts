'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDocumentStore } from '@/store/documentStore';
import { useSession } from 'next-auth/react';
import { Presence } from '@/types';
import axios from 'axios';

export function useCollaboration(documentId: string) {
  const socketRef = useRef<Socket | null>(null);
  const { updatePresence, removePresence, setConnected, addComment, updateCursor } = useDocumentStore();
  const { data: session } = useSession();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      try {
        const { data } = await axios.get(`/api/auth/ws-token?documentId=${documentId}`);
        if (!cancelled) setToken(data.token);
      } catch {
        // User is not authenticated; no socket connection
      }
    };

    fetchToken();

    return () => { cancelled = true; };
  }, [documentId]);

  useEffect(() => {
    if (!token || !documentId) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      auth: { token },
      query: { documentId },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('presence:list', (presences: Presence[]) => {
      presences.forEach(p => updatePresence(p));
    });

    socket.on('presence:update', (presence: Presence) => {
      updatePresence(presence);
    });

    socket.on('presence:leave', (userId: string) => {
      removePresence(userId);
    });

    socket.on('comment:new', (comment: any) => {
      addComment(comment);
    });

    socket.on('cursor:update', (data: any) => {
      updateCursor(data.userId, data);
    });

    return () => {
      socket.disconnect();
    };
  }, [documentId, token]);

  return {
    socket: socketRef.current,
    emitComment: (comment: any) => {
      socketRef.current?.emit('comment:add', comment);
    },
  };
}
