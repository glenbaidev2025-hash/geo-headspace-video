import React, {useId} from 'react';
import {Character} from '../Character';
import {C, FONT_EN} from '../theme';

/** Front door with frame. `open` 0..1 swings the panel toward the hinge (left) and reveals the outside. */
export const Door: React.FC<{x: number; floorY: number; w?: number; h?: number; open?: number}> = ({x, floorY, w = 360, h = 640, open = 0}) => {
  const left = x - w / 2;
  const top = floorY - h;
  const fw = 26;
  const panelW = w * (1 - 0.82 * open);
  const id = useId().replace(/:/g, '');
  return (
    <g>
      <defs>
        <clipPath id={`door-${id}`}><rect x={left} y={top} width={w} height={h} /></clipPath>
      </defs>
      {/* frame */}
      <rect x={left - fw} y={top - fw} width={w + fw * 2} height={h + fw} rx={18} fill={C.lightGray} />
      <rect x={left - fw + w + fw * 2 - 18} y={top - fw} width={18} height={h + fw} rx={9} fill={C.grayShade} />
      {/* outside (visible when open) */}
      <g clipPath={`url(#door-${id})`}>
        <rect x={left} y={top} width={w} height={h} fill={C.lightBlue} />
        <circle cx={left + w * 0.7} cy={top + h * 0.25} r={w * 0.12} fill={C.yellow} />
        <ellipse cx={left + w * 0.5} cy={floorY + h * 0.05} rx={w * 0.9} ry={h * 0.3} fill={C.green} />
      </g>
      {/* panel (purple, with shade edge) */}
      <rect x={left} y={top} width={panelW} height={h} fill={C.purpleShade} />
      <rect x={left} y={top} width={Math.max(0, panelW - w * 0.06)} height={h} fill={C.purple} />
      {open < 0.7 && (
        <g>
          <rect x={left + panelW * 0.14} y={top + h * 0.1} width={panelW * 0.62} height={h * 0.3} rx={14} fill={C.purpleShade} opacity={0.55} />
          <rect x={left + panelW * 0.14} y={top + h * 0.5} width={panelW * 0.62} height={h * 0.36} rx={14} fill={C.purpleShade} opacity={0.55} />
          <circle cx={left + panelW * 0.84} cy={top + h * 0.52} r={w * 0.045} fill={C.yellow} />
        </g>
      )}
      {/* threshold */}
      <rect x={left - fw} y={floorY - 8} width={w + fw * 2} height={16} rx={8} fill={C.grayShade} />
    </g>
  );
};

