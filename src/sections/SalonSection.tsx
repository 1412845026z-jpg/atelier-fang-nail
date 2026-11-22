import React from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { resolveAssetUrl } from '../utils/assetUrl';

interface SalonSectionProps {
  lang: Lang;
}

/**
 * Section 04 — 美甲师与沙龙（静段）
 * Airy, restrained, hands-only editorial section: no faces, no long "About Us" essay,
 * no decorative fluff — just soft window light, working hands, private table, and brief note.
 */
export const SalonSection: React.FC<SalonSectionProps> = ({ lang }) => {
  return (
    <section
      id="salon"
      aria-label={SITE_CONFIG.salon.eyebrow[lang]}
      className="relative w-full py-20 sm:py-28 px-5 sm:px-10 lg:px-16"
      style={{ backgroundColor: '#EFE3DE' }}
    >
      <div className="max-w-[1080px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left/Top: Hands-only working craft photo + calm salon table detail */}
        <div className="lg:col-span-7 grid grid-cols-12 gap-3.5 sm:gap-5 items-end">
          <figure className="col-span-7 m-0 relative overflow-hidden rounded-2xl border border-[#C7A97F]/25">
            <picture>
              <source
                srcSet={resolveAssetUrl('/media/salon/hands.avif')}
                type="image/avif"
              />
              <img
                src={resolveAssetUrl(SITE_CONFIG.media.salonHands)}
                alt={lang === 'ja' ? '施術中のネイリストの手元' : 'Nail artist hands at work'}
                loading="lazy"
                className="w-full aspect-[4/3] object-cover block"
              />
            </picture>
            <figcaption
              className="absolute bottom-2.5 right-2.5 text-[10px] tracking-[0.14em] px-2 py-0.5 rounded-full"
              style={{
                color: '#7E6B6C',
                backgroundColor: 'rgba(247, 241, 238, 0.78)',
              }}
            >
              イメージ
            </figcaption>
          </figure>

          <figure className="col-span-5 m-0 relative overflow-hidden rounded-2xl border border-[#C7A97F]/25">
            <picture>
              <source
                srcSet={resolveAssetUrl('/media/salon/space.avif')}
                type="image/avif"
              />
              <img
                src={resolveAssetUrl(SITE_CONFIG.media.salonSpace)}
                alt={lang === 'ja' ? '陽の入るプライベートサロン空間' : 'Private daylight nail atelier'}
                loading="lazy"
                className="w-full aspect-[3/4] object-cover block"
              />
            </picture>
            <figcaption
              className="absolute bottom-2.5 right-2.5 text-[10px] tracking-[0.14em] px-2 py-0.5 rounded-full"
              style={{
                color: '#7E6B6C',
                backgroundColor: 'rgba(247, 241, 238, 0.78)',
              }}
            >
              イメージ
            </figcaption>
          </figure>
        </div>

        {/* Right/Bottom: Brief quiet first-person note & qualifications from config */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2.5">
            <p className="m-0 font-num text-[12px] text-[#C7A97F]">
              {SITE_CONFIG.salon.eyebrow[lang]}
            </p>
            <h2 className="m-0 font-mincho jp-heading text-[22px] sm:text-[26px] tracking-[0.1em] leading-[1.55] text-[#3B2B2C]">
              {SITE_CONFIG.salon.heading[lang]}
            </h2>
          </div>

          <p className="m-0 text-[13.5px] sm:text-[14px] leading-[1.95] text-[#3B2B2C]/85 font-body">
            {SITE_CONFIG.salon.story[lang]}
          </p>

          <ul className="m-0 p-0 list-none pt-3 space-y-2.5 border-t border-[#3B2B2C]/12">
            {SITE_CONFIG.salon.credentials.map((cred, idx) => (
              <li
                key={idx}
                className="flex items-baseline gap-3 text-[12px] tracking-[0.06em] text-[#7E6B6C]"
              >
                <span className="font-num text-[11px] text-[#C7A97F]">0{idx + 1}</span>
                <span>{cred[lang]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
