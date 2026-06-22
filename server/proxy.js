const http = require('http');
const net = require('net');

const NEXT_PORT = 3000;
const SOCKET_PORT = 3001;
const YJS_PORT = 1234;

function backendFor(url) {
  if (url.startsWith('/socket.io/')) return SOCKET_PORT;
  return NEXT_PORT;
}

function wsBackendFor(url) {
  if (url.startsWith('/socket.io/')) return SOCKET_PORT;
  return YJS_PORT;
}

function createProxy() {
  const server = http.createServer((req, res) => {
    const port = backendFor(req.url);

    const options = {
      hostname: '127.0.0.1',
      port,
      path: req.url,
      method: req.method,
      headers: { ...req.headers },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      // Discard chunked transfer-encoding from upstream for Node compat
      const headers = { ...proxyRes.headers };
      res.writeHead(proxyRes.statusCode, headers);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', () => {
      res.writeHead(502);
      res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
  });

  server.on('upgrade', (req, socket, head) => {
    const port = wsBackendFor(req.url);
    const proxySocket = net.connect(port, '127.0.0.1', () => {
      const rawHeaders = [
        `${req.method} ${req.url} HTTP/${req.httpVersion}`,
        ...Object.entries(req.headers).map(([k, v]) => `${k}: ${v}`),
        '',
        '',
      ].join('\r\n');
      proxySocket.write(rawHeaders);
      proxySocket.write(head);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });
    proxySocket.on('error', () => socket.destroy());
    socket.on('error', () => proxySocket.destroy());
  });

  return server;
}

module.exports = { createProxy };
