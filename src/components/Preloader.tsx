import React, { useEffect, useState } from 'react';
import { SITE_CONFIG } from '../config';

interface PreloaderProps {
  progress: number;
  ready: boolean;
  reducedMotion: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({
  progress,
  ready,
  reducedMotion,
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (reducedMotion && ready) {
      setDisplayProgress(100);
      setDismissed(true);
      return;
    }

    let rafId = 0;
    const target = ready ? 100 : Math.min(99, Math.max(progress, 0));

    const tick = () => {
      setDisplayProgress((prev) => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.8) {
          return target;
        }
        return prev + diff * 0.22;
      });
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [progress, ready, reducedMotion]);

  useEffect(() => {
    if (ready && displayProgress >= 99.5 && !exiting) {
      const t = window.setTimeout(() => setExiting(true), 120);
      return () => window.clearTimeout(t);
    }
  }, [ready, displayProgress, exiting]);

  useEffect(() => {
    if (!exiting) return;
    const t = window.setTimeout(() => setDismissed(true), 1100);
    return () => window.clearTimeout(t);
  }, [exiting]);

  if (dismissed) return null;

  const formatted = String(Math.min(100, Math.round(displayProgress))).padStart(3, '0');

  return (
    <div
      aria-hidden={exiting}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8 select-none"
      style={{
        backgroundColor: '#F2EEE8',
        color: '#241E1A',
        clipPath: exiting ? 'inset(0 0 100% 0)' : 'inset(0 0 0% 0)',
        transition: reducedMotion
          ? 'none'
          : 'clip-path 1.0s cubic-bezier(0.22, 1, 0.36, 1)',
        pointerEvents: exiting ? 'none' : 'auto',
      }}
    >
      <div className="w-full max-w-[360px] flex flex-col items-center">
        <div className="font-editorial text-[clamp(2rem,4vw,3.4rem)] leading-none tracking-[-0.02em]">
          {SITE_CONFIG.brandName}
        </div>
        <div
          className="mt-7 w-full h-[1px] relative overflow-hidden"
          style={{ backgroundColor: 'rgba(36, 30, 26, 0.15)' }}
        >
          <div
            className="absolute inset-y-0 left-0 origin-left"
            style={{
              width: '100%',
              backgroundColor: '#241E1A',
              transform: `scaleX(${Math.min(1, displayProgress / 100)})`,
              willChange: 'transform',
            }}
          />
        </div>
      </div>

      <div
        className="fixed right-8 bottom-8 font-label tabular-nums"
        style={{ color: '#241E1A', fontSize: '12px' }}
      >
        {formatted}
      </div>
    </div>
  );
};
