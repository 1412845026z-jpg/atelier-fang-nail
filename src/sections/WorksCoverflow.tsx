import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Lang, SITE_CONFIG, WorkItem } from '../config';
import { MediaImage } from '../components/MediaImage';

interface WorksCoverflowProps {
  lang: Lang;
  onTryWork: (work: WorkItem) => void;
  onBookWork: (work: WorkItem) => void;
}

/** Shortest signed distance on a circular ring so both left and right arcs stay balanced */
function circularDelta(idx: number, virtualCenter: number, total: number): number {
  let d = (idx - virtualCenter) % total;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

function modIndex(n: number, total: number): number {
  return ((n % total) + total) % total;
}

export const WorksCoverflow: React.FC<WorksCoverflowProps> = ({
  lang,
  onTryWork,
  onBookWork,
}) => {
  const works = SITE_CONFIG.works;
  const total = works.length;

  // Start near center so both left & right 3D arcs are rich on arrival
  const initialIndex = 3;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [detailWork, setDetailWork] = useState<WorkItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);

  const animStateRef = useRef({ value: initialIndex });
  const virtualTargetRef = useRef(initialIndex);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startVal: initialIndex,
    moved: false,
  });
  const wheelCooldownRef = useRef(0);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const applyArcLayout = useCallback(
    (virtualIdx: number) => {
      if (isMobile) return;
      const stageW = stageRef.current?.clientWidth || 1200;
      const spacing = Math.min(295, Math.max(205, stageW * 0.215));

      cardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const d = circularDelta(idx, virtualIdx, total);
        const absD = Math.abs(d);

        const x = d * spacing;
        const z = -absD * 185 - d * d * 24;
        const rotY = Math.max(-46, Math.min(46, -d * 30));
        const scale = Math.max(0.66, 1 - absD * 0.13);
        const opacity = absD > 3.15 ? 0 : Math.max(0.22, 1 - absD * 0.25);
        const blurPx = absD < 0.2 ? 0 : Math.min(3.5, (absD - 0.2) * 1.3);
        const brightness = Math.max(0.68, 1 - absD * 0.12);

        el.style.transform = `translate3d(${x.toFixed(1)}px, 0px, ${z.toFixed(
          1
        )}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = `blur(${blurPx.toFixed(2)}px) brightness(${brightness.toFixed(3)})`;
        el.style.zIndex = String(50 - Math.round(absD * 10));
        el.style.pointerEvents = absD > 2.6 ? 'none' : 'auto';
      });
    },
    [isMobile, total]
  );

  const stepBy = useCallback(
    (delta: number) => {
      const nextVirtual = virtualTargetRef.current + delta;
      virtualTargetRef.current = nextVirtual;
      const wrapped = modIndex(Math.round(nextVirtual), total);
      setActiveIndex(wrapped);

      if (isMobile) {
        const track = mobileTrackRef.current;
        const targetCard = track?.children[wrapped] as HTMLElement | undefined;
        if (track && targetCard) {
          const left =
            targetCard.offsetLeft - (track.clientWidth - targetCard.clientWidth) * 0.5;
          track.scrollTo({ left, behavior: 'smooth' });
        }
        return;
      }

      gsap.killTweensOf(animStateRef.current);
      gsap.to(animStateRef.current, {
        value: nextVirtual,
        duration: 0.9,
        ease: 'power3.out',
        onUpdate: () => applyArcLayout(animStateRef.current.value),
      });
    },
    [applyArcLayout, isMobile, total]
  );

  const goToIndex = useCallback(
    (targetIdx: number) => {
      const d = circularDelta(targetIdx, virtualTargetRef.current, total);
      stepBy(d);
    },
    [stepBy, total]
  );

  useEffect(() => {
    if (!isMobile) {
      applyArcLayout(animStateRef.current.value);
      const onResize = () => applyArcLayout(animStateRef.current.value);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
    // Center initial mobile card smoothly
    const track = mobileTrackRef.current;
    const initialCard = track?.children[initialIndex] as HTMLElement | undefined;
    if (track && initialCard) {
      track.scrollLeft =
        initialCard.offsetLeft - (track.clientWidth - initialCard.clientWidth) * 0.5;
    }
  }, [applyArcLayout, isMobile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (detailWork) {
        if (e.key === 'Escape') setDetailWork(null);
        return;
      }

      const sec = sectionRef.current;
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const inView =
        rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      if (!inView) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepBy(1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepBy(-1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailWork, stepBy]);

  useEffect(() => {
    document.body.style.overflow = detailWork ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [detailWork]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMobile) return;
    gsap.killTweensOf(animStateRef.current);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startVal: animStateRef.current.value,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active || isMobile) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 6) dragRef.current.moved = true;
    const nextVal = dragRef.current.startVal - dx / 235;
    animStateRef.current.value = nextVal;
    applyArcLayout(nextVal);
  };

  const handlePointerUp = () => {
    if (!dragRef.current.active || isMobile) return;
    dragRef.current.active = false;
    const snapped = Math.round(animStateRef.current.value);
    virtualTargetRef.current = snapped;
    setActiveIndex(modIndex(snapped, total));
    gsap.to(animStateRef.current, {
      value: snapped,
      duration: 0.75,
      ease: 'power3.out',
      onUpdate: () => applyArcLayout(animStateRef.current.value),
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isMobile) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 16) {
      e.preventDefault();
      const now = performance.now();
      if (now - wheelCooldownRef.current < 420) return;
      wheelCooldownRef.current = now;
      stepBy(e.deltaX > 0 ? 1 : -1);
    }
  };

  const handleMobileScroll = () => {
    const track = mobileTrackRef.current;
    if (!track) return;
    const centerX = track.scrollLeft + track.clientWidth * 0.5;
    let closest = 0;
    let minDist = Infinity;
    Array.from(track.children).forEach((child, idx) => {
      const el = child as HTMLElement;
      const elCenter = el.offsetLeft + el.clientWidth * 0.5;
      const dist = Math.abs(elCenter - centerX);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });
    if (closest !== activeIndex) {
      virtualTargetRef.current = closest;
      setActiveIndex(closest);
    }
  };

  const activeWork = works[activeIndex];

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative w-full hairline-t pt-20 pb-20 sm:pt-24 sm:pb-28 overflow-hidden"
      style={{ backgroundColor: '#F2EEE8', color: '#241E1A' }}
    >
      <div
        style={{
          transform: detailWork ? 'scale(0.93)' : 'scale(1)',
          opacity: detailWork ? 0.35 : 1,
          filter: detailWork ? 'blur(4px)' : 'blur(0px)',
          transitionProperty: 'transform, opacity, filter',
          transitionDuration: '0.85s',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* Balanced section heading (Works · 08) + scrub cue + circular arrows */}
        <div className="px-5 sm:px-8 lg:px-12 flex items-center justify-between mb-8 sm:mb-10">
          <div className="flex items-center gap-4">
            <h2 className="font-editorial m-0 text-[26px] sm:text-[32px] leading-none text-[#241E1A]">
              {SITE_CONFIG.worksSection.heading[lang]}
            </h2>
            <div className="hidden sm:flex items-center gap-3" aria-hidden="true">
              <div
                className="relative w-9 h-[1px]"
                style={{ backgroundColor: 'rgba(36, 30, 26, 0.22)' }}
              >
                <span
                  className="absolute -top-[3px] left-0 w-[7px] h-[7px] rounded-full animate-scrub-cue"
                  style={{ backgroundColor: '#A7C1D9' }}
                />
              </div>
              <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                {activeWork.index} / {String(total).padStart(2, '0')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous work"
              onClick={() => stepBy(-1)}
              className="w-9 h-9 rounded-[2px] hairline-all bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:border-[#A7C1D9]"
              style={{ color: '#241E1A' }}
            >
              <span className="font-label">←</span>
            </button>
            <button
              type="button"
              aria-label="Next work"
              onClick={() => stepBy(1)}
              className="w-9 h-9 rounded-[2px] hairline-all bg-transparent flex items-center justify-center cursor-pointer transition-colors hover:border-[#A7C1D9]"
              style={{ color: '#241E1A' }}
            >
              <span className="font-label">→</span>
            </button>
          </div>
        </div>

        {/* Desktop Infinite 3D Curved Arc Stage */}
        {!isMobile ? (
          <div
            ref={stageRef}
            data-cursor="drag"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-full h-[470px] lg:h-[530px] flex items-center justify-center select-none touch-pan-y"
            style={{
              perspective: '1400px',
              perspectiveOrigin: '50% 48%',
            }}
          >
            {/* Clearly visible floor ambient color glow matching active manicure */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[500px] lg:w-[620px] h-[190px] rounded-full"
              style={{
                background: `radial-gradient(ellipse at center, ${activeWork.glowColor} 0%, transparent 70%)`,
                filter: 'blur(56px)',
                opacity: 0.78,
                transition: 'background 0.85s cubic-bezier(0.22, 1, 0.36, 1)',
              }}
            />

            <div
              className="relative w-full h-full flex items-center justify-center"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {works.map((work, idx) => {
                const isCenter = idx === activeIndex;
                return (
                  <div
                    key={work.id}
                    ref={(el) => {
                      cardRefs.current[idx] = el;
                    }}
                    data-cursor={isCenter ? 'view' : 'drag'}
                    onClick={() => {
                      if (dragRef.current.moved) return;
                      if (isCenter) {
                        setDetailWork(work);
                      } else {
                        goToIndex(idx);
                      }
                    }}
                    className="absolute w-[270px] lg:w-[310px] aspect-[3/4] cursor-pointer"
                    style={{
                      transformStyle: 'preserve-3d',
                      willChange: 'transform, opacity, filter',
                    }}
                  >
                    <div
                      className={`w-full h-full overflow-hidden rounded-[2px] ${
                        isCenter ? 'animate-float-center' : ''
                      }`}
                      style={{
                        border: isCenter
                          ? '1px solid rgba(36, 30, 26, 0.16)'
                          : '1px solid rgba(36, 30, 26, 0.08)',
                      }}
                    >
                      <MediaImage
                        src={work.image}
                        smallWidth={480}
                        largeWidth={896}
                        sizes="(max-width: 768px) 75vw, 320px"
                        alt={work.title[lang]}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Mobile clean horizontal swipe */
          <div className="relative w-full">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[300px] h-[140px] rounded-full"
              style={{
                background: `radial-gradient(ellipse at center, ${activeWork.glowColor} 0%, transparent 70%)`,
                filter: 'blur(46px)',
                opacity: 0.72,
                transition: 'background 0.7s ease',
              }}
            />

            <div
              ref={mobileTrackRef}
              onScroll={handleMobileScroll}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-[13vw] pb-6 pt-2 no-scrollbar"
            >
              {works.map((work, idx) => {
                const isCenter = idx === activeIndex;
                return (
                  <button
                    key={work.id}
                    type="button"
                    onClick={() => (isCenter ? setDetailWork(work) : goToIndex(idx))}
                    className="snap-center shrink-0 w-[74vw] max-w-[290px] aspect-[3/4] p-0 border-0 bg-transparent text-left cursor-pointer"
                    style={{
                      transform: isCenter ? 'scale(1)' : 'scale(0.93)',
                      opacity: isCenter ? 1 : 0.62,
                      transition:
                        'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease',
                    }}
                  >
                    <div
                      className={`w-full h-full overflow-hidden rounded-[2px] ${
                        isCenter ? 'animate-float-center' : ''
                      }`}
                      style={{ border: '1px solid rgba(36, 30, 26, 0.14)' }}
                    >
                      <MediaImage
                        src={work.image}
                        smallWidth={480}
                        largeWidth={896}
                        sizes="74vw"
                        alt={work.title[lang]}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Unified Specimen Label + Direct Try-on Action below active work */}
        <div className="mt-5 sm:mt-7 px-5 sm:px-8 lg:px-12 flex flex-col items-center text-center">
          <div className="font-label tabular-nums mb-1.5" style={{ color: '#8A8178' }}>
            No.{activeWork.index} · {activeWork.finishTag} · {activeWork.durationMin}M
          </div>
          <h3 className="font-editorial m-0 text-[28px] sm:text-[34px] leading-tight text-[#241E1A]">
            {activeWork.title[lang]}
          </h3>

          <div className="mt-4 flex items-center gap-5">
            <button
              type="button"
              onClick={() => onTryWork(activeWork)}
              className="inline-flex items-center gap-3 px-5 py-2 rounded-[2px] border-0 cursor-pointer font-label"
              style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
            >
              <span>{SITE_CONFIG.worksSection.tryThis[lang]}</span>
              <span className="inline-block h-[1px] w-4" style={{ backgroundColor: '#A7C1D9' }} />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-2">
            {works.map((w, idx) => (
              <button
                key={w.id}
                type="button"
                aria-label={`${w.index} ${w.title[lang]}`}
                onClick={() => goToIndex(idx)}
                className="p-1 bg-transparent border-0 cursor-pointer"
              >
                <span
                  className="block h-[2px]"
                  style={{
                    width: idx === activeIndex ? '20px' : '6px',
                    backgroundColor:
                      idx === activeIndex ? '#A7C1D9' : 'rgba(36, 30, 26, 0.22)',
                    transition:
                      'width 0.45s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.35s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Editorial Detail Overlay with Direct "試着する" + "予約" */}
      {detailWork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={detailWork.title[lang]}
          onClick={() => setDetailWork(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center px-5 sm:px-10 py-10"
          style={{ backgroundColor: 'rgba(242, 238, 232, 0.97)' }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[980px] grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center"
          >
            <div className="md:col-span-6 lg:col-span-5">
              <div
                className="w-full max-h-[68vh] aspect-[3/4] overflow-hidden rounded-[2px] mx-auto"
                style={{ border: '1px solid rgba(36, 30, 26, 0.15)' }}
              >
                <MediaImage
                  src={detailWork.image}
                  smallWidth={480}
                  largeWidth={896}
                  sizes="(max-width: 768px) 90vw, 440px"
                  alt={detailWork.title[lang]}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>

            <div className="md:col-span-6 lg:col-span-5 lg:col-start-7 flex flex-col items-start">
              <div className="w-full flex items-center justify-between pb-4 hairline-b">
                <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                  No.{detailWork.index} · {detailWork.finishTag} · {detailWork.durationMin}M
                </span>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setDetailWork(null)}
                  className="font-label bg-transparent border-0 p-1 cursor-pointer text-[16px] hover:opacity-60"
                  style={{ color: '#241E1A' }}
                >
                  {SITE_CONFIG.worksSection.closeLabel[lang]}
                </button>
              </div>

              <h3 className="font-editorial mt-8 mb-6 text-[36px] sm:text-[48px] leading-[1.06] jp-heading text-[#241E1A]">
                {detailWork.title[lang]}
              </h3>

              <div className="w-full max-w-[240px] mb-10">
                <div className="font-label mb-2" style={{ color: '#8A8178' }}>
                  {detailWork.durationMin} MIN
                </div>
                <div className="h-[1px] w-full" style={{ backgroundColor: 'rgba(36,30,26,0.14)' }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.min(100, (detailWork.durationMin / 150) * 100)}%`,
                      backgroundColor: '#A7C1D9',
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    const chosen = detailWork;
                    setDetailWork(null);
                    onTryWork(chosen);
                  }}
                  className="inline-flex items-center gap-4 px-7 py-3.5 rounded-[2px] border-0 cursor-pointer font-label"
                  style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
                >
                  <span>{SITE_CONFIG.worksSection.tryThis[lang]}</span>
                  <span
                    className="inline-block h-[1px] w-6"
                    style={{ backgroundColor: '#A7C1D9' }}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const chosen = detailWork;
                    setDetailWork(null);
                    onBookWork(chosen);
                  }}
                  className="px-6 py-3.5 rounded-[2px] bg-transparent cursor-pointer font-label"
                  style={{
                    color: '#241E1A',
                    border: '1px solid rgba(36,30,26,0.28)',
                  }}
                >
                  {SITE_CONFIG.worksSection.bookThis[lang]}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
