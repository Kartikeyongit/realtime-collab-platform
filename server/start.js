const { spawn, execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const PORT = process.env.PORT || '3000';
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
  proc.on('error', (err) => console.error(`[${name}] Failed to start:`, err.message));
  proc.on('exit', (code) => {
    console.error(`[${name}] Exited with code ${code}`);
    process.exit(code || 1);
  });
  return proc;
}

(async () => {
  try {
    run('npx prisma db push --skip-generate --accept-data-loss');
  } catch (e) {
    console.error('Schema push failed:', e.message);
    process.exit(1);
  }

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

  console.log(`Starting services...
  Next.js   → :${PORT}
  Socket.IO → :${SOCKET_PORT}
  Yjs       → :${YJS_PORT}
`);

  startProcess('next', 'node', [path.join(ROOT, 'server.js')], {
    env: { PORT, HOSTNAME: '0.0.0.0' },
  });

  startProcess('socket', 'node', [path.join(ROOT, 'dist-server', 'index.js')], {
    env: { SOCKET_PORT, CORS_ORIGIN: process.env.CORS_ORIGIN || process.env.NEXTAUTH_URL || `http://localhost:${PORT}` },
  });

  startProcess('yjs', 'node', [path.join(ROOT, 'server', 'yjs-server.js')], {
    env: { YJS_PORT },
  });
})();
