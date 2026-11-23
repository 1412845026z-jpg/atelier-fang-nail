import React, { useEffect, useState } from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { ActiveCardSpec } from '../types/nail';
import {
  buildLineBookingUrl,
  buildOrdermadeLineUrl,
  buildShareableUrl,
  computeDesktopCardSceneLayout,
  copyTextToClipboard,
  formatYen,
} from '../utils/designCodec';
import { exportDesignCardPng } from '../utils/exportDesignCard';

interface DesignCardOverlayProps {
  open: boolean;
  spec: ActiveCardSpec;
  lang: Lang;
  selfCompositeDataUrl?: string | null;
  onClose: () => void;
}

/**
 * Shots 7 & 8 · Design Card & Post-Card オーダーメイド Invitation (Section 3A.1 compliant):
 * - NO duplicate hand screenshot pasted inside the card: the real manicured hand is ALREADY right beside/above it in the photograph!
 * - On desktop (>=768px), typography overlays with transparent background directly inside the real photographed cotton paper card's fine gold-foil frame in `card-in-scene.jpg` (11.15° natural table angle).
 * - On mobile (<768px), a whisper-thin translucent Japanese washi stationery card floats gracefully in the lower third beneath the hand.
 * - Clicking 「保存」 exports the complete standalone 1080×1350 PNG card (with close-up manicured hand portrait + gold border + metadata).
 */
