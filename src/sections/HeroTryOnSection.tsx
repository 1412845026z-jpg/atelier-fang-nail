import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';
import {
  FingerCalibration,
  FingerDesign,
  FingerIndex,
  LinePattern,
  NailArtType,
  NailDesignState,
  NailFinish,
  NailLength,
  NailShape,
} from '../types/nail';
import { NailStageHandle, NailSvgLayer } from '../components/NailSvgLayer';
import { ScrollSequence } from '../components/ScrollSequence';
import {
  buildInstagramDmUrl,
  buildLineOaUrl,
  buildReservationMessage,
  buildShareableDesignUrl,
  copyTextToClipboard,
  estimateDesign,
  formatYen,
} from '../utils/designCodec';
import { buildNailControlPoints, controlPointsToPathD } from '../utils/nailGeometry';
import { exportDesignCardPng } from '../utils/exportDesignCard';
import { resolveAssetUrl } from '../utils/assetUrl';

gsap.registerPlugin(ScrollTrigger);

type StudioTab = 'shape' | 'length' | 'color' | 'art';

interface HeroTryOnSectionProps {
  lang: Lang;
  design: NailDesignState;
  onDesignChange: (next: NailDesignState, pushHistory?: boolean) => void;
  onUndo: () => void;
  canUndo: boolean;
  onReset: () => void;
  paintTrigger: number;
  onHeroImageReady: () => void;
  onNavigateToSection: (sectionId: string) => void;
  onBookWithDesign: () => void;
  calibrateMode: boolean;
}

