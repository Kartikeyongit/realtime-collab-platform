import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  // Track document rooms and users
  const documentRooms = new Map<string, Set<string>>();

  io.on('connection', (socket) => {
    const { documentId, userId } = socket.handshake.query;
    
    if (!documentId || !userId) {
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

    // Broadcast presence
    io.to(docId).emit('presence:update', {
      userId,
      documentId: docId,
      lastSeen: new Date().toISOString(),
    });

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
        const comment = await prisma.comment.create({
          data: {
            content: data.content,
            documentId: docId,
            userId: userId as string,
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
      } catch (error) {
        console.error('Error creating comment:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      documentRooms.get(docId)?.delete(socket.id);
      io.to(docId).emit('presence:leave', userId);
      
      // Clean up empty rooms
      if (documentRooms.get(docId)?.size === 0) {
        documentRooms.delete(docId);
      }
    });
  });

  return io;
}
