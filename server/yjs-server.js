const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { setupWSConnection, docs, setPersistence } = require('y-websocket/bin/utils');
const { LeveldbPersistence } = require('y-leveldb');
const Y = require('yjs');
const crypto = require('crypto');
const debounce = require('lodash.debounce');
const { PrismaClient } = require('@prisma/client');

// Load env files (standalone script — not loaded by Next.js)
const envLocal = path.join(__dirname, '..', '.env.local');
const env = path.join(__dirname, '..', '.env');
const envFile = fs.existsSync(envLocal) ? envLocal : env;
if (fs.existsSync(envFile)) {
  const content = fs.readFileSync(envFile, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

const prisma = new PrismaClient();
const port = process.env.YJS_PORT || 1234;
const secret = process.env.NEXTAUTH_SECRET || '';

// ── Dual-layer persistence ────────────────────────────────────────────
const ldb = new LeveldbPersistence('./yjs-data');

setPersistence({
  provider: ldb,
  bindState: async (docName, ydoc) => {
    // 1. Restore from y-leveldb (fast local cache)
    const persistedYdoc = await ldb.getYDoc(docName);
    const newUpdates = Y.encodeStateAsUpdate(ydoc);
    await ldb.storeUpdate(docName, newUpdates);
    Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));

    // 2. Also restore from PostgreSQL if y-leveldb was empty (fresh start)
    if (persistedYdoc.store.clients.size === 0 || Y.encodeStateAsUpdate(persistedYdoc).length <= 2) {
      try {
        const dbDoc = await prisma.document.findUnique({
          where: { id: docName },
          select: { yjsState: true },
        });
        if (dbDoc?.yjsState) {
          Y.applyUpdate(ydoc, dbDoc.yjsState);
        }
      } catch (e) {
        console.error(`Failed to load yjsState from DB for ${docName}:`, e.message);
      }
    }

    // 3. Persist every Yjs update to y-leveldb (instant, local)
    ydoc.on('update', update => {
      ldb.storeUpdate(docName, update).catch(e => {
        console.error(`y-leveldb storeUpdate failed for ${docName}:`, e.message);
      });
    });

    // 4. Periodically persist full Yjs state to PostgreSQL (durable)
    const persistToPostgres = debounce(async () => {
      try {
        const state = Buffer.from(Y.encodeStateAsUpdate(ydoc));
        await prisma.document.update({
          where: { id: docName },
          data: { yjsState: state },
        });
      } catch (e) {
        console.error(`PostgreSQL persist failed for ${docName}:`, e.message);
      }
    }, 5000);

    ydoc.on('update', persistToPostgres);
  },
  writeState: async (_docName, _ydoc) => {},
});
// ──────────────────────────────────────────────────────────────────────

function verifyWsToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [b64payload, signature] = parts;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(b64payload)
      .digest('base64url');

    if (signature !== expected) return null;

    const payload = JSON.parse(Buffer.from(b64payload, 'base64url').toString());
    if (payload.exp < Date.now()) return null;

    return payload.userId || null;
  } catch {
    return null;
  }
}

async function checkDocumentAccess(documentId, userId) {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });
    return !!document;
  } catch {
    return false;
  }
}

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server Running\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const roomName = url.searchParams.get('room') || url.pathname.split('/').filter(s => s).pop() || 'default';

  // Verify authentication token
  const userId = verifyWsToken(token);
  if (!userId) {
    ws.close(4001, 'Authentication failed');
    return;
  }

  // Verify document access
  const hasAccess = await checkDocumentAccess(roomName, userId);
  if (!hasAccess) {
    ws.close(4003, 'Access denied');
    return;
  }

  // Handle custom messages before setting up Yjs connection
  const messageHandler = (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'reset-document' && msg.documentId === roomName) {
        const doc = docs.get(roomName);
        if (doc) {
          doc.transact(() => {
            const fragment = doc.getXmlFragment('default');
            fragment.delete(0, fragment.length);
          });
        }
      }
    } catch (e) {
      // Not JSON, ignore
    }
  };

  ws.on('message', messageHandler);

  // Now set up the Yjs connection
  setupWSConnection(ws, req, { gc: true });
});

server.listen(port, () => {
  console.log(`Yjs WebSocket server running on port ${port}`);
});
