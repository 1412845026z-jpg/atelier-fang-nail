import { LinePattern, NailLength, NailShape } from '../types/nail';

/**
 * Length multiplier relative to each finger's calibrated natural baseLength.
 * S = natural short, M = refined salon medium, L = sculpted long extension.
 */
export const LENGTH_MULTIPLIERS: Record<NailLength, number> = {
  S: 1.02,
  M: 1.38,
  L: 1.82,
};

/**
 * Fixed-topology 6-segment closed cubic Bézier nail outline.
 * Coordinates are in local nail space:
 *   origin (0, 0) = cuticle root center
 *   -y = direction toward the free edge / tip
 *   x in [-w/2, +w/2]
 *
 * Returning a fixed-length flat number array (start point + 6 cubic segments = 38 floats)
 * allows silky 60fps point-by-point interpolation when morphing between ANY shape or length.
 */
export function buildNailControlPoints(
  shape: NailShape,
  width: number,
  length: number
): number[] {
  const hw = width * 0.5;
  const L = Math.max(width * 0.55, length);

  // Start at cuticle bottom center (0, 0)
  // Segment 1: cuticle left U-curve -> left sidewall base (-hw, -sideStartY)
  // Segment 2: left sidewall -> left shoulder (-shoulderX, -shoulderY)
  // Segment 3: left tip curve -> tip apex (-tipFlatX, -L) or (0, -L)
  // Segment 4: right tip curve -> right shoulder (+shoulderX, -shoulderY)
  // Segment 5: right sidewall -> right sidewall base (+hw, -sideStartY)
  // Segment 6: cuticle right U-curve -> cuticle bottom center (0, 0)

  const cutY = Math.min(hw * 0.42, L * 0.24);
  const sideStartY = cutY * 1.15;

  let sx = hw; // shoulder half-width
  let sy = L * 0.72; // shoulder height
  let tx = 0; // tip half-width (0 for rounded/almond/stiletto, >0 for flat/square/ballerina)
  let tipCtrlY = L; // control Y near apex
  let sideCtrlX = hw; // mid sidewall x

  switch (shape) {
    case 'square':
      sx = hw * 0.99;
      sy = L * 0.92;
      tx = hw * 0.88;
      tipCtrlY = L * 1.0;
      sideCtrlX = hw * 1.01;
      break;
    case 'squoval':
      sx = hw * 0.97;
      sy = L * 0.84;
      tx = hw * 0.64;
      tipCtrlY = L * 1.0;
      sideCtrlX = hw * 1.01;
      break;
    case 'round':
      sx = hw * 0.94;
      sy = L * 0.66;
      tx = 0;
      tipCtrlY = L * 1.0;
      sideCtrlX = hw * 1.0;
      break;
    case 'oval':
      sx = hw * 0.88;
      sy = L * 0.64;
      tx = 0;
      tipCtrlY = L * 1.02;
      sideCtrlX = hw * 0.98;
      break;
    case 'almond':
      sx = hw * 0.78;
      sy = L * 0.58;
      tx = 0;
      tipCtrlY = L * 1.03;
      sideCtrlX = hw * 0.96;
      break;
    case 'ballerina':
      sx = hw * 0.62;
      sy = L * 0.90;
      tx = hw * 0.48;
      tipCtrlY = L * 1.0;
      sideCtrlX = hw * 0.92;
      break;
    case 'stiletto':
      sx = hw * 0.58;
      sy = L * 0.52;
      tx = 0;
      tipCtrlY = L * 1.02;
      sideCtrlX = hw * 0.92;
      break;
  }

  // Flat-tipped vs pointed/rounded control handle tuning
  const isFlatTip = shape === 'square' || shape === 'squoval' || shape === 'ballerina';
  const tipLeftCtrlX = isFlatTip ? -sx * 0.96 : shape === 'stiletto' ? -hw * 0.14 : shape === 'almond' ? -hw * 0.28 : -hw * 0.52;
  const tipLeftCtrlY = isFlatTip ? -L * 0.99 : shape === 'stiletto' ? -L * 0.92 : -tipCtrlY;

  const shoulderCtrlX = isFlatTip ? -sx : shape === 'stiletto' ? -hw * 0.42 : -sx * 0.94;
  const shoulderCtrlY = isFlatTip ? -L * 0.95 : -L * (shape === 'almond' ? 0.84 : shape === 'stiletto' ? 0.76 : 0.90);

  // Mirror cleanly left -> right so all 7 shapes are perfectly symmetrical
  const pts: number[] = [
    // Start M (0, 0)
    0, 0,
    // C1: cuticle left U-curve -> (-hw, -sideStartY)
    -hw * 0.62, 0,
    -hw, -cutY * 0.35,
    -hw, -sideStartY,
    // C2: left sidewall -> (-sx, -sy)
    -sideCtrlX, -sideStartY - (sy - sideStartY) * 0.38,
    -sideCtrlX * 0.5 + -sx * 0.5, -sideStartY - (sy - sideStartY) * 0.74,
    -sx, -sy,
    // C3: left shoulder -> tip center (0, -L) (for flat tips, smoothly curves across flat front)
    shoulderCtrlX, shoulderCtrlY,
    isFlatTip ? -tx * 0.55 : tipLeftCtrlX, tipLeftCtrlY,
    0, -L,
    // C4: tip center (0, -L) -> right shoulder (+sx, -sy)
    isFlatTip ? tx * 0.55 : -tipLeftCtrlX, tipLeftCtrlY,
    -shoulderCtrlX, shoulderCtrlY,
    sx, -sy,
    // C5: right sidewall -> (+hw, -sideStartY)
    sideCtrlX * 0.5 + sx * 0.5, -sideStartY - (sy - sideStartY) * 0.74,
    sideCtrlX, -sideStartY - (sy - sideStartY) * 0.38,
    hw, -sideStartY,
    // C6: cuticle right U-curve -> (0, 0)
    hw, -cutY * 0.35,
    hw * 0.62, 0,
    0, 0,
  ];

  return pts;
}

