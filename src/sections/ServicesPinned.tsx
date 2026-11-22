import React, { useCallback, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';
import { MediaImage } from '../components/MediaImage';
import { formatYen } from '../utils/designCodec';

gsap.registerPlugin(ScrollTrigger);

interface ServicesPinnedProps {
  lang: Lang;
  onScrollToY: (y: number) => void;
  onSelectServiceForBooking: (serviceId: string) => void;
}

export const ServicesPinned: React.FC<ServicesPinnedProps> = ({
  lang,
  onScrollToY,
  onSelectServiceForBooking,
}) => {
  const services = SITE_CONFIG.services;
  const count = services.length;

  const sectionRef = useRef<HTMLElement | null>(null);
  const [rawProgress, setRawProgress] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => {
        setRawProgress(self.progress);
      },
    });

    return () => trigger.kill();
  }, [reducedMotion]);

  const jumpToService = useCallback(
    (idx: number) => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const scrollable = Math.max(1, el.offsetHeight - window.innerHeight);
      const targetProgress = count <= 1 ? 0 : idx / (count - 1);
      onScrollToY(top + scrollable * targetProgress);
    },
    [count, onScrollToY]
  );

  const scaled = rawProgress * (count - 1);
  const activeIdx = Math.min(count - 1, Math.round(scaled));

  if (reducedMotion) {
    return (
      <section
        id="services"
        className="w-full hairline-t pt-24 pb-20 px-5 sm:px-8 lg:px-12"
        style={{ backgroundColor: '#F2EEE8', color: '#241E1A' }}
      >
        <div className="space-y-16">
          {services.map((srv) => (
            <div key={srv.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5">
                <div className="font-label mb-3" style={{ color: '#8A8178' }}>
                  {srv.index}
                </div>
                <h2 className="font-editorial jp-heading text-[36px] leading-[1.14] m-0">
                  {srv.titleParts[lang].map((part, pi) => (
                    <React.Fragment key={pi}>
                      {pi > 0 && <wbr />}
                      {part}
                    </React.Fragment>
                  ))}
                </h2>
                <div className="mt-5 flex items-center gap-6 font-label" style={{ color: '#8A8178' }}>
                  <span>{srv.durationMin} MIN</span>
                  <span style={{ color: '#241E1A' }}>{formatYen(srv.priceYen)}</span>
                </div>
              </div>
              <div className="lg:col-span-7 aspect-[4/3] overflow-hidden rounded-[2px]">
                <MediaImage
                  src={srv.image}
                  smallWidth={480}
                  largeWidth={896}
                  alt={srv.title[lang]}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      id="services"
      ref={sectionRef}
      className="relative w-full hairline-t"
      style={{
        height: `${count * 100}vh`,
        backgroundColor: '#F2EEE8',
        color: '#241E1A',
      }}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden flex flex-col lg:flex-row">
        {/* Left column (45% desktop): generous top clearance below 60px header + clean jp-heading breaks */}
        <div className="order-2 lg:order-1 w-full lg:w-[45%] h-[46svh] lg:h-full px-5 sm:px-8 lg:px-12 pt-5 pb-6 lg:pt-[84px] lg:pb-12 flex flex-col justify-between relative">
          <div className="hidden lg:flex items-center justify-between">
            <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
              MENU · 0{activeIdx + 1} / 0{count}
            </span>
          </div>

          <div className="relative flex-1 flex items-center">
            {services.map((srv, idx) => {
              const phase = idx < activeIdx ? 'after' : idx === activeIdx ? 'active' : 'before';
              const durationRatio = Math.min(1, srv.durationMin / 150);

              return (
                <div
                  key={srv.id}
                  aria-hidden={idx !== activeIdx}
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 pr-6 lg:pr-10"
                  style={{ pointerEvents: idx === activeIdx ? 'auto' : 'none' }}
                >
                  <div className="overflow-hidden mb-2.5 lg:mb-4">
                    <div
                      className="font-label tabular-nums"
                      style={{
                        fontSize: '12px',
                        color: '#8A8178',
                        transform:
                          phase === 'active'
                            ? 'translate3d(0,0,0)'
                            : phase === 'after'
                              ? 'translate3d(0,-100%,0)'
                              : 'translate3d(0,100%,0)',
                        opacity: phase === 'active' ? 1 : 0,
                        transition:
                          'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s ease',
                      }}
                    >
                      No.{srv.index}
                    </div>
                  </div>

                  {/* Masked slide title with strict Japanese word-break (<wbr> on semantic boundaries) */}
                  <div className="overflow-hidden py-1">
                    <h2
                      className="font-editorial jp-heading m-0 text-[#241E1A]"
                      style={{
                        fontSize: 'clamp(1.75rem, 3.4vw, 3.25rem)',
                        lineHeight: 1.15,
                        transform:
                          phase === 'active'
                            ? 'translate3d(0,0%,0)'
                            : phase === 'after'
                              ? 'translate3d(0,-34%,0)'
                              : 'translate3d(0,105%,0)',
                        opacity: phase === 'active' ? 1 : 0,
                        filter: phase === 'after' ? 'blur(4px)' : 'blur(0px)',
                        transitionProperty: 'transform, opacity, filter',
                        transitionDuration: phase === 'after' ? '0.6s' : '0.9s',
                        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                      }}
                    >
                      {srv.titleParts[lang].map((part, pi) => (
                        <React.Fragment key={pi}>
                          {pi > 0 && <wbr />}
                          {part}
                        </React.Fragment>
                      ))}
                    </h2>
                  </div>

                  {/* Single-currency Japanese Yen + proportional duration bar */}
                  <div
                    className="mt-5 lg:mt-8 max-w-[320px]"
                    style={{
                      opacity: phase === 'active' ? 1 : 0,
                      transform:
                        phase === 'active'
                          ? 'translate3d(0,0,0)'
                          : phase === 'after'
                            ? 'translate3d(0,-14px,0)'
                            : 'translate3d(0,18px,0)',
                      transition:
                        'transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.08s, opacity 0.65s ease',
                    }}
                  >
                    <div className="flex items-baseline justify-between mb-3">
                      <span
                        className="font-editorial text-[30px] lg:text-[38px] leading-none tabular-nums"
                        style={{ color: '#241E1A' }}
                      >
                        {formatYen(srv.priceYen)}
                      </span>
                      <span className="font-label tabular-nums" style={{ color: '#8A8178' }}>
                        {srv.durationMin} MIN
                      </span>
                    </div>

                    <div
                      className="w-full h-[2px] relative overflow-hidden"
                      style={{ backgroundColor: 'rgba(36, 30, 26, 0.12)' }}
                    >
                      <div
                        className="h-full origin-left"
                        style={{
                          width: '100%',
                          backgroundColor: '#A7C1D9',
                          transform: `scaleX(${phase === 'active' ? durationRatio : 0})`,
                          transition: 'transform 0.95s cubic-bezier(0.22, 1, 0.36, 1) 0.14s',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectServiceForBooking(srv.id)}
                      className="mt-6 inline-flex items-center gap-4 bg-transparent border-0 p-0 cursor-pointer font-label group"
                      style={{ color: '#241E1A' }}
                    >
                      <span>{SITE_CONFIG.servicesSection.bookLabel[lang]}</span>
                      <span
                        className="inline-block h-[1px] w-7 transition-transform duration-500 origin-left group-hover:scale-x-125"
                        style={{ backgroundColor: '#241E1A' }}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2 pt-4">
            {services.map((srv, idx) => (
              <button
                key={srv.id}
                type="button"
                aria-label={`${srv.index} ${srv.title[lang]}`}
                onClick={() => jumpToService(idx)}
                className="flex-1 py-2 bg-transparent border-0 cursor-pointer"
              >
                <span
                  className="block w-full h-[1px]"
                  style={{
                    backgroundColor:
                      idx === activeIdx ? '#241E1A' : 'rgba(36, 30, 26, 0.16)',
                    transition: 'background-color 0.4s ease',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right 55% wide editorial craft/tool image column with bottom-to-top clip-path wipe */}
        <div className="order-1 lg:order-2 relative w-full lg:w-[55%] h-[54svh] lg:h-full overflow-hidden">
          {services.map((srv, idx) => {
            const rawIn = idx === 0 ? 1 : Math.max(0, Math.min(1, scaled - (idx - 1)));
            const wipeT =
              idx === 0
                ? 1
                : rawIn <= 0.14
                  ? 0
                  : rawIn >= 0.86
                    ? 1
                    : (rawIn - 0.14) / 0.72;

            const rawOut = idx === count - 1 ? 0 : Math.max(0, Math.min(1, scaled - idx));
            const outT =
              idx === count - 1
                ? 0
                : rawOut <= 0.14
                  ? 0
                  : rawOut >= 0.86
                    ? 1
                    : (rawOut - 0.14) / 0.72;

            const insetTopPct = (1 - wipeT) * 100;
            const scale = idx === 0 ? 1 + outT * 0.08 : 1.12 - wipeT * 0.12 + outT * 0.08;

            return (
              <div
                key={srv.id}
                className="absolute inset-0 overflow-hidden"
                style={{
                  zIndex: idx + 1,
                  clipPath: `inset(${insetTopPct.toFixed(2)}% 0% 0% 0%)`,
                  willChange: 'clip-path',
                }}
              >
                <div
                  className="w-full h-full"
                  style={{
                    transform: `scale(${scale.toFixed(4)})`,
                    willChange: 'transform',
                  }}
                >
                  <MediaImage
                    src={srv.image}
                    smallWidth={480}
                    largeWidth={896}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    alt={srv.title[lang]}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Far-right vertical clickable dot navigation */}
        <nav
          aria-label="Service steps"
          className="absolute right-3 sm:right-5 top-[27svh] lg:top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-3.5 py-3 px-1.5 rounded-full"
          style={{ backgroundColor: 'rgba(242, 238, 232, 0.86)' }}
        >
          {services.map((srv, idx) => {
            const active = idx === activeIdx;
            return (
              <button
                key={srv.id}
                type="button"
                aria-label={`${srv.index} ${srv.title[lang]}`}
                onClick={() => jumpToService(idx)}
                className="p-1 bg-transparent border-0 cursor-pointer flex items-center justify-center"
              >
                <span
                  className="block rounded-full"
                  style={{
                    width: active ? '6px' : '5px',
                    height: active ? '22px' : '5px',
                    backgroundColor: active ? '#A7C1D9' : 'rgba(36, 30, 26, 0.32)',
                    transition:
                      'height 0.45s cubic-bezier(0.22, 1, 0.36, 1), background-color 0.35s ease',
                  }}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
};
