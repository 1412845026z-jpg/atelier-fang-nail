import React from 'react';
import { SITE_CONFIG } from '../config';
import { resolveAssetUrl } from '../utils/assetUrl';

export const SalonSection: React.FC = () => {
  return (
    <section
      id="salon"
      aria-label={SITE_CONFIG.brandName}
      className="w-full py-16 sm:py-24 px-5 sm:px-10 flex justify-center"
      style={{ backgroundColor: '#F3EDE6' }}
    >
      <div className="max-w-[780px] w-full overflow-hidden relative aspect-[16/9]">
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={resolveAssetUrl(SITE_CONFIG.media.salonHandsMobile)}
          />
          <img
            src={resolveAssetUrl(SITE_CONFIG.media.salonHands)}
            alt={SITE_CONFIG.brandName}
            loading="lazy"
            className="w-full h-full object-cover block"
            style={{ filter: 'saturate(0.88) contrast(0.96)' }}
          />
        </picture>
        <span
          className="absolute bottom-3 right-3.5 text-[10px] tracking-[0.14em] px-2.5 py-0.5 rounded-full"
          style={{
            color: '#7E6B6C',
            backgroundColor: 'rgba(247, 241, 238, 0.75)',
          }}
        >
          {SITE_CONFIG.cardActions.imageTag.ja}
        </span>
      </div>
    </section>
  );
};
