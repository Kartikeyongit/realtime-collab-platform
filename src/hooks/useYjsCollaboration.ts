'use client';

import { useEffect, useMemo, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useSession } from 'next-auth/react';

export function useYjsCollaboration(documentId: string) {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  
  const yDoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => yDoc.getText('content'), [yDoc]);
  const awareness = useMemo(() => {
    const aw = new Y.Doc().clientID;
    return aw;
  }, []);

  useEffect(() => {
    const wsProvider = new WebsocketProvider(
      'ws://localhost:1234',
      documentId,
      yDoc,
      {
        connect: true,
      }
    );

    wsProvider.on('status', (event: { status: string }) => {
      setConnected(event.status === 'connected');
    });

    // Set user awareness
    if (session?.user) {
      wsProvider.awareness.setLocalState({
        user: {
          name: session.user.name,
          color: '#' + Math.floor(Math.random() * 16777215).toString(16),
          id: session.user.id,
        },
      });
    }

    return () => {
      wsProvider.destroy();
    };
  }, [documentId, session, yDoc]);

  return {
    yDoc,
    yText,
    connected,
  };
}
