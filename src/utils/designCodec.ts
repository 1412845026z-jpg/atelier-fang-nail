import { SITE_CONFIG } from '../config';
import {
  DesignEstimate,
  FingerDesign,
  Lang,
  LinePattern,
  NailArtType,
  NailDesignState,
  NailFinish,
  NailLength,
  NailShape,
} from '../types/nail';

const SHAPES: NailShape[] = [
  'square',
  'squoval',
  'round',
  'oval',
  'almond',
  'ballerina',
  'stiletto',
];
const LENGTHS: NailLength[] = ['S', 'M', 'L'];
const FINISHES: NailFinish[] = ['gloss', 'matte', 'sheer', 'pearl', 'chrome', 'magnet'];
const ARTS: NailArtType[] = ['none', 'french', 'line', 'pearl', 'stud'];
const LINES: LinePattern[] = ['arc', 'twin', 'botanical', 'cross'];

function toBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(b64: string): string {
  const normalized = b64.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const bin = atob(normalized + pad);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Compact URL codec for ?d=<base64url>
 * Encodes shape, length, optional presetId, and 5 finger tuples cleanly.
 */
export function encodeDesignToQuery(design: NailDesignState): string {
  const paletteIds = SITE_CONFIG.palette.map((c) => c.id);
  const packFinger = (f: FingerDesign) => [
    Math.max(0, paletteIds.indexOf(f.colorId)),
    Math.max(0, FINISHES.indexOf(f.finish)),
    Math.max(0, ARTS.indexOf(f.art)),
    Math.max(0, paletteIds.indexOf(f.frenchColorId)),
    Math.round(f.frenchWidth * 100),
    Math.round(f.frenchCurve * 100),
    Math.max(0, LINES.indexOf(f.linePattern)),
    f.accentCount,
  ];

  // Check if all 5 fingers are identical -> store single tuple to keep URL tiny
  const packed = design.fingers.map(packFinger);
  const allSame = packed.every((p) => JSON.stringify(p) === JSON.stringify(packed[0]));

  const payload: Record<string, unknown> = {
    s: Math.max(0, SHAPES.indexOf(design.shape)),
    l: Math.max(0, LENGTHS.indexOf(design.length)),
    f: allSame ? [packed[0]] : packed,
  };
  if (design.presetId) payload.p = design.presetId;

  return toBase64Url(JSON.stringify(payload));
}

export function decodeDesignFromQuery(encoded: string): NailDesignState | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as {
      s?: number;
      l?: number;
      p?: string;
      f?: number[][];
    };
    const paletteIds = SITE_CONFIG.palette.map((c) => c.id);
    const shape = SHAPES[raw.s ?? 4] || 'almond';
    const length = LENGTHS[raw.l ?? 1] || 'M';
    const rawFingers = Array.isArray(raw.f) ? raw.f : [];
    if (rawFingers.length === 0) return null;

    const unpack = (tuple: number[]): FingerDesign => ({
      colorId: paletteIds[tuple[0] ?? 0] || paletteIds[0],
      finish: FINISHES[tuple[1] ?? 0] || 'gloss',
      art: ARTS[tuple[2] ?? 0] || 'none',
      frenchColorId: paletteIds[tuple[3] ?? 3] || paletteIds[3],
      frenchWidth: Math.max(0.08, Math.min(0.32, (tuple[4] ?? 13) / 100)),
      frenchCurve: Math.max(0.15, Math.min(0.85, (tuple[5] ?? 48) / 100)),
      linePattern: LINES[tuple[6] ?? 0] || 'arc',
      accentCount: ([1, 2, 3].includes(tuple[7]) ? tuple[7] : 1) as 1 | 2 | 3,
    });

    const fingersList =
      rawFingers.length === 1
        ? Array.from({ length: 5 }, () => unpack(rawFingers[0]))
        : Array.from({ length: 5 }, (_, i) => unpack(rawFingers[i] || rawFingers[0]));

    return {
      shape,
      length,
      fingers: fingersList as NailDesignState['fingers'],
      presetId: typeof raw.p === 'string' ? raw.p : undefined,
    };
  } catch {
    return null;
  }
}

export function buildShareableDesignUrl(design: NailDesignState): string {
  const encoded = encodeDesignToQuery(design);
  if (typeof window === 'undefined') return `?d=${encoded}#tryon`;
  const url = new URL(window.location.href);
  url.searchParams.delete('calibrate');
  url.searchParams.set('d', encoded);
  url.hash = 'tryon';
  return url.toString();
}

export function formatYen(amount: number): string {
  return `${SITE_CONFIG.currencySymbol}${amount.toLocaleString('en-US')}`;
}

