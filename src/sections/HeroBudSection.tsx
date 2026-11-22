import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { getDesignById, Lang, SITE_CONFIG } from '../config';
import { ActiveViewBox, HandStage } from '../components/HandStage';
import { BrandLogo } from '../components/BrandLogo';
import { resolveAssetUrl } from '../utils/assetUrl';
import { detectWebGLSupport } from '../utils/webgl';
import type { BudPhase } from '../components/three/HeroBudCanvas';

const HeroBudCanvas = lazy(() =>
  import('../components/three/HeroBudCanvas').then((m) => ({ default: m.HeroBudCanvas }))
);

const STORAGE_KEY = 'sou_v3_bud_opened';

interface HeroBudSectionProps {
  lang: Lang;
  reducedMotion: boolean;
  onNavigate: (sectionId: string) => void;
  /** Skip straight to revealed state when landing with ?d= or ?calibrate */
  skipIntro?: boolean;
}

export const HeroBudSection: React.FC<HeroBudSectionProps> = ({
  lang,
  reducedMotion,
  onNavigate,
  skipIntro = false,
}) => {
  const webglOk = detectWebGLSupport();
  const canAnimate3D = webglOk && !reducedMotion;

  const [phase, setPhase] = useState<BudPhase>(() => {
    if (!canAnimate3D || skipIntro) return 'revealed';
    try {
      if (window.localStorage.getItem(STORAGE_KEY) === '1') return 'revealed';
    } catch {
      // Ignore storage restrictions
    }
    return 'closed';
  });

  const [mount3D, setMount3D] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [visualProgress, setVisualProgress] = useState(phase === 'revealed' ? 1 : 0);
  const [revealedFingers, setRevealedFingers] = useState<boolean[]>(() =>
    phase === 'revealed' ? [true, true, true, true, true] : [false, false, false, false, false]
  );
  const [bloomFlash, setBloomFlash] = useState(false);

  const [handViewBox, setHandViewBox] = useState<ActiveViewBox>({
    x: 0,
    y: 0,
    w: SITE_CONFIG.media.handWidth,
    h: SITE_CONFIG.media.handHeight,
  });

  // Live physics refs read at 60fps by HeroBudCanvas
  const progressRef = useRef(phase === 'revealed' ? 1 : 0);
  const windRef = useRef({ x: 0, y: 0 });
  const dragStateRef = useRef<{
    active: boolean;
    pointerId: number;
    lastX: number;
    lastY: number;
    accumDist: number;
  }>({ active: false, pointerId: -1, lastX: 0, lastY: 0, accumDist: 0 });

  // Defer lazy loading 3D bud briefly so the preloaded static bud paints as instant LCP first!
  useEffect(() => {
    if (!canAnimate3D || phase === 'revealed') return;
    const t = window.setTimeout(() => setMount3D(true), 320);
    return () => window.clearTimeout(t);
  }, [canAnimate3D, phase]);

  // Smooth spring return when released before 0.5, or auto-open completion when blooming
  useEffect(() => {
    if (phase !== 'closed' && phase !== 'blooming') return;
    let rafId = 0;

    const step = () => {
      if (phase === 'closed' && progressRef.current > 0.002) {
        // Critically damped smooth return (never overshoots)
        progressRef.current *= 0.88;
        windRef.current.x *= 0.88;
        windRef.current.y *= 0.88;
        if (progressRef.current < 0.003) progressRef.current = 0;
        setVisualProgress(progressRef.current);
        rafId = window.requestAnimationFrame(step);
      } else if (phase === 'blooming') {
        progressRef.current += (1 - progressRef.current) * 0.14 + 0.012;
        if (progressRef.current >= 0.86) {
          progressRef.current = 1;
          setVisualProgress(1);
          setPhase('landing');
          return;
        }
        setVisualProgress(progressRef.current);
        rafId = window.requestAnimationFrame(step);
      }
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [phase]);

  const triggerAutoBloom = useCallback(() => {
    if (phase === 'landing' || phase === 'revealed') return;
    if (!canAnimate3D) {
      setRevealedFingers([true, true, true, true, true]);
      setPhase('revealed');
      return;
    }
    setMount3D(true);
    windRef.current = { x: 0.45, y: 0.25 };
    setPhase('blooming');
  }, [phase, canAnimate3D]);

  const handleFingerLanded = useCallback((idx: number) => {
    setRevealedFingers((prev) => {
      if (prev[idx]) return prev;
      const next = [...prev];
      next[idx] = true;
      return next;
    });
  }, []);

  const handleRevealComplete = useCallback(() => {
    setRevealedFingers([true, true, true, true, true]);
    setBloomFlash(true);
    setPhase('revealed');
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // Ignore
    }
  }, []);

  const handleReplay = useCallback(() => {
    if (!canAnimate3D) return;
    progressRef.current = 0;
    windRef.current = { x: 0, y: 0 };
    setVisualProgress(0);
    setRevealedFingers([false, false, false, false, false]);
    setBloomFlash(false);
    setMount3D(true);
    setPhase('closed');
  }, [canAnimate3D]);

  // Pointer drag interaction in ANY direction on the closed bud
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (phase !== 'closed' && phase !== 'dragging') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStateRef.current = {
      active: true,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      accumDist: -Math.log(Math.max(0.01, 1 - progressRef.current)) * (window.innerWidth < 640 ? 145 : 210),
    };
    setPhase('dragging');
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    const dx = e.clientX - st.lastX;
    const dy = e.clientY - st.lastY;
    st.lastX = e.clientX;
    st.lastY = e.clientY;

    const stepDist = Math.hypot(dx, dy);
    if (stepDist < 0.5) return;

    st.accumDist += stepDist;
    const k = window.innerWidth < 640 ? 145 : 210;
    // Damped resistance curve per spec: progress = 1 - exp(-d / k)
    const p = 1 - Math.exp(-st.accumDist / k);
    progressRef.current = p;
    setVisualProgress(p);

    // Track gentle wind direction from user gesture
    windRef.current.x = windRef.current.x * 0.75 + Math.max(-1, Math.min(1, dx / 18)) * 0.25;
    windRef.current.y = windRef.current.y * 0.75 + Math.max(-1, Math.min(1, -dy / 18)) * 0.25;

    // Auto-bloom smoothly once pulled deeply past 0.72
    if (p >= 0.72) {
      st.active = false;
      setPhase('blooming');
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = dragStateRef.current;
    if (!st.active || st.pointerId !== e.pointerId) return;
    st.active = false;
    if (progressRef.current >= 0.46) {
      setPhase('blooming');
    } else {
      setPhase('closed');
    }
  };

  const revealDesign = getDesignById(SITE_CONFIG.hero.defaultRevealDesignId);
  const isInteractiveBud = phase === 'closed' || phase === 'dragging';
  const isRevealed = phase === 'revealed';

  // Hand gradually emerges from luminous blush-milk veil once bud opens past 0.22
  const handOpacity =
    phase === 'revealed' || phase === 'landing'
      ? 1
      : Math.max(0, Math.min(1, (visualProgress - 0.18) / 0.52));

  return (
    <section
      id="hero"
      aria-label={SITE_CONFIG.brandName}
      className="relative w-full h-[100svh] min-h-[600px] overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse 85% 75% at 52% 45%, #FBF6F3 0%, #F7F1EE 56%, #EFE3DE 100%)',
      }}
    >
      {/* 1. Underlying Hand Stage (bare nails while bud opens -> real gel nails as 5 petals land) */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: handOpacity,
          transform: `scale(${1.03 - handOpacity * 0.03})`,
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <HandStage
          design={revealDesign}
          revealedFingers={revealedFingers}
          onViewBoxChange={setHandViewBox}
          showImageTag={isRevealed}
        />
      </div>

      {/* 2. Instant LCP Static Flower Bud Photo (visible at 0ms, unmounts immediately when 3D Canvas takes over) */}
      {!isRevealed && phase !== 'landing' && !canvasReady && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          style={{
            opacity: Math.max(0, 1 - visualProgress * 1.8),
          }}
          aria-hidden="true"
        >
          <picture className="w-full h-full">
            <source
              media="(max-width: 1023px)"
              srcSet={resolveAssetUrl('/media/hero-bud-static-880.avif')}
              type="image/avif"
            />
            <source
              media="(max-width: 1023px)"
              srcSet={resolveAssetUrl('/media/hero-bud-static-880.webp')}
              type="image/webp"
            />
            <source
              srcSet={resolveAssetUrl('/media/hero-bud-static.avif')}
              type="image/avif"
            />
            <img
              src={resolveAssetUrl(SITE_CONFIG.media.heroBudStatic)}
              alt=""
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover"
            />
          </picture>
        </div>
      )}

      {/* 3. Lazy-loaded Interactive 3D Flower Bud Canvas (14 sculpted gel-tip petals) */}
      {canAnimate3D && mount3D && !isRevealed && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Suspense fallback={null}>
            <HeroBudCanvas
              phase={phase}
              progressRef={progressRef}
              windRef={windRef}
              handViewBox={handViewBox}
              onReady={() => setCanvasReady(true)}
              onFingerLanded={handleFingerLanded}
              onRevealComplete={handleRevealComplete}
            />
          </Suspense>
        </div>
      )}

      {/* 4. Full-stage tactile drag / keyboard hit-zone while bud is interactive */}
      {isInteractiveBud && (
        <div
          role="button"
          tabIndex={0}
          aria-label={
            lang === 'ja'
              ? '花苞をドラッグまたはEnterキーで開く'
              : 'Drag or press Enter to open the petal bud'
          }
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              triggerAutoBloom();
            }
          }}
          className="absolute inset-0 z-20 flex flex-col items-center justify-end pb-[13svh] sm:pb-[12svh] cursor-grab active:cursor-grabbing touch-none outline-none"
        >
          {/* Single quiet Japanese guide line — verbatim per spec */}
          <div
            className="flex flex-col items-center gap-3.5 transition-opacity duration-300"
            style={{ opacity: Math.max(0, 1 - visualProgress * 2.2) }}
          >
            <p
              className="m-0 font-mincho text-[15px] sm:text-[17px] tracking-[0.2em]"
              style={{ color: '#3B2B2C' }}
            >
              {SITE_CONFIG.hero.guide[lang]}
            </p>
            {/* Whisper-thin hairline drag cue (non-intrusive visual affordance) */}
            <span
              className="block w-10 h-[1px]"
              style={{ backgroundColor: '#C7A97F', opacity: 0.72 }}
            />
          </div>
        </div>
      )}

      {/* 5. Soft single-moment warm light bloom upon reveal */}
      {bloomFlash && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 animate-reveal-bloom"
          style={{
            background:
              'radial-gradient(circle at 60% 42%, rgba(255, 250, 246, 0.75) 0%, rgba(239, 227, 222, 0.25) 42%, transparent 72%)',
          }}
        />
      )}

      {/* 6. Revealed Editorial Typography & Two Quiet CTAs — placed in calm space away from the 5 nails */}
      <div
        className="absolute inset-x-0 bottom-0 z-20 px-6 sm:px-12 lg:px-16 pb-10 sm:pb-14 pt-20 pointer-events-none transition-all duration-700"
        style={{
          opacity: isRevealed ? 1 : 0,
          transform: isRevealed ? 'translate3d(0, 0, 0)' : 'translate3d(0, 14px, 0)',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          background:
            'linear-gradient(180deg, rgba(247, 241, 238, 0) 0%, rgba(247, 241, 238, 0.78) 54%, rgba(247, 241, 238, 0.96) 100%)',
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="space-y-2.5">
            <BrandLogo size="md" shortOnly />
            <h1
              className="m-0 font-mincho jp-heading text-[26px] sm:text-[34px] lg:text-[40px] tracking-[0.14em] leading-[1.3]"
              style={{ color: '#3B2B2C' }}
            >
              {SITE_CONFIG.hero.revealedHeadline[lang]}
            </h1>
          </div>

          <div
            className={`flex items-center gap-3.5 sm:gap-4 ${
              isRevealed ? 'pointer-events-auto' : 'pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => onNavigate('vanity')}
              className="rounded-full px-7 py-3 text-[13px] tracking-[0.14em] font-body border-0 cursor-pointer transition-all duration-300 hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: '#C9989A',
                color: '#FBF7F4',
              }}
            >
              {SITE_CONFIG.hero.primaryCta[lang]}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('counseling')}
              className="rounded-full px-6 py-3 text-[13px] tracking-[0.14em] font-body bg-transparent cursor-pointer transition-colors duration-300 hover:bg-[#EFE3DE]/70 active:scale-[0.98]"
              style={{
                color: '#3B2B2C',
                border: '1px solid rgba(59, 43, 44, 0.24)',
              }}
            >
              {SITE_CONFIG.hero.secondaryCta[lang]}
            </button>
          </div>
        </div>
      </div>

      {/* 7. Subtle 「もう一度」 replay link for returning visitors */}
      {isRevealed && canAnimate3D && (
        <button
          type="button"
          onClick={handleReplay}
          className="absolute top-[72px] right-5 sm:right-10 z-20 bg-transparent border-0 p-1.5 text-[11.5px] tracking-[0.14em] cursor-pointer transition-opacity duration-300 opacity-65 hover:opacity-100"
          style={{
            color: '#7E6B6C',
            borderBottom: '1px solid rgba(199, 169, 127, 0.5)',
          }}
        >
          {SITE_CONFIG.hero.replay[lang]}
        </button>
      )}
    </section>
  );
};
