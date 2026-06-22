import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function verifyWsToken(token: string): string | null {
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
  } catch {
    return null;
  }
}

export function setupSocketServer(httpServer: HTTPServer) {
  const corsOrigin = process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const origins = corsOrigin.split(',').map(s => s.trim()).filter(Boolean);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: origins.length === 1 ? origins[0] : origins,
      methods: ['GET', 'POST'],
    },
  });

  // Track document rooms and users
  const documentRooms = new Map<string, Set<string>>();
  const documentPresences = new Map<string, Map<string, any>>();

  io.on('connection', async (socket) => {
    const { documentId } = socket.handshake.query;
    const token = socket.handshake.auth?.token as string | undefined;

    if (!documentId || !token) {
      socket.disconnect();
      return;
    }

    const userId = verifyWsToken(token);
    if (!userId) {
      socket.disconnect();
      return;
    }

    // Check document access before allowing connection
    try {
      const document = await prisma.document.findUnique({
        where: { id: documentId as string },
        select: { id: true },
      });
      if (!document) {
        socket.disconnect();
        return;
      }
    } catch {
      socket.disconnect();
      return;
    }

    const docId = documentId as string;

    // Join document room
    socket.join(docId);

    // Track users in rooms
    if (!documentRooms.has(docId)) {
      documentRooms.set(docId, new Set());
    }
    documentRooms.get(docId)?.add(socket.id);

    // Broadcast presence with user data
    let user = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, image: true },
      });
    } catch {
      // User query failed — still broadcast presence with fallback data
    }
    const presenceData = {
      userId,
      documentId: docId,
      user: user || { id: userId, name: 'Unknown', image: null },
      lastSeen: new Date().toISOString(),
    };

    // Track this user's presence in the room
    if (!documentPresences.has(docId)) {
      documentPresences.set(docId, new Map());
    }
    documentPresences.get(docId)!.set(userId, presenceData);

    // Send full presence list to the new socket
    const roomPresences = Array.from(documentPresences.get(docId)!.values());
    socket.emit('presence:list', roomPresences);

    // Broadcast join to others
    socket.to(docId).emit('presence:update', presenceData);

    // Handle cursor updates
    socket.on('cursor:update', (data: any) => {
      socket.to(docId).emit('cursor:update', {
        ...data,
        userId,
        socketId: socket.id,
      });
    });

    // Handle comments
    socket.on('comment:add', async (data: any) => {
      try {
        const doc = await prisma.document.findUnique({
          where: { id: docId },
          select: {
            ownerId: true,
            collaborators: {
              where: { userId },
              select: { id: true },
            },
          },
        });
        if (!doc || (doc.ownerId !== userId && doc.collaborators.length === 0)) return;

        const comment = await prisma.comment.create({
          data: {
            content: data.content,
            documentId: docId,
            userId,
            position: data.position,
            parentId: data.parentId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });

        io.to(docId).emit('comment:new', comment);

        // Create notifications for document owner and collaborators
        const docWithAccess = await prisma.document.findUnique({
          where: { id: docId },
          select: {
            ownerId: true,
            collaborators: { select: { userId: true } },
          },
        });

        if (docWithAccess) {
          const notifyUserIds = new Set<string>();
          if (docWithAccess.ownerId !== userId) {
            notifyUserIds.add(docWithAccess.ownerId);
          }
          for (const c of docWithAccess.collaborators) {
            if (c.userId !== userId) {
              notifyUserIds.add(c.userId);
            }
          }

          if (notifyUserIds.size > 0) {
            await prisma.notification.createMany({
              data: Array.from(notifyUserIds).map(uid => ({
                userId: uid,
                commentId: comment.id,
              })),
            });
          }
        }
      } catch (error) {
        console.error('Error creating comment:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      documentRooms.get(docId)?.delete(socket.id);
      documentPresences.get(docId)?.delete(userId);
      io.to(docId).emit('presence:leave', userId);

      // Clean up empty rooms
      if (documentRooms.get(docId)?.size === 0) {
        documentRooms.delete(docId);
      }
    });
  });

  return io;
}
