import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { Lang, SITE_CONFIG } from './config';
import { FingerMaskCalibration } from './types/nail';
import {
  decodeSelectionFromQuery,
  encodeSelectionToQuery,
} from './utils/designCodec';
import { usePrefersReducedMotion } from './utils/webgl';
import { Header } from './components/Header';
import { HeroBudSection } from './sections/HeroBudSection';
import { VanityTraySection } from './sections/VanityTraySection';
import { TipSampleSection } from './sections/TipSampleSection';
import { SalonSection } from './sections/SalonSection';
import { CounselingCardSection } from './sections/CounselingCardSection';
import { FooterSection } from './sections/FooterSection';

export const App: React.FC = () => {
  const [lang, setLang] = useState<Lang>('ja');
  const reducedMotion = usePrefersReducedMotion();

  // Parse ?d=<base64url> and ?calibrate on initial load
  const [initialParams] = useState(() => {
    if (typeof window === 'undefined') {
      return { decoded: null, calibrate: false };
    }
    const qs = new URLSearchParams(window.location.search);
    const d = qs.get('d');
    return {
      decoded: d ? decodeSelectionFromQuery(d) : null,
      calibrate: qs.has('calibrate'),
    };
  });

  // Shared design selection across 02 Vanity, 03 Tip Sample Book, and 05 Counseling Card
  const [activeDesignId, setActiveDesignId] = useState<string>(() => {
    if (initialParams.decoded && initialParams.decoded.designId !== 'consult') {
      return initialParams.decoded.designId;
    }
    return SITE_CONFIG.hero.defaultRevealDesignId;
  });

  const [counselingDesignId, setCounselingDesignId] = useState<string>(
    () => initialParams.decoded?.designId || SITE_CONFIG.hero.defaultRevealDesignId
  );

  // One-shot inspect trigger when jumping from Vanity 「詳しく見る」 -> 03 チップ見本
  const [externalInspectId, setExternalInspectId] = useState<string | null>(null);

  // Shared 5-finger mask calibration state (editable when ?calibrate is present)
  const [calibrations, setCalibrations] = useState<FingerMaskCalibration[]>(
    SITE_CONFIG.fingerCalibrations
  );

  const lenisRef = useRef<Lenis | null>(null);

  // Sync <html lang> + JSON-LD (NailSalon + FAQPage) hydrated from SITE_CONFIG
  useEffect(() => {
    document.documentElement.lang = lang;

    const baseUrl =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : '';

    const graph = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'NailSalon',
          name: SITE_CONFIG.brandName,
          url: baseUrl,
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
        },
        {
          '@type': 'FAQPage',
          mainEntity: SITE_CONFIG.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.q[lang],
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.a[lang],
            },
          })),
        },
      ],
    };

    let script = document.getElementById('sou-json-ld') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'sou-json-ld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(graph);
  }, [lang]);

  // Silky Lenis smooth scroll
  useEffect(() => {
    if (reducedMotion) return;
    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    return () => {
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const target = document.getElementById(sectionId);
      if (!target) return;
      if (lenisRef.current && !reducedMotion) {
        lenisRef.current.scrollTo(target, { duration: 1.0 });
      } else {
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
      }
    },
    [reducedMotion]
  );

  // Jump straight to #vanity when opened with ?d=<design> or ?calibrate
  useEffect(() => {
    if (initialParams.decoded || initialParams.calibrate) {
      const t = window.setTimeout(() => {
        document.getElementById('vanity')?.scrollIntoView({ behavior: 'auto' });
      }, 100);
      return () => window.clearTimeout(t);
    }
  }, [initialParams]);

  // Select design from 02 Vanity -> syncs URL ?d= silently + updates counseling default
  const handleSelectDesign = useCallback((designId: string) => {
    setActiveDesignId(designId);
    setCounselingDesignId(designId);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('d', encodeSelectionToQuery({ designId }));
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Ignore restricted URL environments
    }
  }, []);

  // From 02 Vanity or 03 Tip Sample -> 「このネイルで相談」 / 「このデザインで相談」
  const handleConsultDesign = useCallback(
    (designId: string) => {
      setActiveDesignId(designId);
      setCounselingDesignId(designId);
      scrollToSection('counseling');
    },
    [scrollToSection]
  );

  // From 02 Vanity -> 「詳しく見る」 -> jumps to 03 Tip Sample zoomed onto that tip
  const handleInspectDetail = useCallback(
    (designId: string) => {
      setExternalInspectId(designId);
      scrollToSection('tips');
    },
    [scrollToSection]
  );

  // From 03 Tip Sample -> 「化粧台で試す」 -> jumps to 02 Vanity spun to that bottle
  const handleTryOnVanity = useCallback(
    (designId: string) => {
      handleSelectDesign(designId);
      scrollToSection('vanity');
    },
    [handleSelectDesign, scrollToSection]
  );

  return (
    <>
      <Header lang={lang} onLangChange={setLang} onNavigate={scrollToSection} />

      <main>
        {/* 01 首页花苞 — 花びらが、指先に。 */}
        <HeroBudSection
          lang={lang}
          reducedMotion={reducedMotion}
          onNavigate={scrollToSection}
          skipIntro={Boolean(initialParams.decoded || initialParams.calibrate)}
        />

        {/* 02 化妆台 — くるくるパレット */}
        <VanityTraySection
          lang={lang}
          activeDesignId={activeDesignId}
          onSelectDesign={handleSelectDesign}
          onConsultDesign={handleConsultDesign}
          onInspectDetail={handleInspectDetail}
          reducedMotion={reducedMotion}
          calibrateMode={initialParams.calibrate}
          calibrations={calibrations}
          onCalibrationsChange={setCalibrations}
        />

        {/* 03 チップ見本 — 12 Salon Gel Tips + Expandable Menu */}
        <TipSampleSection
          lang={lang}
          externalInspectId={externalInspectId}
          onClearExternalInspect={() => setExternalInspectId(null)}
          onTryOnVanity={handleTryOnVanity}
          onConsultDesign={handleConsultDesign}
          reducedMotion={reducedMotion}
        />

        {/* 04 美甲师与沙龙 */}
        <SalonSection lang={lang} />

        {/* 05 カウンセリングカード */}
        <CounselingCardSection
          lang={lang}
          syncedDesignId={counselingDesignId}
          initialShape={initialParams.decoded?.shape}
          initialLengthLevel={initialParams.decoded?.lengthLevel}
        />
      </main>

      {/* 页脚 (Access, Hours, Placeholder FAQ) */}
      <FooterSection lang={lang} />
    </>
  );
};
