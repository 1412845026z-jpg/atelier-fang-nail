import { SITE_CONFIG } from '../config';
import { ActiveCardSpec, Lang } from '../types/nail';
import { resolveAssetUrl } from './assetUrl';
import { formatYen } from './designCodec';

/**
 * Exports a 1080×1350 luxury Japanese cotton stationery Design Card PNG
 * for either a curated 定番 preset or a custom セルフデザイン composite.
 */
export async function exportDesignCardPng(
  spec: ActiveCardSpec,
  lang: Lang,
  customHandDataUrl?: string | null
): Promise<boolean> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // Warm cotton paper ground + double champagne-gold hairline rule
  ctx.fillStyle = '#FAF6F1';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(199, 169, 127, 0.62)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.strokeStyle = 'rgba(199, 169, 127, 0.34)';
  ctx.lineWidth = 1;
  ctx.strokeRect(50, 50, W - 100, H - 100);

  const imgSrc =
    customHandDataUrl ||
    resolveAssetUrl(`/media/v4/web/hands/${spec.presetId || '02'}-1600.webp`);

  const handImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load hand image for card export'));
    img.src = imgSrc;
  });

  const today = new Date();
  const stamp = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}.${String(today.getDate()).padStart(2, '0')}`;

  ctx.fillStyle = '#3B2B2C';
  ctx.font = '400 32px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(SITE_CONFIG.brandName, 78, 108);

  ctx.fillStyle = '#7E6B6C';
  ctx.font = '400 22px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${spec.codeNumber}   ·   ${stamp}`, W - 78, 106);
  ctx.textAlign = 'left';

  // Framed close-up focused on the 5 manicured nails (centered around x ≈ 62% of the 16:9 hand plate)
  const frameX = 76;
  const frameY = 142;
  const frameW = W - 152;
  const frameH = 824;

  const imgRatio = handImg.naturalWidth / handImg.naturalHeight;
  const boxRatio = frameW / frameH;
  let sx = 0;
  let sy = 0;
  let sw = handImg.naturalWidth;
  let sh = handImg.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = handImg.naturalHeight * boxRatio;
    sx = Math.min(handImg.naturalWidth - sw, (handImg.naturalWidth - sw) * 0.64);
  } else {
    sh = handImg.naturalWidth / boxRatio;
    sy = (handImg.naturalHeight - sh) * 0.45;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(frameX, frameY, frameW, frameH);
  ctx.clip();
  ctx.drawImage(handImg, sx, sy, sw, sh, frameX, frameY, frameW, frameH);
  ctx.restore();

  ctx.strokeStyle = 'rgba(199, 169, 127, 0.42)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Discrete 「イメージ」 tag
  ctx.fillStyle = 'rgba(250, 246, 241, 0.84)';
  ctx.fillRect(frameX + frameW - 96, frameY + frameH - 36, 84, 26);
  ctx.fillStyle = '#7E6B6C';
  ctx.font = '300 15px "Zen Kaku Gothic New", "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('イメージ', frameX + frameW - 54, frameY + frameH - 18);
  ctx.textAlign = 'left';

  const metaY = frameY + frameH + 68;

  ctx.beginPath();
  ctx.arc(90, metaY - 11, 11, 0, Math.PI * 2);
  ctx.fillStyle = spec.swatchHex;
  ctx.fill();
  ctx.strokeStyle = 'rgba(199, 169, 127, 0.72)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#C7A97F';
  ctx.font = '400 22px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`${spec.codeNumber}   /   ${spec.subtitle[lang]}`, 116, metaY - 4);

  ctx.fillStyle = '#3B2B2C';
  ctx.font = '400 40px "Zen Old Mincho", "Shippori Mincho B1", serif';
  ctx.fillText(spec.title.ja, 78, metaY + 56);

  ctx.fillStyle = '#7E6B6C';
  ctx.font = 'italic 400 24px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(spec.title.en, 78, metaY + 96);

  ctx.strokeStyle = 'rgba(59, 43, 44, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(78, metaY + 130);
  ctx.lineTo(W - 78, metaY + 130);
  ctx.stroke();

  ctx.fillStyle = '#3B2B2C';
  ctx.font = '400 23px "Cormorant Garamond", Georgia, serif';
  const durLabel = lang === 'ja' ? `${spec.durationMin}分` : `${spec.durationMin} min`;
  ctx.fillText(`${formatYen(spec.priceYen)}   ·   ${durLabel}`, 78, metaY + 172);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7E6B6C';
  ctx.font = '400 20px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`@${SITE_CONFIG.contact.instagramHandle}   ·   Tokyo`, W - 78, metaY + 172);
  ctx.textAlign = 'left';

  const pngUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `sou-nail-${spec.codeNumber.toLowerCase().replace(/[^a-z0-9-]/g, '')}.png`;
  link.href = pngUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
