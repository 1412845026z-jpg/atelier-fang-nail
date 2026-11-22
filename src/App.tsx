import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Lang, SITE_CONFIG, WorkItem } from './config';
import { NailDesignState } from './types/nail';
import {
  decodeDesignFromQuery,
  encodeDesignToQuery,
  estimateDesign,
} from './utils/designCodec';
import { Preloader } from './components/Preloader';
import { CustomCursor } from './components/CustomCursor';
import { Header } from './components/Header';
import { HeroTryOnSection } from './sections/HeroTryOnSection';

const WorksCoverflow = lazy(() =>
  import('./sections/WorksCoverflow').then((m) => ({ default: m.WorksCoverflow }))
);
const ServicesPinned = lazy(() =>
  import('./sections/ServicesPinned').then((m) => ({ default: m.ServicesPinned }))
);
const ExplodedNail = lazy(() =>
  import('./sections/ExplodedNail').then((m) => ({ default: m.ExplodedNail }))
);
const StatementDark = lazy(() =>
  import('./sections/StatementDark').then((m) => ({ default: m.StatementDark }))
);
const FinaleSequence = lazy(() =>
  import('./sections/FinaleSequence').then((m) => ({ default: m.FinaleSequence }))
);
const BookingSection = lazy(() =>
  import('./sections/BookingSection').then((m) => ({ default: m.BookingSection }))
);
const FooterSection = lazy(() =>
  import('./sections/FooterSection').then((m) => ({ default: m.FooterSection }))
);

gsap.registerPlugin(ScrollTrigger);

function cloneDesign(d: NailDesignState): NailDesignState {
  return {
    shape: d.shape,
    length: d.length,
    presetId: d.presetId,
    fingers: d.fingers.map((f) => ({ ...f })) as NailDesignState['fingers'],
  };
}

