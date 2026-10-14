import { describe, it, expect } from 'vitest';
import { normalizePath, isApiPath, isPublicPath } from './authPaths';

describe('normalizePath', () => {
  it('strips trailing slashes except root', () => {
    expect(normalizePath('/dashboard/')).toBe('/dashboard');
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('/documents/abc')).toBe('/documents/abc');
  });
});

describe('isApiPath', () => {
  it('matches API routes only', () => {
    expect(isApiPath('/api/documents')).toBe(true);
    expect(isApiPath('/api')).toBe(true);
    expect(isApiPath('/dashboard')).toBe(false);
    expect(isApiPath('/apifake')).toBe(false);
  });
});

describe('isPublicPath', () => {
  it('allows landing, signin and register (slash-tolerant)', () => {
    expect(isPublicPath('/')).toBe(true);
    expect(isPublicPath('/auth/signin')).toBe(true);
    expect(isPublicPath('/auth/signin/')).toBe(true);
    expect(isPublicPath('/auth/register')).toBe(true);
  });

  it('allows public footer pages (support + legal)', () => {
    for (const p of ['/docs', '/contact', '/status', '/privacy', '/terms', '/features']) {
      expect(isPublicPath(p)).toBe(true);
    }
  });

  it('allows token-gated share links', () => {
    expect(isPublicPath('/s/abc123')).toBe(true);
    expect(isPublicPath('/shared/abc123')).toBe(true);
  });

  it('protects everything else', () => {
    for (const p of [
      '/dashboard', '/documents/abc', '/templates', '/settings', '/trash',
      '/tasks', '/graph', '/auth/register/extra',
    ]) {
      expect(isPublicPath(p)).toBe(false);
    }
  });
});
