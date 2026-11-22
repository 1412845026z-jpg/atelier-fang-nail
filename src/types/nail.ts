export type Lang = 'ja' | 'en';

export interface LocalizedText {
  ja: string;
  en: string;
}

export type NailCategoryId =
  | 'one-color'
  | 'french'
  | 'magnet'
  | 'nuance'
  | 'aurora'
  | 'parts'
  | 'gradation';

export type NailTipShape =
  | 'short-round'
  | 'short-oval'
  | 'short-square-off'
  | 'short-almond'
  | 'medium-oval'
  | 'medium-round';

/** 5 Japanese mainstream short-to-medium silhouette shapes for Counseling Card */
export type CounselingShapeId =
  | 'round'
  | 'oval'
  | 'square-off'
  | 'short-almond'
  | 'point-soft';

/** Subtle optical light-play overlay confined strictly inside the 5 nail masks */
export type OpticalEffectType = 'none' | 'magnet' | 'pearl' | 'mirror' | 'glitter';

export interface FingerMaskCalibration {
  index: 0 | 1 | 2 | 3 | 4;
  id: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  label: LocalizedText;
  /** Center X in source hand image coordinates */
  cx: number;
  /** Center Y in source hand image coordinates */
  cy: number;
  /** Nail half-width (rx) in source pixels */
  rx: number;
  /** Nail half-height / length (ry) in source pixels */
  ry: number;
  /** Rotation in degrees (0 = pointing straight up) */
  angleDeg: number;
  /** Feather blur in viewBox pixels for seamless cuticle & tip blending */
  featherPx: number;
}

export interface NailDesignItem {
  /** '01' .. '12' */
  id: string;
  /** Display number '01' .. '12' */
  number: string;
  /** Exact Japanese salon design name (verbatim from spec) + English subtitle */
  name: LocalizedText;
  /** Menu category */
  categoryId: NailCategoryId;
  /** Short-to-medium salon nail shape */
  shape: NailTipShape;
  /** Primary bottle liquid hex color (visible inside 3D glass bottle) */
  liquidHex: string;
  /** Secondary / pearl shimmer tint hex for bottle inner reflection & optical sheen */
  shimmerHex: string;
  /** Bottle glass tint opacity / translucency hint */
  isSheer: boolean;
  /** Bottle cap style */
  capFinish: 'champagne-gold' | 'rose-gold' | 'deep-bordeaux';
  /** Special code-driven light reflection strictly inside nail mask */
  opticalEffect: OpticalEffectType;
  /** Hand photo variant path (aligned 1-to-1 with handBase) */
  handImage: string;
  /** High-res nail tip texture path for 3D チップ見本 */
  tipImage: string;
  /** Brief delicate salon note (1 short phrase, optional) */
  note: LocalizedText;
}

export interface MenuCategoryMeta {
  id: NailCategoryId;
  label: LocalizedText;
  priceYen: number;
  durationMin: number;
}

export interface CareMenuItem {
  id: string;
  categoryLabel: LocalizedText;
  name: LocalizedText;
  priceYen: number;
  durationMin: number;
}

export interface CounselingPayload {
  /** Design id '01'..'12' or 'consult' for 「相談して決めたい」 */
  designId: string;
  shape: CounselingShapeId;
  /** 0 = 自爪そのまま (0mm) .. 3 = ミディアム (+3mm) */
  lengthLevel: number;
  concerns: string[];
  lifestyle: string;
  preferredDate: string; // YYYY-MM-DD or 'undecided'
  guestName: string;
  contactChannel: 'line' | 'instagram';
  note: string;
}
