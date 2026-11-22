import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG } from '../config';
import { MediaImage } from '../components/MediaImage';

gsap.registerPlugin(ScrollTrigger);

interface StatementDarkProps {
  lang: Lang;
  scrollVelocityRef: React.MutableRefObject<number>;
}

export const StatementDark: React.FC<StatementDarkProps> = ({
  lang,
  scrollVelocityRef,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const marqueeTrackRef = useRef<HTMLDivElement | null>(null);
  const cutoutWrapRef = useRef<HTMLDivElement | null>(null);
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

    let offsetPct = 0;
    let direction = -1;
    let smoothedVel = 0;
    let rafId = 0;

    const tick = () => {
      const rawVel = scrollVelocityRef.current || 0;
      smoothedVel += (rawVel - smoothedVel) * 0.12;

      if (Math.abs(smoothedVel) > 0.08) {
        direction = smoothedVel >= 0 ? -1 : 1;
      }

      const speed = 0.02 + Math.min(0.4, Math.abs(smoothedVel) * 0.012);
      offsetPct += direction * speed;

      if (offsetPct <= -50) {
        offsetPct += 50;
      } else if (offsetPct > 0) {
        offsetPct -= 50;
      }

      if (marqueeTrackRef.current) {
        marqueeTrackRef.current.style.transform = `translate3d(${offsetPct.toFixed(3)}%, 0, 0)`;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [reducedMotion, scrollVelocityRef]);

  useEffect(() => {
    if (reducedMotion) return;
    const sec = sectionRef.current;
    const cutout = cutoutWrapRef.current;
    if (!sec || !cutout) return;

    const tween = gsap.fromTo(
      cutout,
      { y: 36, rotation: -3.5 },
      {
        y: 0,
        rotation: 3.5,
        ease: 'none',
        scrollTrigger: {
          trigger: sec,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reducedMotion]);

  const marqueePhrase = SITE_CONFIG.statement.marquee;

  return (
    <section
      id="statement"
      ref={sectionRef}
      data-theme="dark"
      className="relative z-10 w-full overflow-hidden pt-20 sm:pt-28 pb-20 sm:pb-28"
      style={{ backgroundColor: '#1C1917', color: '#F2EEE8' }}
    >
      <div
        className="relative w-full min-h-[340px] sm:min-h-[440px] lg:min-h-[520px] flex items-center overflow-hidden select-none"
        style={{ borderBottom: '1px solid rgba(242, 238, 232, 0.14)' }}
      >
        <div
          aria-hidden="true"
          ref={marqueeTrackRef}
          className="flex w-max whitespace-nowrap"
          style={{ willChange: 'transform' }}
        >
          <span
            className="font-editorial leading-[0.88] pr-10"
            style={{
              fontSize: 'clamp(4.8rem, 21.5vw, 22vw)',
              letterSpacing: '-0.03em',
              color: 'rgba(242, 238, 232, 0.11)',
            }}
          >
            {marqueePhrase}
            {marqueePhrase}
          </span>
          <span
            className="font-editorial leading-[0.88] pr-10"
            style={{
              fontSize: 'clamp(4.8rem, 21.5vw, 22vw)',
              letterSpacing: '-0.03em',
              color: 'rgba(242, 238, 232, 0.11)',
            }}
          >
            {marqueePhrase}
            {marqueePhrase}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center px-6">
          <div
            ref={cutoutWrapRef}
            className="w-[215px] sm:w-[300px] lg:w-[365px] aspect-[3/4] flex items-end justify-center"
            style={{
              transformOrigin: '42% 100%',
              willChange: 'transform',
            }}
          >
            <MediaImage
              src={SITE_CONFIG.media.statementCutout}
              smallWidth={440}
              largeWidth={760}
              sizes="(max-width: 768px) 220px, 365px"
              alt={SITE_CONFIG.brandName}
              dark={true}
              className="w-full h-full object-contain object-bottom"
              loading="lazy"
            />
          </div>
        </div>
      </div>

      <div className="mt-14 sm:mt-20 px-5 sm:px-8 lg:px-12 grid grid-cols-12">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          {SITE_CONFIG.statement.vows.map((vow, idx) => (
            <div
              key={idx}
              className="py-6 sm:py-8 flex items-baseline justify-between gap-6"
              style={{
                borderBottom: '1px solid rgba(242, 238, 232, 0.16)',
              }}
            >
              <span
                className="font-label shrink-0"
                style={{ color: 'rgba(242, 238, 232, 0.48)' }}
              >
                0{idx + 1}
              </span>
              <p
                className="font-editorial jp-heading m-0 text-[24px] sm:text-[34px] lg:text-[40px] leading-tight text-right"
                style={{ color: '#F2EEE8' }}
              >
                {vow[lang]}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
