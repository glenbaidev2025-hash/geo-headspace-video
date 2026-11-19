import React from 'react';
import {C} from './theme';

export type Expression = 'sad' | 'strained' | 'look' | 'calm' | 'happy' | 'sleepy';

type Props = {
  expression: Expression;
  size: number; // overall face width
  blink?: number; // 0 = open, 1 = closed (only affects 'look'/'happy')
  look?: {x: number; y: number}; // -1..1 pupil offset
  ink?: string;
};

// Parametric face: round-capped ink lines, no outlines on the body.
export const Face: React.FC<Props> = ({expression, size, blink = 0, look = {x: 0, y: 0}, ink = C.ink}) => {
  const s = size;
  const sw = Math.max(3, s * 0.07); // stroke width
  const ex = s * 0.24; // eye x offset
  const ey = -s * 0.08; // eye y
  const er = s * 0.12; // eye radius
  const line = {stroke: ink, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none'};

  const arcEye = (cx: number, up: boolean) => {
    // up=true: ◠ (calm closed eye) ; up=false: ◡ (droopy / sad)
    const dy = up ? -er * 0.7 : er * 0.7;
    return <path key={cx} d={`M ${cx - er} ${ey} Q ${cx} ${ey + dy * 2} ${cx + er} ${ey}`} {...line} />;
  };

  const lookEye = (cx: number) => {
    const open = 1 - blink;
    if (open < 0.15) return <path key={cx} d={`M ${cx - er} ${ey} L ${cx + er} ${ey}`} {...line} />;
    return (
      <g key={cx}>
        <ellipse cx={cx} cy={ey} rx={er * 1.15} ry={er * 1.15 * open} fill="#FFFFFF" />
        <circle cx={cx + look.x * er * 0.45} cy={ey + look.y * er * 0.45 * open} r={er * 0.55 * Math.min(1, open * 1.5)} fill={ink} />
      </g>
    );
  };

  const mouthY = s * 0.2;
  const mw = s * 0.16;
  let eyes: React.ReactNode;
  let mouth: React.ReactNode;

  switch (expression) {
    case 'sad':
      eyes = [arcEye(-ex, false), arcEye(ex, false)];
      mouth = <path d={`M ${-mw} ${mouthY + mw * 0.35} Q 0 ${mouthY - mw * 0.45} ${mw} ${mouthY + mw * 0.35}`} {...line} />;
      break;
    case 'strained':
      eyes = [
        <path key="l" d={`M ${-ex - er} ${ey - er * 0.8} L ${-ex + er * 0.7} ${ey} L ${-ex - er} ${ey + er * 0.8}`} {...line} />,
        <path key="r" d={`M ${ex + er} ${ey - er * 0.8} L ${ex - er * 0.7} ${ey} L ${ex + er} ${ey + er * 0.8}`} {...line} />,
      ];
      mouth = <path d={`M ${-mw} ${mouthY} q ${mw / 2} ${-mw * 0.35} ${mw} 0 t ${mw} 0`} {...line} />;
      break;
    case 'look':
      eyes = [lookEye(-ex), lookEye(ex)];
      mouth = <path d={`M ${-mw * 0.6} ${mouthY} L ${mw * 0.6} ${mouthY}`} {...line} />;
      break;
    case 'happy':
      eyes = [lookEye(-ex), lookEye(ex)];
      mouth = <path d={`M ${-mw} ${mouthY - mw * 0.2} Q 0 ${mouthY + mw * 0.8} ${mw} ${mouthY - mw * 0.2}`} {...line} />;
      break;
    case 'sleepy':
      eyes = [arcEye(-ex, false), arcEye(ex, false)];
      mouth = <path d={`M ${-mw * 0.5} ${mouthY} L ${mw * 0.5} ${mouthY}`} {...line} />;
      break;
    case 'calm':
    default:
      eyes = [arcEye(-ex, true), arcEye(ex, true)];
      mouth = <path d={`M ${-mw} ${mouthY - mw * 0.2} Q 0 ${mouthY + mw * 0.6} ${mw} ${mouthY - mw * 0.2}`} {...line} />;
  }
  return (
    <g>
      {eyes}
      {mouth}
    </g>
  );
};
