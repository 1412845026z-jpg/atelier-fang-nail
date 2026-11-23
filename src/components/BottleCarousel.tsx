import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { getDesignMeta, Lang, SITE_CONFIG } from '../config';
import { NailDesignItem } from '../types/nail';
import { resolveAssetUrl } from '../utils/assetUrl';
import { formatYen } from '../utils/designCodec';

gsap.registerPlugin(Draggable, InertiaPlugin);

interface BottleCarouselProps {
  visible: boolean;
  activeIndex: number; // 0..11 = 12 curated presets, 12 = clear empty bottle (Self Design entry)
  lang: Lang;
  onSelectIndex: (idx: number) => void;
  onOpenCardForPreset: (design: NailDesignItem) => void;
}

export const BottleCarousel: React.FC<BottleCarouselProps> = ({
  visible,
  activeIndex,
  lang,
  onSelectIndex,
  onOpenCardForPreset,
}) => {
  const totalCount = SITE_CONFIG.designs.length + 1;
  const stageRef = useRef<HTMLDivElement | null>(null);
  const proxyRef = useRef<HTMLDivElement | null>(null);
  const dragInstanceRef = useRef<Draggable | null>(null);
  const movedPxRef = useRef(0);
  const activeIdxRef = useRef(activeIndex);
  activeIdxRef.current = activeIndex;

  const onSelectRef = useRef(onSelectIndex);
  onSelectRef.current = onSelectIndex;

  const [spacingPx, setSpacingPx] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 92 : 126
  );
  const [renderPos, setRenderPos] = useState<number>(activeIndex);

  useEffect(() => {
    const onResize = () => setSpacingPx(window.innerWidth < 640 ? 92 : 126);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Physical GSAP Draggable + InertiaPlugin momentum + tactile spring settle (Section 1A & 3A.4)
  useEffect(() => {
    const stageEl = stageRef.current;
    const proxyEl = proxyRef.current;
    if (!stageEl || !proxyEl) return;

    gsap.set(proxyEl, { x: -activeIdxRef.current * spacingPx });

    const syncFromProxy = () => {
      const xVal = Number(gsap.getProperty(proxyEl, 'x')) || 0;
      const nextPos = Math.max(-0.45, Math.min(totalCount - 0.55, -xVal / spacingPx));
      setRenderPos(nextPos);
    };

    const [instance] = Draggable.create(proxyEl, {
      trigger: stageEl,
      type: 'x',
      bounds: {
        minX: -(totalCount - 1) * spacingPx,
        maxX: 0,
      },
      edgeResistance: 0.78,
      inertia: true,
      throwResistance: 1850,
      maxDuration: 0.95,
      minDuration: 0.28,
      allowNativeTouchScrolling: true,
      dragClickables: true,
      snap: {
        x: (endValue: number) => Math.round(endValue / spacingPx) * spacingPx,
      },
      onPress() {
        movedPxRef.current = 0;
        gsap.killTweensOf(proxyEl);
      },
      onDrag() {
        movedPxRef.current = Math.max(
          movedPxRef.current,
          Math.abs(this.x - this.startX)
        );
        syncFromProxy();
      },
      onThrowUpdate: syncFromProxy,
      onThrowComplete() {
        syncFromProxy();
        const xVal = Number(gsap.getProperty(proxyEl, 'x')) || 0;
        const settledIdx = Math.max(0, Math.min(totalCount - 1, Math.round(-xVal / spacingPx)));
        setRenderPos(settledIdx);
        onSelectRef.current(settledIdx);
      },
    });

    dragInstanceRef.current = instance;
    return () => {
      instance.kill();
      dragInstanceRef.current = null;
    };
  }, [spacingPx, totalCount]);

  // Tactile underdamped rebound (`back.out(1.22)`) when selected programmatically or via bottle tap
  const animateToIndex = useCallback(
    (targetIdx: number, notify: boolean) => {
      const proxyEl = proxyRef.current;
      const clamped = Math.max(0, Math.min(totalCount - 1, targetIdx));
      if (!proxyEl) {
        setRenderPos(clamped);
        if (notify) onSelectRef.current(clamped);
        return;
      }
      gsap.killTweensOf(proxyEl);
      gsap.to(proxyEl, {
        x: -clamped * spacingPx,
        duration: 0.58,
        ease: 'back.out(1.22)',
        onUpdate: () => {
          const xVal = Number(gsap.getProperty(proxyEl, 'x')) || 0;
          setRenderPos(-xVal / spacingPx);
          dragInstanceRef.current?.update();
        },
        onComplete: () => {
          setRenderPos(clamped);
          dragInstanceRef.current?.update();
          if (notify) onSelectRef.current(clamped);
        },
      });
    },
    [spacingPx, totalCount]
  );

  useEffect(() => {
    if (dragInstanceRef.current?.isDragging || dragInstanceRef.current?.isThrowing) return;
    animateToIndex(activeIndex, false);
  }, [activeIndex, animateToIndex]);

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!visible || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    const proxyEl = proxyRef.current;
    if (!proxyEl) return;
    gsap.killTweensOf(proxyEl);
    const curX = Number(gsap.getProperty(proxyEl, 'x')) || 0;
    const nextX = Math.max(
      -(totalCount - 1) * spacingPx,
      Math.min(0, curX - e.deltaX * 0.85)
    );
    gsap.set(proxyEl, { x: nextX });
    dragInstanceRef.current?.update();
    setRenderPos(-nextX / spacingPx);

    clearTimeout((onWheel as unknown as { _t?: number })._t);
    (onWheel as unknown as { _t?: number })._t = window.setTimeout(() => {
      const snappedIdx = Math.max(0, Math.min(totalCount - 1, Math.round(-nextX / spacingPx)));
      animateToIndex(snappedIdx, true);
    }, 95);
  };

  const centeredIdx = Math.max(0, Math.min(totalCount - 1, Math.round(renderPos)));
  const isClearFocused = centeredIdx === SITE_CONFIG.designs.length;
  const focusedDesign = !isClearFocused ? SITE_CONFIG.designs[centeredIdx] : null;
  const focusedMeta = focusedDesign ? getDesignMeta(focusedDesign) : null;

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center pb-5 sm:pb-7 select-none"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 22px, 0)',
        transition:
          'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Hidden proxy element driven by GSAP Draggable + InertiaPlugin */}
      <div ref={proxyRef} className="hidden" aria-hidden="true" />

      {/* Photorealistic glass bottles standing directly on the table (zero full-width frosted banner!) */}
      <div
        ref={stageRef}
        onWheel={onWheel}
        className="relative w-full h-[156px] sm:h-[196px] flex items-end justify-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
      >
        {Array.from({ length: totalCount }).map((_, idx) => {
          const offset = idx - renderPos;
          const absOff = Math.abs(offset);
          const outOfRange = absOff > 4.6;

          const isClear = idx === SITE_CONFIG.designs.length;
          const item = !isClear ? SITE_CONFIG.designs[idx] : null;
          const imgSrc = resolveAssetUrl(
            isClear ? SITE_CONFIG.media.clearBottleWebp : item!.bottleWebp
          );

          const xPx = offset * spacingPx;
          const scale = Math.max(0.72, 1.07 - absOff * 0.13);
          const liftY = Math.max(0, (1 - Math.min(1, absOff)) * -10);
          const blurPx = absOff < 0.16 ? 0 : Math.min(8, 1.8 + (absOff - 0.16) * 2.3);
          const brightness = Math.max(0.82, 1 - absOff * 0.06);
          const opacity =
            !visible || outOfRange
              ? 0
              : Math.max(0.24, 1 - Math.max(0, absOff - 2.6) * 0.44);
          const zIndex = Math.round(30 - absOff * 5);

          return (
            <button
              key={isClear ? 'clear-self' : item!.id}
              type="button"
              onClick={() => {
                if (movedPxRef.current > 8) return;
                if (idx === centeredIdx && item) {
                  onOpenCardForPreset(item);
                } else {
                  animateToIndex(idx, true);
                }
              }}
              aria-label={isClear ? SITE_CONFIG.selfDesign.entryLabel[lang] : item!.name[lang]}
              className="absolute bottom-2.5 bg-transparent border-0 p-0 cursor-pointer flex flex-col items-center will-change-transform"
              style={{
                zIndex,
                opacity,
                pointerEvents: outOfRange ? 'none' : 'auto',
                transform: `translate3d(${xPx.toFixed(1)}px, ${liftY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
                filter: outOfRange
                  ? 'none'
                  : `blur(${blurPx.toFixed(2)}px) brightness(${brightness.toFixed(2)})`,
                transition: visible
                  ? `opacity 0.45s ease ${Math.min(idx * 30, 240)}ms`
                  : 'opacity 0.3s ease',
              }}
            >
              <img
                src={imgSrc}
                alt={isClear ? SITE_CONFIG.selfDesign.entryLabel[lang] : item!.name[lang]}
                loading={idx <= 4 ? 'eager' : 'lazy'}
                draggable={false}
                className="h-[130px] sm:h-[164px] w-auto object-contain pointer-events-none block"
              />
              <span
                aria-hidden="true"
                className="block -mt-1.5 rounded-full pointer-events-none"
                style={{
                  width: '52px',
                  height: '8px',
                  background:
                    'radial-gradient(ellipse at center, rgba(46, 32, 30, 0.28) 0%, rgba(46, 32, 30, 0) 74%)',
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Section 3A.1: Translucent thin washi slip floating weightlessly over the photograph */}
      <div className="mt-1 px-4">
        {focusedDesign && focusedMeta ? (
          <button
            type="button"
            onClick={() => onOpenCardForPreset(focusedDesign)}
            className="paper-grain px-5 py-2 rounded-full cursor-pointer group flex items-baseline gap-3 transition-all duration-300"
            style={{
              backgroundColor: 'rgba(251, 248, 244, 0.74)',
              border: '1px solid rgba(199, 169, 127, 0.34)',
              boxShadow: '0 6px 20px rgba(42, 29, 31, 0.06)',
            }}
          >
            <span className="font-num text-[11px] text-[#C7A97F]">
              No.{focusedDesign.number}
            </span>
            <span className="font-mincho text-[13.5px] sm:text-[14.5px] tracking-[0.08em] text-[#3B2B2C] group-hover:text-[#C9989A] transition-colors">
              {focusedDesign.name[lang]}
            </span>
            <span className="font-num text-[11px] tracking-[0.08em] text-[#7E6B6C]">
              {formatYen(focusedMeta.priceYen)} ·{' '}
              {lang === 'ja' ? `${focusedMeta.durationMin}分` : `${focusedMeta.durationMin}m`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onSelectIndex(SITE_CONFIG.designs.length)}
            className="paper-grain px-5 py-2 rounded-full cursor-pointer flex items-baseline gap-3"
            style={{
              backgroundColor: 'rgba(251, 248, 244, 0.74)',
              border: '1px solid rgba(199, 169, 127, 0.34)',
              boxShadow: '0 6px 20px rgba(42, 29, 31, 0.06)',
            }}
          >
            <span className="font-mincho text-[13.5px] sm:text-[14.5px] tracking-[0.1em] text-[#3B2B2C]">
              {SITE_CONFIG.selfDesign.entryLabel[lang]}
            </span>
            <span className="font-num text-[11px] tracking-[0.08em] text-[#7E6B6C]">
              {formatYen(SITE_CONFIG.selfDesign.basePriceYen)}– ·{' '}
              {lang === 'ja' ? '80分–' : '80m–'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