export function lerpControlPoints(a: number[], b: number[], t: number): number[] {
  const len = Math.min(a.length, b.length);
  const out = new Array<number>(len);
  for (let i = 0; i < len; i += 1) {
    out[i] = a[i] + (b[i] - a[i]) * t;
  }
  return out;
}

export function controlPointsToPathD(pts: number[]): string {
  const f = (n: number) => n.toFixed(2);
  let d = `M ${f(pts[0])} ${f(pts[1])}`;
  for (let i = 2; i < pts.length; i += 6) {
    d += ` C ${f(pts[i])} ${f(pts[i + 1])}, ${f(pts[i + 2])} ${f(pts[i + 3])}, ${f(
      pts[i + 4]
    )} ${f(pts[i + 5])}`;
  }
  return `${d} Z`;
}

/**
 * Generates the upper free-edge highlight rim stroke path (segments 3 & 4 of the nail).
 */
export function controlPointsToTipRimD(pts: number[]): string {
  const f = (n: number) => n.toFixed(2);
  // Start at left shoulder (end of C2 = index 12,13)
  return `M ${f(pts[12])} ${f(pts[13])} C ${f(pts[14])} ${f(pts[15])}, ${f(pts[16])} ${f(
    pts[17]
  )}, ${f(pts[18])} ${f(pts[19])} C ${f(pts[20])} ${f(pts[21])}, ${f(pts[22])} ${f(
    pts[23]
  )}, ${f(pts[24])} ${f(pts[25])}`;
}

/**
 * Generates a French tip fill polygon clipped inside the nail outline.
 * `widthRatio`: 0.08 (micro French) -> 0.32 (deep classic French)
 * `curve`: 0.15 (straight) -> 0.85 (deep sculptural smile line)
 */