/** A sneaker built from a half-pill and a sole. Pivot is the sole center. */
export const Shoe: React.FC<{x: number; y: number; size: number; flip?: boolean; rotate?: number; color?: string; shade?: string}> = ({x, y, size, flip, rotate = 0, color = C.pink, shade = C.pinkShade}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${flip ? -1 : 1} 1)`}>
    <path d={`M ${-size / 2} 0 L ${-size / 2} ${-size * 0.32} Q ${-size / 2} ${-size * 0.5} ${-size * 0.3} ${-size * 0.5} L ${-size * 0.05} ${-size * 0.5} Q ${size * 0.1} ${-size * 0.22} ${size * 0.45} ${-size * 0.18} Q ${size / 2} ${-size * 0.16} ${size / 2} 0 Z`} fill={color} />
    <rect x={-size / 2} y={-size * 0.1} width={size} height={size * 0.16} rx={size * 0.08} fill="#FFFFFF" />
    <line x1={-size * 0.2} y1={-size * 0.36} x2={-size * 0.02} y2={-size * 0.3} stroke={shade} strokeWidth={size * 0.06} strokeLinecap="round" />
  </g>
);

/** Shoulder bag: rounded pouch with a flap; the strap loops up to `strapTo` (e.g. the wearer's top corner). */
export const Bag: React.FC<{x: number; y: number; size: number; strapTo?: {x: number; y: number}; rotate?: number}> = ({x, y, size, strapTo, rotate = 0}) => {
  const w = size;
  const h = size * 0.78;
  return (
    <g>
      {strapTo && (
        <path d={`M ${x - w * 0.3} ${y - h * 0.4} Q ${strapTo.x - w * 0.5} ${strapTo.y - w * 0.4} ${strapTo.x} ${strapTo.y}`} fill="none" stroke={C.greenShade} strokeWidth={size * 0.09} strokeLinecap="round" />
      )}
      <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
        <rect x={-w / 2 + w * 0.06} y={-h / 2} width={w} height={h} rx={w * 0.22} fill={C.greenShade} />
        <rect x={-w / 2} y={-h / 2} width={w * 0.94} height={h} rx={w * 0.22} fill={C.green} />
        <path d={`M ${-w / 2} ${-h * 0.2} Q ${-w * 0.03} ${h * 0.12} ${w * 0.44} ${-h * 0.2}`} fill="none" stroke={C.greenShade} strokeWidth={size * 0.06} strokeLinecap="round" />
        <rect x={-w * 0.08} y={-h * 0.06} width={w * 0.16} height={w * 0.14} rx={w * 0.04} fill={C.yellow} />
      </g>
    </g>
  );
};

/** Small icons drawn around (0,0), roughly `s` wide. */
export const KeyIcon: React.FC<{s: number; color?: string}> = ({s, color = C.ink}) => (
  <g>
    <circle cx={-s * 0.24} cy={0} r={s * 0.2} fill="none" stroke={color} strokeWidth={s * 0.1} />
    <line x1={-s * 0.04} y1={0} x2={s * 0.42} y2={0} stroke={color} strokeWidth={s * 0.1} strokeLinecap="round" />
    <line x1={s * 0.24} y1={0} x2={s * 0.24} y2={s * 0.16} stroke={color} strokeWidth={s * 0.09} strokeLinecap="round" />
    <line x1={s * 0.38} y1={0} x2={s * 0.38} y2={s * 0.13} stroke={color} strokeWidth={s * 0.09} strokeLinecap="round" />
  </g>
);
export const WalletIcon: React.FC<{s: number; color?: string}> = ({s, color = C.ink}) => (
  <g>
    <rect x={-s * 0.42} y={-s * 0.28} width={s * 0.84} height={s * 0.56} rx={s * 0.1} fill={color} />
    <rect x={s * 0.08} y={-s * 0.12} width={s * 0.38} height={s * 0.24} rx={s * 0.08} fill="#FFFFFF" />
    <circle cx={s * 0.22} cy={0} r={s * 0.05} fill={color} />
  </g>
);
export const PhoneIcon: React.FC<{s: number; color?: string}> = ({s, color = C.ink}) => (
  <g>
    <rect x={-s * 0.22} y={-s * 0.4} width={s * 0.44} height={s * 0.8} rx={s * 0.1} fill={color} />
    <rect x={-s * 0.16} y={-s * 0.32} width={s * 0.32} height={s * 0.58} rx={s * 0.05} fill={C.screenGlow} />
  </g>
);

/** Round icon bubble with a shade side and an optional status badge ("x" = missing, "?" = where?). */
export const IconBubble: React.FC<{x: number; y: number; size: number; scale?: number; rotate?: number; badge?: 'x' | '?'; badgeK?: number; children: React.ReactNode}> = ({x, y, size, scale = 1, rotate = 0, badge, badgeK = 1, children}) => {
  const b = size * 0.2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <circle cx={size * 0.04} cy={size * 0.04} r={size / 2} fill={C.lightGray} />
      <circle r={size / 2} fill="#FFFFFF" />
      {children}
      {badge && (
        <g transform={`translate(${size * 0.34} ${-size * 0.34}) scale(${badgeK})`}>
          <circle r={b} fill={badge === 'x' ? C.orange : C.blue} />
          {badge === 'x' ? (
            <g stroke="#FFFFFF" strokeWidth={b * 0.32} strokeLinecap="round">
              <line x1={-b * 0.4} y1={-b * 0.4} x2={b * 0.4} y2={b * 0.4} />
              <line x1={b * 0.4} y1={-b * 0.4} x2={-b * 0.4} y2={b * 0.4} />
            </g>
          ) : (
            <text x={0} y={b * 0.08} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={b * 1.5} fill="#FFFFFF">?</text>
          )}
        </g>
      )}
    </g>
  );
};

/** Sweat drop (panic). */
export const SweatDrop: React.FC<{x: number; y: number; size: number; opacity?: number}> = ({x, y, size, opacity = 1}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <path d={`M 0 ${-size / 2} C ${size * 0.3} ${-size * 0.1} ${size * 0.38} ${size * 0.1} ${size * 0.38} ${size * 0.2} A ${size * 0.38} ${size * 0.38} 0 0 1 ${-size * 0.38} ${size * 0.2} C ${-size * 0.38} ${size * 0.1} ${-size * 0.3} ${-size * 0.1} 0 ${-size / 2} Z`} fill={C.lightBlue} />
    <ellipse cx={-size * 0.12} cy={size * 0.14} rx={size * 0.07} ry={size * 0.12} fill="#FFFFFF" opacity={0.8} />
  </g>
);
