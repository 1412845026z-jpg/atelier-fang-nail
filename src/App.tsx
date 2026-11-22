import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang } from './config';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { HeroVeil } from './sections/HeroVeil';
import { WorksCoverflow } from './sections/WorksCoverflow';
import { ServicesPinned } from './sections/ServicesPinned';
import { ExplodedNail } from './sections/ExplodedNail';
import { StatementDark } from './sections/StatementDark';
import { FinaleSequence } from './sections/FinaleSequence';
import { BookingSection } from './sections/BookingSection';
import { FooterSection } from './sections/FooterSection';

gsap.registerPlugin(ScrollTrigger);

export const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ja');
  const [loadProgress, setLoadProgress] = useState(0);
  const [heroReady, setHeroReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [bookingPrefillNote, setBookingPrefillNote] = useState('');
  const [bookingPrefillServiceId, setBookingPrefillServiceId] = useState('');

  const lenisRef = useRef<Lenis | null>(null);
  const scrollVelocityRef = useRef(0);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on('scroll', (e: { velocity: number }) => {
      scrollVelocityRef.current = e.velocity;
      ScrollTrigger.update();
    });

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const target = document.getElementById(sectionId);
      if (!target) return;
      if (lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(target, { duration: 1.15 });
      } else {
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  const scrollToY = useCallback(
    (y: number) => {
      if (lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(y, { duration: 1.05 });
      } else {
        window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  const handleRequestSimilar = useCallback(
    (workLabel: string) => {
      setBookingPrefillNote(workLabel);
      scrollToSection('booking');
    },
    [scrollToSection]
  );

  const handleSelectServiceForBooking = useCallback(
    (serviceId: string) => {
      setBookingPrefillServiceId(serviceId);
      scrollToSection('booking');
    },
    [scrollToSection]
  );

  const handleLoadProgress = useCallback((pct: number) => {
    setLoadProgress((prev) => Math.max(prev, pct));
  }, []);

  const handleLoadComplete = useCallback(() => {
    setLoadProgress(100);
    setHeroReady(true);
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <div className="film-grain" aria-hidden="true" />
      <CustomCursor />
      <Preloader
        progress={loadProgress}
        ready={heroReady}
        reducedMotion={reducedMotion}
      />
      <Header
        lang={lang}
        onLangChange={setLang}
        onNavigate={scrollToSection}
      />

      <main>
        <HeroVeil
          lang={lang}
          onLoadProgress={handleLoadProgress}
          onLoadComplete={handleLoadComplete}
          onBookClick={() => scrollToSection('booking')}
        />
        <WorksCoverflow
          lang={lang}
          onRequestSimilar={handleRequestSimilar}
        />
        <ServicesPinned
          lang={lang}
          onScrollToY={scrollToY}
          onSelectServiceForBooking={handleSelectServiceForBooking}
        />
        <ExplodedNail lang={lang} />
        <StatementDark lang={lang} scrollVelocityRef={scrollVelocityRef} />
        <FinaleSequence lang={lang} />
        <BookingSection
          lang={lang}
          prefilledNote={bookingPrefillNote}
          prefilledServiceId={bookingPrefillServiceId}
        />
      </main>

      <FooterSection lang={lang} />
    </>
  );
};