export const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ja');
  const [heroImageReady, setHeroImageReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Parse ?d=<base64url> and ?calibrate on initial load
  const [initialUrlFlags] = useState(() => {
    if (typeof window === 'undefined') {
      return { decoded: null as NailDesignState | null, calibrate: false };
    }
    const params = new URLSearchParams(window.location.search);
    const dParam = params.get('d');
    const decoded = dParam ? decodeDesignFromQuery(dParam) : null;
    const calibrate = params.has('calibrate');
    return { decoded, calibrate };
  });

  const [design, setDesign] = useState<NailDesignState>(() =>
    cloneDesign(initialUrlFlags.decoded || SITE_CONFIG.signatureDesign)
  );
  const [history, setHistory] = useState<NailDesignState[]>([]);
  const [paintTrigger, setPaintTrigger] = useState(0);

  // Booking bridge state (remains null until user explicitly clicks Book from Try-on / Works / Menu)
  const [bookingAttachedDesign, setBookingAttachedDesign] =
    useState<NailDesignState | null>(null);
  const [bookingAttachedServiceId, setBookingAttachedServiceId] = useState<string | null>(
    null
  );

  const lenisRef = useRef<Lenis | null>(null);
  const scrollVelocityRef = useRef(0);

  // Sync <html lang> + JSON-LD NailSalon structured data hydrated from SITE_CONFIG
  useEffect(() => {
    document.documentElement.lang = lang;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'NailSalon',
      name: SITE_CONFIG.brandName,
      url: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '',
      priceRange: SITE_CONFIG.priceRangeLabel,
      openingHours: SITE_CONFIG.contact.openingHoursSchema,
      address: {
        '@type': 'PostalAddress',
        streetAddress: SITE_CONFIG.contact.address[lang],
        postalCode: SITE_CONFIG.contact.postalCode,
        addressLocality: 'Meguro-ku',
        addressRegion: 'Tokyo',
        addressCountry: 'JP',
      },
      sameAs: [`https://instagram.com/${SITE_CONFIG.contact.instagramHandle}`],
    };

    let script = document.getElementById('sou-json-ld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'sou-json-ld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);
  }, [lang]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  // Synchronize Lenis smooth scroll with GSAP ScrollTrigger
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
        lenisRef.current.scrollTo(target, { duration: 1.05 });
      } else {
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  const scrollToY = useCallback(
    (y: number) => {
      if (lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(y, { duration: 1.0 });
      } else {
        window.scrollTo({ top: y, behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  // If opened with ?d=<design> or ?calibrate, jump smoothly straight to #tryon
  useEffect(() => {
    if (initialUrlFlags.decoded || initialUrlFlags.calibrate) {
      const t = window.setTimeout(() => {
        const el = document.getElementById('tryon');
        if (el) {
          el.scrollIntoView({ behavior: 'auto' });
        }
      }, 120);
      return () => window.clearTimeout(t);
    }
  }, [initialUrlFlags]);

  const handleDesignChange = useCallback(
    (next: NailDesignState, pushHistory = true) => {
      setDesign((prev) => {
        if (pushHistory) {
          setHistory((h) => [...h.slice(-19), cloneDesign(prev)]);
        }
        // Trigger sequential 5-finger brush wipe whenever colors/finishes/presets change
        const colorOrFinishChanged = prev.fingers.some(
          (f, i) =>
            f.colorId !== next.fingers[i].colorId ||
            f.finish !== next.fingers[i].finish ||
            f.art !== next.fingers[i].art
        );
        if (colorOrFinishChanged) {
          setPaintTrigger((k) => k + 1);
        }
        return cloneDesign(next);
      });

      // Keep URL ?d= silently synced when user edits inside Try-on without polluting history stack
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('d', encodeDesignToQuery(next));
        window.history.replaceState({}, '', url.toString());
      } catch {
        // Ignore in restricted environments
      }
    },
    []
  );

  const handleUndo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const last = h[h.length - 1];
      setDesign(cloneDesign(last));
      setPaintTrigger((k) => k + 1);
      return h.slice(0, -1);
    });
  }, []);

  const handleReset = useCallback(() => {
    handleDesignChange(SITE_CONFIG.signatureDesign, true);
  }, [handleDesignChange]);

  // Works detail -> "試着する"
  const handleTryWork = useCallback(
    (work: WorkItem) => {
      handleDesignChange(work.preset, true);
      scrollToSection('tryon');
    },
    [handleDesignChange, scrollToSection]
  );

  // Works detail -> "予約"
  const handleBookWork = useCallback(
    (work: WorkItem) => {
      const cloned = cloneDesign(work.preset);
      setDesign(cloned);
      setBookingAttachedDesign(cloned);
      setBookingAttachedServiceId(estimateDesign(cloned).serviceId);
      scrollToSection('booking');
    },
    [scrollToSection]
  );

  // Try-on Studio -> "このデザインで予約"
  const handleBookWithDesign = useCallback(() => {
    const cloned = cloneDesign(design);
    setBookingAttachedDesign(cloned);
    setBookingAttachedServiceId(estimateDesign(cloned).serviceId);
    scrollToSection('booking');
  }, [design, scrollToSection]);

  // Services -> "予約"
  const handleSelectServiceForBooking = useCallback(
    (serviceId: string) => {
      setBookingAttachedServiceId(serviceId);
      scrollToSection('booking');
    },
    [scrollToSection]
  );

  const handleHeroImageReady = useCallback(() => {
    setHeroImageReady(true);
    window.requestAnimationFrame(() => ScrollTrigger.refresh());
  }, []);

  return (
    <>
      <div className="film-grain" aria-hidden="true" />
      <CustomCursor />
      <Preloader ready={heroImageReady} reducedMotion={reducedMotion} />
      <Header
        lang={lang}
        onLangChange={setLang}
        onNavigate={scrollToSection}
      />

      <main>
        <HeroTryOnSection
          lang={lang}
          design={design}
          onDesignChange={handleDesignChange}
          onUndo={handleUndo}
          canUndo={history.length > 0}
          onReset={handleReset}
          paintTrigger={paintTrigger}
          onHeroImageReady={handleHeroImageReady}
          onNavigateToSection={scrollToSection}
          onBookWithDesign={handleBookWithDesign}
          calibrateMode={initialUrlFlags.calibrate}
        />

        <Suspense fallback={null}>
          <WorksCoverflow
            lang={lang}
            onTryWork={handleTryWork}
            onBookWork={handleBookWork}
          />

          <ServicesPinned
            lang={lang}
            onScrollToY={scrollToY}
            onSelectServiceForBooking={handleSelectServiceForBooking}
          />

          <ExplodedNail lang={lang} design={design} />

          <StatementDark lang={lang} scrollVelocityRef={scrollVelocityRef} />

          <FinaleSequence lang={lang} />

          <BookingSection
            lang={lang}
            attachedDesign={bookingAttachedDesign}
            attachedServiceId={bookingAttachedServiceId}
            onEditDesign={() => scrollToSection('tryon')}
          />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <FooterSection lang={lang} />
      </Suspense>
    </>
  );
};
