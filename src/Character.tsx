import React, {useId} from 'react';
import {Expression, Face} from './Face';

export type Shape = 'circle' | 'dome' | 'capsule' | 'roundRect' | 'triangle' | 'halfPill';

export type CharacterProps = {
  shape: Shape;
  w: number;
  h: number;
  color: string;
  shade: string;
  x: number;
  y: number;
  rotate?: number;
  squash?: number; // >1 = wider & shorter (squash), <1 = taller (stretch); pivots at bottom
  expression?: Expression;
  faceSize?: number;
  faceOffset?: {x: number; y: number};
  blink?: number;
  look?: {x: number; y: number};
  shadeDir?: {x: number; y: number}; // direction of the shade crescent
  noFace?: boolean;
  talk?: number; // 0..1 open talking mouth (see Face)
};

// Rounded polygon path helper
const roundedPolygon = (pts: [number, number][], r: number) => {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const v1 = [p0[0] - p1[0], p0[1] - p1[1]];
    const v2 = [p2[0] - p1[0], p2[1] - p1[1]];
    const l1 = Math.hypot(v1[0], v1[1]);
    const l2 = Math.hypot(v2[0], v2[1]);
    const a = [p1[0] + (v1[0] / l1) * r, p1[1] + (v1[1] / l1) * r];
    const b = [p1[0] + (v2[0] / l2) * r, p1[1] + (v2[1] / l2) * r];
    d += `${i === 0 ? 'M' : 'L'} ${a[0]} ${a[1]} Q ${p1[0]} ${p1[1]} ${b[0]} ${b[1]} `;
  }
  return d + 'Z';
};

const shapeEl = (shape: Shape, w: number, h: number, fill: string, transform?: string) => {
  const hw = w / 2;
  const hh = h / 2;
  switch (shape) {
    case 'circle':
      return <ellipse cx={0} cy={0} rx={hw} ry={hh} fill={fill} transform={transform} />;
    case 'dome':
      return <path d={`M ${-hw} ${hh} A ${hw} ${h} 0 0 1 ${hw} ${hh} Z`} fill={fill} transform={transform} />;
    case 'capsule':
      return <rect x={-hw} y={-hh} width={w} height={h} rx={Math.min(hw, hh)} fill={fill} transform={transform} />;
    case 'roundRect':
      return <rect x={-hw} y={-hh} width={w} height={h} rx={Math.min(w, h) * 0.18} fill={fill} transform={transform} />;
    case 'halfPill':
      return <path d={`M ${-hw} ${hh} L ${-hw} ${-hh + hw} A ${hw} ${hw} 0 0 1 ${hw} ${-hh + hw} L ${hw} ${hh} Z`} fill={fill} transform={transform} />;
    case 'triangle':
      return <path d={roundedPolygon([[0, -hh], [hw, hh], [-hw, hh]], Math.min(w, h) * 0.16)} fill={fill} transform={transform} />;
  }
};

export const Character: React.FC<CharacterProps> = (p) => {
  const id = useId().replace(/:/g, '');
  const {shape, w, h, color, shade, x, y, rotate = 0, squash = 1} = p;
  const sx = squash;
  const sy = 1 / squash;
  const dir = p.shadeDir ?? {x: 1, y: 0.6};
  const off = Math.min(w, h) * 0.14;
  const faceSize = p.faceSize ?? Math.min(w, h) * 0.55;
  const fo = p.faceOffset ?? {x: 0, y: shape === 'dome' ? h * 0.15 : shape === 'triangle' ? h * 0.18 : 0};
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) translate(0 ${h / 2}) scale(${sx} ${sy}) translate(0 ${-h / 2})`}>
      <defs>
        <clipPath id={`clip-${id}`}>{shapeEl(shape, w, h, '#000')}</clipPath>
      </defs>
      {/* Shade body, then the lit body shifted away from the shade side -> pseudo-3D crescent */}
      {shapeEl(shape, w, h, shade)}
      <g clipPath={`url(#clip-${id})`}>{shapeEl(shape, w, h, color, `translate(${-dir.x * off} ${-dir.y * off})`)}</g>
      {!p.noFace && p.expression && (
        <g transform={`translate(${fo.x} ${fo.y})`}>
          <Face expression={p.expression} size={faceSize} blink={p.blink} look={p.look} talk={p.talk} />
        </g>
      )}
    </g>
  );
};
