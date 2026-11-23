import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Lenis from 'lenis';
import {
  buildPresetCardSpec,
  buildSelfCardSpec,
  getDesignById,
  Lang,
  SITE_CONFIG,
} from './config';
import { BottleCarousel } from './components/BottleCarousel';
import { DesignCardOverlay } from './components/DesignCardOverlay';
import { Header } from './components/Header';
import { PhotorealHandCompositor } from './components/PhotorealHandCompositor';
import { SelfDesignStage } from './components/SelfDesignStage';
import { FooterSection } from './sections/FooterSection';
import { SalonSection } from './sections/SalonSection';
import { ActiveCardSpec, NailDesignItem, SelfSelection, VideoManifest } from './types/nail';
import { resolveAssetUrl } from './utils/assetUrl';
import { decodeCardFromQuery } from './utils/designCodec';

const DEFAULT_SELF: SelfSelection = {
  shape: 'oval',
  length: 'short',
  colorId: 'c03',
  technique: 'onecolor',
  accent: 'none',
};

export const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ja');
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  // Scroll progress across the continuous Shot 1 -> Shot 5 track (0 = Shot 1 flower, 0..0.78 = Shots 2-4, 0.78..1 = Shot 5 bottles)
  const trackRef = useRef<HTMLDivElement | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const [scrollP, setScrollP] = useState(0);

  // Automatic video probing (switches to video mode with zero code edits when public/media/v4/video/{a,b,c}.mp4 exist)
  const [videoManifest, setVideoManifest] = useState<VideoManifest>({
    a: false,
    b: false,
    c: false,
    loop: false,
  });
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);
  const videoCRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    fetch(resolveAssetUrl('/media/v4/video/manifest.json'))
      .then((r) => (r.ok ? r.json() : null))
      .then((data: VideoManifest | null) => {
        if (data && typeof data.a === 'boolean') setVideoManifest(data);
      })
      .catch(() => {});
  }, []);

  // Stage interaction state (preset bottles vs self-design vs design card)
  const [stageMode, setStageMode] = useState<'preset' | 'self'>('preset');
  const [activeBottleIdx, setActiveBottleIdx] = useState<number>(1); // '02' くすみピンク matches the melted petals!
  const [prevPreset, setPrevPreset] = useState<NailDesignItem | null>(null);
  const [wipeKey, setWipeKey] = useState<number>(0);
  const [sheenKey, setSheenKey] = useState<number>(0);
  const [cameraZoom, setCameraZoom] = useState<number>(1);

  const [selfStep, setSelfStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const [selfSelection, setSelfSelection] = useState<SelfSelection>(DEFAULT_SELF);
  const [selfCompositeUrl, setSelfCompositeUrl] = useState<string | null>(null);

  const [cardOpen, setCardOpen] = useState<boolean>(false);

  // Restore shared card URL (?d=...) cleanly if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('d');
    if (!encoded) return;
    const decoded = decodeCardFromQuery(encoded);
    if (!decoded) return;
    if (decoded.mode === 'self' && decoded.selfSelection) {
      setStageMode('self');
      setSelfSelection(decoded.selfSelection);
      setSelfStep(4);
    } else if (decoded.presetId) {
      const idx = SITE_CONFIG.designs.findIndex((d) => d.id === decoded.presetId);
      if (idx >= 0) setActiveBottleIdx(idx);
    }
    window.setTimeout(() => {
      const track = trackRef.current;
      if (track) {
        window.scrollTo({ top: track.offsetHeight - window.innerHeight, behavior: 'instant' as ScrollBehavior });
      }
      setCardOpen(true);
    }, 120);
  }, []);

  // Smooth Lenis inertia + scroll progress driver
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 768);
      setVp({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', onResize);

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const updateScroll = () => {
      const el = trackRef.current;
      if (el) {
        const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
        const p = Math.max(0, Math.min(1, window.scrollY / scrollable));
        setScrollP(p);
      }
    };

    const raf = (time: number) => {
      lenis.raf(time);
      updateScroll();
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);
    window.addEventListener('scroll', updateScroll, { passive: true });
    updateScroll();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('resize', onResize);
      lenis.destroy();
    };
  }, []);

  // Normalized sub-timelines across scrollP [0 .. 1]:
  // [0.00 .. 0.44]: Shots 1–2 (Continuous master camera pan from flower down to exact hand plate coordinates)
  // [0.44 .. 0.54]: Shot 3 (5 real kusumi-pink ranunculus petals rest strictly on the 5 stationary nails)
  // [0.54 .. 0.70]: Shot 4 (Petals melt from cuticle to tip into glossy 02 gel + light sweep + "花びらが、指先に。")
  // [0.80 .. 1.00]: Shot 5 (12 realistic bottles rise in foreground shallow depth of field!)
  const descentP = Math.max(0, Math.min(1, scrollP / 0.44)); // 0 (top flower) -> 1 (pixel-locked arrival at hand!)
  const meltP =
    scrollP < 0.54 ? 0 : scrollP >= 0.70 ? 1 : (scrollP - 0.54) / 0.16;
  const shot4TextVisible = scrollP >= 0.66 && scrollP < 0.82 && !cardOpen;
  const stageInteractiveVisible = scrollP >= 0.80;

  // Trigger subtle light sheen when Shot 4 finishes melting petals into gel
  const prevMeltCompleteRef = useRef(false);
  useEffect(() => {
    const complete = meltP >= 0.99;
    if (complete && !prevMeltCompleteRef.current) {
      setSheenKey((k) => k + 1);
    }
    prevMeltCompleteRef.current = complete;
  }, [meltP]);

  // Scrub videos A / B / C automatically when video files exist in public/media/v4/video/
  const hasFullVideoTriplet = videoManifest.a && videoManifest.b && videoManifest.c;
  useEffect(() => {
    if (!hasFullVideoTriplet) return;
    const seek = (vid: HTMLVideoElement | null, norm: number) => {
      if (!vid || !Number.isFinite(vid.duration) || vid.duration <= 0) return;
      const target = Math.max(0, Math.min(vid.duration - 0.02, norm * vid.duration));
      if (Math.abs(vid.currentTime - target) > 0.04) {
        vid.currentTime = target;
      }
    };
    if (scrollP <= 0.30) {
      seek(videoARef.current, scrollP / 0.30);
    } else if (scrollP <= 0.54) {
      seek(videoBRef.current, (scrollP - 0.30) / 0.24);
    } else if (scrollP <= 0.74) {
      seek(videoCRef.current, (scrollP - 0.54) / 0.20);
    }
  }, [scrollP, hasFullVideoTriplet]);

  const scrollToFraction = useCallback((frac: number) => {
    const el = trackRef.current;
    if (!el) return;
    const targetY = Math.round((el.offsetHeight - window.innerHeight) * frac);
    if (lenisRef.current) {
      lenisRef.current.scrollTo(targetY, { duration: 1.35 });
    } else {
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  }, []);

  const activePresetDesign = useMemo(
    () =>
      SITE_CONFIG.designs[
        Math.max(0, Math.min(SITE_CONFIG.designs.length - 1, activeBottleIdx))
      ],
    [activeBottleIdx]
  );

  const handleSelectBottle = useCallback(
    (idx: number) => {
      setCardOpen(false);
      if (idx === SITE_CONFIG.designs.length) {
        // 13th bottle = empty clear glass bottle -> enter セルフデザイン seamlessly on the same hand!
        setStageMode('self');
        setSelfStep(0);
        setCameraZoom(1.13);
        setSheenKey((k) => k + 1);
        return;
      }
      setStageMode('preset');
      setCameraZoom(1);
      if (idx !== activeBottleIdx) {
        setPrevPreset(activePresetDesign);
        setActiveBottleIdx(idx);
        setWipeKey((k) => k + 1);
        window.setTimeout(() => setSheenKey((k) => k + 1), 380);
      }
    },
    [activeBottleIdx, activePresetDesign]
  );

  const handleOpenPresetCard = useCallback((design: NailDesignItem) => {
    const idx = SITE_CONFIG.designs.findIndex((d) => d.id === design.id);
    if (idx >= 0) setActiveBottleIdx(idx);
    setStageMode('preset');
    // Gentle camera push-in to admire nails, then settle into Design Card framing
    setCameraZoom(1.22);
    setSheenKey((k) => k + 1);
    window.setTimeout(() => {
      setCameraZoom(1.04);
      setCardOpen(true);
    }, 420);
  }, []);

  const handleUpdateSelf = useCallback(
    (next: SelfSelection, autoAdvanceToCard = false) => {
      setSelfSelection(next);
      setSheenKey((k) => k + 1);
      if (autoAdvanceToCard) {
        // Seal bottle -> gently zoom out -> slide Design Card onto the table!
        setCameraZoom(1.03);
        window.setTimeout(() => setCardOpen(true), 420);
      } else {
        setCameraZoom(1.16);
      }
    },
    []
  );

  const handleStepChange = useCallback((step: 0 | 1 | 2 | 3 | 4) => {
    setCardOpen(false);
    setSelfStep(step);
    setCameraZoom(step >= 2 ? 1.18 : 1.13);
  }, []);

  const handleHeaderNavigate = useCallback(
    (target: 'vanity' | 'self' | 'salon' | 'card') => {
      if (target === 'salon') {
        const salonEl = document.getElementById('salon');
        salonEl?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      scrollToFraction(0.95);
      if (target === 'vanity') {
        setCardOpen(false);
        setStageMode('preset');
        setCameraZoom(1);
      } else if (target === 'self') {
        setCardOpen(false);
        setStageMode('self');
        setSelfStep(0);
        setCameraZoom(1.13);
      } else if (target === 'card') {
        setCameraZoom(1.04);
        setCardOpen(true);
      }
    },
    [scrollToFraction]
  );

  const activeCardSpec: ActiveCardSpec = useMemo(
    () =>
      stageMode === 'self'
        ? buildSelfCardSpec(selfSelection)
        : buildPresetCardSpec(activePresetDesign),
    [stageMode, selfSelection, activePresetDesign]
  );

  const sizeTier = isMobile ? '900' : '1600';
  const masterUrl = resolveAssetUrl(`/media/v4/web/master-${sizeTier}.webp`);
  const flowerUrl = resolveAssetUrl(`/media/v4/web/flower-${sizeTier}.webp`);
  const midPetalsUrl = resolveAssetUrl(`/media/v4/web/mid-petals-${sizeTier}.webp`);

  // Subpixel-exact camera rig matching master.jpg (1376x2344) bottom 768px 1:1 to PhotorealHandCompositor (1376x768)
  const masterRig = useMemo(() => {
    const aspect = vp.w / Math.max(1, vp.h);
    const refW = 1376;
    const refH = 768;
    const masterH = 2344;
    if (aspect < 0.88) {
      const targetW = Math.min(refW, Math.max(540, Math.round(refH * aspect)));
      const targetX = Math.max(0, Math.min(refW - targetW, Math.round(795 - targetW * 0.52)));
      const sc = Math.max(vp.w / targetW, vp.h / refH);
      const startLeft = vp.w / 2 - 675 * sc;
      const endLeft = vp.w / 2 - (targetX + targetW / 2) * sc;
      const startTop = (vp.h - refH * sc) / 2;
      const endTop = startTop - (masterH - refH) * sc;
      return {
        w: refW * sc,
        h: masterH * sc,
        frameH: refH * sc,
        left: startLeft + (endLeft - startLeft) * descentP,
        top: startTop + (endTop - startTop) * descentP,
        midTop: startTop + (endTop - startTop) * 0.5,
      };
    }
    const sc = Math.max(vp.w / refW, vp.h / refH);
    const left = (vp.w - refW * sc) / 2;
    const startTop = (vp.h - refH * sc) / 2;
    const endTop = startTop - (masterH - refH) * sc;
    return {
      w: refW * sc,
      h: masterH * sc,
      frameH: refH * sc,
      left,
      top: startTop + (endTop - startTop) * descentP,
      midTop: startTop + (endTop - startTop) * 0.5,
    };
  }, [vp.w, vp.h, descentP]);

  // Opacity of mid-petals overlay as camera passes the middle of master (descentP around 0.45..0.68)
  const midPetalsOpacity =
    descentP < 0.25
      ? 0
      : descentP < 0.50
        ? (descentP - 0.25) / 0.25
        : descentP < 0.78
          ? 1 - (descentP - 0.50) / 0.28
          : 0;

  return (
    <div id="top" className="min-h-screen w-full" style={{ backgroundColor: '#F7F1EE' }}>
      <Header lang={lang} onLangChange={setLang} onNavigate={handleHeaderNavigate} />

      {/* Continuous Single-Shot Scroll Track (Shots 1 -> 8) */}
      <div ref={trackRef} className="relative w-full h-[460vh]">
        <div className="sticky top-0 w-full h-[100dvh] overflow-hidden">
          {/* LAYER A: Shots 1–3 Continuous Downward Camera Pan (Video A/B/C when present, otherwise Subpixel-Locked Master Pan) */}
          {scrollP < 0.50 && (
            <div
              className="absolute inset-0 z-10 overflow-hidden"
              style={{
                opacity: scrollP < 0.44 ? 1 : Math.max(0, 1 - (scrollP - 0.44) / 0.05),
              }}
            >
              {hasFullVideoTriplet ? (
                <>
                  <video
                    ref={videoARef}
                    src={resolveAssetUrl('/media/v4/video/a.mp4')}
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: scrollP <= 0.26 ? 1 : 0 }}
                  />
                  <video
                    ref={videoBRef}
                    src={resolveAssetUrl('/media/v4/video/b.mp4')}
                    muted
                    playsInline
                    preload="auto"
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ opacity: scrollP > 0.26 && scrollP <= 0.50 ? 1 : 0 }}
                  />
                </>
              ) : (
                <div
                  className={`absolute inset-0 w-full h-full ${scrollP < 0.02 ? 'animate-soft-breathe' : ''}`}
                >
                  {/* Seamless vertical master pan arriving at descentP=1 with 0.00px offset from PhotorealHandCompositor! */}
                  <img
                    src={masterUrl}
                    alt={SITE_CONFIG.brandName}
                    fetchPriority="high"
                    className="absolute max-w-none block will-change-transform"
                    style={{
                      width: `${masterRig.w.toFixed(2)}px`,
                      height: `${masterRig.h.toFixed(2)}px`,
                      transform: `translate3d(${masterRig.left.toFixed(2)}px, ${masterRig.top.toFixed(2)}px, 0)`,
                    }}
                  />

                  {/* Crisp LCP opening flower layer at scrollP == 0 */}
                  {descentP < 0.08 && (
                    <img
                      src={flowerUrl}
                      alt=""
                      aria-hidden="true"
                      fetchPriority="high"
                      className="absolute max-w-none block pointer-events-none"
                      style={{
                        width: `${masterRig.w.toFixed(2)}px`,
                        height: `${masterRig.frameH.toFixed(2)}px`,
                        transform: `translate3d(${masterRig.left.toFixed(2)}px, ${masterRig.top.toFixed(2)}px, 0)`,
                        opacity: Math.max(0, 1 - descentP / 0.08),
                      }}
                    />
                  )}

                  {/* Mid-air drifting dusty-rose ranunculus petals anchored to the middle of master.jpg! */}
                  {midPetalsOpacity > 0.01 && (
                    <img
                      src={midPetalsUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute max-w-none block pointer-events-none"
                      style={{
                        width: `${masterRig.w.toFixed(2)}px`,
                        height: `${masterRig.frameH.toFixed(2)}px`,
                        transform: `translate3d(${masterRig.left.toFixed(2)}px, ${(masterRig.top + (masterRig.h - masterRig.frameH) * 0.5).toFixed(2)}px, 0)`,
                        opacity: midPetalsOpacity * 0.94,
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Optional Video C overlay when user drops c.mp4 into public/media/v4/video/ */}
          {hasFullVideoTriplet && scrollP >= 0.50 && scrollP <= 0.72 && (
            <video
              ref={videoCRef}
              src={resolveAssetUrl('/media/v4/video/c.mp4')}
              muted
              playsInline
              preload="auto"
              className="absolute inset-0 z-15 w-full h-full object-cover pointer-events-none"
            />
          )}

          {/* LAYER B: Unified Photorealistic Hand Stage (Shot 3 arrival -> Shot 4 petal melt -> Shot 5 bottles -> Shot 6 self-design -> Shot 7 card) */}
          <div
            className="absolute inset-0 z-9"
            style={{
              opacity: scrollP >= 0.42 ? 1 : 0,
            }}
          >
            <PhotorealHandCompositor
              mode={stageInteractiveVisible ? stageMode : 'preset'}
              presetDesign={stageInteractiveVisible ? activePresetDesign : getDesignById('02')}
              prevPresetDesign={stageInteractiveVisible ? prevPreset : null}
              wipeKey={wipeKey}
              petalMeltProgress={stageInteractiveVisible ? 1 : meltP}
              sheenKey={sheenKey}
              selfSelection={selfSelection}
              cameraZoom={stageInteractiveVisible ? cameraZoom : 1}
              cardOpenOnTable={cardOpen}
              ambientNailHex={activeCardSpec.swatchHex}
              showImageTag={scrollP >= 0.56}
              onTapNails={
                stageInteractiveVisible && !cardOpen
                  ? () => {
                      if (stageMode === 'preset') {
                        handleOpenPresetCard(activePresetDesign);
                      } else {
                        setCardOpen(true);
                      }
                    }
                  : undefined
              }
              onSelfCompositeReady={setSelfCompositeUrl}
            />
          </div>

          {/* Shot 1 Poetic Line ("ひらいてみてください。") */}
          <div
            className="absolute inset-x-0 bottom-12 sm:bottom-16 z-20 flex justify-center px-6 transition-opacity duration-500"
            style={{
              opacity: scrollP < 0.08 ? 1 - scrollP / 0.08 : 0,
              pointerEvents: scrollP < 0.08 ? 'auto' : 'none',
            }}
          >
            <button
              type="button"
              onClick={() => scrollToFraction(0.72)}
              className="bg-transparent border-0 py-2 px-5 cursor-pointer font-mincho text-[15px] sm:text-[17px] tracking-[0.18em] text-[#3B2B2C]/85 hover:text-[#3B2B2C] transition-colors"
            >
              {SITE_CONFIG.poetry.opening[lang]}
            </button>
          </div>

          {/* Shot 4 Poetic Line ("花びらが、指先に。" + Primary Action "ネイルを選ぶ") */}
          <div
            className="absolute inset-x-0 bottom-11 sm:bottom-14 z-20 flex flex-col items-center gap-3.5 px-6 transition-all duration-500"
            style={{
              opacity: shot4TextVisible ? 1 : 0,
              transform: shot4TextVisible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 10px, 0)',
              pointerEvents: shot4TextVisible ? 'auto' : 'none',
            }}
          >
            <p className="m-0 font-mincho text-[18px] sm:text-[22px] tracking-[0.14em] text-[#3B2B2C]">
              {SITE_CONFIG.poetry.landed[lang]}
            </p>
            <button
              type="button"
              onClick={() => scrollToFraction(0.95)}
              className="paper-grain px-6 py-2 rounded-full font-mincho text-[12.5px] tracking-[0.16em] text-[#3B2B2C] hover:text-[#C9989A] cursor-pointer transition-colors"
              style={{
                backgroundColor: 'rgba(251, 248, 244, 0.74)',
                border: '1px solid rgba(199, 169, 127, 0.38)',
              }}
            >
              {SITE_CONFIG.poetry.primaryAction[lang]}
            </button>
          </div>

          {/* Shot 5 · Curated 12 Polish Bottles (+ 13th Clear Self-Design Bottle) */}
          <BottleCarousel
            visible={stageInteractiveVisible && stageMode === 'preset' && !cardOpen}
            activeIndex={activeBottleIdx}
            lang={lang}
            onSelectIndex={handleSelectBottle}
            onOpenCardForPreset={handleOpenPresetCard}
          />

          {/* Shot 6 · セルフデザイン (Empty Bottle Filling Layer-by-Layer + Tactile Option Rails) */}
          <SelfDesignStage
            visible={stageInteractiveVisible && stageMode === 'self' && !cardOpen}
            step={selfStep}
            selection={selfSelection}
            lang={lang}
            onStepChange={handleStepChange}
            onUpdateSelection={handleUpdateSelf}
            onBackToPresets={() => {
              setStageMode('preset');
              setCameraZoom(1);
            }}
          />

          {/* Shots 7 & 8 · Design Card + Post-Card オーダーメイド Invitation */}
          <DesignCardOverlay
            open={cardOpen}
            spec={activeCardSpec}
            lang={lang}
            selfCompositeDataUrl={selfCompositeUrl}
            onClose={() => {
              setCardOpen(false);
              setCameraZoom(stageMode === 'self' ? 1.14 : 1);
            }}
          />
        </div>
      </div>

      {/* Brief Hands-Only Salon Glimpse & Ultra-Thin Footer */}
      <SalonSection />
      <FooterSection lang={lang} />
    </div>
  );
};

export default App;
