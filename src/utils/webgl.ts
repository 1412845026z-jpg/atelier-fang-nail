import { useEffect, useState } from 'react';

let cachedWebGLSupport: boolean | null = null;

export function detectWebGLSupport(): boolean {
  if (cachedWebGLSupport !== null) return cachedWebGLSupport;
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2', { powerPreference: 'default' }) ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    cachedWebGLSupport = Boolean(gl);
    return cachedWebGLSupport;
  } catch {
    cachedWebGLSupport = false;
    return false;
  }
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return reduced;
}

/**
 * Mounts heavy 3D sections only when within `rootMargin` (default: 1 viewport ahead)
 * so initial load stays ultra-fast and GPU memory stays lean.
 */
export function useNearViewport(
  ref: React.RefObject<HTMLElement | null>,
  rootMargin = '100% 0px'
): boolean {
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref, rootMargin, near]);

  return near;
}
