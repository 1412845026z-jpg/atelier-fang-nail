import React from 'react';

export type BeatPhase = 'before' | 'active' | 'after';

interface MaskedLinesProps {
  lines: string[];
  phase: BeatPhase;
  reducedMotion?: boolean;
  className?: string;
  lineClassName?: string;
  staggerSec?: number;
}

export const MaskedLines: React.FC<MaskedLinesProps> = ({
  lines,
  phase,
  reducedMotion = false,
  className = '',
  lineClassName = '',
  staggerSec = 0.08,
}) => {
  return (
    <div className={className}>
      {lines.map((line, idx) => {
        const delay = reducedMotion ? '0s' : `${idx * staggerSec}s`;

        let transform = 'translate3d(0, 105%, 0)';
        let opacity = 0;
        let filter = 'blur(0px)';

        if (reducedMotion || phase === 'active') {
          transform = 'translate3d(0, 0%, 0)';
          opacity = 1;
          filter = 'blur(0px)';
        } else if (phase === 'after') {
          transform = 'translate3d(0, -32%, 0)';
          opacity = 0;
          filter = 'blur(4px)';
        }

        return (
          <div key={`${idx}-${line}`} className="overflow-hidden py-[0.06em]">
            <div
              className={lineClassName}
              style={{
                transform,
                opacity,
                filter,
                transitionProperty: 'transform, opacity, filter',
                transitionDuration: reducedMotion ? '0s' : phase === 'after' ? '0.65s' : '0.95s',
                transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                transitionDelay: phase === 'active' ? delay : '0s',
                willChange: 'transform, opacity',
              }}
            >
              {line}
            </div>
          </div>
        );
      })}
    </div>
  );
};
