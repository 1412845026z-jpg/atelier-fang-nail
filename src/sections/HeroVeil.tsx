import React from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { ScrollSequence } from '../components/ScrollSequence';

interface HeroVeilProps {
  lang: Lang;
  onLoadProgress: (percent: number) => void;
  onLoadComplete: () => void;
  onBookClick: () => void;
}

export const HeroVeil: React.FC<HeroVeilProps> = ({
  lang,
  onLoadProgress,
  onLoadComplete,
  onBookClick,
}) => {
  return (
    <ScrollSequence
      id="hero"
      src={SITE_CONFIG.media.heroVideo}
      framesDir={SITE_CONFIG.media.heroFramesDir}
      previewFirstFrame={SITE_CONFIG.media.heroPreviewFirst}
      previewLastFrame={SITE_CONFIG.media.heroPreviewLast}
      scrollLength="400vh"
      onLoadProgress={onLoadProgress}
      onLoadComplete={onLoadComplete}
    >
      {({ progress, isReducedMotion }) => {
        // 0 -> 0.22: Giant serif brand wordmark opens tracking -0.04em -> 0.02em and dissolves
        const titleT = isReducedMotion ? 1 : Math.max(0, Math.min(1, progress / 0.22));
        const titleSpacing = -0.04 + titleT * 0.06;
        const titleOpacity = isReducedMotion ? 0 : Math.max(0, 1 - Math.pow(titleT, 1.35));
        const titleLift = -titleT * 24;

        // 0.78 -> 1.0: Quiet single action button rises cleanly from mask
        const ctaVisible = isReducedMotion || progress >= 0.76;

        // Pure visual vertical scroll-peel cue fades cleanly near end of reveal
        const scrollCueOpacity = isReducedMotion
          ? 0
          : Math.max(0, Math.min(1, (0.96 - progress) / 0.08));

        return (
          <div className="relative h-full w-full px-5 sm:px-8 lg:px-12">
            {/* Opening monumental serif wordmark */}
            <div
              className="absolute inset-x-0 top-[21vh] sm:top-[18vh] flex justify-center px-4 select-none"
              style={{
                opacity: titleOpacity,
                transform: `translate3d(0, ${titleLift}px, 0)`,
                willChange: 'transform, opacity',
              }}
            >
              <h1
                className="font-editorial m-0 text-center whitespace-nowrap leading-[0.88]"
                style={{
                  fontSize: 'clamp(3.1rem, 13.8vw, 15.2vw)',
                  letterSpacing: `${titleSpacing.toFixed(4)}em`,
                  color: '#241E1A',
                }}
              >
                {SITE_CONFIG.brandName}
              </h1>
            </div>

            {/* Revealed state CTA (right side, zero explanatory copy) */}
            <div className="absolute right-5 sm:right-8 lg:right-12 bottom-16 sm:bottom-20 md:top-1/2 md:bottom-auto md:-translate-y-1/2">
              <div className="overflow-hidden pt-1">
                <div
                  className="pointer-events-auto inline-block"
                  style={{
                    transform: ctaVisible
                      ? 'translate3d(0, 0%, 0)'
                      : 'translate3d(0, 115%, 0)',
                    opacity: ctaVisible ? 1 : 0,
                    transitionProperty: 'transform, opacity',
                    transitionDuration: isReducedMotion ? '0s' : '0.95s',
                    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                >
                  <button
                    type="button"
                    onClick={onBookClick}
                    className="group relative inline-flex items-center gap-5 px-8 py-4 rounded-[2px] border-0 cursor-pointer font-label"
                    style={{
                      backgroundColor: '#241E1A',
                      color: '#F2EEE8',
                    }}
                  >
                    <span>{SITE_CONFIG.hero.cta[lang]}</span>
                    <span
                      className="inline-block h-[1px] w-8 origin-left transition-transform duration-500 group-hover:scale-x-125"
                      style={{ backgroundColor: '#A7C1D9' }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Pure visual scroll gesture guide (animated vertical hairline + growing progress line) */}
            <div
              className="absolute left-5 sm:left-8 lg:left-12 bottom-7 flex items-center gap-4 select-none"
              style={{
                opacity: scrollCueOpacity,
                transition: 'opacity 0.4s ease',
              }}
            >
              <div className="relative w-[1px] h-7 overflow-hidden" style={{ backgroundColor: 'rgba(36,30,26,0.16)' }}>
                <div
                  className="w-full h-full animate-scroll-tick"
                  style={{ backgroundColor: '#241E1A' }}
                />
              </div>
              <div
                className="relative h-[1px] w-24 sm:w-32 overflow-hidden"
                style={{ backgroundColor: 'rgba(36, 30, 26, 0.16)' }}
              >
                <div
                  className="absolute inset-y-0 left-0 w-full origin-left"
                  style={{
                    backgroundColor: '#241E1A',
                    transform: `scaleX(${Math.max(0.1, progress)})`,
                    willChange: 'transform',
                  }}
                />
              </div>
              <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                {String(Math.round(progress * 100)).padStart(3, '0')}
              </span>
            </div>
          </div>
        );
      }}
    </ScrollSequence>
  );
};
