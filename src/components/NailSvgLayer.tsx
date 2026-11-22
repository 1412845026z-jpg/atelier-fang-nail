import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react';
import { SITE_CONFIG } from '../config';
import {
  FingerCalibration,
  FingerIndex,
  NailDesignState,
} from '../types/nail';
import {
  buildAccentPositions,
  buildArtLinePaths,
  buildFrenchSmileMaskPath,
  buildNailControlPoints,
  controlPointsToPathD,
  controlPointsToTipRimD,
  LENGTH_MULTIPLIERS,
  lerpControlPoints,
} from '../utils/nailGeometry';
import { resolveAssetUrl } from '../utils/assetUrl';

export interface NailStageHandle {
  /** Updates specular / magnet / chrome light vector in [-1, 1] at 60fps without React re-render */
  setLight: (lx: number, ly: number) => void;
  getSvgElement: () => SVGSVGElement | null;
}

interface NailSvgLayerProps {
  design: NailDesignState;
  calibrations: FingerCalibration[];
  imageHref: string;
  imageWidth: number;
  imageHeight: number;
  /** Increment to trigger sequential 5-finger brush paint stroke animation */
  paintTrigger?: number;
  /** Optional scroll-driven paint progress 0..1 (overrides trigger when provided) */
  scrollPaintProgress?: number | null;
  selectedFinger?: FingerIndex | null;
  onSelectFinger?: (idx: FingerIndex) => void;
  /** Optional bare-vs-design vertical split position in 0..1 SVG width */
  compareSplit?: number | null;
  /** Enable ?calibrate draggable root/tip/width handles */
  calibrateMode?: boolean;
  onUpdateCalibration?: (idx: FingerIndex, next: FingerCalibration) => void;
  /** Optional interactive 2-click-per-finger own-hand setup pins */
  ownHandPins?: { x: number; y: number }[];
  onStageSvgClick?: (svgX: number, svgY: number) => void;
  className?: string;
  idPrefix?: string;
}

