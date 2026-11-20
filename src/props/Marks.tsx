import React from 'react';
import {C} from '../theme';

/** Round badge with a drawn ✓ (good) or ✗ (wrong). `draw` 0..1 strokes the mark on. No emoji fonts needed. */
export const MarkBadge: React.FC<{kind: 'check' | 'cross'; x: number; y: number; size: number; scale?: number; draw?: number; rotate?: number}> = ({
  kind, x, y, size, scale = 1, draw = 1, rotate = 0,
}) => {
  const r = size / 2;
  const fill = kind === 'check' ? C.green : C.red;
  const shade = kind === 'check' ? C.greenShade : C.redShade;
  const sw = size * 0.14;
  const line = {fill: 'none', stroke: '#FFFFFF', strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, pathLength: 1, strokeDasharray: 1};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <circle cx={r * 0.12} cy={r * 0.12} r={r} fill={shade} />
      <circle r={r} fill={fill} />
      {kind === 'check' ? (
        <path d={`M ${-r * 0.45} ${r * 0.02} L ${-r * 0.12} ${r * 0.34} L ${r * 0.48} ${-r * 0.32}`} {...line} strokeDashoffset={1 - draw} />
      ) : (
        <>
          <path d={`M ${-r * 0.38} ${-r * 0.38} L ${r * 0.38} ${r * 0.38}`} {...line} strokeDashoffset={1 - Math.min(1, draw * 2)} />
          <path d={`M ${r * 0.38} ${-r * 0.38} L ${-r * 0.38} ${r * 0.38}`} {...line} strokeDashoffset={1 - Math.max(0, draw * 2 - 1)} />
        </>
      )}
    </g>
  );
};
