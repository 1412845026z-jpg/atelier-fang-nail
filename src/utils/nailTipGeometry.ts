import * as THREE from 'three';
import { NailTipShape } from '../types/nail';

/**
 * Generates a realistic curved 3D Japanese gel nail tip geometry:
 * - Authentic transverse C-curve (arches gracefully across the nail width)
 * - Gentle longitudinal apex dome ("churun" plump volume)
 * - Ultra-smooth zero-pinch silhouette contouring per shape
 * - Clean inset UVs so real macro nail tip textures map seamlessly edge-to-edge with zero white corners.
 *
 * Shared by BOTH Section 01 (Flower Bud petals) and Section 03 (3D チップ見本).
 */
export function createNailTipGeometry(
  shape: NailTipShape = 'short-oval',
  options?: {
    width?: number;
    length?: number;
    cCurveDepth?: number;
    apexHeight?: number;
    segX?: number;
    segY?: number;
  }
): THREE.BufferGeometry {
  const isMedium = shape === 'medium-oval' || shape === 'medium-round';
  const width = options?.width ?? 0.54;
  const length = options?.length ?? (isMedium ? 0.94 : 0.78);
  const cCurveDepth = options?.cCurveDepth ?? 0.11;
  const apexHeight = options?.apexHeight ?? 0.048;
  const segX = options?.segX ?? 28;
  const segY = options?.segY ?? 32;

  const profileHalfWidth = (v: number): number => {
    // Clamp slightly away from degenerate zero width at poles so vertex normals stay silky smooth (zero pinch!)
    const minW = 0.03;

    // Smooth elliptical cuticle base (v: 0 .. 0.22)
    if (v < 0.22) {
      const k = 1 - v / 0.22; // 1 at bottom -> 0 at 0.22
      return Math.max(minW, Math.sqrt(Math.max(0.001, 1 - k * k * 0.96)));
    }

    const u = (v - 0.22) / 0.78; // 0 .. 1 toward free-edge tip
    switch (shape) {
      case 'short-square-off': {
        if (u < 0.78) {
          return 0.99 - u * 0.04;
        }
        const k = (u - 0.78) / 0.22;
        return Math.max(minW, 0.96 * Math.pow(Math.max(0.001, 1 - Math.pow(k, 3.6)), 0.34));
      }

      case 'short-round':
      case 'medium-round': {
        if (u < 0.52) {
          return 0.99 + Math.sin(u * Math.PI) * 0.015;
        }
        const k = (u - 0.52) / 0.48;
        return Math.max(minW, Math.sqrt(Math.max(0.001, 1 - k * k)));
      }

      case 'short-almond': {
        // Graceful tapered short almond with soft rounded tip (zero spiky pinch)
        const baseTaper = 1 - Math.pow(u, 1.48) * 0.78;
        if (u < 0.76) return Math.max(minW, baseTaper);
        const k = (u - 0.76) / 0.24;
        return Math.max(minW, baseTaper * Math.sqrt(Math.max(0.001, 1 - k * k)));
      }

      case 'short-oval':
      case 'medium-oval':
      default: {
        if (u < 0.34) {
          return 0.99 - u * 0.03;
        }
        const k = (u - 0.34) / 0.66;
        return Math.max(minW, 0.98 * Math.sqrt(Math.max(0.001, 1 - Math.pow(k, 2.05))));
      }
    }
  };

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let iy = 0; iy <= segY; iy += 1) {
    // Soft cosine clustering near ends gives extra smoothness at cuticle & tip curves
    const rawV = iy / segY;
    const v = 0.5 - 0.5 * Math.cos(rawV * Math.PI);
    const halfW = profileHalfWidth(v) * (width * 0.5);
    const y = (v - 0.5) * length;

    // Gentle plump apex arch peaking softly around v = 0.44
    const apexZ = Math.sin(Math.pow(v, 0.85) * Math.PI) * apexHeight;
    const tipCurve = v > 0.65 ? -Math.pow((v - 0.65) / 0.35, 2) * 0.022 : 0;

    for (let ix = 0; ix <= segX; ix += 1) {
      const u = ix / segX;
      const nx = (u - 0.5) * 2; // -1 .. +1
      const x = nx * halfW;

      const cStrength = 0.48 + 0.52 * Math.sin(v * Math.PI);
      const cZ = (1 - nx * nx) * cCurveDepth * cStrength;
      const z = cZ + apexZ + tipCurve;

      positions.push(x, y, z);

      // Inset UV sampling cleanly inside the cropped macro nail texture so zero white border bleeds in
      const uvU = 0.5 + (x / width) * 0.82;
      const uvV = 0.06 + v * 0.88;
      uvs.push(uvU, uvV);
    }
  }

  for (let iy = 0; iy < segY; iy += 1) {
    for (let ix = 0; ix < segX; ix += 1) {
      const a = iy * (segX + 1) + ix;
      const b = a + 1;
      const c = a + (segX + 1);
      const d = c + 1;
      indices.push(a, b, d);
      indices.push(a, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
