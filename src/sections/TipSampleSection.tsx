import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useDrag } from '@use-gesture/react';
import { getDesignMeta, Lang, SITE_CONFIG } from '../config';
import { NailCategoryId, NailDesignItem } from '../types/nail';
import { formatYen } from '../utils/designCodec';
import { resolveAssetUrl } from '../utils/assetUrl';
import { detectWebGLSupport, useNearViewport } from '../utils/webgl';

const TipSampleCanvas = lazy(() =>
  import('../components/three/TipSampleCanvas').then((m) => ({
    default: m.TipSampleCanvas,
  }))
);

const STEP_ANGLE = (Math.PI * 2) / 12;

interface TipSampleSectionProps {
  lang: Lang;
  /** External jump request from Vanity 「詳しく見る」 */
  externalInspectId: string | null;
  onClearExternalInspect: () => void;
  onTryOnVanity: (designId: string) => void;
  onConsultDesign: (designId: string) => void;
  reducedMotion: boolean;
}

function normalizeIdx(raw: number, len: number): number {
  return ((raw % len) + len) % len;
}

const ORDERED_CATEGORIES: NailCategoryId[] = [
  'one-color',
  'french',
  'magnet',
  'nuance',
  'aurora',
  'parts',
  'gradation',
];

/**
 * Section 03 — ネイルチップ見本（3D Sample Ring）
 * Exactly 12 sculpted curved gel tips matching the 12 Vanity looks 1-to-1.
 * Includes a single-row scrollable category strip, tap-to-inspect glossy 3D rotation,
 * and an expandable plain-text salon menu (「一覧で見る」) for SEO / GEO & quick scanning.
 */
