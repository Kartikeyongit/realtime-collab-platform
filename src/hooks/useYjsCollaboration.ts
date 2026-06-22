'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { WebsocketProvider } from 'y-websocket';
import { useSession } from 'next-auth/react';
import axios from 'axios';

const SYNC_TIMEOUT = 10000;

export function useYjsCollaboration(documentId: string) {
  const { data: session } = useSession();
  const [connected, setConnected] = useState(false);
  const [synced, setSynced] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState<'loading' | 'available' | 'unavailable'>('loading');
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchToken = async () => {
      try {
        const { data } = await axios.get(`/api/auth/ws-token?documentId=${documentId}`);
        if (!cancelled) {
          setToken(data.token);
          setTokenReady('available');
        }
      } catch {
        if (!cancelled) {
          setTokenReady('unavailable');
        }
      }
    };

    fetchToken();

    return () => { cancelled = true; };
  }, [documentId]);

  const yDoc = useMemo(() => new Y.Doc(), [documentId]);

  const userInfo = useMemo(() => ({
    name: session?.user?.name || 'Anonymous',
    color: '#' + (session?.user?.id
      ? parseInt(session.user.id.slice(0, 6), 16).toString(16).padStart(6, '0').slice(0, 6)
      : 'f97316'),
    id: session?.user?.id || 'anonymous',
  }), [session]);

  const awareness = useMemo(() => new awarenessProtocol.Awareness(yDoc), [yDoc]);

  // Keep awareness user state in sync
  useEffect(() => {
    awareness.setLocalStateField('user', userInfo);
  }, [awareness, userInfo]);

  const provider = useMemo(() => {
    if (!token) return null;

    const wsProvider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_YJS_URL || 'ws://localhost:1234',
      documentId,
      yDoc,
      {
        connect: true,
        params: { token },
        awareness,
      }
    );
    return wsProvider;
  }, [documentId, yDoc, token, awareness]);

  // Force synced after timeout so content loads from REST API even if Yjs unavailable
  useEffect(() => {
    if (tokenReady === 'loading') return;

    if (tokenReady === 'unavailable') {
      // No token means no Yjs at all — mark synced so REST API content loads
      setSynced(true);
      return;
    }

    syncTimeoutRef.current = setTimeout(() => {
      setSynced(true);
    }, SYNC_TIMEOUT);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [tokenReady]);

  useEffect(() => {
    if (!provider) return;

    const onStatus = (event: { status: string }) => {
      setConnected(event.status === 'connected');
    };
    const onSync = (isSynced: boolean) => {
      if (isSynced) {
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        setSynced(true);
      }
    };

    provider.on('status', onStatus);
    provider.on('sync', onSync);

    return () => {
      provider.off('status', onStatus);
      provider.off('sync', onSync);
      provider.destroy();
    };
  }, [provider]);

  const isEmpty = yDoc.getXmlFragment('default').length === 0;

  return { yDoc, provider, awareness, connected, synced, isEmpty, userInfo };
}
