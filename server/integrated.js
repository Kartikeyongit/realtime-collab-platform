const { createServer } = require('http');
const { parse } = require('url');
const crypto = require('crypto');
const next = require('next');
const { Server: SocketIOServer } = require('socket.io');
const { WebSocketServer } = require('ws');
const { PrismaClient } = require('@prisma/client');

// ── Load env files (for standalone execution) ──────────────────────
const fs = require('fs');
const path = require('path');
const envLocal = path.join(__dirname, '..', '.env.local');
const env = path.join(__dirname, '..', '.env');
const envFile = fs.existsSync(envLocal) ? envLocal : fs.existsSync(env) ? env : null;
if (envFile) {
  const content = fs.readFileSync(envFile, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = value;
  }
}

const PORT = process.env.PORT || '3000';
const CORS_ORIGIN = process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';

// ── Database init (idempotent) ──────────────────────────────────────
try {
  const { execSync } = require('child_process');
  execSync('npx prisma db push --skip-generate --accept-data-loss', { stdio: 'inherit' });
} catch (e) {
  console.error('Schema push failed:', e.message);
  process.exit(1);
}

const prisma = new PrismaClient();

// ── Seed demo data if test user doesn't exist ───────────────────────
(async () => {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    if (!existing) {
      console.log('No demo user found — seeding database...');
      const { execSync } = require('child_process');
      execSync('npx prisma db seed', { stdio: 'inherit' });
    } else {
      console.log('Demo user exists — skipping seed.');
    }
  } catch (e) {
    console.error('Seed check failed:', e.message);
  }
})();

// ── Next.js app ─────────────────────────────────────────────────────
const app = next({ dev: false, hostname: '0.0.0.0', port: parseInt(PORT) });
const handle = app.getRequestHandler();

// ── Helpers ─────────────────────────────────────────────────────────
function verifyWsToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64payload, signature] = parts;
    const expected = crypto
      .createHmac('sha256', process.env.NEXTAUTH_SECRET || '')
      .update(b64payload)
      .digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(b64payload, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload.userId || null;
  } catch { return null; }
}

