#!/usr/bin/env node
// Upscales hand photos to 2K without the "plastic skin" look of plain Real-ESRGAN.
//
// Tested on the v4r2 plate (2026-11-22, docs/v4-assets-review/v4r2/upscale-test/):
//   - plain Lanczos upscale: natural texture, but soft
//   - Real-ESRGAN x4plus:    crisp nail edges and highlights, but skin and linen turn waxy
//   - this script:           Real-ESRGAN inside the nail mask; elsewhere 60% Real-ESRGAN + 40% Lanczos;
//                            then the same seeded fine grain on every image
//
// All aligned images (plate, 12 variants, petals-on-nails, shape set) must be processed in ONE run with the
// same options, so the grain and sharpening are identical and the set stays aligned.
//
// Usage:
//   node scripts/assets/upscale.mjs <image|folder>... [options]
//
// Options:
//   --out <dir>        output folder (default: <first input folder>/upscaled)
//   --width <px>       output width (default 2752 = 2K for 16:9)
//   --mix <0..1>       Real-ESRGAN share outside the nail mask (default 0.6)
//   --grain <0..1>     grain amplitude, fraction of full range (default 0.02)
//   --seed <n>         grain seed, keep it fixed for a set (default 20261122)
//   --mask <png>       nail mask (white = nails) shared by every input; all inputs must be aligned to it
//   --mask-dir <dir>   per-image masks named <basename>.mask.png (used instead of --mask when present)
//   --feather <px>     mask feather radius at output size (default 2)
//   --compare [spec]   also write <name>.compare.jpg: plain | Real-ESRGAN | result, at 100%
//                      spec = "x,y,w,h;x,y,w,h" as fractions of the image (default: 3 crops for the plate)

