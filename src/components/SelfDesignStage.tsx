import React, { useMemo } from 'react';
import { buildSelfCardSpec, Lang, SITE_CONFIG } from '../config';
import {
  SelfAccentId,
  SelfLengthId,
  SelfSelection,
  SelfShapeId,
  SelfTechniqueId,
} from '../types/nail';
import { resolveAssetUrl } from '../utils/assetUrl';
import { formatYen } from '../utils/designCodec';

interface SelfDesignStageProps {
  visible: boolean;
  step: 0 | 1 | 2 | 3 | 4;
  selection: SelfSelection;
  lang: Lang;
  onStepChange: (step: 0 | 1 | 2 | 3 | 4) => void;
  onUpdateSelection: (next: SelfSelection, autoAdvanceToCard?: boolean) => void;
  onBackToPresets: () => void;
}

export const SelfDesignStage: React.FC<SelfDesignStageProps> = ({
  visible,
  step,
  selection,
  lang,
  onStepChange,
  onUpdateSelection,
  onBackToPresets,
}) => {
  const clearBottleSrc = useMemo(() => resolveAssetUrl(SITE_CONFIG.media.clearBottleWebp), []);
  const milkyBottleSrc = useMemo(
    () => resolveAssetUrl(SITE_CONFIG.media.milkyRefBottleWebp),
    []
  );
  const cavityMaskSrc = useMemo(
    () => resolveAssetUrl(SITE_CONFIG.media.bottleCavityMask),
    []
  );

  const selectedColor =
    SITE_CONFIG.selfDesign.colors.find((c) => c.id === selection.colorId) ||
    SITE_CONFIG.selfDesign.colors[2];
  const liveSpec = useMemo(() => buildSelfCardSpec(selection), [selection]);

  const layerColors = [
    '#EDE5DE',
    '#E5D7CF',
    selectedColor.hex,
    selection.technique === 'mirror'
      ? '#DCE1E8'
      : selection.technique === 'magnet'
        ? '#CFC5DC'
        : selectedColor.hex,
    selection.accent === 'goldline' || selection.accent === 'glitter'
      ? '#DFC496'
      : '#F6F1EC',
  ];

  const filledLayers = step + 1;

  const chooseShape = (shape: SelfShapeId) => {
    onUpdateSelection({ ...selection, shape });
    window.setTimeout(() => onStepChange(1), 260);
  };

  const chooseLength = (length: SelfLengthId) => {
    onUpdateSelection({ ...selection, length });
    window.setTimeout(() => onStepChange(2), 260);
  };

  const chooseColor = (colorId: string) => {
    onUpdateSelection({ ...selection, colorId });
    window.setTimeout(() => onStepChange(3), 280);
  };

  const chooseTechnique = (technique: SelfTechniqueId) => {
    const accOpt = SITE_CONFIG.selfDesign.accents.find((a) => a.id === selection.accent);
    const nextAccent =
      accOpt && !accOpt.compatibleTechniques.includes(technique) ? 'none' : selection.accent;
    onUpdateSelection({ ...selection, technique, accent: nextAccent });
    window.setTimeout(() => onStepChange(4), 280);
  };

  const chooseAccent = (accent: SelfAccentId) => {
    onUpdateSelection({ ...selection, accent }, true);
  };

  const washiSlipStyle = (selected: boolean, harmonious = true): React.CSSProperties => ({
    backgroundColor: selected ? 'rgba(252, 249, 245, 0.88)' : 'rgba(251, 248, 244, 0.68)',
    border: selected
      ? '1px solid rgba(201, 152, 154, 0.72)'
      : '1px solid rgba(199, 169, 127, 0.28)',
    boxShadow: selected ? '0 6px 18px rgba(42, 29, 31, 0.08)' : 'none',
    opacity: harmonious || selected ? 1 : 0.34,
    transform: selected ? 'translateY(-2px)' : 'none',
  });

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end pb-5 sm:pb-7 px-4 sm:px-10 select-none"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform: visible ? 'translate3d(0, 0, 0)' : 'translate3d(0, 20px, 0)',
        transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div className="max-w-[920px] w-full mx-auto flex items-end gap-4 sm:gap-7">
        {/* Protagonist Clear Bottle filling layer-by-layer (tap any layer to rewind!) */}
        <div className="relative shrink-0 flex flex-col items-center">
          <div className="relative w-[64px] h-[150px] sm:w-[78px] sm:h-[184px]">
            <img
              src={clearBottleSrc}
              alt={SITE_CONFIG.selfDesign.entryLabel[lang]}
              draggable={false}
              className="w-full h-full object-contain block pointer-events-none"
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                WebkitMaskImage: `url(${cavityMaskSrc})`,
                maskImage: `url(${cavityMaskSrc})`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              {[0, 1, 2, 3, 4].map((layerIdx) => {
                const active = layerIdx < filledLayers;
                const bottomPct = 11 + layerIdx * 7.6;
                return (
                  <div
                    key={layerIdx}
                    className="absolute inset-x-0 transition-all duration-500"
                    style={{
                      bottom: `${bottomPct}%`,
                      height: active ? '8.2%' : '0%',
                      opacity: active ? (layerIdx === step ? 0.95 : 0.82) : 0,
                      backgroundColor: layerColors[layerIdx],
                      borderTop: active ? '1px solid rgba(255,255,255,0.48)' : 'none',
                    }}
                  />
                );
              })}

              <img
                src={milkyBottleSrc}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-contain mix-blend-multiply opacity-60"
              />
            </div>

            {[4, 3, 2, 1, 0].map((layerIdx) => (
              <button
                key={`tap-${layerIdx}`}
                type="button"
                onClick={() => onStepChange(layerIdx as 0 | 1 | 2 | 3 | 4)}
                aria-label={SITE_CONFIG.selfDesign.entryLabel[lang]}
                className="absolute inset-x-1 bg-transparent border-0 p-0 cursor-pointer"
                style={{
                  bottom: `${11 + layerIdx * 7.6}%`,
                  height: '7.8%',
                }}
              />
            ))}
          </div>

          <span
            aria-hidden="true"
            className="block -mt-1.5 rounded-full"
            style={{
              width: '48px',
              height: '8px',
              background:
                'radial-gradient(ellipse at center, rgba(46, 32, 30, 0.26) 0%, rgba(46, 32, 30, 0) 74%)',
            }}
          />

          <button
            type="button"
            onClick={onBackToPresets}
            className="mt-1 px-2.5 py-0.5 rounded-full border-0 text-[10.5px] tracking-[0.12em] text-[#7E6B6C] hover:text-[#3B2B2C] cursor-pointer"
            style={{ backgroundColor: 'rgba(251, 248, 244, 0.65)' }}
          >
            {SITE_CONFIG.nav.vanity[lang]}
          </button>
        </div>

        {/* Section 3A.1: Thin translucent washi option slips floating over the table (zero full-width frosted banner!) */}
        <div className="flex-1 min-w-0 flex flex-col items-start gap-2 pb-0.5">
          {step === 0 && (
            <div className="w-full flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-2">
              {SITE_CONFIG.selfDesign.shapes.map((s) => {
                const selected = selection.shape === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => chooseShape(s.id)}
                    className="paper-grain shrink-0 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 flex items-center gap-2.5"
                    style={washiSlipStyle(selected)}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block w-3 h-4 border border-[#3B2B2C]/50 bg-[#F4EFE9]"
                      style={{
                        borderRadius:
                          s.id === 'round'
                            ? '8px 8px 3px 3px'
                            : s.id === 'oval'
                              ? '50% 50% 35% 35%'
                              : '2.5px',
                      }}
                    />
                    <span className="font-mincho text-[13px] tracking-[0.08em] text-[#3B2B2C]">
                      {s.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 1 && (
            <div className="w-full flex items-center gap-2.5 sm:gap-3.5 overflow-x-auto no-scrollbar py-2">
              {SITE_CONFIG.selfDesign.lengths.map((l, idx) => {
                const selected = selection.length === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => chooseLength(l.id)}
                    className="paper-grain shrink-0 px-4 py-2 rounded-full cursor-pointer transition-all duration-300 flex items-center gap-2.5"
                    style={washiSlipStyle(selected)}
                  >
                    <span
                      aria-hidden="true"
                      className="inline-block w-3 rounded-t-full border border-[#3B2B2C]/50 bg-[#F4EFE9]"
                      style={{ height: `${13 + idx * 4}px` }}
                    />
                    <span className="font-mincho text-[13px] tracking-[0.08em] text-[#3B2B2C]">
                      {l.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 2 && (
            <div className="w-full flex items-center gap-2.5 sm:gap-3 overflow-x-auto no-scrollbar py-2 pr-4">
              {SITE_CONFIG.selfDesign.colors.map((c) => {
                const selected = selection.colorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => chooseColor(c.id)}
                    className="paper-grain shrink-0 px-3 py-1.5 rounded-full cursor-pointer flex items-center gap-2 transition-all duration-300"
                    style={washiSlipStyle(selected)}
                  >
                    <span
                      className="inline-block w-5 h-5 rounded-full relative shrink-0"
                      style={{
                        backgroundColor: c.hex,
                        boxShadow:
                          'inset 0 1.5px 3px rgba(255,255,255,0.7), 0 2px 5px rgba(42,29,31,0.12)',
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute top-0.5 left-1 w-2 h-1 rounded-full bg-white/65 rotate-[-24deg]"
                      />
                    </span>
                    <span className="font-mincho text-[12px] tracking-[0.06em] text-[#3B2B2C] whitespace-nowrap">
                      {c.name[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 3 && (
            <div className="w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 pr-4">
              {SITE_CONFIG.selfDesign.techniques.map((t) => {
                const selected = selection.technique === t.id;
                const harmonious = t.recommendedTones.includes(selectedColor.toneGroup);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => chooseTechnique(t.id)}
                    className="paper-grain shrink-0 px-4 py-2 rounded-full cursor-pointer transition-all duration-300"
                    style={washiSlipStyle(selected, harmonious)}
                  >
                    <span className="font-mincho text-[13px] tracking-[0.06em] text-[#3B2B2C] whitespace-nowrap">
                      {t.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {step === 4 && (
            <div className="w-full flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 pr-4">
              {SITE_CONFIG.selfDesign.accents.map((a) => {
                const selected = selection.accent === a.id;
                const harmonious = a.compatibleTechniques.includes(selection.technique);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => chooseAccent(a.id)}
                    className="paper-grain shrink-0 px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-300 flex items-center gap-2"
                    style={washiSlipStyle(selected, harmonious)}
                  >
                    {a.cutoutWebp && (
                      <img
                        src={resolveAssetUrl(a.cutoutWebp)}
                        alt=""
                        aria-hidden="true"
                        className="w-5 h-5 object-contain pointer-events-none"
                      />
                    )}
                    <span className="font-mincho text-[13px] tracking-[0.06em] text-[#3B2B2C] whitespace-nowrap">
                      {a.label[lang]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Delicate floating washi metadata tag */}
          <div
            className="paper-grain inline-flex items-baseline gap-3 px-4 py-1.5 rounded-full"
            style={{
              backgroundColor: 'rgba(251, 248, 244, 0.72)',
              border: '1px solid rgba(199, 169, 127, 0.30)',
            }}
          >
            <span className="font-mincho text-[13px] tracking-[0.06em] text-[#3B2B2C]">
              {liveSpec.title[lang]}
            </span>
            <span className="font-num text-[11px] tracking-[0.08em] text-[#7E6B6C]">
              {formatYen(liveSpec.priceYen)} ·{' '}
              {lang === 'ja' ? `${liveSpec.durationMin}分` : `${liveSpec.durationMin}m`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
