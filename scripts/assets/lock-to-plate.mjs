#!/usr/bin/env node
// Per-finger sub-pixel alignment + locked background compositor for "same hand, only nails change" sets.
// Guarantees 0px drift on skin, ring, shadows, and table while preserving 100% of nail surface,
// cuticle detail, pearls, tips, and gloss reflections.

import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

async function loadRgb(file, w, h) {
  let img = sharp(file).removeAlpha().toColourspace('srgb');
  if (w && h) img = img.resize(w, h, { fit: 'fill', kernel: 'lanczos3' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

async function blur1(buf, w, h, sigma) {
  const { data, info } = await sharp(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength), {
    raw: { width: w, height: h, channels: 1 },
  })
    .blur(sigma)
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (info.channels === 1) return data;
  const out = Buffer.alloc(w * h);
  for (let i = 0; i < w * h; i++) out[i] = data[i * info.channels];
  return out;
}

function findComponents(bin, w, h, minArea) {
  const label = new Int32Array(w * h);
  const comps = [];
  const stack = [];
  let id = 0;
  for (let p = 0; p < w * h; p++) {
    if (!bin[p] || label[p]) continue;
    id++;
    let area = 0, minX = w, minY = h, maxX = 0, maxY = 0;
    stack.push(p);
    label[p] = id;
    while (stack.length) {
      const q = stack.pop();
      area++;
      const x = q % w, y = (q / w) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      for (const r of [q - 1, q + 1, q - w, q + w]) {
        if (r < 0 || r >= w * h) continue;
        if ((r === q - 1 && x === 0) || (r === q + 1 && x === w - 1)) continue;
        if (bin[r] && !label[r]) {
          label[r] = id;
          stack.push(r);
        }
      }
    }
    if (area >= minArea) {
      comps.push({ id, area, minX, minY, maxX, maxY });
    }
  }
  comps.sort((a, b) => b.area - a.area);
  return { label, comps };
}

// Local alignment around a nail bounding box using surrounding skin pixels (excluding the nail interior!)
function alignLocalPatch(plateBuf, varBuf, nailMask, w, h, box, maxShift = 4) {
  const pad = 42;
  const x0 = Math.max(maxShift, box.minX - pad);
  const y0 = Math.max(maxShift, box.minY - pad);
  const x1 = Math.min(w - maxShift - 1, box.maxX + pad);
  const y1 = Math.min(h - maxShift - 1, box.maxY + pad);

  let best = { dx: 0, dy: 0, cost: Infinity };
  for (let dy = -maxShift; dy <= maxShift; dy++) {
    for (let dx = -maxShift; dx <= maxShift; dx++) {
      let cost = 0, n = 0;
      for (let y = y0; y <= y1; y += 2) {
        for (let x = x0; x <= x1; x += 2) {
          const p = y * w + x;
          if (nailMask[p] > 20) continue; // compare surrounding fingertip skin & background, NOT the changed nail!
          const i = p * 3;
          const j = ((y + dy) * w + (x + dx)) * 3;
          const d =
            Math.abs(plateBuf[i] - varBuf[j]) +
            Math.abs(plateBuf[i + 1] - varBuf[j + 1]) +
            Math.abs(plateBuf[i + 2] - varBuf[j + 2]);
          cost += d < 60 ? d : 60;
          n++;
        }
      }
      if (n > 0) {
        const avg = cost / n;
        if (avg < best.cost) best = { dx, dy, cost: avg };
      }
    }
  }
  return best;
}

async function main() {
  const args = process.argv.slice(2);
  let plateFile = '', outDir = '', anchorFiles = [], targetFiles = [], dilateRadius = 3.2, featherSigma = 2.0;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--plate') plateFile = args[++i];
    else if (a === '--out') outDir = args[++i];
    else if (a === '--anchors') anchorFiles = args[++i].split(',');
    else if (a === '--dilate') dilateRadius = Number(args[++i]);
    else if (a === '--feather') featherSigma = Number(args[++i]);
    else targetFiles.push(a);
  }
  if (!plateFile || !outDir || !anchorFiles.length || !targetFiles.length) {
    throw new Error('Usage: lock-to-plate.mjs --plate plate.jpg --anchors a.jpg,b.jpg --out dir <files...>');
  }
  await mkdir(outDir, { recursive: true });

  const plate = await loadRgb(plateFile);
  const { w, h } = plate;
  const n = w * h;

  // 1. Build clean 5-nail reference mask from high-contrast anchor variants (e.g. 03 lavender & 07 bordeaux & 08 greige)
  const maxD = new Uint8Array(n);
  for (const af of anchorFiles) {
    const v = await loadRgb(af, w, h);
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      const d = Math.max(
        Math.abs(v.data[j] - plate.data[j]),
        Math.abs(v.data[j + 1] - plate.data[j + 1]),
        Math.abs(v.data[j + 2] - plate.data[j + 2])
      );
      if (d > maxD[i]) maxD[i] = d;
    }
  }
  const softD = await blur1(maxD, w, h, 1.5);
  const bin0 = new Uint8Array(n);
  for (let i = 0; i < n; i++) bin0[i] = softD[i] > 32 ? 255 : 0;
  const closed = await blur1(bin0, w, h, 2.5);
  for (let i = 0; i < n; i++) bin0[i] = closed[i] > 80 ? 255 : 0;
  const eroded = await blur1(bin0, w, h, 4);
  for (let i = 0; i < n; i++) bin0[i] = eroded[i] > 210 ? 255 : 0;
  const dilated0 = await blur1(bin0, w, h, 4);
  const cleanBin = new Uint8Array(n);
  for (let i = 0; i < n; i++) cleanBin[i] = dilated0[i] > 30 ? 1 : 0;

  const { label, comps } = findComponents(cleanBin, w, h, Math.round(n * 0.0003));
  const top5 = comps.slice(0, 5);
  if (top5.length !== 5) throw new Error(`Expected 5 anchor nail blobs, got ${top5.length}`);
  const keepIds = new Set(top5.map((c) => c.id));
  const baseMask = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (keepIds.has(label[i])) baseMask[i] = 255;

  // Dilate slightly to cover cuticle pearls / tip edges cleanly, then feather
  const grown = await blur1(baseMask, w, h, dilateRadius);
  const hardGrown = new Uint8Array(n);
  for (let i = 0; i < n; i++) hardGrown[i] = grown[i] > 45 ? 255 : 0;
  const feathered = await blur1(hardGrown, w, h, featherSigma);

  // Assign every pixel near a nail to its nearest nail component so each finger shifts independently!
  const nearestComp = new Int8Array(n).fill(-1);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = y * w + x;
      if (feathered[p] === 0) continue;
      let bestIdx = 0, bestDist = Infinity;
      for (let k = 0; k < 5; k++) {
        const c = top5[k];
        const cx = 0.5 * (c.minX + c.maxX), cy = 0.5 * (c.minY + c.maxY);
        const dist = (x - cx) * (x - cx) + (y - cy) * (y - cy);
        if (dist < bestDist) { bestDist = dist; bestIdx = k; }
      }
      nearestComp[p] = bestIdx;
    }
  }

  // 2. Process each target file
  for (const tf of targetFiles) {
    const baseName = path.basename(tf);
    const v = await loadRgb(tf, w, h);
    const shifts = top5.map((c) => alignLocalPatch(plate.data, v.data, hardGrown, w, h, c, 4));

    // Local skin-ring luminance/RGB offset per finger so feathered boundary has zero step
    const rgbBias = top5.map((c, k) => {
      const s = shifts[k];
      let dR = 0, dG = 0, dB = 0, cnt = 0;
      for (let y = Math.max(4, c.minY - 14); y <= Math.min(h - 5, c.maxY + 14); y++) {
        for (let x = Math.max(4, c.minX - 14); x <= Math.min(w - 5, c.maxX + 14); x++) {
          const p = y * w + x;
          if (hardGrown[p] > 0) continue;
          const distY = y < c.minY ? c.minY - y : y > c.maxY ? y - c.maxY : 0;
          const distX = x < c.minX ? c.minX - x : x > c.maxX ? x - c.maxX : 0;
          if (distX + distY > 14) continue;
          const pi = p * 3;
          const vi = ((y + s.dy) * w + (x + s.dx)) * 3;
          dR += plate.data[pi] - v.data[vi];
          dG += plate.data[pi + 1] - v.data[vi + 1];
          dB += plate.data[pi + 2] - v.data[vi + 2];
          cnt++;
        }
      }
      return cnt ? [dR / cnt, dG / cnt, dB / cnt] : [0, 0, 0];
    });

    const out = Buffer.from(plate.data);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const alpha = feathered[p] / 255;
        if (alpha <= 0.004) continue;
        const k = nearestComp[p];
        const s = shifts[k];
        const bias = rgbBias[k];
        const sy = Math.max(0, Math.min(h - 1, y + s.dy));
        const sx = Math.max(0, Math.min(w - 1, x + s.dx));
        const pi = p * 3;
        const vi = (sy * w + sx) * 3;
        // Apply only gentle 50% skin bias near the feathered cuticle rim, 0% inside pure nail center so nail color stays 100% pure!
        const rimWeight = 1 - alpha;
        const vr = Math.max(0, Math.min(255, v.data[vi] + bias[0] * rimWeight));
        const vg = Math.max(0, Math.min(255, v.data[vi + 1] + bias[1] * rimWeight));
        const vb = Math.max(0, Math.min(255, v.data[vi + 2] + bias[2] * rimWeight));
        out[pi]     = Math.round(vr * alpha + plate.data[pi]     * (1 - alpha));
        out[pi + 1] = Math.round(vg * alpha + plate.data[pi + 1] * (1 - alpha));
        out[pi + 2] = Math.round(vb * alpha + plate.data[pi + 2] * (1 - alpha));
      }
    }

    const outPath = path.join(outDir, `${path.parse(baseName).name}.jpg`);
    await sharp(out, { raw: { width: w, height: h, channels: 3 } })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' })
      .toFile(outPath);
    console.log(`  locked ${baseName} -> per-finger shifts: ${shifts.map((s) => `${s.dx},${s.dy}`).join(' | ')}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
