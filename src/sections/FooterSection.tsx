import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';

gsap.registerPlugin(ScrollTrigger);

interface FooterSectionProps {
  lang: Lang;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ lang }) => {
  const footerRef = useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setRevealed(true);
      return;
    }

    const el = footerRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 84%',
      once: true,
      onEnter: () => setRevealed(true),
    });

    return () => trigger.kill();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative z-10 w-full hairline-t pt-14 sm:pt-20 pb-8 sm:pb-10 px-5 sm:px-8 lg:px-12 overflow-hidden"
      style={{ backgroundColor: '#F2EEE8', color: '#241E1A' }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-y-6 gap-x-10 pb-14 sm:pb-20 font-label">
        <div className="flex flex-wrap items-baseline gap-4">
          <span style={{ color: '#241E1A' }}>{SITE_CONFIG.contact.address[lang]}</span>
          <a
            href={SITE_CONFIG.contact.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline pb-0.5 transition-colors hover:border-[#A7C1D9]"
            style={{
              color: '#8A8178',
              borderBottom: '1px solid rgba(36, 30, 26, 0.25)',
            }}
          >
            {SITE_CONFIG.footer.openMaps[lang]}
          </a>
        </div>

        <span style={{ color: '#8A8178' }}>{SITE_CONFIG.contact.hours[lang]}</span>

        <div className="flex items-baseline gap-6">
          <a
            href={`https://instagram.com/${SITE_CONFIG.contact.instagramHandle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline transition-opacity hover:opacity-60"
            style={{ color: '#241E1A' }}
          >
            @{SITE_CONFIG.contact.instagramHandle}
          </a>
          <span style={{ color: '#8A8178' }}>LINE {SITE_CONFIG.contact.lineOfficialId}</span>
        </div>
      </div>

      <div className="hairline-t pt-6 sm:pt-8 pb-2 overflow-hidden select-none">
        <div
          className="font-editorial text-center whitespace-nowrap leading-[1.06] pb-[0.06em]"
          style={{
            fontSize: 'clamp(2.8rem, 13.5vw, 14.5vw)',
            letterSpacing: '-0.03em',
            color: '#241E1A',
            transform: revealed ? 'translate3d(0, 0%, 0)' : 'translate3d(0, 108%, 0)',
            opacity: revealed ? 1 : 0,
            transitionProperty: 'transform, opacity',
            transitionDuration: '1.15s',
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            willChange: 'transform, opacity',
          }}
        >
          {SITE_CONFIG.brandName}
        </div>
      </div>
    </footer>
  );
};
