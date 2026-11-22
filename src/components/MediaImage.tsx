import React, { useState } from 'react';
import { resolveAssetUrl } from '../utils/assetUrl';

interface MediaImageProps {
  /** Base path without extension or full image path (e.g. "/media/works/01.webp") */
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  sizes?: string;
  /** Optional responsive smaller width variant suffix (e.g. 480 for "-480.webp") */
  smallWidth?: number;
  largeWidth?: number;
  objectPosition?: string;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt,
  className = '',
  style,
  dark = false,
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes = '(max-width: 768px) 85vw, 55vw',
  smallWidth,
  largeWidth = 896,
  objectPosition = 'center center',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (${src})`}
        className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}
        style={{
          backgroundColor: dark ? '#26221F' : '#E7E1D8',
          color: dark ? '#A69E95' : '#8A8178',
          border: dark
            ? '1px solid rgba(242, 238, 232, 0.14)'
            : '1px solid rgba(36, 30, 26, 0.15)',
          ...style,
        }}
      >
        <span className="font-label tracking-[0.08em] break-all">{src}</span>
      </div>
    );
  }

  const resolved = resolveAssetUrl(src);
  const isWebp = /\.webp$/i.test(resolved);
  const stem = isWebp ? resolved.replace(/\.webp$/i, '') : null;

  if (stem) {
    const avifSrcSet = smallWidth
      ? `${stem}-${smallWidth}.avif ${smallWidth}w, ${stem}.avif ${largeWidth}w`
      : `${stem}.avif`;
    const webpSrcSet = smallWidth
      ? `${stem}-${smallWidth}.webp ${smallWidth}w, ${stem}.webp ${largeWidth}w`
      : `${stem}.webp`;

    return (
      <picture className="block w-full h-full">
        <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} />
        <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} />
        <img
          src={resolved}
          alt={alt}
          loading={loading}
          decoding="async"
          fetchPriority={fetchPriority}
          draggable={false}
          onError={() => setFailed(true)}
          className={className}
          style={{ objectPosition, ...style }}
        />
      </picture>
    );
  }

  return (
    <img
      src={resolved}
      alt={alt}
      loading={loading}
      decoding="async"
      fetchPriority={fetchPriority}
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
      style={{ objectPosition, ...style }}
    />
  );
};