export function estimateDesign(design: NailDesignState): DesignEstimate {
  const rules = SITE_CONFIG.pricingRules;
  const presetWork = design.presetId
    ? SITE_CONFIG.works.find((w) => w.id === design.presetId)
    : undefined;

  // Count art & special finishes across the 5 fingers (scaled to 10-finger studio service)
  const frenchCount = design.fingers.filter((f) => f.art === 'french').length;
  const otherArtCount = design.fingers.filter(
    (f) => f.art === 'line' || f.art === 'pearl' || f.art === 'stud'
  ).length;
  const artFingerCount = frenchCount + otherArtCount;
  const hasSpecialFinish = design.fingers.some(
    (f) => f.finish === 'magnet' || f.finish === 'chrome' || f.finish === 'pearl'
  );
  const allSheerPlain =
    artFingerCount === 0 &&
    design.length === 'S' &&
    design.fingers.every(
      (f) => f.finish === 'sheer' && (f.colorId === 'nyuhaku' || f.colorId === 'suhada-rose')
    );

  // Base menu & pricing stays thoughtfully distributed in ¥6,000–¥9,000 band
  let yen = allSheerPlain ? rules.clearCareBaseYen : rules.oneColorBaseYen;
  let minutes = allSheerPlain ? 75 : 90;

  if (design.length === 'M') {
    yen += rules.lengthAddYen.M;
    minutes += 10;
  } else if (design.length === 'L') {
    yen += rules.lengthAddYen.L;
    minutes += 30;
  }

  if (hasSpecialFinish) {
    yen += rules.specialFinishAddYen;
    minutes += 10;
  }

  if (frenchCount >= 4) {
    yen += rules.fullFrenchAddYen;
    minutes += 15;
  } else if (frenchCount > 0) {
    yen += frenchCount * rules.perArtFingerYen;
    minutes += frenchCount * 5;
  }

  if (otherArtCount > 0) {
    yen += Math.min(rules.maxArtAddYen, otherArtCount * rules.perArtFingerYen);
    minutes += Math.min(30, otherArtCount * 6);
  }

  // Clamp cleanly into refined salon tier (¥6,000–¥9,500)
  yen = Math.min(9500, Math.max(6000, Math.round(yen / 100) * 100));

  // Map to corresponding config.services item
  let serviceId = 'srv-02'; // ワンカラー
  let menuJa = 'ワンカラー';
  let menuEn = 'One Color Gel';

  if (design.length === 'L') {
    serviceId = 'srv-04';
    menuJa = artFingerCount > 0 ? `スカルプ長さ出し + アート${artFingerCount}本` : 'スカルプ長さ出し';
    menuEn = artFingerCount > 0 ? `Extension + ${artFingerCount} Art` : 'Sculpted Extension';
  } else if (allSheerPlain) {
    serviceId = 'srv-01';
    menuJa = '素爪ケア＆クリア';
    menuEn = 'Sheer Care & Clear';
  } else if (artFingerCount >= 3 || frenchCount >= 4) {
    serviceId = 'srv-03';
    menuJa = frenchCount >= 4 ? 'マイクロフレンチ・アート' : 'ニュアンス・手描きアート';
    menuEn = frenchCount >= 4 ? 'Micro French & Art' : 'Nuance & Hand-Painted';
  } else if (artFingerCount > 0) {
    serviceId = 'srv-03';
    menuJa = `ワンカラー + アート${artFingerCount}本`;
    menuEn = `One Color + ${artFingerCount} Accent`;
  } else if (hasSpecialFinish) {
    serviceId = 'srv-02';
    menuJa = 'ワンカラー（マグネット / パール）';
    menuEn = 'One Color (Special Finish)';
  }

  // Primary finger summary (most common color/finish, plus accent finger callout)
  const mainFinger = design.fingers[2]; // middle finger represents set anchor
  const swatch =
    SITE_CONFIG.palette.find((c) => c.id === mainFinger.colorId) || SITE_CONFIG.palette[0];
  const shapeInfo = SITE_CONFIG.shapes.find((s) => s.id === design.shape) || SITE_CONFIG.shapes[4];
  const finishInfo =
    SITE_CONFIG.finishes.find((f) => f.id === mainFinger.finish) || SITE_CONFIG.finishes[0];

  // Detect single-finger accent differing from middle finger
  const accentsJa: string[] = [];
  const accentsEn: string[] = [];
  design.fingers.forEach((f, idx) => {
    const fingerCal = SITE_CONFIG.fingerCalibrations[idx];
    const diffArt = f.art !== mainFinger.art && f.art !== 'none';
    const diffColor = f.colorId !== mainFinger.colorId;
    if (diffArt || diffColor) {
      const artInfo = SITE_CONFIG.artTypes.find((a) => a.id === f.art);
      const colInfo = SITE_CONFIG.palette.find((c) => c.id === f.colorId);
      const partJa = diffArt && artInfo ? artInfo.label.ja : colInfo?.name.ja || '';
      const partEn = diffArt && artInfo ? artInfo.label.en : colInfo?.name.en || '';
      accentsJa.push(`${fingerCal.label.ja}：${partJa}`);
      accentsEn.push(`${fingerCal.label.en}: ${partEn}`);
    }
  });

  const baseTitleJa = presetWork
    ? presetWork.title.ja
    : mainFinger.art === 'french'
      ? `${swatch.name.ja}フレンチ`
      : swatch.name.ja;
  const baseTitleEn = presetWork
    ? presetWork.title.en
    : mainFinger.art === 'french'
      ? `${swatch.name.en} French`
      : swatch.name.en;

  const accentSuffixJa = accentsJa.length > 0 ? `（${accentsJa.slice(0, 2).join('・')}）` : '';
  const accentSuffixEn = accentsEn.length > 0 ? ` (${accentsEn.slice(0, 2).join(', ')})` : '';

  const summaryJa = `${baseTitleJa}・${shapeInfo.label.ja}・${design.length}・${finishInfo.label.ja}${accentSuffixJa}`;
  const summaryEn = `${baseTitleEn} · ${shapeInfo.label.en} · ${design.length} · ${finishInfo.label.en}${accentSuffixEn}`;

  const specimenCode = presetWork ? `No.${presetWork.index}` : swatch.code;

  return {
    serviceId,
    menuName: { ja: menuJa, en: menuEn },
    summaryText: { ja: summaryJa, en: summaryEn },
    estimatedMinutes: minutes,
    estimatedYen: yen,
    artFingerCount,
    specimenCode,
  };
}

