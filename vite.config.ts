import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Automatically probes `public/media/v4/video/{a,b,c,loop}.mp4` during dev, preview, and build,
 * keeping `manifest.json` synchronized so dropping video files into `public/media/v4/video/`
 * switches the site from the master-image fallback to video playback with zero code edits and zero 404s.
 */
function v4VideoManifestPlugin(): Plugin {
  const computeManifest = (rootDir: string) => {
    const vidDir = path.join(rootDir, 'public/media/v4/video');
    mkdirSync(vidDir, { recursive: true });
    const manifest = {
      a: existsSync(path.join(vidDir, 'a.mp4')),
      b: existsSync(path.join(vidDir, 'b.mp4')),
      c: existsSync(path.join(vidDir, 'c.mp4')),
      loop: existsSync(path.join(vidDir, 'loop.mp4')),
    };
    writeFileSync(path.join(vidDir, 'manifest.json'), JSON.stringify(manifest));
    return manifest;
  };

  let rootDir = process.cwd();

  return {
    name: 'v4-video-manifest',
    configResolved(cfg) {
      rootDir = cfg.root;
      computeManifest(rootDir);
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('/media/v4/video/manifest.json')) {
          const data = computeManifest(rootDir);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.includes('/media/v4/video/manifest.json')) {
          const distVid = path.join(rootDir, 'dist/media/v4/video');
          const pubVid = path.join(rootDir, 'public/media/v4/video');
          const check = (f: string) =>
            existsSync(path.join(distVid, f)) || existsSync(path.join(pubVid, f));
          const data = {
            a: check('a.mp4'),
            b: check('b.mp4'),
            c: check('c.mp4'),
            loop: check('loop.mp4'),
          };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(data));
          return;
        }
        next();
      });
    },
    buildStart() {
      computeManifest(rootDir);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), v4VideoManifestPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/scheduler/')
          ) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/gsap/') || id.includes('node_modules/lenis/')) {
            return 'motion-vendor';
          }
          return undefined;
        },
      },
    },
  },
});
