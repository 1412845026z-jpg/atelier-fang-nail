import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { SITE_CONFIG } from '../config';
import { FingerMaskCalibration, NailDesignItem } from '../types/nail';
import { resolveAssetUrl } from '../utils/assetUrl';

export interface ActiveViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface HandStageProps {
  /** Active gel manicure design to composite strictly inside the 5 feathered nail masks */
  design: NailDesignItem;
  /** Previous design kept visible under the active brush wipe so transitions never flash bare nails */
  prevDesign?: NailDesignItem | null;
  /** Incremented whenever a new manicure should perform the 5-finger cuticle-to-tip brush wipe */
  wipeKey?: number;
  /**
   * Optional per-finger reveal state (used by Hero Flower Bud landing).
   * When omitted, all 5 fingers display `design`.
   */
  revealedFingers?: boolean[];
  /** Enable interactive ?calibrate handles for tuning the 5 nail masks */
  calibrateMode?: boolean;
  /** Show subtle 「イメージ」 caption in bottom-right corner */
  showImageTag?: boolean;
  /** Called whenever active viewBox updates so 3D Hero petals can project to exact screen positions */
  onViewBoxChange?: (vb: ActiveViewBox) => void;
  /** Exposed calibrations (can be overridden by ?calibrate) */
  calibrations?: FingerMaskCalibration[];
  onCalibrationsChange?: (next: FingerMaskCalibration[]) => void;
  className?: string;
}

/**
 * Photo-masked Japanese gel manicure compositor.
 * - Base hand photograph stays 100% pixel-locked (same hand, pose, ring, satin cushion, light).
 * - Active gel variant photograph is composited STRICTLY inside 5 calibrated feathered nail masks,
 *   sweeping smoothly from cuticle to tip with a 60ms per-finger stagger.
 * - For magnet / pearl / mirror / glitter looks, adds a 60fps pointer/tilt-reactive optical
 *   shimmer strictly clipped inside the 5 exact nail capsules.
 */
