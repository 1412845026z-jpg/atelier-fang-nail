import React, { useEffect, useRef, useState } from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { BrandLogo } from './BrandLogo';

interface HeaderProps {
  lang: Lang;
  onLangChange: (lang: Lang) => void;
  onNavigate: (target: 'vanity' | 'self' | 'salon' | 'card') => void;
}

const LANG_OPTIONS: { code: Lang; label: string }[] = [
  { code: 'ja', label: 'JP' },
  { code: 'en', label: 'EN' },
];

export const Header: React.FC<HeaderProps> = ({ lang, onLangChange, onNavigate }) => {
  const [pastOpening, setPastOpening] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const threshold = Math.max(320, window.innerHeight * 0.65);
      setPastOpening(y > threshold);
      const dy = y - lastYRef.current;
      if (y <= 80) setHidden(false);
      else if (dy > 16 && y > threshold && !mobileMenuOpen) setHidden(true);
      else if (dy < -10) setHidden(false);
      lastYRef.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileMenuOpen]);

  const navItems: { id: 'vanity' | 'self' | 'salon' | 'card'; label: string }[] = [
    { id: 'vanity', label: SITE_CONFIG.nav.vanity[lang] },
    { id: 'self', label: SITE_CONFIG.nav.designs[lang] },
    { id: 'salon', label: SITE_CONFIG.nav.salon[lang] },
    { id: 'card', label: SITE_CONFIG.nav.counseling[lang] },
  ];

  const handleClick = (id: 'vanity' | 'self' | 'salon' | 'card') => {
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
        className="px-5 sm:px-8 lg:px-14 h-[56px] flex items-center justify-between"
        style={{
          backgroundColor:
            pastOpening || mobileMenuOpen ? 'rgba(247, 241, 238, 0.88)' : 'transparent',
          backdropFilter: pastOpening || mobileMenuOpen ? 'blur(10px)' : 'none',
          borderBottom:
            pastOpening || mobileMenuOpen
              ? '1px solid rgba(59, 43, 44, 0.08)'
              : '1px solid transparent',
          transition: 'background-color 0.4s ease, border-color 0.4s ease',
        }}
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setMobileMenuOpen(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="no-underline"
          aria-label={SITE_CONFIG.brandName}
        >
          <BrandLogo size="sm" />
        </a>

        <nav aria-label="Primary" className="hidden md:flex items-center gap-8 lg:gap-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className="bg-transparent border-0 p-0 text-[12.5px] tracking-[0.12em] font-body cursor-pointer transition-colors duration-300 hover:text-[#C9989A]"
              style={{ color: '#3B2B2C' }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 font-num text-[11.5px]" aria-label="Language">
            {LANG_OPTIONS.map((item, idx) => {
              const active = lang === item.code;
              return (
                <React.Fragment key={item.code}>
                  <button
                    type="button"
                    onClick={() => onLangChange(item.code)}
                    className="bg-transparent border-0 p-0 cursor-pointer"
                    style={{
                      color: active ? '#3B2B2C' : '#7E6B6C',
                      borderBottom: active ? '1px solid #C9989A' : '1px solid transparent',
                    }}
                  >
                    {item.label}
                  </button>
                  {idx === 0 && <span className="text-[#7E6B6C]/40">/</span>}
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

      {mobileMenuOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden px-6 py-5 flex flex-col gap-4 border-b border-[#3B2B2C]/10"
          style={{ backgroundColor: 'rgba(247, 241, 238, 0.97)' }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleClick(item.id)}
              className="bg-transparent border-0 p-0 text-left font-mincho text-[15.5px] tracking-[0.08em] text-[#3B2B2C] cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
};