export const TipSampleSection: React.FC<TipSampleSectionProps> = ({
  lang,
  externalInspectId,
  onClearExternalInspect,
  onTryOnVanity,
  onConsultDesign,
  reducedMotion,
}) => {
  const designs = SITE_CONFIG.designs;
  const sectionRef = useRef<HTMLElement | null>(null);
  const nearViewport = useNearViewport(sectionRef, '100% 0px');
  const webglOk = detectWebGLSupport();
  const use3D = webglOk && !reducedMotion;

  const [focusedIndex, setFocusedIndex] = useState(0);
  const [inspectedId, setInspectedId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Rotate shortest circular arc to focusedIndex
  const spinToIndex = useCallback((idx: number) => {
    const norm = normalizeIdx(idx, designs.length);
    setFocusedIndex(norm);
    const desiredMod = -norm * STEP_ANGLE;
    const curr = targetRotationRef.current;
    let delta = ((desiredMod - curr + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (delta < -Math.PI) delta += Math.PI * 2;
    targetRotationRef.current = curr + delta;
  }, [designs.length]);

  // Honor jump from Vanity 「詳しく見る」
  useEffect(() => {
    if (!externalInspectId) return;
    const idx = designs.findIndex((d) => d.id === externalInspectId);
    if (idx >= 0) {
      spinToIndex(idx);
      setInspectedId(externalInspectId);
    }
    onClearExternalInspect();
  }, [externalInspectId, designs, spinToIndex, onClearExternalInspect]);

  const focusedDesign: NailDesignItem = designs[focusedIndex] || designs[0];
  const activeDetailDesign: NailDesignItem | null = inspectedId
    ? designs.find((d) => d.id === inspectedId) || null
    : null;

  const displayDesign = activeDetailDesign || focusedDesign;
  const displayMeta = getDesignMeta(displayDesign);

  // Horizontal drag to rotate the 12-tip ring
  const bindDrag = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx], memo }) => {
      const startAngle = typeof memo === 'number' ? memo : rotationRef.current;
      isDraggingRef.current = active;

      const sensitivity = isMobile ? 0.0085 : 0.006;
      const nextAngle = startAngle + mx * sensitivity;

      if (active) {
        rotationRef.current = nextAngle;
        targetRotationRef.current = nextAngle;
        const liveSlot = normalizeIdx(Math.round(-nextAngle / STEP_ANGLE), designs.length);
        setFocusedIndex(liveSlot);
        if (Math.abs(mx) > 14 && inspectedId) {
          setInspectedId(null);
        }
      } else {
        const throwRad = vx * dx * 0.45;
        const projected = nextAngle + Math.max(-STEP_ANGLE * 3, Math.min(STEP_ANGLE * 3, throwRad));
        const snapped = Math.round(-projected / STEP_ANGLE);
        targetRotationRef.current = -snapped * STEP_ANGLE;
        setFocusedIndex(normalizeIdx(snapped, designs.length));
      }
      return startAngle;
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  // Category strip rotates directly to the first design in that category
  const handleCategoryJump = (catId: NailCategoryId) => {
    const idx = designs.findIndex((d) => d.categoryId === catId);
    if (idx >= 0) {
      setInspectedId(null);
      spinToIndex(idx);
    }
  };

  return (
    <section
      id="tips"
      ref={sectionRef}
      aria-label={SITE_CONFIG.tipsUI.eyebrow[lang]}
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16"
      style={{ backgroundColor: '#F7F1EE' }}
    >
      <div className="max-w-[1080px] mx-auto">
        {/* Quiet Section Heading */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="m-0 font-num text-[12px] text-[#C7A97F]">
              {SITE_CONFIG.tipsUI.eyebrow[lang]}
            </p>
            <h2
              className="m-0 font-mincho jp-heading text-[24px] sm:text-[32px] tracking-[0.12em] text-[#3B2B2C]"
            >
              {SITE_CONFIG.tipsUI.heading[lang]}
            </h2>
          </div>

          <span className="font-num text-[12px] text-[#7E6B6C]">
            12 {lang === 'ja' ? 'デザイン・イメージ' : 'Salon Gel Tips · Image'}
          </span>
        </div>

        {/* Single-row Horizontally Scrollable Category Line (no cluttered filter button grid) */}
        <div
          className="mt-8 flex items-center gap-6 overflow-x-auto no-scrollbar pb-2"
          style={{ borderBottom: '1px solid rgba(59, 43, 44, 0.08)' }}
        >
          {ORDERED_CATEGORIES.map((catId) => {
            const cat = SITE_CONFIG.menuCategories[catId];
            const isCurrent = focusedDesign.categoryId === catId;
            return (
              <button
                key={catId}
                type="button"
                onClick={() => handleCategoryJump(catId)}
                className="shrink-0 bg-transparent border-0 pb-2 px-0 text-[12.5px] tracking-[0.12em] font-body cursor-pointer transition-colors duration-300"
                style={{
                  color: isCurrent ? '#3B2B2C' : '#7E6B6C',
                  borderBottom: isCurrent ? '1.5px solid #C9989A' : '1.5px solid transparent',
                }}
              >
                {cat.label[lang]}
              </button>
            );
          })}
        </div>

        {/* Interactive 3D チップ見本 Stage */}
        <div className="relative mt-6 sm:mt-8">
          <div
            {...bindDrag()}
            role="region"
            tabIndex={0}
            aria-label={
              lang === 'ja'
                ? '3Dネイルチップ見本リング。左右キーで回転、Enterキーで詳細表示'
                : '3D gel nail tip sample ring. Use left and right keys to rotate, Enter to inspect.'
            }
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault();
                setInspectedId(null);
                spinToIndex(focusedIndex + 1);
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                setInspectedId(null);
                spinToIndex(focusedIndex - 1);
              } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setInspectedId((curr) =>
                  curr === focusedDesign.id ? null : focusedDesign.id
                );
              } else if (e.key === 'Escape') {
                setInspectedId(null);
              }
            }}
            className="relative w-full h-[360px] sm:h-[430px] rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing outline-none"
            style={{
              background:
                'radial-gradient(ellipse 78% 72% at 50% 46%, #FBF7F4 0%, #F4ECE7 62%, #EFE3DE 100%)',
              border: '1px solid rgba(199, 169, 127, 0.24)',
              touchAction: 'pan-y',
            }}
          >
            {use3D && nearViewport ? (
              <Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="font-garamond italic text-[14px] text-[#7E6B6C]">
                      {SITE_CONFIG.tipsUI.dragCue[lang]}
                    </span>
                  </div>
                }
              >
                <TipSampleCanvas
                  designs={designs}
                  focusedIndex={focusedIndex}
                  inspectedId={inspectedId}
                  onFocusIndex={spinToIndex}
                  onInspect={setInspectedId}
                  rotationRef={rotationRef}
                  targetRotationRef={targetRotationRef}
                  isDraggingRef={isDraggingRef}
                  isMobile={isMobile}
                />
              </Suspense>
            ) : (
              /* Graceful 2D curved tip fan fallback (no WebGL or reduced motion) */
              <div className="w-full h-full flex items-center justify-center gap-3 sm:gap-5 px-6 overflow-x-auto no-scrollbar">
                {designs.map((d, idx) => {
                  const active = idx === focusedIndex;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        spinToIndex(idx);
                        setInspectedId(d.id);
                      }}
                      className="shrink-0 bg-transparent border-0 p-1 cursor-pointer flex flex-col items-center gap-2 transition-transform duration-300"
                      style={{
                        transform: active ? 'translateY(-10px) scale(1.12)' : 'scale(0.94)',
                        opacity: active ? 1 : 0.72,
                      }}
                    >
                      <img
                        src={resolveAssetUrl(`/media/tips/${d.id}.webp`)}
                        alt={d.name.ja}
                        loading="lazy"
                        className="w-[74px] sm:w-[92px] aspect-[3/4] object-cover rounded-xl"
                        style={{ border: active ? '1px solid #C9989A' : '1px solid rgba(59,43,44,0.08)' }}
                      />
                      <span className="font-num text-[11px] text-[#7E6B6C]">
                        {d.number}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Subtle 「イメージ」 tag on the visual stage */}
            <span
              className="pointer-events-none absolute top-3.5 right-4 text-[10px] tracking-[0.14em] px-2 py-0.5 rounded-full"
              style={{
                color: '#7E6B6C',
                backgroundColor: 'rgba(247, 241, 238, 0.78)',
              }}
            >
              {SITE_CONFIG.tipsUI.imageCaption[lang]}
            </span>

            {/* Quiet center-bottom rotation hint */}
            {!inspectedId && (
              <div className="pointer-events-none absolute bottom-3.5 inset-x-0 flex items-center justify-center gap-3 text-[10.5px] tracking-[0.16em] text-[#7E6B6C]/85">
                <span className="w-5 h-[1px] bg-[#C7A97F]/60" />
                <span>{SITE_CONFIG.tipsUI.dragCue[lang]}</span>
                <span className="w-5 h-[1px] bg-[#C7A97F]/60" />
              </div>
            )}
          </div>

          {/* Floating / Editorial Detail Card for Focused or Inspected Tip */}
          <div
            className="mt-5 sm:mt-6 p-5 sm:p-7 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all duration-400"
            style={{
              backgroundColor: '#FBF7F4',
              border: inspectedId
                ? '1px solid rgba(201, 152, 154, 0.55)'
                : '1px solid rgba(199, 169, 127, 0.3)',
            }}
          >
            <div className="flex items-start gap-4 sm:gap-5">
              {/* Crisp macro tip thumbnail */}
              <div className="relative shrink-0 w-14 sm:w-16 aspect-[3/4] rounded-xl overflow-hidden bg-white border border-[#C7A97F]/25">
                <img
                  src={resolveAssetUrl(`/media/tips/${displayDesign.id}.webp`)}
                  alt={displayDesign.name.ja}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2.5 text-[11.5px]">
                  <span className="font-num text-[#C7A97F]">No.{displayDesign.number}</span>
                  <span className="text-[#7E6B6C] tracking-[0.1em]">
                    {displayMeta.label[lang]}
                  </span>
                  <span className="text-[#7E6B6C]/60">·</span>
                  <span className="text-[#7E6B6C] text-[10.5px] tracking-[0.1em]">
                    {SITE_CONFIG.tipsUI.imageCaption[lang]}
                  </span>
                </div>

                <h3 className="m-0 font-mincho jp-heading text-[20px] sm:text-[23px] tracking-[0.08em] text-[#3B2B2C]">
                  {displayDesign.name.ja}
                </h3>

                <p className="m-0 text-[12.5px] text-[#7E6B6C] leading-relaxed">
                  {displayDesign.note[lang]}
                </p>

                <div className="pt-1 flex items-center gap-4 text-[12.5px] text-[#3B2B2C]">
                  <span>
                    <span className="text-[#7E6B6C] mr-1.5">
                      {SITE_CONFIG.tipsUI.durationPrefix[lang]}
                    </span>
                    <span className="font-num">
                      {displayMeta.durationMin}
                      {lang === 'ja' ? '分' : ' min'}
                    </span>
                  </span>
                  <span className="text-[#C7A97F]/60">/</span>
                  <span>
                    <span className="text-[#7E6B6C] mr-1.5">
                      {SITE_CONFIG.tipsUI.pricePrefix[lang]}
                    </span>
                    <span className="font-num">{formatYen(displayMeta.priceYen)}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Required dual actions: このデザインで相談 + 化粧台で試す */}
            <div className="flex flex-wrap sm:flex-col items-stretch sm:items-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onConsultDesign(displayDesign.id)}
                className="rounded-full px-6 py-2.5 text-[12.5px] tracking-[0.12em] font-body border-0 cursor-pointer transition-opacity duration-300 hover:opacity-90 active:scale-[0.98]"
                style={{
                  backgroundColor: '#C9989A',
                  color: '#FBF7F4',
                }}
              >
                {SITE_CONFIG.tipsUI.consultDesign[lang]}
              </button>

              <button
                type="button"
                onClick={() => onTryOnVanity(displayDesign.id)}
                className="rounded-full px-5 py-2 text-[12px] tracking-[0.12em] font-body bg-transparent cursor-pointer transition-colors duration-300 hover:bg-[#EFE3DE]/70"
                style={{
                  color: '#3B2B2C',
                  border: '1px solid rgba(59, 43, 44, 0.2)',
                }}
              >
                {SITE_CONFIG.tipsUI.tryOnVanity[lang]}
              </button>
            </div>
          </div>
        </div>

        {/* Expandable Plain-Text Menu List (「一覧で見る」 — SEO/GEO + quick price/time reading) */}
        <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(59, 43, 44, 0.1)' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            className="bg-transparent border-0 p-0 cursor-pointer inline-flex items-center gap-3 text-[13px] tracking-[0.14em] text-[#3B2B2C] hover:text-[#C9989A] transition-colors duration-300"
          >
            <span className="font-mincho">
              {menuOpen
                ? SITE_CONFIG.tipsUI.closeMenuList[lang]
                : SITE_CONFIG.tipsUI.viewMenuList[lang]}
            </span>
            <span
              className="font-num text-[14px] text-[#C7A97F] transition-transform duration-300 inline-block"
              style={{ transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)' }}
            >
              +
            </span>
          </button>

          {/* Always rendered in semantic DOM (visually collapsed when closed) so SEO/GEO crawlers & screen readers read all prices */}
          <div
            className="overflow-hidden transition-all duration-500"
            style={{
              maxHeight: menuOpen ? '1600px' : '0px',
              opacity: menuOpen ? 1 : 0,
            }}
          >
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
              {designs.map((d) => {
                const m = getDesignMeta(d);
                return (
                  <div
                    key={`menu-${d.id}`}
                    className="py-3.5 flex items-baseline justify-between gap-4 border-b border-[#3B2B2C]/10"
                  >
                    <div className="flex items-baseline gap-3 min-w-0">
                      <span className="font-num text-[11.5px] text-[#C7A97F] shrink-0">
                        {d.number}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = designs.findIndex((x) => x.id === d.id);
                          if (idx >= 0) spinToIndex(idx);
                          setInspectedId(d.id);
                        }}
                        className="bg-transparent border-0 p-0 text-left cursor-pointer text-[13.5px] text-[#3B2B2C] hover:text-[#C9989A] truncate font-mincho"
                      >
                        {d.name.ja}
                      </button>
                      <span className="text-[11px] text-[#7E6B6C] shrink-0">
                        {m.label[lang]}
                      </span>
                    </div>
                    <div className="shrink-0 text-right font-num text-[12.5px] text-[#3B2B2C]">
                      <span>{formatYen(m.priceYen)}</span>
                      <span className="text-[#7E6B6C] text-[11px] ml-2">
                        {m.durationMin}m
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Care & Extension menu items */}
              {SITE_CONFIG.careMenu.map((item) => (
                <div
                  key={item.id}
                  className="py-3.5 flex items-baseline justify-between gap-4 border-b border-[#3B2B2C]/10"
                >
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="text-[11px] text-[#C7A97F] shrink-0">
                      {item.categoryLabel[lang]}
                    </span>
                    <span className="text-[13.5px] text-[#3B2B2C] font-mincho truncate">
                      {item.name[lang]}
                    </span>
                  </div>
                  <div className="shrink-0 text-right font-num text-[12.5px] text-[#3B2B2C]">
                    <span>
                      {item.priceYen === 0
                        ? lang === 'ja'
                          ? '無料'
                          : 'Free'
                        : formatYen(item.priceYen)}
                    </span>
                    <span className="text-[#7E6B6C] text-[11px] ml-2">
                      {item.durationMin}m
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 mb-0 text-[11.5px] text-[#7E6B6C]">
              {SITE_CONFIG.tipsUI.priceDisclaimer[lang]}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
