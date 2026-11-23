import React from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { BrandLogo } from '../components/BrandLogo';

interface FooterSectionProps {
  lang: Lang;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ lang }) => {
  const lineHref = `https://line.me/R/ti/p/${encodeURIComponent(SITE_CONFIG.contact.lineOfficialId)}`;
  const igHref = `https://instagram.com/${SITE_CONFIG.contact.instagramHandle}`;

  return (
    <footer
      className="w-full px-5 sm:px-12 py-8 border-t border-[#3B2B2C]/10"
      style={{ backgroundColor: '#F3EDE6' }}
    >
      <div className="max-w-[1080px] mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-[12px] tracking-[0.08em] text-[#7E6B6C]">
        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <BrandLogo size="sm" />
          <span>{SITE_CONFIG.contact.address[lang]}</span>
          <span>{SITE_CONFIG.contact.hours[lang]}</span>
        </div>

        <div className="flex items-center gap-5 font-num text-[12px]">
          <a
            href={lineHref}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline text-[#3B2B2C] hover:text-[#C9989A] transition-colors"
          >
            LINE
          </a>
          <a
            href={igHref}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline text-[#3B2B2C] hover:text-[#C9989A] transition-colors"
          >
            Instagram
          </a>
          <a
            href={SITE_CONFIG.contact.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="no-underline text-[#7E6B6C] hover:text-[#3B2B2C] transition-colors"
          >
            Maps ↗
          </a>
        </div>
      </div>
    </footer>
  );
};
