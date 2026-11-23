import {
  ActiveCardSpec,
  FingerMaskCalibration,
  Lang,
  LocalizedText,
  MenuCategoryMeta,
  NailCategoryId,
  NailDesignItem,
  SelfAccentOption,
  SelfColorOption,
  SelfLengthId,
  SelfSelection,
  SelfShapeId,
  SelfTechniqueOption,
} from './types/nail';

export type { Lang, LocalizedText };

export const SITE_CONFIG = {
  brandName: 'soū nail atelier',
  brandShort: 'soū',
  artistName: 'Fang',
  currencySymbol: '¥',

  colors: {
    background: '#F7F1EE',
    surface: '#EFE3DE',
    ink: '#3B2B2C',
    muted: '#7E6B6C',
    accent: '#C9989A',
    gold: '#C7A97F',
    dark: '#2A1D1F',
  },

  media: {
    refWidth: 1376,
    refHeight: 768,
    masterAspectW: 1376,
    masterAspectH: 2344,
    nailsMaskWebp: '/media/v4/web/nails-mask-1600.webp',
    clearBottleWebp: '/media/v4/bottles/clear.webp',
    milkyRefBottleWebp: '/media/v4/bottles/milky-ref.webp',
    bottleCavityMask: '/media/v4/bottles/cavity-mask.png',
    salonHands: '/media/salon/hands.webp',
    salonHandsMobile: '/media/salon/hands-720.webp',
  },

  contact: {
    lineOfficialId: '@sou.aobadai',
    instagramHandle: 'sou.nail.tokyo',
    address: {
      ja: '東京都目黒区青葉台 1-18-7 2F',
      en: '1-18-7-2F Aobadai, Meguro-ku, Tokyo',
    },
    stationNote: {
      ja: '中目黒駅 徒歩 7 分',
      en: '7 min from Nakameguro Sta.',
    },
    mapsUrl: 'https://maps.google.com/?q=Aobadai+Meguro-ku+Tokyo',
    hours: {
      ja: '火–土 10:00–19:00',
      en: 'Tue–Sat 10:00–19:00',
    },
  },

  /** Strictly 4 allowed top-bar navigation labels */
  nav: {
    vanity: { ja: 'ネイルを選ぶ', en: 'Try On' },
    designs: { ja: 'デザイン', en: 'Self Design' },
    salon: { ja: 'サロン', en: 'Salon' },
    counseling: { ja: '相談・予約', en: 'Book' },
  },

  /** Strictly ≤ 3 poetic short lines across the entire site (Grok §6) */
  poetry: {
    opening: {
      ja: 'ひらいてみてください。',
      en: 'Let the petals unfold.',
    },
    landed: {
      ja: '花びらが、指先に。',
      en: 'Petals, resting on your fingertips.',
    },
    ordermadeAfterCard: {
      ja: 'もっと、あなただけの一枚を。',
      en: 'Or craft a one-of-a-kind set together.',
    },
    primaryAction: {
      ja: 'ネイルを選ぶ',
      en: 'Choose Nails',
    },
  },

  /** Exact 5 fingernail capsules in 1376×768 plate coordinates (verified against hands-qa/report.json) */
  fingerCalibrations: [
    {
      index: 0,
      id: 'pinky',
      label: { ja: '小指', en: 'Pinky' },
      cx: 702,
      cy: 248.5,
      rx: 20,
      ry: 31,
      angleDeg: 76,
    },
    {
      index: 1,
      id: 'ring',
      label: { ja: '薬指', en: 'Ring' },
      cx: 869.5,
      cy: 294.5,
      rx: 26,
      ry: 40,
      angleDeg: 84,
    },
    {
      index: 2,
      id: 'middle',
      label: { ja: '中指', en: 'Middle' },
      cx: 953.5,
      cy: 344,
      rx: 27,
      ry: 40,
      angleDeg: 88,
    },
    {
      index: 3,
      id: 'index',
      label: { ja: '人差し指', en: 'Index' },
      cx: 956,
      cy: 412.5,
      rx: 24,
      ry: 36,
      angleDeg: 94,
    },
    {
      index: 4,
      id: 'thumb',
      label: { ja: '親指', en: 'Thumb' },
      cx: 809,
      cy: 560,
      rx: 33,
      ry: 48,
      angleDeg: 56,
    },
  ] as FingerMaskCalibration[],

  menuCategories: {
    'one-color': {
      id: 'one-color',
      label: { ja: 'ワンカラー', en: 'One Color' },
      priceYen: 6500,
      durationMin: 75,
    },
    french: {
      id: 'french',
      label: { ja: 'フレンチ', en: 'French' },
      priceYen: 7500,
      durationMin: 90,
    },
    magnet: {
      id: 'magnet',
      label: { ja: 'マグネット', en: 'Magnet' },
      priceYen: 7800,
      durationMin: 90,
    },
    nuance: {
      id: 'nuance',
      label: { ja: 'ニュアンス', en: 'Nuance' },
      priceYen: 8500,
      durationMin: 105,
    },
    aurora: {
      id: 'aurora',
      label: { ja: 'オーロラ', en: 'Aurora' },
      priceYen: 7600,
      durationMin: 90,
    },
    parts: {
      id: 'parts',
      label: { ja: 'パーツ', en: 'Parts' },
      priceYen: 8200,
      durationMin: 100,
    },
    gradation: {
      id: 'gradation',
      label: { ja: 'グラデーション', en: 'Gradation' },
      priceYen: 7200,
      durationMin: 85,
    },
  } as Record<NailCategoryId, MenuCategoryMeta>,

  /** 12 Curated Preset Gel Designs (02 = plate default revealed from the ranunculus petals) */
  designs: [
    {
      id: '01',
      number: '01',
      name: { ja: 'ちゅるんミルクベージュ', en: 'Churun Milk Beige' },
      categoryId: 'one-color',
      liquidHex: '#EAE2DC',
      shimmerHex: '#FFFFFF',
      isSheer: true,
      opticalEffect: 'none',
      bottleWebp: '/media/v4/bottles/01.webp',
      bottlePng: '/media/v4/bottles/01.png',
      handWebBase: '/media/v4/web/hands/01',
    },
    {
      id: '02',
      number: '02',
      name: { ja: 'くすみピンク', en: 'Kusumi Rose Pink' },
      categoryId: 'one-color',
      liquidHex: '#B06F7B',
      shimmerHex: '#E8C5CA',
      isSheer: false,
      opticalEffect: 'none',
      bottleWebp: '/media/v4/bottles/02.webp',
      bottlePng: '/media/v4/bottles/02.png',
      handWebBase: '/media/v4/web/hands/02',
    },
    {
      id: '03',
      number: '03',
      name: { ja: 'マグネット ラベンダー', en: 'Magnet Lavender' },
      categoryId: 'magnet',
      liquidHex: '#9C8EB0',
      shimmerHex: '#EAE2FF',
      isSheer: false,
      opticalEffect: 'magnet',
      bottleWebp: '/media/v4/bottles/03.webp',
      bottlePng: '/media/v4/bottles/03.png',
      handWebBase: '/media/v4/web/hands/03',
    },
    {
      id: '04',
      number: '04',
      name: { ja: 'ミラーフレンチ', en: 'Mirror French' },
      categoryId: 'french',
      liquidHex: '#DEC7BA',
      shimmerHex: '#E8EDF2',
      isSheer: true,
      opticalEffect: 'mirror',
      bottleWebp: '/media/v4/bottles/04.webp',
      bottlePng: '/media/v4/bottles/04.png',
      handWebBase: '/media/v4/web/hands/04',
    },
    {
      id: '05',
      number: '05',
      name: { ja: '極細フレンチ', en: 'Micro White French' },
      categoryId: 'french',
      liquidHex: '#E8C6CA',
      shimmerHex: '#FFFFFF',
      isSheer: true,
      opticalEffect: 'none',
      bottleWebp: '/media/v4/bottles/05.webp',
      bottlePng: '/media/v4/bottles/05.png',
      handWebBase: '/media/v4/web/hands/05',
    },
    {
      id: '06',
      number: '06',
      name: { ja: 'ニュアンスマーブル', en: 'Nuance Marble' },
      categoryId: 'nuance',
      liquidHex: '#CBC0B7',
      shimmerHex: '#D8B77C',
      isSheer: true,
      opticalEffect: 'glitter',
      bottleWebp: '/media/v4/bottles/06.webp',
      bottlePng: '/media/v4/bottles/06.png',
      handWebBase: '/media/v4/web/hands/06',
    },
    {
      id: '07',
      number: '07',
      name: { ja: 'うる艶ボルドー', en: 'Glossy Bordeaux' },
      categoryId: 'one-color',
      liquidHex: '#5C1624',
      shimmerHex: '#B84B60',
      isSheer: false,
      opticalEffect: 'none',
      bottleWebp: '/media/v4/bottles/07.webp',
      bottlePng: '/media/v4/bottles/07.png',
      handWebBase: '/media/v4/web/hands/07',
    },
    {
      id: '08',
      number: '08',
      name: { ja: 'シアーグレージュ', en: 'Sheer Greige' },
      categoryId: 'one-color',
      liquidHex: '#9E948E',
      shimmerHex: '#DDD6D1',
      isSheer: true,
      opticalEffect: 'none',
      bottleWebp: '/media/v4/bottles/08.webp',
      bottlePng: '/media/v4/bottles/08.png',
      handWebBase: '/media/v4/web/hands/08',
    },
    {
      id: '09',
      number: '09',
      name: { ja: 'オーロラパール', en: 'Aurora Pearl' },
      categoryId: 'aurora',
      liquidHex: '#ECE6F0',
      shimmerHex: '#F3D6EA',
      isSheer: true,
      opticalEffect: 'pearl',
      bottleWebp: '/media/v4/bottles/09.webp',
      bottlePng: '/media/v4/bottles/09.png',
      handWebBase: '/media/v4/web/hands/09',
    },
    {
      id: '10',
      number: '10',
      name: { ja: 'パールパーツ', en: 'Pearl Accent' },
      categoryId: 'parts',
      liquidHex: '#EBC8CF',
      shimmerHex: '#FFF9F2',
      isSheer: true,
      opticalEffect: 'pearl',
      bottleWebp: '/media/v4/bottles/10.webp',
      bottlePng: '/media/v4/bottles/10.png',
      handWebBase: '/media/v4/web/hands/10',
    },
    {
      id: '11',
      number: '11',
      name: { ja: 'べっ甲アクセント', en: 'Tortoiseshell Accent' },
      categoryId: 'nuance',
      liquidHex: '#8E4E24',
      shimmerHex: '#DCB47A',
      isSheer: false,
      opticalEffect: 'none',
      bottleWebp: '/media/v4/bottles/11.webp',
      bottlePng: '/media/v4/bottles/11.png',
      handWebBase: '/media/v4/web/hands/11',
    },
    {
      id: '12',
      number: '12',
      name: { ja: 'ラメグラデーション', en: 'Champagne Glitter' },
      categoryId: 'gradation',
      liquidHex: '#DFC7B3',
      shimmerHex: '#EBC98E',
      isSheer: true,
      opticalEffect: 'glitter',
      bottleWebp: '/media/v4/bottles/12.webp',
      bottlePng: '/media/v4/bottles/12.png',
      handWebBase: '/media/v4/web/hands/12',
    },
  ] as NailDesignItem[],

  /** セルフデザイン (Mid-tier custom atelier experience) */
  selfDesign: {
    basePriceYen: 7000,
    baseDurationMin: 80,
    entryLabel: { ja: 'セルフデザイン', en: 'Self Design' },
    shapes: [
      { id: 'round' as SelfShapeId, label: { ja: 'ラウンド', en: 'Round' } },
      { id: 'oval' as SelfShapeId, label: { ja: 'オーバル', en: 'Oval' } },
      { id: 'square' as SelfShapeId, label: { ja: 'スクエアオフ', en: 'Square-off' } },
    ],
    lengths: [
      { id: 'short' as SelfLengthId, label: { ja: 'ショート', en: 'Short' }, priceDelta: 0 },
      { id: 'medium' as SelfLengthId, label: { ja: 'ミディアム', en: 'Medium' }, priceDelta: 300 },
      { id: 'long' as SelfLengthId, label: { ja: 'ロング', en: 'Long' }, priceDelta: 600 },
    ],
    /** 18 Curated Japanese Kusumi & Sheer Colors */
    colors: [
      { id: 'c01', name: { ja: '白磁ミルク', en: 'Porcelain Milk' }, poeticStem: { ja: '白磁の', en: 'Porcelain' }, hex: '#EFEAE5', sheer: true, toneGroup: 'pale' },
      { id: 'c02', name: { ja: '桜貝シアー', en: 'Shell Sakura' }, poeticStem: { ja: '桜貝の', en: 'Shell Blush' }, hex: '#F0D5D8', sheer: true, toneGroup: 'pale' },
      { id: 'c03', name: { ja: '霧ばら', en: 'Misty Rose' }, poeticStem: { ja: '霧ばらの', en: 'Misty Rose' }, hex: '#B97C86', sheer: false, toneGroup: 'rose' },
      { id: 'c04', name: { ja: '灰桜', en: 'Ash Cherry' }, poeticStem: { ja: '灰桜の', en: 'Ash Sakura' }, hex: '#CFA8AE', sheer: true, toneGroup: 'rose' },
      { id: 'c05', name: { ja: '薄紅ちゅるん', en: 'Sheer Crimson' }, poeticStem: { ja: '薄紅の', en: 'Petal Tint' }, hex: '#D9949E', sheer: true, toneGroup: 'rose' },
      { id: 'c06', name: { ja: '霞モーブ', en: 'Haze Mauve' }, poeticStem: { ja: '霞モーブの', en: 'Haze Mauve' }, hex: '#9E7B8C', sheer: false, toneGroup: 'rose' },
      { id: 'c07', name: { ja: '淡藤ラベンダー', en: 'Pale Wisteria' }, poeticStem: { ja: '淡藤の', en: 'Wisteria' }, hex: '#B8ACC9', sheer: true, toneGroup: 'pale' },
      { id: 'c08', name: { ja: '香木ベージュ', en: 'Incense Beige' }, poeticStem: { ja: '香木の', en: 'Warm Beige' }, hex: '#D8C2B2', sheer: true, toneGroup: 'neutral' },
      { id: 'c09', name: { ja: '砂色ヌード', en: 'Sand Nude' }, poeticStem: { ja: '砂色の', en: 'Sand Nude' }, hex: '#E3CFC2', sheer: true, toneGroup: 'pale' },
      { id: 'c10', name: { ja: '胡桃グレージュ', en: 'Walnut Greige' }, poeticStem: { ja: '胡桃の', en: 'Walnut Greige' }, hex: '#A79B93', sheer: true, toneGroup: 'neutral' },
      { id: 'c11', name: { ja: '焙じ茶シアー', en: 'Hojicha Taupe' }, poeticStem: { ja: '焙じ茶の', en: 'Hojicha' }, hex: '#8C776B', sheer: true, toneGroup: 'neutral' },
      { id: 'c12', name: { ja: '月白パール', en: 'Moon White' }, poeticStem: { ja: '月白の', en: 'Moon Pearl' }, hex: '#E8E9EE', sheer: true, toneGroup: 'pale' },
      { id: 'c13', name: { ja: '氷青シアー', en: 'Ice Celadon' }, poeticStem: { ja: '氷青の', en: 'Ice Mist' }, hex: '#CBD6D8', sheer: true, toneGroup: 'pale' },
      { id: 'c14', name: { ja: '熟柿テラコッタ', en: 'Persimmon Clay' }, poeticStem: { ja: '熟柿の', en: 'Persimmon' }, hex: '#AD5D47', sheer: false, toneGroup: 'deep' },
      { id: 'c15', name: { ja: '琥珀キャラメル', en: 'Amber Caramel' }, poeticStem: { ja: '琥珀の', en: 'Amber' }, hex: '#9E6438', sheer: true, toneGroup: 'deep' },
      { id: 'c16', name: { ja: '茜ボルドー', en: 'Madder Bordeaux' }, poeticStem: { ja: '茜色の', en: 'Bordeaux' }, hex: '#631B2B', sheer: false, toneGroup: 'deep' },
      { id: 'c17', name: { ja: '宵闇プラム', en: 'Evening Plum' }, poeticStem: { ja: '宵闇の', en: 'Deep Plum' }, hex: '#4D2638', sheer: false, toneGroup: 'deep' },
      { id: 'c18', name: { ja: '金砂シャンパン', en: 'Champagne Sand' }, poeticStem: { ja: '金砂の', en: 'Champagne' }, hex: '#D9C3A8', sheer: true, toneGroup: 'neutral' },
    ] as SelfColorOption[],
    techniques: [
      {
        id: 'onecolor',
        label: { ja: 'ワンカラー', en: 'One Color' },
        poeticSuffix: { ja: 'うる艶ワンカラー', en: 'Gloss Veil' },
        priceDelta: 0,
        durationDelta: 0,
        recommendedTones: ['pale', 'rose', 'neutral', 'deep'],
      },
      {
        id: 'french',
        label: { ja: 'フレンチ', en: 'French' },
        poeticSuffix: { ja: '細フレンチ', en: 'Fine French' },
        priceDelta: 600,
        durationDelta: 10,
        recommendedTones: ['pale', 'rose', 'neutral'],
      },
      {
        id: 'gradation',
        label: { ja: 'グラデーション', en: 'Gradation' },
        poeticSuffix: { ja: '霞グラデーション', en: 'Soft Ombre' },
        priceDelta: 500,
        durationDelta: 10,
        recommendedTones: ['pale', 'rose', 'neutral'],
      },
      {
        id: 'magnet',
        label: { ja: 'マグネット', en: 'Magnet' },
        poeticSuffix: { ja: '光帯マグネット', en: 'Velvet Magnet' },
        priceDelta: 800,
        durationDelta: 10,
        recommendedTones: ['rose', 'neutral', 'deep', 'pale'],
      },
      {
        id: 'nuance',
        label: { ja: 'ニュアンス', en: 'Nuance' },
        poeticSuffix: { ja: '箔ニュアンス', en: 'Foil Nuance' },
        priceDelta: 1000,
        durationDelta: 15,
        recommendedTones: ['pale', 'neutral', 'rose'],
      },
      {
        id: 'mirror',
        label: { ja: 'ミラー', en: 'Mirror' },
        poeticSuffix: { ja: '水鏡ミラー', en: 'Liquid Mirror' },
        priceDelta: 800,
        durationDelta: 10,
        recommendedTones: ['pale', 'neutral', 'rose'],
      },
    ] as SelfTechniqueOption[],
    accents: [
      {
        id: 'none',
        label: { ja: 'なし', en: 'None' },
        priceDelta: 0,
        durationDelta: 0,
        compatibleTechniques: ['onecolor', 'french', 'gradation', 'magnet', 'nuance', 'mirror'],
      },
      {
        id: 'pearl',
        label: { ja: 'パール', en: 'Pearl' },
        priceDelta: 500,
        durationDelta: 5,
        cutoutWebp: '/media/v4/self/accent-pearl.webp',
        compatibleTechniques: ['onecolor', 'french', 'gradation', 'magnet'],
      },
      {
        id: 'glitter',
        label: { ja: 'ラメ', en: 'Glitter' },
        priceDelta: 400,
        durationDelta: 5,
        cutoutWebp: '/media/v4/self/accent-glitter.webp',
        compatibleTechniques: ['onecolor', 'gradation', 'nuance'],
      },
      {
        id: 'stone',
        label: { ja: 'ストーン', en: 'Crystal' },
        priceDelta: 500,
        durationDelta: 5,
        cutoutWebp: '/media/v4/self/accent-stone.webp',
        compatibleTechniques: ['onecolor', 'french', 'gradation', 'magnet'],
      },
      {
        id: 'goldline',
        label: { ja: 'ゴールドライン', en: 'Gold Line' },
        priceDelta: 400,
        durationDelta: 5,
        cutoutWebp: '/media/v4/self/accent-goldline.webp',
        compatibleTechniques: ['onecolor', 'french', 'nuance', 'gradation'],
      },
    ] as SelfAccentOption[],
  },

  cardActions: {
    save: { ja: '保存', en: 'Save' },
    saved: { ja: '保存済', en: 'Saved' },
    share: { ja: 'シェア', en: 'Share' },
    copied: { ja: 'コピー済', en: 'Copied' },
    lineBook: { ja: 'LINE で予約', en: 'Book via LINE' },
    imageTag: { ja: 'イメージ', en: 'Image' },
  },
};

