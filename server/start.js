const { spawn, execSync } = require('child_process');
const path = require('path');
const { createProxy } = require('./proxy');

const ROOT = path.join(__dirname, '..');

const PROXY_PORT = process.env.PORT || '3000';
const NEXT_PORT = '3000';
const SOCKET_PORT = process.env.SOCKET_PORT || '3001';
const YJS_PORT = process.env.YJS_PORT || '1234';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

function startProcess(name, command, args, opts = {}) {
  const proc = spawn(command, args, {
    cwd: ROOT,
    stdio: 'inherit',
    env: { ...process.env, ...opts.env },
  });
  proc.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err.message);
  });
  proc.on('exit', (code) => {
    console.error(`[${name}] Exited with code ${code}`);
    process.exit(code || 1);
  });
  return proc;
}

(async () => {
  // ── Init database schema (idempotent) ─────────────────────────────
  try {
    run('npx prisma db push --skip-generate --accept-data-loss');
  } catch (e) {
    console.error('Schema push failed:', e.message);
    process.exit(1);
  }

  // ── Seed demo data if test user doesn't exist ─────────────────────
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const existing = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    await prisma.$disconnect();

    if (!existing) {
      console.log('No demo user found — seeding database...');
      run('npx prisma db seed');
    } else {
      console.log('Demo user exists — skipping seed.');
    }
  } catch (e) {
    console.error('Seed check failed:', e.message);
  }

  // ── Start backend services (internal ports) ────────────────────────
  console.log(`Starting internal services...
  Next.js      → :${NEXT_PORT}
  Socket.IO    → :${SOCKET_PORT}
  Yjs          → :${YJS_PORT}
  Proxy (main) → :${PROXY_PORT}
`);

  startProcess('next', 'node', [path.join(ROOT, 'server.js')], {
    env: { PORT: NEXT_PORT, HOSTNAME: '127.0.0.1' },
  });

  startProcess('socket', 'node', [path.join(ROOT, 'dist-server', 'index.js')], {
    env: { SOCKET_PORT, CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || `http://localhost:${PROXY_PORT}` },
  });

  startProcess('yjs', 'node', [path.join(ROOT, 'server', 'yjs-server.js')], {
    env: { YJS_PORT },
  });

  // ── Start proxy on the public port ─────────────────────────────────
  const proxy = createProxy();
  proxy.listen(PROXY_PORT, () => {
    console.log(`Proxy listening on port ${PROXY_PORT}`);
  });
})();