export function buildFrenchSmileMaskPath(
  width: number,
  length: number,
  widthRatio: number,
  curve: number
): string {
  const hw = width * 0.72; // generously wider than nail so clipPath trims edges cleanly
  const tipY = -length;
  const band = length * Math.max(0.06, Math.min(0.38, widthRatio));
  const centerY = tipY + band;
  const sideDip = band * (0.35 + curve * 1.45);
  const sideY = centerY + sideDip;
  const f = (n: number) => n.toFixed(2);

  return `M ${f(-hw)} ${f(tipY - 12)} L ${f(hw)} ${f(tipY - 12)} L ${f(hw)} ${f(
    sideY
  )} Q 0 ${f(centerY - band * 0.12)} ${f(-hw)} ${f(sideY)} Z`;
}

/**
 * Minimalist ink/gold Japanese linework presets clipped cleanly to nail outline.
 */
export function buildArtLinePaths(
  width: number,
  length: number,
  pattern: LinePattern
): string[] {
  const w = width;
  const L = length;
  const f = (n: number) => n.toFixed(2);

  switch (pattern) {
    case 'arc':
      return [
        `M ${f(-w * 0.38)} ${f(-L * 0.22)} C ${f(-w * 0.08)} ${f(-L * 0.46)}, ${f(
          w * 0.22
        )} ${f(-L * 0.62)}, ${f(w * 0.32)} ${f(-L * 0.88)}`,
      ];
    case 'twin':
      return [
        `M ${f(-w * 0.34)} ${f(-L * 0.16)} C ${f(-w * 0.05)} ${f(-L * 0.42)}, ${f(
          w * 0.08
        )} ${f(-L * 0.68)}, ${f(w * 0.26)} ${f(-L * 0.90)}`,
        `M ${f(-w * 0.18)} ${f(-L * 0.12)} C ${f(w * 0.08)} ${f(-L * 0.38)}, ${f(
          w * 0.22
        )} ${f(-L * 0.62)}, ${f(w * 0.38)} ${f(-L * 0.80)}`,
      ];
    case 'botanical':
      return [
        `M ${f(-w * 0.10)} ${f(-L * 0.14)} C ${f(w * 0.12)} ${f(-L * 0.38)}, ${f(
          -w * 0.16
        )} ${f(-L * 0.62)}, ${f(w * 0.08)} ${f(-L * 0.86)}`,
        `M ${f(w * 0.02)} ${f(-L * 0.46)} Q ${f(w * 0.24)} ${f(-L * 0.54)} ${f(
          w * 0.28
        )} ${f(-L * 0.68)}`,
      ];
    case 'cross':
      return [
        `M ${f(-w * 0.42)} ${f(-L * 0.36)} Q ${f(0)} ${f(-L * 0.56)} ${f(w * 0.42)} ${f(
          -L * 0.72
        )}`,
        `M ${f(w * 0.34)} ${f(-L * 0.20)} Q ${f(-w * 0.04)} ${f(-L * 0.48)} ${f(
          -w * 0.32
        )} ${f(-L * 0.84)}`,
      ];
  }
}

/**
 * Cuticle-anchored micro pearl / stud coordinates in local nail space.
 */
export function buildAccentPositions(
  width: number,
  length: number,
  count: 1 | 2 | 3
): { x: number; y: number; r: number }[] {
  const baseR = Math.max(1.8, width * 0.072);
  const y0 = -Math.max(width * 0.24, length * 0.18);
  if (count === 1) {
    return [{ x: 0, y: y0, r: baseR * 1.08 }];
  }
  if (count === 2) {
    return [
      { x: -width * 0.12, y: y0 - baseR * 0.3, r: baseR * 0.92 },
      { x: width * 0.12, y: y0 - baseR * 0.3, r: baseR * 0.92 },
    ];
  }
  return [
    { x: 0, y: y0 - baseR * 0.2, r: baseR * 1.05 },
    { x: -width * 0.18, y: y0 - baseR * 0.95, r: baseR * 0.72 },
    { x: width * 0.18, y: y0 - baseR * 0.95, r: baseR * 0.72 },
  ];
}
