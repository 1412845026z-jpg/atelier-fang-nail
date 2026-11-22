#!/usr/bin/env node
// Installs the open-source Real-ESRGAN (ncnn-vulkan build, BSD-3-Clause) into .tools/realesrgan/.
// The binary is not committed; every machine runs this once.
//
//   node scripts/assets/setup-realesrgan.mjs                 # download from GitHub (~45–52 MB)
//   node scripts/assets/setup-realesrgan.mjs --from-zip x.zip  # use a zip you already have

import { mkdir, writeFile, rm, chmod } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const TOOL_DIR = path.join(ROOT, '.tools/realesrgan');
export const BIN = path.join(TOOL_DIR, process.platform === 'win32' ? 'realesrgan-ncnn-vulkan.exe' : 'realesrgan-ncnn-vulkan');

const RELEASE = 'https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/';
const ASSET = {
  darwin: 'realesrgan-ncnn-vulkan-20220424-macos.zip',
  linux: 'realesrgan-ncnn-vulkan-20220424-ubuntu.zip',
  win32: 'realesrgan-ncnn-vulkan-20220424-windows.zip',
}[process.platform];

async function main() {
  if (existsSync(BIN)) {
    console.log(`Real-ESRGAN is already installed: ${BIN}`);
    return;
  }
  if (!ASSET) throw new Error(`No Real-ESRGAN build for platform "${process.platform}"`);

  await mkdir(TOOL_DIR, { recursive: true });
  const fromZip = process.argv.indexOf('--from-zip');
  let zipPath;
  if (fromZip !== -1) {
    zipPath = path.resolve(process.argv[fromZip + 1]);
  } else {
    const url = RELEASE + ASSET;
    console.log(`Downloading ${url}`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: HTTP ${res.status}`);
    zipPath = path.join(TOOL_DIR, ASSET);
    await writeFile(zipPath, Buffer.from(await res.arrayBuffer()));
  }

  let r = spawnSync('unzip', ['-q', '-o', zipPath, '-d', TOOL_DIR], { stdio: 'inherit' });
  if (r.status !== 0) r = spawnSync('tar', ['-xf', zipPath, '-C', TOOL_DIR], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('Could not unpack the zip (needs unzip or tar)');

  // Demo files that ship with the release are not needed.
  for (const f of ['input.jpg', 'input2.jpg', 'onepiece_demo.mp4']) {
    await rm(path.join(TOOL_DIR, f), { force: true });
  }
  if (fromZip === -1) await rm(zipPath, { force: true });
  if (process.platform !== 'win32') await chmod(BIN, 0o755);

  if (!existsSync(BIN)) throw new Error(`Unpacked, but ${BIN} is missing`);
  console.log(`Installed: ${BIN}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
