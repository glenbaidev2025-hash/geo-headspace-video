import React from 'react';
import {C} from '../theme';

/** Headphones icon (listen-only sections). */
export const Headphones: React.FC<{x: number; y: number; size: number; color?: string}> = ({x, y, size, color = C.ink}) => {
  const s = size;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M ${-s * 0.4} ${s * 0.1} A ${s * 0.4} ${s * 0.42} 0 0 1 ${s * 0.4} ${s * 0.1}`} fill="none" stroke={color} strokeWidth={s * 0.1} strokeLinecap="round" />
      <rect x={-s * 0.5} y={0} width={s * 0.24} height={s * 0.42} rx={s * 0.1} fill={color} />
      <rect x={s * 0.26} y={0} width={s * 0.24} height={s * 0.42} rx={s * 0.1} fill={color} />
    </g>
  );
};

/** Microphone icon (speaking practice). */
export const Mic: React.FC<{x: number; y: number; size: number; color?: string}> = ({x, y, size, color = C.ink}) => {
  const s = size;
  const sw = s * 0.09;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-s * 0.17} y={-s * 0.5} width={s * 0.34} height={s * 0.58} rx={s * 0.17} fill={color} />
      <path d={`M ${-s * 0.32} ${-s * 0.08} A ${s * 0.32} ${s * 0.32} 0 0 0 ${s * 0.32} ${-s * 0.08}`} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1={0} y1={s * 0.25} x2={0} y2={s * 0.42} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <line x1={-s * 0.18} y1={s * 0.44} x2={s * 0.18} y2={s * 0.44} stroke={color} strokeWidth={sw} strokeLinecap="round" />
    </g>
  );
};

/** Comment bubble with three dots (viewer prompt). */
export const CommentBubble: React.FC<{x: number; y: number; size: number; color?: string; dots?: string}> = ({x, y, size, color = C.blue, dots = '#FFFFFF'}) => {
  const s = size;
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M ${-s / 2} ${-s * 0.32} a ${s * 0.18} ${s * 0.18} 0 0 1 ${s * 0.18} ${-s * 0.18} h ${s * 0.64} a ${s * 0.18} ${s * 0.18} 0 0 1 ${s * 0.18} ${s * 0.18} v ${s * 0.44} a ${s * 0.18} ${s * 0.18} 0 0 1 ${-s * 0.18} ${s * 0.18} h ${-s * 0.4} l ${-s * 0.22} ${s * 0.2} v ${-s * 0.2} h ${-s * 0.02} a ${s * 0.18} ${s * 0.18} 0 0 1 ${-s * 0.18} ${-s * 0.18} Z`} fill={color} />
      {[-1, 0, 1].map((i) => (
        <circle key={i} cx={i * s * 0.2} cy={-s * 0.08} r={s * 0.06} fill={dots} />
      ))}
    </g>
  );
};

/** Rounded progress bar, p = 0..1. */
export const ProgressBar: React.FC<{x: number; y: number; w: number; h: number; p: number; color?: string; track?: string}> = ({x, y, w, h, p, color = C.blue, track = C.lightGray}) => (
  <g>
    <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={h / 2} fill={track} />
    <rect x={x - w / 2} y={y - h / 2} width={Math.max(h, w * Math.min(1, Math.max(0, p)))} height={h} rx={h / 2} fill={color} opacity={p > 0 ? 1 : 0} />
  </g>
);
