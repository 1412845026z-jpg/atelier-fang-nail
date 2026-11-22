import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';

gsap.registerPlugin(ScrollTrigger);

interface ExplodedNailProps {
  lang: Lang;
}

const ALMOND_PATH =
  'M 110 16 C 151 16 184 106 184 212 C 184 276 155 322 110 322 C 65 322 36 276 36 212 C 36 106 69 16 110 16 Z';

/**
 * Refined tactile glass / mineral swatch layers (no cartoon flat fills, no heavy black borders).
 */
function renderNailLayerSvg(layerIdx: number, highlighted: boolean) {
  const edgeStroke = highlighted ? '#A7C1D9' : 'rgba(36,30,26,0.13)';
  const strokeW = highlighted ? '1.6' : '0.9';

  switch (layerIdx) {
    case 0:
      // 01 Prep: warm organic shell-ivory matte keratin
      return (
        <svg viewBox="0 0 220 340" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="layer-0-grad" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#EBE0D5" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#E1D1C3" stopOpacity="0.86" />
              <stop offset="100%" stopColor="#D7C3B4" stopOpacity="0.9" />
            </linearGradient>
            <clipPath id="clip-specimen-0">
              <path d={ALMOND_PATH} />
            </clipPath>
          </defs>
          <path d={ALMOND_PATH} fill="url(#layer-0-grad)" stroke={edgeStroke} strokeWidth={strokeW} />
          <g clipPath="url(#clip-specimen-0)">
            <ellipse cx="110" cy="310" rx="48" ry="26" fill="#F8F4EE" opacity="0.6" />
          </g>
        </svg>
      );

    case 1:
      // 02 Base: translucent milky builder gel
      return (
        <svg viewBox="0 0 220 340" className="w-full h-full overflow-visible">
          <defs>
            <radialGradient id="layer-1-grad" cx="46%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#FCF9F5" stopOpacity="0.86" />
              <stop offset="68%" stopColor="#F2ECE3" stopOpacity="0.66" />
              <stop offset="100%" stopColor="#E7DFD4" stopOpacity="0.52" />
            </radialGradient>
          </defs>
          <path d={ALMOND_PATH} fill="url(#layer-1-grad)" stroke={edgeStroke} strokeWidth={strokeW} />
        </svg>
      );

    case 2:
      // 03 Color: sheer frosted powder-blue mineral veil (translucent, never flat cartoon blue)
      return (
        <svg viewBox="0 0 220 340" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="layer-2-grad" x1="10%" y1="10%" x2="90%" y2="95%">
              <stop offset="0%" stopColor="#CFDCE7" stopOpacity="0.68" />
              <stop offset="52%" stopColor="#B8CDDF" stopOpacity="0.64" />
              <stop offset="100%" stopColor="#A7C1D9" stopOpacity="0.72" />
            </linearGradient>
          </defs>
          <path d={ALMOND_PATH} fill="url(#layer-2-grad)" stroke={edgeStroke} strokeWidth={strokeW} />
        </svg>
      );

    case 3:
      // 04 Art: delicate diagonal pearl silk sheen + micro specular line
      return (
        <svg viewBox="0 0 220 340" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="layer-3-grad" x1="0%" y1="22%" x2="100%" y2="76%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.06" />
              <stop offset="40%" stopColor="#F8F5F0" stopOpacity="0.46" />
              <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.74" />
              <stop offset="66%" stopColor="#E6E0D8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.04" />
            </linearGradient>
            <clipPath id="clip-specimen-3">
              <path d={ALMOND_PATH} />
            </clipPath>
          </defs>
          <path d={ALMOND_PATH} fill="url(#layer-3-grad)" stroke={edgeStroke} strokeWidth={strokeW} />
          <g clipPath="url(#clip-specimen-3)">
            <path
              d="M 56 244 C 94 212, 134 156, 160 88"
              fill="none"
              stroke="rgba(36,30,26,0.28)"
              strokeWidth="0.9"
            />
          </g>
        </svg>
      );

    default:
      // 05 Top: optical liquid-glass refraction coat
      return (
        <svg viewBox="0 0 220 340" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="layer-4-glaze" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.24" />
              <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.16" />
            </linearGradient>
            <linearGradient id="layer-4-spec" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
            <clipPath id="clip-specimen-4">
              <path d={ALMOND_PATH} />
            </clipPath>
          </defs>
          <path d={ALMOND_PATH} fill="url(#layer-4-glaze)" stroke={edgeStroke} strokeWidth={strokeW} />
          <g clipPath="url(#clip-specimen-4)">
            <path
              d="M 70 294 L 92 294 L 152 44 L 135 44 Z"
              fill="url(#layer-4-spec)"
              opacity="0.92"
            />
          </g>
        </svg>
      );
  }
}

