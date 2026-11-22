import React from 'react';
import { SITE_CONFIG } from '../config';

interface BrandLogoProps {
  color?: string;
  accentColor?: string;
  size?: 'sm' | 'md' | 'lg';
  shortOnly?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  color = '#3B2B2C',
  accentColor = '#C7A97F',
  size = 'sm',
  shortOnly = false,
}) => {
  const markSize = size === 'lg' ? 26 : size === 'md' ? 20 : 16;
  const wordSize =
    size === 'lg'
      ? 'text-[34px] sm:text-[42px]'
      : size === 'md'
        ? 'text-[22px]'
        : 'text-[18px]';
  const subSize = size === 'lg' ? 'text-[13px]' : 'text-[10px]';

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      {/* Minimalist curved gel-petal emblem */}
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M12 2.4 C16.3 2.4 18.6 8.4 18.6 14.6 C18.6 18.9 15.8 21.4 12 21.4 C8.2 21.4 5.4 18.9 5.4 14.6 C5.4 8.4 7.7 2.4 12 2.4 Z"
          stroke={color}
          strokeWidth="1.05"
        />
        <path
          d="M8.6 7.8 Q12 5.4 15.4 7.8"
          stroke="#C9989A"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <circle cx="12" cy="17.2" r="1.2" fill={accentColor} />
      </svg>

      <span className="inline-flex items-baseline gap-2 leading-none">
        <span
          className={`font-garamond tracking-[0.06em] ${wordSize}`}
          style={{ color }}
        >
          {SITE_CONFIG.brandShort}
        </span>
        {!shortOnly && (
          <span
            className={`font-garamond italic tracking-[0.14em] opacity-65 ${subSize}`}
            style={{ color }}
          >
            nail atelier
          </span>
        )}
      </span>
    </span>
  );
};
