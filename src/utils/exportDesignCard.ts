import { getDesignMeta, SITE_CONFIG } from '../config';
import { Lang, NailDesignItem } from '../types/nail';
import { resolveAssetUrl } from './assetUrl';
import { formatYen } from './designCodec';

/**
 * Exports a 1080×1350 luxury Japanese stationery-style Design Card PNG
 * featuring the real photorealistic manicured hand, champagne-gold hairline frame,
 * Garamond numbering, verbatim Japanese design name, and "イメージ" caption.
 */
export async function exportDesignCardPng(
  design: NailDesignItem,
  lang: Lang
): Promise<boolean> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  // 1. Sheer milk paper ground (#F7F1EE) + subtle blush border tint
  ctx.fillStyle = '#F7F1EE';
  ctx.fillRect(0, 0, W, H);

  // Delicate outer champagne-gold 1px stationery rule
  ctx.strokeStyle = 'rgba(199, 169, 127, 0.58)';
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);

  // 2. Load same-origin manicured hand photograph
  const imgUrl = resolveAssetUrl(design.handImage);
  const handImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load design photo for export'));
    img.src = imgUrl;
  });

  // Top header row
  const today = new Date();
  const dateStamp = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(
    2,
    '0'
  )}.${String(today.getDate()).padStart(2, '0')}`;

  ctx.fillStyle = '#3B2B2C';
  ctx.font = '400 32px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(SITE_CONFIG.brandName, 74, 102);

  ctx.fillStyle = '#7E6B6C';
  ctx.font = '400 21px "Cormorant Garamond", Georgia, serif';
  ctx.textAlign = 'right';
  ctx.fillText(`No.${design.number}   ·   ${dateStamp}`, W - 74, 100);
  ctx.textAlign = 'left';

  // Framed 4:3 hand portrait focused gracefully on the manicured hand
  const frameX = 72;
  const frameY = 138;
  const frameW = W - 144; // 936
  const frameH = 830;

  // Compute cover crop slightly shifted toward x=61% where the 5 nails sit
  const imgRatio = handImg.naturalWidth / handImg.naturalHeight;
  const boxRatio = frameW / frameH;
  let sx = 0;
  let sy = 0;
  let sw = handImg.naturalWidth;
  let sh = handImg.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = handImg.naturalHeight * boxRatio;
    sx = Math.min(handImg.naturalWidth - sw, (handImg.naturalWidth - sw) * 0.68);
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

  // Subtle champagne-gold hairline around photo
  ctx.strokeStyle = 'rgba(199, 169, 127, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(frameX, frameY, frameW, frameH);

  // Small refined 「イメージ」 caption bottom-right of image
  ctx.fillStyle = 'rgba(247, 241, 238, 0.85)';
  ctx.fillRect(frameX + frameW - 96, frameY + frameH - 36, 84, 26);
  ctx.fillStyle = '#7E6B6C';
  ctx.font = '300 15px "Zen Kaku Gothic New", "Noto Sans JP", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('イメージ', frameX + frameW - 54, frameY + frameH - 18);
  ctx.textAlign = 'left';

  // 3. Stationery bottom metadata block
  const meta = getDesignMeta(design);
  const metaY = frameY + frameH + 66;

  // Color pearl dot + Garamond number
  ctx.beginPath();
  ctx.arc(88, metaY - 12, 12, 0, Math.PI * 2);
  ctx.fillStyle = design.liquidHex;
  ctx.fill();
  ctx.strokeStyle = 'rgba(199, 169, 127, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#C7A97F';
  ctx.font = '400 22px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`No.${design.number}  /  ${meta.label[lang]}`, 114, metaY - 5);

  // Verbatim Japanese Design Name
  ctx.fillStyle = '#3B2B2C';
  ctx.font = '400 40px "Zen Old Mincho", "Shippori Mincho B1", serif';
  ctx.fillText(design.name.ja, 74, metaY + 56);

  // English subtitle + estimate
  ctx.fillStyle = '#7E6B6C';
  ctx.font = 'italic 400 24px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(design.name.en, 74, metaY + 98);

  // Fine divider
  ctx.strokeStyle = 'rgba(59, 43, 44, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(74, metaY + 132);
  ctx.lineTo(W - 74, metaY + 132);
  ctx.stroke();

  // Footer row: price · duration · studio IG
  ctx.fillStyle = '#3B2B2C';
  ctx.font = '400 22px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(
    `${formatYen(meta.priceYen)}   ·   ${meta.durationMin} min`,
    74,
    metaY + 174
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#7E6B6C';
  ctx.font = '400 20px "Cormorant Garamond", Georgia, serif';
  ctx.fillText(`@${SITE_CONFIG.contact.instagramHandle}   ·   Tokyo`, W - 74, metaY + 174);
  ctx.textAlign = 'left';

  // Trigger download
  const pngUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `sou-nail-no${design.number}.png`;
  link.href = pngUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
