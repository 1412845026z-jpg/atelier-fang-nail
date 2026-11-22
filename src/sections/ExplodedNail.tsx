import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';
import { NailDesignState } from '../types/nail';
import {
  buildAccentPositions,
  buildArtLinePaths,
  buildFrenchSmileMaskPath,
  buildNailControlPoints,
  controlPointsToPathD,
  controlPointsToTipRimD,
  LENGTH_MULTIPLIERS,
} from '../utils/nailGeometry';
import { MaskedLines } from '../components/MaskedLines';

gsap.registerPlugin(ScrollTrigger);

interface ExplodedNailProps {
  lang: Lang;
  /** Reuses the user's live Try-on Studio design (shape, length, color, finish, art) */
  design: NailDesignState;
}

export const ExplodedNail: React.FC<ExplodedNailProps> = ({ lang, design }) => {
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
      onUpdate: (self) => setProgress(self.progress),
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  // Extract representative finger design (ring finger if accented, else middle finger)
  const heroFinger = useMemo(() => {
    const ring = design.fingers[1];
    const mid = design.fingers[2];
    if (ring.art !== 'none' || ring.colorId !== mid.colorId) return ring;
    return mid;
  }, [design.fingers]);

  const colorHex =
    SITE_CONFIG.palette.find((p) => p.id === heroFinger.colorId)?.hex || '#A9BFD4';
  const frenchHex =
    SITE_CONFIG.palette.find((p) => p.id === heroFinger.frenchColorId)?.hex || '#A9BFD4';

  // Procedural nail silhouette matching Try-on Studio shape & proportional length
  const { nailD, rimD, frenchD, linePaths, accents, nailLen } = useMemo(() => {
    const w = 152;
    const mult = LENGTH_MULTIPLIERS[design.length];
    const len = Math.round(180 * Math.min(1.5, Math.max(0.95, mult * 0.92)));
    const pts = buildNailControlPoints(design.shape, w, len);
    return {
      nailD: controlPointsToPathD(pts),
      rimD: controlPointsToTipRimD(pts),
      frenchD: buildFrenchSmileMaskPath(w, len, heroFinger.frenchWidth, heroFinger.frenchCurve),
      linePaths: buildArtLinePaths(w, len, heroFinger.linePattern),
      accents: buildAccentPositions(w, len, heroFinger.accentCount),
      nailLen: len,
    };
  }, [design.length, design.shape, heroFinger]);

  const renderSpecimenLayer = (layerIdx: number, highlighted: boolean) => {
    const stroke = highlighted ? '#A7C1D9' : 'rgba(36,30,26,0.18)';
    const sw = highlighted ? '1.8' : '1.0';
    const vbY = -nailLen - 22;
    const vbH = nailLen + 40;

    return (
      <svg
        viewBox={`-96 ${vbY} 192 ${vbH}`}
        className="w-full h-full overflow-visible"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id={`exp-clip-${layerIdx}`}>
            <path d={nailD} />
          </clipPath>
          <linearGradient id={`exp-c-curve-${layerIdx}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1B1512" stopOpacity="0.22" />
            <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#1B1512" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="exp-top-spec" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="exp-magnet-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFDF9" stopOpacity="0.82" />
            <stop offset="50%" stopColor="#F0E3D3" stopOpacity="0.34" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {layerIdx === 0 && (
          <>
            <path d={nailD} fill="#E6D5C8" fillOpacity="0.92" stroke={stroke} strokeWidth={sw} />
            <g clipPath={`url(#exp-clip-${layerIdx})`}>
              <ellipse cx="0" cy="-6" rx="46" ry="26" fill="#F8F3ED" opacity="0.65" />
              <rect x="-96" y={vbY} width="192" height={vbH} fill={`url(#exp-c-curve-${layerIdx})`} />
            </g>
          </>
        )}

        {layerIdx === 1 && (
          <>
            <path d={nailD} fill="#F7F3EC" fillOpacity="0.78" stroke={stroke} strokeWidth={sw} />
            <g clipPath={`url(#exp-clip-${layerIdx})`}>
              <ellipse
                cx="0"
                cy={-nailLen * 0.48}
                rx="38"
                ry={nailLen * 0.34}
                fill="#FFFFFF"
                opacity="0.36"
              />
              <rect x="-96" y={vbY} width="192" height={vbH} fill={`url(#exp-c-curve-${layerIdx})`} />
            </g>
          </>
        )}

        {layerIdx === 2 && (
          <>
            <path
              d={nailD}
              fill={colorHex}
              fillOpacity={heroFinger.finish === 'sheer' ? 0.68 : 0.92}
              stroke={stroke}
              strokeWidth={sw}
            />
            <g clipPath={`url(#exp-clip-${layerIdx})`}>
              <rect x="-96" y={vbY} width="192" height={vbH} fill={`url(#exp-c-curve-${layerIdx})`} />
            </g>
          </>
        )}

        {layerIdx === 3 && (
          <>
            <path d={nailD} fill="#FFFFFF" fillOpacity="0.14" stroke={stroke} strokeWidth={sw} />
            <g clipPath={`url(#exp-clip-${layerIdx})`}>
              {heroFinger.finish === 'magnet' && (
                <ellipse
                  cx="0"
                  cy={-nailLen * 0.52}
                  rx="56"
                  ry={nailLen * 0.32}
                  fill="url(#exp-magnet-glow)"
                  transform={`rotate(-22 0 ${-nailLen * 0.52})`}
                />
              )}
              {heroFinger.art === 'french' && (
                <path d={frenchD} fill={frenchHex} fillOpacity="0.94" />
              )}
              {heroFinger.art === 'line' &&
                linePaths.map((d, i) => (
                  <path
                    key={i}
                    d={d}
                    fill="none"
                    stroke={heroFinger.colorId === 'sumi' ? '#E6DED3' : '#241E1A'}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                ))}
              {(heroFinger.art === 'pearl' || heroFinger.art === 'stud') &&
                accents.map((a, i) => (
                  <circle
                    key={i}
                    cx={a.x}
                    cy={a.y}
                    r={a.r * 1.1}
                    fill={heroFinger.art === 'pearl' ? '#F5F2EC' : '#C8A977'}
                    stroke="rgba(36,30,26,0.28)"
                    strokeWidth="1"
                  />
                ))}
              {heroFinger.art === 'none' && heroFinger.finish !== 'magnet' && (
                <path
                  d={`M -48 ${-nailLen * 0.25} C -12 ${-nailLen * 0.48}, 22 ${
                    -nailLen * 0.65
                  }, 42 ${-nailLen * 0.88}`}
                  fill="none"
                  stroke="rgba(36,30,26,0.26)"
                  strokeWidth="1.6"
                  strokeDasharray="4 4"
                />
              )}
            </g>
          </>
        )}

        {layerIdx === 4 && (
          <>
            <path d={nailD} fill="#FFFFFF" fillOpacity="0.14" stroke={stroke} strokeWidth={sw} />
            <g clipPath={`url(#exp-clip-${layerIdx})`}>
              <path
                d={`M -34 -18 L -10 -18 L 40 ${-nailLen + 10} L 20 ${-nailLen + 10} Z`}
                fill="url(#exp-top-spec)"
                opacity={heroFinger.finish === 'matte' ? 0.28 : 0.92}
              />
            </g>
            <path d={rimD} fill="none" stroke="#FFFFFF" strokeWidth="1.8" opacity="0.72" />
          </>
        )}
      </svg>
    );
  };

  const effectiveProgress = reducedMotion ? 0.62 : progress;
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

  const closingVisible = reducedMotion || progress >= 0.84;
  const maxStepPx = isMobile ? 38 : 66;
  const layers = SITE_CONFIG.exploded.layers;

  return (
    <section
      id="craft"
      ref={sectionRef}
      className="relative z-10 w-full hairline-t"
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
            : 'sticky top-0 h-[100svh] w-full overflow-hidden px-5 sm:px-8 lg:px-12 pt-[76px] pb-10 sm:pt-[84px] sm:pb-12 flex flex-col justify-between'
        }
      >
        {/* Crisp Section Title: 5 LAYERS / 5層構造 */}
        <div className="flex items-baseline justify-between">
          <h2 className="font-editorial m-0 text-[26px] sm:text-[32px] leading-none text-[#241E1A]">
            {SITE_CONFIG.exploded.heading[lang]}
          </h2>
          <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
            {spreadFactor > 0.15 ? '05 / 05' : '01 / 05'}
          </span>
        </div>

        {/* Large ~52vh Isometric 3D Nail Stack reflecting user's live Try-on design */}
        <div className="relative flex-1 flex items-center justify-center my-2">
          <div
            className="relative w-full max-w-[1120px] h-[54vh] min-h-[380px] flex items-center justify-center"
            style={{ perspective: '1300px' }}
          >
            <div
              className="relative"
              style={{
                width: isMobile ? '176px' : '270px',
                height: isMobile ? '280px' : '430px',
                transformStyle: 'preserve-3d',
                transform: `translate3d(${isMobile ? '-48px' : '0px'}, ${
                  isMobile ? '14px' : '24px'
                }, 0) rotateX(58deg) rotateZ(-34deg)`,
              }}
            >
              {layers.map((layer, idx) => {
                const isFocused = focusedLayer === idx;
                const isDimmed = focusedLayer !== null && !isFocused;
                const zPx = (idx - 2) * maxStepPx * spreadFactor;
                const slideOut = isFocused && spreadFactor > 0.2 ? 20 : 0;

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
                      opacity: isDimmed ? 0.3 : 1,
                      transition:
                        'opacity 0.42s cubic-bezier(0.22, 1, 0.36, 1), transform 0.52s cubic-bezier(0.22, 1, 0.36, 1)',
                      willChange: 'transform, opacity',
                    }}
                  >
                    {renderSpecimenLayer(idx, isFocused)}
                  </div>
                );
              })}
            </div>

            {/* Desktop High-Contrast Callouts (>= 14px, primary cocoa ink #241E1A) */}
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
                  const rowYPercent = 72 - idx * 11;
                  const pathLen = 116;
                  const isFocused = focusedLayer === idx;
                  const isDimmed = focusedLayer !== null && !isFocused;

                  return (
                    <div
                      key={layer.index}
                      className="absolute inset-x-0 flex items-center"
                      style={{
                        top: `${rowYPercent}%`,
                        transform: 'translateY(-50%)',
                        opacity: lineProgress > 0.02 ? (isDimmed ? 0.32 : 1) : 0,
                        transition: 'opacity 0.35s ease',
                      }}
                    >
                      {isRightSide ? (
                        <div className="ml-[57%] flex items-center gap-3.5">
                          <svg width="96" height="14" className="shrink-0 overflow-visible">
                            <circle
                              cx="4"
                              cy="7"
                              r={isFocused ? '3.5' : '2.5'}
                              fill={isFocused ? '#A7C1D9' : '#241E1A'}
                              opacity={lineProgress}
                            />
                            <path
                              d="M 7 7 L 94 7"
                              fill="none"
                              stroke={isFocused ? '#A7C1D9' : 'rgba(36,30,26,0.45)'}
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
                            className="pointer-events-auto bg-transparent border-0 p-0 cursor-pointer flex items-baseline gap-3"
                            style={{
                              opacity: lineProgress,
                              transform: `translate3d(${(1 - lineProgress) * 12}px, 0, 0)`,
                            }}
                          >
                            <span
                              className="font-label"
                              style={{ fontSize: '13px', color: '#241E1A' }}
                            >
                              {layer.index}
                            </span>
                            <span className="font-editorial text-[22px] leading-none text-[#241E1A]">
                              {layer.name[lang]}
                            </span>
                          </button>
                        </div>
                      ) : (
                        <div className="mr-[57%] ml-auto flex items-center gap-3.5">
                          <button
                            type="button"
                            onMouseEnter={() => setFocusedLayer(idx)}
                            onMouseLeave={() => setFocusedLayer(null)}
                            onClick={() => setFocusedLayer((c) => (c === idx ? null : idx))}
                            className="pointer-events-auto bg-transparent border-0 p-0 cursor-pointer flex items-baseline gap-3"
                            style={{
                              opacity: lineProgress,
                              transform: `translate3d(${-(1 - lineProgress) * 12}px, 0, 0)`,
                            }}
                          >
                            <span className="font-editorial text-[22px] leading-none text-[#241E1A]">
                              {layer.name[lang]}
                            </span>
                            <span
                              className="font-label"
                              style={{ fontSize: '13px', color: '#241E1A' }}
                            >
                              {layer.index}
                            </span>
                          </button>
                          <svg width="96" height="14" className="shrink-0 overflow-visible">
                            <path
                              d="M 89 7 L 2 7"
                              fill="none"
                              stroke={isFocused ? '#A7C1D9' : 'rgba(36,30,26,0.45)'}
                              strokeWidth="1"
                              strokeDasharray={pathLen}
                              strokeDashoffset={pathLen * (1 - lineProgress)}
                            />
                            <circle
                              cx="92"
                              cy="7"
                              r={isFocused ? '3.5' : '2.5'}
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
              /* Mobile >= 14px primary-ink callouts */
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[45%] flex flex-col-reverse gap-4">
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
                      <svg width="18" height="10" className="shrink-0">
                        <circle cx="3" cy="5" r="2.2" fill={isFocused ? '#A7C1D9' : '#241E1A'} />
                        <path
                          d="M 5 5 L 17 5"
                          fill="none"
                          stroke={isFocused ? '#A7C1D9' : 'rgba(36,30,26,0.45)'}
                          strokeWidth="1"
                          strokeDasharray="18"
                          strokeDashoffset={18 * (1 - lineProgress)}
                        />
                      </svg>
                      <span className="font-label" style={{ fontSize: '12px', color: '#241E1A' }}>
                        {layer.index}
                      </span>
                      <span className="font-editorial text-[16px] leading-none text-[#241E1A]">
                        {layer.name[lang]}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Closing unification line: "見えるのは1枚。重ねているのは5層。" */}
        <div className="min-h-[56px] flex items-end justify-between gap-6">
          <MaskedLines
            lines={[SITE_CONFIG.exploded.closingLine[lang]]}
            phase={closingVisible ? 'active' : 'before'}
            reducedMotion={reducedMotion}
            lineClassName="font-editorial jp-heading text-[22px] sm:text-[34px] lg:text-[40px] leading-[1.16] text-[#241E1A]"
          />
          <div
            className="hidden sm:block w-36 h-[1px] shrink-0 mb-3 overflow-hidden"
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
