import React, { useEffect, useState } from 'react';
import { BrandLogo } from './BrandLogo';

interface PreloaderProps {
  ready: boolean;
  reducedMotion: boolean;
}

/**
 * Fast editorial preloader capped strictly under 1.1s total duration so mobile 4G LCP stays crisp.
 */
export const Preloader: React.FC<PreloaderProps> = ({ ready, reducedMotion }) => {
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pct, setPct] = useState(30);

  useEffect(() => {
    if (reducedMotion) {
      setDismissed(true);
      return;
    }

    // Hard safety cap: keep preloader brisk under 4G
    const safetyTimer = window.setTimeout(() => {
      setPct(100);
      setExiting(true);
    }, 260);

    return () => window.clearTimeout(safetyTimer);
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    if (ready) {
      setPct(100);
      setExiting(true);
    }
  }, [ready, reducedMotion]);

  useEffect(() => {
    if (!exiting) return;
    const t = window.setTimeout(() => setDismissed(true), 360);
    return () => window.clearTimeout(t);
  }, [exiting]);

  if (dismissed) return null;

  return (
    <div
      aria-hidden={exiting}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 select-none"
      style={{
        backgroundColor: '#F2EEE8',
        color: '#241E1A',
        clipPath: exiting ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        transition: 'clip-path 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: exiting ? 'none' : 'auto',
      }}
    >
      <div className="w-full max-w-[300px] flex flex-col items-center">
        <BrandLogo size="md" />
        <div
          className="mt-6 w-full h-[1px] relative overflow-hidden"
          style={{ backgroundColor: 'rgba(36, 30, 26, 0.14)' }}
        >
          <div
            className="absolute inset-y-0 left-0 w-full origin-left"
            style={{
              backgroundColor: '#241E1A',
              transform: `scaleX(${pct / 100})`,
              transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          />
        </div>
      </div>

      <div
        className="fixed right-8 bottom-8 font-label tabular-nums"
        style={{ color: '#8A8178', fontSize: '11px' }}
      >
        {String(pct).padStart(3, '0')}
      </div>
    </div>
  );
};
