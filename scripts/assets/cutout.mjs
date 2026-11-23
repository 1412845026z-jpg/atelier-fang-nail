#!/usr/bin/env node
// Open-source transparent cutout utility for bottles & self-design accents.
// Uses @imgly/background-removal-node (installed in git-ignored .tools/cutout/).

import { existsSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CUTOUT_DIR = path.join(ROOT, '.tools/cutout');
const requireCutout = createRequire(path.join(CUTOUT_DIR, 'package.json'));
const { removeBackground } = requireCutout('@imgly/background-removal-node');
const sharp = requireCutout('sharp');

const PUBLIC_PATH = pathToFileURL(
  path.join(CUTOUT_DIR, 'node_modules/@imgly/background-removal-node/dist/')
).href;

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

function parseArgs(argv) {
  const o = { inputs: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') o.out = argv[++i];
    else if (a === '--save-alpha') o.saveAlpha = argv[++i];
    else if (a === '--use-alpha') o.useAlpha = argv[++i];
    else o.inputs.push(a);
  }
  return o;
}

function collect(inputs) {
  const out = [];
  for (const p of inputs) {
    if (statSync(p).isDirectory()) {
      for (const f of readdirSync(p).sort()) if (IMAGE_EXT.test(f)) out.push(path.join(p, f));
    } else out.push(p);
  }
  return out;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  if (!o.inputs.length || !o.out) {
    console.error('Usage: node scripts/assets/cutout.mjs <inputs...> --out <dir>');
    process.exit(1);
  }
  await mkdir(o.out, { recursive: true });
  const files = collect(o.inputs);

  let sharedAlpha = null;
  if (o.useAlpha && existsSync(o.useAlpha)) {
    const { data, info } = await sharp(o.useAlpha).greyscale().raw().toBuffer({ resolveWithObject: true });
    sharedAlpha = { data, w: info.width, h: info.height };
  }

  for (const f of files) {
    const name = path.parse(f).name;
    const { data: rgb, info } = await sharp(f).removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
    const { width: w, height: h } = info;
    let alphaBuf;

    if (sharedAlpha && sharedAlpha.w === w && sharedAlpha.h === h) {
      alphaBuf = sharedAlpha.data;
    } else {
      const blob = await removeBackground(pathToFileURL(path.resolve(f)).href, {
        publicPath: PUBLIC_PATH,
        output: { format: 'image/png', quality: 1 },
      });
      const pngBuf = Buffer.from(await blob.arrayBuffer());
      const { data: rgba } = await sharp(pngBuf).resize(w, h).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      alphaBuf = Buffer.alloc(w * h);
      for (let i = 0; i < w * h; i++) alphaBuf[i] = rgba[i * 4 + 3];
      if (o.saveAlpha) {
        await sharp(alphaBuf, { raw: { width: w, height: h, channels: 1 } }).png().toFile(o.saveAlpha);
      }
    }

    const outRgba = Buffer.alloc(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      outRgba[i * 4] = rgb[i * 3];
      outRgba[i * 4 + 1] = rgb[i * 3 + 1];
      outRgba[i * 4 + 2] = rgb[i * 3 + 2];
      outRgba[i * 4 + 3] = alphaBuf[i];
    }

    const outPng = path.join(o.out, `${name}.png`);
    writeFileSync(outPng, await sharp(outRgba, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer());
    console.log(`  cutout → ${outPng} (${w}×${h})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