export const DesignCardOverlay: React.FC<DesignCardOverlayProps> = ({
  open,
  spec,
  lang,
  selfCompositeDataUrl,
  onClose,
}) => {
  const [savedFlag, setSavedFlag] = useState(false);
  const [sharedFlag, setSharedFlag] = useState(false);
  const [showOrdermade, setShowOrdermade] = useState(false);
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1440,
    h: typeof window !== 'undefined' ? window.innerHeight : 900,
  }));

  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!open) {
      setShowOrdermade(false);
      return;
    }
    const timer = window.setTimeout(() => setShowOrdermade(true), 650);
    return () => clearTimeout(timer);
  }, [open, spec.codeNumber]);

  const handleSave = async () => {
    const ok = await exportDesignCardPng(
      spec,
      lang,
      spec.mode === 'self' ? selfCompositeDataUrl : null
    );
    if (ok) {
      setSavedFlag(true);
      window.setTimeout(() => setSavedFlag(false), 2000);
    }
  };

  const handleShare = async () => {
    const url = buildShareableUrl(spec);
    if (navigator.share) {
      try {
        await navigator.share({ title: `${SITE_CONFIG.brandName} · ${spec.title.ja}`, url });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    const ok = await copyTextToClipboard(url);
    if (ok) {
      setSharedFlag(true);
      window.setTimeout(() => setSharedFlag(false), 2000);
    }
  };

  const desktopLayout = computeDesktopCardSceneLayout(vp.w, vp.h);

  const cardInnerContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="flex items-baseline justify-between">
        <span className="font-garamond text-[12px] tracking-[0.12em] text-[#7E6B6C]">
          {SITE_CONFIG.brandName}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-num text-[11px] text-[#C7A97F]">{spec.codeNumber}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close card"
            className="bg-transparent border-0 p-0.5 text-[13.5px] leading-none text-[#7E6B6C] hover:text-[#3B2B2C] cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>

      <div className="my-3">
        <div className="flex items-center gap-1.5 mb-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full border border-[#C7A97F]/70 shrink-0"
            style={{ backgroundColor: spec.swatchHex }}
          />
          <span className="font-num text-[10px] tracking-[0.08em] text-[#7E6B6C] truncate">
            {spec.subtitle[lang]}
          </span>
        </div>

        <h2 className="m-0 font-mincho text-[17.5px] tracking-[0.07em] text-[#3B2B2C] leading-relaxed font-normal">
          {spec.title[lang]}
        </h2>

        <div className="mt-3 pt-2.5 border-t border-[#C7A97F]/35 flex items-baseline justify-between">
          <span className="font-num text-[13px] tracking-[0.08em] text-[#3B2B2C]">
            {formatYen(spec.priceYen)}
          </span>
          <span className="font-num text-[11px] tracking-[0.08em] text-[#7E6B6C]">
            {lang === 'ja' ? `${spec.durationMin}分` : `${spec.durationMin} min`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleSave}
          className="px-2.5 py-1.5 bg-transparent border border-[#3B2B2C]/20 text-[10.5px] tracking-[0.08em] text-[#3B2B2C] hover:border-[#C9989A] cursor-pointer transition-colors"
        >
          {savedFlag
            ? SITE_CONFIG.cardActions.saved[lang]
            : SITE_CONFIG.cardActions.save[lang]}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="px-2.5 py-1.5 bg-transparent border border-[#3B2B2C]/20 text-[10.5px] tracking-[0.08em] text-[#3B2B2C] hover:border-[#C9989A] cursor-pointer transition-colors"
        >
          {sharedFlag
            ? SITE_CONFIG.cardActions.copied[lang]
            : SITE_CONFIG.cardActions.share[lang]}
        </button>
        <a
          href={buildLineBookingUrl(spec, lang)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 text-center no-underline text-[10.5px] tracking-[0.1em] text-[#FAF6F1] transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#3B2B2C' }}
        >
          {SITE_CONFIG.cardActions.lineBook[lang]}
        </a>
      </div>
    </div>
  );

  return (
    <div
      className="absolute inset-0 z-30 pointer-events-none"
      style={{
        opacity: open ? 1 : 0,
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {open && (
        <div
          onClick={onClose}
          className="absolute inset-0 pointer-events-auto cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* DESKTOP (>=768px): Letterpress-clean typography aligned 1:1 inside the real photographed cotton paper card in card-in-scene.jpg */}
      <div
        className="hidden md:block absolute"
        style={{
          left: `${desktopLayout.cardCx.toFixed(1)}px`,
          top: `${desktopLayout.cardCy.toFixed(1)}px`,
          width: '246px',
          height: '314px',
          pointerEvents: open ? 'auto' : 'none',
          transformOrigin: 'center center',
          transform: open
            ? `translate(-50%, -50%) rotate(${desktopLayout.cardAngleDeg}deg) scale(${desktopLayout.scale.toFixed(4)})`
            : `translate(-46%, -47%) rotate(${(desktopLayout.cardAngleDeg + 1.6).toFixed(2)}deg) scale(${(desktopLayout.scale * 0.985).toFixed(4)})`,
          transition: 'transform 0.72s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: 'transparent',
        }}
      >
        {cardInnerContent}
      </div>

      {/* Shot 8 · オーダーメイド — strictly appears ONLY AFTER the Design Card is revealed */}
      <div
        className="hidden md:block absolute transition-all duration-700"
        style={{
          left: `${desktopLayout.ordermadeCx.toFixed(1)}px`,
          top: `${desktopLayout.ordermadeCy.toFixed(1)}px`,
          opacity: showOrdermade ? 1 : 0,
          transform: showOrdermade
            ? 'translate(-50%, -50%)'
            : 'translate(-50%, calc(-50% + 6px))',
          pointerEvents: showOrdermade ? 'auto' : 'none',
        }}
      >
        <a
          href={buildOrdermadeLineUrl(spec, lang)}
          target="_blank"
          rel="noopener noreferrer"
          className="paper-grain inline-block py-1.5 px-4 rounded-full no-underline font-mincho text-[12px] tracking-[0.12em] text-[#3B2B2C] hover:text-[#C9989A] transition-colors whitespace-nowrap"
          style={{
            backgroundColor: 'rgba(251, 248, 244, 0.78)',
            border: '1px solid rgba(199, 169, 127, 0.34)',
          }}
        >
          {SITE_CONFIG.poetry.ordermadeAfterCard[lang]}
        </a>
      </div>

      {/* MOBILE (<768px): Whisper-thin translucent washi card resting cleanly below the manicured hand */}
      <div
        className="md:hidden absolute inset-x-0 bottom-5 px-5 flex flex-col items-center"
        style={{
          pointerEvents: open ? 'auto' : 'none',
          transform: open ? 'translate3d(0, 0, 0)' : 'translate3d(0, 18px, 0)',
          transition: 'transform 0.68s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <article
          className="w-full max-w-[332px] paper-grain relative p-5"
          style={{
            backgroundColor: 'rgba(251, 248, 243, 0.84)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(199, 169, 127, 0.50)',
            boxShadow: '0 14px 34px rgba(42, 29, 31, 0.10)',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[5px]"
            style={{ border: '1px solid rgba(199, 169, 127, 0.26)' }}
          />
          <div className="relative z-10">{cardInnerContent}</div>
        </article>

        <div
          className="mt-3 text-center transition-all duration-700"
          style={{
            opacity: showOrdermade ? 1 : 0,
            transform: showOrdermade ? 'translate3d(0, 0, 0)' : 'translate3d(0, 6px, 0)',
            pointerEvents: showOrdermade ? 'auto' : 'none',
          }}
        >
          <a
            href={buildOrdermadeLineUrl(spec, lang)}
            target="_blank"
            rel="noopener noreferrer"
            className="paper-grain inline-block py-1 px-3.5 rounded-full no-underline font-mincho text-[12px] tracking-[0.12em] text-[#3B2B2C]"
            style={{
              backgroundColor: 'rgba(251, 248, 244, 0.78)',
              border: '1px solid rgba(199, 169, 127, 0.32)',
            }}
          >
            {SITE_CONFIG.poetry.ordermadeAfterCard[lang]}
          </a>
        </div>
      </div>
    </div>
  );
};
