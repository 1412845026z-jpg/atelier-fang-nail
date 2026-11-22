import React, { useEffect, useRef, useState } from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onNavigate: (sectionId: string) => void;
}

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'ja', label: 'JP' },
  { code: 'en', label: 'EN' },
];

/**
 * Solid-surface editorial header:
 * - Transparent only over opening hero veil
 * - Solid oatmeal (#F2EEE8) + 1px bottom hairline past hero (zero glassmorphism!)
 * - Auto-hides on downward scroll, reappears cleanly on upward scroll so it never collides with content
 */
export const Header: React.FC<HeaderProps> = ({
  lang,
  onLangChange,
  onNavigate,
}) => {
  const [onDark, setOnDark] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const heroThreshold = window.innerHeight * 0.65;
      setPastHero(y > heroThreshold);

      // Hide when scrolling down past hero; reveal immediately on scroll up or near top
      const delta = y - lastScrollYRef.current;
      if (y <= 120) {
        setHidden(false);
      } else if (delta > 12 && y > heroThreshold) {
        setHidden(true);
      } else if (delta < -8) {
        setHidden(false);
      }
      lastScrollYRef.current = y;

      const darkSections = document.querySelectorAll<HTMLElement>('[data-theme="dark"]');
      let overlapping = false;
      darkSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 56 && rect.bottom >= 24) {
          overlapping = true;
        }
      });
      setOnDark(overlapping);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const inkColor = onDark ? '#F2EEE8' : '#241E1A';
  const mutedColor = onDark ? 'rgba(242, 238, 232, 0.5)' : '#8A8178';
  const pillBg = onDark ? '#F2EEE8' : '#241E1A';
  const pillText = onDark ? '#1C1917' : '#F2EEE8';
  const barBg = !pastHero
    ? 'transparent'
    : onDark
      ? '#1C1917'
      : '#F2EEE8';
  const barBorder = !pastHero
    ? '1px solid transparent'
    : onDark
      ? '1px solid rgba(242, 238, 232, 0.14)'
      : '1px solid rgba(36, 30, 26, 0.14)';

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 px-5 sm:px-8 lg:px-12 h-[60px] flex items-center justify-between"
      style={{
        color: inkColor,
        backgroundColor: barBg,
        borderBottom: barBorder,
        transform: hidden ? 'translate3d(0, -105%, 0)' : 'translate3d(0, 0, 0)',
        transitionProperty: 'transform, background-color, border-color, color',
        transitionDuration: '0.42s',
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <a
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('hero');
        }}
        className="no-underline"
      >
        <BrandLogo color={inkColor} size="sm" />
      </a>

      <nav aria-label="Primary" className="hidden md:flex items-center gap-8">
        <a
          href="#tryon"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('tryon');
          }}
          className="font-label no-underline transition-opacity duration-300 hover:opacity-55"
          style={{ color: inkColor }}
        >
          {SITE_CONFIG.nav.tryon[lang]}
        </a>
        <a
          href="#works"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('works');
          }}
          className="font-label no-underline transition-opacity duration-300 hover:opacity-55"
          style={{ color: inkColor }}
        >
          {SITE_CONFIG.nav.works[lang]}
        </a>
        <a
          href="#services"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('services');
          }}
          className="font-label no-underline transition-opacity duration-300 hover:opacity-55"
          style={{ color: inkColor }}
        >
          {SITE_CONFIG.nav.services[lang]}
        </a>
        <a
          href="#booking"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('booking');
          }}
          className="font-label no-underline transition-opacity duration-300 hover:opacity-55"
          style={{ color: inkColor }}
        >
          {SITE_CONFIG.nav.booking[lang]}
        </a>
      </nav>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="flex items-center gap-2 font-label" aria-label="Language switch">
          {LANG_OPTIONS.map((item, idx) => {
            const active = lang === item.code;
            return (
              <React.Fragment key={item.code}>
                <button
                  type="button"
                  onClick={() => onLangChange(item.code)}
                  className="bg-transparent border-0 p-0 cursor-pointer transition-colors duration-300"
                  style={{
                    color: active ? inkColor : mutedColor,
                    borderBottom: active ? '1px solid #A7C1D9' : '1px solid transparent',
                    paddingBottom: '2px',
                  }}
                >
                  {item.label}
                </button>
                {idx < LANG_OPTIONS.length - 1 && (
                  <span style={{ color: mutedColor, opacity: 0.45 }}>/</span>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onNavigate('booking')}
          className="rounded-full px-4 sm:px-5 py-2 font-label border-0 cursor-pointer transition-transform duration-500 active:scale-95"
          style={{
            backgroundColor: pillBg,
            color: pillText,
            transition:
              'background-color 0.4s cubic-bezier(0.22, 1, 0.36, 1), color 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {SITE_CONFIG.nav.booking[lang]}
        </button>
      </div>
    </header>
  );
};