export const NailSvgLayer = forwardRef<NailStageHandle, NailSvgLayerProps>(
  (
    {
      design,
      calibrations,
      imageHref,
      imageWidth,
      imageHeight,
      paintTrigger = 0,
      scrollPaintProgress = null,
      selectedFinger = null,
      onSelectFinger,
      compareSplit = null,
      calibrateMode = false,
      onUpdateCalibration,
      ownHandPins,
      onStageSvgClick,
      className = '',
      idPrefix = 'tryon',
    },
    ref
  ) => {
    const svgRef = useRef<SVGSVGElement | null>(null);

    // Direct DOM refs for 60fps shape/length morphing & light movement
    const nailPathRefs = useRef<(SVGPathElement | null)[]>([]);
    const clipPathRefs = useRef<(SVGPathElement | null)[]>([]);
    const shadowPathRefs = useRef<(SVGPathElement | null)[]>([]);
    const rimPathRefs = useRef<(SVGPathElement | null)[]>([]);
    const auraPathRefs = useRef<(SVGPathElement | null)[]>([]);
    const brushRectRefs = useRef<(SVGRectElement | null)[]>([]);
    const lightGroupRefs = useRef<(SVGGElement | null)[]>([]);
    const magnetGroupRefs = useRef<(SVGGElement | null)[]>([]);
    const chromeGroupRefs = useRef<(SVGGElement | null)[]>([]);
    const pearlGroupRefs = useRef<(SVGGElement | null)[]>([]);

    const currentPointsRef = useRef<number[][]>([]);
    const draggingCalRef = useRef<{
      idx: FingerIndex;
      handle: 'root' | 'tip' | 'width';
    } | null>(null);

    const paletteMap = useMemo(() => {
      const m = new Map<string, string>();
      SITE_CONFIG.palette.forEach((s) => m.set(s.id, s.hex));
      return m;
    }, []);

    // Compute target control points for all 5 fingers
    const targetPoints = useMemo(() => {
      const mult = LENGTH_MULTIPLIERS[design.length];
      return calibrations.map((cal) =>
        buildNailControlPoints(design.shape, cal.width, cal.baseLength * mult)
      );
    }, [calibrations, design.length, design.shape]);

    // Expose 60fps imperative light update handle (ZERO React state updates!)
    useImperativeHandle(
      ref,
      () => ({
        setLight: (lx: number, ly: number) => {
          const cx = Math.max(-1, Math.min(1, lx));
          const cy = Math.max(-1, Math.min(1, ly));

          for (let i = 0; i < 5; i += 1) {
            const gLight = lightGroupRefs.current[i];
            if (gLight) {
              gLight.setAttribute(
                'transform',
                `translate(${(cx * 6.5).toFixed(2)}, ${(cy * 4.5).toFixed(2)})`
              );
            }
            const gMag = magnetGroupRefs.current[i];
            if (gMag) {
              gMag.setAttribute(
                'transform',
                `translate(${(cx * 15).toFixed(2)}, ${(cy * 11).toFixed(2)}) rotate(${(
                  cx * 18
                ).toFixed(2)} 0 -30)`
              );
            }
            const gChrome = chromeGroupRefs.current[i];
            if (gChrome) {
              gChrome.setAttribute(
                'transform',
                `translate(${(cx * 14).toFixed(2)}, ${(cy * 5).toFixed(2)})`
              );
            }
            const gPearl = pearlGroupRefs.current[i];
            if (gPearl) {
              gPearl.setAttribute(
                'transform',
                `translate(${(cx * 8).toFixed(2)}, ${(cy * 6).toFixed(2)})`
              );
            }
          }
        },
        getSvgElement: () => svgRef.current,
      }),
      []
    );

    const applyPointsToDom = (ptsPerFinger: number[][]) => {
      ptsPerFinger.forEach((pts, i) => {
        const d = controlPointsToPathD(pts);
        const rimD = controlPointsToTipRimD(pts);
        nailPathRefs.current[i]?.setAttribute('d', d);
        clipPathRefs.current[i]?.setAttribute('d', d);
        shadowPathRefs.current[i]?.setAttribute('d', d);
        rimPathRefs.current[i]?.setAttribute('d', rimD);
        auraPathRefs.current[i]?.setAttribute('d', d);
      });
    };

    // Smooth 0.5s morph interpolation when switching shape or length
    useEffect(() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (currentPointsRef.current.length !== 5 || reduced) {
        currentPointsRef.current = targetPoints;
        applyPointsToDom(targetPoints);
        return;
      }

      const startPoints = currentPointsRef.current.map((arr) => [...arr]);
      const startTime = performance.now();
      const duration = 500;
      let rafId = 0;

      const step = (now: number) => {
        const raw = Math.min(1, (now - startTime) / duration);
        // Expo-out easing: 1 - (1 - t)^3
        const eased = 1 - Math.pow(1 - raw, 3);
        const blended = startPoints.map((sp, idx) =>
          lerpControlPoints(sp, targetPoints[idx], eased)
        );
        currentPointsRef.current = blended;
        applyPointsToDom(blended);
        if (raw < 1) {
          rafId = window.requestAnimationFrame(step);
        }
      };

      rafId = window.requestAnimationFrame(step);
      return () => window.cancelAnimationFrame(rafId);
    }, [targetPoints]);

    // Scroll-controlled progressive brush reveal (used during Hero climax)
    useEffect(() => {
      if (scrollPaintProgress === null || scrollPaintProgress === undefined) return;
      const mult = LENGTH_MULTIPLIERS[design.length];
      calibrations.forEach((cal, idx) => {
        const rect = brushRectRefs.current[idx];
        if (!rect) return;
        const maxH = cal.baseLength * mult + 28;
        // Stagger each finger slightly across 0..1
        const start = idx * 0.1;
        const local = Math.max(0, Math.min(1, (scrollPaintProgress - start) / 0.58));
        const eased = 1 - Math.pow(1 - local, 3);
        const h = maxH * eased;
        rect.setAttribute('y', String(10 - h));
        rect.setAttribute('height', String(Math.max(0, h)));
      });
    }, [calibrations, design.length, scrollPaintProgress]);

    // Triggered sequential 5-finger brush-stroke reveal (0.06s stagger) when color/preset changes
    useEffect(() => {
      if (scrollPaintProgress !== null && scrollPaintProgress !== undefined) return;
      const mult = LENGTH_MULTIPLIERS[design.length];
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (paintTrigger === 0 || reduced) {
        calibrations.forEach((cal, idx) => {
          const rect = brushRectRefs.current[idx];
          if (!rect) return;
          const maxH = cal.baseLength * mult + 28;
          rect.setAttribute('y', String(10 - maxH));
          rect.setAttribute('height', String(maxH));
        });
        return;
      }

      const startTime = performance.now();
      const staggerMs = 60;
      const fingerDurMs = 420;
      const totalDur = staggerMs * 4 + fingerDurMs;
      let rafId = 0;

      const animate = (now: number) => {
        const elapsed = now - startTime;
        calibrations.forEach((cal, idx) => {
          const rect = brushRectRefs.current[idx];
          if (!rect) return;
          const maxH = cal.baseLength * mult + 28;
          const local = Math.max(0, Math.min(1, (elapsed - idx * staggerMs) / fingerDurMs));
          const eased = 1 - Math.pow(1 - local, 3);
          const h = maxH * eased;
          rect.setAttribute('y', String(10 - h));
          rect.setAttribute('height', String(Math.max(0, h)));
        });

        if (elapsed < totalDur) {
          rafId = window.requestAnimationFrame(animate);
        }
      };

      rafId = window.requestAnimationFrame(animate);
      return () => window.cancelAnimationFrame(rafId);
    }, [calibrations, design.length, paintTrigger, scrollPaintProgress]);

    // Convert screen pointer coordinates -> exact SVG viewBox coordinates
    const clientToSvgPoint = (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    };

    const handleCalPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
      if (!calibrateMode || !draggingCalRef.current || !onUpdateCalibration) return;
      const pt = clientToSvgPoint(e.clientX, e.clientY);
      if (!pt) return;

      const { idx, handle } = draggingCalRef.current;
      const cur = calibrations[idx];
      if (!cur) return;

      if (handle === 'root') {
        onUpdateCalibration(idx, {
          ...cur,
          cx: Math.round(pt.x),
          cy: Math.round(pt.y),
        });
      } else if (handle === 'tip') {
        const dx = pt.x - cur.cx;
        const dy = pt.y - cur.cy;
        const dist = Math.max(22, Math.hypot(dx, dy) / Math.max(0.5, cur.scaleY));
        const angleRad = Math.atan2(dx, -dy);
        onUpdateCalibration(idx, {
          ...cur,
          angleDeg: Number(((angleRad * 180) / Math.PI).toFixed(1)),
          baseLength: Math.round(dist),
        });
      } else if (handle === 'width') {
        const angleRad = (cur.angleDeg * Math.PI) / 180;
        const dx = pt.x - cur.cx;
        const dy = pt.y - cur.cy;
        // Project onto local perpendicular X axis
        const localX = dx * Math.cos(angleRad) + dy * Math.sin(angleRad);
        onUpdateCalibration(idx, {
          ...cur,
          width: Math.max(16, Math.min(72, Math.round(Math.abs(localX) * 2))),
        });
      }
    };

    const handleCalPointerUp = () => {
      draggingCalRef.current = null;
    };

    const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!onStageSvgClick) return;
      const pt = clientToSvgPoint(e.clientX, e.clientY);
      if (pt) {
        onStageSvgClick(Math.round(pt.x), Math.round(pt.y));
      }
    };

    const mult = LENGTH_MULTIPLIERS[design.length];
    const resolvedImage = resolveAssetUrl(imageHref);
    const compareClipX =
      compareSplit !== null && compareSplit !== undefined ? imageWidth * compareSplit : 0;

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        preserveAspectRatio="xMidYMid slice"
        onPointerMove={handleCalPointerMove}
        onPointerUp={handleCalPointerUp}
        onPointerLeave={handleCalPointerUp}
        onClick={handleSvgClick}
        className={`block w-full h-full select-none ${className}`}
      >
        <defs>
          {/* Soft cast shadow filter for extended free edge */}
          <filter
            id={`${idPrefix}-ext-shadow`}
            x="-40%"
            y="-40%"
            width="180%"
            height="180%"
          >
            <feGaussianBlur stdDeviation="3.4" />
          </filter>

          {/* Subtle organic paper/matte grain filter (4% velvet matte texture) */}
          <filter id={`${idPrefix}-matte-noise`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.15"
              numOctaves="2"
              result="noise"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.085 0"
              in="noise"
              result="whiteNoise"
            />
            <feComposite in="whiteNoise" in2="SourceGraphic" operator="in" />
          </filter>

          {/* Soft 1.5px cuticle feather mask so base melts naturally into skin */}
          <linearGradient id={`${idPrefix}-cuticle-fade`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0.28" />
            <stop offset="10%" stopColor="white" stopOpacity="0.95" />
            <stop offset="18%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </linearGradient>

          {/* Horizontal C-curve shading: sides ~14% darker, center softly lit */}
          <linearGradient id={`${idPrefix}-c-curve`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1B1512" stopOpacity="0.24" />
            <stop offset="16%" stopColor="#1B1512" stopOpacity="0.06" />
            <stop offset="44%" stopColor="#FFFFFF" stopOpacity="0.11" />
            <stop offset="68%" stopColor="#FFFFFF" stopOpacity="0.03" />
            <stop offset="86%" stopColor="#1B1512" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#1B1512" stopOpacity="0.26" />
          </linearGradient>

          {/* Vertical sheer/jelly gradient: deeper near cuticle, airy translucent at tip */}
          <linearGradient id={`${idPrefix}-sheer-depth`} x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.0" />
            <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.22" />
          </linearGradient>

          {/* Gloss vertical specular ribbon */}
          <linearGradient id={`${idPrefix}-gloss-ribbon`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="48%" stopColor="#FFFFFF" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>

          {/* Chrome mirror metallic high-contrast reflection */}
          <linearGradient id={`${idPrefix}-chrome-band`} x1="0%" y1="0%" x2="100%" y2="15%">
            <stop offset="0%" stopColor="#1A1716" stopOpacity="0.34" />
            <stop offset="28%" stopColor="#FFFFFF" stopOpacity="0.78" />
            <stop offset="46%" stopColor="#DCE6F0" stopOpacity="0.24" />
            <stop offset="66%" stopColor="#FFFFFF" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#1A1716" stopOpacity="0.32" />
          </linearGradient>

          {/* Pearl / Mother-of-pearl low-opacity iridescence */}
          <linearGradient id={`${idPrefix}-pearl-irid`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6EEF6" stopOpacity="0.46" />
            <stop offset="36%" stopColor="#F9EFEA" stopOpacity="0.34" />
            <stop offset="68%" stopColor="#E3EFE8" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#F3ECF5" stopOpacity="0.32" />
          </linearGradient>

          {/* Velvet magnet (cat-eye) glowing optical beam */}
          <radialGradient id={`${idPrefix}-magnet-beam`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBF4" stopOpacity="0.78" />
            <stop offset="34%" stopColor="#F2E4D3" stopOpacity="0.44" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>

          {/* Micro Akoya pearl gradient */}
          <radialGradient id={`${idPrefix}-pearl-bead`} cx="35%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#EFECE5" />
            <stop offset="100%" stopColor="#BEB6AB" />
          </radialGradient>

          {/* Brushed champagne gold micro-stud gradient */}
          <radialGradient id={`${idPrefix}-gold-stud`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#F8EBD2" />
            <stop offset="50%" stopColor="#C8A977" />
            <stop offset="100%" stopColor="#7C633D" />
          </radialGradient>

          {/* Bare vs design comparison clip */}
          {compareSplit !== null && compareSplit !== undefined && (
            <clipPath id={`${idPrefix}-compare-clip`}>
              <rect
                x={compareClipX}
                y={0}
                width={Math.max(0, imageWidth - compareClipX)}
                height={imageHeight}
              />
            </clipPath>
          )}

          {/* Per-finger clip paths & brush stroke reveal clips */}
          {calibrations.map((cal, idx) => {
            const pts = targetPoints[idx];
            const d = controlPointsToPathD(pts);
            const maxH = cal.baseLength * mult + 28;
            return (
              <React.Fragment key={cal.id}>
                <clipPath id={`${idPrefix}-nail-clip-${idx}`}>
                  <path
                    ref={(el) => {
                      clipPathRefs.current[idx] = el;
                    }}
                    d={d}
                  />
                </clipPath>

                {/* Cuticle soft-feather opacity mask */}
                <mask id={`${idPrefix}-cuticle-mask-${idx}`}>
                  <rect
                    x={-cal.width * 1.4}
                    y={-maxH - 12}
                    width={cal.width * 2.8}
                    height={maxH + 22}
                    fill={`url(#${idPrefix}-cuticle-fade)`}
                  />
                </mask>

                {/* Animated brush wipe clip from cuticle -> free edge */}
                <clipPath id={`${idPrefix}-brush-clip-${idx}`}>
                  <rect
                    ref={(el) => {
                      brushRectRefs.current[idx] = el;
                    }}
                    x={-cal.width * 1.5}
                    y={10 - maxH}
                    width={cal.width * 3}
                    height={maxH}
                    rx={cal.width * 0.35}
                  />
                </clipPath>
              </React.Fragment>
            );
          })}
        </defs>

        {/* Base photographic layer locked strictly to the same viewBox */}
        <image
          data-export-exclude="true"
          href={resolvedImage}
          x="0"
          y="0"
          width={imageWidth}
          height={imageHeight}
          preserveAspectRatio="none"
        />

        {/* All 5 live-rendered optical SVG fingernails */}
        <g
          clipPath={
            compareSplit !== null && compareSplit !== undefined
              ? `url(#${idPrefix}-compare-clip)`
              : undefined
          }
        >
          {calibrations.map((cal, idx) => {
            const fIdx = idx as FingerIndex;
            const fd = design.fingers[idx];
            const pts = targetPoints[idx];
            const pathD = controlPointsToPathD(pts);
            const rimD = controlPointsToTipRimD(pts);
            const nailLen = cal.baseLength * mult;
            const baseHex = paletteMap.get(fd.colorId) || '#EDE6DF';
            const frenchHex = paletteMap.get(fd.frenchColorId) || '#A9BFD4';
            const isSelected = selectedFinger === fIdx;

            const baseOpacity =
              fd.finish === 'sheer' ? 0.64 : fd.finish === 'pearl' ? 0.84 : 0.94;
            const extShadowOpacity =
              design.length === 'L' ? 0.24 : design.length === 'M' ? 0.16 : 0.08;
            const extShadowOffsetY =
              design.length === 'L' ? 5 : design.length === 'M' ? 3 : 1.5;

            const frenchPath =
              fd.art === 'french'
                ? buildFrenchSmileMaskPath(cal.width, nailLen, fd.frenchWidth, fd.frenchCurve)
                : '';
            const linePaths =
              fd.art === 'line'
                ? buildArtLinePaths(cal.width, nailLen, fd.linePattern)
                : [];
            const accents =
              fd.art === 'pearl' || fd.art === 'stud'
                ? buildAccentPositions(cal.width, nailLen, fd.accentCount)
                : [];

            return (
              <g
                key={cal.id}
                transform={`translate(${cal.cx}, ${cal.cy}) rotate(${cal.angleDeg}) scale(1, ${cal.scaleY})`}
                onClick={(e) => {
                  if (calibrateMode || onStageSvgClick) return;
                  if (onSelectFinger) {
                    e.stopPropagation();
                    onSelectFinger(fIdx);
                  }
                }}
                style={{ cursor: onSelectFinger && !calibrateMode ? 'pointer' : 'inherit' }}
              >
                {/* Brush-stroke reveal container */}
                <g clipPath={`url(#${idPrefix}-brush-clip-${idx})`}>
                  {/* 1. Soft extension shadow projected onto skin/stone beneath tip */}
                  <path
                    ref={(el) => {
                      shadowPathRefs.current[idx] = el;
                    }}
                    d={pathD}
                    fill="#2A2018"
                    opacity={extShadowOpacity}
                    transform={`translate(2.5, ${extShadowOffsetY})`}
                    filter={`url(#${idPrefix}-ext-shadow)`}
                  />

                  {/* 2. Cuticle-feathered painted nail body */}
                  <g mask={`url(#${idPrefix}-cuticle-mask-${idx})`}>
                    {/* Base pigment coat */}
                    <path
                      ref={(el) => {
                        nailPathRefs.current[idx] = el;
                      }}
                      d={pathD}
                      fill={baseHex}
                      fillOpacity={baseOpacity}
                    />

                    {/* All optical & art layers clipped strictly inside the nail silhouette */}
                    <g clipPath={`url(#${idPrefix}-nail-clip-${idx})`}>
                      {/* Sheer translucent jelly tip depth */}
                      {fd.finish === 'sheer' && (
                        <rect
                          x={-cal.width}
                          y={-nailLen - 8}
                          width={cal.width * 2}
                          height={nailLen + 12}
                          fill={`url(#${idPrefix}-sheer-depth)`}
                        />
                      )}

                      {/* Pearl iridescent sheen */}
                      {fd.finish === 'pearl' && (
                        <g
                          ref={(el) => {
                            pearlGroupRefs.current[idx] = el;
                          }}
                        >
                          <rect
                            x={-cal.width * 1.4}
                            y={-nailLen * 1.3}
                            width={cal.width * 2.8}
                            height={nailLen * 1.6}
                            fill={`url(#${idPrefix}-pearl-irid)`}
                          />
                        </g>
                      )}

                      {/* Chrome mirror metallic reflection */}
                      {fd.finish === 'chrome' && (
                        <g
                          ref={(el) => {
                            chromeGroupRefs.current[idx] = el;
                          }}
                        >
                          <rect
                            x={-cal.width * 1.5}
                            y={-nailLen * 1.2}
                            width={cal.width * 3}
                            height={nailLen * 1.4}
                            fill={`url(#${idPrefix}-chrome-band)`}
                          />
                        </g>
                      )}

                      {/* Velvet Magnetic (Cat-eye) moving optical shimmer band */}
                      {fd.finish === 'magnet' && (
                        <g
                          ref={(el) => {
                            magnetGroupRefs.current[idx] = el;
                          }}
                        >
                          <ellipse
                            cx="0"
                            cy={-nailLen * 0.52}
                            rx={cal.width * 0.62}
                            ry={nailLen * 0.34}
                            fill={`url(#${idPrefix}-magnet-beam)`}
                            transform={`rotate(-26 0 ${(-nailLen * 0.52).toFixed(1)})`}
                          />
                          <ellipse
                            cx="0"
                            cy={-nailLen * 0.52}
                            rx={cal.width * 0.24}
                            ry={nailLen * 0.44}
                            fill="#FFFFFF"
                            opacity="0.22"
                            transform={`rotate(-26 0 ${(-nailLen * 0.52).toFixed(1)})`}
                          />
                        </g>
                      )}

                      {/* Art Layer: French Tip (Micro -> Classic) */}
                      {fd.art === 'french' && (
                        <path d={frenchPath} fill={frenchHex} fillOpacity="0.95" />
                      )}

                      {/* Art Layer: Minimalist Sumi Ink Linework */}
                      {fd.art === 'line' &&
                        linePaths.map((ld, li) => (
                          <path
                            key={li}
                            d={ld}
                            fill="none"
                            stroke={fd.colorId === 'sumi' ? '#E6DED3' : '#241E1A'}
                            strokeWidth={Math.max(1.0, cal.width * 0.036)}
                            strokeLinecap="round"
                            opacity="0.86"
                          />
                        ))}

                      {/* 3D Transverse C-Curve Shading (always present for realism) */}
                      <rect
                        x={-cal.width}
                        y={-nailLen - 6}
                        width={cal.width * 2}
                        height={nailLen + 12}
                        fill={`url(#${idPrefix}-c-curve)`}
                      />

                      {/* Gloss / Sheer / Pearl / Magnet / Chrome Specular Light Ribbon */}
                      {fd.finish !== 'matte' && (
                        <g
                          ref={(el) => {
                            lightGroupRefs.current[idx] = el;
                          }}
                        >
                          <ellipse
                            cx={-cal.width * 0.16}
                            cy={-nailLen * 0.48}
                            rx={cal.width * (fd.finish === 'chrome' ? 0.22 : 0.14)}
                            ry={nailLen * 0.36}
                            fill={`url(#${idPrefix}-gloss-ribbon)`}
                            opacity={
                              fd.finish === 'chrome'
                                ? 0.92
                                : fd.finish === 'gloss'
                                  ? 0.84
                                  : 0.62
                            }
                          />
                          {/* Crisp pinpoint specular catchlight */}
                          <ellipse
                            cx={-cal.width * 0.19}
                            cy={-nailLen * 0.26}
                            rx={cal.width * 0.055}
                            ry={nailLen * 0.055}
                            fill="#FFFFFF"
                            opacity={fd.finish === 'chrome' ? 0.92 : 0.72}
                          />
                        </g>
                      )}

                      {/* Matte 4% velvet micro-grain finish (zero sharp specular) */}
                      {fd.finish === 'matte' && (
                        <rect
                          x={-cal.width}
                          y={-nailLen - 6}
                          width={cal.width * 2}
                          height={nailLen + 12}
                          fill="#FFFFFF"
                          filter={`url(#${idPrefix}-matte-noise)`}
                          opacity="0.72"
                        />
                      )}

                      {/* Art Layer: Micro Akoya Pearls or Brushed Gold Studs */}
                      {(fd.art === 'pearl' || fd.art === 'stud') &&
                        accents.map((a, ai) => (
                          <g key={ai}>
                            <circle
                              cx={a.x + 1.1}
                              cy={a.y + 1.3}
                              r={a.r * 1.05}
                              fill="#241E1A"
                              opacity="0.22"
                            />
                            <circle
                              cx={a.x}
                              cy={a.y}
                              r={a.r}
                              fill={
                                fd.art === 'pearl'
                                  ? `url(#${idPrefix}-pearl-bead)`
                                  : `url(#${idPrefix}-gold-stud)`
                              }
                            />
                            <circle
                              cx={a.x - a.r * 0.3}
                              cy={a.y - a.r * 0.32}
                              r={a.r * 0.28}
                              fill="#FFFFFF"
                              opacity="0.88"
                            />
                          </g>
                        ))}
                    </g>

                    {/* Free-edge crisp thickness rim */}
                    <path
                      ref={(el) => {
                        rimPathRefs.current[idx] = el;
                      }}
                      d={rimD}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="0.9"
                      strokeLinecap="round"
                      opacity={fd.finish === 'matte' ? 0.18 : 0.52}
                    />
                  </g>
                </g>

                {/* Restrained powder-blue selection indicator for single-finger editing */}
                <path
                  data-export-exclude="true"
                  ref={(el) => {
                    auraPathRefs.current[idx] = el;
                  }}
                  d={pathD}
                  fill="none"
                  stroke="#A7C1D9"
                  strokeWidth="2.2"
                  opacity={isSelected ? 0.95 : 0}
                  transform="scale(1.09)"
                  style={{ transition: 'opacity 0.3s ease' }}
                />
              </g>
            );
          })}
        </g>

        {/* Own-hand manual 2-point pin guides when user uploads their own photo */}
        {ownHandPins && ownHandPins.length > 0 && (
          <g data-export-exclude="true">
            {ownHandPins.map((p, i) => (
              <g key={i} transform={`translate(${p.x}, ${p.y})`}>
                <circle r="7" fill="#A7C1D9" fillOpacity="0.32" stroke="#241E1A" strokeWidth="1.5" />
                <circle r="2.2" fill="#241E1A" />
              </g>
            ))}
          </g>
        )}

        {/* ?calibrate interactive handles (root point, tip direction/length, width handle) */}
        {calibrateMode &&
          calibrations.map((cal, idx) => {
            const fIdx = idx as FingerIndex;
            const rad = (cal.angleDeg * Math.PI) / 180;
            const tipX = cal.cx + Math.sin(rad) * cal.baseLength * cal.scaleY;
            const tipY = cal.cy - Math.cos(rad) * cal.baseLength * cal.scaleY;
            const widthX = cal.cx + Math.cos(rad) * (cal.width * 0.5);
            const widthY = cal.cy + Math.sin(rad) * (cal.width * 0.5);

            return (
              <g key={`cal-${cal.id}`} data-export-exclude="true">
                <line
                  x1={cal.cx}
                  y1={cal.cy}
                  x2={tipX}
                  y2={tipY}
                  stroke="#A7C1D9"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <line
                  x1={cal.cx}
                  y1={cal.cy}
                  x2={widthX}
                  y2={widthY}
                  stroke="#241E1A"
                  strokeWidth="1.2"
                />
                {/* Root drag handle */}
                <circle
                  cx={cal.cx}
                  cy={cal.cy}
                  r="8"
                  fill="#241E1A"
                  stroke="#F2EEE8"
                  strokeWidth="2"
                  style={{ cursor: 'move' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    draggingCalRef.current = { idx: fIdx, handle: 'root' };
                  }}
                />
                {/* Tip / angle drag handle */}
                <circle
                  cx={tipX}
                  cy={tipY}
                  r="7"
                  fill="#A7C1D9"
                  stroke="#241E1A"
                  strokeWidth="1.5"
                  style={{ cursor: 'grab' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    draggingCalRef.current = { idx: fIdx, handle: 'tip' };
                  }}
                />
                {/* Width drag handle */}
                <rect
                  x={widthX - 5}
                  y={widthY - 5}
                  width="10"
                  height="10"
                  fill="#F2EEE8"
                  stroke="#241E1A"
                  strokeWidth="1.5"
                  style={{ cursor: 'ew-resize' }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    draggingCalRef.current = { idx: fIdx, handle: 'width' };
                  }}
                />
              </g>
            );
          })}
      </svg>
    );
  }
);

NailSvgLayer.displayName = 'NailSvgLayer';
