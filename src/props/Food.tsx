import React from 'react';
import {C} from '../theme';

// Flat food props (faceless), each with a same-hue shade side. Centered on (x, y), `size` ≈ overall width.

/** Ramen bowl: red bowl, broth, wavy noodles, half egg, fish-cake swirl, chopsticks, optional steam (0..1). */
export const Ramen: React.FC<{x: number; y: number; size: number; steam?: number; rotate?: number}> = ({x, y, size: s, steam = 0, rotate = 0}) => {
  const r = s * 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {/* chopsticks behind */}
      <g stroke={C.charcoal} strokeWidth={s * 0.045} strokeLinecap="round">
        <line x1={s * 0.05} y1={-s * 0.05} x2={s * 0.52} y2={-s * 0.52} />
        <line x1={s * 0.15} y1={-s * 0.02} x2={s * 0.6} y2={-s * 0.4} />
      </g>
      {/* broth */}
      <ellipse cx={0} cy={-s * 0.02} rx={r * 0.96} ry={s * 0.14} fill={C.owlTan} />
      {/* noodles */}
      {[-0.22, 0, 0.22].map((dx) => (
        <path key={dx} d={`M ${s * (dx - 0.1)} ${-s * 0.02} q ${s * 0.05} ${-s * 0.06} ${s * 0.1} 0 t ${s * 0.1} 0`} fill="none" stroke={C.owlCream} strokeWidth={s * 0.035} strokeLinecap="round" />
      ))}
      {/* half egg */}
      <ellipse cx={-s * 0.24} cy={-s * 0.07} rx={s * 0.11} ry={s * 0.08} fill="#FFFFFF" />
      <circle cx={-s * 0.24} cy={-s * 0.07} r={s * 0.045} fill={C.orange} />
      {/* fish-cake swirl */}
      <circle cx={s * 0.24} cy={-s * 0.06} r={s * 0.08} fill="#FFFFFF" />
      <path d={`M ${s * 0.24} ${-s * 0.06} m ${-s * 0.035} 0 a ${s * 0.035} ${s * 0.035} 0 1 1 ${s * 0.035} ${s * 0.035}`} fill="none" stroke={C.pink} strokeWidth={s * 0.022} strokeLinecap="round" />
      {/* bowl */}
      <path d={`M ${-r} 0 L ${r} 0 A ${r} ${r * 0.8} 0 0 1 ${-r} 0 Z`} fill={C.redShade} />
      <path d={`M ${-r} 0 L ${r * 0.72} 0 A ${r} ${r * 0.8} 0 0 1 ${-r} 0 Z`} fill={C.red} />
      <rect x={-r * 0.32} y={r * 0.74} width={r * 0.64} height={s * 0.06} rx={s * 0.03} fill={C.redShade} />
      {steam > 0 &&
        [-0.16, 0.04].map((dx, i) => (
          <path key={dx} d={`M ${s * dx} ${-s * 0.2} q ${s * 0.08} ${-s * 0.1} 0 ${-s * 0.2} t 0 ${-s * 0.2}`} fill="none" stroke={C.grayShade} strokeWidth={s * 0.045} strokeLinecap="round"
            opacity={0.5 + 0.5 * Math.sin(steam * 6 + i * 2)} transform={`translate(0 ${-((steam * 40 + i * 14) % 18)})`} />
        ))}
    </g>
  );
};

/** Nigiri sushi: rice block, salmon slice with stripes, nori band. */
export const Sushi: React.FC<{x: number; y: number; size: number; rotate?: number}> = ({x, y, size: s, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect x={-s * 0.42} y={-s * 0.02} width={s * 0.84} height={s * 0.3} rx={s * 0.14} fill={C.lightGray} />
    <rect x={-s * 0.42} y={-s * 0.02} width={s * 0.74} height={s * 0.3} rx={s * 0.14} fill="#FFFFFF" />
    <rect x={-s * 0.5} y={-s * 0.2} width={s * 1.0} height={s * 0.26} rx={s * 0.13} fill={C.orangeShade} />
    <rect x={-s * 0.5} y={-s * 0.2} width={s * 0.9} height={s * 0.26} rx={s * 0.13} fill={C.orange} />
    {[-0.24, -0.04, 0.16].map((dx) => (
      <line key={dx} x1={s * dx} y1={-s * 0.17} x2={s * (dx + 0.1)} y2={s * 0.03} stroke="#FFFFFF" strokeWidth={s * 0.03} strokeLinecap="round" opacity={0.7} />
    ))}
    <rect x={-s * 0.08} y={-s * 0.22} width={s * 0.16} height={s * 0.52} rx={s * 0.03} fill={C.charcoal} />
  </g>
);

/** Burger: sesame bun, lettuce, cheese drip, patty, bottom bun. */
export const Burger: React.FC<{x: number; y: number; size: number; rotate?: number}> = ({x, y, size: s, rotate = 0}) => {
  const w = s * 0.9;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {/* bottom bun */}
      <rect x={-w / 2} y={s * 0.16} width={w} height={s * 0.16} rx={s * 0.08} fill={C.orangeShade} />
      <rect x={-w / 2} y={s * 0.16} width={w * 0.86} height={s * 0.16} rx={s * 0.08} fill={C.orange} />
      {/* patty */}
      <rect x={-w / 2 - s * 0.03} y={s * 0.02} width={w + s * 0.06} height={s * 0.15} rx={s * 0.075} fill={C.owlBrownShade} />
      <rect x={-w / 2 - s * 0.03} y={s * 0.02} width={w * 0.88} height={s * 0.15} rx={s * 0.075} fill={C.owlBrown} />
      {/* cheese */}
      <path d={`M ${-w / 2} ${s * 0.0} L ${w / 2} ${s * 0.0} L ${s * 0.14} ${s * 0.1} L ${s * 0.04} ${s * 0.03} L ${-s * 0.2} ${s * 0.12} Z`} fill={C.yellow} strokeLinejoin="round" stroke={C.yellow} strokeWidth={s * 0.02} />
      {/* lettuce */}
      <path d={`M ${-w / 2 - s * 0.04} ${-s * 0.02} q ${s * 0.06} ${s * 0.07} ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0`} fill="none" stroke={C.green} strokeWidth={s * 0.06} strokeLinecap="round" />
      {/* top bun */}
      <path d={`M ${-w / 2} ${-s * 0.04} A ${w / 2} ${s * 0.34} 0 0 1 ${w / 2} ${-s * 0.04} Z`} fill={C.orangeShade} />
      <path d={`M ${-w / 2} ${-s * 0.04} A ${w * 0.43} ${s * 0.32} 0 0 1 ${w * 0.36} ${-s * 0.04} Z`} fill={C.orange} />
      {[[-0.2, -0.22], [0.02, -0.28], [-0.05, -0.14], [0.18, -0.18], [-0.32, -0.12]].map(([dx, dy]) => (
        <ellipse key={`${dx}${dy}`} cx={s * dx} cy={s * dy} rx={s * 0.03} ry={s * 0.018} fill={C.owlCream} />
      ))}
    </g>
  );
};
