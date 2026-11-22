import {
  CareMenuItem,
  CounselingShapeId,
  FingerMaskCalibration,
  Lang,
  LocalizedText,
  MenuCategoryMeta,
  NailCategoryId,
  NailDesignItem,
} from './types/nail';

export type { Lang, LocalizedText };

export const SITE_CONFIG = {
  brandName: 'soū nail atelier',
  brandShort: 'soū',
  artistName: 'Fang',
  city: {
    ja: '東京都目黒区青葉台',
    en: 'Aobadai, Meguro-ku, Tokyo',
  },

  /** Single currency across the entire site — JPY only */
  currencyCode: 'JPY',
  currencySymbol: '¥',
  priceRangeLabel: '¥6,000–¥9,000',

  /** Japanese luxury beauty palette (v3) */
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
    heroBudStatic: '/media/hero-bud-static.webp',
    heroBudStaticMobile: '/media/hero-bud-static-880.webp',
    handBase: '/media/hands/base.webp',
    handBaseMobile: '/media/hands/base-800.webp',
    handWidth: 1200,
    handHeight: 896,
    salonHands: '/media/salon/hands.webp',
    salonHandsMobile: '/media/salon/hands-720.webp',
    salonSpace: '/media/salon/space.webp',
    salonSpaceMobile: '/media/salon/space-720.webp',
    ogImage: '/media/og-card.jpg',
  },

  /** Placeholder Tokyo salon contact details — edit here before launch */
  contact: {
    lineOfficialId: '@sou.aobadai',
    instagramHandle: 'sou.nail.tokyo',
    address: {
      ja: '東京都目黒区青葉台 1-18-7 2F',
      en: '1-18-7-2F Aobadai, Meguro-ku, Tokyo',
    },
    stationNote: {
      ja: '東急東横線 中目黒駅より徒歩 7 分',
      en: '7 min walk from Nakameguro Sta.',
    },
    postalCode: '153-0042',
    mapsUrl: 'https://maps.google.com/?q=Aobadai+Meguro-ku+Tokyo',
    hours: {
      ja: '火–土 10:00–19:00（日・月定休）',
      en: 'Tue–Sat 10:00–19:00 (Closed Sun & Mon)',
    },
    openingHoursSchema: 'Tu-Sa 10:00-19:00',
  },

  /** Top bar — strictly 4 entries matching spec verbatim */
  nav: {
    vanity: { ja: 'ネイルを選ぶ', en: 'Try On' },
    designs: { ja: 'デザイン', en: 'Designs' },
    salon: { ja: 'サロン', en: 'Salon' },
    counseling: { ja: '相談・予約', en: 'Consult' },
  },

  /** Hero copy — verbatim Japanese per UI specification */
  hero: {
    guide: {
      ja: 'ひらいてみてください。',
      en: 'Gently open the petals.',
    },
    revealedHeadline: {
      ja: '花びらが、指先に。',
      en: 'Petals, resting on your fingertips.',
    },
    primaryCta: { ja: 'ネイルを選ぶ', en: 'Choose Nails' },
    secondaryCta: { ja: '相談する', en: 'Consult' },
    replay: { ja: 'もう一度', en: 'Replay' },
    defaultRevealDesignId: '01',
  },

  /** Verified sub-pixel nail masks for /media/hands/base.webp (1200 × 896) — tweakable via ?calibrate */
  fingerCalibrations: [
    {
      index: 0,
      id: 'pinky',
      label: { ja: '小指', en: 'Pinky' },
      cx: 601,
      cy: 266,
      rx: 16,
      ry: 31,
      angleDeg: 51,
      featherPx: 5.5,
    },
    {
      index: 1,
      id: 'ring',
      label: { ja: '薬指', en: 'Ring' },
      cx: 735,
      cy: 261,
      rx: 21,
      ry: 38,
      angleDeg: 47,
      featherPx: 6,
    },
    {
      index: 2,
      id: 'middle',
      label: { ja: '中指', en: 'Middle' },
      cx: 817,
      cy: 280,
      rx: 23,
      ry: 39,
      angleDeg: 47,
      featherPx: 6,
    },
    {
      index: 3,
      id: 'index',
      label: { ja: '人差し指', en: 'Index' },
      cx: 840,
      cy: 371,
      rx: 21,
      ry: 40,
      angleDeg: 52,
      featherPx: 6,
    },
    {
      index: 4,
      id: 'thumb',
      label: { ja: '親指', en: 'Thumb' },
      cx: 745,
      cy: 598,
      rx: 24,
      ry: 39,
      angleDeg: 61,
      featherPx: 6.5,
    },
  ] as FingerMaskCalibration[],

  /** Menu categories & ¥6,000–¥9,000 pricing (single source of truth) */
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

  /** Additional care / off items shown inside 「一覧で見る」 & SEO HTML */
  careMenu: [
    {
      id: 'care-clear',
      categoryLabel: { ja: 'ケア', en: 'Care' },
      name: { ja: '自爪ケア＆クリアジェル', en: 'Cuticle Care & Clear Gel' },
      priceYen: 6000,
      durationMin: 60,
    },
    {
      id: 'care-fill',
      categoryLabel: { ja: 'ケア・オフ', en: 'Care & Off' },
      name: { ja: 'フィルイン付替（自店オフ）', en: 'In-salon Fill-in Removal' },
      priceYen: 0,
      durationMin: 20,
    },
    {
      id: 'care-sculpt',
      categoryLabel: { ja: '長さ出し', en: 'Extension' },
      name: { ja: 'ジェルスカルプ長さ出し（10本）', en: 'Gel Extension (Full Set)' },
      priceYen: 9000,
      durationMin: 120,
    },
  ] as CareMenuItem[],

  /** 12 Curated Salon Gel Designs — shared 1-to-1 across Vanity Tray & 3D チップ見本 */
  designs: [
    {
      id: '01',
      number: '01',
      name: { ja: 'ちゅるんミルクベージュ', en: 'Churun Milk Beige' },
      categoryId: 'one-color',
      shape: 'short-round',
      liquidHex: '#EAD8C8',
      shimmerHex: '#FFF8F2',
      isSheer: true,
      capFinish: 'champagne-gold',
      opticalEffect: 'none',
      handImage: '/media/hands/01.webp',
      tipImage: '/media/tips/01-uv.webp',
      note: {
        ja: '肌になじむ透け感と、みずみずしい艶。',
        en: 'Sheer milky warmth with plump liquid shine.',
      },
    },
    {
      id: '02',
      number: '02',
      name: { ja: 'くすみピンク', en: 'Dusty Rose Pink' },
      categoryId: 'one-color',
      shape: 'short-oval',
      liquidHex: '#B67B84',
      shimmerHex: '#E8C5CA',
      isSheer: false,
      capFinish: 'champagne-gold',
      opticalEffect: 'none',
      handImage: '/media/hands/02.webp',
      tipImage: '/media/tips/02-uv.webp',
      note: {
        ja: '甘さを抑えた大人のローズトーン。',
        en: 'Muted dusty rose with refined creaminess.',
      },
    },
    {
      id: '03',
      number: '03',
      name: { ja: 'マグネット ラベンダー', en: 'Magnet Lavender' },
      categoryId: 'magnet',
      shape: 'medium-oval',
      liquidHex: '#9C8EA8',
      shimmerHex: '#E5DCFA',
      isSheer: false,
      capFinish: 'champagne-gold',
      opticalEffect: 'magnet',
      handImage: '/media/hands/03.webp',
      tipImage: '/media/tips/03-uv.webp',
      note: {
        ja: '傾けるたび光の帯がゆらぐベルベット艶。',
        en: 'Silky diagonal lavender cat-eye light band.',
      },
    },
    {
      id: '04',
      number: '04',
      name: { ja: 'ミラーフレンチ', en: 'Mirror French' },
      categoryId: 'french',
      shape: 'short-square-off',
      liquidHex: '#E4CEC4',
      shimmerHex: '#E2E6EC',
      isSheer: true,
      capFinish: 'champagne-gold',
      opticalEffect: 'mirror',
      handImage: '/media/hands/04.webp',
      tipImage: '/media/tips/04-uv.webp',
      note: {
        ja: '素肌ベースに繊細なシルバーミラーの縁取り。',
        en: 'Sheer nude base with slender silver chrome tips.',
      },
    },
    {
      id: '05',
      number: '05',
      name: { ja: '極細フレンチ', en: 'Micro French' },
      categoryId: 'french',
      shape: 'short-round',
      liquidHex: '#ECCED0',
      shimmerHex: '#FFFFFF',
      isSheer: true,
      capFinish: 'champagne-gold',
      opticalEffect: 'none',
      handImage: '/media/hands/05.webp',
      tipImage: '/media/tips/05-uv.webp',
      note: {
        ja: '指先をすっきり整える、極細の白ライン。',
        en: 'Hairline white edge over sheer rosy pink.',
      },
    },
    {
      id: '06',
      number: '06',
      name: { ja: 'ニュアンスマーブル', en: 'Nuance Marble' },
      categoryId: 'nuance',
      shape: 'medium-oval',
      liquidHex: '#CFC4BC',
      shimmerHex: '#D8B77C',
      isSheer: true,
      capFinish: 'champagne-gold',
      opticalEffect: 'none',
      handImage: '/media/hands/06.webp',
      tipImage: '/media/tips/06-uv.webp',
      note: {
        ja: '乳白とグレージュの奥に、わずかな金箔。',
        en: 'Misty greige marble with delicate encased gold foil.',
      },
    },
    {
      id: '07',
      number: '07',
      name: { ja: 'うる艶ボルドー', en: 'Glossy Bordeaux' },
      categoryId: 'one-color',
      shape: 'medium-round',
      liquidHex: '#631727',
      shimmerHex: '#C25268',
      isSheer: false,
      capFinish: 'deep-bordeaux',
      opticalEffect: 'none',
      handImage: '/media/hands/07.webp',
      tipImage: '/media/tips/07-uv.webp',
      note: {
        ja: '深みと透け感を重ねた、果実のような艶。',
        en: 'Translucent cherry-bordeaux with glass-like depth.',
      },
    },
    {
      id: '08',
      number: '08',
      name: { ja: 'シアーグレージュ', en: 'Sheer Greige' },
      categoryId: 'one-color',
      shape: 'short-oval',
      liquidHex: '#B8ACA6',
      shimmerHex: '#E5DDD8',
      isSheer: true,
      capFinish: 'champagne-gold',
      opticalEffect: 'none',
      handImage: '/media/hands/08.webp',
      tipImage: '/media/tips/08-uv.webp',
      note: {
        ja: '手元を静かに引き立てる透明グレージュ。',
        en: 'Quiet watery taupe-greige with airy translucency.',
      },
    },
    {
      id: '09',
      number: '09',
      name: { ja: 'オーロラパール', en: 'Aurora Pearl' },
      categoryId: 'aurora',
      shape: 'short-oval',
      liquidHex: '#EFEAF2',
      shimmerHex: '#F3D6EA',
      isSheer: true,
      capFinish: 'rose-gold',
      opticalEffect: 'pearl',
      handImage: '/media/hands/09.webp',
      tipImage: '/media/tips/09-uv.webp',
      note: {
        ja: '白のベールにピンクと淡青のオーロラ光。',
        en: 'Opalescent pink-to-ice-blue pearl veil.',
      },
    },
    {
      id: '10',
      number: '10',
      name: { ja: 'パールパーツ', en: 'Pearl Accent' },
      categoryId: 'parts',
      shape: 'short-oval',
      liquidHex: '#F0CFD6',
      shimmerHex: '#FFF8F0',
      isSheer: true,
      capFinish: 'rose-gold',
      opticalEffect: 'pearl',
      handImage: '/media/hands/10.webp',
      tipImage: '/media/tips/10-uv.webp',
      note: {
        ja: 'シアーピンクに、薬指だけ小さな真珠の粒。',
        en: 'Sheer pink with miniature pearls on the ring finger only.',
      },
    },
    {
      id: '11',
      number: '11',
      name: { ja: 'べっ甲アクセント', en: 'Tortoiseshell Accent' },
      categoryId: 'nuance',
      shape: 'short-square-off',
      liquidHex: '#9A5B2C',
      shimmerHex: '#DFB67E',
      isSheer: false,
      capFinish: 'champagne-gold',
      opticalEffect: 'none',
      handImage: '/media/hands/11.webp',
      tipImage: '/media/tips/11-uv.webp',
      note: {
        ja: '琥珀のべっ甲を二本だけ。極細の金線を添えて。',
        en: 'Amber tortoiseshell on two accent nails with fine gold line.',
      },
    },
    {
      id: '12',
      number: '12',
      name: { ja: 'ラメグラデーション', en: 'Glitter Gradation' },
      categoryId: 'gradation',
      shape: 'short-almond',
      liquidHex: '#E5CFC0',
      shimmerHex: '#E9C992',
      isSheer: true,
      capFinish: 'champagne-gold',
      opticalEffect: 'glitter',
      handImage: '/media/hands/12.webp',
      tipImage: '/media/tips/12-uv.webp',
      note: {
        ja: '先端にシャンパンの微粒子を淡く溶かして。',
        en: 'Fine champagne-gold micro-shimmer melting from the tip.',
      },
    },
  ] as NailDesignItem[],

  /** Vanity (Section 02) UI copy — exact 3 corner links per spec */
  vanityUI: {
    eyebrow: { ja: '02 — 指先の化粧台', en: '02 — Fingertip Vanity' },
    dragCue: { ja: 'トレイを回す', en: 'Turn the tray' },
    imageCaption: { ja: 'イメージ', en: 'Image' },
    consultThis: { ja: 'このネイルで相談', en: 'Consult this look' },
    saveImage: { ja: '画像を保存', en: 'Save image' },
    savedNotice: { ja: '保存しました', en: 'Saved' },
    viewDetail: { ja: '詳しく見る', en: 'View detail' },
    shimmerCue: { ja: '指先を動かすと光がゆらぎます', en: 'Move over nails to shift the light' },
  },

  /** Tip Sample Book (Section 03) UI copy */
  tipsUI: {
    eyebrow: { ja: '03 — チップ見本', en: '03 — Gel Tip Archive' },
    heading: { ja: '指先に、季節をひとつ。', en: 'Twelve Salon Gel Tips' },
    allLabel: { ja: 'すべて', en: 'All' },
    dragCue: { ja: 'チップを回して選ぶ', en: 'Rotate to browse' },
    consultDesign: { ja: 'このデザインで相談', en: 'Consult this design' },
    tryOnVanity: { ja: '化粧台で試す', en: 'Try on vanity' },
    viewMenuList: { ja: '一覧で見る', en: 'Full menu list' },
    closeMenuList: { ja: '閉じる', en: 'Close list' },
    durationPrefix: { ja: '目安時間', en: 'Est. time' },
    pricePrefix: { ja: '料金', en: 'Price' },
    imageCaption: { ja: 'イメージ', en: 'Image' },
    priceDisclaimer: {
      ja: '※ 表示価格は税込・目安です。お爪の状態に合わせてカウンセリング時にご案内します。',
      en: '* Tax included. Final price is confirmed gently during counseling.',
    },
  },

  /** Artist & Salon (Section 04) — quiet, airy, hands-only, brief first-person */
  salon: {
    eyebrow: { ja: '04 — サロンについて', en: '04 — About the Atelier' },
    heading: { ja: '静かな光の中で、丁寧なジェルを。', en: 'Quiet daylight, considered gel craft.' },
    story: {
      ja: '目黒区青葉台の小さな一室で、お一人ずつ向き合うプライベートサロンを開いています。伸びても美しく、自爪に負担をかけないベースづくりと、光の透け方を大切にしたジェルが得意です。',
      en: 'Inside a quiet room in Aobadai, Meguro, I welcome one guest at a time. My focus is gentle base structure that grows out gracefully and translucent gel finishes calibrated to natural light.',
    },
    credentials: [
      { ja: 'JNEC ネイリスト技能検定 1級', en: 'JNEC Nailist Certification Level 1' },
      { ja: 'JNA ジェルネイル技能検定 上級', en: 'JNA Gel Nail Certification Advanced' },
      { ja: '完全予約制 · 一対一 · 器具滅菌管理', en: 'Private Appointment · 1-on-1 · Sterilized Tools' },
    ],
  },

  /** Counseling Card (Section 05) — tactile cream paper stationery */
  counselingUI: {
    eyebrow: { ja: '05 — カウンセリングカード', en: '05 — Counseling Card' },
    reassurance: {
      ja: '迷ったら、まず相談だけでも。',
      en: 'Even if you are undecided, feel free to just ask.',
    },
    consultUndecided: {
      ja: '相談して決めたい',
      en: 'Decide together',
    },
    next: { ja: '次へ', en: 'Next' },
    prev: { ja: '戻る', en: 'Back' },
    steps: [
      {
        num: '01',
        question: { ja: '気になっているデザインはありますか？', en: 'Which look caught your eye?' },
      },
      {
        num: '02',
        question: { ja: 'ご希望の形と長さを教えてください。', en: 'Preferred shape and length?' },
      },
      {
        num: '03',
        question: { ja: 'お爪のお悩みはありますか？', en: 'Any concerns with your natural nails?' },
      },
      {
        num: '04',
        question: { ja: '普段の過ごし方に近いものは？', en: 'How do you use your fingertips day-to-day?' },
      },
      {
        num: '05',
        question: { ja: 'ご希望のお日にちはありますか？', en: 'Do you have a preferred date?' },
      },
      {
        num: '06',
        question: { ja: 'お名前とご連絡先を教えてください。', en: 'Your name & preferred contact?' },
      },
    ],
    shapes: [
      { id: 'round' as CounselingShapeId, label: { ja: 'ラウンド', en: 'Round' } },
      { id: 'oval' as CounselingShapeId, label: { ja: 'オーバル', en: 'Oval' } },
      { id: 'square-off' as CounselingShapeId, label: { ja: 'スクエアオフ', en: 'Square-off' } },
      { id: 'short-almond' as CounselingShapeId, label: { ja: 'アーモンド', en: 'Short Almond' } },
      { id: 'point-soft' as CounselingShapeId, label: { ja: 'ソフトポイント', en: 'Soft Taper' } },
    ],
    lengthLabels: [
      { ja: '自爪そのまま（0mm）', en: 'Natural (0 mm)' },
      { ja: 'ショート（+1mm）', en: 'Short (+1 mm)' },
      { ja: 'ショート〜ミディアム（+2mm）', en: 'Short–Medium (+2 mm)' },
      { ja: 'ミディアム（+3mm）', en: 'Medium (+3 mm)' },
    ],
    concerns: [
      { id: 'thin', label: { ja: '薄い', en: 'Thin' } },
      { id: 'brittle', label: { ja: '割れやすい', en: 'Splits easily' } },
      { id: 'peeling', label: { ja: '二枚爪', en: 'Peeling' } },
      { id: 'short', label: { ja: '自爪が短い', en: 'Short nail bed' } },
      { id: 'none', label: { ja: '特になし', en: 'None' } },
    ],
    lifestyles: [
      { id: 'office', label: { ja: 'オフィス向け', en: 'Office-friendly' } },
      { id: 'active', label: { ja: '指先をよく使う', en: 'Active hands' } },
      { id: 'none', label: { ja: '特になし', en: 'No restrictions' } },
    ],
    dateUndecided: { ja: '未定（相談して決める）', en: 'Undecided' },
    namePlaceholder: { ja: 'お名前（ニックネーム可）', en: 'Your name or nickname' },
    notePlaceholder: {
      ja: 'オフの有無や気になることなど（任意）',
      en: 'Removal needed or any notes (optional)',
    },
    channelLine: { ja: 'LINE で相談を送る', en: 'Send inquiry via LINE' },
    channelInstagram: { ja: 'Instagram DM で送る', en: 'Send via Instagram DM' },
    copyMessage: { ja: 'メッセージをコピー', en: 'Copy message' },
    copied: { ja: 'コピーしました', en: 'Copied' },
    igCopiedNotice: {
      ja: 'メッセージをコピーしました。Instagram DM に貼り付けてお送りください。',
      en: 'Message copied — paste and send in Instagram DM.',
    },
    sendDisclaimer: {
      ja: '※ この送信で予約確定にはなりません。ネイリストより折り返し空き状況をご案内します。',
      en: '* Sending this card does not finalize a booking. The artist will reply with availability.',
    },
  },

  /** Placeholder FAQ items (also emitted as JSON-LD FAQPage) */
  faqs: [
    {
      q: { ja: 'オフ料金はかかりますか？', en: 'Is gel removal charged separately?' },
      a: {
        ja: '自店ジェルの付替オフ（フィルイン）は無料でご案内しております。他店オフは +¥1,000 目安となります。',
        en: 'In-salon fill-in removal is complimentary. Removal from another salon is approx. +¥1,000.',
      },
    },
    {
      q: { ja: 'どのくらい持ちますか？', en: 'How long does the gel manicure last?' },
      a: {
        ja: 'お爪の状態や生活環境によりますが、目安として 3〜4 週間ほど美しい艶をお楽しみいただけます。',
        en: 'Typically 3 to 4 weeks depending on nail condition and daily routine.',
      },
    },
    {
      q: { ja: '予約の変更・キャンセルについて', en: 'Rescheduling & cancellation' },
      a: {
        ja: '前日の 18:00 までに LINE または Instagram DM にてご連絡ください。',
        en: 'Please message via LINE or Instagram DM by 18:00 the day prior.',
      },
    },
    {
      q: { ja: 'お支払い方法', en: 'Payment methods' },
      a: {
        ja: '現金・クレジットカード・各種交通系 IC / QR 決済に対応しております。',
        en: 'Cash, major credit cards, and IC / QR payments accepted.',
      },
    },
  ],

  footer: {
    openMaps: { ja: 'Google Maps ↗', en: 'Google Maps ↗' },
    faqHeading: { ja: 'よくあるご質問', en: 'FAQ' },
  },
};

export function getDesignById(id: string): NailDesignItem {
  return SITE_CONFIG.designs.find((d) => d.id === id) || SITE_CONFIG.designs[0];
}

export function getDesignMeta(design: NailDesignItem) {
  return SITE_CONFIG.menuCategories[design.categoryId];
}
