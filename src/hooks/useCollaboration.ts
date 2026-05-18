'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useDocumentStore } from '@/store/documentStore';
import { Presence } from '@/types';

export function useCollaboration(documentId: string) {
  const socketRef = useRef<Socket | null>(null);
  const { updatePresence, removePresence, setConnected, addComment } = useDocumentStore();

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      query: { documentId },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      console.log('Connected to collaboration server');
    });

    socket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from collaboration server');
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

    // Send cursor position
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        socket.emit('cursor:update', {
          documentId,
          from: range.startOffset,
          to: range.endOffset,
        });
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      socket.disconnect();
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [documentId]);

  return {
    socket: socketRef.current,
    emitComment: (comment: any) => {
      socketRef.current?.emit('comment:add', comment);
    },
  };
}
