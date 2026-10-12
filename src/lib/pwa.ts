'use client';

import { useEffect, useState, useCallback } from 'react';

/** Register /sw.js in production only (keeps dev HMR clean). */
export function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').then(
      () => console.info('[pwa] service worker registered'),
      (err) => console.warn('[pwa] service worker registration failed:', err)
    );
  }, []);
}

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

let deferredPrompt: PromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e as PromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
  });
}

/** Install prompt state ($0, browser-native). */
export function useInstallPrompt() {
  const [, bump] = useState(0);
  useEffect(() => {
    const fn = () => bump((n) => n + 1);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  const isIos = typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    listeners.forEach((fn) => fn());
    return outcome === 'accepted' ? 'accepted' : 'dismissed';
  }, []);

  return { canInstall: !!deferredPrompt, isIos, isStandalone, install };
}

export interface InstallDiagnostics {
  secureContext: boolean;
  swSupported: boolean;
  swRegistered: boolean;
  swActive: boolean;
  manifestOk: boolean;
  alreadyInstalled: boolean;
}

/** Self-check used to explain exactly why install isn't offered yet. */
export async function getInstallDiagnostics(): Promise<InstallDiagnostics> {
  const secureContext = typeof window !== 'undefined' && window.isSecureContext;
  const swSupported = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
  let swRegistered = false;
  let swActive = false;
  if (swSupported) {
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      swRegistered = !!reg;
      swActive = !!reg?.active;
    } catch {}
  }
  let manifestOk = false;
  try {
    const res = await fetch('/manifest.json');
    const m = await res.json();
    manifestOk = !!(m.name || m.short_name) && !!m.start_url && Array.isArray(m.icons) && m.icons.length > 0;
  } catch {}
  const alreadyInstalled =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true);
  return { secureContext, swSupported, swRegistered, swActive, manifestOk, alreadyInstalled };
}