import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { existsSync, statSync, readdirSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { BIN, TOOL_DIR } from './setup-realesrgan.mjs';

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;
const DEFAULT_COMPARE = [
  [0.552, 0.293, 0.174, 0.26], // nails
  [0.262, 0.469, 0.174, 0.26], // back of the hand
  [0.509, 0.625, 0.174, 0.26], // thumb and linen
];

function parseArgs(argv) {
  const opts = { inputs: [], width: 2752, mix: 0.6, grain: 0.02, seed: 20261122, feather: 2, compare: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--out') opts.out = next();
    else if (a === '--width') opts.width = Number(next());
    else if (a === '--mix') opts.mix = Number(next());
    else if (a === '--grain') opts.grain = Number(next());
    else if (a === '--seed') opts.seed = Number(next());
    else if (a === '--mask') opts.mask = next();
    else if (a === '--mask-dir') opts.maskDir = next();
    else if (a === '--feather') opts.feather = Number(next());
    else if (a === '--compare') {
      const v = argv[i + 1];
      if (v && !v.startsWith('--') && /^[\d.,;]+$/.test(v)) {
        opts.compare = v.split(';').map((r) => r.split(',').map(Number));
        i++;
      } else opts.compare = DEFAULT_COMPARE;
    } else if (a.startsWith('--')) throw new Error(`Unknown option ${a}`);
    else opts.inputs.push(a);
  }
  return opts;
}

function collectFiles(inputs) {
  const files = [];
  for (const p of inputs) {
    const st = statSync(p);
    if (st.isDirectory()) {
      for (const f of readdirSync(p).sort()) if (IMAGE_EXT.test(f)) files.push(path.join(p, f));
    } else files.push(p);
  }
  return files;
}

// Same seeded sequence for every image, so unchanged pixels stay identical across the set.
function grainField(n, seed) {
  let t = seed >>> 0;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    out[i] = (((r ^ (r >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  }
  return out;
}

function runEsrgan(input, cacheDir) {
  const hash = createHash('sha1').update(readFileSync(input)).digest('hex').slice(0, 10);
  const cached = path.join(cacheDir, `${path.parse(input).name}.${hash}.x4.png`);
  if (existsSync(cached)) return cached;
  const r = spawnSync(BIN, ['-i', input, '-o', cached, '-n', 'realesrgan-x4plus', '-m', path.join(TOOL_DIR, 'models')], {
    stdio: ['ignore', 'ignore', 'inherit'],
  });
  if (r.status !== 0 || !existsSync(cached)) throw new Error(`Real-ESRGAN failed on ${input}`);
  return cached;
}

async function loadMask(file, w, h, feather) {
  let img = sharp(file).resize(w, h, { fit: 'fill' }).greyscale();
  if (feather > 0) img = img.blur(Math.max(0.3, feather));
  return img.raw().toBuffer();
}

async function compareSheet(name, w, h, layers, regions, outFile) {
  const pad = 8;
  const labelH = 28;
  const crops = regions.map(([x, y, cw, ch]) => ({
    left: Math.round(x * w),
    top: Math.round(y * h),
    width: Math.round(cw * w),
    height: Math.round(ch * h),
  }));
  const cellW = Math.max(...crops.map((c) => c.width));
  const cellH = Math.max(...crops.map((c) => c.height));
  const W = layers.length * (cellW + pad) + pad;
  const H = crops.length * (cellH + labelH + pad) + pad;
  const composites = [];
  for (const [ri, crop] of crops.entries()) {
    for (const [ci, layer] of layers.entries()) {
      const left = pad + ci * (cellW + pad);
      const top = pad + ri * (cellH + labelH + pad);
      const tile = await sharp(layer.buf, { raw: { width: w, height: h, channels: 3 } }).extract(crop).png().toBuffer();
      composites.push({ input: tile, left, top: top + labelH });
      const svg = `<svg width="${cellW}" height="${labelH}"><text x="2" y="20" font-family="Helvetica, Arial" font-size="16" font-weight="bold" fill="#fff">${name} · ${layer.label}</text></svg>`;
      composites.push({ input: Buffer.from(svg), left, top });
    }
  }
  await sharp({ create: { width: W, height: H, channels: 3, background: '#404040' } })
    .composite(composites)
    .jpeg({ quality: 92, mozjpeg: true })
    .toFile(outFile);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.inputs.length) {
    console.log('Usage: node scripts/assets/upscale.mjs <image|folder>... [--out dir] [--mask nails.png] [--compare]');
    process.exit(1);
  }
  if (!existsSync(BIN)) throw new Error('Real-ESRGAN is not installed. Run: npm run assets:setup-upscaler');

  const files = collectFiles(opts.inputs);
  const firstDir = statSync(opts.inputs[0]).isDirectory() ? opts.inputs[0] : path.dirname(opts.inputs[0]);
  const outDir = opts.out ?? path.join(firstDir, 'upscaled');
  // Raw 4x results are large (~20 MB each); keep them in the git-ignored tools folder, shared across runs.
  const cacheDir = path.join(TOOL_DIR, '..', 'cache', 'esrgan');
  await mkdir(outDir, { recursive: true });
  await mkdir(cacheDir, { recursive: true });

  console.log(`${files.length} image(s) → ${outDir}  width=${opts.width} mix=${opts.mix} grain=${opts.grain} seed=${opts.seed}`);
  for (const file of files) {
    const t0 = Date.now();
    const name = path.parse(file).name;
    const meta = await sharp(file).metadata();
    const w = opts.width;
    const h = Math.round((meta.height * w) / meta.width);
    const n = w * h;

    const x4 = runEsrgan(file, cacheDir);
    const esr = await sharp(x4).resize(w, h, { kernel: 'lanczos3' }).removeAlpha().toColourspace('srgb').raw().toBuffer();
    const plain = await sharp(file).resize(w, h, { kernel: 'lanczos3' }).removeAlpha().toColourspace('srgb').raw().toBuffer();

    let maskFile = opts.mask;
    if (opts.maskDir && existsSync(path.join(opts.maskDir, `${name}.mask.png`))) maskFile = path.join(opts.maskDir, `${name}.mask.png`);
    const mask = maskFile ? await loadMask(maskFile, w, h, opts.feather) : null;

    const grain = grainField(n, opts.seed);
    const amp = opts.grain * 255;
    const out = Buffer.alloc(n * 3);
    for (let i = 0; i < n; i++) {
      const m = mask ? mask[i] / 255 : 0;
      const k = m + (1 - m) * opts.mix; // Real-ESRGAN share for this pixel
      const g = grain[i] * amp;
      for (let c = 0; c < 3; c++) {
        const j = i * 3 + c;
        const v = k * esr[j] + (1 - k) * plain[j] + g;
        out[j] = v < 0 ? 0 : v > 255 ? 255 : v;
      }
    }

    const outFile = path.join(outDir, `${name}.jpg`);
    await sharp(out, { raw: { width: w, height: h, channels: 3 } }).jpeg({ quality: 92, mozjpeg: true }).toFile(outFile);

    if (opts.compare) {
      await compareSheet(
        name,
        w,
        h,
        [
          { label: 'plain upscale', buf: plain },
          { label: 'Real-ESRGAN', buf: esr },
          { label: mask ? 'result (masked)' : 'result', buf: out },
        ],
        opts.compare,
        path.join(outDir, `${name}.compare.jpg`),
      );
    }
    console.log(`  ${name}: ${meta.width}×${meta.height} → ${w}×${h}${mask ? ' (nail mask)' : ''}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
