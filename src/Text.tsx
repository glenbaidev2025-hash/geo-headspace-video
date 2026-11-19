import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from './theme';

/** Text whose characters pop in one by one (scale spring). Renders inside an <svg>. */
export const PopText: React.FC<{
  text: string;
  x: number;
  y: number;
  start: number;
  size?: number;
  color?: string;
  stagger?: number;
  end?: number; // frame at which it pops out (optional)
  anchor?: 'start' | 'middle' | 'end';
}> = ({text, x, y, start, size = 110, color = C.ink, stagger = 2, end, anchor = 'middle'}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < start) return null;
  if (end !== undefined && f > end + 8) return null;
  const chars = [...text];
  // approximate advance: CJK = 1em, latin/digits ≈ 0.6em
  const adv = (ch: string) => (/[　-鿿＀-￯]/.test(ch) ? size : ch === ' ' ? size * 0.3 : size * 0.62);
  const total = chars.reduce((s, c) => s + adv(c), 0);
  let cursor = anchor === 'middle' ? x - total / 2 : anchor === 'end' ? x - total : x;
  const out = end !== undefined && f > end ? Math.max(0, 1 - (f - end) / 8) : 1;
  return (
    <g>
      {chars.map((ch, i) => {
        const cx = cursor + adv(ch) / 2;
        cursor += adv(ch);
        const s = spring({frame: f - start - i * stagger, fps, config: {damping: 11, stiffness: 190}}) * out;
        return (
          <text key={i} transform={`translate(${cx} ${y}) scale(${s})`} textAnchor="middle" dominantBaseline="middle"
            fontFamily={FONT} fontWeight={900} fontSize={size} fill={color}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};

/** Characters laid out along a circular arc (style-bible: text wraps around the hero). */
export const ArcText: React.FC<{
  text: string;
  cx: number;
  cy: number;
  r: number;
  start: number;
  size?: number;
  color?: string;
  degPerChar?: number;
  bottom?: boolean; // place on the lower arc (reads left→right, upright)
}> = ({text, cx, cy, r, start, size = 76, color = C.night, degPerChar = 10.5, bottom = false}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chars = [...text];
  const span = degPerChar * (chars.length - 1);
  return (
    <g>
      {chars.map((ch, i) => {
        const deg = bottom ? 90 + span / 2 - (span / Math.max(1, chars.length - 1)) * i : -90 - span / 2 + (span / Math.max(1, chars.length - 1)) * i;
        const rad = (deg * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const s = spring({frame: f - start - i * 2, fps, config: {damping: 11, stiffness: 180}});
        const rot = bottom ? deg - 90 : deg + 90;
        return (
          <text key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} textAnchor="middle" dominantBaseline="middle"
            fontFamily={FONT} fontWeight={900} fontSize={size} fill={color}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};

/** Rounded pill label (name tag) that pops in. */
export const Tag: React.FC<{text: string; x: number; y: number; start: number; bg?: string; color?: string; size?: number}> = ({
  text, x, y, start, bg = C.ink, color = '#FFFFFF', size = 46,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < start) return null;
  const s = spring({frame: f - start, fps, config: {damping: 11, stiffness: 200}});
  const w = [...text].reduce((a, ch) => a + (/[　-鿿]/.test(ch) ? size : size * 0.62), 0) + size * 1.1;
  const h = size * 1.6;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={bg} />
      <text x={0} y={2} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={color}>
        {text}
      </text>
    </g>
  );
};
