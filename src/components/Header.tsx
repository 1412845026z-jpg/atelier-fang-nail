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
 * Refined Japanese beauty top bar:
 * - Strictly 4 verbatim navigation entries: ネイルを選ぶ / デザイン / サロン / 相談・予約
 * - Sheer-milk surface (#F7F1EE) + 1px soft rose hairline once scrolled past hero
 * - Auto-hides gently on scroll down, reappears smoothly on scroll up
 */
export const Header: React.FC<HeaderProps> = ({
  lang,
  onLangChange,
  onNavigate,
}) => {
  const [pastHero, setPastHero] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const heroThreshold = Math.max(420, window.innerHeight * 0.72);
      setPastHero(y > heroThreshold);

      const delta = y - lastScrollYRef.current;
      if (y <= 100) {
        setHidden(false);
      } else if (delta > 14 && y > heroThreshold && !mobileMenuOpen) {
        setHidden(true);
      } else if (delta < -10) {
        setHidden(false);
      }
      lastScrollYRef.current = y;
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileMenuOpen]);

  const navItems = [
    { id: 'vanity', label: SITE_CONFIG.nav.vanity[lang] },
    { id: 'tips', label: SITE_CONFIG.nav.designs[lang] },
    { id: 'salon', label: SITE_CONFIG.nav.salon[lang] },
    { id: 'counseling', label: SITE_CONFIG.nav.counseling[lang] },
  ];

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className="fixed top-0 inset-x-0 z-50"
      style={{
        transform: hidden ? 'translate3d(0, -105%, 0)' : 'translate3d(0, 0, 0)',
        transition: 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      <div
        className="px-5 sm:px-8 lg:px-14 h-[58px] flex items-center justify-between"
        style={{
          backgroundColor:
            pastHero || mobileMenuOpen ? 'rgba(247, 241, 238, 0.96)' : 'transparent',
          borderBottom:
            pastHero || mobileMenuOpen
              ? '1px solid rgba(59, 43, 44, 0.09)'
              : '1px solid transparent',
          transition: 'background-color 0.4s ease, border-color 0.4s ease',
        }}
      >
        <a
          href="#hero"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('hero');
          }}
          className="no-underline"
          aria-label={SITE_CONFIG.brandName}
        >
          <BrandLogo size="sm" />
        </a>

        {/* Desktop 4 verbatim links */}
        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 lg:gap-10">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.id);
              }}
              className="text-[12.5px] tracking-[0.12em] font-body no-underline transition-colors duration-300 hover:text-[#C9989A]"
              style={{ color: '#3B2B2C' }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right: JP/EN switcher + subtle mobile menu button */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div
            className="flex items-center gap-2 font-num text-[12px]"
            aria-label="Language switch"
          >
            {LANG_OPTIONS.map((item, idx) => {
              const active = lang === item.code;
              return (
                <React.Fragment key={item.code}>
                  <button
                    type="button"
                    onClick={() => onLangChange(item.code)}
                    className="bg-transparent border-0 p-0 cursor-pointer transition-colors duration-300"
                    style={{
                      color: active ? '#3B2B2C' : '#7E6B6C',
                      borderBottom: active ? '1px solid #C9989A' : '1px solid transparent',
                      paddingBottom: '1px',
                    }}
                  >
                    {item.label}
                  </button>
                  {idx === 0 && <span className="text-[#7E6B6C]/45">/</span>}
                </React.Fragment>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="md:hidden bg-transparent border-0 p-1.5 cursor-pointer flex flex-col justify-center gap-[5px]"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span
              className="block w-5 h-[1px] bg-[#3B2B2C] transition-transform duration-300"
              style={{
                transform: mobileMenuOpen ? 'translateY(3px) rotate(45deg)' : 'none',
              }}
            />
            <span
              className="block w-5 h-[1px] bg-[#3B2B2C] transition-transform duration-300"
              style={{
                transform: mobileMenuOpen ? 'translateY(-3px) rotate(-45deg)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Minimal mobile dropdown */}
      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden px-6 py-5 flex flex-col gap-4 border-b border-[#3B2B2C]/10"
          style={{ backgroundColor: '#F7F1EE' }}
        >
          {navItems.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className="bg-transparent border-0 p-0 text-left flex items-baseline gap-3 cursor-pointer"
            >
              <span className="font-num text-[12px] text-[#C7A97F]">
                0{idx + 1}
              </span>
              <span className="font-mincho text-[16px] tracking-[0.08em] text-[#3B2B2C]">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
