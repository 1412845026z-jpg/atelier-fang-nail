export type Lang = 'ja' | 'en';

export interface LocalizedText {
  ja: string;
  en: string;
}

export interface WorkItem {
  id: string;
  index: string;
  image: string;
  glowColor: string;
  title: LocalizedText;
  durationMin: number;
}

export interface ServiceItem {
  id: string;
  index: string;
  image: string;
  price: string;
  durationMin: number;
  title: LocalizedText;
}

export interface ExplodedLayerItem {
  index: string;
  name: LocalizedText;
}

export const SITE_CONFIG = {
  brandName: 'atelier fang',
  artistName: 'Fang',
  city: 'Berlin',
  years: 6,

  colors: {
    background: '#F2EEE8',
    ink: '#241E1A',
    muted: '#8A8178',
    accent: '#A7C1D9',
    darkBackground: '#1C1917',
    darkText: '#F2EEE8',
  },

  media: {
    heroVideo: '/media/hero.mp4',
    heroFramesDir: '/media/hero',
    heroPreviewFirst: '/media/veo-keyframes/01-hero-first-frame.jpg',
    heroPreviewLast: '/media/veo-keyframes/02-hero-last-frame.jpg',
    finaleVideo: '/media/finale.mp4',
    finaleFramesDir: '/media/finale',
    statementCutout: '/media/statement.png',
  },

  contact: {
    whatsappNumber: '491700000000', // 国際番号+電話番号（+・スペースなし）
    instagramHandle: 'atelierfang.nail',
    address: 'Berlin Mitte',
    mapsUrl: 'https://maps.google.com/?q=Berlin+Mitte',
    hours: {
      ja: '火–土 10:00–19:00',
      en: 'Tue–Sat 10:00–19:00',
    },
  },

  booking: {
    daysAhead: 21,
    closedWeekdays: [0, 1], // 0 = Sun, 1 = Mon
    timeSlots: ['10:00', '13:00', '16:00'],
  },

  nav: {
    works: { ja: '作品', en: 'Works' },
    services: { ja: 'メニュー', en: 'Menu' },
    booking: { ja: '予約', en: 'Book' },
  },

  hero: {
    cta: { ja: '予約', en: 'Book' },
  },

  worksSection: {
    closeLabel: { ja: '×', en: '×' },
    bookThis: { ja: '予約', en: 'Book' },
  },

  works: [
    {
      id: 'w-01',
      index: '01',
      image: '/media/works/01.jpg',
      glowColor: '#A7C1D9',
      title: { ja: '霧青フレンチ', en: 'Powder French' },
      durationMin: 90,
    },
    {
      id: 'w-02',
      index: '02',
      image: '/media/works/02.jpg',
      glowColor: '#B8C4BA',
      title: { ja: '青磁シェル', en: 'Celadon Shell' },
      durationMin: 120,
    },
    {
      id: 'w-03',
      index: '03',
      image: '/media/works/03.jpg',
      glowColor: '#A6836B',
      title: { ja: '琥珀マグネット', en: 'Amber Magnet' },
      durationMin: 120,
    },
    {
      id: 'w-04',
      index: '04',
      image: '/media/works/04.jpg',
      glowColor: '#DDD5C9',
      title: { ja: '乳白パール', en: 'Milky Pearl' },
      durationMin: 90,
    },
    {
      id: 'w-05',
      index: '05',
      image: '/media/works/05.jpg',
      glowColor: '#C5B5A6',
      title: { ja: '墨ライン', en: 'Ink Line' },
      durationMin: 120,
    },
    {
      id: 'w-06',
      index: '06',
      image: '/media/works/06.jpg',
      glowColor: '#D6B8B3',
      title: { ja: '透明グラス', en: 'Clear Glass' },
      durationMin: 150,
    },
    {
      id: 'w-07',
      index: '07',
      image: '/media/works/07.jpg',
      glowColor: '#E2D6CC',
      title: { ja: '素爪ケア', en: 'Bare Care' },
      durationMin: 30,
    },
    {
      id: 'w-08',
      index: '08',
      image: '/media/works/08.jpg',
      glowColor: '#C9B3AE',
      title: { ja: '無花果シロップ', en: 'Fig Syrup' },
      durationMin: 120,
    },
  ] as WorkItem[],

  servicesSection: {
    bookLabel: { ja: '予約', en: 'Book' },
  },

  services: [
    {
      id: 'srv-01',
      index: '01',
      image: '/media/services/01.jpg',
      price: '€45',
      durationMin: 90,
      title: { ja: 'ワンカラー', en: 'Soft Gel' },
    },
    {
      id: 'srv-02',
      index: '02',
      image: '/media/services/02.jpg',
      price: '€65',
      durationMin: 120,
      title: { ja: '手描きアート', en: 'Hand-Painted' },
    },
    {
      id: 'srv-03',
      index: '03',
      image: '/media/services/03.jpg',
      price: '€80',
      durationMin: 150,
      title: { ja: 'スカルプ長さ出し', en: 'Extension' },
    },
    {
      id: 'srv-04',
      index: '04',
      image: '/media/services/04.jpg',
      price: '€20',
      durationMin: 30,
      title: { ja: 'オフ＆ケア', en: 'Removal & Care' },
    },
  ] as ServiceItem[],

  exploded: {
    layers: [
      { index: '01', name: { ja: 'ケア', en: 'Prep' } },
      { index: '02', name: { ja: 'ベース', en: 'Base' } },
      { index: '03', name: { ja: 'カラー', en: 'Color' } },
      { index: '04', name: { ja: 'アート', en: 'Art' } },
      { index: '05', name: { ja: 'トップ', en: 'Top' } },
    ] as ExplodedLayerItem[],
  },

  statement: {
    marquee: 'atelier fang — ',
    vows: [
      { ja: '完全予約制 · 1:1', en: 'Private · 1:1' },
      { ja: '完全滅菌', en: 'Sterilized' },
      { ja: '7日間無料お直し', en: '7-Day Touch-Up' },
    ],
  },

  finale: {
    line: {
      ja: '予約',
      en: 'Book',
    },
  },

  bookingUI: {
    stepLabels: [
      { ja: '01 メニュー', en: '01 Menu' },
      { ja: '02 日付', en: '02 Date' },
      { ja: '03 時間', en: '03 Time' },
      { ja: '04 送信', en: '04 Send' },
    ],
    nameLabel: { ja: 'お名前', en: 'Name' },
    phoneLabel: { ja: '電話番号', en: 'Phone' },
    noteLabel: { ja: 'デザイン', en: 'Ref' },
    sendWhatsApp: { ja: 'WhatsApp', en: 'WhatsApp' },
    sendInstagram: { ja: 'Instagram DM', en: 'Instagram DM' },
    copyText: { ja: 'コピー', en: 'Copy' },
    copied: { ja: 'コピー済', en: 'Copied' },
  },

  footer: {
    openMaps: { ja: 'Maps ↗', en: 'Maps ↗' },
  },
};
