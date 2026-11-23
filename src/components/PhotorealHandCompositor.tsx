import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { SITE_CONFIG } from '../config';
import { NailDesignItem, SelfSelection } from '../types/nail';
import { resolveAssetUrl } from '../utils/assetUrl';
import { computeDesktopCardSceneLayout } from '../utils/designCodec';

interface PhotorealHandCompositorProps {
  mode: 'preset' | 'self';
  presetDesign: NailDesignItem;
  prevPresetDesign?: NailDesignItem | null;
  wipeKey: number;
  /** 0 = pure petals-on-nails, 1 = melted into gel plate (used during Shot 3 -> Shot 4) */
  petalMeltProgress?: number;
  /** Trigger specular glint sweep across the 5 nails */
  sheenKey?: number;
  selfSelection: SelfSelection;
  /** Camera zoom factor (1.0 default, >1 pushes in gently toward the 5 nails) */
  cameraZoom?: number;
  /** Reveal the real photographed blank cotton card resting on the right of the table (card-in-scene) */
  cardOpenOnTable?: boolean;
  /** Current nail hex color for the subtle <=15% ambient nail-color aura (Section 3A.2) */
  ambientNailHex?: string;
  showImageTag?: boolean;
  onTapNails?: () => void;
  onSelfCompositeReady?: (dataUrl: string) => void;
}

