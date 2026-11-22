import {
  ColorSwatch,
  FingerCalibration,
  FingerDesign,
  Lang,
  LinePattern,
  LocalizedText,
  NailArtType,
  NailDesignState,
  NailFinish,
  NailLength,
  NailShape,
} from './types/nail';

export type { Lang, LocalizedText };

export interface WorkItem {
  id: string;
  index: string;
  image: string;
  glowColor: string;
  title: LocalizedText;
  finishTag: string;
  durationMin: number;
  preset: NailDesignState;
}

export interface ServiceItem {
  id: string;
  index: string;
  image: string;
  priceYen: number;
  durationMin: number;
  /** Word-break safe segmented title parts for crisp Japanese line breaks */
  titleParts: { ja: string[]; en: string[] };
  title: LocalizedText;
}

export interface ExplodedLayerItem {
  index: string;
  name: LocalizedText;
  spec: LocalizedText;
}

function uniformFingers(f: FingerDesign): NailDesignState['fingers'] {
  return [{ ...f }, { ...f }, { ...f }, { ...f }, { ...f }];
}

function accentedFingers(
  base: FingerDesign,
  accentIdx: 0 | 1 | 2 | 3 | 4,
  override: Partial<FingerDesign>
): NailDesignState['fingers'] {
  const arr = uniformFingers(base);
  arr[accentIdx] = { ...base, ...override };
  return arr;
}

