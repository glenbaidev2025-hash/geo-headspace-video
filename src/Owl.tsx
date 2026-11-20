import React from 'react';
import {C} from './theme';

export type OwlProps = {
  x: number;
  y: number; // center of the body
  size: number; // body width
  squash?: number; // >1 = flatter (pivot at the bottom)
  rotate?: number;
  blink?: number; // 0 open .. 1 closed
  look?: {x: number; y: number}; // -1..1 pupil offset
  happy?: boolean; // eyes become smiling arcs
  wing?: number; // wing lift in degrees (wave/flap)
  headphones?: boolean;
  talk?: number; // 0..1 beak opens
};

/**
 * Owl Listen mascot in the flat geometric style: brown body with a darker shade side,
 * cream face discs, big dark eyes with a highlight, yellow beak, cream belly with tan
 * chevrons, ear tufts and green headphones.
 */
export const Owl: React.FC<OwlProps> = ({x, y, size: s, squash = 1, rotate = 0, blink = 0, look = {x: 0, y: 0}, happy = false, wing = 0, headphones = true, talk = 0}) => {
  const h = s * 1.08;
  const eyeR = s * 0.135;
  const discR = s * 0.27;
  const eyeY = -h * 0.12;
  const eyeDX = s * 0.21;
  const pdx = look.x * eyeR * 0.28;
  const pdy = look.y * eyeR * 0.25;
  const open = 1 - blink;
  const sw = s * 0.035;
  const beakOpen = talk * s * 0.05;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) translate(0 ${h / 2}) scale(${squash} ${1 / squash}) translate(0 ${-h / 2})`}>
      {/* ear tufts */}
      {[-1, 1].map((d) => (
        <path key={d} d={`M ${d * s * 0.2} ${-h * 0.4} L ${d * s * 0.46} ${-h * 0.6} L ${d * s * 0.42} ${-h * 0.28} Z`} fill={d > 0 ? C.owlBrownShade : C.owlBrown} strokeLinejoin="round" stroke={d > 0 ? C.owlBrownShade : C.owlBrown} strokeWidth={s * 0.05} />
      ))}
      {/* body with shade side */}
      <ellipse cx={s * 0.05} cy={0} rx={s / 2} ry={h / 2} fill={C.owlBrownShade} />
      <ellipse cx={-s * 0.02} cy={0} rx={s / 2 - s * 0.04} ry={h / 2} fill={C.owlBrown} />
      {/* belly */}
      <ellipse cx={0} cy={h * 0.24} rx={s * 0.27} ry={h * 0.22} fill={C.owlCream} />
      {[-1, 0, 1].map((i) => (
        <path key={i} d={`M ${i * s * 0.11 - s * 0.045} ${h * (0.22 + Math.abs(i) * 0.06)} q ${s * 0.045} ${s * 0.05} ${s * 0.09} 0`} fill="none" stroke={C.owlTan} strokeWidth={sw} strokeLinecap="round" />
      ))}
      {/* wings */}
      {[-1, 1].map((d) => (
        <g key={d} transform={`translate(${d * s * 0.42} ${h * 0.12}) rotate(${d * (8 + wing)})`}>
          <ellipse cx={0} cy={0} rx={s * 0.13} ry={h * 0.26} fill={C.owlBrownShade} />
        </g>
      ))}
      {/* face discs */}
      {[-1, 1].map((d) => (
        <circle key={d} cx={d * eyeDX} cy={eyeY} r={discR} fill={C.owlCream} />
      ))}
      {/* eyes */}
      {[-1, 1].map((d) =>
        happy ? (
          <path key={d} d={`M ${d * eyeDX - eyeR * 0.75} ${eyeY + eyeR * 0.15} Q ${d * eyeDX} ${eyeY - eyeR * 0.9} ${d * eyeDX + eyeR * 0.75} ${eyeY + eyeR * 0.15}`} fill="none" stroke={C.owlEye} strokeWidth={sw * 1.4} strokeLinecap="round" />
        ) : open > 0.15 ? (
          <g key={d} transform={`translate(${d * eyeDX + pdx} ${eyeY + pdy}) scale(1 ${open})`}>
            <circle r={eyeR} fill={C.owlEye} />
            <circle cx={eyeR * 0.35} cy={-eyeR * 0.38} r={eyeR * 0.28} fill="#FFFFFF" />
          </g>
        ) : (
          <line key={d} x1={d * eyeDX - eyeR * 0.8} y1={eyeY} x2={d * eyeDX + eyeR * 0.8} y2={eyeY} stroke={C.owlEye} strokeWidth={sw * 1.4} strokeLinecap="round" />
        ),
      )}
      {/* beak */}
      <path d={`M ${-s * 0.06} ${eyeY + s * 0.09} L ${s * 0.07} ${eyeY + s * 0.09} L ${s * 0.005} ${eyeY + s * 0.2 + beakOpen} Z`} fill={C.owlBeakShade} strokeLinejoin="round" stroke={C.owlBeakShade} strokeWidth={sw} />
      <path d={`M ${-s * 0.06} ${eyeY + s * 0.09} L ${s * 0.04} ${eyeY + s * 0.09} L ${s * 0.0} ${eyeY + s * 0.18} Z`} fill={C.owlBeak} strokeLinejoin="round" stroke={C.owlBeak} strokeWidth={sw} />
      {/* headphones */}
      {headphones && (
        <g>
          <path d={`M ${-s * 0.5} ${-h * 0.1} C ${-s * 0.5} ${-h * 0.78} ${s * 0.5} ${-h * 0.78} ${s * 0.5} ${-h * 0.1}`} fill="none" stroke={C.owlGreenShade} strokeWidth={s * 0.075} strokeLinecap="round" transform={`translate(${s * 0.02} ${s * 0.015})`} />
          <path d={`M ${-s * 0.5} ${-h * 0.1} C ${-s * 0.5} ${-h * 0.78} ${s * 0.5} ${-h * 0.78} ${s * 0.5} ${-h * 0.1}`} fill="none" stroke={C.owlGreen} strokeWidth={s * 0.06} strokeLinecap="round" />
          {[-1, 1].map((d) => (
            <g key={d} transform={`translate(${d * s * 0.5} ${-h * 0.04})`}>
              <rect x={-s * 0.09} y={-s * 0.15} width={s * 0.2} height={s * 0.3} rx={s * 0.09} fill={C.owlGreenShade} />
              <rect x={-s * 0.11} y={-s * 0.15} width={s * 0.18} height={s * 0.28} rx={s * 0.09} fill={C.owlGreen} />
              <ellipse cx={d < 0 ? -s * 0.03 : s * 0.01} cy={-s * 0.01} rx={s * 0.045} ry={s * 0.09} fill={C.owlPad} />
            </g>
          ))}
        </g>
      )}
    </g>
  );
};