export const HeroTryOnSection: React.FC<HeroTryOnSectionProps> = ({
  lang,
  design,
  onDesignChange,
  onUndo,
  canUndo,
  onReset,
  paintTrigger,
  onHeroImageReady,
  onNavigateToSection,
  onBookWithDesign,
  calibrateMode,
}) => {
  const heroWrapRef = useRef<HTMLDivElement | null>(null);
  const heroNailRef = useRef<NailStageHandle | null>(null);
  const studioNailRef = useRef<NailStageHandle | null>(null);
  const studioStageRef = useRef<HTMLDivElement | null>(null);
  const ownPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [heroProgress, setHeroProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Try-on Studio interactive states
  const [activeTab, setActiveTab] = useState<StudioTab>('color');
  const [selectedFinger, setSelectedFinger] = useState<FingerIndex | null>(null); // null = All
  const [compareOn, setCompareOn] = useState(false);
  const [compareSplit, setCompareSplit] = useState(0.5);
  const [consultOpen, setConsultOpen] = useState(false);
  const [igCopiedNotice, setIgCopiedNotice] = useState(false);
  const [savingCard, setSavingCard] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [omakaseCursor, setOmakaseCursor] = useState(0);

  // Calibration & Own-Hand Upload state
  const [calibrations, setCalibrations] = useState<FingerCalibration[]>(() =>
    SITE_CONFIG.fingerCalibrations.map((c) => ({ ...c }))
  );
  const [calCopied, setCalCopied] = useState(false);

  const [ownHandUrl, setOwnHandUrl] = useState<string | null>(null);
  const [ownHandDims, setOwnHandDims] = useState<{ w: number; h: number } | null>(null);
  const [ownHandPins, setOwnHandPins] = useState<{ x: number; y: number }[]>([]);
  const [ownHandPinning, setOwnHandPinning] = useState(false);

  // Light tracking refs (ZERO React re-renders on pointermove / gyro!)
  const targetLightRef = useRef({ x: -0.35, y: -0.25 });
  const currentLightRef = useRef({ x: -0.35, y: -0.25 });
  const lastLightInputRef = useRef(0);
  const draggingSplitRef = useRef(false);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth < 1024);
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Preload primary bare-hand base image immediately for fast <= 1.1s LCP
  const defaultHandHref = isMobile
    ? SITE_CONFIG.media.bareHandBaseMobile
    : SITE_CONFIG.media.bareHandBase;

  useEffect(() => {
    const img = new Image();
    img.src = resolveAssetUrl(defaultHandHref);
    const done = () => onHeroImageReady();
    if (img.complete) {
      done();
    } else {
      img.onload = done;
      img.onerror = done;
    }
  }, [defaultHandHref, onHeroImageReady]);

  // Hero scroll trigger (220vh pinned reveal: vellum peel -> sequential signature brush paint -> glide to Try-on)
  useEffect(() => {
    if (reducedMotion) {
      setHeroProgress(1);
      return;
    }
    const el = heroWrapRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        setHeroProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  // 60fps ambient + pointer + gyroscope light loop for Try-on Studio & Hero nails
  useEffect(() => {
    if (reducedMotion) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      const lx = Math.max(-1, Math.min(1, e.gamma / 30));
      const ly = Math.max(-1, Math.min(1, (e.beta - 40) / 30));
      targetLightRef.current.x = lx;
      targetLightRef.current.y = ly;
      lastLightInputRef.current = performance.now();
    };

    window.addEventListener('deviceorientation', handleOrientation, true);

    let rafId = 0;
    const loop = (now: number) => {
      // Gentle living ambient drift when user has not moved pointer/gyro for 2.2s
      if (now - lastLightInputRef.current > 2200) {
        const t = now * 0.001;
        targetLightRef.current.x = Math.sin(t * 0.65) * 0.48;
        targetLightRef.current.y = Math.cos(t * 0.45) * 0.34;
      }

      const cur = currentLightRef.current;
      const tgt = targetLightRef.current;
      cur.x += (tgt.x - cur.x) * 0.14;
      cur.y += (tgt.y - cur.y) * 0.14;

      studioNailRef.current?.setLight(cur.x, cur.y);
      heroNailRef.current?.setLight(cur.x * 0.7, cur.y * 0.7);

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  // Cleanup own-hand object URL on unmount
  useEffect(() => {
    return () => {
      if (ownHandUrl) URL.revokeObjectURL(ownHandUrl);
    };
  }, [ownHandUrl]);

  const activeHandHref = ownHandUrl || defaultHandHref;
  const activeHandW = ownHandDims?.w || SITE_CONFIG.media.bareHandWidth;
  const activeHandH = ownHandDims?.h || SITE_CONFIG.media.bareHandHeight;

  const estimate = useMemo(() => estimateDesign(design), [design]);
  const currentFingerDesign: FingerDesign =
    selectedFinger !== null ? design.fingers[selectedFinger] : design.fingers[2];

  const updateFingers = useCallback(
    (updater: (f: FingerDesign) => FingerDesign, clearPreset = true) => {
      const nextFingers = design.fingers.map((f, idx) => {
        if (selectedFinger === null || selectedFinger === idx) {
          return updater(f);
        }
        return f;
      }) as NailDesignState['fingers'];

      onDesignChange(
        {
          ...design,
          fingers: nextFingers,
          presetId: clearPreset ? undefined : design.presetId,
        },
        true
      );
    },
    [design, onDesignChange, selectedFinger]
  );

  const handleShapeSelect = (shape: NailShape) => {
    onDesignChange({ ...design, shape, presetId: undefined }, true);
  };

  const handleLengthSelect = (length: NailLength) => {
    onDesignChange({ ...design, length, presetId: undefined }, true);
  };

  const handleSwatchSelect = (colorId: string) => {
    updateFingers((f) => ({ ...f, colorId }));
  };

  const handleFinishSelect = (finish: NailFinish) => {
    updateFingers((f) => ({ ...f, finish }));
  };

  const handleArtSelect = (art: NailArtType) => {
    updateFingers((f) => ({ ...f, art }));
  };

  const handleOmakase = () => {
    const looks = SITE_CONFIG.omakaseLooks;
    const nextIdx = omakaseCursor % looks.length;
    setOmakaseCursor((c) => c + 1);
    const chosen = looks[nextIdx];
    onDesignChange(
      {
        shape: chosen.shape,
        length: chosen.length,
        fingers: chosen.fingers.map((f) => ({ ...f })) as NailDesignState['fingers'],
      },
      true
    );
  };

  const handleApplyWorkPreset = (preset: NailDesignState) => {
    setSelectedFinger(null);
    onDesignChange(
      {
        shape: preset.shape,
        length: preset.length,
        presetId: preset.presetId,
        fingers: preset.fingers.map((f) => ({ ...f })) as NailDesignState['fingers'],
      },
      true
    );
  };

  const handleStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = studioStageRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (draggingSplitRef.current) {
      const nextSplit = Math.max(0.08, Math.min(0.92, (e.clientX - rect.left) / rect.width));
      setCompareSplit(nextSplit);
      return;
    }

    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    targetLightRef.current.x = nx;
    targetLightRef.current.y = ny;
    lastLightInputRef.current = performance.now();
  };

  const handleSaveCard = async () => {
    if (savingCard) return;
    setSavingCard(true);
    try {
      const ok = await exportDesignCardPng({
        svgElement: studioNailRef.current?.getSvgElement() || null,
        handImageHref: activeHandHref,
        design,
        lang,
      });
      if (ok) {
        setSavedFlash(true);
        window.setTimeout(() => setSavedFlash(false), 1800);
      }
    } finally {
      setSavingCard(false);
    }
  };

  const handleOwnPhotoUpload = (file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (ownHandUrl) URL.revokeObjectURL(ownHandUrl);
      setOwnHandUrl(url);
      setOwnHandDims({ w: img.naturalWidth, h: img.naturalHeight });
      setOwnHandPins([]);
      setOwnHandPinning(true);
    };
    img.src = url;
  };

  const handleOwnHandPinClick = (x: number, y: number) => {
    if (!ownHandPinning) return;
    const next = [...ownHandPins, { x, y }];
    setOwnHandPins(next);

    if (next.length === 10) {
      const built: FingerCalibration[] = SITE_CONFIG.fingerCalibrations.map((base, idx) => {
        const root = next[idx * 2];
        const tip = next[idx * 2 + 1];
        const dx = tip.x - root.x;
        const dy = tip.y - root.y;
        const len = Math.max(24, Math.round(Math.hypot(dx, dy)));
        const angleDeg = Number(((Math.atan2(dx, -dy) * 180) / Math.PI).toFixed(1));
        return {
          ...base,
          cx: root.x,
          cy: root.y,
          angleDeg,
          baseLength: len,
          width: Math.max(18, Math.round(len * 0.68)),
          scaleY: idx === 4 ? 0.9 : 1.0,
        };
      });
      setCalibrations(built);
      setOwnHandPinning(false);
      setOwnHandPins([]);
    }
  };

  const handleResetOwnHand = () => {
    if (ownHandUrl) URL.revokeObjectURL(ownHandUrl);
    setOwnHandUrl(null);
    setOwnHandDims(null);
    setOwnHandPins([]);
    setOwnHandPinning(false);
    setCalibrations(SITE_CONFIG.fingerCalibrations.map((c) => ({ ...c })));
  };

  // Consult message (LINE / Instagram DM without forcing date selection)
  const consultShareUrl = useMemo(() => buildShareableDesignUrl(design), [design]);
  const consultMessage = useMemo(
    () =>
      buildReservationMessage({
        lang,
        mode: 'consult',
        menuLabel: estimate.menuName[lang],
        design,
        designUrl: consultShareUrl,
      }),
    [consultShareUrl, design, estimate.menuName, lang]
  );

  const handleConsultInstagram = async () => {
    await copyTextToClipboard(consultMessage);
    setIgCopiedNotice(true);
    window.open(buildInstagramDmUrl(), '_blank', 'noopener,noreferrer');
    window.setTimeout(() => setIgCopiedNotice(false), 5000);
  };

  // Hero Choreographed Progress Variables (0 -> 1)
  // 0.00 -> 0.24: Giant "soū" title opens tracking & dissolves
  // 0.04 -> 0.54: Code-rendered frosted Japanese vellum paper curls diagonally from bottom-right -> top-left
  // 0.50 -> 0.78: Five fingers brush-paint signature 霧青フレンチ sequentially
  // 0.76 -> 1.00: Two buttons ("試してみる" + "予約") slide up + subtle leftward hand shift into Studio framing
  const titleT = reducedMotion ? 1 : Math.max(0, Math.min(1, heroProgress / 0.24));
  const titleSpacing = -0.04 + titleT * 0.06;
  const titleOpacity = reducedMotion ? 0 : Math.max(0, 1 - Math.pow(titleT, 1.35));

  const peelT = reducedMotion
    ? 1
    : Math.max(0, Math.min(1, (heroProgress - 0.04) / 0.5));
  const peelEased = peelT * peelT * (3 - 2 * peelT);

  const paintProgress = reducedMotion
    ? 1
    : Math.max(0, Math.min(1, (heroProgress - 0.5) / 0.28));

  const ctaVisible = reducedMotion || heroProgress >= 0.74;
  const handShiftPct =
    reducedMotion || isMobile
      ? 0
      : Math.max(0, Math.min(1, (heroProgress - 0.82) / 0.18)) * -12;

  // Diagonal vellum sheet clip-path sweeping cleanly from bottom-right corner toward top-left
  // When peelEased = 0 -> full rectangle covers hand; when peelEased = 1 -> fully peeled off upper-left
  const cornerSweep = (1 - peelEased) * 210; // 210% -> 0%
  const vellumClip = `polygon(0% 0%, ${Math.min(100, cornerSweep).toFixed(1)}% 0%, ${Math.max(
    0,
    cornerSweep - 100
  ).toFixed(1)}% 100%, 0% ${Math.min(100, cornerSweep).toFixed(1)}%)`;

  const ui = SITE_CONFIG.tryonUI;
  const currentFingerIndexPin = Math.floor(ownHandPins.length / 2);
  const currentPinPhase = ownHandPins.length % 2 === 0 ? 'root' : 'tip';

  return (
    <div className="relative w-full" style={{ backgroundColor: '#F2EEE8' }}>
      {/* Optional future MP4 ScrollSequence hook (skipped cleanly with 0 network requests when hasHeroVideo=false) */}
      {SITE_CONFIG.media.hasHeroVideo && (
        <ScrollSequence
          src={SITE_CONFIG.media.heroVideo}
          framesDir={SITE_CONFIG.media.heroFramesDir}
          enabled={SITE_CONFIG.media.hasHeroVideo}
          scrollLength="300vh"
          optional={true}
        />
      )}

      {/* ================================================================= */}
      {/* 01 HERO — Code-Rendered Frosted Vellum Peel + Auto Brush Reveal   */}
      {/* ================================================================= */}
      <section
        id="hero"
        ref={heroWrapRef}
        className="relative w-full"
        style={{
          height: reducedMotion ? '100svh' : '220vh',
          backgroundColor: '#F2EEE8',
        }}
      >
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          {/* Same bare-hand base photo + live SVG nail engine (extra width prevents any right-edge seam during leftward glide) */}
          <div
            className="absolute inset-y-0 left-0 w-[114%]"
            style={{
              transform: `translate3d(${(-6 + handShiftPct * 0.55).toFixed(2)}%, 0, 0)`,
              willChange: 'transform',
            }}
          >
            <NailSvgLayer
              ref={heroNailRef}
              idPrefix="hero-stage"
              design={SITE_CONFIG.signatureDesign}
              calibrations={SITE_CONFIG.fingerCalibrations}
              imageHref={defaultHandHref}
              imageWidth={SITE_CONFIG.media.bareHandWidth}
              imageHeight={SITE_CONFIG.media.bareHandHeight}
              scrollPaintProgress={paintProgress}
            />
          </div>

          {/* Code-rendered Frosted Japanese Vellum Paper peeling diagonally from bottom-right */}
          {peelEased < 0.995 && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-10 vellum-paper-texture"
              style={{
                backgroundColor: 'rgba(245, 241, 235, 0.72)',
                backdropFilter: 'blur(11px)',
                WebkitBackdropFilter: 'blur(11px)',
                clipPath: vellumClip,
                willChange: 'clip-path',
              }}
            >
              {/* Whisper-soft bottom-right corner curl highlight & shadow cue */}
              <div
                className="absolute right-0 bottom-0 w-24 h-24 sm:w-32 sm:h-32"
                style={{
                  opacity: Math.max(0, 1 - peelEased * 2.4),
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(242,238,232,0.4) 48%, rgba(36,30,26,0.12) 52%, transparent 65%)',
                }}
              />
            </div>
          )}

          {/* Opening monumental brand wordmark */}
          <div
            className="pointer-events-none absolute inset-x-0 top-[20vh] sm:top-[17vh] z-20 flex flex-col items-center px-4 select-none"
            style={{
              opacity: titleOpacity,
              transform: `translate3d(0, ${(-titleT * 22).toFixed(1)}px, 0)`,
              willChange: 'transform, opacity',
            }}
          >
            <h1
              className="font-editorial m-0 text-center whitespace-nowrap leading-[0.9]"
              style={{
                fontSize: 'clamp(3.2rem, 13.4vw, 14.5vw)',
                letterSpacing: `${titleSpacing.toFixed(4)}em`,
                color: '#241E1A',
              }}
            >
              {SITE_CONFIG.brandName}
            </h1>
            <span className="font-label mt-4" style={{ color: '#8A8178' }}>
              {SITE_CONFIG.city[lang]} · {SITE_CONFIG.priceRangeLabel}
            </span>
          </div>

          {/* Revealed Hero Climax Actions: Primary "試してみる" + Hairline Link "予約" */}
          <div className="pointer-events-none absolute right-5 sm:right-10 lg:right-14 bottom-16 sm:bottom-20 md:top-1/2 md:bottom-auto md:-translate-y-1/2 z-20">
            <div className="overflow-hidden pt-1">
              <div
                className="pointer-events-auto flex flex-col items-start gap-4"
                style={{
                  transform: ctaVisible ? 'translate3d(0, 0%, 0)' : 'translate3d(0, 115%, 0)',
                  opacity: ctaVisible ? 1 : 0,
                  transitionProperty: 'transform, opacity',
                  transitionDuration: reducedMotion ? '0s' : '0.9s',
                  transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              >
                <div
                  className="font-label px-2.5 py-1 rounded-[2px]"
                  style={{
                    backgroundColor: 'rgba(242, 238, 232, 0.9)',
                    borderLeft: '2px solid #A7C1D9',
                    color: '#241E1A',
                  }}
                >
                  No.01 · {SITE_CONFIG.works[0].title[lang]}
                </div>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => onNavigateToSection('tryon')}
                    className="group inline-flex items-center gap-4 px-7 py-3.5 rounded-[2px] border-0 cursor-pointer font-label"
                    style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
                  >
                    <span>{SITE_CONFIG.hero.primaryCta[lang]}</span>
                    <span
                      className="inline-block h-[1px] w-7 origin-left transition-transform duration-500 group-hover:scale-x-125"
                      style={{ backgroundColor: '#A7C1D9' }}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToSection('booking')}
                    className="bg-transparent border-0 pb-1 cursor-pointer font-label transition-opacity hover:opacity-60"
                    style={{
                      color: '#241E1A',
                      borderBottom: '1px solid rgba(36, 30, 26, 0.45)',
                    }}
                  >
                    {SITE_CONFIG.hero.secondaryCta[lang]}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-left pure visual scroll progress hairline */}
          <div
            className="pointer-events-none absolute left-5 sm:left-8 lg:left-12 bottom-7 z-20 flex items-center gap-3.5 select-none"
            style={{
              opacity: reducedMotion ? 0 : Math.max(0, Math.min(1, (0.96 - heroProgress) / 0.1)),
            }}
          >
            <div
              className="relative w-[1px] h-7 overflow-hidden"
              style={{ backgroundColor: 'rgba(36,30,26,0.18)' }}
            >
              <div className="w-full h-full animate-scroll-tick" style={{ backgroundColor: '#241E1A' }} />
            </div>
            <div
              className="relative h-[1px] w-24 sm:w-28 overflow-hidden"
              style={{ backgroundColor: 'rgba(36, 30, 26, 0.18)' }}
            >
              <div
                className="absolute inset-y-0 left-0 w-full origin-left"
                style={{
                  backgroundColor: '#241E1A',
                  transform: `scaleX(${Math.max(0.08, heroProgress)})`,
                }}
              />
            </div>
            <span className="font-label tabular-nums" style={{ color: '#241E1A' }}>
              {String(Math.round(heroProgress * 100)).padStart(3, '0')}
            </span>
          </div>
        </div>
      </section>

      {/* ================================================================= */}
      {/* ① NAIL TRY-ON STUDIO — Interactive Hand + Apothecary Controls     */}
      {/* ================================================================= */}
      <section
        id="tryon"
        className="relative w-full hairline-t"
        style={{ backgroundColor: '#F2EEE8', color: '#241E1A' }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[100svh]">
          {/* LEFT (~58% desktop / TOP 52svh sticky mobile): Interactive Hand Stage */}
          <div
            ref={studioStageRef}
            data-cursor="light"
            onPointerMove={handleStagePointerMove}
            onPointerUp={() => {
              draggingSplitRef.current = false;
            }}
            onPointerLeave={() => {
              draggingSplitRef.current = false;
            }}
            className="relative lg:col-span-7 h-[43svh] lg:h-[100svh] sticky top-0 overflow-hidden select-none z-20"
            style={{ backgroundColor: '#E5DCD1' }}
          >
            <NailSvgLayer
              ref={studioNailRef}
              idPrefix="studio"
              design={design}
              calibrations={calibrations}
              imageHref={activeHandHref}
              imageWidth={activeHandW}
              imageHeight={activeHandH}
              paintTrigger={paintTrigger}
              selectedFinger={selectedFinger}
              onSelectFinger={(idx) =>
                setSelectedFinger((cur) => (cur === idx ? null : idx))
              }
              compareSplit={compareOn ? compareSplit : null}
              calibrateMode={calibrateMode}
              onUpdateCalibration={(idx, next) =>
                setCalibrations((prev) => prev.map((c, i) => (i === idx ? next : c)))
              }
              ownHandPins={ownHandPinning ? ownHandPins : undefined}
              onStageSvgClick={ownHandPinning ? handleOwnHandPinClick : undefined}
            />

            {/* Split bare-vs-designed draggable hairline curtain */}
            {compareOn && (
              <div
                className="absolute inset-y-0 z-30 flex items-center"
                style={{ left: `${compareSplit * 100}%`, transform: 'translateX(-50%)' }}
              >
                <div
                  className="h-full w-[1px]"
                  style={{ backgroundColor: '#241E1A' }}
                />
                <button
                  type="button"
                  aria-label="Drag comparison split"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    draggingSplitRef.current = true;
                  }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-9 h-9 rounded-full cursor-ew-resize flex items-center justify-center border-0 font-label"
                  style={{
                    backgroundColor: '#F2EEE8',
                    border: '1px solid #241E1A',
                    color: '#241E1A',
                  }}
                >
                  ↔
                </button>
                <span
                  className="pointer-events-none absolute top-16 right-3 font-label px-2 py-0.5 rounded-[2px]"
                  style={{ backgroundColor: 'rgba(242,238,232,0.88)', color: '#8A8178' }}
                >
                  {ui.bareLabel[lang]}
                </span>
                <span
                  className="pointer-events-none absolute top-16 left-3 font-label px-2 py-0.5 rounded-[2px]"
                  style={{ backgroundColor: 'rgba(242,238,232,0.88)', color: '#241E1A' }}
                >
                  {ui.designLabel[lang]}
                </span>
              </div>
            )}

            {/* Specimen shutter-flash proof moment when saving 1080×1350 card */}
            {savedFlash && (
              <div
                aria-live="polite"
                className="pointer-events-none absolute inset-4 z-40 flex items-center justify-center rounded-[2px]"
                style={{
                  border: '1px solid #A7C1D9',
                  backgroundColor: 'rgba(242, 238, 232, 0.78)',
                }}
              >
                <div className="px-6 py-4 text-center" style={{ borderLeft: '2px solid #A7C1D9', backgroundColor: '#F2EEE8' }}>
                  <div className="font-label" style={{ color: '#8A8178' }}>
                    {estimate.specimenCode} · 1080×1350 PNG
                  </div>
                  <div className="font-editorial text-[24px] mt-1 text-[#241E1A]">
                    {ui.savedStamp[lang]}
                  </div>
                </div>
              </div>
            )}

            {/* Own-hand manual 2-point pinning HUD */}
            {ownHandPinning && (
              <div
                className="absolute inset-x-4 top-16 z-30 px-4 py-3 flex items-center justify-between gap-4 rounded-[2px]"
                style={{
                  backgroundColor: 'rgba(242, 238, 232, 0.94)',
                  border: '1px solid rgba(36,30,26,0.2)',
                }}
              >
                <div className="font-label" style={{ color: '#241E1A' }}>
                  {SITE_CONFIG.fingerCalibrations[currentFingerIndexPin]?.label[lang]} —{' '}
                  {currentPinPhase === 'root'
                    ? lang === 'ja'
                      ? '甘皮（根元）をタップ'
                      : 'Tap cuticle root'
                    : lang === 'ja'
                      ? '爪先をタップ'
                      : 'Tap nail tip'}{' '}
                  ({ownHandPins.length}/10)
                </div>
                <button
                  type="button"
                  onClick={handleResetOwnHand}
                  className="bg-transparent border-0 p-0 cursor-pointer font-label"
                  style={{ color: '#8A8178' }}
                >
                  ×
                </button>
              </div>
            )}

            {/* Top Finger Selector + Quick Tools (single non-wrapping slim bar on mobile so fingernails stay unobstructed) */}
            <div className="absolute top-2 lg:top-[72px] inset-x-2 lg:inset-x-6 z-20 flex flex-nowrap lg:flex-wrap items-center justify-between gap-1.5 overflow-x-auto no-scrollbar pointer-events-auto lg:pointer-events-none">
              <div
                className="pointer-events-auto inline-flex items-center rounded-[2px] p-0.5 lg:p-1 gap-0.5 shrink-0"
                style={{
                  backgroundColor: 'rgba(242, 238, 232, 0.9)',
                  border: '1px solid rgba(36,30,26,0.14)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFinger(null)}
                  className="px-2 py-0.5 lg:px-2.5 lg:py-1 rounded-[2px] border-0 cursor-pointer font-label shrink-0"
                  style={{
                    backgroundColor: selectedFinger === null ? '#241E1A' : 'transparent',
                    color: selectedFinger === null ? '#F2EEE8' : '#241E1A',
                  }}
                >
                  {ui.allFingers[lang]}
                </button>
                {calibrations.map((c) => {
                  const active = selectedFinger === c.index;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedFinger((cur) => (cur === c.index ? null : c.index))
                      }
                      className="px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-[2px] border-0 cursor-pointer font-label shrink-0"
                      style={{
                        backgroundColor: active ? '#A7C1D9' : 'transparent',
                        color: '#241E1A',
                      }}
                    >
                      {c.label[lang]}
                    </button>
                  );
                })}
              </div>

              {/* Quick stage tools: Compare, Omakase, Undo, Reset */}
              <div
                className="pointer-events-auto inline-flex items-center rounded-[2px] p-0.5 lg:p-1 gap-0.5 shrink-0"
                style={{
                  backgroundColor: 'rgba(242, 238, 232, 0.9)',
                  border: '1px solid rgba(36,30,26,0.14)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setCompareOn((v) => !v)}
                  className="px-2 py-0.5 lg:py-1 rounded-[2px] border-0 cursor-pointer font-label"
                  style={{
                    backgroundColor: compareOn ? '#241E1A' : 'transparent',
                    color: compareOn ? '#F2EEE8' : '#241E1A',
                  }}
                >
                  {ui.compare[lang]}
                </button>
                <button
                  type="button"
                  onClick={handleOmakase}
                  className="px-2 py-0.5 lg:py-1 rounded-[2px] border-0 cursor-pointer font-label bg-transparent hover:opacity-65"
                  style={{ color: '#241E1A' }}
                >
                  {ui.omakase[lang]}
                </button>
                <button
                  type="button"
                  disabled={!canUndo}
                  onClick={onUndo}
                  className="px-2 py-0.5 lg:py-1 rounded-[2px] border-0 cursor-pointer font-label bg-transparent disabled:opacity-30"
                  style={{ color: '#241E1A' }}
                >
                  {ui.undo[lang]}
                </button>
                <button
                  type="button"
                  onClick={onReset}
                  className="px-2 py-0.5 lg:py-1 rounded-[2px] border-0 cursor-pointer font-label bg-transparent hover:opacity-65 hidden sm:inline-block"
                  style={{ color: '#8A8178' }}
                >
                  {ui.reset[lang]}
                </button>
              </div>
            </div>

            {/* Bottom Stage Utility Bar: Save 1080×1350 Card + Own Hand Upload */}
            <div className="absolute bottom-3 lg:bottom-6 inset-x-3 lg:inset-x-6 z-20 flex items-center justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2">
                <input
                  ref={ownPhotoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleOwnPhotoUpload(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                {ownHandUrl ? (
                  <button
                    type="button"
                    onClick={handleResetOwnHand}
                    className="px-3 py-1.5 rounded-[2px] cursor-pointer font-label"
                    style={{
                      backgroundColor: 'rgba(242,238,232,0.92)',
                      border: '1px solid rgba(36,30,26,0.2)',
                      color: '#241E1A',
                    }}
                  >
                    ← Studio Hand
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => ownPhotoInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-[2px] cursor-pointer font-label"
                    style={{
                      backgroundColor: 'rgba(242,238,232,0.9)',
                      border: '1px solid rgba(36,30,26,0.16)',
                      color: '#241E1A',
                    }}
                  >
                    {ui.ownHand[lang]}
                  </button>
                )}
              </div>

              <button
                type="button"
                disabled={savingCard}
                onClick={handleSaveCard}
                className="pointer-events-auto px-3.5 py-1.5 rounded-[2px] cursor-pointer font-label"
                style={{
                  backgroundColor: 'rgba(242,238,232,0.92)',
                  border: '1px solid rgba(36,30,26,0.22)',
                  color: '#241E1A',
                }}
              >
                {savingCard ? '...' : ui.saveImage[lang]}
              </button>
            </div>

            {/* ?calibrate live JSON output drawer */}
            {calibrateMode && (
              <div
                className="absolute right-3 bottom-14 z-40 w-[300px] max-h-[260px] overflow-auto p-3 rounded-[2px]"
                style={{
                  backgroundColor: '#1C1917',
                  color: '#F2EEE8',
                  border: '1px solid #A7C1D9',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label" style={{ color: '#A7C1D9' }}>
                    CALIBRATE MODE
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await copyTextToClipboard(JSON.stringify(calibrations, null, 2));
                      setCalCopied(true);
                      window.setTimeout(() => setCalCopied(false), 2000);
                    }}
                    className="px-2 py-0.5 rounded-[2px] border-0 cursor-pointer font-label"
                    style={{ backgroundColor: '#A7C1D9', color: '#1C1917' }}
                  >
                    {calCopied ? 'COPIED' : 'COPY JSON'}
                  </button>
                </div>
                <pre className="m-0 text-[10px] leading-tight font-mono whitespace-pre-wrap">
                  {JSON.stringify(calibrations, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* RIGHT (~42% desktop / BOTTOM 57svh mobile): Editorial Specimen Control Studio */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-[#F2EEE8] lg:border-l border-[rgba(36,30,26,0.14)] lg:pt-[64px]">
            <div className="px-4 sm:px-6 lg:px-8 pt-3 lg:pt-6 pb-2 lg:pb-4 flex-1 flex flex-col gap-3 lg:gap-5">
              {/* Unified Specimen Identity Tag + 8 Works Presets Rail */}
              <div>
                <div className="flex items-baseline justify-between gap-2 pb-2.5 hairline-b">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="inline-block w-[3px] h-4 shrink-0"
                      style={{ backgroundColor: '#A7C1D9' }}
                    />
                    <span className="font-label truncate" style={{ color: '#241E1A' }}>
                      {estimate.specimenCode} · {estimate.summaryText[lang]}
                    </span>
                  </div>
                </div>

                {/* Horizontal Presets Bar (all 8 works synced 1-to-1) */}
                <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <span className="font-label shrink-0 mr-1" style={{ color: '#8A8178' }}>
                    {ui.presetsLabel[lang]}
                  </span>
                  {SITE_CONFIG.works.map((w) => {
                    const active = design.presetId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => handleApplyWorkPreset(w.preset)}
                        className="shrink-0 px-2.5 py-1 rounded-[2px] cursor-pointer font-label flex items-center gap-1.5 transition-colors"
                        style={{
                          backgroundColor: active ? '#241E1A' : 'transparent',
                          color: active ? '#F2EEE8' : '#241E1A',
                          border: active
                            ? '1px solid #241E1A'
                            : '1px solid rgba(36,30,26,0.16)',
                        }}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{ backgroundColor: w.glowColor }}
                        />
                        <span>{w.title[lang]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4 Editorial Control Tabs: 形 / 長さ / 色・質感 / アート */}
              <div className="grid grid-cols-4 hairline-b">
                {ui.tabs.map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className="py-2.5 bg-transparent border-0 cursor-pointer font-label text-center relative"
                      style={{
                        color: active ? '#241E1A' : '#8A8178',
                        borderBottom: active ? '2px solid #A7C1D9' : '2px solid transparent',
                      }}
                    >
                      {tab.label[lang]}
                    </button>
                  );
                })}
              </div>

              {/* TAB PANEL CONTENT */}
              <div className="min-h-[112px] lg:min-h-[300px]">
                {/* TAB 1: SHAPE (7 procedural SVG silhouettes) */}
                {activeTab === 'shape' && (
                  <div className="flex lg:grid lg:grid-cols-4 gap-2 overflow-x-auto lg:overflow-visible pb-2 no-scrollbar">
                    {SITE_CONFIG.shapes.map((s) => {
                      const active = design.shape === s.id;
                      const previewD = controlPointsToPathD(
                        buildNailControlPoints(s.id, 30, 52)
                      );
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleShapeSelect(s.id)}
                          className="shrink-0 w-[94px] lg:w-auto py-3.5 px-2 rounded-[2px] cursor-pointer flex flex-col items-center gap-2.5 transition-colors"
                          style={{
                            backgroundColor: active
                              ? 'rgba(167, 193, 217, 0.14)'
                              : 'transparent',
                            border: active
                              ? '1px solid #A7C1D9'
                              : '1px solid rgba(36, 30, 26, 0.14)',
                            color: '#241E1A',
                          }}
                        >
                          <svg width="34" height="50" viewBox="-22 -58 44 64" fill="none">
                            <path
                              d={previewD}
                              fill={active ? 'rgba(167, 193, 217, 0.25)' : 'none'}
                              stroke="#241E1A"
                              strokeWidth="1.4"
                            />
                          </svg>
                          <span className="font-label text-[10px] leading-tight text-center">
                            {s.label[lang]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TAB 2: LENGTH (S / M / L proportional visual ruler) */}
                {activeTab === 'length' && (
                  <div className="grid grid-cols-3 gap-3">
                    {SITE_CONFIG.lengths.map((lenItem, idx) => {
                      const active = design.length === lenItem.id;
                      const barH = idx === 0 ? 32 : idx === 1 ? 48 : 66;
                      return (
                        <button
                          key={lenItem.id}
                          type="button"
                          onClick={() => handleLengthSelect(lenItem.id)}
                          className="py-5 px-3 rounded-[2px] cursor-pointer flex flex-col items-center justify-end gap-3 transition-colors"
                          style={{
                            backgroundColor: active
                              ? 'rgba(167, 193, 217, 0.14)'
                              : 'transparent',
                            border: active
                              ? '1px solid #A7C1D9'
                              : '1px solid rgba(36, 30, 26, 0.15)',
                            color: '#241E1A',
                          }}
                        >
                          <div className="h-[70px] flex items-end">
                            <span
                              className="block w-5 rounded-t-full"
                              style={{
                                height: `${barH}px`,
                                border: '1.2px solid #241E1A',
                                backgroundColor: active
                                  ? 'rgba(167, 193, 217, 0.35)'
                                  : 'transparent',
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <div className="font-editorial text-[22px] leading-none">
                              {lenItem.tag}
                            </div>
                            <div className="font-label text-[10px] mt-1" style={{ color: '#8A8178' }}>
                              {lenItem.label[lang]}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* TAB 3: COLOR & FINISH (6 optical finishes + 16 apothecary specimen cards) */}
                {activeTab === 'color' && (
                  <div className="space-y-4">
                    {/* 6 Finishes */}
                    <div className="flex lg:grid lg:grid-cols-3 gap-1.5 overflow-x-auto lg:overflow-visible no-scrollbar">
                      {SITE_CONFIG.finishes.map((fin) => {
                        const active = currentFingerDesign.finish === fin.id;
                        return (
                          <button
                            key={fin.id}
                            type="button"
                            onClick={() => handleFinishSelect(fin.id)}
                            className="shrink-0 px-3 py-2 rounded-[2px] cursor-pointer font-label flex items-center justify-between gap-2 transition-colors"
                            style={{
                              backgroundColor: active ? '#241E1A' : 'transparent',
                              color: active ? '#F2EEE8' : '#241E1A',
                              border: active
                                ? '1px solid #241E1A'
                                : '1px solid rgba(36, 30, 26, 0.15)',
                            }}
                          >
                            <span>{fin.label[lang]}</span>
                            <span
                              className="inline-block w-1.5 h-1.5 rounded-full"
                              style={{
                                backgroundColor: active ? '#A7C1D9' : 'rgba(36,30,26,0.2)',
                              }}
                            />
                          </button>
                        );
                      })}
                    </div>

                    {/* 16 Apothecary Lab Specimen Swatch Cards (horizontal scroll mobile / 2-col grid desktop) */}
                    <div className="flex lg:grid lg:grid-cols-2 gap-2 overflow-x-auto lg:overflow-y-auto lg:max-h-[250px] pb-1 no-scrollbar">
                      {SITE_CONFIG.palette.map((sw) => {
                        const active = currentFingerDesign.colorId === sw.id;
                        return (
                          <button
                            key={sw.id}
                            type="button"
                            onClick={() => handleSwatchSelect(sw.id)}
                            className="shrink-0 w-[138px] lg:w-auto text-left p-0 rounded-[2px] cursor-pointer flex items-stretch overflow-hidden transition-colors"
                            style={{
                              backgroundColor: active
                                ? 'rgba(167, 193, 217, 0.12)'
                                : '#F7F4EE',
                              border: active
                                ? '1px solid #241E1A'
                                : '1px solid rgba(36, 30, 26, 0.14)',
                            }}
                          >
                            <span
                              className="w-7 shrink-0 block relative"
                              style={{
                                backgroundColor: sw.hex,
                                borderRight: '1px solid rgba(36,30,26,0.1)',
                              }}
                            />
                            <span className="px-2.5 py-2 flex flex-col justify-center min-w-0">
                              <span
                                className="font-label text-[9px] leading-none"
                                style={{ color: '#8A8178' }}
                              >
                                {sw.code} · {sw.defaultFinish}
                              </span>
                              <span className="font-editorial text-[16px] leading-tight mt-0.5 text-[#241E1A] truncate">
                                {sw.name[lang]}
                              </span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 4: ART (French / Fine Line / Pearl / Studs + ring-finger shortcut) */}
                {activeTab === 'art' && (
                  <div className="space-y-4">
                    <div className="flex lg:grid lg:grid-cols-5 gap-1.5 overflow-x-auto no-scrollbar">
                      {SITE_CONFIG.artTypes.map((a) => {
                        const active = currentFingerDesign.art === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => handleArtSelect(a.id)}
                            className="shrink-0 px-2.5 py-2 rounded-[2px] cursor-pointer font-label transition-colors"
                            style={{
                              backgroundColor: active ? '#241E1A' : 'transparent',
                              color: active ? '#F2EEE8' : '#241E1A',
                              border: active
                                ? '1px solid #241E1A'
                                : '1px solid rgba(36,30,26,0.16)',
                            }}
                          >
                            {a.label[lang]}
                          </button>
                        );
                      })}
                    </div>

                    {/* French Tip fine controls */}
                    {currentFingerDesign.art === 'french' && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                          <label className="block">
                            <span className="font-label block mb-1.5" style={{ color: '#8A8178' }}>
                              {ui.frenchWidth[lang]} ·{' '}
                              {Math.round(currentFingerDesign.frenchWidth * 100)}%
                            </span>
                            <input
                              type="range"
                              min={8}
                              max={30}
                              value={Math.round(currentFingerDesign.frenchWidth * 100)}
                              onChange={(e) =>
                                updateFingers((f) => ({
                                  ...f,
                                  frenchWidth: Number(e.target.value) / 100,
                                }))
                              }
                              className="w-full accent-[#241E1A]"
                            />
                          </label>
                          <label className="block">
                            <span className="font-label block mb-1.5" style={{ color: '#8A8178' }}>
                              {ui.frenchCurve[lang]} ·{' '}
                              {Math.round(currentFingerDesign.frenchCurve * 100)}%
                            </span>
                            <input
                              type="range"
                              min={15}
                              max={85}
                              value={Math.round(currentFingerDesign.frenchCurve * 100)}
                              onChange={(e) =>
                                updateFingers((f) => ({
                                  ...f,
                                  frenchCurve: Number(e.target.value) / 100,
                                }))
                              }
                              className="w-full accent-[#241E1A]"
                            />
                          </label>
                        </div>

                        <div>
                          <span className="font-label block mb-2" style={{ color: '#8A8178' }}>
                            {ui.frenchColor[lang]}
                          </span>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {SITE_CONFIG.palette.map((sw) => {
                              const active = currentFingerDesign.frenchColorId === sw.id;
                              return (
                                <button
                                  key={sw.id}
                                  type="button"
                                  title={sw.name[lang]}
                                  onClick={() =>
                                    updateFingers((f) => ({ ...f, frenchColorId: sw.id }))
                                  }
                                  className="shrink-0 w-7 h-7 rounded-[2px] cursor-pointer p-0"
                                  style={{
                                    backgroundColor: sw.hex,
                                    border: active
                                      ? '2px solid #241E1A'
                                      : '1px solid rgba(36,30,26,0.2)',
                                  }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Fine Linework 4 presets */}
                    {currentFingerDesign.art === 'line' && (
                      <div className="grid grid-cols-4 gap-2 pt-1">
                        {SITE_CONFIG.linePatterns.map((lp) => {
                          const active = currentFingerDesign.linePattern === lp.id;
                          return (
                            <button
                              key={lp.id}
                              type="button"
                              onClick={() =>
                                updateFingers((f) => ({ ...f, linePattern: lp.id as LinePattern }))
                              }
                              className="py-2.5 px-2 rounded-[2px] cursor-pointer font-label"
                              style={{
                                backgroundColor: active
                                  ? 'rgba(167,193,217,0.16)'
                                  : 'transparent',
                                border: active
                                  ? '1px solid #A7C1D9'
                                  : '1px solid rgba(36,30,26,0.16)',
                                color: '#241E1A',
                              }}
                            >
                              {lp.label[lang]}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Pearl / Stud count selector */}
                    {(currentFingerDesign.art === 'pearl' ||
                      currentFingerDesign.art === 'stud') && (
                      <div className="flex items-center gap-3 pt-1">
                        <span className="font-label" style={{ color: '#8A8178' }}>
                          {ui.accentCount[lang]}
                        </span>
                        {([1, 2, 3] as const).map((cnt) => {
                          const active = currentFingerDesign.accentCount === cnt;
                          return (
                            <button
                              key={cnt}
                              type="button"
                              onClick={() =>
                                updateFingers((f) => ({ ...f, accentCount: cnt }))
                              }
                              className="w-9 h-9 rounded-[2px] cursor-pointer font-label"
                              style={{
                                backgroundColor: active ? '#241E1A' : 'transparent',
                                color: active ? '#F2EEE8' : '#241E1A',
                                border: '1px solid rgba(36,30,26,0.2)',
                              }}
                            >
                              {cnt}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Quick Ring-finger ワンポイント toggle */}
                    <div className="pt-2 hairline-t flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setSelectedFinger((c) => (c === 1 ? null : 1))}
                        className="bg-transparent border-0 p-0 cursor-pointer font-label flex items-center gap-2"
                        style={{ color: selectedFinger === 1 ? '#241E1A' : '#8A8178' }}
                      >
                        <span
                          className="inline-block w-2 h-2 rounded-full"
                          style={{
                            backgroundColor:
                              selectedFinger === 1 ? '#A7C1D9' : 'rgba(36,30,26,0.2)',
                          }}
                        />
                        <span>
                          {lang === 'ja'
                            ? '薬指だけワンポイント編集'
                            : 'Ring finger accent focus'}
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LIVE PRICING ESTIMATE + BOOK / CONSULT BRIDGE */}
            <div className="px-4 sm:px-6 lg:px-8 py-4 lg:py-5 hairline-t bg-[#F2EEE8]">
              <div className="flex items-baseline justify-between gap-4 mb-1">
                <div className="min-w-0">
                  <div className="font-label truncate" style={{ color: '#241E1A' }}>
                    {estimate.menuName[lang]}
                  </div>
                  <div className="font-label text-[10px] mt-0.5" style={{ color: '#8A8178' }}>
                    {estimate.estimatedMinutes} MIN · {ui.priceDisclaimer[lang]}
                  </div>
                </div>
                <div className="font-editorial text-[28px] sm:text-[32px] leading-none tabular-nums shrink-0 text-[#241E1A]">
                  {formatYen(estimate.estimatedYen)}
                </div>
              </div>

              <div className="mt-2.5 lg:mt-3.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onBookWithDesign}
                  className="py-3 lg:py-3.5 px-3 lg:px-4 rounded-[2px] border-0 cursor-pointer font-label flex items-center justify-center gap-2 lg:gap-3"
                  style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
                >
                  <span>{ui.bookDesign[lang]}</span>
                  <span
                    className="hidden sm:inline-block h-[1px] w-4"
                    style={{ backgroundColor: '#A7C1D9' }}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setConsultOpen((v) => !v)}
                  className="py-3 lg:py-3.5 px-3 lg:px-4 rounded-[2px] bg-transparent cursor-pointer font-label transition-colors hover:border-[#A7C1D9]"
                  style={{
                    color: '#241E1A',
                    border: '1px solid rgba(36, 30, 26, 0.28)',
                  }}
                >
                  {ui.consultFirst[lang]}
                </button>
              </div>

              {/* Inline quiet consultation panel (LINE OA + Instagram DM with auto-copy) */}
              {consultOpen && (
                <div
                  className="mt-3 p-3.5 rounded-[2px] space-y-2.5"
                  style={{
                    border: '1px solid rgba(36,30,26,0.16)',
                    backgroundColor: '#F7F4EE',
                  }}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={buildLineOaUrl(consultMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-[2px] text-center no-underline font-label"
                      style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
                    >
                      LINE
                    </a>
                    <button
                      type="button"
                      onClick={handleConsultInstagram}
                      className="py-2.5 px-3 rounded-[2px] bg-transparent cursor-pointer font-label"
                      style={{
                        color: '#241E1A',
                        border: '1px solid rgba(36,30,26,0.28)',
                      }}
                    >
                      Instagram DM
                    </button>
                  </div>
                  {igCopiedNotice && (
                    <div className="font-label text-[10px]" style={{ color: '#241E1A' }}>
                      {ui.igCopiedNotice[lang]}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
