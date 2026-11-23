import { SITE_CONFIG } from '../config';
import { ActiveCardSpec, Lang, SelfSelection } from '../types/nail';

export interface DecodedShareState {
  mode: 'preset' | 'self';
  presetId?: string;
  selfSelection?: SelfSelection;
}

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

export function formatYen(amount: number): string {
  return `${SITE_CONFIG.currencySymbol}${amount.toLocaleString('en-US')}`;
}

export function encodeCardToQuery(spec: ActiveCardSpec): string {
  if (spec.mode === 'self' && spec.selfSelection) {
    return toBase64Url(
      JSON.stringify({
        v: 4,
        m: 's',
        s: spec.selfSelection.shape,
        l: spec.selfSelection.length,
        c: spec.selfSelection.colorId,
        t: spec.selfSelection.technique,
        a: spec.selfSelection.accent,
      })
    );
  }
  return toBase64Url(JSON.stringify({ v: 4, m: 'p', i: spec.presetId || '02' }));
}

export function decodeCardFromQuery(encoded: string): DecodedShareState | null {
  try {
    const raw = JSON.parse(fromBase64Url(encoded)) as Record<string, string | number>;
    if (raw.m === 's') {
      return {
        mode: 'self',
        selfSelection: {
          shape: (raw.s as SelfSelection['shape']) || 'oval',
          length: (raw.l as SelfSelection['length']) || 'short',
          colorId: String(raw.c || 'c03'),
          technique: (raw.t as SelfSelection['technique']) || 'onecolor',
          accent: (raw.a as SelfSelection['accent']) || 'none',
        },
      };
    }
    const id = String(raw.i || '02');
    const found = SITE_CONFIG.designs.find((d) => d.id === id);
    return { mode: 'preset', presetId: found ? found.id : '02' };
  } catch {
    return null;
  }
}

export function buildShareableUrl(spec: ActiveCardSpec): string {
  const q = encodeCardToQuery(spec);
  if (typeof window === 'undefined') return `?d=${q}`;
  const url = new URL(window.location.href);
  url.searchParams.set('d', q);
  return url.toString();
}

export function buildLineBookingUrl(spec: ActiveCardSpec, lang: Lang): string {
  const shareUrl = buildShareableUrl(spec);
  const msg =
    lang === 'ja'
      ? `${SITE_CONFIG.brandName}\n${spec.codeNumber}「${spec.title.ja}」（${spec.subtitle.ja} · ${formatYen(spec.priceYen)} / ${spec.durationMin}分）で予約・相談を希望します。\n${shareUrl}`
      : `${SITE_CONFIG.brandName}\nBooking inquiry for ${spec.codeNumber} "${spec.title.en}" (${spec.subtitle.en} · ${formatYen(spec.priceYen)} / ${spec.durationMin} min).\n${shareUrl}`;
  const oa = encodeURIComponent(SITE_CONFIG.contact.lineOfficialId);
  return `https://line.me/R/oaMessage/${oa}/?${encodeURIComponent(msg)}`;
}

export function buildOrdermadeLineUrl(spec: ActiveCardSpec, lang: Lang): string {
  const msg =
    lang === 'ja'
      ? `${SITE_CONFIG.brandName}\nオーダーメイドの相談を希望します（参考カード：${spec.codeNumber} ${spec.title.ja}）。`
      : `${SITE_CONFIG.brandName}\nI would like a bespoke order-made consultation (ref: ${spec.codeNumber} ${spec.title.en}).`;
  const oa = encodeURIComponent(SITE_CONFIG.contact.lineOfficialId);
  return `https://line.me/R/oaMessage/${oa}/?${encodeURIComponent(msg)}`;
}

export interface DesktopCardSceneLayout {
  scale: number;
  rw: number;
  rh: number;
  baseLeft: number;
  baseTop: number;
  openLeft: number;
  cardCx: number;
  cardCy: number;
  cardAngleDeg: number;
  ordermadeCx: number;
  ordermadeCy: number;
}

/**
 * Exact viewport projection of the real photographed blank cotton card in `card-in-scene.jpg` (1376x768).
 * When the card opens on desktop, horizontal alignment glides smoothly from centered (`baseLeft`)
 * to right-aligned (`vw - rw`) so all four fine gold-foil corners + oak margin stay 100% inside the frame
 * with zero blank borders at any aspect ratio (16:10, 16:9, 21:9).
 */
export function computeDesktopCardSceneLayout(vw: number, vh: number): DesktopCardSceneLayout {
  const refW = SITE_CONFIG.media.refWidth;
  const refH = SITE_CONFIG.media.refHeight;
  const scale = Math.max(vw / refW, vh / refH);
  const rw = refW * scale;
  const rh = refH * scale;
  const baseLeft = (vw - rw) / 2;
  const baseTop = (vh - rh) / 2;
  const openLeft = vw - rw;

  return {
    scale,
    rw,
    rh,
    baseLeft,
    baseTop,
    openLeft,
    cardCx: openLeft + 1156.5 * scale,
    cardCy: baseTop + 453.5 * scale,
    cardAngleDeg: 11.15,
    ordermadeCx: openLeft + 1110 * scale,
    ordermadeCy: Math.min(vh - 34, baseTop + 706 * scale),
  };
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
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
