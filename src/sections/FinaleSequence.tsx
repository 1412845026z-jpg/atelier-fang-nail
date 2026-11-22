import React from 'react';
import { Lang, SITE_CONFIG } from '../config';
import { ScrollSequence } from '../components/ScrollSequence';
import { BeatPhase, MaskedLines } from '../components/MaskedLines';

interface FinaleSequenceProps {
  lang: Lang;
}

export const FinaleSequence: React.FC<FinaleSequenceProps> = ({ lang }) => {
  if (!SITE_CONFIG.media.hasFinaleVideo) {
    return null;
  }

  return (
    <ScrollSequence
      id="finale"
      src={SITE_CONFIG.media.finaleVideo}
      framesDir={SITE_CONFIG.media.finaleFramesDir}
      enabled={SITE_CONFIG.media.hasFinaleVideo}
      scrollLength="300vh"
      optional={true}
    >
      {({ progress, isReducedMotion }) => {
        const phase: BeatPhase = isReducedMotion
          ? 'active'
          : progress < 0.42
            ? 'before'
            : progress <= 0.96
              ? 'active'
              : 'after';

        return (
          <div className="h-full w-full flex items-end px-5 sm:px-8 lg:px-12 pb-16 sm:pb-24">
            <MaskedLines
              lines={[SITE_CONFIG.nav.booking[lang]]}
              phase={phase}
              reducedMotion={isReducedMotion}
              lineClassName="font-editorial text-[42px] sm:text-[64px] leading-[1.04] text-[#241E1A]"
            />
          </div>
        );
      }}
    </ScrollSequence>
  );
};
