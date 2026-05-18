const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection, docs } = require('y-websocket/bin/utils');
const Y = require('yjs');

const port = process.env.YJS_PORT || 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Yjs WebSocket Server Running\n');
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  // Parse room name from URL
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const roomName = url.searchParams.get('room') || 'default';
  
  // Handle custom messages before setting up Yjs connection
  const messageHandler = (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'reset-document' && msg.documentId === roomName) {
        // Reset the Yjs document for this room
        const doc = docs.get(roomName);
        if (doc) {
          // Clear and reload content
          doc.transact(() => {
            const fragment = doc.getXmlFragment('prosemirror');
            fragment.delete(0, fragment.length);
            // We'll let the client send the content, but the server just clears the fragment.
            // The client will then load fresh content from the DB.
          });
        }
        // After reset, we can close the connection if needed, but it's already handled
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
