import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { getDesignMeta, Lang, SITE_CONFIG } from '../config';
import { FingerMaskCalibration, NailDesignItem } from '../types/nail';
import { HandStage } from '../components/HandStage';
import { formatYen } from '../utils/designCodec';
import { exportDesignCardPng } from '../utils/exportDesignCard';
import { detectWebGLSupport, useNearViewport } from '../utils/webgl';

const VanityTrayCanvas = lazy(() =>
  import('../components/three/VanityTrayCanvas').then((m) => ({
    default: m.VanityTrayCanvas,
  }))
);

const STEP_ANGLE = (Math.PI * 2) / 12;

interface VanityTraySectionProps {
  lang: Lang;
  activeDesignId: string;
  onSelectDesign: (designId: string) => void;
  onConsultDesign: (designId: string) => void;
  onInspectDetail: (designId: string) => void;
  reducedMotion: boolean;
  calibrateMode?: boolean;
  calibrations?: FingerMaskCalibration[];
  onCalibrationsChange?: (next: FingerMaskCalibration[]) => void;
}

function normalizeIndex(raw: number, len: number): number {
  return ((raw % len) + len) % len;
}

/**
 * Section 02 — 指先の化粧台（くるくるパレット）
 * Upper stage: locked real feminine hand photo with 5-finger cuticle-to-tip brush-wipe gel swap
 *              and pointer/gyro reactive shimmer strictly inside nail masks.
 * Lower stage: true 3D mirrored circular vanity tray with 12 sculpted glass nail polish bottles.
 * Zero tabs, zero color-button grids, zero finger-selector bars.
 */
