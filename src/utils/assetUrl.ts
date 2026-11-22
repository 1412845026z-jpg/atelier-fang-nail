/**
 * Resolves root-relative public asset paths (e.g. "/media/works/01.jpg")
 * against Vite's configured BASE_URL so the app works identically on
 * root domains ("/"), local dev, and GitHub Pages subpaths ("/repo/").
 */
export function resolveAssetUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  const base = import.meta.env.BASE_URL || './';
  return base.endsWith('/') ? `${base}${clean}` : `${base}/${clean}`;
}
