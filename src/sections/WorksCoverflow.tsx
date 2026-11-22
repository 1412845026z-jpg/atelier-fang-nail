import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Lang, SITE_CONFIG, WorkItem } from '../config';
import { MediaImage } from '../components/MediaImage';

interface WorksCoverflowProps {
  lang: Lang;
  onRequestSimilar: (workTitle: string) => void;
}

export const WorksCoverflow: React.FC<WorksCoverflowProps> = ({
  lang,
  onRequestSimilar,
}) => {
  const works = SITE_CONFIG.works;
  const total = works.length;

  const [activeIndex, setActiveIndex] = useState(0);
  const [detailWork, setDetailWork] = useState<WorkItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const sectionRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);

  const animStateRef = useRef({ value: 0 });
  const activeIndexRef = useRef(0);
  const dragRef = useRef({
    active: false,
    startX: 0,
    startVal: 0,
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
      const spacing = Math.min(300, Math.max(205, stageW * 0.22));

      cardRefs.current.forEach((el, idx) => {
        if (!el) return;
        const d = idx - virtualIdx;
        const absD = Math.abs(d);

        const x = d * spacing;
        const z = -absD * 180 - d * d * 28;
        const rotY = Math.max(-46, Math.min(46, -d * 30));
        const scale = Math.max(0.66, 1 - absD * 0.13);
        const opacity = absD > 3.25 ? 0 : Math.max(0.18, 1 - absD * 0.27);
        const blurPx = absD < 0.22 ? 0 : Math.min(4, (absD - 0.22) * 1.45);
        const brightness = Math.max(0.64, 1 - absD * 0.14);

        el.style.transform = `translate3d(${x.toFixed(1)}px, 0px, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = `blur(${blurPx.toFixed(2)}px) brightness(${brightness.toFixed(3)})`;
        el.style.zIndex = String(50 - Math.round(absD * 10));
        el.style.pointerEvents = absD > 2.6 ? 'none' : 'auto';
      });
    },
    [isMobile]
  );

  const goToIndex = useCallback(
    (nextRaw: number) => {
      const clamped = Math.max(0, Math.min(total - 1, nextRaw));
      activeIndexRef.current = clamped;
      setActiveIndex(clamped);

      if (isMobile) {
        const track = mobileTrackRef.current;
        const targetCard = track?.children[clamped] as HTMLElement | undefined;
        if (track && targetCard) {
          const left =
            targetCard.offsetLeft - (track.clientWidth - targetCard.clientWidth) * 0.5;
          track.scrollTo({ left, behavior: 'smooth' });
        }
        return;
      }

      gsap.killTweensOf(animStateRef.current);
      gsap.to(animStateRef.current, {
        value: clamped,
        duration: 0.9,
        ease: 'power3.out',
        onUpdate: () => applyArcLayout(animStateRef.current.value),
      });
    },
    [applyArcLayout, isMobile, total]
  );

  useEffect(() => {
    if (!isMobile) {
      animStateRef.current.value = activeIndexRef.current;
      applyArcLayout(activeIndexRef.current);
      const onResize = () => applyArcLayout(animStateRef.current.value);
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }
  }, [applyArcLayout, isMobile]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (detailWork) {
        if (e.key === 'Escape') {
          setDetailWork(null);
        }
        return;
      }

      const sec = sectionRef.current;
      if (!sec) return;
      const rect = sec.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      if (!inView) return;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToIndex(activeIndexRef.current + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToIndex(activeIndexRef.current - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [detailWork, goToIndex]);

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
    if (Math.abs(dx) > 6) {
      dragRef.current.moved = true;
    }
    const nextVal = Math.max(
      -0.35,
      Math.min(total - 1 + 0.35, dragRef.current.startVal - dx / 240)
    );
    animStateRef.current.value = nextVal;
    applyArcLayout(nextVal);
  };

  const handlePointerUp = () => {
    if (!dragRef.current.active || isMobile) return;
    dragRef.current.active = false;
    goToIndex(Math.round(animStateRef.current.value));
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (isMobile) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 16) {
      e.preventDefault();
      const now = performance.now();
      if (now - wheelCooldownRef.current < 420) return;
      wheelCooldownRef.current = now;
      if (e.deltaX > 0) {
        goToIndex(activeIndexRef.current + 1);
      } else {
        goToIndex(activeIndexRef.current - 1);
      }
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
    if (closest !== activeIndexRef.current) {
      activeIndexRef.current = closest;
      setActiveIndex(closest);
    }
  };

  const activeWork = works[activeIndex];

  return (
    <section
      id="works"
      ref={sectionRef}
      className="relative w-full hairline-t py-20 sm:py-28 lg:py-32 overflow-hidden"
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
        {/* Minimal visual controls bar: animated drag scrub cue + hairline arrows */}
        <div className="px-5 sm:px-8 lg:px-12 flex items-center justify-between mb-10 sm:mb-14">
          <div className="flex items-center gap-3" aria-hidden="true">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous work"
              onClick={() => goToIndex(activeIndex - 1)}
              disabled={activeIndex === 0}
              className="w-9 h-9 rounded-[2px] hairline-all bg-transparent flex items-center justify-center cursor-pointer disabled:opacity-25 transition-colors hover:border-[#A7C1D9]"
              style={{ color: '#241E1A' }}
            >
              <span className="font-label">←</span>
            </button>
            <button
              type="button"
              aria-label="Next work"
              onClick={() => goToIndex(activeIndex + 1)}
              disabled={activeIndex === total - 1}
              className="w-9 h-9 rounded-[2px] hairline-all bg-transparent flex items-center justify-center cursor-pointer disabled:opacity-25 transition-colors hover:border-[#A7C1D9]"
              style={{ color: '#241E1A' }}
            >
              <span className="font-label">→</span>
            </button>
          </div>
        </div>

        {/* Desktop 3D Curved Arc Stage */}
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
            className="relative w-full h-[500px] lg:h-[560px] flex items-center justify-center select-none touch-pan-y"
            style={{
              perspective: '1400px',
              perspectiveOrigin: '50% 48%',
            }}
          >
            {/* Dynamic floor color glow matching active manicure */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 bottom-2 -translate-x-1/2 w-[380px] lg:w-[460px] h-[150px] rounded-full"
              style={{
                background: `radial-gradient(ellipse at center, ${activeWork.glowColor} 0%, transparent 72%)`,
                filter: 'blur(60px)',
                opacity: 0.5,
                transition: 'background 0.9s cubic-bezier(0.22, 1, 0.36, 1)',
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
                    className="absolute w-[280px] lg:w-[324px] aspect-[3/4] cursor-pointer"
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
                          ? '1px solid rgba(36, 30, 26, 0.14)'
                          : '1px solid rgba(36, 30, 26, 0.08)',
                      }}
                    >
                      <MediaImage
                        src={work.image}
                        alt={work.title[lang]}
                        className="w-full h-full object-cover"
                        loading={idx < 3 ? 'eager' : 'lazy'}
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
              className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[260px] h-[110px] rounded-full"
              style={{
                background: `radial-gradient(ellipse at center, ${activeWork.glowColor} 0%, transparent 72%)`,
                filter: 'blur(52px)',
                opacity: 0.45,
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
                      transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease',
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
                        alt={work.title[lang]}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Work Title & Minimal Visual Index Dots (zero description text) */}
        <div className="mt-6 sm:mt-8 px-5 sm:px-8 lg:px-12 flex flex-col items-center text-center">
          <h2 className="font-editorial m-0 text-[28px] sm:text-[36px] leading-tight text-[#241E1A]">
            {activeWork.title[lang]}
          </h2>
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
                    backgroundColor: idx === activeIndex ? '#A7C1D9' : 'rgba(36, 30, 26, 0.22)',
                    transition: 'width 0.45s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.35s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fullscreen Editorial Detail Overlay (zero explanatory prose) */}
      {detailWork && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={detailWork.title[lang]}
          onClick={() => setDetailWork(null)}
          className="fixed inset-0 z-[80] flex items-center justify-center px-5 sm:px-10 py-10"
          style={{ backgroundColor: 'rgba(242, 238, 232, 0.96)' }}
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
                  alt={detailWork.title[lang]}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
            </div>

            <div className="md:col-span-6 lg:col-span-5 lg:col-start-7 flex flex-col items-start">
              <div className="w-full flex items-center justify-between pb-4 hairline-b">
                <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                  {detailWork.index} / {String(total).padStart(2, '0')}
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

              <h3 className="font-editorial mt-8 mb-4 text-[38px] sm:text-[52px] leading-[1.04] text-[#241E1A]">
                {detailWork.title[lang]}
              </h3>

              {/* Visual proportional duration bar */}
              <div className="w-full max-w-[240px] mb-10">
                <div className="flex items-center justify-between font-label mb-2" style={{ color: '#8A8178' }}>
                  <span>{detailWork.durationMin} MIN</span>
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

              <button
                type="button"
                onClick={() => {
                  const chosen = `${detailWork.index} ${detailWork.title[lang]}`;
                  setDetailWork(null);
                  onRequestSimilar(chosen);
                }}
                className="inline-flex items-center gap-5 px-7 py-3.5 rounded-[2px] border-0 cursor-pointer font-label"
                style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
              >
                <span>{SITE_CONFIG.worksSection.bookThis[lang]}</span>
                <span
                  className="inline-block h-[1px] w-7"
                  style={{ backgroundColor: '#A7C1D9' }}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
