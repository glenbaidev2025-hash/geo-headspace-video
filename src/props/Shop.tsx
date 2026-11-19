import React from 'react';
import {Character} from '../Character';
import {C, FONT_EN} from '../theme';

/** Milk carton: gabled box, flat colors with shade side. */
export const MilkCarton: React.FC<{x: number; y: number; size: number; rotate?: number; squash?: number}> = ({x, y, size, rotate = 0, squash = 1}) => {
  const w = size * 0.6;
  const h = size;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) translate(0 ${h / 2}) scale(${squash} ${1 / squash}) translate(0 ${-h / 2})`}>
      <path d={`M ${-w / 2} ${-h * 0.18} L 0 ${-h * 0.42} L ${w / 2} ${-h * 0.18} Z`} fill={C.lightBlueShade} strokeLinejoin="round" stroke={C.lightBlueShade} strokeWidth={size * 0.04} />
      <rect x={-w * 0.16} y={-h * 0.52} width={w * 0.32} height={h * 0.12} rx={size * 0.02} fill={C.lightBlue} />
      <rect x={-w / 2} y={-h * 0.18} width={w} height={h * 0.68} rx={size * 0.06} fill="#FFFFFF" />
      <rect x={w * 0.3} y={-h * 0.18} width={w * 0.2} height={h * 0.68} rx={size * 0.04} fill={C.lightGray} />
      <rect x={-w / 2} y={h * 0.02} width={w * 0.8} height={h * 0.22} fill={C.lightBlue} />
      <circle cx={-w * 0.1} cy={h * 0.13} r={size * 0.06} fill="#FFFFFF" />
    </g>
  );
};

/** Shopping basket. Items should be drawn between <BasketBack> and <BasketFront>. */
export const BasketBack: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <g transform={`translate(${x} ${y})`}>
    <path d={`M ${-w * 0.36} 0 C ${-w * 0.36} ${-w * 0.55} ${w * 0.36} ${-w * 0.55} ${w * 0.36} 0`} fill="none" stroke={C.blueShade} strokeWidth={w * 0.05} strokeLinecap="round" />
  </g>
);
export const BasketFront: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => {
  const h = w * 0.5;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M ${-w / 2} 0 L ${w / 2} 0 L ${w * 0.42} ${h} L ${-w * 0.42} ${h} Z`} fill={C.blueShade} strokeLinejoin="round" stroke={C.blueShade} strokeWidth={w * 0.04} />
      <path d={`M ${-w / 2} 0 L ${w * 0.38} 0 L ${w * 0.32} ${h} L ${-w * 0.42} ${h} Z`} fill={C.blue} strokeLinejoin="round" stroke={C.blue} strokeWidth={w * 0.03} />
      {[0.3, 0.62].map((t) => (
        <rect key={t} x={-w * 0.42} y={h * t - w * 0.025} width={w * 0.76} height={w * 0.05} rx={w * 0.025} fill={C.blueShade} />
      ))}
    </g>
  );
};

/** Generic grocery items built from the shape library (faceless). */
export type GroceryKind = 'orange' | 'box' | 'bread' | 'cheese' | 'bottle' | 'can';
export const Grocery: React.FC<{kind: GroceryKind; x: number; y: number; size: number; rotate?: number}> = ({kind, x, y, size, rotate = 0}) => {
  const s = size;
  switch (kind) {
    case 'orange':
      return <Character shape="circle" w={s * 0.7} h={s * 0.7} color={C.orange} shade={C.orangeShade} x={x} y={y} rotate={rotate} noFace />;
    case 'box':
      return <Character shape="roundRect" w={s * 0.7} h={s * 0.9} color={C.pink} shade={C.pinkShade} x={x} y={y} rotate={rotate} noFace />;
    case 'bread':
      return <Character shape="halfPill" w={s * 0.9} h={s * 0.6} color={C.yellow} shade={C.yellowShade} x={x} y={y} rotate={rotate} noFace />;
    case 'cheese':
      return <Character shape="triangle" w={s * 0.8} h={s * 0.65} color={C.yellow} shade={C.yellowShade} x={x} y={y} rotate={rotate} noFace />;
    case 'bottle':
      return <Character shape="capsule" w={s * 0.35} h={s * 1.0} color={C.green} shade={C.greenShade} x={x} y={y} rotate={rotate} noFace />;
    case 'can':
    default:
      return <Character shape="roundRect" w={s * 0.45} h={s * 0.6} color={C.purple} shade={C.purpleShade} x={x} y={y} rotate={rotate} noFace />;
  }
};

/** Price tag with a hole and string. */
export const PriceTag: React.FC<{x: number; y: number; text: string; scale?: number; rotate?: number}> = ({x, y, text, scale = 1, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <path d="M -150 -70 L 110 -70 L 170 0 L 110 70 L -150 70 Q -170 70 -170 50 L -170 -50 Q -170 -70 -150 -70 Z" fill={C.pinkShade} transform="translate(10 10)" />
    <path d="M -150 -70 L 110 -70 L 170 0 L 110 70 L -150 70 Q -170 70 -170 50 L -170 -50 Q -170 -70 -150 -70 Z" fill={C.pink} />
    <circle cx={115} cy={0} r={14} fill={C.offWhite} />
    <text x={-30} y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={96} fill={C.ink}>{text}</text>
  </g>
);
