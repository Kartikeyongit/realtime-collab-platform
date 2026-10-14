import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { normalizePath, isApiPath, isPublicPath } from '@/lib/authPaths';

export async function middleware(req: NextRequest) {
  const pathname = normalizePath(req.nextUrl.pathname);

  // API routes enforce auth themselves with 401 JSON — never redirect them
  // to an HTML login page (that would break every API client).
  if (isApiPath(pathname)) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (token) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = '/auth/signin';
  url.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|robots.txt|sitemap.xml|.*\\.png$|.*\\.svg$|.*\\.ico$).*)',
  ],
};
