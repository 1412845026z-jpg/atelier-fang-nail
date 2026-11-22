import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { resolveAssetUrl } from '../utils/assetUrl';

gsap.registerPlugin(ScrollTrigger);

export interface ScrollSequenceRenderState {
  progress: number;
  hasMedia: boolean;
  hasKeyframesPreview: boolean;
  isExtracting: boolean;
  extractPercent: number;
  isReducedMotion: boolean;
  triggerFileDialog: () => void;
}

interface ScrollSequenceProps {
  id?: string;
  src: string;
  framesDir?: string;
  previewFirstFrame?: string;
  previewLastFrame?: string;
  scrollLength?: string;
  optional?: boolean;
  /** When false, skip all network HEAD probes so console stays 100% free of 404s */
  enabled?: boolean;
  onLoadProgress?: (percent: number) => void;
  onLoadComplete?: () => void;
  children?: (state: ScrollSequenceRenderState) => React.ReactNode;
}

async function detectImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const ct = res.headers.get('content-type') || '';
    return res.ok && ct.toLowerCase().startsWith('image/');
  } catch {
    return false;
  }
}

async function detectVideoUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const ct = res.headers.get('content-type') || '';
    return (
      res.ok &&
      (ct.toLowerCase().startsWith('video/') ||
        ct.toLowerCase() === 'application/octet-stream')
    );
  } catch {
    return false;
  }
}

