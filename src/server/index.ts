import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { setupSocketServer } from './socketServer';

// Load env files (standalone ts-node script — not loaded by Next.js)
const envLocal = join(__dirname, '..', '..', '.env.local');
const env = join(__dirname, '..', '..', '.env');
const envFile = existsSync(envLocal) ? envLocal : existsSync(env) ? env : null;
if (envFile) {
  const content = readFileSync(envFile, 'utf8');
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

const port = parseInt(process.env.SOCKET_PORT || '3001', 10);

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO Collaboration Server Running\n');
});

setupSocketServer(httpServer);

httpServer.listen(port, () => {
  console.log(`Socket.IO server running on port ${port}`);
});
