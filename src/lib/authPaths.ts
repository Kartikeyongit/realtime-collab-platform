/**
 * Which paths a logged-out visitor may open. Pure logic (no Next imports)
 * so it unit-tests cleanly; src/middleware.ts enforces it.
 */

// Pages anyone may open without an account: landing, auth, marketing,
// plus the public footer pages (docs, contact, status, privacy, terms).
const PUBLIC_PAGES = new Set([
  '/',
  '/auth/signin',
  '/auth/register',
  '/features',
  '/docs',
  '/contact',
  '/status',
  '/privacy',
  '/terms',
]);

// Token/password-gated by design — their own routes enforce access.
const PUBLIC_PREFIXES = ['/s/', '/shared/'];

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) return pathname.slice(0, -1);
  return pathname;
}

/** API routes enforce auth themselves with 401 JSON — never redirect them. */
export function isApiPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  return p === '/api' || p.startsWith('/api/');
}

export function isPublicPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (PUBLIC_PAGES.has(p)) return true;
  return PUBLIC_PREFIXES.some((prefix) => p === prefix.slice(0, -1) || p.startsWith(prefix));
}
