export type Lang = 'ja' | 'en';

export interface LocalizedText {
  ja: string;
  en: string;
}

export type NailShape =
  | 'square'
  | 'squoval'
  | 'round'
  | 'oval'
  | 'almond'
  | 'ballerina'
  | 'stiletto';

export type NailLength = 'S' | 'M' | 'L';

export type NailFinish =
  | 'gloss'
  | 'matte'
  | 'sheer'
  | 'pearl'
  | 'chrome'
  | 'magnet';

export type NailArtType = 'none' | 'french' | 'line' | 'pearl' | 'stud';

export type LinePattern = 'arc' | 'twin' | 'botanical' | 'cross';

export type FingerIndex = 0 | 1 | 2 | 3 | 4;

export interface FingerCalibration {
  index: FingerIndex;
  id: 'pinky' | 'ring' | 'middle' | 'index' | 'thumb';
  label: LocalizedText;
  /** Cuticle root center X in source image pixel coordinates */
  cx: number;
  /** Cuticle root center Y in source image pixel coordinates */
  cy: number;
  /** Orientation angle in degrees (0 = pointing straight up -Y) */
  angleDeg: number;
  /** Natural nail width in source image pixels */
  width: number;
  /** Natural short nail length from cuticle root to tip in pixels */
  baseLength: number;
  /** Perspective vertical compression (e.g. side-angled thumb ~0.82) */
  scaleY: number;
}

export interface ColorSwatch {
  id: string;
  code: string;
  hex: string;
  name: LocalizedText;
  defaultFinish: NailFinish;
}

export interface FingerDesign {
  colorId: string;
  finish: NailFinish;
  art: NailArtType;
  frenchColorId: string;
  /** Fraction of nail length (0.09 = micro French .. 0.30 = deep French) */
  frenchWidth: number;
  /** Smile-line arch curvature (0.15 = subtle .. 0.85 = deep smile) */
  frenchCurve: number;
  linePattern: LinePattern;
  accentCount: 1 | 2 | 3;
}

export interface NailDesignState {
  shape: NailShape;
  length: NailLength;
  fingers: [FingerDesign, FingerDesign, FingerDesign, FingerDesign, FingerDesign];
  presetId?: string;
}

export interface DesignEstimate {
  serviceId: string;
  menuName: LocalizedText;
  summaryText: LocalizedText;
  estimatedMinutes: number;
  estimatedYen: number;
  artFingerCount: number;
  specimenCode: string;
}
