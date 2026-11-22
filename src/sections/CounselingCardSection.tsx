import React, { useEffect, useMemo, useState } from 'react';
import { getDesignById, getDesignMeta, Lang, SITE_CONFIG } from '../config';
import { CounselingPayload, CounselingShapeId } from '../types/nail';
import {
  buildCounselingMessage,
  buildInstagramDmUrl,
  buildLineOaUrl,
  copyTextToClipboard,
  formatYen,
} from '../utils/designCodec';
import { resolveAssetUrl } from '../utils/assetUrl';

interface CounselingCardSectionProps {
  lang: Lang;
  /** Latest design selected in 02 Vanity or 03 Tip Sample Book */
  syncedDesignId: string;
  /** Optional initial shape & length decoded from ?d= */
  initialShape?: CounselingShapeId;
  initialLengthLevel?: number;
}

/**
 * Authentic Japanese short-to-medium salon nail silhouette SVG
 * Live-grows smoothly with lengthLevel (0 = natural 0mm .. 3 = medium +3mm).
 */
const NailShapeSilhouette: React.FC<{
  shape: CounselingShapeId;
  lengthLevel: number;
  selected: boolean;
}> = ({ shape, lengthLevel, selected }) => {
  // Base natural nail height 24px -> grows gently up to 36px (+3mm medium), never exaggerated stiletto!
  const h = 24 + lengthLevel * 4;
  const topY = 48 - h;
  const botY = 48;
  const cx = 22;
  const hw = 10.5;

  let d = '';
  switch (shape) {
    case 'round':
      d = `M ${cx - hw} ${botY - 6} C ${cx - hw} ${botY + 1}, ${cx + hw} ${botY + 1}, ${cx + hw} ${botY - 6} L ${cx + hw} ${topY + 9} C ${cx + hw} ${topY}, ${cx - hw} ${topY}, ${cx - hw} ${topY + 9} Z`;
      break;
    case 'square-off':
      d = `M ${cx - hw} ${botY - 6} C ${cx - hw} ${botY + 1}, ${cx + hw} ${botY + 1}, ${cx + hw} ${botY - 6} L ${cx + hw - 0.5} ${topY + 3.5} Q ${cx + hw - 0.5} ${topY} ${cx + hw - 4.5} ${topY} L ${cx - hw + 4.5} ${topY} Q ${cx - hw + 0.5} ${topY} ${cx - hw + 0.5} ${topY + 3.5} Z`;
      break;
    case 'short-almond':
      d = `M ${cx - hw} ${botY - 6} C ${cx - hw} ${botY + 1}, ${cx + hw} ${botY + 1}, ${cx + hw} ${botY - 6} C ${cx + hw} ${topY + h * 0.45}, ${cx + 4.5} ${topY}, ${cx} ${topY} C ${cx - 4.5} ${topY}, ${cx - hw} ${topY + h * 0.45}, ${cx - hw} ${botY - 6} Z`;
      break;
    case 'point-soft':
      d = `M ${cx - hw} ${botY - 6} C ${cx - hw} ${botY + 1}, ${cx + hw} ${botY + 1}, ${cx + hw} ${botY - 6} C ${cx + hw - 1} ${topY + h * 0.35}, ${cx + 2.8} ${topY + 1}, ${cx} ${topY} C ${cx - 2.8} ${topY + 1}, ${cx - hw + 1} ${topY + h * 0.35}, ${cx - hw} ${botY - 6} Z`;
      break;
    case 'oval':
    default:
      d = `M ${cx - hw} ${botY - 6} C ${cx - hw} ${botY + 1}, ${cx + hw} ${botY + 1}, ${cx + hw} ${botY - 6} L ${cx + hw - 0.4} ${topY + 12} C ${cx + hw - 1} ${topY + 1}, ${cx - hw + 1} ${topY + 1}, ${cx - hw + 0.4} ${topY + 12} Z`;
      break;
  }

  return (
    <svg width="44" height="54" viewBox="0 0 44 54" fill="none" aria-hidden="true">
      {/* Subtle fingertip contour underneath */}
      <path
        d="M 8 53 C 8 34, 12 24, 22 24 C 32 24, 36 34, 36 53"
        stroke="rgba(59, 43, 44, 0.14)"
        strokeWidth="1"
      />
      <path
        d={d}
        fill={selected ? 'rgba(201, 152, 154, 0.28)' : '#F7F1EE'}
        stroke={selected ? '#C9989A' : '#7E6B6C'}
        strokeWidth={selected ? '1.4' : '1'}
        style={{ transition: 'd 0.25s ease, fill 0.25s ease, stroke 0.25s ease' }}
      />
    </svg>
  );
};

