import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from '../theme';

type Props = {
  text: string;
  cx: number;
  cy: number;
  r: number;
  start: number; // frame (in the current Sequence) when the first glyph pops in
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  spacingDeg?: number; // angle between glyphs; ~10.5 for CJK at r≈480, ~5 for Latin
  centerDeg?: number; // -90 = top of the circle, 90 = bottom
  stagger?: number; // frames between glyphs
};

/** Text laid out along a circle; glyphs pop in one after another. */
export const ArcText: React.FC<Props> = ({
  text, cx, cy, r, start, fontSize = 76, color = C.night, fontFamily = FONT, spacingDeg = 10.5, centerDeg = -90, stagger = 2,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const chars = [...text];
  const bottom = centerDeg > 0; // text on the lower arc reads left→right, upright
  const span = spacingDeg * (chars.length - 1);
  return (
    <g>
      {chars.map((ch, i) => {
        const deg = bottom ? centerDeg + span / 2 - spacingDeg * i : centerDeg - span / 2 + spacingDeg * i;
        const rad = (deg * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const s = spring({frame: f - start - i * stagger, fps, config: {damping: 11, stiffness: 180}});
        const rot = bottom ? deg - 90 : deg + 90;
        return (
          <text key={i} x={0} y={0} transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} textAnchor="middle" dominantBaseline="middle"
            fontFamily={fontFamily} fontWeight={900} fontSize={fontSize} fill={color} opacity={Math.min(1, s * 1.5)}>
            {ch}
          </text>
        );
      })}
    </g>
  );
};