export const VanityTraySection: React.FC<VanityTraySectionProps> = ({
  lang,
  activeDesignId,
  onSelectDesign,
  onConsultDesign,
  onInspectDetail,
  reducedMotion,
  calibrateMode = false,
  calibrations,
  onCalibrationsChange,
}) => {
  const designs = SITE_CONFIG.designs;
  const sectionRef = useRef<HTMLElement | null>(null);
  const nearViewport = useNearViewport(sectionRef, '100% 0px');
  const webglOk = detectWebGLSupport();
  const use3D = webglOk && !reducedMotion;

  const activeIndex = Math.max(
    0,
    designs.findIndex((d) => d.id === activeDesignId)
  );
  const activeDesign: NailDesignItem = designs[activeIndex] || designs[0];
  const meta = getDesignMeta(activeDesign);

  // Retain previous design underneath the 5-finger brush wipe so switching never flashes bare nails
  const [prevDesign, setPrevDesign] = useState<NailDesignItem | null>(null);
  const [wipeKey, setWipeKey] = useState(0);
  const lastIdRef = useRef(activeDesign.id);

  useEffect(() => {
    if (lastIdRef.current !== activeDesign.id) {
      const prev = designs.find((d) => d.id === lastIdRef.current) || null;
      setPrevDesign(prev);
      lastIdRef.current = activeDesign.id;
      setWipeKey((k) => k + 1);
    }
  }, [activeDesign.id, designs]);

  // Preload adjacent hand variants so spinning bottles is instantaneously crisp
  useEffect(() => {
    const isSmall = typeof window !== 'undefined' && window.innerWidth < 768;
    const neighborIdxs = [
      normalizeIndex(activeIndex - 1, designs.length),
      normalizeIndex(activeIndex + 1, designs.length),
      normalizeIndex(activeIndex + 2, designs.length),
    ];
    neighborIdxs.forEach((idx) => {
      const img = new Image();
      const raw = designs[idx].handImage;
      img.src = `.${isSmall ? raw.replace(/\.webp$/, '-800.webp') : raw}`;
    });
  }, [activeIndex, designs]);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Continuous unwrapped tray rotation refs (shared at 60fps with Three.js VanityTrayCanvas)
  const rotationRef = useRef(-activeIndex * STEP_ANGLE);
  const targetRotationRef = useRef(-activeIndex * STEP_ANGLE);
  const isDraggingRef = useRef(false);

  // Smoothly spin tray via shortest circular path whenever activeIndex changes externally (e.g. from Tip Sample Book)
  useEffect(() => {
    if (isDraggingRef.current) return;
    const desiredMod = -activeIndex * STEP_ANGLE;
    const current = targetRotationRef.current;
    // Shortest angular delta modulo 2π
    let delta = ((desiredMod - current + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (delta < -Math.PI) delta += Math.PI * 2;
    targetRotationRef.current = current + delta;
  }, [activeIndex]);

  const selectByIndex = useCallback(
    (idx: number) => {
      const normalized = normalizeIndex(idx, designs.length);
      if (designs[normalized].id !== activeDesignId) {
        onSelectDesign(designs[normalized].id);
      }
    },
    [designs, activeDesignId, onSelectDesign]
  );

  // Tactile horizontal drag with inertia & magnetic detent snap
  const bindDrag = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx], memo }) => {
      const startAngle = typeof memo === 'number' ? memo : rotationRef.current;
      isDraggingRef.current = active;

      const sensitivity = isMobile ? 0.0088 : 0.0064;
      const nextAngle = startAngle + mx * sensitivity;

      if (active) {
        rotationRef.current = nextAngle;
        targetRotationRef.current = nextAngle;
        // Live update active manicure as each bottle passes front-center!
        const liveSlot = Math.round(-nextAngle / STEP_ANGLE);
        selectByIndex(liveSlot);
      } else {
        // Momentum throw + automatic snap onto nearest of the 12 bottles
        const throwRad = vx * dx * (isMobile ? 0.52 : 0.45);
        const projected = nextAngle + Math.max(-STEP_ANGLE * 3, Math.min(STEP_ANGLE * 3, throwRad));
        const snappedSlot = Math.round(-projected / STEP_ANGLE);
        targetRotationRef.current = -snappedSlot * STEP_ANGLE;
        selectByIndex(snappedSlot);
      }
      return startAngle;
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  // Save PNG card feedback
  const [savingCard, setSavingCard] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveImage = async () => {
    if (savingCard) return;
    setSavingCard(true);
    try {
      await exportDesignCardPng(activeDesign, lang);
      setSavedNotice(true);
      window.setTimeout(() => setSavedNotice(false), 2200);
    } finally {
      setSavingCard(false);
    }
  };

  return (
    <section
      id="vanity"
      ref={sectionRef}
      aria-label={SITE_CONFIG.vanityUI.eyebrow[lang]}
      className="relative w-full min-h-[100svh] flex flex-col justify-between pt-[60px] pb-4 sm:pb-6"
      style={{
        background:
          'linear-gradient(180deg, #F7F1EE 0%, #F4EAE5 55%, #EFE3DE 100%)',
      }}
    >
      {/* 1. Upper Hand Showcase — Always visible while rotating bottles! */}
      <div className="w-full max-w-[920px] mx-auto px-4 sm:px-8 pt-1.5 sm:pt-3">
        <div
          className="relative w-full h-[40svh] sm:h-[41svh] max-h-[385px] min-h-[230px] rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(199, 169, 127, 0.28)',
            backgroundColor: '#EFE3DE',
          }}
        >
          <HandStage
            design={activeDesign}
            prevDesign={prevDesign}
            wipeKey={wipeKey}
            calibrateMode={calibrateMode}
            calibrations={calibrations}
            onCalibrationsChange={onCalibrationsChange}
            showImageTag
          />

          {/* Subtle shimmer hint strictly for reactive finishes (magnet / aurora / mirror) */}
          {activeDesign.opticalEffect !== 'none' && (
            <span
              className="pointer-events-none absolute top-3 left-3.5 text-[10.5px] tracking-[0.1em] px-2.5 py-1 rounded-full"
              style={{
                color: '#7E6B6C',
                backgroundColor: 'rgba(247, 241, 238, 0.78)',
              }}
            >
              {SITE_CONFIG.vanityUI.shimmerCue[lang]}
            </span>
          )}
        </div>
      </div>

      {/* 2. Quiet Editorial Readout Strip (Design Number + Verbatim JP Name + Price/Time) */}
      <div className="w-full max-w-[960px] mx-auto px-6 sm:px-8 pt-3.5 sm:pt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 text-[12px]">
            <span className="font-num text-[#C7A97F]">No.{activeDesign.number}</span>
            <span className="w-3 h-[1px] bg-[#C7A97F]/50" />
            <span className="text-[#7E6B6C] tracking-[0.1em] text-[11.5px]">
              {meta.label[lang]}
            </span>
          </div>
          <h2
            className="m-0 mt-0.5 font-mincho jp-heading text-[19px] sm:text-[24px] tracking-[0.08em] text-[#3B2B2C] truncate"
          >
            {activeDesign.name.ja}
          </h2>
          {lang === 'en' && (
            <p className="m-0 font-garamond italic text-[14px] text-[#7E6B6C] leading-snug">
              {activeDesign.name.en}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <div className="font-num text-[14px] sm:text-[15px] text-[#3B2B2C]">
            {formatYen(meta.priceYen)}
          </div>
          <div className="text-[11px] tracking-[0.08em] text-[#7E6B6C]">
            {lang === 'ja' ? `目安 ${meta.durationMin}分` : `Est. ${meta.durationMin} min`}
          </div>
        </div>
      </div>

      {/* 3. Lower 3D Mirrored Circular Vanity Tray (12 Sculpted Glass Polish Bottles) */}
      <div
        {...bindDrag()}
        role="slider"
        tabIndex={0}
        aria-label={
          lang === 'ja'
            ? '甲油ボトルのトレイを左右に回してデザインを選ぶ'
            : 'Rotate the vanity tray to switch nail polish designs'
        }
        aria-valuemin={1}
        aria-valuemax={designs.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={`No.${activeDesign.number} ${activeDesign.name.ja}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            selectByIndex(activeIndex + 1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            selectByIndex(activeIndex - 1);
          }
        }}
        className="relative w-full h-[30svh] sm:h-[31svh] min-h-[210px] max-h-[285px] cursor-grab active:cursor-grabbing outline-none"
        style={{ touchAction: 'pan-y' }}
      >
        {use3D && nearViewport ? (
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center">
                <span className="font-garamond italic text-[14px] text-[#7E6B6C] tracking-[0.12em]">
                  {SITE_CONFIG.vanityUI.dragCue[lang]}
                </span>
              </div>
            }
          >
            <VanityTrayCanvas
              designs={designs}
              activeIndex={activeIndex}
              onSelectIndex={selectByIndex}
              rotationRef={rotationRef}
              targetRotationRef={targetRotationRef}
              isDraggingRef={isDraggingRef}
              isMobile={isMobile}
            />
          </Suspense>
        ) : (
          /* Graceful 2D tactile bottle carousel fallback (no WebGL or prefers-reduced-motion) */
          <div className="w-full h-full flex items-center justify-center overflow-hidden px-4">
            <div className="flex items-end gap-4 sm:gap-6">
              {[-2, -1, 0, 1, 2].map((offset) => {
                const idx = normalizeIndex(activeIndex + offset, designs.length);
                const d = designs[idx];
                const isCenter = offset === 0;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => selectByIndex(idx)}
                    className="bg-transparent border-0 p-0 cursor-pointer flex flex-col items-center transition-transform duration-300"
                    style={{
                      transform: isCenter
                        ? 'translateY(-10px) scale(1.08)'
                        : `scale(${1 - Math.abs(offset) * 0.1})`,
                      opacity: isCenter ? 1 : 0.65 - Math.abs(offset) * 0.14,
                    }}
                  >
                    <span
                      className="w-4 h-7 rounded-t-sm block mb-0.5"
                      style={{ backgroundColor: '#C7A97F' }}
                    />
                    <span
                      className="w-11 h-16 rounded-lg block relative overflow-hidden"
                      style={{
                        backgroundColor: d.liquidHex,
                        border: '2px solid rgba(255,255,255,0.75)',
                      }}
                    >
                      <span className="absolute inset-x-1 top-4 py-1 bg-[#FBF7F4]/92 text-[8px] font-num text-[#3B2B2C] block text-center">
                        {d.number}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quiet drag affordance indicator (center bottom of tray) */}
        <div className="pointer-events-none absolute bottom-1 inset-x-0 flex items-center justify-center gap-3 text-[10.5px] tracking-[0.16em] text-[#7E6B6C]/80">
          <span className="w-5 h-[1px] bg-[#C7A97F]/60" />
          <span>{SITE_CONFIG.vanityUI.dragCue[lang]}</span>
          <span className="w-5 h-[1px] bg-[#C7A97F]/60" />
        </div>
      </div>

      {/* 4. Corner Action Bar — STRICTLY the 3 required minimal text links */}
      <div className="w-full max-w-[960px] mx-auto px-5 sm:px-8 pt-2 pb-[env(safe-area-inset-bottom)] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onConsultDesign(activeDesign.id)}
          className="bg-transparent border-0 p-1 text-[12.5px] sm:text-[13px] tracking-[0.1em] font-body cursor-pointer transition-colors duration-300 hover:opacity-75"
          style={{
            color: '#3B2B2C',
            borderBottom: '1px solid #C9989A',
          }}
        >
          {SITE_CONFIG.vanityUI.consultThis[lang]}
        </button>

        <div className="flex items-center gap-5 sm:gap-7">
          <button
            type="button"
            onClick={handleSaveImage}
            disabled={savingCard}
            className="bg-transparent border-0 p-1 text-[12px] sm:text-[13px] tracking-[0.1em] font-body cursor-pointer transition-colors duration-300 hover:text-[#3B2B2C]"
            style={{ color: savedNotice ? '#C9989A' : '#7E6B6C' }}
          >
            {savedNotice
              ? SITE_CONFIG.vanityUI.savedNotice[lang]
              : SITE_CONFIG.vanityUI.saveImage[lang]}
          </button>

          <button
            type="button"
            onClick={() => onInspectDetail(activeDesign.id)}
            className="bg-transparent border-0 p-1 text-[12px] sm:text-[13px] tracking-[0.1em] font-body cursor-pointer transition-colors duration-300 hover:text-[#3B2B2C]"
            style={{ color: '#7E6B6C' }}
          >
            {SITE_CONFIG.vanityUI.viewDetail[lang]}
          </button>
        </div>
      </div>
    </section>
  );
};
