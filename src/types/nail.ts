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

export type OpticalEffectType = 'none' | 'magnet' | 'pearl' | 'mirror' | 'glitter';

export interface FingerMaskCalibration {
  index: 0 | 1 | 2 | 3 | 4;
  id: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  label: LocalizedText;
  /** Center X in 1376×768 reference frame */
  cx: number;
  /** Center Y in 1376×768 reference frame */
  cy: number;
  /** Half-width across nail plate */
  rx: number;
  /** Half-length along cuticle-to-tip axis */
  ry: number;
  /** Rotation angle in degrees (0 = pointing up, ~85 = pointing right along finger) */
  angleDeg: number;
}

export interface NailDesignItem {
  id: string;
  number: string;
  name: LocalizedText;
  categoryId: NailCategoryId;
  liquidHex: string;
  shimmerHex: string;
  isSheer: boolean;
  opticalEffect: OpticalEffectType;
  bottleWebp: string;
  bottlePng: string;
  handWebBase: string;
}

export interface MenuCategoryMeta {
  id: NailCategoryId;
  label: LocalizedText;
  priceYen: number;
  durationMin: number;
}

export type SelfShapeId = 'round' | 'oval' | 'square';
export type SelfLengthId = 'short' | 'medium' | 'long';
export type SelfTechniqueId =
  | 'onecolor'
  | 'french'
  | 'gradation'
  | 'magnet'
  | 'nuance'
  | 'mirror';
export type SelfAccentId = 'none' | 'pearl' | 'glitter' | 'stone' | 'goldline';

export interface SelfColorOption {
  id: string;
  name: LocalizedText;
  poeticStem: LocalizedText;
  hex: string;
  sheer: boolean;
  toneGroup: 'pale' | 'rose' | 'neutral' | 'deep';
}

export interface SelfTechniqueOption {
  id: SelfTechniqueId;
  label: LocalizedText;
  poeticSuffix: LocalizedText;
  priceDelta: number;
  durationDelta: number;
  /** Tone groups that harmonize best with this technique */
  recommendedTones: ('pale' | 'rose' | 'neutral' | 'deep')[];
}

export interface SelfAccentOption {
  id: SelfAccentId;
  label: LocalizedText;
  priceDelta: number;
  durationDelta: number;
  cutoutWebp?: string;
  /** Techniques that pair harmoniously without visual clutter */
  compatibleTechniques: SelfTechniqueId[];
}

export interface SelfSelection {
  shape: SelfShapeId;
  length: SelfLengthId;
  colorId: string;
  technique: SelfTechniqueId;
  accent: SelfAccentId;
}

export interface ActiveCardSpec {
  mode: 'preset' | 'self';
  codeNumber: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  priceYen: number;
  durationMin: number;
  swatchHex: string;
  presetId?: string;
  selfSelection?: SelfSelection;
}

export interface VideoManifest {
  a: boolean;
  b: boolean;
  c: boolean;
  loop: boolean;
}
