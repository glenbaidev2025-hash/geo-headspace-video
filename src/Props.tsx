// Reusable non-character props, all with a same-hue darker side (style-bible detail #1).
import React from 'react';
import {C, FONT} from './theme';

/** Flat coin seen at an angle: darker rim below, lit face on top. */
export const Coin: React.FC<{x: number; y: number; w?: number; scale?: number; color?: string; shade?: string}> = ({
  x, y, w = 220, scale = 1, color = C.yellow, shade = C.yellowShade,
}) => {
  const h = w * 0.32;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx={0} cy={h * 0.28} rx={w / 2} ry={h / 2} fill={shade} />
      <ellipse cx={0} cy={0} rx={w / 2} ry={h / 2} fill={color} />
      <ellipse cx={0} cy={0} rx={w * 0.3} ry={h * 0.28} fill="none" stroke={shade} strokeWidth={w * 0.04} />
    </g>
  );
};

/** Rounded card with shade side and optional label text. */
export const Card: React.FC<{
  x: number; y: number; w: number; h: number; color?: string; shade?: string; label?: string; labelColor?: string; labelSize?: number; scale?: number; rotate?: number;
  children?: React.ReactNode;
}> = ({x, y, w, h, color = '#FFFFFF', shade = C.grayShade, label, labelColor = C.ink, labelSize = 56, scale = 1, rotate = 0, children}) => {
  const r = Math.min(w, h) * 0.16;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x={-w / 2 + w * 0.04} y={-h / 2 + h * 0.06} width={w} height={h} rx={r} fill={shade} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={r} fill={color} />
      {label && (
        <text x={0} y={4} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={labelSize} fill={labelColor}>
          {label}
        </text>
      )}
      {children}
    </g>
  );
};

/** A sign board on a stick (e.g. "IPO"), held above a character. */
export const Sign: React.FC<{x: number; y: number; text: string; scale?: number; color?: string; shade?: string; w?: number}> = ({
  x, y, text, scale = 1, color = C.yellow, shade = C.yellowShade, w = 280,
}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <rect x={-10} y={0} width={20} height={150} rx={10} fill={C.ink} />
    <Card x={0} y={-40} w={w} h={130} color={color} shade={shade} label={text} labelSize={68} />
  </g>
);

/** Speech bubble with a tail pointing down-left. */
export const SpeechBubble: React.FC<{x: number; y: number; w: number; h: number; scale?: number; children?: React.ReactNode}> = ({x, y, w, h, scale = 1, children}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d={`M ${-w * 0.25} ${h / 2 - 10} L ${-w * 0.36} ${h / 2 + 70} L ${-w * 0.05} ${h / 2 - 10} Z`} fill="#FFFFFF" />
    <Card x={0} y={0} w={w} h={h} color="#FFFFFF" shade={C.grayShade} />
    {children}
  </g>
);

/** Server rack block with little status lights. */
export const ServerBlock: React.FC<{x: number; y: number; w: number; h: number; squash?: number; lights?: number; t?: number}> = ({x, y, w, h, squash = 1, lights = 3, t = 0}) => (
  <g transform={`translate(${x} ${y + h / 2}) scale(${squash} ${1 / squash}) translate(0 ${-h / 2})`}>
    <Card x={0} y={0} w={w} h={h} color={C.lightGray} shade={C.grayShade} />
    {Array.from({length: lights}).map((_, i) => (
      <circle key={i} cx={-w / 2 + w * 0.18 + i * w * 0.12} cy={0} r={h * 0.1}
        fill={(Math.floor(t / 6) + i) % 3 === 0 ? C.green : C.lightBlue} />
    ))}
    <rect x={w * 0.05} y={-h * 0.08} width={w * 0.32} height={h * 0.16} rx={h * 0.08} fill={C.grayShade} />
  </g>
);

/** Tear-off calendar page with month.day and year. */
export const CalendarCard: React.FC<{x: number; y: number; date: string; year: string; scale?: number; top?: string; topShade?: string; rotate?: number}> = ({
  x, y, date, year, scale = 1, top = C.orange, topShade = C.orangeShade, rotate = 0,
}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
    <Card x={0} y={0} w={360} h={400} color="#FFFFFF" shade={C.grayShade} />
    <path d={`M -180 -140 L -180 -142 Q -180 -200 -122 -200 L 122 -200 Q 180 -200 180 -142 L 180 -110 L -180 -110 Z`} fill={top} />
    <rect x={-180} y={-120} width={360} height={14} fill={topShade} />
    <text x={0} y={-152} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill="#FFFFFF">{year}</text>
    <text x={0} y={50} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={130} fill={C.ink}>{date}</text>
  </g>
);
