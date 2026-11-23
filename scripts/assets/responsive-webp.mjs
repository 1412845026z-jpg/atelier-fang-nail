#!/usr/bin/env node
// Generates responsive WebP variants (2752 / 1600 / 900 widths) from the 2K assets
// plus flower, master, mid-petals, and scaled masks for fast desktop & mobile delivery.

import sharp from 'sharp';
import { readdirSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const V4 = path.join(ROOT, 'public/media/v4');
const OUT = path.join(V4, 'web');

async function emitSizes(srcFile, outPrefix, widths, quality = 86) {
  for (const w of widths) {
    const meta = await sharp(srcFile).metadata();
    const targetW = Math.min(w, meta.width);
    const outFile = path.join(OUT, `${outPrefix}-${w}.webp`);
    await sharp(srcFile)
      .resize(targetW, null, { withoutEnlargement: false, kernel: 'lanczos3' })
      .webp({ quality, smartSubsample: true })
      .toFile(outFile);
  }
}

async function main() {
  await mkdir(path.join(OUT, 'hands'), { recursive: true });
  await mkdir(path.join(OUT, 'self'), { recursive: true });

  // 1. 2K hands (01..12) + petals-on-nails + card-in-scene -> 2752, 1600, 900 WebP
  for (let i = 1; i <= 12; i++) {
    const id = String(i).padStart(2, '0');
    await emitSizes(path.join(V4, `2k/${id}.jpg`), `hands/${id}`, [2752, 1600, 900], 85);
  }
  await emitSizes(path.join(V4, '2k/petals-on-nails.jpg'), 'petals-on-nails', [2752, 1600, 900], 85);
  await emitSizes(path.join(V4, '2k/card-in-scene.jpg'), 'card-in-scene', [2752, 1600, 900], 85);

  // 2. Opening keyframes & continuous master (flower, mid-petals, master) -> 1600 & 900 WebP
  await emitSizes(path.join(V4, 'flower.jpg'), 'flower', [1600, 900], 86);
  await emitSizes(path.join(V4, 'mid-petals.jpg'), 'mid-petals', [1600, 900], 86);
  await emitSizes(path.join(V4, 'master.jpg'), 'master', [1600, 900], 85);

  // 3. Self-design 2K shapes & techniques -> 1600 & 900 WebP (fast WebGL/Canvas texture load!)
  for (const f of readdirSync(path.join(V4, 'self-2k')).sort()) {
    if (!f.endsWith('.jpg')) continue;
    const base = path.parse(f).name;
    await emitSizes(path.join(V4, 'self-2k', f), `self/${base}`, [1600, 900], 85);
  }

  // 4. Also emit crisp 1600 & 900 feathered PNG/WebP masks for self shapes & main nails.mask
  await sharp(path.join(V4, 'nails.mask.png')).resize(1600, 893).blur(2.0).webp({ lossless: true }).toFile(path.join(OUT, 'nails-mask-1600.webp'));
  for (const f of readdirSync(path.join(V4, 'self')).sort()) {
    if (!f.endsWith('.mask.png')) continue;
    const base = f.replace(/\.mask\.png$/, '');
    await sharp(path.join(V4, 'self', f)).resize(1600, 893).blur(1.8).png({ compressionLevel: 9 }).toFile(path.join(OUT, `self/${base}.mask.png`));
    await sharp(path.join(V4, 'self', f)).resize(900, 502).blur(1.2).png({ compressionLevel: 9 }).toFile(path.join(OUT, `self/${base}-900.mask.png`));
  }

  console.log('Responsive WebP assets generated in public/media/v4/web/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
