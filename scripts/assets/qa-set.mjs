#!/usr/bin/env node
// QA for a set of "same hand, only the nails change" photos.
//
// For every variant it:
//   1. finds the integer shift (±--max-shift px) that best aligns it to the plate, and can write aligned copies;
//   2. measures how much changed OUTSIDE the nails (should be ~0: the hand, ring and table must not move);
// and for the whole set it:
//   3. builds the nail mask automatically (pixels that change across the variants), white = nails;
//   4. writes a heatmap and a 200px-wide thumbnail sheet (every design must be recognisable at that size).
//
// Usage:
//   node scripts/assets/qa-set.mjs --plate <plate.jpg> <variant files or folder>... --out <dir>
//        [--align-out <dir>] [--max-shift 4] [--threshold 24] [--expect 5]
//
// Exit code is 1 when a check fails, so it can gate a pipeline.

import sharp from 'sharp';
import { statSync, readdirSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function parseArgs(argv) {
  const o = { variants: [], maxShift: 4, threshold: 24, expect: 5, outsideLimit: 0.005 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const v = () => argv[++i];
    if (a === '--plate') o.plate = v();
    else if (a === '--out') o.out = v();
    else if (a === '--align-out') o.alignOut = v();
    else if (a === '--max-shift') o.maxShift = Number(v());
    else if (a === '--threshold') o.threshold = Number(v());
    else if (a === '--expect') o.expect = Number(v());
    else if (a === '--outside-limit') o.outsideLimit = Number(v());
    else if (a === '--open') o.open = Number(v());
    else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else o.variants.push(a);
  }
  if (!o.plate || !o.out || !o.variants.length) {
    throw new Error('Usage: qa-set.mjs --plate plate.jpg <variants...> --out dir [--align-out dir]');
  }
  return o;
}

function collect(inputs, plate) {
  const out = [];
  for (const p of inputs) {
    if (statSync(p).isDirectory()) {
      for (const f of readdirSync(p).sort()) if (IMAGE_EXT.test(f)) out.push(path.join(p, f));
    } else out.push(p);
  }
  const plateAbs = path.resolve(plate);
  return out.filter((f) => path.resolve(f) !== plateAbs);
}

async function rgb(file, w, h) {
  let img = sharp(file).removeAlpha().toColourspace('srgb');
  if (w) img = img.resize(w, h, { fit: 'fill' });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

// Blur a single-channel map and always get exactly one channel back (sharp may expand to sRGB otherwise).
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

function luma(buf, n) {
  const y = new Float32Array(n);
  for (let i = 0; i < n; i++) y[i] = 0.299 * buf[i * 3] + 0.587 * buf[i * 3 + 1] + 0.114 * buf[i * 3 + 2];
  return y;
}

// Robust alignment: truncated absolute difference, so the (very different) nails do not dominate.
function bestShift(a, b, w, h, s) {
  let best = { dx: 0, dy: 0, cost: Infinity };
  const step = 2; // sample every 2nd pixel, plenty for a ±few-px search
  for (let dy = -s; dy <= s; dy++) {
    for (let dx = -s; dx <= s; dx++) {
      let cost = 0;
      let n = 0;
      for (let y = s; y < h - s; y += step) {
        const ya = y * w;
        const yb = (y + dy) * w;
        for (let x = s; x < w - s; x += step) {
          const d = Math.abs(a[ya + x] - b[yb + x + dx]);
          cost += d < 30 ? d : 30;
          n++;
        }
      }
      cost /= n;
      if (cost < best.cost) best = { dx, dy, cost };
    }
  }
  return best;
}

function shiftRGB(buf, w, h, dx, dy) {
  if (!dx && !dy) return buf;
  const out = Buffer.alloc(buf.length);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(h - 1, Math.max(0, y + dy));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(w - 1, Math.max(0, x + dx));
      const i = (y * w + x) * 3;
      const j = (sy * w + sx) * 3;
      out[i] = buf[j];
      out[i + 1] = buf[j + 1];
      out[i + 2] = buf[j + 2];
    }
  }
  return out;
}

