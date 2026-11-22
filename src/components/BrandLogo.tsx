import React from 'react';
import { SITE_CONFIG } from '../config';

interface BrandLogoProps {
  color?: string;
  size?: 'sm' | 'md';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  color = '#241E1A',
  size = 'sm',
}) => {
  const iconSize = size === 'sm' ? 18 : 24;
  return (
    <span className="inline-flex items-center gap-2.5 select-none" style={{ color }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M 12 2.5 C 15.8 2.5 18.2 9.4 18.2 15.6 C 18.2 19.3 15.5 21.5 12 21.5 C 8.5 21.5 5.8 19.3 5.8 15.6 C 5.8 9.4 8.2 2.5 12 2.5 Z"
          stroke={color}
          strokeWidth="1.2"
        />
        <path
          d="M 8.2 7.2 Q 12 5.2 15.8 7.2"
          stroke="#A7C1D9"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="font-editorial leading-none tracking-[-0.015em]"
        style={{ fontSize: size === 'sm' ? '20px' : '26px', color }}
      >
        {SITE_CONFIG.brandName}
      </span>
    </span>
  );
};
