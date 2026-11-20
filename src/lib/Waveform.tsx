import React from 'react';
import {C} from '../theme';

/**
 * Audio waveform strip: rounded bars that jump with `level` (0..1, e.g. from talkLevel).
 * Bars are taller in the middle (bell shape) and each one wiggles at its own phase.
 */
export const Waveform: React.FC<{
  x: number; // center x
  y: number; // center y
  w: number;
  h: number; // max bar height
  f: number; // current frame (drives the wiggle)
  level: number;
  bars?: number;
  color?: string;
  idle?: number; // bar height (0..1 of h) when silent
}> = ({x, y, w, h, f, level, bars = 29, color = C.ink, idle = 0.08}) => {
  const step = w / bars;
  const bw = step * 0.56;
  return (
    <g>
      {Array.from({length: bars}).map((_, i) => {
        const t = i / (bars - 1);
        const bell = 0.35 + 0.65 * Math.sin(t * Math.PI);
        const wig = 0.45 + 0.55 * Math.abs(Math.sin(f * 0.55 + i * 1.73) * Math.cos(f * 0.21 + i * 0.61));
        const k = Math.max(idle, level * bell * wig);
        const bh = Math.max(bw, h * k);
        return <rect key={i} x={x - w / 2 + i * step + (step - bw) / 2} y={y - bh / 2} width={bw} height={bh} rx={bw / 2} fill={color} />;
      })}
    </g>
  );
};
