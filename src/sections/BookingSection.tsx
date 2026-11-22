import React, { useEffect, useMemo, useState } from 'react';
import { Lang, SITE_CONFIG } from '../config';

interface BookingSectionProps {
  lang: Lang;
  prefilledNote?: string;
  prefilledServiceId?: string;
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
  prefilledNote = '',
  prefilledServiceId = '',
}) => {
  const services = SITE_CONFIG.services;
  const { daysAhead, closedWeekdays, timeSlots } = SITE_CONFIG.booking;

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

  const firstOpenDay = useMemo(
    () => dayCells.find((c) => !c.isClosed) || dayCells[0],
    [dayCells]
  );

  const [step, setStep] = useState(0);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0].id);
  const [selectedIso, setSelectedIso] = useState(firstOpenDay.iso);
  const [selectedTime, setSelectedTime] = useState(timeSlots[1] || timeSlots[0]);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestNote, setGuestNote] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (prefilledNote) {
      setGuestNote(prefilledNote);
    }
  }, [prefilledNote]);

  useEffect(() => {
    if (prefilledServiceId) {
      setSelectedServiceId(prefilledServiceId);
      setStep(1);
    }
  }, [prefilledServiceId]);

  const selectedService =
    services.find((s) => s.id === selectedServiceId) || services[0];
  const selectedDay =
    dayCells.find((d) => d.iso === selectedIso) || firstOpenDay;

  const formattedDate = useMemo(() => {
    const wd = WEEKDAY_NAMES_FULL[lang][selectedDay.weekday];
    if (lang === 'ja') {
      return `${selectedDay.monthNum}/${selectedDay.dayNum} (${wd})`;
    }
    const monthShort = selectedDay.date.toLocaleString('en-US', { month: 'short' });
    return `${wd}, ${monthShort} ${selectedDay.dayNum}`;
  }, [lang, selectedDay]);

  const bookingMessage = useMemo(() => {
    const srvName = selectedService.title[lang];
    const nameStr = guestName.trim() || '__';
    const phoneStr = guestPhone.trim() || '__';
    const noteTrim = guestNote.trim();

    if (lang === 'ja') {
      const base = `予約：${srvName} / ${formattedDate} ${selectedTime} / ${nameStr} (${phoneStr})`;
      return noteTrim ? `${base} / ${noteTrim}` : base;
    }
    const base = `Booking: ${srvName} · ${formattedDate} ${selectedTime} · ${nameStr} (${phoneStr})`;
    return noteTrim ? `${base} · ${noteTrim}` : base;
  }, [formattedDate, guestName, guestNote, guestPhone, lang, selectedService, selectedTime]);

  const copyMessage = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(bookingMessage);
      } else {
        const ta = document.createElement('textarea');
        ta.value = bookingMessage;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    } catch {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2600);
    }
  };

  const whatsappUrl = `https://wa.me/${SITE_CONFIG.contact.whatsappNumber}?text=${encodeURIComponent(
    bookingMessage
  )}`;
  const instagramUrl = `https://ig.me/m/${SITE_CONFIG.contact.instagramHandle}`;

  const ui = SITE_CONFIG.bookingUI;

  return (
    <section
      id="booking"
      className="relative w-full hairline-t py-24 sm:py-32 lg:py-36 px-5 sm:px-8 lg:px-12"
      style={{ backgroundColor: '#F2EEE8', color: '#241E1A' }}
    >
      <div className="grid grid-cols-12 gap-y-12 lg:gap-x-10">
        {/* Asymmetric Left Step Selector & Live Visual Receipt (zero prose) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between">
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
                      opacity: active ? 1 : completed ? 0.68 : 0.45,
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
                    <span className="font-editorial text-[24px] sm:text-[28px] leading-none">
                      {label[lang]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div
            className="mt-12 lg:mt-20 pt-5 hairline-t space-y-1.5 font-label tabular-nums"
            style={{ color: '#8A8178' }}
          >
            <div style={{ color: '#241E1A' }}>
              {selectedService.title[lang]} · {selectedService.price}
            </div>
            <div>
              {formattedDate} · {selectedTime}
            </div>
          </div>
        </div>

        {/* Asymmetric Right 4-Step Interactive Stage */}
        <div className="col-span-12 lg:col-span-7 lg:col-start-6">
          <div className="mb-8">
            <div className="flex items-center justify-end mb-3">
              <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                0{step + 1} / 04
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

          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform: `translate3d(-${step * 100}%, 0, 0)`,
                transition: 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
            >
              {/* STEP 1: Services */}
              <div className="w-full shrink-0 pr-1">
                <div className="hairline-t">
                  {services.map((srv) => {
                    const selected = srv.id === selectedServiceId;
                    return (
                      <button
                        key={srv.id}
                        type="button"
                        onClick={() => {
                          setSelectedServiceId(srv.id);
                          setStep(1);
                        }}
                        className="w-full text-left bg-transparent border-0 hairline-b py-5 pl-4 pr-2 cursor-pointer flex items-baseline justify-between gap-4 relative transition-colors"
                        style={{
                          borderLeft: selected
                            ? '2px solid #A7C1D9'
                            : '2px solid transparent',
                          backgroundColor: selected
                            ? 'rgba(167, 193, 217, 0.08)'
                            : 'transparent',
                        }}
                      >
                        <div className="flex items-baseline gap-3">
                          <span className="font-label" style={{ color: '#8A8178' }}>
                            {srv.index}
                          </span>
                          <span className="font-editorial text-[24px] sm:text-[28px] leading-tight text-[#241E1A]">
                            {srv.title[lang]}
                          </span>
                          <span className="font-label ml-2 tabular-nums" style={{ color: '#8A8178' }}>
                            {srv.durationMin}M
                          </span>
                        </div>
                        <span className="font-editorial text-[24px] sm:text-[28px] shrink-0 text-[#241E1A] tabular-nums">
                          {srv.price}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Minimalist 21-day calendar (closed days visually slashed) */}
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
                        onClick={() => {
                          setSelectedIso(cell.iso);
                          setStep(2);
                        }}
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

              {/* STEP 3: Flat time slots */}
              <div className="w-full shrink-0 pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {timeSlots.map((slot) => {
                    const selected = slot === selectedTime;
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setSelectedTime(slot);
                          setStep(3);
                        }}
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

              {/* STEP 4: Clean hairline inputs + compact summary + WhatsApp / IG / Copy */}
              <div className="w-full shrink-0 pr-1 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                  <p className="m-0 font-label text-[12px] normal-case tracking-[0.02em] leading-relaxed text-[#241E1A] select-all">
                    {bookingMessage}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-3.5 px-4 rounded-[2px] text-center no-underline font-label transition-opacity hover:opacity-88"
                    style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
                  >
                    {ui.sendWhatsApp[lang]}
                  </a>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      void copyMessage();
                    }}
                    className="py-3.5 px-4 rounded-[2px] text-center no-underline font-label transition-colors hover:border-[#A7C1D9]"
                    style={{
                      color: '#241E1A',
                      border: '1px solid rgba(36, 30, 26, 0.28)',
                    }}
                  >
                    {ui.sendInstagram[lang]}
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      void copyMessage();
                    }}
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
              </div>
            </div>
          </div>

          <div className="mt-10 pt-5 hairline-t flex items-center justify-between">
            <button
              type="button"
              aria-label="Previous step"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="w-10 h-10 rounded-[2px] hairline-all bg-transparent flex items-center justify-center font-label cursor-pointer disabled:opacity-20"
              style={{ color: '#241E1A' }}
            >
              ←
            </button>

            {step < 3 && (
              <button
                type="button"
                aria-label="Next step"
                onClick={() => setStep((s) => Math.min(3, s + 1))}
                className="inline-flex items-center gap-4 px-6 py-3 rounded-[2px] border-0 cursor-pointer font-label"
                style={{ backgroundColor: '#241E1A', color: '#F2EEE8' }}
              >
                <span>→</span>
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
