import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ci, EASE_IN_OUT} from './motion';

export type RevealKind = 'circle' | 'wipeUp' | 'wave';

/**
 * Graphic scene transition (style-bible: no cross-dissolves).
 * Wraps the incoming scene and reveals it over `dur` frames:
 *  - circle: a shape grows from (cx, cy) until it covers the frame
 *  - wipeUp: a colour block pushes in from the bottom
 *  - wave:   a wavy edge sweeps up from the bottom
 */
export const Reveal: React.FC<{
  kind: RevealKind;
  dur?: number;
  cx?: number;
  cy?: number;
  width: number;
  height: number;
  children: React.ReactNode;
}> = ({kind, dur = 16, cx, cy, width, height, children}) => {
  const f = useCurrentFrame();
  const p = ci(f, [0, dur], [0, 1], EASE_IN_OUT);
  if (p >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  let clipPath: string;
  if (kind === 'circle') {
    const x = cx ?? width / 2;
    const y = cy ?? height / 2;
    const maxR = Math.hypot(Math.max(x, width - x), Math.max(y, height - y));
    clipPath = `circle(${p * maxR}px at ${x}px ${y}px)`;
  } else if (kind === 'wipeUp') {
    clipPath = `inset(${(1 - p) * 100}% 0 0 0)`;
  } else {
    const amp = 60 * (1 - p * 0.6);
    const top = (1 - p) * (height + amp * 2) - amp;
    const pts: string[] = [];
    for (let x = 0; x <= width; x += width / 24) {
      pts.push(`${x}px ${top + amp * Math.sin((x / width) * Math.PI * 3 + f * 0.35)}px`);
    }
    pts.push(`${width}px ${height}px`, `0px ${height}px`);
    clipPath = `polygon(${pts.join(',')})`;
  }
  return <AbsoluteFill style={{clipPath, WebkitClipPath: clipPath}}>{children}</AbsoluteFill>;
};
