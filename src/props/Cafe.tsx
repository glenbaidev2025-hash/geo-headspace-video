import React from 'react';
import {C} from '../theme';

/** Café counter: top slab + front panel with a shade strip. */
export const Counter: React.FC<{x: number; y: number; w: number; h: number; color?: string; shade?: string}> = ({x, y, w, h, color = C.orange, shade = C.orangeShade}) => (
  <g>
    <rect x={x} y={y + 26} width={w} height={h - 26} fill={shade} />
    <rect x={x} y={y + 26} width={w - 34} height={h - 26} fill={color} />
    <rect x={x - 24} y={y} width={w + 48} height={34} rx={17} fill={C.charcoal} />
    {[0.3, 0.62].map((t) => (
      <rect key={t} x={x + 30} y={y + 26 + (h - 26) * t} width={w - 94} height={10} rx={5} fill={shade} opacity={0.6} />
    ))}
  </g>
);

/** Takeaway cup with sleeve and lid (faceless, no logo). `steam` 0..1 animates two steam curls. */
export const Cup: React.FC<{x: number; y: number; size: number; steam?: number; rotate?: number}> = ({x, y, size: s, steam = 0, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <path d={`M ${-s * 0.32} ${-s * 0.5} L ${s * 0.32} ${-s * 0.5} L ${s * 0.25} ${s * 0.5} L ${-s * 0.25} ${s * 0.5} Z`} fill="#FFFFFF" />
    <path d={`M ${s * 0.16} ${-s * 0.5} L ${s * 0.32} ${-s * 0.5} L ${s * 0.25} ${s * 0.5} L ${s * 0.12} ${s * 0.5} Z`} fill={C.lightGray} />
    <path d={`M ${-s * 0.3} ${-s * 0.12} L ${s * 0.3} ${-s * 0.12} L ${s * 0.27} ${s * 0.22} L ${-s * 0.27} ${s * 0.22} Z`} fill={C.owlTan} />
    <rect x={-s * 0.38} y={-s * 0.64} width={s * 0.76} height={s * 0.16} rx={s * 0.06} fill={C.charcoal} />
    {steam > 0 &&
      [-0.12, 0.12].map((dx, i) => (
        <path key={dx} d={`M ${s * dx} ${-s * 0.72} q ${s * 0.1} ${-s * 0.12} 0 ${-s * 0.24} t 0 ${-s * 0.24}`} fill="none" stroke={C.grayShade} strokeWidth={s * 0.06} strokeLinecap="round"
          opacity={steam * (0.5 + 0.5 * Math.sin(i * 2))} transform={`translate(0 ${-((steam * 40 + i * 12) % 20)})`} />
      ))}
  </g>
);

/**
 * Speech bubble: rounded box with a tail pointing at (tx, ty). Content goes in children, positioned
 * relative to the box center. Flat fill + shade offset, like the characters.
 */
export const SpeechBubble: React.FC<{x: number; y: number; w: number; h: number; tx: number; ty: number; scale?: number; color?: string; shade?: string; children?: React.ReactNode}> = ({
  x, y, w, h, tx, ty, scale = 1, color = '#FFFFFF', shade = C.lightGray, children,
}) => {
  const r = Math.min(w, h) * 0.32;
  // tail base sits on the box edge nearest the target
  const bx = Math.max(x - w / 2 + r, Math.min(x + w / 2 - r, tx));
  const below = ty > y;
  const by = below ? y + h / 2 - 4 : y - h / 2 + 4;
  const tail = `M ${bx - 26} ${by} L ${tx} ${ty} L ${bx + 26} ${by} Z`;
  return (
    <g transform={`translate(${tx} ${ty}) scale(${scale}) translate(${-tx} ${-ty})`}>
      <g transform="translate(10 10)">
        <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r} fill={shade} />
        <path d={tail} fill={shade} strokeLinejoin="round" stroke={shade} strokeWidth={10} />
      </g>
      <path d={tail} fill={color} strokeLinejoin="round" stroke={color} strokeWidth={10} />
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={r} fill={color} />
      <g transform={`translate(${x} ${y})`}>{children}</g>
    </g>
  );
};

/** Three speed lines ("whoosh"), for fast speech. */
export const SpeedLines: React.FC<{x: number; y: number; size: number; f: number; color?: string}> = ({x, y, size: s, f, color = C.grayShade}) => (
  <g transform={`translate(${x} ${y})`}>
    {[-1, 0, 1].map((i) => {
      const len = s * (0.7 + 0.3 * Math.sin(f * 0.8 + i * 2));
      return <line key={i} x1={0} y1={i * s * 0.32} x2={-len} y2={i * s * 0.32} stroke={color} strokeWidth={s * 0.11} strokeLinecap="round" />;
    })}
  </g>
);
