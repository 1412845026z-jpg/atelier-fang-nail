import React, { useEffect, useState } from 'react';
import { Lang, SITE_CONFIG } from '../config';

interface HeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onNavigate: (sectionId: string) => void;
}

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'ja', label: 'JP' },
  { code: 'en', label: 'EN' },
];

export const Header: React.FC<HeaderProps> = ({
  lang,
  onLangChange,
  onNavigate,
}) => {
  const [onDark, setOnDark] = useState(false);

  useEffect(() => {
    const checkDarkOverlap = () => {
      const darkSections = document.querySelectorAll<HTMLElement>('[data-theme="dark"]');
      let overlapping = false;
      darkSections.forEach((sec) => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 48 && rect.bottom >= 24) {
          overlapping = true;
        }
      });
      setOnDark(overlapping);
    };

    checkDarkOverlap();
    window.addEventListener('scroll', checkDarkOverlap, { passive: true });
    window.addEventListener('resize', checkDarkOverlap);
    return () => {
      window.removeEventListener('scroll', checkDarkOverlap);
      window.removeEventListener('resize', checkDarkOverlap);
    };
  }, []);

  const inkColor = onDark ? '#F2EEE8' : '#241E1A';
  const mutedColor = onDark ? 'rgba(242, 238, 232, 0.5)' : '#8A8178';
  const pillBg = onDark ? '#F2EEE8' : '#241E1A';
  const pillText = onDark ? '#1C1917' : '#F2EEE8';

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 px-5 sm:px-8 lg:px-12 py-4 flex items-center justify-between pointer-events-none"
      style={{
        color: inkColor,
        transition: 'color 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <a
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('hero');
        }}
        className="pointer-events-auto font-editorial text-[19px] sm:text-[21px] tracking-[-0.01em] leading-none no-underline"
        style={{ color: inkColor }}
      >
        {SITE_CONFIG.brandName}
      </a>

      <nav
        aria-label="Primary"
        className="pointer-events-auto hidden md:flex items-center gap-9"
      >
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

      <div className="pointer-events-auto flex items-center gap-4 sm:gap-6">
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
