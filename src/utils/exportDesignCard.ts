import { SITE_CONFIG } from '../config';
import { Lang, NailDesignState } from '../types/nail';
import { estimateDesign, formatYen } from './designCodec';
import { resolveAssetUrl } from './assetUrl';

/**
 * Exports a 1080×1350 Instagram-ready vertical Specimen Design Card PNG.
 * Draws the same-origin base photo + serialized SVG nail overlay onto an offscreen canvas
 * framed in our quiet Tokyo gallery oatmeal-paper stationery layout.
 */
export async function exportDesignCardPng(params: {
  svgElement: SVGSVGElement | null;
  handImageHref: string;
  design: NailDesignState;
  lang: Lang;
}): Promise<boolean> {
  const { svgElement, handImageHref, design, lang } = params;
  if (!svgElement) return false;

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // 1. Editorial oatmeal paper background
  ctx.fillStyle = '#F2EEE8';
  ctx.fillRect(0, 0, W, H);

  // Subtle architectural outer hairline border
  ctx.strokeStyle = 'rgba(36, 30, 26, 0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);

  // 2. Load same-origin base hand photo
  const imgUrl = resolveAssetUrl(handImageHref);
  const handImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load base hand image for export'));
    img.src = imgUrl;
  });

  // Photo viewport box inside card (1080 - 120 = 960 wide x 940 tall)
  const frameX = 60;
  const frameY = 126;
  const frameW = W - 120;
  const frameH = 930;

  // Serialize SVG overlay WITHOUT the <image> tag (so no tainted external ref issues)
  // and render the hand photo first using the exact same "xMidYMid slice" math!
  const vb = svgElement.viewBox.baseVal;
  const vbW = vb.width || 1376;
  const vbH = vb.height || 768;

  // xMidYMid slice mapping from viewBox (vbW x vbH) -> (frameW x frameH)
  const scale = Math.max(frameW / vbW, frameH / vbH);
  const drawW = vbW * scale;
  const drawH = vbH * scale;
  const offsetX = frameX + (frameW - drawW) * 0.5;
  const offsetY = frameY + (frameH - drawH) * 0.5;

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();

  ctx.drawImage(handImg, offsetX, offsetY, drawW, drawH);

  // Clone SVG, hide base <image> & interactive calibration/split chrome, serialize cleanly
  const clone = svgElement.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(vbW));
  clone.setAttribute('height', String(vbH));
  clone.querySelectorAll('[data-export-exclude="true"]').forEach((el) => el.remove());

  const svgStr = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const overlayImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('SVG serialization draw failed'));
      img.src = svgUrl;
    });
    ctx.drawImage(overlayImg, offsetX, offsetY, drawW, drawH);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }

  ctx.restore();

  // Crisp 1px frame around photo
  ctx.strokeStyle = 'rgba(36, 30, 26, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // 3. Top specimen header bar
  const est = estimateDesign(design);
  const today = new Date();
  const dateStamp = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}.${String(today.getDate()).padStart(2, '0')}`;

  ctx.fillStyle = '#241E1A';
  ctx.font = '400 28px Georgia, "Shippori Mincho", serif';
  ctx.fillText(SITE_CONFIG.brandName, 62, 96);

  ctx.fillStyle = '#8A8178';
  ctx.font = '400 18px "Geist Mono", ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`SPECIMEN ${est.specimenCode} · ${dateStamp}`, W - 62, 94);
  ctx.textAlign = 'left';

  // 4. Bottom Specimen Label Card
  const metaY = frameY + frameH + 54;

  // Powder-blue 4px specimen vertical bar
  ctx.fillStyle = '#A7C1D9';
  ctx.fillRect(60, metaY - 26, 4, 152);

  // Design summary title
  ctx.fillStyle = '#241E1A';
  ctx.font = '400 34px Georgia, "Shippori Mincho", serif';
  const titleText = est.summaryText[lang];
  ctx.fillText(titleText.length > 34 ? `${titleText.slice(0, 34)}…` : titleText, 84, metaY + 8);

  // Sub-row: menu + estimated Yen + duration
  ctx.fillStyle = '#8A8178';
  ctx.font = '400 19px "Geist Mono", ui-monospace, monospace';
  ctx.fillText(
    `${est.menuName[lang]}   ·   ${formatYen(est.estimatedYen)}   ·   ${est.estimatedMinutes} MIN`,
    84,
    metaY + 54
  );

  // Five miniature color dots representing each finger's formula
  design.fingers.forEach((f, idx) => {
    const sw = SITE_CONFIG.palette.find((p) => p.id === f.colorId);
    const x = 84 + idx * 34;
    const y = metaY + 100;
    ctx.beginPath();
    ctx.arc(x + 9, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = sw?.hex || '#EDE6DF';
    ctx.fill();
    ctx.strokeStyle = 'rgba(36, 30, 26, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Right-side studio signature
  ctx.textAlign = 'right';
  ctx.fillStyle = '#8A8178';
  ctx.font = '400 17px "Geist Mono", ui-monospace, monospace';
  ctx.fillText(`@${SITE_CONFIG.contact.instagramHandle}`, W - 62, metaY + 105);
  ctx.textAlign = 'left';

  // 5. Trigger PNG download
  const pngUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `sou-nail-specimen-${est.specimenCode.replace(/\./g, '').toLowerCase()}.png`;
  link.href = pngUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
