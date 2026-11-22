import React, { useState } from 'react';
import { Lang, SITE_CONFIG } from '../config';

interface FooterSectionProps {
  lang: Lang;
}

/**
 * Quiet, thin Japanese beauty footer in the same sheer-milk / rose-brown / champagne-gold voice.
 * Houses placeholder FAQ accordion (matched by JSON-LD FAQPage), Tokyo access, hours, and soft wordmark.
 */
export const FooterSection: React.FC<FooterSectionProps> = ({ lang }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <footer
      className="w-full pt-14 pb-10 px-5 sm:px-10 lg:px-16"
      style={{
        backgroundColor: '#F7F1EE',
        borderTop: '1px solid rgba(59, 43, 44, 0.09)',
      }}
    >
      <div className="max-w-[1080px] mx-auto space-y-14">
        {/* Compact Two-Column Grid: Placeholder FAQ + Access & Hours */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Placeholder FAQ Accordion */}
          <div className="md:col-span-7 space-y-3">
            <h2 className="m-0 font-mincho text-[14px] tracking-[0.14em] text-[#7E6B6C]">
              {SITE_CONFIG.footer.faqHeading[lang]}
            </h2>

            <div className="border-t border-[#3B2B2C]/10">
              {SITE_CONFIG.faqs.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div
                    key={idx}
                    className="border-b border-[#3B2B2C]/10 py-3.5"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                      className="w-full bg-transparent border-0 p-0 text-left cursor-pointer flex items-center justify-between gap-4"
                    >
                      <span className="text-[13px] tracking-[0.04em] text-[#3B2B2C] font-body">
                        {item.q[lang]}
                      </span>
                      <span
                        className="font-num text-[15px] text-[#C7A97F] shrink-0 transition-transform duration-300"
                        style={{
                          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                        }}
                      >
                        +
                      </span>
                    </button>

                    {isOpen && (
                      <p className="m-0 pt-2.5 text-[12.5px] leading-[1.85] text-[#7E6B6C]">
                        {item.a[lang]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Access, Hours & Social Channels */}
          <div className="md:col-span-5 space-y-5 text-[12.5px] leading-[1.85] text-[#3B2B2C]">
            <div className="space-y-1">
              <p className="m-0 font-num text-[11px] text-[#C7A97F]">ACCESS</p>
              <p className="m-0">{SITE_CONFIG.contact.address[lang]}</p>
              <p className="m-0 text-[#7E6B6C]">
                {SITE_CONFIG.contact.stationNote[lang]}
              </p>
              <a
                href={SITE_CONFIG.contact.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-1 text-[11.5px] tracking-[0.08em] text-[#7E6B6C] hover:text-[#3B2B2C] no-underline border-b border-[#C7A97F]/50"
              >
                {SITE_CONFIG.footer.openMaps[lang]}
              </a>
            </div>

            <div className="space-y-1">
              <p className="m-0 font-num text-[11px] text-[#C7A97F]">HOURS</p>
              <p className="m-0">{SITE_CONFIG.contact.hours[lang]}</p>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 text-[12px] text-[#7E6B6C]">
              <a
                href={`https://instagram.com/${SITE_CONFIG.contact.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="no-underline text-[#7E6B6C] hover:text-[#3B2B2C] transition-colors"
              >
                Instagram @{SITE_CONFIG.contact.instagramHandle}
              </a>
              <span>LINE {SITE_CONFIG.contact.lineOfficialId}</span>
            </div>
          </div>
        </div>

        {/* Soft Refined Brand Wordmark (v3 Garamond + rose-brown on sheer milk) */}
        <div className="pt-8 border-t border-[#3B2B2C]/8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <p
            className="m-0 font-garamond leading-none tracking-[0.06em] select-none"
            style={{
              fontSize: 'clamp(34px, 6.4vw, 72px)',
              color: 'rgba(59, 43, 44, 0.2)',
            }}
          >
            {SITE_CONFIG.brandName}
          </p>

          <p className="m-0 font-num text-[11px] text-[#7E6B6C]/70">
            © {new Date().getFullYear()} {SITE_CONFIG.brandName}
          </p>
        </div>
      </div>
    </footer>
  );
};