function generateAvailableDates(lang: Lang): { value: string; label: string; day: string }[] {
  const out: { value: string; label: string; day: string }[] = [];
  const weekdaysJa = ['日', '月', '火', '水', '木', '金', '土'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  for (let offset = 1; offset <= 21; offset += 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const wd = d.getDay();
    // Closed Sun (0) & Mon (1)
    if (wd === 0 || wd === 1) continue;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    out.push({
      value: `${yyyy}-${mm}-${dd}`,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      day: lang === 'ja' ? weekdaysJa[wd] : weekdaysEn[wd],
    });
    if (out.length >= 10) break;
  }
  return out;
}

/**
 * Section 05 — カウンセリングカード
 * Tactile Japanese salon counseling stationery card (#FBF7F4 + champagne-gold hairline frame).
 * One polite question per page with gentle 3D paper rotateY turns.
 * Ends with a clear consultation message draft ("send your wishes to the artist" — never "booking confirmed").
 */
export const CounselingCardSection: React.FC<CounselingCardSectionProps> = ({
  lang,
  syncedDesignId,
  initialShape = 'oval',
  initialLengthLevel = 1,
}) => {
  const ui = SITE_CONFIG.counselingUI;
  const totalSteps = ui.steps.length;

  const [step, setStep] = useState(0); // 0..5
  const [turnDir, setTurnDir] = useState<'next' | 'prev'>('next');
  const [turnKey, setTurnKey] = useState(0);
  const [choosingAltDesign, setChoosingAltDesign] = useState(false);

  const [payload, setPayload] = useState<CounselingPayload>({
    designId: syncedDesignId,
    shape: initialShape,
    lengthLevel: initialLengthLevel,
    concerns: [],
    lifestyle: 'office',
    preferredDate: 'undecided',
    guestName: '',
    contactChannel: 'line',
    note: '',
  });

  // Sync automatically whenever the user chooses a design in 02 Vanity or 03 Tip Sample
  useEffect(() => {
    setPayload((prev) => ({ ...prev, designId: syncedDesignId }));
  }, [syncedDesignId]);

  const [copied, setCopied] = useState(false);
  const [igNotice, setIgNotice] = useState(false);

  const dates = useMemo(() => generateAvailableDates(lang), [lang]);
  const selectedDesign =
    payload.designId === 'consult' ? null : getDesignById(payload.designId);
  const selectedMeta = selectedDesign ? getDesignMeta(selectedDesign) : null;

  const messagePreview = useMemo(
    () => buildCounselingMessage(payload, lang),
    [payload, lang]
  );

  const goStep = (next: number) => {
    const clamped = Math.max(0, Math.min(totalSteps - 1, next));
    if (clamped === step) return;
    setTurnDir(clamped > step ? 'next' : 'prev');
    setStep(clamped);
    setTurnKey((k) => k + 1);
  };

  const toggleConcern = (id: string) => {
    setPayload((prev) => {
      if (id === 'none') {
        return { ...prev, concerns: prev.concerns.includes('none') ? [] : ['none'] };
      }
      const withoutNone = prev.concerns.filter((c) => c !== 'none');
      const exists = withoutNone.includes(id);
      return {
        ...prev,
        concerns: exists ? withoutNone.filter((c) => c !== id) : [...withoutNone, id],
      };
    });
  };

  const handleCopyMessage = async () => {
    await copyTextToClipboard(messagePreview);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  const handleInstagramDm = async () => {
    await copyTextToClipboard(messagePreview);
    setIgNotice(true);
    window.open(buildInstagramDmUrl(), '_blank', 'noopener,noreferrer');
  };

  const currentStepMeta = ui.steps[step];

  return (
    <section
      id="counseling"
      aria-label={ui.eyebrow[lang]}
      className="relative w-full py-20 sm:py-28 px-5 sm:px-8"
      style={{
        background:
          'linear-gradient(180deg, #EFE3DE 0%, #F4EAE5 36%, #F7F1EE 100%)',
      }}
    >
      <div className="max-w-[640px] mx-auto">
        {/* Quiet Header & Reassurance */}
        <div className="text-center space-y-2.5 mb-8 sm:mb-10">
          <p className="m-0 font-num text-[12px] text-[#C7A97F]">
            {ui.eyebrow[lang]}
          </p>
          <h2 className="m-0 font-mincho jp-heading text-[22px] sm:text-[28px] tracking-[0.12em] text-[#3B2B2C]">
            {ui.reassurance[lang]}
          </h2>
        </div>

        {/* Held-in-hand Cream Stationery Card (1px champagne-gold outer + subtle inner rule) */}
        <div
          className="relative rounded-2xl p-2 sm:p-3 paper-grain"
          style={{
            backgroundColor: '#FBF7F4',
            border: '1px solid rgba(199, 169, 127, 0.56)',
            boxShadow: '0 18px 44px -28px rgba(59, 43, 44, 0.16)',
          }}
        >
          <div
            className="rounded-xl px-5 py-7 sm:px-9 sm:py-10"
            style={{ border: '1px solid rgba(199, 169, 127, 0.24)' }}
          >
            {/* Card top folio bar: step progress */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#3B2B2C]/10">
              <div className="flex items-baseline gap-2.5">
                <span className="font-num text-[14px] text-[#C7A97F]">
                  {currentStepMeta.num}
                </span>
                <span className="font-num text-[11px] text-[#7E6B6C]/70">
                  / 0{totalSteps}
                </span>
              </div>

              {/* Minimal progress dots (clickable to revisit any question) */}
              <div className="flex items-center gap-2" role="tablist" aria-label="Steps">
                {ui.steps.map((st, idx) => (
                  <button
                    key={st.num}
                    type="button"
                    role="tab"
                    aria-selected={idx === step}
                    aria-label={`Step ${st.num}`}
                    onClick={() => goStep(idx)}
                    className="p-0 border-0 cursor-pointer rounded-full transition-all duration-300"
                    style={{
                      width: idx === step ? '18px' : '6px',
                      height: '6px',
                      backgroundColor:
                        idx === step
                          ? '#C9989A'
                          : idx < step
                            ? '#C7A97F'
                            : 'rgba(59, 43, 44, 0.14)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Animated Paper-Turn Page Content */}
            <div
              key={turnKey}
              className={turnDir === 'next' ? 'card-turn-next' : 'card-turn-prev'}
            >
              <h3 className="m-0 mb-6 font-mincho jp-heading text-[18px] sm:text-[21px] tracking-[0.08em] leading-[1.6] text-[#3B2B2C]">
                {currentStepMeta.question[lang]}
              </h3>

              {/* STEP 01: Selected Design (auto-synced from 02/03, or 相談して決めたい) */}
              {step === 0 && (
                <div className="space-y-5">
                  {selectedDesign && selectedMeta ? (
                    <div
                      className="p-4 rounded-xl flex items-center gap-4"
                      style={{
                        backgroundColor: '#F7F1EE',
                        border: '1px solid rgba(201, 152, 154, 0.4)',
                      }}
                    >
                      <div className="relative w-14 aspect-[3/4] rounded-lg overflow-hidden bg-white shrink-0 border border-[#C7A97F]/25">
                        <img
                          src={resolveAssetUrl(`/media/tips/${selectedDesign.id}.webp`)}
                          alt={selectedDesign.name.ja}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="font-num text-[#C7A97F]">
                            No.{selectedDesign.number}
                          </span>
                          <span className="text-[#7E6B6C]">
                            {selectedMeta.label[lang]}
                          </span>
                          <span className="text-[#7E6B6C]/65">イメージ</span>
                        </div>
                        <p className="m-0 mt-0.5 font-mincho text-[15px] sm:text-[16px] text-[#3B2B2C] leading-snug">
                          {selectedDesign.name.ja}
                        </p>
                        <p className="m-0 mt-0.5 font-num text-[12px] text-[#7E6B6C]">
                          {formatYen(selectedMeta.priceYen)} · {selectedMeta.durationMin}
                          {lang === 'ja' ? '分' : ' min'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="p-4 rounded-xl text-center"
                      style={{
                        backgroundColor: '#F7F1EE',
                        border: '1px solid rgba(201, 152, 154, 0.5)',
                      }}
                    >
                      <p className="m-0 font-mincho text-[15px] text-[#3B2B2C]">
                        {ui.consultUndecided[lang]}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setChoosingAltDesign((v) => !v)}
                      className="rounded-full px-4 py-2 text-[12px] tracking-[0.1em] bg-transparent cursor-pointer transition-colors"
                      style={{
                        color: '#3B2B2C',
                        border: '1px solid rgba(59, 43, 44, 0.2)',
                      }}
                    >
                      {choosingAltDesign
                        ? lang === 'ja'
                          ? '一覧を閉じる'
                          : 'Close designs'
                        : lang === 'ja'
                          ? '別のデザインに変える'
                          : 'Change design'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPayload((p) => ({ ...p, designId: 'consult' }));
                        setChoosingAltDesign(false);
                      }}
                      className="rounded-full px-4 py-2 text-[12px] tracking-[0.1em] cursor-pointer transition-colors"
                      style={{
                        backgroundColor:
                          payload.designId === 'consult' ? '#C9989A' : 'transparent',
                        color: payload.designId === 'consult' ? '#FBF7F4' : '#7E6B6C',
                        border:
                          payload.designId === 'consult'
                            ? '1px solid #C9989A'
                            : '1px solid rgba(126, 107, 108, 0.25)',
                      }}
                    >
                      {ui.consultUndecided[lang]}
                    </button>
                  </div>

                  {/* Compact horizontal strip of all 12 designs when user taps Change */}
                  {choosingAltDesign && (
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-2">
                      {SITE_CONFIG.designs.map((d) => {
                        const active = payload.designId === d.id;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setPayload((p) => ({ ...p, designId: d.id }));
                              setChoosingAltDesign(false);
                            }}
                            className="shrink-0 w-[74px] p-1.5 rounded-xl bg-transparent cursor-pointer flex flex-col items-center gap-1.5"
                            style={{
                              border: active
                                ? '1px solid #C9989A'
                                : '1px solid rgba(59, 43, 44, 0.1)',
                              backgroundColor: active ? '#F7F1EE' : '#FFFFFF',
                            }}
                          >
                            <img
                              src={resolveAssetUrl(`/media/tips/${d.id}.webp`)}
                              alt={d.name.ja}
                              className="w-11 aspect-[3/4] object-cover rounded-md"
                            />
                            <span className="font-num text-[10px] text-[#7E6B6C]">
                              {d.number}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 02: 5 Mainstream Japanese Short-to-Medium Nail Silhouettes + Live Length Slider */}
              {step === 1 && (
                <div className="space-y-7">
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
                    {ui.shapes.map((sh) => {
                      const active = payload.shape === sh.id;
                      return (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => setPayload((p) => ({ ...p, shape: sh.id }))}
                          className="py-2.5 px-1 rounded-xl cursor-pointer flex flex-col items-center gap-1.5 transition-colors duration-200"
                          style={{
                            backgroundColor: active ? '#F7F1EE' : 'transparent',
                            border: active
                              ? '1px solid #C9989A'
                              : '1px solid rgba(59, 43, 44, 0.08)',
                          }}
                        >
                          <NailShapeSilhouette
                            shape={sh.id}
                            lengthLevel={payload.lengthLevel}
                            selected={active}
                          />
                          <span
                            className="text-[10px] sm:text-[11px] leading-tight text-center"
                            style={{ color: active ? '#3B2B2C' : '#7E6B6C' }}
                          >
                            {sh.label[lang]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Live-growing Length Slider */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-baseline justify-between text-[12px]">
                      <span className="text-[#7E6B6C]">
                        {lang === 'ja' ? '長さの目安' : 'Preferred length'}
                      </span>
                      <span className="font-mincho text-[#3B2B2C]">
                        {ui.lengthLabels[payload.lengthLevel][lang]}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={3}
                      step={1}
                      value={payload.lengthLevel}
                      aria-label={lang === 'ja' ? '長さの目安' : 'Preferred nail length'}
                      onChange={(e) =>
                        setPayload((p) => ({
                          ...p,
                          lengthLevel: Number(e.target.value),
                        }))
                      }
                      className="sou-slider"
                    />
                    <div className="flex justify-between font-num text-[10px] text-[#7E6B6C]/70">
                      <span>0mm</span>
                      <span>+1mm</span>
                      <span>+2mm</span>
                      <span>+3mm</span>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 03: Nail Concerns (multi-select) */}
              {step === 2 && (
                <div className="flex flex-wrap gap-2.5">
                  {ui.concerns.map((item) => {
                    const active = payload.concerns.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleConcern(item.id)}
                        className="rounded-full px-5 py-2.5 text-[13px] tracking-[0.06em] cursor-pointer transition-colors duration-200"
                        style={{
                          backgroundColor: active ? '#C9989A' : '#F7F1EE',
                          color: active ? '#FBF7F4' : '#3B2B2C',
                          border: active
                            ? '1px solid #C9989A'
                            : '1px solid rgba(59, 43, 44, 0.12)',
                        }}
                      >
                        {item.label[lang]}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 04: Lifestyle / Work */}
              {step === 3 && (
                <div className="flex flex-col gap-2.5">
                  {ui.lifestyles.map((item) => {
                    const active = payload.lifestyle === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setPayload((p) => ({ ...p, lifestyle: item.id }))}
                        className="w-full text-left rounded-xl px-5 py-3.5 text-[13.5px] tracking-[0.06em] cursor-pointer flex items-center justify-between transition-colors duration-200"
                        style={{
                          backgroundColor: active ? '#F7F1EE' : 'transparent',
                          color: '#3B2B2C',
                          border: active
                            ? '1px solid #C9989A'
                            : '1px solid rgba(59, 43, 44, 0.12)',
                        }}
                      >
                        <span>{item.label[lang]}</span>
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: active ? '#C9989A' : 'transparent',
                            border: active
                              ? '1px solid #C9989A'
                              : '1px solid rgba(59, 43, 44, 0.25)',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* STEP 05: Preferred Date or Undecided */}
              {step === 4 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-2">
                    {dates.map((d) => {
                      const active = payload.preferredDate === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() =>
                            setPayload((p) => ({ ...p, preferredDate: d.value }))
                          }
                          className="py-2.5 px-1 rounded-xl cursor-pointer flex flex-col items-center gap-0.5 transition-colors duration-200"
                          style={{
                            backgroundColor: active ? '#C9989A' : '#F7F1EE',
                            color: active ? '#FBF7F4' : '#3B2B2C',
                            border: active
                              ? '1px solid #C9989A'
                              : '1px solid rgba(59, 43, 44, 0.1)',
                          }}
                        >
                          <span className="font-num text-[13px]">{d.label}</span>
                          <span
                            className="text-[10px]"
                            style={{
                              color: active ? 'rgba(251,247,244,0.85)' : '#7E6B6C',
                            }}
                          >
                            {d.day}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPayload((p) => ({ ...p, preferredDate: 'undecided' }))
                    }
                    className="w-full rounded-xl py-3 text-[12.5px] tracking-[0.08em] cursor-pointer transition-colors"
                    style={{
                      backgroundColor:
                        payload.preferredDate === 'undecided' ? '#F7F1EE' : 'transparent',
                      color: '#3B2B2C',
                      border:
                        payload.preferredDate === 'undecided'
                          ? '1px solid #C9989A'
                          : '1px solid rgba(59, 43, 44, 0.14)',
                    }}
                  >
                    {ui.dateUndecided[lang]}
                  </button>
                </div>
              )}

              {/* STEP 06: Name + Message Preview + LINE / Instagram Consultation Send */}
              {step === 5 && (
                <div className="space-y-5">
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={payload.guestName}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, guestName: e.target.value }))
                      }
                      placeholder={ui.namePlaceholder[lang]}
                      className="w-full bg-transparent px-3.5 py-2.5 rounded-lg text-[14px] text-[#3B2B2C] placeholder:text-[#7E6B6C]/60 outline-none"
                      style={{ border: '1px solid rgba(59, 43, 44, 0.16)' }}
                    />

                    <textarea
                      rows={2}
                      value={payload.note}
                      onChange={(e) =>
                        setPayload((p) => ({ ...p, note: e.target.value }))
                      }
                      placeholder={ui.notePlaceholder[lang]}
                      className="w-full bg-transparent px-3.5 py-2.5 rounded-lg text-[13px] text-[#3B2B2C] placeholder:text-[#7E6B6C]/60 outline-none resize-none"
                      style={{ border: '1px solid rgba(59, 43, 44, 0.16)' }}
                    />
                  </div>

                  {/* Live Message Draft Preview */}
                  <div
                    className="p-4 rounded-xl text-[12px] leading-[1.75] whitespace-pre-wrap break-all font-body"
                    style={{
                      backgroundColor: '#F7F1EE',
                      color: '#3B2B2C',
                      border: '1px solid rgba(199, 169, 127, 0.3)',
                    }}
                  >
                    {messagePreview}
                  </div>

                  {/* Send Actions — Consultation framing (never implies instant confirmed booking) */}
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={buildLineOaUrl(messagePreview)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-center no-underline rounded-full px-6 py-3 text-[13px] tracking-[0.12em] font-body transition-opacity hover:opacity-90"
                      style={{
                        backgroundColor: '#C9989A',
                        color: '#FBF7F4',
                      }}
                    >
                      {ui.channelLine[lang]}
                    </a>

                    <button
                      type="button"
                      onClick={handleInstagramDm}
                      className="flex-1 rounded-full px-5 py-3 text-[12.5px] tracking-[0.1em] font-body bg-transparent cursor-pointer transition-colors hover:bg-[#EFE3DE]/70"
                      style={{
                        color: '#3B2B2C',
                        border: '1px solid rgba(59, 43, 44, 0.24)',
                      }}
                    >
                      {ui.channelInstagram[lang]}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="bg-transparent border-0 p-0 text-[12px] tracking-[0.1em] text-[#7E6B6C] hover:text-[#3B2B2C] cursor-pointer underline underline-offset-4"
                    >
                      {copied ? ui.copied[lang] : ui.copyMessage[lang]}
                    </button>

                    {igNotice && (
                      <span className="text-[11px] text-[#C9989A]">
                        {ui.igCopiedNotice[lang]}
                      </span>
                    )}
                  </div>

                  <p className="m-0 text-[11px] leading-relaxed text-[#7E6B6C]">
                    {ui.sendDisclaimer[lang]}
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Page-Turn Controls */}
            <div className="mt-8 pt-5 border-t border-[#3B2B2C]/10 flex items-center justify-between">
              <button
                type="button"
                onClick={() => goStep(step - 1)}
                disabled={step === 0}
                className="bg-transparent border-0 p-1 text-[12.5px] tracking-[0.12em] cursor-pointer disabled:opacity-30 disabled:cursor-default"
                style={{ color: '#7E6B6C' }}
              >
                ← {ui.prev[lang]}
              </button>

              {step < totalSteps - 1 && (
                <button
                  type="button"
                  onClick={() => goStep(step + 1)}
                  className="rounded-full px-7 py-2.5 text-[12.5px] tracking-[0.14em] border-0 cursor-pointer transition-opacity hover:opacity-90"
                  style={{
                    backgroundColor: '#C9989A',
                    color: '#FBF7F4',
                  }}
                >
                  {ui.next[lang]} →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