function components(bin, w, h, minArea) {
  const label = new Int32Array(w * h);
  const comps = [];
  const stack = [];
  let id = 0;
  for (let p = 0; p < w * h; p++) {
    if (!bin[p] || label[p]) continue;
    id++;
    let area = 0;
    let minX = w, minY = h, maxX = 0, maxY = 0;
    stack.push(p);
    label[p] = id;
    while (stack.length) {
      const q = stack.pop();
      area++;
      const x = q % w;
      const y = (q / w) | 0;
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
    comps.push({ id, area, box: [minX, minY, maxX - minX + 1, maxY - minY + 1] });
  }
  const keep = new Set(comps.filter((c) => c.area >= minArea).map((c) => c.id));
  const mask = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) if (keep.has(label[p])) mask[p] = 255;
  return { mask, kept: comps.filter((c) => keep.has(c.id)).sort((a, b) => b.area - a.area) };
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  await mkdir(o.out, { recursive: true });
  if (o.alignOut) await mkdir(o.alignOut, { recursive: true });

  const plate = await rgb(o.plate);
  const { w, h } = plate;
  const n = w * h;
  const plateY = luma(plate.data, n);
  const files = collect(o.variants, o.plate);
  const maxD = new Uint8Array(n);
  const perVariant = [];
  const aligned = [];

  for (const f of files) {
    const v = await rgb(f, w, h);
    const s = bestShift(plateY, luma(v.data, n), w, h, o.maxShift);
    const buf = shiftRGB(v.data, w, h, s.dx, s.dy);
    const d = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const j = i * 3;
      d[i] = Math.max(
        Math.abs(buf[j] - plate.data[j]),
        Math.abs(buf[j + 1] - plate.data[j + 1]),
        Math.abs(buf[j + 2] - plate.data[j + 2]),
      );
      if (d[i] > maxD[i]) maxD[i] = d[i];
    }
    aligned.push({ f, buf, d });
    perVariant.push({ file: path.basename(f), shift: [s.dx, s.dy] });
    if (o.alignOut) {
      await sharp(buf, { raw: { width: w, height: h, channels: 3 } })
        .jpeg({ quality: 95, mozjpeg: true })
        .toFile(path.join(o.alignOut, `${path.parse(f).name}.jpg`));
    }
  }

  // Nail mask: blur the max-difference map first so 1px edge flicker (resampling along the finger outlines)
  // drops out, then close small gaps and keep blobs above a minimum size.
  const maxSoft = await blur1(maxD, w, h, 1.5);
  const changed = Buffer.alloc(n);
  for (let i = 0; i < n; i++) changed[i] = maxSoft[i] > o.threshold ? 255 : 0;
  // Close small holes inside the nails.
  const closed = await blur1(changed, w, h, 2.5);
  for (let i = 0; i < n; i++) changed[i] = closed[i] > 70 ? 255 : 0;
  // Morphological opening (erode, then dilate) removes thin lines such as finger outlines and the ring,
  // which flicker between renders but are not nails. Radius scales with image width.
  const r = o.open ?? Math.max(2, Math.round(w / 250));
  const eroded = await blur1(changed, w, h, r);
  for (let i = 0; i < n; i++) changed[i] = eroded[i] > 230 ? 255 : 0;
  const dilated = await blur1(changed, w, h, r);
  const bin = new Uint8Array(n);
  for (let i = 0; i < n; i++) bin[i] = dilated[i] > 25 ? 1 : 0;
  const minArea = Math.round(n * 0.0003);
  const { mask, kept } = components(bin, w, h, minArea);
  await sharp(Buffer.from(mask), { raw: { width: w, height: h, channels: 1 } }).png().toFile(path.join(o.out, 'nails.mask.png'));

  // Outside-the-nails change per variant (mask dilated a little so feathered nail edges do not count;
  // the difference map is softened the same way so only real changes count, not 1px edge flicker).
  const dil = await blur1(mask, w, h, 4);
  let failed = false;
  for (const [k, a] of aligned.entries()) {
    const dSoft = await blur1(a.d, w, h, 1.5);
    let out = 0;
    let outside = 0;
    for (let i = 0; i < n; i++) {
      if (dil[i] > 8) continue;
      outside++;
      if (dSoft[i] > o.threshold) out++;
    }
    const frac = out / outside;
    perVariant[k].changedOutsideNails = Number((frac * 100).toFixed(2));
    perVariant[k].ok = frac <= o.outsideLimit && Math.abs(perVariant[k].shift[0]) < o.maxShift && Math.abs(perVariant[k].shift[1]) < o.maxShift;
    if (!perVariant[k].ok) failed = true;
  }

  // Heatmap over a dimmed plate.
  const heat = Buffer.alloc(n * 3);
  for (let i = 0; i < n; i++) {
    const g = plateY[i] * 0.45;
    const t = Math.min(1, maxD[i] / 80);
    heat[i * 3] = Math.min(255, g + t * 255);
    heat[i * 3 + 1] = g * (1 - t);
    heat[i * 3 + 2] = g * (1 - t);
  }
  await sharp(heat, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 88 }).toFile(path.join(o.out, 'heatmap.jpg'));

  // 200px thumbnail sheet with labels.
  const tw = 200;
  const th = Math.round((h * tw) / w);
  const cols = Math.min(6, aligned.length);
  const rows = Math.ceil(aligned.length / cols);
  const labelH = 18;
  const pad = 6;
  const comps = [];
  for (const [k, a] of aligned.entries()) {
    const left = pad + (k % cols) * (tw + pad);
    const top = pad + Math.floor(k / cols) * (th + labelH + pad);
    const tile = await sharp(a.buf, { raw: { width: w, height: h, channels: 3 } }).resize(tw, th).png().toBuffer();
    comps.push({ input: tile, left, top: top + labelH });
    const label = `<svg width="${tw}" height="${labelH}"><text x="1" y="13" font-family="Helvetica, Arial" font-size="12" font-weight="bold" fill="#fff">${path.parse(a.f).name}</text></svg>`;
    comps.push({ input: Buffer.from(label), left, top });
  }
  await sharp({
    create: { width: pad + cols * (tw + pad), height: pad + rows * (th + labelH + pad), channels: 3, background: '#555' },
  })
    .composite(comps)
    .jpeg({ quality: 90 })
    .toFile(path.join(o.out, 'thumbs-200.jpg'));

  const maskOk = kept.length === o.expect;
  if (!maskOk) failed = true;
  const report = {
    plate: path.basename(o.plate),
    size: [w, h],
    threshold: o.threshold,
    nailBlobs: kept.map((c) => ({ area: c.area, box: c.box })),
    nailBlobsExpected: o.expect,
    variants: perVariant,
    pass: !failed,
  };
  await writeFile(path.join(o.out, 'report.json'), JSON.stringify(report, null, 2));

  console.log(`plate ${w}×${h}, ${files.length} variant(s)`);
  console.log(`nail mask: ${kept.length} blob(s) (expected ${o.expect}) ${maskOk ? 'OK' : 'CHECK'}`);
  for (const v of perVariant) {
    console.log(`  ${v.ok ? 'OK   ' : 'CHECK'} ${v.file.padEnd(28)} shift ${String(v.shift).padEnd(6)} changed outside nails ${v.changedOutsideNails}%`);
  }
  console.log(`→ ${o.out}/heatmap.jpg, nails.mask.png, thumbs-200.jpg, report.json`);
  console.log(failed ? 'RESULT: CHECK (see above)' : 'RESULT: PASS');
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