function supportsWebpEncode(): boolean {
  try {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

async function loadImageDecoded(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  if (typeof img.decode === 'function') {
    await img.decode();
  } else {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Image load failed: ${url}`));
    });
  }
  return img;
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
  extraScale = 1,
  offsetX = 0,
  offsetY = 0
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = cw / ch;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > canvasRatio) {
    sw = img.naturalHeight * canvasRatio;
    sx = (img.naturalWidth - sw) * 0.5;
  } else {
    sh = img.naturalWidth / canvasRatio;
    sy = (img.naturalHeight - sh) * 0.5;
  }

  const dw = cw * extraScale;
  const dh = ch * extraScale;
  const dx = (cw - dw) * 0.5 + offsetX;
  const dy = (ch - dh) * 0.5 + offsetY;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

/**
 * Organic soft-feathered vellum reveal between first & last keyframes (no hard CGI stripe).
 * Uses an offscreen alpha-masked composite so the translucent tracing paper softly clears
 * from the lower-right fingertips upward-left into the revealed daylight manicure.
 */
function drawOrganicVeilReveal(
  ctx: CanvasRenderingContext2D,
  maskCanvas: HTMLCanvasElement,
  firstImg: HTMLImageElement,
  lastImg: HTMLImageElement,
  cw: number,
  ch: number,
  t: number
) {
  const eased = Math.max(0, Math.min(1, (t - 0.05) / 0.84));
  const smooth = eased * eased * (3 - 2 * eased);

  // Subtle macro breathing zoom (1.035 -> 1.0) as the veil lifts
  const zoom = 1.032 - smooth * 0.032;

  ctx.save();
  drawCoverImage(ctx, lastImg, cw, ch, zoom);
  ctx.restore();

  if (smooth >= 0.999) return;

  if (smooth <= 0.001) {
    ctx.save();
    drawCoverImage(ctx, firstImg, cw, ch, zoom);
    ctx.restore();
    return;
  }

  // Ensure offscreen composite buffer matches canvas dimensions
  if (maskCanvas.width !== cw || maskCanvas.height !== ch) {
    maskCanvas.width = cw;
    maskCanvas.height = ch;
  }
  const mctx = maskCanvas.getContext('2d');
  if (!mctx) return;

  mctx.clearRect(0, 0, cw, ch);
  mctx.globalCompositeOperation = 'source-over';
  drawCoverImage(mctx, firstImg, cw, ch, zoom);

  // Wide feathered organic diagonal gradient mask (destination-in) clearing bottom-right -> top-left
  mctx.globalCompositeOperation = 'destination-in';
  const span = Math.hypot(cw, ch);
  const feather = span * 0.42;
  const center = (1 - smooth) * (span + feather) - feather * 0.5;
  const grad = mctx.createLinearGradient(0, 0, cw * 0.85, ch * 0.9);
  const s0 = Math.max(0, Math.min(1, (center - feather * 0.5) / span));
  const s1 = Math.max(0, Math.min(1, (center + feather * 0.5) / span));
  grad.addColorStop(0, 'rgba(0,0,0,1)');
  grad.addColorStop(s0, 'rgba(0,0,0,1)');
  grad.addColorStop(s1, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  mctx.fillStyle = grad;
  mctx.fillRect(0, 0, cw, ch);

  // Composite the organically fading vellum layer onto the revealed daylight photograph
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - Math.pow(smooth, 2.2));
  ctx.drawImage(maskCanvas, 0, 0);
  ctx.restore();
}

export const ScrollSequence: React.FC<ScrollSequenceProps> = ({
  id,
  src,
  framesDir,
  previewFirstFrame,
  previewLastFrame,
  scrollLength = '400vh',
  optional = false,
  enabled = true,
  onLoadProgress,
  onLoadComplete,
  children,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const framesRef = useRef<HTMLImageElement[]>([]);
  const previewPairRef = useRef<{ first: HTMLImageElement; last: HTMLImageElement } | null>(null);
  const createdUrlsRef = useRef<string[]>([]);
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const lastDrawnFrameRef = useRef(-1);
  const lastEmittedProgressRef = useRef(-1);

  const [progress, setProgress] = useState(0);
  const [hasMedia, setHasMedia] = useState(false);
  const [hasKeyframesPreview, setHasKeyframesPreview] = useState(false);
  const [mediaMissing, setMediaMissing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractPercent, setExtractPercent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const onLoadProgressRef = useRef(onLoadProgress);
  const onLoadCompleteRef = useRef(onLoadComplete);
  onLoadProgressRef.current = onLoadProgress;
  onLoadCompleteRef.current = onLoadComplete;

  const revokeObjectUrls = useCallback(() => {
    createdUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    createdUrlsRef.current = [];
  }, []);

  const drawStateAtStep = useCallback((stepIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;
    if (cw === 0 || ch === 0) return;

    const frames = framesRef.current;
    if (frames.length > 0) {
      const clamped = Math.max(0, Math.min(frames.length - 1, stepIndex));
      const img = frames[clamped];
      if (!img || !img.naturalWidth || !img.naturalHeight) return;
      drawCoverImage(ctx, img, cw, ch);
      lastDrawnFrameRef.current = clamped;
      return;
    }

    const pair = previewPairRef.current;
    if (pair) {
      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement('canvas');
      }
      const clamped = Math.max(0, Math.min(119, stepIndex));
      drawOrganicVeilReveal(ctx, maskCanvasRef.current, pair.first, pair.last, cw, ch, clamped / 119);
      lastDrawnFrameRef.current = clamped;
    }
  }, []);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const targetW = Math.max(1, Math.round(rect.width * dpr));
    const targetH = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      lastDrawnFrameRef.current = -1;
      const totalSteps =
        framesRef.current.length > 0
          ? framesRef.current.length
          : previewPairRef.current
            ? 120
            : 0;
      if (totalSteps > 0) {
        const idx = isReducedMotion
          ? totalSteps - 1
          : Math.round(currentProgressRef.current * (totalSteps - 1));
        drawStateAtStep(idx);
      }
    }
  }, [drawStateAtStep, isReducedMotion]);

  const extractFromVideoUrl = useCallback(
    async (
      videoUrl: string,
      isExternalPreload: boolean,
      abortSignal?: { cancelled: boolean }
    ) => {
      const isMobile = window.innerWidth < 768;
      const frameCount = isMobile ? 72 : 120;
      const maxWidth = isMobile ? 900 : 1600;
      const mimeType = supportsWebpEncode() ? 'image/webp' : 'image/jpeg';

      setIsExtracting(true);
      setExtractPercent(0);

      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;

      try {
        await new Promise<void>((resolve, reject) => {
          const onReady = () => {
            cleanup();
            resolve();
          };
          const onErr = () => {
            cleanup();
            reject(new Error('Video failed to load metadata'));
          };
          const cleanup = () => {
            video.removeEventListener('loadeddata', onReady);
            video.removeEventListener('error', onErr);
          };
          video.addEventListener('loadeddata', onReady);
          video.addEventListener('error', onErr);
          video.load();
        });

        if (abortSignal?.cancelled) return;

        const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
        const naturalW = video.videoWidth || 1280;
        const naturalH = video.videoHeight || 720;
        const scale = naturalW > maxWidth ? maxWidth / naturalW : 1;
        const outW = Math.max(2, Math.round(naturalW * scale));
        const outH = Math.max(2, Math.round(naturalH * scale));

        const offscreen = document.createElement('canvas');
        offscreen.width = outW;
        offscreen.height = outH;
        const offCtx = offscreen.getContext('2d', { alpha: false });
        if (!offCtx) throw new Error('Offscreen 2D context unavailable');

        const nextFrames: HTMLImageElement[] = [];
        const nextUrls: string[] = [];

        const seekTo = (timeSec: number) =>
          new Promise<void>((resolve) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              video.removeEventListener('seeked', finish);
              window.clearTimeout(timer);
              resolve();
            };
            const timer = window.setTimeout(finish, 1200);
            video.addEventListener('seeked', finish, { once: true });
            try {
              video.currentTime = timeSec;
            } catch {
              finish();
            }
          });

        const safeSpan = Math.max(0.01, duration - 0.03);

        for (let i = 0; i < frameCount; i += 1) {
          if (abortSignal?.cancelled) {
            nextUrls.forEach((u) => URL.revokeObjectURL(u));
            return;
          }

          const t = (i / Math.max(1, frameCount - 1)) * safeSpan;
          await seekTo(t);
          offCtx.drawImage(video, 0, 0, outW, outH);

          const blob = await new Promise<Blob | null>((resolve) =>
            offscreen.toBlob((b) => resolve(b), mimeType, 0.85)
          );

          if (blob) {
            const url = URL.createObjectURL(blob);
            nextUrls.push(url);
            const img = await loadImageDecoded(url);
            nextFrames.push(img);
          }

          const pct = Math.round(((i + 1) / frameCount) * 100);
          setExtractPercent(pct);
          if (isExternalPreload) {
            onLoadProgressRef.current?.(pct);
          }
        }

        if (abortSignal?.cancelled) {
          nextUrls.forEach((u) => URL.revokeObjectURL(u));
          return;
        }

        revokeObjectUrls();
        createdUrlsRef.current = nextUrls;
        framesRef.current = nextFrames;
        lastDrawnFrameRef.current = -1;

        setHasMedia(true);
        setMediaMissing(false);
        setIsExtracting(false);

        window.requestAnimationFrame(() => {
          resizeCanvas();
          const initialIdx = isReducedMotion
            ? nextFrames.length - 1
            : Math.round(currentProgressRef.current * (nextFrames.length - 1));
          drawStateAtStep(initialIdx);
          ScrollTrigger.refresh();
        });

        if (isExternalPreload) {
          onLoadProgressRef.current?.(100);
          onLoadCompleteRef.current?.();
        }
      } catch {
        setIsExtracting(false);
        if (isExternalPreload) {
          setMediaMissing(true);
          onLoadProgressRef.current?.(100);
          onLoadCompleteRef.current?.();
        }
      } finally {
        video.removeAttribute('src');
        video.load();
      }
    },
    [drawStateAtStep, isReducedMotion, resizeCanvas, revokeObjectUrls]
  );

  const loadFromFramesFolder = useCallback(
    async (folder: string, abortSignal: { cancelled: boolean }) => {
      const isMobile = window.innerWidth < 768;
      const defaultCount = isMobile ? 72 : 120;
      let totalCount = defaultCount;

      try {
        const manifestRes = await fetch(`${folder}/manifest.json`);
        const ct = manifestRes.headers.get('content-type') || '';
        if (manifestRes.ok && ct.includes('json')) {
          const data = (await manifestRes.json()) as { count?: number };
          if (typeof data.count === 'number' && data.count > 1) {
            totalCount = data.count;
          }
        }
      } catch {
        // Default frame count when manifest.json is not present
      }

      const loaded: HTMLImageElement[] = [];
      let loadedCount = 0;

      const urls = Array.from({ length: totalCount }, (_, i) => {
        const num = String(i + 1).padStart(4, '0');
        return `${folder}/${num}.webp`;
      });

      const batchSize = 8;
      for (let i = 0; i < urls.length; i += batchSize) {
        if (abortSignal.cancelled) return false;
        const batch = urls.slice(i, i + batchSize);
        const results = await Promise.allSettled(batch.map((u) => loadImageDecoded(u)));
        let broke = false;
        for (const r of results) {
          if (r.status === 'fulfilled') {
            loaded.push(r.value);
          } else {
            broke = true;
          }
        }
        loadedCount = Math.min(totalCount, i + batch.length);
        onLoadProgressRef.current?.(Math.round((loadedCount / totalCount) * 100));
        if (broke && loaded.length >= 12) break;
      }

      if (abortSignal.cancelled || loaded.length < 2) return false;

      framesRef.current = loaded;
      lastDrawnFrameRef.current = -1;
      setHasMedia(true);
      setMediaMissing(false);

      window.requestAnimationFrame(() => {
        resizeCanvas();
        const initialIdx = isReducedMotion
          ? loaded.length - 1
          : Math.round(currentProgressRef.current * (loaded.length - 1));
        drawStateAtStep(initialIdx);
        ScrollTrigger.refresh();
      });

      onLoadProgressRef.current?.(100);
      onLoadCompleteRef.current?.();
      return true;
    },
    [drawStateAtStep, isReducedMotion, resizeCanvas]
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setIsReducedMotion(mq.matches);
      if (mq.matches) {
        targetProgressRef.current = 1;
        currentProgressRef.current = 1;
        setProgress(1);
        const totalSteps =
          framesRef.current.length > 0
            ? framesRef.current.length
            : previewPairRef.current
              ? 120
              : 0;
        if (totalSteps > 0) {
          drawStateAtStep(totalSteps - 1);
        }
      }
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [drawStateAtStep]);

  useEffect(() => {
    if (!enabled) {
      setHasMedia(false);
      setMediaMissing(true);
      onLoadProgressRef.current?.(100);
      onLoadCompleteRef.current?.();
      return;
    }

    const signal = { cancelled: false };
    const resolvedFramesDir = framesDir ? resolveAssetUrl(framesDir) : undefined;
    const resolvedSrc = resolveAssetUrl(src);
    const resolvedFirst = previewFirstFrame ? resolveAssetUrl(previewFirstFrame) : undefined;
    const resolvedLast = previewLastFrame ? resolveAssetUrl(previewLastFrame) : undefined;

    const init = async () => {
      if (resolvedFramesDir) {
        const firstFrameExists = await detectImageUrl(`${resolvedFramesDir}/0001.webp`);
        if (signal.cancelled) return;
        if (firstFrameExists) {
          const ok = await loadFromFramesFolder(resolvedFramesDir, signal);
          if (ok || signal.cancelled) return;
        }
      }

      const videoExists = await detectVideoUrl(resolvedSrc);
      if (signal.cancelled) return;

      if (videoExists) {
        await extractFromVideoUrl(resolvedSrc, true, signal);
        return;
      }

      if (!optional && resolvedFirst && resolvedLast) {
        const [okFirst, okLast] = await Promise.all([
          detectImageUrl(resolvedFirst),
          detectImageUrl(resolvedLast),
        ]);
        if (signal.cancelled) return;
        if (okFirst && okLast) {
          try {
            onLoadProgressRef.current?.(45);
            const [firstImg, lastImg] = await Promise.all([
              loadImageDecoded(resolvedFirst),
              loadImageDecoded(resolvedLast),
            ]);
            if (signal.cancelled) return;
            previewPairRef.current = { first: firstImg, last: lastImg };
            setHasKeyframesPreview(true);
            setMediaMissing(true);
            window.requestAnimationFrame(() => {
              resizeCanvas();
              drawStateAtStep(isReducedMotion ? 119 : 0);
            });
            onLoadProgressRef.current?.(100);
            onLoadCompleteRef.current?.();
            return;
          } catch {
            // Fall through cleanly
          }
        }
      }

      setHasMedia(false);
      setMediaMissing(true);
      onLoadProgressRef.current?.(100);
      onLoadCompleteRef.current?.();
    };

    init();

    return () => {
      signal.cancelled = true;
      revokeObjectUrls();
    };
  }, [
    enabled,
    src,
    framesDir,
    optional,
    previewFirstFrame,
    previewLastFrame,
    isReducedMotion,
    extractFromVideoUrl,
    loadFromFramesFolder,
    resizeCanvas,
    drawStateAtStep,
    revokeObjectUrls,
  ]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (optional && mediaMissing) return;
    if (isReducedMotion) {
      setProgress(1);
      return;
    }

    const sectionEl = sectionRef.current;
    if (!sectionEl) return;

    const trigger = ScrollTrigger.create({
      trigger: sectionEl,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        targetProgressRef.current = self.progress;
      },
    });

    let rafId = 0;
    const loop = () => {
      const target = targetProgressRef.current;
      const cur = currentProgressRef.current;
      const diff = target - cur;
      const next = Math.abs(diff) < 0.0005 ? target : cur + diff * 0.15;
      currentProgressRef.current = next;

      const totalSteps =
        framesRef.current.length > 0
          ? framesRef.current.length
          : previewPairRef.current
            ? 120
            : 0;

      if (totalSteps > 0) {
        const stepIdx = Math.round(next * (totalSteps - 1));
        if (stepIdx !== lastDrawnFrameRef.current) {
          drawStateAtStep(stepIdx);
        }
      }

      if (Math.abs(next - lastEmittedProgressRef.current) >= 0.0015) {
        lastEmittedProgressRef.current = next;
        setProgress(next);
      }

      rafId = window.requestAnimationFrame(loop);
    };

    rafId = window.requestAnimationFrame(loop);

    return () => {
      trigger.kill();
      window.cancelAnimationFrame(rafId);
    };
  }, [drawStateAtStep, isReducedMotion, mediaMissing, optional]);

  const handleVideoFile = useCallback(
    (file: File | null | undefined) => {
      if (!file) return;
      const previewUrl = URL.createObjectURL(file);
      extractFromVideoUrl(previewUrl, false).finally(() => {
        URL.revokeObjectURL(previewUrl);
      });
    },
    [extractFromVideoUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleVideoFile(file);
      }
    },
    [handleVideoFile]
  );

  const triggerFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (optional && mediaMissing && !hasMedia) {
    return null;
  }

  const canvasVisible = hasMedia || hasKeyframesPreview;

  return (
    <section
      id={id}
      ref={sectionRef}
      className="relative w-full"
      style={{
        height: isReducedMotion ? '100svh' : scrollLength,
        backgroundColor: '#F2EEE8',
      }}
    >
      <div
        className="sticky top-0 h-[100svh] w-full overflow-hidden"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full block"
          style={{ opacity: canvasVisible ? 1 : 0 }}
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            handleVideoFile(file);
            e.target.value = '';
          }}
        />

        {/* Minimal dashed drop frame ONLY when neither video nor keyframes exist */}
        {!hasMedia && !hasKeyframesPreview && mediaMissing && (
          <div className="absolute inset-0 z-30 flex items-center justify-center px-6">
            <button
              type="button"
              onClick={triggerFileDialog}
              className="w-full max-w-[360px] aspect-[16/10] flex flex-col items-center justify-center bg-transparent cursor-pointer rounded-[2px]"
              style={{ border: '1px dashed rgba(36, 30, 26, 0.3)' }}
            >
              <span className="font-label" style={{ color: '#241E1A' }}>
                {isExtracting
                  ? `${String(extractPercent).padStart(3, '0')}%`
                  : src}
              </span>
            </button>
          </div>
        )}

        {/* Active drag/extraction visual feedback (zero idle dev clutter) */}
        {(isDragging || isExtracting) && (
          <div
            className="absolute inset-6 z-40 flex flex-col items-center justify-center gap-4 pointer-events-none rounded-[2px]"
            style={{
              border: '1px dashed #A7C1D9',
              backgroundColor: 'rgba(242, 238, 232, 0.78)',
            }}
          >
            <span className="font-label tabular-nums" style={{ color: '#241E1A' }}>
              {isExtracting
                ? `${String(extractPercent).padStart(3, '0')}%`
                : 'HERO.MP4'}
            </span>
            {isExtracting && (
              <div
                className="w-40 h-[1px] relative overflow-hidden"
                style={{ backgroundColor: 'rgba(36, 30, 26, 0.16)' }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-full origin-left"
                  style={{
                    backgroundColor: '#A7C1D9',
                    transform: `scaleX(${extractPercent / 100})`,
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Overlay choreography layer */}
        <div className="relative z-20 h-full w-full pointer-events-none">
          {children?.({
            progress: isReducedMotion ? 1 : progress,
            hasMedia,
            hasKeyframesPreview,
            isExtracting,
            extractPercent,
            isReducedMotion,
            triggerFileDialog,
          })}
        </div>
      </div>
    </section>
  );
};
