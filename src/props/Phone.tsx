import React, {useId} from 'react';
import {Character, CharacterProps} from '../Character';
import {C, FONT_EN} from '../theme';

type PhoneProps = {
  x: number;
  y: number;
  w?: number;
  h?: number;
  rotate?: number;
  squash?: number;
  scale?: number;
  glow?: number; // 0 = screen off, 1 = fully lit
  /** Screen content in screen-local coords: origin at screen center, size sw × sh. */
  screen?: (sw: number, sh: number) => React.ReactNode;
};

/** A flat geometric phone (prop, no face): rounded body with shade crescent + clipped screen. */
export const Phone: React.FC<PhoneProps> = ({x, y, w = 160, h = 300, rotate = 0, squash = 1, scale = 1, glow = 1, screen}) => {
  const id = useId().replace(/:/g, '');
  const sw = w * 0.82;
  const sh = h * 0.84;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale}) translate(0 ${h / 2}) scale(${squash} ${1 / squash}) translate(0 ${-h / 2})`}>
      <Character shape="roundRect" w={w} h={h} color={C.charcoal} shade={C.charcoalShade} x={0} y={0} noFace />
      <defs>
        <clipPath id={`scr-${id}`}>
          <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} rx={sw * 0.12} />
        </clipPath>
      </defs>
      <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} rx={sw * 0.12} fill={C.screen} />
      <g clipPath={`url(#scr-${id})`} opacity={glow}>
        <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} fill={C.screenGlow} />
        {screen?.(sw, sh)}
      </g>
    </g>
  );
};

/** Lock-screen clock. `pop` (0..1+) scales the digits for a squishy reveal. */
export const ClockScreen: React.FC<{sw: number; sh: number; time: string; pop?: number; color?: string}> = ({sw, time, pop = 1, color = '#FFFFFF'}) => (
  <text x={0} y={0} transform={`scale(${pop})`} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={sw * 0.36} fill={color}>
    {time}
  </text>
);

/** A playing video: colored backdrop, bouncing shape, progress bar. */
export const VideoScreen: React.FC<{sw: number; sh: number; t: number; color: string; shade: string; accent: string}> = ({sw, sh, t, color, shade, accent}) => {
  const bounce = Math.abs(Math.sin(t * 5));
  return (
    <g>
      <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh} fill={color} />
      <circle cx={0} cy={sh * 0.12} r={sw * 0.5} fill={shade} />
      <Character shape="circle" w={sw * 0.38} h={sw * 0.38} color={accent} shade={shade} x={0} y={-bounce * sh * 0.14} squash={1 + (1 - bounce) * 0.15} expression="happy" />
      <rect x={-sw * 0.38} y={sh * 0.38} width={sw * 0.76} height={6} rx={3} fill="#FFFFFF" opacity={0.4} />
      <rect x={-sw * 0.38} y={sh * 0.38} width={sw * 0.76 * ((t * 0.3) % 1)} height={6} rx={3} fill="#FFFFFF" />
    </g>
  );
};

/** A floating "video clip" character: card with a play badge and a small face. */
export const ClipCard: React.FC<Omit<CharacterProps, 'shape'> & {badge?: boolean}> = ({badge = true, ...p}) => {
  const r = Math.min(p.w, p.h) * 0.16;
  return (
    <g>
      <Character shape="roundRect" {...p} faceOffset={{x: 0, y: p.h * 0.12}} faceSize={Math.min(p.w, p.h) * 0.45} />
      {badge && (
        <g transform={`translate(${p.x + p.w * 0.28} ${p.y - p.h * 0.26}) rotate(${p.rotate ?? 0})`}>
          <circle r={r} fill="#FFFFFF" />
          <path d={`M ${-r * 0.3} ${-r * 0.45} L ${r * 0.5} 0 L ${-r * 0.3} ${r * 0.45} Z`} fill={C.ink} strokeLinejoin="round" stroke={C.ink} strokeWidth={r * 0.12} />
        </g>
      )}
    </g>
  );
};

/** Chat bubble with a play icon (an incoming video message). */
export const VideoBubble: React.FC<{x: number; y: number; scale: number}> = ({x, y, scale}) => (
  <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <path d="M -110 -70 h 220 a 34 34 0 0 1 34 34 v 72 a 34 34 0 0 1 -34 34 h -150 l -40 34 l 6 -34 h -36 a 34 34 0 0 1 -34 -34 v -72 a 34 34 0 0 1 34 -34 Z" fill={C.grayShade} transform="translate(8 8)" />
    <path d="M -110 -70 h 220 a 34 34 0 0 1 34 34 v 72 a 34 34 0 0 1 -34 34 h -150 l -40 34 l 6 -34 h -36 a 34 34 0 0 1 -34 -34 v -72 a 34 34 0 0 1 34 -34 Z" fill="#FFFFFF" />
    <rect x={-100} y={-48} width={110} height={88} rx={16} fill={C.pink} />
    <path d="M -62 -22 L -30 -4 L -62 14 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={6} strokeLinejoin="round" />
    <rect x={28} y={-34} width={84} height={14} rx={7} fill={C.lightGray} />
    <rect x={28} y={-4} width={60} height={14} rx={7} fill={C.lightGray} />
  </g>
);

/** Round wall clock whose hand spins `turns` times across progress 0..1. */
export const ClockFace: React.FC<{x: number; y: number; size: number; progress: number; turns?: number; scale?: number}> = ({x, y, size, progress, turns = 2, scale = 1}) => {
  const a = progress * 360 * turns;
  const sw = size * 0.07;
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <Character shape="circle" w={size} h={size} color={C.offWhite} shade={C.lightGray} x={0} y={0} noFace />
      {[0, 90, 180, 270].map((d) => (
        <line key={d} x1={0} y1={-size * 0.36} x2={0} y2={-size * 0.3} transform={`rotate(${d})`} stroke={C.ink} strokeWidth={sw * 0.8} strokeLinecap="round" />
      ))}
      <line x1={0} y1={0} x2={0} y2={-size * 0.3} transform={`rotate(${a})`} stroke={C.ink} strokeWidth={sw} strokeLinecap="round" />
      <line x1={0} y1={0} x2={0} y2={-size * 0.2} transform={`rotate(${a / 12 + 300})`} stroke={C.ink} strokeWidth={sw} strokeLinecap="round" />
      <circle r={sw * 0.9} fill={C.ink} />
    </g>
  );
};