export function buildReservationMessage(params: {
  lang: Lang;
  mode: 'book' | 'consult';
  menuLabel: string;
  design?: NailDesignState | null;
  designUrl?: string;
  dateLabel?: string;
  timeLabel?: string;
  guestName?: string;
  guestPhone?: string;
  guestNote?: string;
}): string {
  const {
    lang,
    mode,
    menuLabel,
    design,
    designUrl,
    dateLabel,
    timeLabel,
    guestName,
    guestPhone,
    guestNote,
  } = params;

  const est = design ? estimateDesign(design) : null;
  const designLine = est ? est.summaryText[lang] : '';
  const nameStr = guestName?.trim() || '未記入';
  const nameEn = guestName?.trim() || '—';

  if (lang === 'ja') {
    if (mode === 'consult') {
      const parts = [
        `${SITE_CONFIG.brandName} 様　デザイン相談です。`,
        `目安メニュー：${menuLabel}`,
      ];
      if (designLine) parts.push(`デザイン：${designLine}`);
      if (designUrl) parts.push(`デザインを見る：${designUrl}`);
      return parts.join('／');
    }

    const parts = [
      `${SITE_CONFIG.brandName} 様　予約希望です。`,
      `メニュー：${menuLabel}`,
    ];
    if (designLine) parts.push(`デザイン：${designLine}`);
    if (dateLabel && timeLabel) parts.push(`希望日時：${dateLabel} ${timeLabel}`);
    parts.push(`お名前：${nameStr}`);
    if (guestPhone?.trim()) parts.push(`ご連絡先：${guestPhone.trim()}`);
    if (guestNote?.trim()) parts.push(`備考：${guestNote.trim()}`);
    if (designUrl) parts.push(`デザインを見る：${designUrl}`);
    return parts.join('／');
  }

  if (mode === 'consult') {
    const parts = [
      `Hi ${SITE_CONFIG.brandName}, I'd like to consult on a design.`,
      `Menu: ${menuLabel}`,
    ];
    if (designLine) parts.push(`Design: ${designLine}`);
    if (designUrl) parts.push(`View design: ${designUrl}`);
    return parts.join(' / ');
  }

  const parts = [
    `Hi ${SITE_CONFIG.brandName}, I'd like to request a booking.`,
    `Menu: ${menuLabel}`,
  ];
  if (designLine) parts.push(`Design: ${designLine}`);
  if (dateLabel && timeLabel) parts.push(`Preferred: ${dateLabel} ${timeLabel}`);
  parts.push(`Name: ${nameEn}`);
  if (guestPhone?.trim()) parts.push(`Phone: ${guestPhone.trim()}`);
  if (guestNote?.trim()) parts.push(`Note: ${guestNote.trim()}`);
  if (designUrl) parts.push(`View design: ${designUrl}`);
  return parts.join(' / ');
}

export function buildLineOaUrl(message: string): string {
  const id = encodeURIComponent(SITE_CONFIG.contact.lineOfficialId);
  return `https://line.me/R/oaMessage/${id}/?${encodeURIComponent(message)}`;
}

export function buildInstagramDmUrl(): string {
  return `https://ig.me/m/${SITE_CONFIG.contact.instagramHandle}`;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  } catch {
    return false;
  }
}