export function getDesignById(id: string): NailDesignItem {
  return SITE_CONFIG.designs.find((d) => d.id === id) || SITE_CONFIG.designs[1];
}

export function getDesignMeta(design: NailDesignItem): MenuCategoryMeta {
  return SITE_CONFIG.menuCategories[design.categoryId];
}

export function buildPresetCardSpec(design: NailDesignItem): ActiveCardSpec {
  const meta = getDesignMeta(design);
  return {
    mode: 'preset',
    codeNumber: `No.${design.number}`,
    title: design.name,
    subtitle: meta.label,
    priceYen: meta.priceYen,
    durationMin: meta.durationMin,
    swatchHex: design.liquidHex,
    presetId: design.id,
  };
}

export function buildSelfCardSpec(sel: SelfSelection): ActiveCardSpec {
  const color =
    SITE_CONFIG.selfDesign.colors.find((c) => c.id === sel.colorId) ||
    SITE_CONFIG.selfDesign.colors[2];
  const lengthOpt =
    SITE_CONFIG.selfDesign.lengths.find((l) => l.id === sel.length) ||
    SITE_CONFIG.selfDesign.lengths[0];
  const shapeOpt =
    SITE_CONFIG.selfDesign.shapes.find((s) => s.id === sel.shape) ||
    SITE_CONFIG.selfDesign.shapes[1];
  const techOpt =
    SITE_CONFIG.selfDesign.techniques.find((t) => t.id === sel.technique) ||
    SITE_CONFIG.selfDesign.techniques[0];
  const accOpt =
    SITE_CONFIG.selfDesign.accents.find((a) => a.id === sel.accent) ||
    SITE_CONFIG.selfDesign.accents[0];

  const rawPrice =
    SITE_CONFIG.selfDesign.basePriceYen +
    lengthOpt.priceDelta +
    techOpt.priceDelta +
    accOpt.priceDelta;
  const priceYen = Math.min(9000, Math.max(6000, rawPrice));
  const durationMin =
    SITE_CONFIG.selfDesign.baseDurationMin + techOpt.durationDelta + accOpt.durationDelta;

  const hashNum =
    ((color.id.charCodeAt(2) * 17 +
      sel.shape.charCodeAt(0) * 7 +
      sel.technique.charCodeAt(0) * 11 +
      sel.accent.charCodeAt(0) * 5) %
      89) +
    10;

  const accSuffixJa = accOpt.id === 'none' ? '' : ` · ${accOpt.label.ja}`;
  const accSuffixEn = accOpt.id === 'none' ? '' : ` · ${accOpt.label.en}`;

  return {
    mode: 'self',
    codeNumber: `No.S-${hashNum}`,
    title: {
      ja: `${color.poeticStem.ja}${techOpt.poeticSuffix.ja}`,
      en: `${color.poeticStem.en} ${techOpt.poeticSuffix.en}`,
    },
    subtitle: {
      ja: `${shapeOpt.label.ja} · ${lengthOpt.label.ja}${accSuffixJa}`,
      en: `${shapeOpt.label.en} · ${lengthOpt.label.en}${accSuffixEn}`,
    },
    priceYen,
    durationMin,
    swatchHex: color.hex,
    selfSelection: sel,
  };
}
