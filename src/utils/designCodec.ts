import { getDesignById, getDesignMeta, SITE_CONFIG } from '../config';
import { CounselingPayload, CounselingShapeId, Lang } from '../types/nail';

export interface EncodedSelection {
  designId: string;
  shape?: CounselingShapeId;
  lengthLevel?: number;
}

const VALID_SHAPES: CounselingShapeId[] = [
  'round',
  'oval',
  'square-off',
  'short-almond',
  'point-soft',
];

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

/** Encodes v3 design selection (+ optional counseling shape/length) cleanly into ?d=<base64url> */
export function encodeSelectionToQuery(sel: EncodedSelection): string {
  const payload: Record<string, unknown> = {
    v: 3,
    i: sel.designId,
  };
  if (sel.shape) payload.s = sel.shape;
  if (typeof sel.lengthLevel === 'number') payload.l = sel.lengthLevel;
  return toBase64Url(JSON.stringify(payload));
}

export function decodeSelectionFromQuery(encoded: string): EncodedSelection | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as {
      v?: number;
      i?: string;
      s?: string;
      l?: number;
    };
    const id = typeof raw.i === 'string' ? raw.i : '';
    const matched = SITE_CONFIG.designs.find((d) => d.id === id);
    if (!matched && id !== 'consult') return null;

    const shape = VALID_SHAPES.includes(raw.s as CounselingShapeId)
      ? (raw.s as CounselingShapeId)
      : undefined;
    const lengthLevel =
      typeof raw.l === 'number' && raw.l >= 0 && raw.l <= 3 ? Math.round(raw.l) : undefined;

    return {
      designId: matched ? matched.id : 'consult',
      shape,
      lengthLevel,
    };
  } catch {
    return null;
  }
}

export function buildShareableDesignUrl(sel: EncodedSelection): string {
  const encoded = encodeSelectionToQuery(sel);
  if (typeof window === 'undefined') return `?d=${encoded}#vanity`;
  const url = new URL(window.location.href);
  url.searchParams.delete('calibrate');
  url.searchParams.set('d', encoded);
  url.hash = 'vanity';
  return url.toString();
}

export function formatYen(amount: number): string {
  return `${SITE_CONFIG.currencySymbol}${amount.toLocaleString('en-US')}`;
}

export function buildCounselingMessage(payload: CounselingPayload, lang: Lang): string {
  const isUndecided = payload.designId === 'consult';
  const design = isUndecided ? null : getDesignById(payload.designId);
  const meta = design ? getDesignMeta(design) : null;

  const shapeItem =
    SITE_CONFIG.counselingUI.shapes.find((s) => s.id === payload.shape) ||
    SITE_CONFIG.counselingUI.shapes[1];
  const lengthLabel =
    SITE_CONFIG.counselingUI.lengthLabels[
      Math.max(0, Math.min(3, payload.lengthLevel))
    ][lang];

  const concernLabels = payload.concerns
    .map((cid) => SITE_CONFIG.counselingUI.concerns.find((c) => c.id === cid)?.label[lang])
    .filter(Boolean)
    .join(lang === 'ja' ? '・' : ', ');

  const lifestyleLabel =
    SITE_CONFIG.counselingUI.lifestyles.find((l) => l.id === payload.lifestyle)?.label[lang] ||
    SITE_CONFIG.counselingUI.lifestyles[2].label[lang];

  const dateText =
    !payload.preferredDate || payload.preferredDate === 'undecided'
      ? SITE_CONFIG.counselingUI.dateUndecided[lang]
      : payload.preferredDate;

  const designUrl = buildShareableDesignUrl({
    designId: payload.designId,
    shape: payload.shape,
    lengthLevel: payload.lengthLevel,
  });

  if (lang === 'ja') {
    const lines = [
      `${SITE_CONFIG.brandName} 様　デザインの相談です。`,
      isUndecided
        ? `デザイン：${SITE_CONFIG.counselingUI.consultUndecided.ja}`
        : `デザイン：No.${design!.number} ${design!.name.ja}（${meta!.label.ja}・目安 ${formatYen(meta!.priceYen)} / ${meta!.durationMin}分）`,
      `形・長さ：${shapeItem.label.ja}／${lengthLabel}`,
      `お爪のお悩み：${concernLabels || '特になし'}`,
      `普段の生活：${lifestyleLabel}`,
      `ご希望日：${dateText}`,
      `お名前：${payload.guestName.trim() || '未記入'}`,
    ];
    if (payload.note.trim()) {
      lines.push(`メモ：${payload.note.trim()}`);
    }
    lines.push(`デザインURL：${designUrl}`);
    return lines.join('\n');
  }

  const lines = [
    `Hello ${SITE_CONFIG.brandName}, I'd love to consult on a nail look.`,
    isUndecided
      ? `Design: ${SITE_CONFIG.counselingUI.consultUndecided.en}`
      : `Design: No.${design!.number} ${design!.name.ja} / ${design!.name.en} (${meta!.label.en}, est. ${formatYen(meta!.priceYen)} · ${meta!.durationMin} min)`,
    `Shape & Length: ${shapeItem.label.en} / ${lengthLabel}`,
    `Nail concerns: ${concernLabels || 'None'}`,
    `Lifestyle: ${lifestyleLabel}`,
    `Preferred date: ${dateText}`,
    `Name: ${payload.guestName.trim() || '—'}`,
  ];
  if (payload.note.trim()) {
    lines.push(`Note: ${payload.note.trim()}`);
  }
  lines.push(`Design link: ${designUrl}`);
  return lines.join('\n');
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