const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadCachedImage(url: string): Promise<HTMLImageElement> {
  const existing = imgCache.get(url);
  if (existing) return existing;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
  imgCache.set(url, p);
  return p;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const PhotorealHandCompositor: React.FC<PhotorealHandCompositorProps> = ({
  mode,
  presetDesign,
  prevPresetDesign = null,
  wipeKey,
  petalMeltProgress = 1,
  sheenKey = 0,
  selfSelection,
  cameraZoom = 1,
  cardOpenOnTable = false,
  ambientNailHex = '#B06F7B',
  showImageTag = true,
  onTapNails,
  onSelfCompositeReady,
}) => {
  const uid = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selfCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [stageSize, setStageSize] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1376, h: 768 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setStageSize({ w: rect.width, h: rect.height });
      const aspect = rect.width / rect.height;
      const fullW = SITE_CONFIG.media.refWidth;
      const fullH = SITE_CONFIG.media.refHeight;

      if (aspect < 0.88) {
        const targetW = Math.min(fullW, Math.max(540, Math.round(fullH * aspect)));
        const targetX = Math.max(0, Math.min(fullW - targetW, Math.round(795 - targetW * 0.52)));
        setViewBox({ x: targetX, y: 0, w: targetW, h: fullH });
      } else {
        setViewBox({ x: 0, y: 0, w: fullW, h: fullH });
      }
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [wipeActive, setWipeActive] = useState(true);
  useEffect(() => {
    if (wipeKey === 0) {
      setWipeActive(true);
      return;
    }
    setWipeActive(false);
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setWipeActive(true));
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [wipeKey]);

  const shimmerRefs = useRef<(SVGGElement | null)[]>([null, null, null, null, null]);
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    const sx = (nx * 11).toFixed(1);
    const sy = (ny * 14).toFixed(1);
    for (let i = 0; i < 5; i++) {
      shimmerRefs.current[i]?.setAttribute('transform', `translate(${sx}, ${sy})`);
    }
  }, []);

  const sizeTier = isMobile ? '900' : '1600';
  const basePlateUrl = useMemo(
    () => resolveAssetUrl(`/media/v4/web/hands/02-${sizeTier}.webp`),
    [sizeTier]
  );
  const cardInSceneUrl = useMemo(
    () => resolveAssetUrl(`/media/v4/web/card-in-scene-${sizeTier}.webp`),
    [sizeTier]
  );
  const petalsUrl = useMemo(
    () => resolveAssetUrl(`/media/v4/web/petals-on-nails-${sizeTier}.webp`),
    [sizeTier]
  );
  const activeHandUrl = useMemo(
    () => resolveAssetUrl(`${presetDesign.handWebBase}-${sizeTier}.webp`),
    [presetDesign.handWebBase, sizeTier]
  );
  const prevHandUrl = useMemo(
    () =>
      prevPresetDesign
        ? resolveAssetUrl(`${prevPresetDesign.handWebBase}-${sizeTier}.webp`)
        : null,
    [prevPresetDesign, sizeTier]
  );
  const nailsMaskUrl = useMemo(
    () => resolveAssetUrl(SITE_CONFIG.media.nailsMaskWebp),
    []
  );

  // Real-time Lab/luminance-preserving photorealistic compositor for セルフデザイン
  const [selfDataUrl, setSelfDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (mode !== 'self') return;
    let cancelled = false;

    const renderSelfComposite = async () => {
      const tierW = isMobile ? 900 : 1600;
      const tierH = isMobile ? 502 : 893;
      const shapeSlug = `shape-${selfSelection.shape}-${selfSelection.length}`;
      const shapeUrl = resolveAssetUrl(`/media/v4/web/self/${shapeSlug}-${tierW}.webp`);
      const maskUrl = resolveAssetUrl(
        isMobile
          ? `/media/v4/web/self/${shapeSlug}-900.mask.png`
          : `/media/v4/web/self/${shapeSlug}.mask.png`
      );
      const techUrl = resolveAssetUrl(
        `/media/v4/web/self/tech-${selfSelection.technique}-${tierW}.webp`
      );

      const accentOpt = SITE_CONFIG.selfDesign.accents.find(
        (a) => a.id === selfSelection.accent
      );
      const colorOpt =
        SITE_CONFIG.selfDesign.colors.find((c) => c.id === selfSelection.colorId) ||
        SITE_CONFIG.selfDesign.colors[2];

      try {
        const [shapeImg, maskImg, techImg, accentImg] = await Promise.all([
          loadCachedImage(shapeUrl),
          loadCachedImage(maskUrl),
          loadCachedImage(techUrl),
          accentOpt?.cutoutWebp
            ? loadCachedImage(resolveAssetUrl(accentOpt.cutoutWebp))
            : Promise.resolve(null),
        ]);
        if (cancelled) return;

        const canvas = selfCanvasRef.current || document.createElement('canvas');
        canvas.width = tierW;
        canvas.height = tierH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const work = document.createElement('canvas');
        work.width = tierW;
        work.height = tierH;
        const wctx = work.getContext('2d', { willReadFrequently: true });
        if (!wctx) return;

        wctx.drawImage(shapeImg, 0, 0, tierW, tierH);
        const shapeData = wctx.getImageData(0, 0, tierW, tierH);

        wctx.clearRect(0, 0, tierW, tierH);
        wctx.drawImage(maskImg, 0, 0, tierW, tierH);
        const maskData = wctx.getImageData(0, 0, tierW, tierH);

        wctx.clearRect(0, 0, tierW, tierH);
        wctx.drawImage(techImg, 0, 0, tierW, tierH);
        const techData = wctx.getImageData(0, 0, tierW, tierH);

        const [tr, tg, tb] = hexToRgb(colorOpt.hex);
        const pigR = colorOpt.sheer ? tr * 0.74 + 231 * 0.26 : tr;
        const pigG = colorOpt.sheer ? tg * 0.74 + 185 * 0.26 : tg;
        const pigB = colorOpt.sheer ? tb * 0.74 + 188 * 0.26 : tb;

        const sd = shapeData.data;
        const md = maskData.data;
        const td = techData.data;
        const tech = selfSelection.technique;

        for (let i = 0; i < sd.length; i += 4) {
          const mAlpha = md[i] / 255;
          if (mAlpha <= 0.01) continue;

          const sr = sd[i];
          const sg = sd[i + 1];
          const sb = sd[i + 2];
          const lum = 0.299 * sr + 0.587 * sg + 0.114 * sb;

          const u = Math.max(0, Math.min(1, (lum - 138) / 108));
          const shade = 0.60 + 0.44 * Math.pow(u, 0.86);
          const spec = Math.pow(Math.max(0, (lum - 216) / 39), 2.05) * 0.86;

          let nr = pigR * shade;
          let ng = pigG * shade;
          let nb = pigB * shade;

          if (tech !== 'onecolor') {
            const tLum = 0.299 * td[i] + 0.587 * td[i + 1] + 0.114 * td[i + 2];
            if (tech === 'french') {
              const tipW = Math.max(0, Math.min(1, (tLum - 214) / 26));
              const bedR = (234 * 0.62 + pigR * 0.38) * shade;
              const bedG = (196 * 0.62 + pigG * 0.38) * shade;
              const bedB = (196 * 0.62 + pigB * 0.38) * shade;
              const tipR = colorOpt.toneGroup === 'pale' ? 250 * shade : pigR * (shade * 1.04);
              const tipG = colorOpt.toneGroup === 'pale' ? 248 * shade : pigG * (shade * 1.04);
              const tipB = colorOpt.toneGroup === 'pale' ? 246 * shade : pigB * (shade * 1.04);
              nr = bedR * (1 - tipW) + tipR * tipW;
              ng = bedG * (1 - tipW) + tipG * tipW;
              nb = bedB * (1 - tipW) + tipB * tipW;
            } else if (tech === 'gradation') {
              const gradW = Math.max(0.16, Math.min(1, (tLum - 168) / 68));
              const bedR = 232 * shade;
              const bedG = 192 * shade;
              const bedB = 193 * shade;
              nr = bedR * (1 - gradW) + nr * gradW;
              ng = bedG * (1 - gradW) + ng * gradW;
              nb = bedB * (1 - gradW) + nb * gradW;
            } else if (tech === 'magnet') {
              const magBand = Math.max(0, Math.min(1, (tLum - 186) / 54));
              nr = nr * 0.88 + magBand * 76;
              ng = ng * 0.88 + magBand * 74;
              nb = nb * 0.88 + magBand * 82;
            } else if (tech === 'nuance') {
              const swirl = (tLum - 195) / 55;
              const foil = Math.max(0, (td[i] - td[i + 2] - 6) / 28);
              nr = nr * (0.94 + swirl * 0.18) + foil * 55;
              ng = ng * (0.94 + swirl * 0.18) + foil * 42;
              nb = nb * (0.94 + swirl * 0.18) + foil * 18;
            } else if (tech === 'mirror') {
              const chrome = Math.max(0, Math.min(1, (tLum - 175) / 68));
              nr = nr * 0.65 + (236 * chrome + 150 * (1 - chrome)) * 0.42;
              ng = ng * 0.65 + (238 * chrome + 152 * (1 - chrome)) * 0.42;
              nb = nb * 0.65 + (244 * chrome + 158 * (1 - chrome)) * 0.42;
            }
          }

          nr = nr + (255 - nr) * spec;
          ng = ng + (255 - ng) * spec;
          nb = nb + (255 - nb) * spec;

          sd[i] = Math.max(0, Math.min(255, Math.round(sr * (1 - mAlpha) + nr * mAlpha)));
          sd[i + 1] = Math.max(0, Math.min(255, Math.round(sg * (1 - mAlpha) + ng * mAlpha)));
          sd[i + 2] = Math.max(0, Math.min(255, Math.round(sb * (1 - mAlpha) + nb * mAlpha)));
        }

        ctx.putImageData(shapeData, 0, 0);

        if (accentImg && accentOpt && accentOpt.id !== 'none') {
          const scaleX = tierW / 1376;
          const scaleY = tierH / 768;
          const anchors = [
            { x: 846 * scaleX, y: 295 * scaleY, rotDeg: -6, size: 22 * scaleX },
            { x: 928 * scaleX, y: 344 * scaleY, rotDeg: -2, size: 24 * scaleX },
          ];
          ctx.save();
          ctx.shadowColor = 'rgba(42, 24, 26, 0.34)';
          ctx.shadowBlur = 3 * scaleX;
          ctx.shadowOffsetX = 1.2 * scaleX;
          ctx.shadowOffsetY = 1.4 * scaleY;
          for (const anc of anchors) {
            ctx.save();
            ctx.translate(anc.x, anc.y);
            ctx.rotate(((anc.rotDeg - 90) * Math.PI) / 180);
            const aspect = accentImg.naturalWidth / accentImg.naturalHeight;
            const drawW =
              accentOpt.id === 'goldline' || accentOpt.id === 'glitter'
                ? anc.size * 1.45
                : anc.size * 0.92;
            const drawH = drawW / aspect;
            ctx.drawImage(accentImg, -drawW / 2, -drawH / 2, drawW, drawH);
            ctx.restore();
          }
          ctx.restore();
        }

        const url = canvas.toDataURL('image/jpeg', 0.92);
        if (!cancelled) {
          setSelfDataUrl(url);
          onSelfCompositeReady?.(url);
        }
      } catch {
        // Fallback gracefully while streaming
      }
    };

    renderSelfComposite();
    return () => {
      cancelled = true;
    };
  }, [mode, selfSelection, isMobile, onSelfCompositeReady]);

  const W = SITE_CONFIG.media.refWidth;
  const H = SITE_CONFIG.media.refHeight;
  const cals = SITE_CONFIG.fingerCalibrations;

  // On desktop, compute exact cover bounds so opening the card smoothly glides right (`openLeft`) to frame all 4 gold corners!
  const effectiveZoom = cardOpenOnTable && !isMobile ? 1 : cameraZoom;
  const desktopLayout = computeDesktopCardSceneLayout(stageSize.w, stageSize.h);
  const desktopLeft = cardOpenOnTable ? desktopLayout.openLeft : desktopLayout.baseLeft;

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative w-full h-full overflow-hidden select-none"
    >
      <canvas ref={selfCanvasRef} className="hidden" aria-hidden="true" />

      <div
        className={isMobile ? 'w-full h-full will-change-transform' : 'absolute will-change-transform'}
        style={
          isMobile
            ? {
                transformOrigin: '56% 44%',
                transform: `scale(${effectiveZoom.toFixed(3)})`,
                transition: 'transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
              }
            : {
                left: `${desktopLeft.toFixed(2)}px`,
                top: `${desktopLayout.baseTop.toFixed(2)}px`,
                width: `${desktopLayout.rw.toFixed(2)}px`,
                height: `${desktopLayout.rh.toFixed(2)}px`,
                transformOrigin: '64% 44%',
                transform: `scale(${effectiveZoom.toFixed(3)})`,
                transition:
                  'left 0.72s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
              }
        }
      >
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          preserveAspectRatio={isMobile ? 'xMidYMid slice' : 'none'}
          className="w-full h-full block"
          role="img"
          aria-label={SITE_CONFIG.brandName}
        >
          <defs>
            <filter id={`${uid}-soft`} x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.6" />
            </filter>

            <mask id={`${uid}-photo-nails-mask`}>
              <image
                href={nailsMaskUrl}
                x="0"
                y="0"
                width={W}
                height={H}
                preserveAspectRatio="none"
              />
            </mask>

            {/* Right-table mask for the real photographed cotton paper card in card-in-scene.jpg */}
            <clipPath id={`${uid}-right-card-clip`}>
              <polygon points="1028,215 1376,215 1376,710 936,710 936,452 994,445 994,312" />
            </clipPath>

            {cals.map((f, idx) => {
              const totalLen = (f.ry + 16) * 2;
              const progress =
                petalMeltProgress < 1
                  ? Math.max(0, Math.min(1, (petalMeltProgress - idx * 0.08) / 0.68))
                  : wipeActive
                    ? 1
                    : 0;
              const delayMs = petalMeltProgress < 1 ? 0 : idx * 60;
              return (
                <clipPath key={f.id} id={`${uid}-wipe-${idx}`}>
                  <rect
                    x={-(f.rx + 16)}
                    y={f.ry + 16 - totalLen * progress}
                    width={(f.rx + 16) * 2}
                    height={totalLen * progress}
                    style={{
                      transition:
                        petalMeltProgress < 1
                          ? 'none'
                          : wipeActive
                            ? `y 0.48s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms, height 0.48s cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms`
                            : 'none',
                    }}
                  />
                </clipPath>
              );
            })}

            <mask id={`${uid}-staggered-wipe-mask`}>
              <rect x="0" y="0" width={W} height={H} fill="black" />
              <g mask={`url(#${uid}-photo-nails-mask)`} filter={`url(#${uid}-soft)`}>
                {cals.map((f, idx) => (
                  <g key={f.id} transform={`translate(${f.cx}, ${f.cy}) rotate(${f.angleDeg})`}>
                    <g clipPath={`url(#${uid}-wipe-${idx})`}>
                      <rect
                        x={-(f.rx + 14)}
                        y={-(f.ry + 16)}
                        width={(f.rx + 14) * 2}
                        height={(f.ry + 16) * 2}
                        rx={f.rx + 10}
                        fill="white"
                      />
                    </g>
                  </g>
                ))}
              </g>
            </mask>

            <linearGradient id={`${uid}-sheen-grad`} x1="0%" y1="0%" x2="100%" y2="25%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="46%" stopColor="#FFFDF9" stopOpacity="0.62" />
              <stop offset="54%" stopColor="#FFFFFF" stopOpacity="0.76" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${uid}-opt-shimmer`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {mode === 'self' && selfDataUrl ? (
            <image
              href={selfDataUrl}
              x="0"
              y="0"
              width={W}
              height={H}
              preserveAspectRatio="none"
            />
          ) : (
            <>
              <image
                href={petalMeltProgress < 1 ? petalsUrl : basePlateUrl}
                x="0"
                y="0"
                width={W}
                height={H}
                preserveAspectRatio="none"
              />

              {petalMeltProgress >= 1 && prevHandUrl && (
                <image
                  href={prevHandUrl}
                  x="0"
                  y="0"
                  width={W}
                  height={H}
                  preserveAspectRatio="none"
                  mask={`url(#${uid}-photo-nails-mask)`}
                />
              )}

              <image
                href={petalMeltProgress < 1 ? basePlateUrl : activeHandUrl}
                x="0"
                y="0"
                width={W}
                height={H}
                preserveAspectRatio="none"
                mask={`url(#${uid}-staggered-wipe-mask)`}
              />

              {petalMeltProgress >= 1 && presetDesign.opticalEffect !== 'none' && (
                <g
                  mask={`url(#${uid}-photo-nails-mask)`}
                  style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}
                >
                  {cals.map((f, idx) => (
                    <g key={f.id} transform={`translate(${f.cx}, ${f.cy}) rotate(${f.angleDeg})`}>
                      <g
                        ref={(node) => {
                          shimmerRefs.current[idx] = node;
                        }}
                      >
                        <ellipse
                          cx="0"
                          cy="0"
                          rx={f.rx * 1.4}
                          ry={f.ry * 1.2}
                          fill={`url(#${uid}-opt-shimmer)`}
                        />
                      </g>
                    </g>
                  ))}
                </g>
              )}
            </>
          )}

          {/* Real photographed blank cotton card on the right side of the table (card-in-scene.jpg) */}
          {!isMobile && (
            <image
              href={cardInSceneUrl}
              x="0"
              y="0"
              width={W}
              height={H}
              preserveAspectRatio="none"
              clipPath={`url(#${uid}-right-card-clip)`}
              style={{
                opacity: cardOpenOnTable ? 1 : 0,
                transition: 'opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1)',
                pointerEvents: 'none',
              }}
            />
          )}

          {sheenKey > 0 && (
            <g
              key={sheenKey}
              mask={`url(#${uid}-photo-nails-mask)`}
              style={{ mixBlendMode: 'screen', pointerEvents: 'none' }}
            >
              <rect
                x="620"
                y="200"
                width="160"
                height="440"
                fill={`url(#${uid}-sheen-grad)`}
                className="animate-nail-sheen"
              />
            </g>
          )}

          {onTapNails && (
            <rect
              x="640"
              y="215"
              width="380"
              height="410"
              rx="48"
              fill="transparent"
              style={{ cursor: 'pointer' }}
              onClick={onTapNails}
            >
              <title>{presetDesign.name.ja}</title>
            </rect>
          )}
        </svg>
      </div>

      {/* Section 3A.2: Ambient aura strictly from the active nail color ONLY (opacity <= 12%, wide soft radius, slow transition) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(circle at ${isMobile ? '58% 44%' : '62% 45%'}, ${ambientNailHex} 0%, transparent 56%)`,
          opacity: 0.11,
          filter: 'blur(48px)',
          mixBlendMode: 'multiply',
          transition: 'background 1.2s ease, opacity 1.2s ease',
        }}
      />

      {showImageTag && (
        <span
          className="pointer-events-none absolute top-[66px] right-4 sm:right-7 text-[9.5px] tracking-[0.16em] px-2.5 py-0.5 rounded-full"
          style={{
            color: '#7E6B6C',
            backgroundColor: 'rgba(251, 248, 244, 0.64)',
          }}
        >
          {SITE_CONFIG.cardActions.imageTag.ja}
        </span>
      )}
    </div>
  );
};
