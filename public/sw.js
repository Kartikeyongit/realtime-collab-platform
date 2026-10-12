/* CollabDocs service worker ($0, zero deps, hand-rolled).
 * - App shell (/, /dashboard, icons, manifest): cache-first for instant loads.
 * - API + documents: network-first so collab data is never stale; fall back
 *   to a warm offline page when the backends sleep or the device is offline.
 * - y-indexeddb already keeps doc content offline; the SW keeps the shell.
 */

const VERSION = 'collabdocs-v1';
const SHELL = ['/', '/dashboard', '/manifest.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const OFFLINE_HTML = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="theme-color" content="#f97316"/>
<title>CollabDocs — Offline</title>
<style>body{font-family:system-ui,sans-serif;background:#fdfbf7;color:#292524;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;text-align:center}</style>
</head><body><div>
<div style="font-size:44px">📴</div>
<h1 style="font-size:20px">You're offline</h1>
<p style="color:#78716c;font-size:14px">Your documents are safe on this device and will sync when you reconnect.</p>
<p><a href="/dashboard" style="color:#ea580c;font-weight:600">Retry dashboard</a></p>
</div></body></html>`;

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API + realtime: always network (never serve stale collab data).
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/socket.io')) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
    return;
  }

  // Navigations + shell: network-first, cache fallback, offline page last.
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok && (request.mode === 'navigate' || SHELL.includes(url.pathname))) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy)).catch(() => undefined);
        }
        return res;
      })
      .catch(() =>
        caches.match(request).then(
          (cached) =>
            cached ||
            new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } })
        )
      )
  );
});