app.prepare().then(async () => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  // ── Socket.IO ─────────────────────────────────────────────────────
  const origins = CORS_ORIGIN.split(',').map(s => s.trim()).filter(Boolean);
  const io = new SocketIOServer(server, {
    cors: {
      origin: origins.length === 1 ? origins[0] : origins,
      methods: ['GET', 'POST'],
    },
  });

  const documentRooms = new Map();
  const documentPresences = new Map();

  io.on('connection', async (socket) => {
    const { documentId } = socket.handshake.query;
    const token = socket.handshake.auth?.token;
    if (!documentId || !token) { socket.disconnect(); return; }
    const userId = verifyWsToken(token);
    if (!userId) { socket.disconnect(); return; }
    try {
      const doc = await prisma.document.findUnique({ where: { id: documentId }, select: { id: true } });
      if (!doc) { socket.disconnect(); return; }
    } catch { socket.disconnect(); return; }

    const docId = documentId;
    socket.join(docId);
    if (!documentRooms.has(docId)) documentRooms.set(docId, new Set());
    documentRooms.get(docId).add(socket.id);

    let user = null;
    try {
      user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, image: true } });
    } catch {}
    const presenceData = { userId, documentId: docId, user: user || { id: userId, name: 'Unknown', image: null }, lastSeen: new Date().toISOString() };
    if (!documentPresences.has(docId)) documentPresences.set(docId, new Map());
    documentPresences.get(docId).set(userId, presenceData);
    socket.emit('presence:list', Array.from(documentPresences.get(docId).values()));
    socket.to(docId).emit('presence:update', presenceData);

    socket.on('cursor:update', (data) => {
      socket.to(docId).emit('cursor:update', { ...data, userId, socketId: socket.id });
    });
    socket.on('comment:add', async (data) => {
      try {
        const doc = await prisma.document.findUnique({ where: { id: docId }, select: { ownerId: true, collaborators: { where: { userId }, select: { id: true } } } });
        if (!doc || (doc.ownerId !== userId && doc.collaborators.length === 0)) return;
        const comment = await prisma.comment.create({ data: { content: data.content, documentId: docId, userId, position: data.position, parentId: data.parentId }, include: { user: { select: { id: true, name: true, image: true } } } });
        io.to(docId).emit('comment:new', comment);
        const docWithAccess = await prisma.document.findUnique({ where: { id: docId }, select: { ownerId: true, collaborators: { select: { userId: true } } } });
        if (docWithAccess) {
          const notifyUserIds = new Set();
          if (docWithAccess.ownerId !== userId) notifyUserIds.add(docWithAccess.ownerId);
          for (const c of docWithAccess.collaborators) if (c.userId !== userId) notifyUserIds.add(c.userId);
          if (notifyUserIds.size > 0) await prisma.notification.createMany({ data: Array.from(notifyUserIds).map(uid => ({ userId: uid, commentId: comment.id })) });
        }
      } catch (e) { console.error('Error creating comment:', e); }
    });
    socket.on('disconnect', () => {
      documentRooms.get(docId)?.delete(socket.id);
      documentPresences.get(docId)?.delete(userId);
      io.to(docId).emit('presence:leave', userId);
      if (documentRooms.get(docId)?.size === 0) documentRooms.delete(docId);
    });
  });

  // ── Yjs WebSocket ─────────────────────────────────────────────────
  const { setupWSConnection, docs } = require('y-websocket/bin/utils');
  const Y = require('yjs');
  const { LeveldbPersistence } = require('y-leveldb');
  const debounce = require('lodash.debounce');

  const ldb = new LeveldbPersistence('./yjs-data');
  const { setPersistence } = require('y-websocket/bin/utils');
  setPersistence({
    provider: ldb,
    bindState: async (docName, ydoc) => {
      const persistedYdoc = await ldb.getYDoc(docName);
      const newUpdates = Y.encodeStateAsUpdate(ydoc);
      await ldb.storeUpdate(docName, newUpdates);
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(persistedYdoc));
      if (persistedYdoc.store.clients.size === 0 || Y.encodeStateAsUpdate(persistedYdoc).length <= 2) {
        try {
          const dbDoc = await prisma.document.findUnique({ where: { id: docName }, select: { yjsState: true } });
          if (dbDoc?.yjsState) Y.applyUpdate(ydoc, dbDoc.yjsState);
        } catch (e) { console.error(`Failed to load yjsState from DB for ${docName}:`, e.message); }
      }
      ydoc.on('update', update => { ldb.storeUpdate(docName, update).catch(e => console.error(`y-leveldb storeUpdate failed for ${docName}:`, e.message)); });
      const persistToPostgres = debounce(async () => {
        try { const state = Buffer.from(Y.encodeStateAsUpdate(ydoc)); await prisma.document.update({ where: { id: docName }, data: { yjsState: state } }); } catch (e) { console.error(`PostgreSQL persist failed for ${docName}:`, e.message); }
      }, 5000);
      ydoc.on('update', persistToPostgres);
    },
    writeState: async () => {},
  });

  const yjsWss = new WebSocketServer({ noServer: true });
  yjsWss.on('connection', (ws, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomName = url.searchParams.get('room') || url.pathname.split('/').filter(s => s).pop() || 'default';
    const userId = verifyWsToken(token);
    if (!userId) { ws.close(4001, 'Authentication failed'); return; }
    try {
      prisma.document.findUnique({ where: { id: roomName }, select: { id: true } }).then(doc => {
        if (!doc) { ws.close(4003, 'Access denied'); return; }
        setupWSConnection(ws, req, { gc: true });
      });
    } catch { ws.close(4003, 'Access denied'); }
  });

  server.on('upgrade', (req, socket, head) => {
    const pathname = parse(req.url).pathname;
    if (pathname.startsWith('/socket.io/')) return; // let Socket.IO handle it
    yjsWss.handleUpgrade(req, socket, head, (ws) => {
      yjsWss.emit('connection', ws, req);
    });
  });

  // ── Start ─────────────────────────────────────────────────────────
  server.listen(PORT, () => {
    console.log(`Integrated server running on port ${PORT}`);
    console.log(`  Next.js + Socket.IO + Yjs on :${PORT}`);
  });
});
