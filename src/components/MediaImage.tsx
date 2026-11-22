import React, { useState } from 'react';
import { resolveAssetUrl } from '../utils/assetUrl';

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
  loading?: 'eager' | 'lazy';
  objectPosition?: string;
}

export const MediaImage: React.FC<MediaImageProps> = ({
  src,
  alt,
  className = '',
  style,
  dark = false,
  loading = 'lazy',
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

  return (
    <img
      src={resolveAssetUrl(src)}
      alt={alt}
      loading={loading}
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      className={className}
      style={{ objectPosition, ...style }}
    />
  );
};
