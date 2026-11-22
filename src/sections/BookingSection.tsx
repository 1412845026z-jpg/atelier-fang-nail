import React, { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';
import { NailDesignState } from '../types/nail';
import {
  buildInstagramDmUrl,
  buildLineOaUrl,
  buildReservationMessage,
  buildShareableDesignUrl,
  copyTextToClipboard,
  estimateDesign,
  formatYen,
} from '../utils/designCodec';
import { buildNailControlPoints, controlPointsToPathD } from '../utils/nailGeometry';

gsap.registerPlugin(ScrollTrigger);

interface BookingSectionProps {
  lang: Lang;
  attachedDesign: NailDesignState | null;
  attachedServiceId?: string | null;
  onEditDesign: () => void;
}

interface DayCell {
  date: Date;
  iso: string;
  dayNum: number;
  monthNum: number;
  weekday: number;
  isClosed: boolean;
}

const WEEKDAY_HEADERS: Record<Lang, string[]> = {
  ja: ['月', '火', '水', '木', '金', '土', '日'],
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
};

const WEEKDAY_NAMES_FULL: Record<Lang, string[]> = {
  ja: ['日', '月', '火', '水', '木', '金', '土'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const BookingSection: React.FC<BookingSectionProps> = ({
  lang,
  attachedDesign,
  attachedServiceId = null,
  onEditDesign,
}) => {
  const services = SITE_CONFIG.services;
  const { daysAhead, closedWeekdays, timeSlots } = SITE_CONFIG.booking;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [vellumSlid, setVellumSlid] = useState(false);

  // Subtle 2nd (and final) frosted-vellum sheet glide on first arrival at Booking
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setVellumSlid(true);
      return;
    }
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 78%',
      once: true,
      onEnter: () => setVellumSlid(true),
    });

    return () => trigger.kill();
  }, []);

  const { dayCells, leadingBlanks } = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + 1);

    const cells: DayCell[] = [];
    for (let i = 0; i < daysAhead; i += 1) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const weekday = d.getDay();
      cells.push({
        date: d,
        iso: toIsoDate(d),
        dayNum: d.getDate(),
        monthNum: d.getMonth() + 1,
        weekday,
        isClosed: closedWeekdays.includes(weekday),
      });
    }

    const firstCol = (cells[0].weekday + 6) % 7;
    return { dayCells: cells, leadingBlanks: firstCol };
  }, [daysAhead, closedWeekdays]);

  // All 3 fields strictly default to null ("未選択 / Not selected")
  const [step, setStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestNote, setGuestNote] = useState('');
  const [copied, setCopied] = useState(false);
  const [igNotice, setIgNotice] = useState(false);

  // Sync only when explicitly pushed from Services or Try-on Studio ("このデザインで予約")
  useEffect(() => {
    if (attachedServiceId) {
      setSelectedServiceId(attachedServiceId);
      setStep(0);
    }
  }, [attachedServiceId]);

  const designEstimate = useMemo(
    () => (attachedDesign ? estimateDesign(attachedDesign) : null),
    [attachedDesign]
  );

  const selectedService = selectedServiceId
    ? services.find((s) => s.id === selectedServiceId) || null
    : null;

  const selectedDay = selectedIso
    ? dayCells.find((d) => d.iso === selectedIso) || null
    : null;

  const formattedDate = useMemo(() => {
    if (!selectedDay) return '';
    const wd = WEEKDAY_NAMES_FULL[lang][selectedDay.weekday];
    if (lang === 'ja') {
      return `${selectedDay.monthNum}月${selectedDay.dayNum}日(${wd})`;
    }
    const monthShort = selectedDay.date.toLocaleString('en-US', { month: 'short' });
    return `${wd}, ${monthShort} ${selectedDay.dayNum}`;
  }, [lang, selectedDay]);

  const designUrl = useMemo(
    () => (attachedDesign ? buildShareableDesignUrl(attachedDesign) : undefined),
    [attachedDesign]
  );

  const activeMenuLabel = selectedService
    ? selectedService.title[lang]
    : designEstimate
      ? designEstimate.menuName[lang]
      : SITE_CONFIG.bookingUI.unselected[lang];

  const bookingMessage = useMemo(
    () =>
      buildReservationMessage({
        lang,
        mode: 'book',
        menuLabel: activeMenuLabel,
        design: attachedDesign,
        designUrl,
        dateLabel: formattedDate || SITE_CONFIG.bookingUI.unselected[lang],
        timeLabel: selectedTime || SITE_CONFIG.bookingUI.unselected[lang],
        guestName,
        guestPhone,
        guestNote,
      }),
    [
      activeMenuLabel,
      attachedDesign,
      designUrl,
      formattedDate,
      guestName,
      guestNote,
      guestPhone,
      lang,
      selectedTime,
    ]
  );

  const handleCopy = async () => {
    await copyTextToClipboard(bookingMessage);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2600);
  };

  const handleInstagramClick = async () => {
    await copyTextToClipboard(bookingMessage);
    setIgNotice(true);
    window.open(buildInstagramDmUrl(), '_blank', 'noopener,noreferrer');
    window.setTimeout(() => setIgNotice(false), 5500);
  };

  const ui = SITE_CONFIG.bookingUI;

  // Mini SVG silhouette for attached Try-on Specimen Card
  const miniNailD = useMemo(() => {
    if (!attachedDesign) return '';
    return controlPointsToPathD(buildNailControlPoints(attachedDesign.shape, 26, 44));
  }, [attachedDesign]);

  const miniNailHex = useMemo(() => {
    if (!attachedDesign) return '#EDE6DF';
    const cId = attachedDesign.fingers[2].colorId;
    return SITE_CONFIG.palette.find((p) => p.id === cId)?.hex || '#EDE6DF';
  }, [attachedDesign]);

  return (
    <section
      id="booking"
      ref={sectionRef}
      className="relative z-10 w-full hairline-t pt-24 pb-24 sm:pt-32 sm:pb-32 px-5 sm:px-8 lg:px-12 overflow-hidden"
      style={{ backgroundColor: '#F2EEE8', color: '#241E1A' }}
    >
      {/* Subtle 2nd frosted-vellum transition sheet gliding quietly off to the right once */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 vellum-paper-texture"
        style={{
          backgroundColor: 'rgba(245, 241, 235, 0.85)',
          transform: vellumSlid ? 'translate3d(105%, 0, 0)' : 'translate3d(0%, 0, 0)',
          opacity: vellumSlid ? 0 : 1,
          transitionProperty: 'transform, opacity',
          transitionDuration: '1.15s',
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      />

      <div className="grid grid-cols-12 gap-y-8 lg:gap-x-10">
        {/* DESKTOP Left Step Rail + Live Receipt (hidden verbose list on mobile -> single row below) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col justify-between">
          <ol className="list-none p-0 m-0 space-y-4">
            {ui.stepLabels.map((label, idx) => {
              const active = idx === step;
              const completed = idx < step;
              return (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => setStep(idx)}
                    className="bg-transparent border-0 p-0 cursor-pointer flex items-center gap-4 text-left transition-colors"
                    style={{
                      color: active ? '#241E1A' : completed ? '#241E1A' : '#8A8178',
                      opacity: active ? 1 : completed ? 0.7 : 0.45,
                    }}
                  >
                    <span
                      className="inline-block h-[1px]"
                      style={{
                        width: active ? '28px' : '12px',
                        backgroundColor: active ? '#A7C1D9' : 'rgba(36,30,26,0.28)',
                        transition:
                          'width 0.45s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.3s ease',
                      }}
                    />
                    <span className="font-editorial text-[26px] leading-none">
                      0{idx + 1} {label[lang]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Live Selection Receipt — shows "未選択 / Not selected" cleanly until chosen */}
          <div
            className="mt-16 pt-5 hairline-t space-y-2 font-label tabular-nums"
            style={{ color: '#8A8178' }}
          >
            <div className="flex justify-between gap-4">
              <span>{ui.stepLabels[0][lang]}</span>
              <span style={{ color: selectedService ? '#241E1A' : '#8A8178' }}>
                {selectedService
                  ? `${selectedService.title[lang]} · ${formatYen(selectedService.priceYen)}`
                  : ui.unselected[lang]}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{ui.stepLabels[1][lang]}</span>
              <span style={{ color: selectedDay ? '#241E1A' : '#8A8178' }}>
                {formattedDate || ui.unselected[lang]}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>{ui.stepLabels[2][lang]}</span>
              <span style={{ color: selectedTime ? '#241E1A' : '#8A8178' }}>
                {selectedTime || ui.unselected[lang]}
              </span>
            </div>
          </div>
        </div>

        {/* Right 4-Step Interactive Stage (full width on mobile with compact single-row step bar) */}
        <div className="col-span-12 lg:col-span-7 lg:col-start-6">
          {/* Attached Try-on Specimen Design Card (when arriving from Nail Try-on Studio) */}
          {attachedDesign && designEstimate && (
            <div
              className="mb-7 p-4 rounded-[2px] flex items-center justify-between gap-4"
              style={{
                backgroundColor: '#F7F4EE',
                border: '1px solid rgba(36,30,26,0.16)',
                borderLeft: '3px solid #A7C1D9',
              }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-11 h-14 shrink-0 flex items-center justify-center rounded-[2px]"
                  style={{
                    backgroundColor: '#EDE7DE',
                    border: '1px solid rgba(36,30,26,0.1)',
                  }}
                >
                  <svg width="26" height="42" viewBox="-18 -48 36 52">
                    <path
                      d={miniNailD}
                      fill={miniNailHex}
                      stroke="rgba(36,30,26,0.28)"
                      strokeWidth="1.2"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="font-label text-[10px]" style={{ color: '#8A8178' }}>
                    {designEstimate.specimenCode} · {formatYen(designEstimate.estimatedYen)} ·{' '}
                    {designEstimate.estimatedMinutes}M
                  </div>
                  <div className="font-editorial text-[18px] sm:text-[20px] leading-snug text-[#241E1A] truncate">
                    {designEstimate.summaryText[lang]}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onEditDesign}
                className="shrink-0 bg-transparent border-0 pb-0.5 cursor-pointer font-label"
                style={{
                  color: '#241E1A',
                  borderBottom: '1px solid rgba(36,30,26,0.35)',
                }}
              >
                {ui.changeDesign[lang]}
              </button>
            </div>
          )}

          {/* Compact Top Step Indicator & 1px Progress Line (Mobile = single line "1 / 4 · メニュー") */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label" style={{ color: '#241E1A' }}>
                {step + 1} / 4 · {ui.stepLabels[step][lang]}
              </span>
              <span className="font-label lg:hidden tabular-nums" style={{ color: '#8A8178' }}>
                {selectedService ? formatYen(selectedService.priceYen) : ui.unselected[lang]}
              </span>
            </div>
            <div
              className="w-full h-[1px] relative overflow-hidden"
              style={{ backgroundColor: 'rgba(36, 30, 26, 0.15)' }}
            >
              <div
                className="absolute inset-y-0 left-0 w-full origin-left"
                style={{
                  backgroundColor: '#A7C1D9',
                  transform: `scaleX(${(step + 1) / 4})`,
                  transition: 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
            </div>
          </div>

          {/* Horizontal Sliding 4-Step Container */}
          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translate3d(-${step * 100}%, 0, 0)`,
                transition: 'transform 0.72s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
            >
              {/* STEP 1: Services (¥6,000–¥9,000) */}
              <div className="w-full shrink-0 pr-1">
                <div className="hairline-t">
                  {services.map((srv) => {
                    const selected = srv.id === selectedServiceId;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => setSelectedServiceId(srv.id)}
                        className="w-full text-left bg-transparent border-0 hairline-b py-5 pl-4 pr-2 cursor-pointer flex items-baseline justify-between gap-4 relative transition-colors"
                        style={{
                          borderLeft: selected
                            ? '2px solid #A7C1D9'
                            : '2px solid transparent',
                          backgroundColor: selected
                            ? 'rgba(167, 193, 217, 0.09)'
                            : 'transparent',
                        }}
                      >
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <span className="font-label" style={{ color: '#8A8178' }}>
                            {srv.index}
                          </span>
                          <span className="font-editorial jp-heading text-[22px] sm:text-[26px] leading-tight text-[#241E1A]">
                            {srv.title[lang]}
                          </span>
                          <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                            {srv.durationMin}M
                          </span>
                        </div>
                        <span className="font-editorial text-[22px] sm:text-[26px] shrink-0 text-[#241E1A] tabular-nums">
                          {formatYen(srv.priceYen)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Minimalist 21-day Calendar (closed days slashed & disabled) */}
              <div className="w-full shrink-0 pr-1">
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-3">
                  {WEEKDAY_HEADERS[lang].map((wd) => (
                    <div
                      key={wd}
                      className="text-center font-label py-1"
                      style={{ color: '#8A8178' }}
                    >
                      {wd}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {Array.from({ length: leadingBlanks }).map((_, i) => (
                    <div key={`blank-${i}`} aria-hidden="true" />
                  ))}
                  {dayCells.map((cell) => {
                    const selected = cell.iso === selectedIso;
                    return (
                      <button
                        key={cell.iso}
                        type="button"
                        disabled={cell.isClosed}
                        onClick={() => setSelectedIso(cell.iso)}
                        className="relative py-3.5 px-1 rounded-[2px] flex flex-col items-center justify-center transition-colors"
                        style={{
                          backgroundColor: selected ? '#241E1A' : 'transparent',
                          backgroundImage: cell.isClosed
                            ? 'linear-gradient(-45deg, transparent 48.5%, rgba(36, 30, 26, 0.14) 49.5%, rgba(36, 30, 26, 0.14) 50.5%, transparent 51.5%)'
                            : 'none',
                          color: cell.isClosed
                            ? '#8A8178'
                            : selected
                              ? '#F2EEE8'
                              : '#241E1A',
                          opacity: cell.isClosed ? 0.38 : 1,
                          border: selected
                            ? '1px solid #241E1A'
                            : '1px solid rgba(36, 30, 26, 0.14)',
                          cursor: cell.isClosed ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <span className="font-label text-[9px] opacity-60 leading-none mb-1">
                          {cell.dayNum === 1 || cell === dayCells[0]
                            ? `${cell.monthNum}/`
                            : '\u00A0'}
                        </span>
                        <span className="text-[15px] sm:text-[16px] leading-none tabular-nums">
                          {cell.dayNum}
                        </span>
                        <span
                          className="mt-1.5 block h-[2px] w-4"
                          style={{
                            backgroundColor: selected ? '#A7C1D9' : 'transparent',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Flat Time Slots */}
              <div className="w-full shrink-0 pr-1">
                <div className="font-label mb-4" style={{ color: '#8A8178' }}>
                  {formattedDate || ui.unselected[lang]}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {timeSlots.map((slot) => {
                    const selected = slot === selectedTime;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className="py-6 px-5 rounded-[2px] cursor-pointer flex items-center justify-between transition-colors"
                        style={{
                          backgroundColor: selected ? '#241E1A' : 'transparent',
                          color: selected ? '#F2EEE8' : '#241E1A',
                          border: selected
                            ? '1px solid #241E1A'
                            : '1px solid rgba(36, 30, 26, 0.18)',
                        }}
                      >
                        <span className="font-editorial text-[28px] leading-none tabular-nums">
                          {slot}
                        </span>
                        <span
                          className="inline-block h-4 w-[2px]"
                          style={{
                            backgroundColor: selected ? '#A7C1D9' : 'transparent',
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 4: Guest Details + Formatted Message Preview + LINE / Instagram DM / Copy */}
              <div className="w-full shrink-0 pr-1 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="block">
                    <span className="font-label block mb-2" style={{ color: '#8A8178' }}>
                      {ui.nameLabel[lang]}
                    </span>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full bg-transparent border-0 hairline-b py-2.5 text-[16px] text-[#241E1A] focus:outline-none focus:border-[#A7C1D9]"
                    />
                  </label>
                  <label className="block">
                    <span className="font-label block mb-2" style={{ color: '#8A8178' }}>
                      {ui.phoneLabel[lang]}
                    </span>
                    <input
                      type="tel"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full bg-transparent border-0 hairline-b py-2.5 text-[16px] text-[#241E1A] focus:outline-none focus:border-[#A7C1D9]"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="font-label block mb-2" style={{ color: '#8A8178' }}>
                    {ui.noteLabel[lang]}
                  </span>
                  <input
                    type="text"
                    value={guestNote}
                    onChange={(e) => setGuestNote(e.target.value)}
                    className="w-full bg-transparent border-0 hairline-b py-2.5 text-[16px] text-[#241E1A] focus:outline-none focus:border-[#A7C1D9]"
                  />
                </label>

                <div
                  className="p-4 rounded-[2px]"
                  style={{
                    border: '1px solid rgba(36, 30, 26, 0.15)',
                    backgroundColor: 'rgba(36, 30, 26, 0.02)',
                  }}
                >
                  <p className="m-0 font-label text-[12px] normal-case tracking-[0.02em] leading-relaxed text-[#241E1A] select-all break-all">
                    {bookingMessage}
                  </p>
                </div>

                {/* Japan-native booking actions: LINE primary + Instagram DM (auto-copy) + Copy */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <a
                    href={buildLineOaUrl(bookingMessage)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3.5 px-4 rounded-[2px] text-center no-underline font-label transition-opacity hover:opacity-88"
                    style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
                  >
                    {ui.sendLine[lang]}
                  </a>
                  <button
                    type="button"
                    onClick={handleInstagramClick}
                    className="py-3.5 px-4 rounded-[2px] bg-transparent cursor-pointer font-label transition-colors hover:border-[#A7C1D9]"
                    style={{
                      color: '#241E1A',
                      border: '1px solid rgba(36, 30, 26, 0.28)',
                    }}
                  >
                    {ui.sendInstagram[lang]}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="py-3.5 px-4 rounded-[2px] bg-transparent cursor-pointer font-label transition-colors"
                    style={{
                      color: '#241E1A',
                      border: copied
                        ? '1px solid #A7C1D9'
                        : '1px solid rgba(36, 30, 26, 0.28)',
                      backgroundColor: copied ? 'rgba(167, 193, 217, 0.16)' : 'transparent',
                    }}
                  >
                    {copied ? ui.copied[lang] : ui.copyText[lang]}
                  </button>
                </div>

                {igNotice && (
                  <div
                    role="status"
                    className="font-label text-[11px] pt-1"
                    style={{ color: '#241E1A' }}
                  >
                    {ui.igCopiedNotice[lang]}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Explicit Step Controls: "戻る / Back" + "次へ / Next" */}
          <div className="mt-9 pt-5 hairline-t flex items-center justify-between">
            <button
              type="button"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="px-4 py-2.5 rounded-[2px] hairline-all bg-transparent font-label cursor-pointer disabled:opacity-25"
              style={{ color: '#241E1A' }}
            >
              ← {ui.prev[lang]}
            </button>

            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="inline-flex items-center gap-3.5 px-7 py-3 rounded-[2px] border-0 cursor-pointer font-label"
                style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
              >
                <span>{ui.next[lang]}</span>
                <span
                  className="inline-block h-[1px] w-5"
                  style={{ backgroundColor: '#A7C1D9' }}
                />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