export const ExplodedNail: React.FC<ExplodedNailProps> = ({ lang }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [focusedLayer, setFocusedLayer] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const sync = () => setIsMobile(window.innerWidth < 768);
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        setProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  const effectiveProgress = reducedMotion ? 0.65 : progress;

  let spreadFactor = 0;
  if (effectiveProgress <= 0.08) {
    spreadFactor = 0;
  } else if (effectiveProgress <= 0.56) {
    const t = (effectiveProgress - 0.08) / 0.48;
    spreadFactor = 1 - Math.pow(1 - t, 3);
  } else if (effectiveProgress <= 0.74) {
    spreadFactor = 1;
  } else if (effectiveProgress <= 0.9) {
    const t = (effectiveProgress - 0.74) / 0.16;
    spreadFactor = 1 - t * t * (3 - 2 * t);
  } else {
    spreadFactor = 0;
  }

  const maxStepPx = isMobile ? 34 : 58;
  const layers = SITE_CONFIG.exploded.layers;
  const activeCountDisplay = Math.max(1, Math.min(5, Math.round(1 + spreadFactor * 4)));

  return (
    <section
      id="craft"
      ref={sectionRef}
      className="relative w-full hairline-t"
      style={{
        height: reducedMotion ? 'auto' : '300vh',
        backgroundColor: '#F2EEE8',
        color: '#241E1A',
      }}
    >
      <div
        className={
          reducedMotion
            ? 'relative w-full py-24 px-5 sm:px-8 lg:px-12'
            : 'sticky top-0 h-[100svh] w-full overflow-hidden px-5 sm:px-8 lg:px-12 py-16 sm:py-20 flex flex-col justify-between'
        }
      >
        {/* Minimal numeric visual gauge (no explanatory text) */}
        <div className="flex items-center justify-end">
          <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
            0{activeCountDisplay} / 05
          </span>
        </div>

        {/* Interactive Isometric CSS 3D Material Stack */}
        <div className="relative flex-1 flex items-center justify-center my-2">
          <div
            className="relative w-full max-w-[1000px] h-[440px] sm:h-[520px] flex items-center justify-center"
            style={{ perspective: '1200px' }}
          >
            <div
              className="relative"
              style={{
                width: isMobile ? '138px' : '208px',
                height: isMobile ? '214px' : '322px',
                transformStyle: 'preserve-3d',
                transform: `translate3d(${isMobile ? '-42px' : '0px'}, ${
                  isMobile ? '16px' : '22px'
                }, 0) rotateX(58deg) rotateZ(-35deg)`,
              }}
            >
              {layers.map((layer, idx) => {
                const isFocused = focusedLayer === idx;
                const isDimmed = focusedLayer !== null && !isFocused;
                const zPx = (idx - 2) * maxStepPx * spreadFactor;
                const slideOut = isFocused && spreadFactor > 0.2 ? 16 : 0;

                return (
                  <div
                    key={layer.index}
                    onMouseEnter={() => spreadFactor > 0.25 && setFocusedLayer(idx)}
                    onMouseLeave={() => setFocusedLayer(null)}
                    onClick={() =>
                      spreadFactor > 0.25 &&
                      setFocusedLayer((cur) => (cur === idx ? null : idx))
                    }
                    className="absolute inset-0 cursor-pointer"
                    style={{
                      transform: `translate3d(${slideOut}px, ${-slideOut * 0.4}px, ${zPx.toFixed(
                        1
                      )}px)`,
                      opacity: isDimmed ? 0.32 : 1,
                      transition:
                        'opacity 0.45s cubic-bezier(0.22, 1, 0.36, 1), transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
                      willChange: 'transform, opacity',
                    }}
                  >
                    {renderNailLayerSvg(idx, isFocused)}
                  </div>
                );
              })}
            </div>

            {/* Interactive hairline leader callouts (single-word label only, hover/tap to isolate) */}
            {!isMobile ? (
              <div className="pointer-events-none absolute inset-0">
                {layers.map((layer, idx) => {
                  const openStart = 0.14 + idx * 0.07;
                  const openT = Math.max(0, Math.min(1, (effectiveProgress - openStart) / 0.12));
                  const closeT =
                    effectiveProgress > 0.72
                      ? Math.max(0, 1 - (effectiveProgress - 0.72) / 0.12)
                      : 1;
                  const lineProgress = reducedMotion ? 1 : Math.min(openT, closeT);

                  const isRightSide = idx % 2 === 0;
                  const rowYPercent = 70 - idx * 10.2;
                  const pathLen = 115;
                  const isFocused = focusedLayer === idx;
                  const isDimmed = focusedLayer !== null && !isFocused;

                  return (
                    <div
                      key={layer.index}
                      className="absolute inset-x-0 flex items-center"
                      style={{
                        top: `${rowYPercent}%`,
                        transform: 'translateY(-50%)',
                        opacity: lineProgress > 0.02 ? (isDimmed ? 0.35 : 1) : 0,
                        transition: 'opacity 0.35s ease',
                      }}
                    >
                      {isRightSide ? (
                        <div className="ml-[55%] flex items-center gap-3">
                          <svg width="96" height="14" className="shrink-0 overflow-visible">
                            <circle
                              cx="4"
                              cy="7"
                              r={isFocused ? '3' : '2'}
                              fill={isFocused ? '#A7C1D9' : '#241E1A'}
                              opacity={lineProgress}
                            />
                            <path
                              d="M 7 7 L 94 7"
                              fill="none"
                              stroke={isFocused ? '#A7C1D9' : 'rgba(36,30,26,0.34)'}
                              strokeWidth="1"
                              strokeDasharray={pathLen}
                              strokeDashoffset={pathLen * (1 - lineProgress)}
                            />
                          </svg>
                          <button
                            type="button"
                            onMouseEnter={() => setFocusedLayer(idx)}
                            onMouseLeave={() => setFocusedLayer(null)}
                            onClick={() => setFocusedLayer((c) => (c === idx ? null : idx))}
                            className="pointer-events-auto bg-transparent border-0 p-0 cursor-pointer flex items-baseline gap-2.5"
                            style={{
                              opacity: lineProgress,
                              transform: `translate3d(${(1 - lineProgress) * 12}px, 0, 0)`,
                            }}
                          >
                            <span className="font-label" style={{ color: '#8A8178' }}>
                              {layer.index}
                            </span>
                            <span className="font-editorial text-[22px] leading-none text-[#241E1A]">
                              {layer.name[lang]}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="mr-[55%] ml-auto flex items-center gap-3">
                          <button
                            type="button"
                            onMouseEnter={() => setFocusedLayer(idx)}
                            onMouseLeave={() => setFocusedLayer(null)}
                            onClick={() => setFocusedLayer((c) => (c === idx ? null : idx))}
                            className="pointer-events-auto bg-transparent border-0 p-0 cursor-pointer flex items-baseline gap-2.5"
                            style={{
                              opacity: lineProgress,
                              transform: `translate3d(${-(1 - lineProgress) * 12}px, 0, 0)`,
                            }}
                          >
                            <span className="font-editorial text-[22px] leading-none text-[#241E1A]">
                              {layer.name[lang]}
                            </span>
                            <span className="font-label" style={{ color: '#8A8178' }}>
                              {layer.index}
                            </span>
                          </button>
                          <svg width="96" height="14" className="shrink-0 overflow-visible">
                            <path
                              d="M 89 7 L 2 7"
                              fill="none"
                              stroke={isFocused ? '#A7C1D9' : 'rgba(36,30,26,0.34)'}
                              strokeWidth="1"
                              strokeDasharray={pathLen}
                              strokeDashoffset={pathLen * (1 - lineProgress)}
                            />
                            <circle
                              cx="92"
                              cy="7"
                              r={isFocused ? '3' : '2'}
                              fill={isFocused ? '#A7C1D9' : '#241E1A'}
                              opacity={lineProgress}
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[44%] flex flex-col-reverse gap-5">
                {layers.map((layer, idx) => {
                  const openStart = 0.14 + idx * 0.07;
                  const openT = Math.max(0, Math.min(1, (effectiveProgress - openStart) / 0.12));
                  const closeT =
                    effectiveProgress > 0.72
                      ? Math.max(0, 1 - (effectiveProgress - 0.72) / 0.12)
                      : 1;
                  const lineProgress = reducedMotion ? 1 : Math.min(openT, closeT);
                  const isFocused = focusedLayer === idx;

                  return (
                    <button
                      key={layer.index}
                      type="button"
                      onClick={() => setFocusedLayer((c) => (c === idx ? null : idx))}
                      className="bg-transparent border-0 p-0 text-left cursor-pointer flex items-center gap-2"
                      style={{
                        opacity: lineProgress,
                        transform: `translate3d(${(1 - lineProgress) * 10}px, 0, 0)`,
                      }}
                    >
                      <svg width="20" height="10" className="shrink-0">
                        <circle cx="3" cy="5" r="2" fill={isFocused ? '#A7C1D9' : '#241E1A'} />
                        <path
                          d="M 5 5 L 19 5"
                          fill="none"
                          stroke={isFocused ? '#A7C1D9' : 'rgba(36,30,26,0.38)'}
                          strokeWidth="1"
                          strokeDasharray="20"
                          strokeDashoffset={20 * (1 - lineProgress)}
                        />
                      </svg>
                      <span className="font-label text-[10px]" style={{ color: '#8A8178' }}>
                        {layer.index}
                      </span>
                      <span className="font-editorial text-[17px] leading-none text-[#241E1A]">
                        {layer.name[lang]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom minimal scrub hairline */}
        <div className="flex items-center justify-center">
          <div
            className="w-36 h-[1px] overflow-hidden"
            style={{ backgroundColor: 'rgba(36, 30, 26, 0.14)' }}
          >
            <div
              className="h-full origin-left"
              style={{
                backgroundColor: '#241E1A',
                transform: `scaleX(${Math.max(0.05, progress)})`,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