export const SITE_CONFIG = {
  brandName: 'soū nail atelier',
  brandShort: 'soū',
  artistName: 'Fang',
  city: {
    ja: '東京都目黒区',
    en: 'Meguro-ku, Tokyo',
  },
  years: 6,

  /** Single currency across the entire site — zero mixed currencies */
  currencyCode: 'JPY',
  currencySymbol: '¥',
  priceRangeLabel: '¥6,000–¥9,000',

  colors: {
    background: '#F2EEE8',
    ink: '#241E1A',
    muted: '#8A8178',
    accent: '#A7C1D9',
    darkBackground: '#1C1917',
    darkText: '#F2EEE8',
  },

  media: {
    /** Keep false until you place public/media/hero.mp4 — prevents 404 console probes */
    hasHeroVideo: false,
    hasFinaleVideo: false,
    heroVideo: '/media/hero.mp4',
    heroFramesDir: '/media/hero',
    finaleVideo: '/media/finale.mp4',
    finaleFramesDir: '/media/finale',
    bareHandBase: '/media/bare-hand-base.webp',
    bareHandBaseMobile: '/media/bare-hand-base-880.webp',
    bareHandWidth: 1376,
    bareHandHeight: 768,
    statementCutout: '/media/statement.webp',
    ogImage: '/media/og-card.jpg',
  },

  /** Japan-native salon channels (LINE Official primary + Instagram DM secondary; zero WhatsApp) */
  contact: {
    lineOfficialId: '@sou.aobadai',
    instagramHandle: 'sou.nail.tokyo',
    address: {
      ja: '東京都目黒区青葉台 1-18-7 2F',
      en: '1-18-7-2F Aobadai, Meguro-ku, Tokyo',
    },
    postalCode: '153-0042',
    mapsUrl: 'https://maps.google.com/?q=Aobadai+Meguro-ku+Tokyo',
    hours: {
      ja: '火–土 10:00–19:00（日・月定休）',
      en: 'Tue–Sat 10:00–19:00 (Closed Sun & Mon)',
    },
    openingHoursSchema: 'Tu-Sa 10:00-19:00',
  },

  booking: {
    daysAhead: 21,
    closedWeekdays: [0, 1], // 0 = Sun, 1 = Mon
    timeSlots: ['10:00', '13:00', '16:00'],
  },

  /** Transparent ¥6,000–¥9,000 tier estimation rules for the Nail Try-on Studio */
  pricingRules: {
    clearCareBaseYen: 6000,
    oneColorBaseYen: 6500,
    lengthAddYen: {
      S: 0,
      M: 400,
      L: 1500,
    } as Record<NailLength, number>,
    specialFinishAddYen: 500, // magnet / chrome / pearl
    fullFrenchAddYen: 700,
    perArtFingerYen: 300,
    maxArtAddYen: 1500,
  },

  /** Exact pixel calibration for bare-hand-base.webp (1376 × 768) — editable via ?calibrate */
  fingerCalibrations: [
    {
      index: 0,
      id: 'pinky',
      label: { ja: '小指', en: 'Pinky' },
      cx: 506,
      cy: 286,
      angleDeg: -8,
      width: 29,
      baseLength: 44,
      scaleY: 0.96,
    },
    {
      index: 1,
      id: 'ring',
      label: { ja: '薬指', en: 'Ring' },
      cx: 596,
      cy: 185,
      angleDeg: -2.5,
      width: 35,
      baseLength: 50,
      scaleY: 1.0,
    },
    {
      index: 2,
      id: 'middle',
      label: { ja: '中指', en: 'Middle' },
      cx: 681,
      cy: 140,
      angleDeg: -1,
      width: 39,
      baseLength: 53,
      scaleY: 1.0,
    },
    {
      index: 3,
      id: 'index',
      label: { ja: '人差し指', en: 'Index' },
      cx: 780,
      cy: 169,
      angleDeg: 2.5,
      width: 36,
      baseLength: 51,
      scaleY: 1.0,
    },
    {
      index: 4,
      id: 'thumb',
      label: { ja: '親指', en: 'Thumb' },
      cx: 887,
      cy: 388,
      angleDeg: 20,
      width: 31,
      baseLength: 51,
      scaleY: 0.9,
    },
  ] as FingerCalibration[],

  shapes: [
    { id: 'square' as NailShape, label: { ja: 'スクエア', en: 'Square' } },
    { id: 'squoval' as NailShape, label: { ja: 'スクエアオフ', en: 'Squoval' } },
    { id: 'round' as NailShape, label: { ja: 'ラウンド', en: 'Round' } },
    { id: 'oval' as NailShape, label: { ja: 'オーバル', en: 'Oval' } },
    { id: 'almond' as NailShape, label: { ja: 'アーモンド', en: 'Almond' } },
    { id: 'ballerina' as NailShape, label: { ja: 'バレリーナ', en: 'Ballerina' } },
    { id: 'stiletto' as NailShape, label: { ja: 'スティレット', en: 'Stiletto' } },
  ],

  lengths: [
    { id: 'S' as NailLength, label: { ja: 'ショート', en: 'Short' }, tag: 'S' },
    { id: 'M' as NailLength, label: { ja: 'ミディアム', en: 'Medium' }, tag: 'M' },
    { id: 'L' as NailLength, label: { ja: 'ロング', en: 'Long' }, tag: 'L' },
  ],

  finishes: [
    { id: 'gloss' as NailFinish, label: { ja: 'グロス', en: 'Gloss' }, code: 'GLOSS' },
    { id: 'matte' as NailFinish, label: { ja: 'マット', en: 'Matte' }, code: 'MATTE' },
    { id: 'sheer' as NailFinish, label: { ja: 'シアー', en: 'Sheer' }, code: 'SHEER' },
    { id: 'pearl' as NailFinish, label: { ja: 'パール', en: 'Pearl' }, code: 'PEARL' },
    { id: 'chrome' as NailFinish, label: { ja: 'クローム', en: 'Chrome' }, code: 'CHROME' },
    { id: 'magnet' as NailFinish, label: { ja: 'マグネット', en: 'Magnet' }, code: 'MAGNET' },
  ],

  artTypes: [
    { id: 'none' as NailArtType, label: { ja: 'なし', en: 'None' } },
    { id: 'french' as NailArtType, label: { ja: 'フレンチ', en: 'French' } },
    { id: 'line' as NailArtType, label: { ja: '細ライン', en: 'Fine Line' } },
    { id: 'pearl' as NailArtType, label: { ja: '真珠', en: 'Pearl' } },
    { id: 'stud' as NailArtType, label: { ja: 'スタッズ', en: 'Studs' } },
  ],

  linePatterns: [
    { id: 'arc' as LinePattern, label: { ja: '一筆弧', en: 'Arc' } },
    { id: 'twin' as LinePattern, label: { ja: '二本線', en: 'Twin' } },
    { id: 'botanical' as LinePattern, label: { ja: '枝線', en: 'Stem' } },
    { id: 'cross' as LinePattern, label: { ja: '交差', en: 'Cross' } },
  ],

  /** Curated 16-color apothecary swatch library (every pairing looks cohesive) */
  palette: [
    { id: 'nyuhaku', code: 'No.01', hex: '#EDE6DF', name: { ja: '乳白', en: 'Milky' }, defaultFinish: 'sheer' },
    { id: 'suhada-rose', code: 'No.02', hex: '#D9B8A8', name: { ja: '素肌ローズ', en: 'Bare Rose' }, defaultFinish: 'sheer' },
    { id: 'sakuranezu', code: 'No.03', hex: '#C9B3AE', name: { ja: '桜鼠', en: 'Sakura Grey' }, defaultFinish: 'gloss' },
    { id: 'kiriao', code: 'No.04', hex: '#A9BFD4', name: { ja: '霧青', en: 'Mist Blue' }, defaultFinish: 'gloss' },
    { id: 'seiji', code: 'No.05', hex: '#B5C7B4', name: { ja: '青磁', en: 'Celadon' }, defaultFinish: 'sheer' },
    { id: 'haiume', code: 'No.06', hex: '#8E6F78', name: { ja: '灰梅', en: 'Ash Plum' }, defaultFinish: 'gloss' },
    { id: 'ichijiku', code: 'No.07', hex: '#6E3F4A', name: { ja: '無花果', en: 'Fig' }, defaultFinish: 'sheer' },
    { id: 'kohaku', code: 'No.08', hex: '#A26A3F', name: { ja: '琥珀', en: 'Amber' }, defaultFinish: 'magnet' },
    { id: 'kurumi', code: 'No.09', hex: '#5A4033', name: { ja: '胡桃', en: 'Walnut' }, defaultFinish: 'gloss' },
    { id: 'sumi', code: 'No.10', hex: '#1F1B1A', name: { ja: '墨', en: 'Sumi Ink' }, defaultFinish: 'matte' },
    { id: 'kaki', code: 'No.11', hex: '#C2643F', name: { ja: '柿', en: 'Persimmon' }, defaultFinish: 'gloss' },
    { id: 'koke', code: 'No.12', hex: '#6E7457', name: { ja: '苔', en: 'Moss' }, defaultFinish: 'matte' },
    { id: 'budo', code: 'No.13', hex: '#4B3A55', name: { ja: '葡萄', en: 'Grape' }, defaultFinish: 'magnet' },
    { id: 'shinju', code: 'No.14', hex: '#F1EDE6', name: { ja: '真珠', en: 'Pearl' }, defaultFinish: 'pearl' },
    { id: 'ginnezu', code: 'No.15', hex: '#B9B7B2', name: { ja: '銀鼠', en: 'Silver Grey' }, defaultFinish: 'chrome' },
    { id: 'kincha', code: 'No.16', hex: '#B89462', name: { ja: '金茶', en: 'Gilded Tea' }, defaultFinish: 'magnet' },
  ] as ColorSwatch[],

  nav: {
    tryon: { ja: '試着', en: 'Try on' },
    works: { ja: '作品', en: 'Works' },
    services: { ja: 'メニュー', en: 'Menu' },
    booking: { ja: '予約', en: 'Book' },
  },

  hero: {
    primaryCta: { ja: '試してみる', en: 'Try on' },
    secondaryCta: { ja: '予約', en: 'Book' },
  },

  /** Signature opening look painted automatically onto bare nails after vellum peel */
  signatureDesign: {
    shape: 'almond',
    length: 'M',
    presetId: 'w-01',
    fingers: uniformFingers({
      colorId: 'nyuhaku',
      finish: 'sheer',
      art: 'french',
      frenchColorId: 'kiriao',
      frenchWidth: 0.13,
      frenchCurve: 0.48,
      linePattern: 'arc',
      accentCount: 1,
    }),
  } as NailDesignState,

  worksSection: {
    heading: { ja: 'Works · 08', en: 'Works · 08' },
    closeLabel: { ja: '×', en: '×' },
    tryThis: { ja: '試着する', en: 'Try on' },
    bookThis: { ja: '予約', en: 'Book' },
  },

  /** 8 works, each linked 1-to-1 with a full Try-on preset */
  works: [
    {
      id: 'w-01',
      index: '01',
      image: '/media/works/01.webp',
      glowColor: '#A7C1D9',
      title: { ja: '霧青フレンチ', en: 'Powder French' },
      finishTag: 'SHEER · FRENCH',
      durationMin: 90,
      preset: {
        shape: 'almond',
        length: 'M',
        presetId: 'w-01',
        fingers: uniformFingers({
          colorId: 'nyuhaku',
          finish: 'sheer',
          art: 'french',
          frenchColorId: 'kiriao',
          frenchWidth: 0.13,
          frenchCurve: 0.48,
          linePattern: 'arc',
          accentCount: 1,
        }),
      },
    },
    {
      id: 'w-02',
      index: '02',
      image: '/media/works/02.webp',
      glowColor: '#9DB8A1',
      title: { ja: '青磁シェル', en: 'Celadon Shell' },
      finishTag: 'PEARL · SHELL',
      durationMin: 120,
      preset: {
        shape: 'squoval',
        length: 'S',
        presetId: 'w-02',
        fingers: accentedFingers(
          {
            colorId: 'seiji',
            finish: 'sheer',
            art: 'none',
            frenchColorId: 'shinju',
            frenchWidth: 0.12,
            frenchCurve: 0.45,
            linePattern: 'arc',
            accentCount: 1,
          },
          1,
          { finish: 'pearl', art: 'pearl', accentCount: 2 }
        ),
      },
    },
    {
      id: 'w-03',
      index: '03',
      image: '/media/works/03.webp',
      glowColor: '#A26A3F',
      title: { ja: '琥珀マグネット', en: 'Amber Magnet' },
      finishTag: 'MAGNET',
      durationMin: 120,
      preset: {
        shape: 'oval',
        length: 'M',
        presetId: 'w-03',
        fingers: accentedFingers(
          {
            colorId: 'kohaku',
            finish: 'magnet',
            art: 'none',
            frenchColorId: 'kincha',
            frenchWidth: 0.12,
            frenchCurve: 0.45,
            linePattern: 'arc',
            accentCount: 1,
          },
          1,
          { art: 'stud', accentCount: 1 }
        ),
      },
    },
    {
      id: 'w-04',
      index: '04',
      image: '/media/works/04.webp',
      glowColor: '#D9C8B8',
      title: { ja: '乳白パール', en: 'Milky Pearl' },
      finishTag: 'PEARL',
      durationMin: 90,
      preset: {
        shape: 'round',
        length: 'S',
        presetId: 'w-04',
        fingers: accentedFingers(
          {
            colorId: 'nyuhaku',
            finish: 'pearl',
            art: 'french',
            frenchColorId: 'shinju',
            frenchWidth: 0.11,
            frenchCurve: 0.35,
            linePattern: 'arc',
            accentCount: 1,
          },
          1,
          { art: 'pearl', accentCount: 1 }
        ),
      },
    },
    {
      id: 'w-05',
      index: '05',
      image: '/media/works/05.webp',
      glowColor: '#A89480',
      title: { ja: '墨ライン', en: 'Ink Line' },
      finishTag: 'GLOSS · LINE',
      durationMin: 120,
      preset: {
        shape: 'square',
        length: 'S',
        presetId: 'w-05',
        fingers: accentedFingers(
          {
            colorId: 'suhada-rose',
            finish: 'sheer',
            art: 'none',
            frenchColorId: 'sumi',
            frenchWidth: 0.1,
            frenchCurve: 0.4,
            linePattern: 'botanical',
            accentCount: 1,
          },
          1,
          { art: 'line', linePattern: 'botanical' }
        ),
      },
    },
    {
      id: 'w-06',
      index: '06',
      image: '/media/works/06.webp',
      glowColor: '#D6A8A2',
      title: { ja: '透明グラス', en: 'Clear Glass' },
      finishTag: 'SHEER · LONG',
      durationMin: 150,
      preset: {
        shape: 'ballerina',
        length: 'L',
        presetId: 'w-06',
        fingers: uniformFingers({
          colorId: 'suhada-rose',
          finish: 'sheer',
          art: 'french',
          frenchColorId: 'shinju',
          frenchWidth: 0.22,
          frenchCurve: 0.3,
          linePattern: 'arc',
          accentCount: 1,
        }),
      },
    },
    {
      id: 'w-07',
      index: '07',
      image: '/media/works/07.webp',
      glowColor: '#D9CBBF',
      title: { ja: '素爪ケア', en: 'Bare Care' },
      finishTag: 'SHEER · CARE',
      durationMin: 75,
      preset: {
        shape: 'round',
        length: 'S',
        presetId: 'w-07',
        fingers: uniformFingers({
          colorId: 'nyuhaku',
          finish: 'sheer',
          art: 'none',
          frenchColorId: 'shinju',
          frenchWidth: 0.1,
          frenchCurve: 0.35,
          linePattern: 'arc',
          accentCount: 1,
        }),
      },
    },
    {
      id: 'w-08',
      index: '08',
      image: '/media/works/08.webp',
      glowColor: '#8E5863',
      title: { ja: '無花果シロップ', en: 'Fig Syrup' },
      finishTag: 'SHEER · GLOSS',
      durationMin: 120,
      preset: {
        shape: 'oval',
        length: 'S',
        presetId: 'w-08',
        fingers: uniformFingers({
          colorId: 'ichijiku',
          finish: 'sheer',
          art: 'none',
          frenchColorId: 'shinju',
          frenchWidth: 0.12,
          frenchCurve: 0.45,
          linePattern: 'arc',
          accentCount: 1,
        }),
      },
    },
  ] as WorkItem[],

  /** Curated おまかせ combinations (max 2 colors + 1 art — guaranteed studio taste) */
  omakaseLooks: [
    {
      shape: 'almond',
      length: 'M',
      fingers: accentedFingers(
        {
          colorId: 'haiume',
          finish: 'gloss',
          art: 'none',
          frenchColorId: 'shinju',
          frenchWidth: 0.12,
          frenchCurve: 0.45,
          linePattern: 'arc',
          accentCount: 1,
        },
        1,
        { colorId: 'shinju', finish: 'pearl', art: 'line', linePattern: 'arc' }
      ),
    },
    {
      shape: 'oval',
      length: 'M',
      fingers: accentedFingers(
        {
          colorId: 'koke',
          finish: 'matte',
          art: 'none',
          frenchColorId: 'kincha',
          frenchWidth: 0.1,
          frenchCurve: 0.4,
          linePattern: 'twin',
          accentCount: 1,
        },
        1,
        { finish: 'gloss', art: 'stud', accentCount: 1 }
      ),
    },
    {
      shape: 'ballerina',
      length: 'M',
      fingers: uniformFingers({
        colorId: 'ginnezu',
        finish: 'chrome',
        art: 'none',
        frenchColorId: 'sumi',
        frenchWidth: 0.1,
        frenchCurve: 0.4,
        linePattern: 'arc',
        accentCount: 1,
      }),
    },
    {
      shape: 'almond',
      length: 'M',
      fingers: accentedFingers(
        {
          colorId: 'budo',
          finish: 'magnet',
          art: 'none',
          frenchColorId: 'ginnezu',
          frenchWidth: 0.11,
          frenchCurve: 0.5,
          linePattern: 'arc',
          accentCount: 1,
        },
        1,
        { art: 'pearl', accentCount: 1 }
      ),
    },
    {
      shape: 'squoval',
      length: 'S',
      fingers: uniformFingers({
        colorId: 'sakuranezu',
        finish: 'gloss',
        art: 'french',
        frenchColorId: 'kurumi',
        frenchWidth: 0.1,
        frenchCurve: 0.42,
        linePattern: 'arc',
        accentCount: 1,
      }),
    },
    {
      shape: 'oval',
      length: 'S',
      fingers: accentedFingers(
        {
          colorId: 'kaki',
          finish: 'sheer',
          art: 'none',
          frenchColorId: 'kincha',
          frenchWidth: 0.12,
          frenchCurve: 0.45,
          linePattern: 'cross',
          accentCount: 1,
        },
        1,
        { colorId: 'kincha', finish: 'magnet', art: 'none' }
      ),
    },
  ] as NailDesignState[],

  servicesSection: {
    bookLabel: { ja: '予約', en: 'Book' },
  },

  /** ¥6,000–¥9,000 Japanese Yen tier distribution with 4 unique process photos */
  services: [
    {
      id: 'srv-01',
      index: '01',
      image: '/media/services/01.webp',
      priceYen: 6000,
      durationMin: 75,
      titleParts: { ja: ['素爪ケア', '＆クリア'], en: ['Sheer Care', '& Clear'] },
      title: { ja: '素爪ケア＆クリア', en: 'Sheer Care & Clear' },
    },
    {
      id: 'srv-02',
      index: '02',
      image: '/media/services/02.webp',
      priceYen: 6800,
      durationMin: 90,
      titleParts: { ja: ['ワンカラー'], en: ['One Color', 'Gel'] },
      title: { ja: 'ワンカラー', en: 'One Color Gel' },
    },
    {
      id: 'srv-03',
      index: '03',
      image: '/media/services/03.webp',
      priceYen: 8200,
      durationMin: 120,
      titleParts: { ja: ['ニュアンス・', '手描きアート'], en: ['Nuance &', 'Hand-Painted'] },
      title: { ja: 'ニュアンス・手描きアート', en: 'Nuance & Hand-Painted' },
    },
    {
      id: 'srv-04',
      index: '04',
      image: '/media/services/04.webp',
      priceYen: 9000,
      durationMin: 150,
      titleParts: { ja: ['スカルプ', '長さ出し'], en: ['Sculpted', 'Extension'] },
      title: { ja: 'スカルプ長さ出し', en: 'Sculpted Extension' },
    },
  ] as ServiceItem[],

  exploded: {
    heading: { ja: '5層構造', en: '5 LAYERS' },
    closingLine: {
      ja: '見えるのは1枚。重ねているのは5層。',
      en: 'You see one coat. I build five layers.',
    },
    layers: [
      { index: '01', name: { ja: '自爪ケア', en: 'Prep' }, spec: { ja: 'BASE PREP', en: 'BASE PREP' } },
      { index: '02', name: { ja: '補強ベース', en: 'Builder Base' }, spec: { ja: 'APEX GEL', en: 'APEX GEL' } },
      { index: '03', name: { ja: 'カラー', en: 'Color Coat' }, spec: { ja: 'PIGMENT', en: 'PIGMENT' } },
      { index: '04', name: { ja: '質感・アート', en: 'Finish & Art' }, spec: { ja: 'DETAIL', en: 'DETAIL' } },
      { index: '05', name: { ja: 'トップコート', en: 'Top Seal' }, spec: { ja: 'GLOSS SEAL', en: 'GLOSS SEAL' } },
    ] as ExplodedLayerItem[],
  },

  statement: {
    marquee: 'soū nail atelier — ',
    vows: [
      { ja: '完全予約制 · 一対一', en: 'Private · One to One' },
      { ja: '器具完全滅菌', en: 'Sterilized Per Guest' },
      { ja: '7日間無料お直し', en: '7-Day Complimentary Fix' },
    ],
  },

  tryonUI: {
    tabs: [
      { id: 'shape' as const, label: { ja: '形', en: 'Shape' } },
      { id: 'length' as const, label: { ja: '長さ', en: 'Length' } },
      { id: 'color' as const, label: { ja: '色・質感', en: 'Color' } },
      { id: 'art' as const, label: { ja: 'アート', en: 'Art' } },
    ],
    allFingers: { ja: '全部', en: 'All' },
    compare: { ja: '比較', en: 'Compare' },
    omakase: { ja: 'おまかせ', en: 'Curated' },
    undo: { ja: '戻す', en: 'Undo' },
    reset: { ja: 'リセット', en: 'Reset' },
    saveImage: { ja: '画像を保存', en: 'Save card' },
    savedStamp: { ja: '保存しました', en: 'Card saved' },
    ownHand: { ja: '自分の手で試す', en: 'Use my hand' },
    bookDesign: { ja: 'このデザインで予約', en: 'Book this design' },
    consultFirst: { ja: 'まず相談する', en: 'Consult first' },
    priceDisclaimer: {
      ja: '※最終料金はカウンセリングで確定',
      en: '*Final price confirmed at consultation',
    },
    presetsLabel: { ja: '作品から選ぶ', en: 'Presets' },
    frenchWidth: { ja: '幅', en: 'Width' },
    frenchCurve: { ja: 'カーブ', en: 'Curve' },
    frenchColor: { ja: '先端カラー', en: 'Tip Color' },
    accentCount: { ja: '個数', en: 'Count' },
    bareLabel: { ja: '素爪', en: 'BARE' },
    designLabel: { ja: '試着', en: 'TRY-ON' },
    igCopiedNotice: {
      ja: 'コピーしました。Instagram DM に貼り付けて送信してください。',
      en: 'Copied — paste and send in Instagram DM.',
    },
  },

  bookingUI: {
    stepLabels: [
      { ja: 'メニュー', en: 'Menu' },
      { ja: '日付', en: 'Date' },
      { ja: '時間', en: 'Time' },
      { ja: '送信', en: 'Send' },
    ],
    unselected: { ja: '未選択', en: 'Not selected' },
    next: { ja: '次へ', en: 'Next' },
    prev: { ja: '戻る', en: 'Back' },
    changeDesign: { ja: '変更', en: 'Edit' },
    nameLabel: { ja: 'お名前', en: 'Name' },
    phoneLabel: { ja: '電話番号（任意）', en: 'Phone (optional)' },
    noteLabel: { ja: '備考（任意）', en: 'Note (optional)' },
    sendLine: { ja: 'LINE で予約を送る', en: 'Send via LINE' },
    sendInstagram: { ja: 'Instagram DM', en: 'Instagram DM' },
    copyText: { ja: 'テキストをコピー', en: 'Copy text' },
    copied: { ja: 'コピー済', en: 'Copied' },
    igCopiedNotice: {
      ja: 'コピーしました。貼り付けて送信してください。',
      en: 'Copied — paste and send in DM.',
    },
  },

  footer: {
    openMaps: { ja: 'Maps ↗', en: 'Maps ↗' },
  },
};