export const HandStage: React.FC<HandStageProps> = ({
  design,
  prevDesign = null,
  wipeKey = 0,
  revealedFingers,
  calibrateMode = false,
  showImageTag = true,
  onViewBoxChange,
  calibrations: externalCals,
  onCalibrationsChange,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [internalCals, setInternalCals] = useState<FingerMaskCalibration[]>(
    SITE_CONFIG.fingerCalibrations
  );
  const cals = externalCals || internalCals;
  const setCals = onCalibrationsChange || setInternalCals;

  const [activeDragIdx, setActiveDragIdx] = useState<number | null>(null);
  const [selectedCalIdx, setSelectedCalIdx] = useState<number>(2);
  const [copiedJson, setCopiedJson] = useState(false);

  // Smart responsive viewBox so ALL 5 nails (x: 585..865, y: 225..640 in 1200×896)
  // remain gracefully centered & 100% uncropped on narrow 375px portrait AND wide 1440px screens!
  const [viewBox, setViewBox] = useState<ActiveViewBox>({
    x: 0,
    y: 0,
    w: SITE_CONFIG.media.handWidth,
    h: SITE_CONFIG.media.handHeight,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const compute = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const aspect = rect.width / rect.height;
      const fullW = SITE_CONFIG.media.handWidth;
      const fullH = SITE_CONFIG.media.handHeight;
      let next: ActiveViewBox;
      if (aspect < 0.85) {
        // Portrait phone (Hero 375x812): center strictly on all 5 nails' centroid (cx=726)
        // so pinky (580) through index (872) ALWAYS sit 100% uncropped with generous left/right margin!
        const targetW = Math.min(fullW, Math.max(410, Math.round(fullH * aspect)));
        const targetX = Math.max(0, Math.min(fullW - targetW, Math.round(726 - targetW * 0.5)));
        next = { x: targetX, y: 0, w: targetW, h: fullH };
      } else if (aspect < 1.18) {
        // Near-square / mobile Vanity hand stage (375x340): include wrist, ring, all 5 nails & silk folds
        next = { x: 255, y: 85, w: 760, h: 660 };
      } else {
        // Landscape desktop/tablet: full lush 4:3 editorial composition with ranunculus & pearls
        next = { x: 0, y: 0, w: fullW, h: fullH };
      }
      setViewBox((prev) =>
        prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h
          ? prev
          : next
      );
      onViewBoxChange?.(next);
    };

    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [onViewBoxChange]);

  // Trigger directional cuticle-to-tip brush wipe whenever `wipeKey` increments
  const [wipeActive, setWipeActive] = useState(true);
  useEffect(() => {
    if (wipeKey === 0) {
      setWipeActive(true);
      return;
    }
    setWipeActive(false);
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        setWipeActive(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
    };
  }, [wipeKey]);

  // 60fps pointer / gyroscope / gentle drift optical highlight controller (zero React re-renders)
  const lightTargetRef = useRef({ x: 0, y: 0 });
  const lightCurrRef = useRef({ x: 0, y: 0 });
  const shimmerGroupRefs = useRef<(SVGGElement | null)[]>([null, null, null, null, null]);

  useEffect(() => {
    if (design.opticalEffect === 'none') return;

    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      lightTargetRef.current.x = Math.max(-1, Math.min(1, e.gamma / 32));
      lightTargetRef.current.y = Math.max(-1, Math.min(1, (e.beta - 42) / 32));
    };
    window.addEventListener('deviceorientation', onOrientation);

    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = (now - start) * 0.001;
      // Subtle ambient breathing drift when pointer is idle so magnetic/aurora light feels alive
      const driftX = Math.sin(t * 0.95) * 0.22;
      const driftY = Math.cos(t * 0.72) * 0.18;
      const tx = lightTargetRef.current.x * 0.85 + driftX;
      const ty = lightTargetRef.current.y * 0.85 + driftY;

      lightCurrRef.current.x += (tx - lightCurrRef.current.x) * 0.1;
      lightCurrRef.current.y += (ty - lightCurrRef.current.y) * 0.1;

      const shiftX = lightCurrRef.current.x * 16;
      const shiftY = lightCurrRef.current.y * 22;

      for (let i = 0; i < 5; i += 1) {
        const g = shimmerGroupRefs.current[i];
        if (g) {
          g.setAttribute('transform', `translate(${shiftX.toFixed(2)}, ${shiftY.toFixed(2)})`);
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('deviceorientation', onOrientation);
      window.cancelAnimationFrame(rafId);
    };
  }, [design.opticalEffect]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      lightTargetRef.current.x = Math.max(-1, Math.min(1, nx));
      lightTargetRef.current.y = Math.max(-1, Math.min(1, ny));

      // Calibration drag handling
      if (calibrateMode && activeDragIdx !== null && svgRef.current) {
        const pt = svgRef.current.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());
        setCals(
          cals.map((c, idx) =>
            idx === activeDragIdx
              ? {
                  ...c,
                  cx: Math.round(svgPt.x * 10) / 10,
                  cy: Math.round(svgPt.y * 10) / 10,
                }
              : c
          )
        );
      }
    },
    [calibrateMode, activeDragIdx, cals, setCals]
  );

  const handlePointerUp = useCallback(() => {
    setActiveDragIdx(null);
  }, []);

  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  const resolveHandSrc = (path: string) => {
    const chosen = isSmallScreen ? path.replace(/\.webp$/, '-800.webp') : path;
    return resolveAssetUrl(chosen);
  };

  const baseHref = useMemo(() => resolveHandSrc(SITE_CONFIG.media.handBase), [isSmallScreen]);
  const activeHref = useMemo(() => resolveHandSrc(design.handImage), [design.handImage, isSmallScreen]);
  const prevHref = useMemo(
    () => (prevDesign ? resolveHandSrc(prevDesign.handImage) : null),
    [prevDesign, isSmallScreen]
  );

  const W = SITE_CONFIG.media.handWidth;
  const H = SITE_CONFIG.media.handHeight;

  const isAnyRevealed = revealedFingers ? revealedFingers.some(Boolean) : true;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
        role="img"
        aria-label={`${SITE_CONFIG.brandName} — ${design.name.ja}`}
      >
        <defs>
          {/* Soft feathered edge filter so variant gel nails blend invisibly into the locked base hand */}
          <filter id={`${uid}-feather`} x="-35%" y="-35%" width="170%" height="170%">
            <feGaussianBlur stdDeviation="3.4" />
          </filter>

          {/* Static union mask of all 5 nails (used for prevDesign underlayer) */}
          <mask id={`${uid}-prev-mask`}>
            <rect x="0" y="0" width={W} height={H} fill="black" />
            <g filter={`url(#${uid}-feather)`}>
              {cals.map((f) => (
                <g key={f.id} transform={`translate(${f.cx}, ${f.cy}) rotate(${f.angleDeg})`}>
                  <rect
                    x={-(f.rx + 8)}
                    y={-(f.ry + 9)}
                    width={(f.rx + 8) * 2}
                    height={(f.ry + 9) * 2}
                    rx={f.rx + 8}
                    ry={f.rx + 8}
                    fill="white"
                  />
                </g>
              ))}
            </g>
          </mask>

          {/* Per-finger cuticle-to-tip clipPaths for animated brush sweep */}
          {cals.map((f, idx) => {
            const revealed = revealedFingers ? Boolean(revealedFingers[idx]) : wipeActive;
            const totalH = (f.ry + 12) * 2;
            const delayMs = revealedFingers ? 0 : idx * 60;
            return (
              <clipPath key={`wipe-${f.id}`} id={`${uid}-wipe-${idx}`}>
                {/* Sweeps upward from cuticle (+ry+12) toward free edge tip (-ry-12) */}
                <rect
                  x={-(f.rx + 14)}
                  y={revealed ? -(f.ry + 12) : f.ry + 12}
                  width={(f.rx + 14) * 2}
                  height={revealed ? totalH : 0}
                  style={{
                    transition: revealed
                      ? `y 0.44s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms, height 0.44s cubic-bezier(0.22, 1, 0.36, 1) ${delayMs}ms`
                      : 'none',
                  }}
                />
              </clipPath>
            );
          })}

          {/* Active feathered nail mask driven by cuticle-to-tip sweep */}
          <mask id={`${uid}-active-mask`}>
            <rect x="0" y="0" width={W} height={H} fill="black" />
            <g filter={`url(#${uid}-feather)`}>
              {cals.map((f, idx) => (
                <g key={f.id} transform={`translate(${f.cx}, ${f.cy}) rotate(${f.angleDeg})`}>
                  <g clipPath={`url(#${uid}-wipe-${idx})`}>
                    <rect
                      x={-(f.rx + 8)}
                      y={-(f.ry + 9)}
                      width={(f.rx + 8) * 2}
                      height={(f.ry + 9) * 2}
                      rx={f.rx + 8}
                      ry={f.rx + 8}
                      fill="white"
                    />
                  </g>
                </g>
              ))}
            </g>
          </mask>

          {/* Tight nail-body clipPaths strictly confining interactive optical light effects inside each nail */}
          {cals.map((f, idx) => (
            <clipPath key={`opt-${f.id}`} id={`${uid}-opt-${idx}`}>
              <rect
                x={-(f.rx - 1)}
                y={-(f.ry - 2)}
                width={(f.rx - 1) * 2}
                height={(f.ry - 2) * 2}
                rx={f.rx - 1}
                ry={f.rx - 1}
              />
            </clipPath>
          ))}

          {/* Magnetic cat-eye diagonal velvet shimmer gradient */}
          <linearGradient id={`${uid}-magnet-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6DCFA" stopOpacity="0" />
            <stop offset="36%" stopColor="#F1EAFF" stopOpacity="0.16" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.54" />
            <stop offset="64%" stopColor="#D7C7F0" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E6DCFA" stopOpacity="0" />
          </linearGradient>

          {/* Aurora opalescent pearl gradient */}
          <linearGradient id={`${uid}-pearl-grad`} x1="0%" y1="0%" x2="100%" y2="85%">
            <stop offset="0%" stopColor="#FFDCEB" stopOpacity="0" />
            <stop offset="35%" stopColor="#FFE5F2" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#D8F0FF" stopOpacity="0.36" />
            <stop offset="78%" stopColor="#FFF5FA" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#FFDCEB" stopOpacity="0" />
          </linearGradient>

          {/* Mirror chrome French tip glint */}
          <linearGradient id={`${uid}-mirror-grad`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.72" />
            <stop offset="55%" stopColor="#E6ECF5" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Fine champagne glitter shimmer */}
          <radialGradient id={`${uid}-glitter-grad`} cx="50%" cy="22%" r="55%">
            <stop offset="0%" stopColor="#FFF6E0" stopOpacity="0.46" />
            <stop offset="45%" stopColor="#E7C893" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#E7C893" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Locked base hand photograph (bare manicured hand on blush satin) */}
        <image
          href={baseHref}
          x="0"
          y="0"
          width={W}
          height={H}
          preserveAspectRatio="none"
        />

        {/* 2. Previous manicure retained softly inside nail masks during switch */}
        {prevHref && !revealedFingers && (
          <image
            href={prevHref}
            x="0"
            y="0"
            width={W}
            height={H}
            preserveAspectRatio="none"
            mask={`url(#${uid}-prev-mask)`}
          />
        )}

        {/* 3. Active photographic gel manicure composited strictly through the 5 feathered nail masks */}
        <image
          href={activeHref}
          x="0"
          y="0"
          width={W}
          height={H}
          preserveAspectRatio="none"
          mask={`url(#${uid}-active-mask)`}
        />

        {/* 4. Interactive 60fps optical shimmer layer strictly confined within each nail capsule */}
        {design.opticalEffect !== 'none' && isAnyRevealed && (
          <g style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}>
            {cals.map((f, idx) => {
              const revealed = revealedFingers ? Boolean(revealedFingers[idx]) : true;
              if (!revealed) return null;
              return (
                <g
                  key={`shimmer-${f.id}`}
                  transform={`translate(${f.cx}, ${f.cy}) rotate(${f.angleDeg})`}
                  clipPath={`url(#${uid}-opt-${idx})`}
                >
                  <g
                    ref={(node) => {
                      shimmerGroupRefs.current[idx] = node;
                    }}
                  >
                    {design.opticalEffect === 'magnet' && (
                      <rect
                        x={-f.rx * 2.2}
                        y={-f.ry * 1.4}
                        width={f.rx * 4.4}
                        height={f.ry * 2.8}
                        fill={`url(#${uid}-magnet-grad)`}
                        opacity="0.72"
                      />
                    )}
                    {design.opticalEffect === 'pearl' && (
                      <ellipse
                        cx="0"
                        cy="-2"
                        rx={f.rx * 1.65}
                        ry={f.ry * 1.35}
                        fill={`url(#${uid}-pearl-grad)`}
                        opacity="0.78"
                      />
                    )}
                    {design.opticalEffect === 'mirror' && (
                      <rect
                        x={-f.rx * 1.6}
                        y={-f.ry - 4}
                        width={f.rx * 3.2}
                        height={f.ry * 0.52}
                        fill={`url(#${uid}-mirror-grad)`}
                        opacity="0.82"
                      />
                    )}
                    {design.opticalEffect === 'glitter' && (
                      <ellipse
                        cx="0"
                        cy={-f.ry * 0.58}
                        rx={f.rx * 1.35}
                        ry={f.ry * 0.78}
                        fill={`url(#${uid}-glitter-grad)`}
                        opacity="0.78"
                      />
                    )}
                  </g>
                </g>
              );
            })}
          </g>
        )}

        {/* 5. Optional ?calibrate visual handles */}
        {calibrateMode && (
          <g>
            {cals.map((f, idx) => {
              const selected = idx === selectedCalIdx;
              return (
                <g
                  key={`cal-${f.id}`}
                  transform={`translate(${f.cx}, ${f.cy}) rotate(${f.angleDeg})`}
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedCalIdx(idx);
                    setActiveDragIdx(idx);
                  }}
                >
                  <rect
                    x={-f.rx}
                    y={-f.ry}
                    width={f.rx * 2}
                    height={f.ry * 2}
                    rx={f.rx}
                    ry={f.rx}
                    fill={selected ? 'rgba(201, 152, 154, 0.22)' : 'rgba(59, 43, 44, 0.08)'}
                    stroke={selected ? '#C9989A' : '#3B2B2C'}
                    strokeWidth={selected ? 2.4 : 1.5}
                    strokeDasharray="4 3"
                  />
                  <circle cx="0" cy="0" r="4" fill={selected ? '#C9989A' : '#3B2B2C'} />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Subtle 「イメージ」 caption required on design visuals */}
      {showImageTag && isAnyRevealed && (
        <span
          className="pointer-events-none absolute bottom-3 right-3.5 text-[10px] tracking-[0.14em] px-2 py-0.5 rounded-full"
          style={{
            color: '#7E6B6C',
            backgroundColor: 'rgba(247, 241, 238, 0.72)',
          }}
        >
          イメージ
        </span>
      )}

      {/* ?calibrate fine-tuning drawer */}
      {calibrateMode && (
        <div
          className="absolute top-3 left-3 z-30 w-[238px] p-3.5 rounded-xl text-[11px] space-y-2.5"
          style={{
            backgroundColor: 'rgba(251, 247, 244, 0.95)',
            border: '1px solid rgba(199, 169, 127, 0.5)',
            color: '#3B2B2C',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="font-num tracking-[0.1em]">CALIBRATE MASKS</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(JSON.stringify(cals, null, 2));
                setCopiedJson(true);
                window.setTimeout(() => setCopiedJson(false), 1800);
              }}
              className="bg-transparent border border-[#C7A97F] rounded px-2 py-0.5 text-[10px] cursor-pointer text-[#3B2B2C]"
            >
              {copiedJson ? 'Copied' : 'Copy JSON'}
            </button>
          </div>
          <div className="flex gap-1">
            {cals.map((f, idx) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedCalIdx(idx)}
                className="flex-1 py-1 rounded text-[10px] border cursor-pointer"
                style={{
                  backgroundColor: selectedCalIdx === idx ? '#C9989A' : 'transparent',
                  color: selectedCalIdx === idx ? '#F7F1EE' : '#3B2B2C',
                  borderColor: 'rgba(59, 43, 44, 0.16)',
                }}
              >
                {f.label.ja}
              </button>
            ))}
          </div>
          {(['rx', 'ry', 'angleDeg'] as const).map((field) => {
            const curr = cals[selectedCalIdx];
            const min = field === 'angleDeg' ? -90 : 10;
            const max = field === 'angleDeg' ? 90 : 65;
            return (
              <label key={field} className="block">
                <span className="flex justify-between text-[10px] text-[#7E6B6C]">
                  <span>{field}</span>
                  <span className="font-num">{curr[field]}</span>
                </span>
                <input
                  type="range"
                  min={min}
                  max={max}
                  step="0.5"
                  value={curr[field]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCals(
                      cals.map((c, idx) =>
                        idx === selectedCalIdx ? { ...c, [field]: val } : c
                      )
                    );
                  }}
                  className="sou-slider mt-1"
                />
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};
