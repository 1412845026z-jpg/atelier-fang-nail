import React, { useEffect, useRef, useState } from 'react';

type CursorMode = 'default' | 'pointer' | 'view' | 'drag' | 'light';

export const CustomCursor: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState<CursorMode>('default');
  const [overDark, setOverDark] = useState(false);
  const [visible, setVisible] = useState(false);

  const cursorRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef({ x: -100, y: -100 });
  const currentRef = useRef({ x: -100, y: -100 });

  useEffect(() => {
    const mqPointer = window.matchMedia('(pointer: fine) and (min-width: 1024px)');
    const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');

    const syncEnabled = () => {
      const active = mqPointer.matches && !mqReduced.matches;
      setEnabled(active);
      document.body.classList.toggle('has-custom-cursor', active);
    };

    syncEnabled();
    mqPointer.addEventListener('change', syncEnabled);
    mqReduced.addEventListener('change', syncEnabled);

    return () => {
      document.body.classList.remove('has-custom-cursor');
      mqPointer.removeEventListener('change', syncEnabled);
      mqReduced.removeEventListener('change', syncEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleMove = (e: MouseEvent) => {
      targetRef.current.x = e.clientX;
      targetRef.current.y = e.clientY;
      setVisible(true);

      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      if (!el) return;

      setOverDark(Boolean(el.closest('[data-theme="dark"]')));

      const cursorEl = el.closest('[data-cursor]') as HTMLElement | null;
      const declared = cursorEl?.getAttribute('data-cursor');
      if (declared === 'view' || declared === 'drag' || declared === 'light') {
        setMode(declared);
      } else if (el.closest('a, button, input, textarea, [role="button"]')) {
        setMode('pointer');
      } else {
        setMode('default');
      }
    };

    const handleLeave = () => setVisible(false);

    window.addEventListener('mousemove', handleMove, { passive: true });
    document.addEventListener('mouseleave', handleLeave);

    let rafId = 0;
    const render = () => {
      const cur = currentRef.current;
      const tgt = targetRef.current;
      cur.x += (tgt.x - cur.x) * 0.2;
      cur.y += (tgt.y - cur.y) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${cur.x}px, ${cur.y}px, 0) translate(-50%, -50%)`;
      }
      rafId = window.requestAnimationFrame(render);
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseleave', handleLeave);
      window.cancelAnimationFrame(rafId);
    };
  }, [enabled]);

  if (!enabled) return null;

  const isExpanded = mode === 'view' || mode === 'drag';
  const isLightMode = mode === 'light';
  const size = isExpanded ? 64 : isLightMode ? 24 : mode === 'pointer' ? 14 : 8;
  const bgColor = isExpanded
    ? overDark
      ? '#F2EEE8'
      : '#241E1A'
    : isLightMode
      ? 'transparent'
      : mode === 'pointer'
        ? '#A7C1D9'
        : overDark
          ? '#F2EEE8'
          : '#241E1A';
  const textColor = overDark ? '#1C1917' : '#F2EEE8';

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[95] pointer-events-none flex items-center justify-center rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: bgColor,
        border: isLightMode ? '1px solid #241E1A' : 'none',
        color: textColor,
        opacity: visible ? 1 : 0,
        transitionProperty: 'width, height, background-color, opacity',
        transitionDuration: '0.32s',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        willChange: 'transform',
      }}
    >
      {isLightMode && (
        <span
          className="block w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#A7C1D9' }}
        />
      )}
      {isExpanded && (
        <span className="font-label" style={{ fontSize: '11px', lineHeight: 1 }}>
          {mode === 'view' ? 'View' : 'Drag'}
        </span>
      )}
    </div>
  );
};
