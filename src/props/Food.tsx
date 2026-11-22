import React from 'react';
import {Character} from '../Character';
import {Expression, Face} from '../Face';
import {C} from '../theme';

// Flat food props (faceless), each with a same-hue shade side. Centered on (x, y), `size` ≈ overall width.

/** Ramen bowl: red bowl, broth, wavy noodles, half egg, fish-cake swirl, chopsticks, optional steam (0..1). */
export const Ramen: React.FC<{x: number; y: number; size: number; steam?: number; rotate?: number}> = ({x, y, size: s, steam = 0, rotate = 0}) => {
  const r = s * 0.5;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {/* chopsticks behind */}
      <g stroke={C.charcoal} strokeWidth={s * 0.045} strokeLinecap="round">
        <line x1={s * 0.05} y1={-s * 0.05} x2={s * 0.52} y2={-s * 0.52} />
        <line x1={s * 0.15} y1={-s * 0.02} x2={s * 0.6} y2={-s * 0.4} />
      </g>
      {/* broth */}
      <ellipse cx={0} cy={-s * 0.02} rx={r * 0.96} ry={s * 0.14} fill={C.owlTan} />
      {/* noodles */}
      {[-0.22, 0, 0.22].map((dx) => (
        <path key={dx} d={`M ${s * (dx - 0.1)} ${-s * 0.02} q ${s * 0.05} ${-s * 0.06} ${s * 0.1} 0 t ${s * 0.1} 0`} fill="none" stroke={C.owlCream} strokeWidth={s * 0.035} strokeLinecap="round" />
      ))}
      {/* half egg */}
      <ellipse cx={-s * 0.24} cy={-s * 0.07} rx={s * 0.11} ry={s * 0.08} fill="#FFFFFF" />
      <circle cx={-s * 0.24} cy={-s * 0.07} r={s * 0.045} fill={C.orange} />
      {/* fish-cake swirl */}
      <circle cx={s * 0.24} cy={-s * 0.06} r={s * 0.08} fill="#FFFFFF" />
      <path d={`M ${s * 0.24} ${-s * 0.06} m ${-s * 0.035} 0 a ${s * 0.035} ${s * 0.035} 0 1 1 ${s * 0.035} ${s * 0.035}`} fill="none" stroke={C.pink} strokeWidth={s * 0.022} strokeLinecap="round" />
      {/* bowl */}
      <path d={`M ${-r} 0 L ${r} 0 A ${r} ${r * 0.8} 0 0 1 ${-r} 0 Z`} fill={C.redShade} />
      <path d={`M ${-r} 0 L ${r * 0.72} 0 A ${r} ${r * 0.8} 0 0 1 ${-r} 0 Z`} fill={C.red} />
      <rect x={-r * 0.32} y={r * 0.74} width={r * 0.64} height={s * 0.06} rx={s * 0.03} fill={C.redShade} />
      {steam > 0 &&
        [-0.16, 0.04].map((dx, i) => (
          <path key={dx} d={`M ${s * dx} ${-s * 0.2} q ${s * 0.08} ${-s * 0.1} 0 ${-s * 0.2} t 0 ${-s * 0.2}`} fill="none" stroke={C.grayShade} strokeWidth={s * 0.045} strokeLinecap="round"
            opacity={0.5 + 0.5 * Math.sin(steam * 6 + i * 2)} transform={`translate(0 ${-((steam * 40 + i * 14) % 18)})`} />
        ))}
    </g>
  );
};

/** Nigiri sushi: rice block, salmon slice with stripes, nori band. */
export const Sushi: React.FC<{x: number; y: number; size: number; rotate?: number}> = ({x, y, size: s, rotate = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
    <rect x={-s * 0.42} y={-s * 0.02} width={s * 0.84} height={s * 0.3} rx={s * 0.14} fill={C.lightGray} />
    <rect x={-s * 0.42} y={-s * 0.02} width={s * 0.74} height={s * 0.3} rx={s * 0.14} fill="#FFFFFF" />
    <rect x={-s * 0.5} y={-s * 0.2} width={s * 1.0} height={s * 0.26} rx={s * 0.13} fill={C.orangeShade} />
    <rect x={-s * 0.5} y={-s * 0.2} width={s * 0.9} height={s * 0.26} rx={s * 0.13} fill={C.orange} />
    {[-0.24, -0.04, 0.16].map((dx) => (
      <line key={dx} x1={s * dx} y1={-s * 0.17} x2={s * (dx + 0.1)} y2={s * 0.03} stroke="#FFFFFF" strokeWidth={s * 0.03} strokeLinecap="round" opacity={0.7} />
    ))}
    <rect x={-s * 0.08} y={-s * 0.22} width={s * 0.16} height={s * 0.52} rx={s * 0.03} fill={C.charcoal} />
  </g>
);

/** Burger: sesame bun, lettuce, cheese drip, patty, bottom bun. */
export const Burger: React.FC<{x: number; y: number; size: number; rotate?: number}> = ({x, y, size: s, rotate = 0}) => {
  const w = s * 0.9;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {/* bottom bun */}
      <rect x={-w / 2} y={s * 0.16} width={w} height={s * 0.16} rx={s * 0.08} fill={C.orangeShade} />
      <rect x={-w / 2} y={s * 0.16} width={w * 0.86} height={s * 0.16} rx={s * 0.08} fill={C.orange} />
      {/* patty */}
      <rect x={-w / 2 - s * 0.03} y={s * 0.02} width={w + s * 0.06} height={s * 0.15} rx={s * 0.075} fill={C.owlBrownShade} />
      <rect x={-w / 2 - s * 0.03} y={s * 0.02} width={w * 0.88} height={s * 0.15} rx={s * 0.075} fill={C.owlBrown} />
      {/* cheese */}
      <path d={`M ${-w / 2} ${s * 0.0} L ${w / 2} ${s * 0.0} L ${s * 0.14} ${s * 0.1} L ${s * 0.04} ${s * 0.03} L ${-s * 0.2} ${s * 0.12} Z`} fill={C.yellow} strokeLinejoin="round" stroke={C.yellow} strokeWidth={s * 0.02} />
      {/* lettuce */}
      <path d={`M ${-w / 2 - s * 0.04} ${-s * 0.02} q ${s * 0.06} ${s * 0.07} ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0 t ${s * 0.12} 0`} fill="none" stroke={C.green} strokeWidth={s * 0.06} strokeLinecap="round" />
      {/* top bun */}
      <path d={`M ${-w / 2} ${-s * 0.04} A ${w / 2} ${s * 0.34} 0 0 1 ${w / 2} ${-s * 0.04} Z`} fill={C.orangeShade} />
      <path d={`M ${-w / 2} ${-s * 0.04} A ${w * 0.43} ${s * 0.32} 0 0 1 ${w * 0.36} ${-s * 0.04} Z`} fill={C.orange} />
      {[[-0.2, -0.22], [0.02, -0.28], [-0.05, -0.14], [0.18, -0.18], [-0.32, -0.12]].map(([dx, dy]) => (
        <ellipse key={`${dx}${dy}`} cx={s * dx} cy={s * dy} rx={s * 0.03} ry={s * 0.018} fill={C.owlCream} />
      ))}
    </g>
  );
};

// ---------- Food kit (EP05 YouTube): squash/scale-able props with shade crescents, optional faces ----------
// RamenBowl / Nigiri / BurgerStack are the richer variants of Ramen / Sushi / Burger above (pivot at the base).
// Each draws centred on (x, y) with `size` ≈ its width,
// keeps the shade-crescent look via Character, and takes rotate / scale / squash (pivot at the base).

type Base = {x: number; y: number; size: number; rotate?: number; scale?: number; squash?: number};

export const FOOD = {
  broth: '#F6B85A', brothShade: '#E39A3A',
  noodle: '#FFE27A',
  bun: '#F2A54A', bunShade: '#D9852A',
  patty: '#7A3F1E', pattyShade: '#5A2B12',
  lettuce: '#3CC13B',
  rice: '#FFFFFF', riceShade: '#E2DFDA',
  salmon: '#FF8A4C', salmonShade: '#E86A2A',
  dough: '#E9B46A', doughShade: '#C98F45',
  cone: '#E9B46A', coneShade: '#C98F45',
  choco: '#6B3A1E', chocoShade: '#4A2512',
  nori: '#24402F',
};

const Wrap: React.FC<Base & {baseY: number; children: React.ReactNode}> = ({x, y, rotate = 0, scale = 1, squash = 1, baseY, children}) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale}) translate(0 ${baseY}) scale(${squash} ${1 / squash}) translate(0 ${-baseY})`}>{children}</g>
);

/** Wavy steam wisps above (0, top). `t` is a running time value (frames / fps). */
export const Steam: React.FC<{x: number; y: number; size: number; t: number; opacity?: number; color?: string}> = ({x, y, size: s, t, opacity = 1, color = C.grayShade}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity} fill="none" stroke={color} strokeWidth={s * 0.05} strokeLinecap="round">
    {[-0.25, 0, 0.25].map((dx, i) => {
      const k = ((t * 0.6 + i * 0.33) % 1);
      const yy = -k * s * 0.35;
      const sway = Math.sin(t * 3 + i) * s * 0.03;
      return (
        <path key={i} opacity={Math.sin(k * Math.PI)}
          d={`M ${dx * s + sway} ${yy} q ${s * 0.06} ${-s * 0.08} 0 ${-s * 0.16} q ${-s * 0.06} ${-s * 0.08} 0 ${-s * 0.16}`} />
      );
    })}
  </g>
);

/** RamenBowl bowl: red bowl, broth, noodles, egg, nori, naruto. Optional face on the bowl and steam. */
export const RamenBowl: React.FC<Base & {face?: Expression; blink?: number; look?: {x: number; y: number}; talk?: number; steam?: number; t?: number}> = ({face, blink, look, talk, steam = 0, t = 0, ...b}) => {
  const s = b.size;
  const bowlH = s * 0.46;
  return (
    <Wrap {...b} baseY={bowlH}>
      {steam > 0.01 && <Steam x={0} y={-s * 0.14} size={s} t={t} opacity={steam} />}
      {/* nori sheet behind the broth line */}
      <rect x={-s * 0.3} y={-s * 0.3} width={s * 0.15} height={s * 0.32} rx={s * 0.02} fill={FOOD.nori} transform={`rotate(-12 ${-s * 0.22} 0)`} />
      {/* noodle mound */}
      <path d={`M ${-s * 0.4} 0 Q ${-s * 0.2} ${-s * 0.2} 0 ${-s * 0.17} Q ${s * 0.25} ${-s * 0.2} ${s * 0.42} 0 Z`} fill={FOOD.noodle} />
      <g fill="none" stroke={C.yellowShade} strokeWidth={s * 0.022} strokeLinecap="round">
        {[-0.26, -0.1, 0.06].map((dx, i) => (
          <path key={i} d={`M ${dx * s} ${-s * 0.02} q ${s * 0.04} ${-s * 0.05} ${s * 0.08} 0 q ${s * 0.04} ${-s * 0.05} ${s * 0.08} 0`} />
        ))}
      </g>
      {/* egg */}
      <ellipse cx={s * 0.22} cy={-s * 0.08} rx={s * 0.12} ry={s * 0.085} fill="#FFFFFF" />
      <circle cx={s * 0.23} cy={-s * 0.075} r={s * 0.05} fill={C.orange} />
      {/* naruto */}
      <circle cx={-s * 0.02} cy={-s * 0.1} r={s * 0.07} fill="#FFFFFF" />
      <path d={`M ${-s * 0.02} ${-s * 0.1} m ${-s * 0.035} 0 a ${s * 0.035} ${s * 0.035} 0 1 1 ${s * 0.035} ${s * 0.035}`} fill="none" stroke={C.pink} strokeWidth={s * 0.018} strokeLinecap="round" />
      {/* broth rim */}
      <ellipse cx={0} cy={0} rx={s * 0.5} ry={s * 0.06} fill={FOOD.brothShade} />
      {/* bowl: shade body + lit body offset (crescent) */}
      <path d={`M ${-s * 0.52} 0 A ${s * 0.52} ${bowlH} 0 0 0 ${s * 0.52} 0 Z`} fill={C.redShade} />
      <path d={`M ${-s * 0.52} 0 A ${s * 0.45} ${bowlH * 0.9} 0 0 0 ${s * 0.38} 0 Z`} fill={C.red} />
      <rect x={-s * 0.52} y={-s * 0.025} width={s * 1.04} height={s * 0.05} rx={s * 0.025} fill="#FFFFFF" />
      {face && (
        <g transform={`translate(${-s * 0.02} ${bowlH * 0.45})`}>
          <Face expression={face} size={s * 0.3} blink={blink} look={look} talk={talk} ink={C.ink} />
        </g>
      )}
    </Wrap>
  );
};

/** Salmon nigiri: rice capsule + salmon slab with fat stripes. */
export const Nigiri: React.FC<Base> = (b) => {
  const s = b.size;
  return (
    <Wrap {...b} baseY={s * 0.24}>
      <Character shape="capsule" w={s * 0.92} h={s * 0.34} color={FOOD.rice} shade={FOOD.riceShade} x={0} y={s * 0.07} noFace />
      <Character shape="capsule" w={s} h={s * 0.28} color={FOOD.salmon} shade={FOOD.salmonShade} x={0} y={-s * 0.1} noFace />
      <g stroke="#FFD3B8" strokeWidth={s * 0.035} strokeLinecap="round">
        {[-0.28, -0.06, 0.16, 0.36].map((dx, i) => <line key={i} x1={dx * s} y1={-s * 0.2} x2={dx * s - s * 0.08} y2={-s * 0.0} />)}
      </g>
    </Wrap>
  );
};

/** BurgerStack: domed sesame bun, lettuce, cheese, patty, bottom bun. */
export const BurgerStack: React.FC<Base> = (b) => {
  const s = b.size;
  return (
    <Wrap {...b} baseY={s * 0.36}>
      <Character shape="capsule" w={s * 0.94} h={s * 0.16} color={FOOD.bun} shade={FOOD.bunShade} x={0} y={s * 0.28} noFace />
      <Character shape="capsule" w={s} h={s * 0.18} color={FOOD.patty} shade={FOOD.pattyShade} x={0} y={s * 0.15} noFace />
      <path d={`M ${-s * 0.48} ${s * 0.05} L ${s * 0.48} ${s * 0.05} L ${s * 0.34} ${s * 0.15} L ${s * 0.18} ${s * 0.07} L ${-s * 0.05} ${s * 0.17} L ${-s * 0.22} ${s * 0.07} L ${-s * 0.38} ${s * 0.15} Z`} fill={C.yellow} />
      <path d={`M ${-s * 0.52} ${s * 0.04} ${Array.from({length: 8}, (_, i) => `q ${s * 0.065} ${i % 2 ? -s * 0.07 : s * 0.07} ${s * 0.13} 0`).join(' ')}`} fill="none" stroke={FOOD.lettuce} strokeWidth={s * 0.07} strokeLinecap="round" strokeLinejoin="round" />
      <Character shape="dome" w={s} h={s * 0.4} color={FOOD.bun} shade={FOOD.bunShade} x={0} y={-s * 0.17} noFace />
      {[[-0.22, -0.2], [0, -0.28], [0.2, -0.2], [-0.08, -0.14], [0.12, -0.12]].map(([dx, dy], i) => (
        <ellipse key={i} cx={dx * s} cy={dy * s} rx={s * 0.03} ry={s * 0.016} fill={C.offWhite} transform={`rotate(${i * 35} ${dx * s} ${dy * s})`} />
      ))}
    </Wrap>
  );
};

const SPRINKLES = [C.yellow, C.lightBlue, '#FFFFFF', C.green, C.orange];

/** Pink-frosted donut with sprinkles (a real hole via even-odd fill). */
export const Donut: React.FC<Base & {color?: string}> = ({color = C.pink, ...b}) => {
  const s = b.size;
  const R = s / 2;
  const r = s * 0.17;
  const ring = (rr: number, ri: number, dx = 0, dy = 0) =>
    `M ${dx - rr} ${dy} a ${rr} ${rr} 0 1 0 ${rr * 2} 0 a ${rr} ${rr} 0 1 0 ${-rr * 2} 0 Z M ${-ri} 0 a ${ri} ${ri} 0 1 1 ${ri * 2} 0 a ${ri} ${ri} 0 1 1 ${-ri * 2} 0 Z`;
  return (
    <Wrap {...b} baseY={R}>
      <path d={ring(R, r)} fill={FOOD.doughShade} fillRule="evenodd" />
      <path d={ring(R * 0.97, r, -s * 0.02, -s * 0.02)} fill={FOOD.dough} fillRule="evenodd" />
      <path d={ring(R * 0.84, r * 1.15, -s * 0.03, -s * 0.03)} fill={color} fillRule="evenodd" />
      {Array.from({length: 12}, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.3;
        const rad = (i % 2 ? 0.3 : 0.37) * s;
        return <rect key={i} x={-s * 0.03} y={-s * 0.01} width={s * 0.06} height={s * 0.02} rx={s * 0.01} fill={SPRINKLES[i % SPRINKLES.length]}
          transform={`translate(${Math.cos(a) * rad - s * 0.03} ${Math.sin(a) * rad - s * 0.03}) rotate(${i * 47})`} />;
      })}
    </Wrap>
  );
};

/** Ice-cream cone with one or more stacked scoops (colors top → bottom). */
export const IceCream: React.FC<Base & {scoops?: string[]}> = ({scoops = [C.pink], ...b}) => {
  const s = b.size;
  const coneH = s * 0.9;
  const sr = s * 0.36;
  return (
    <Wrap {...b} baseY={coneH}>
      <path d={`M ${-s * 0.42} 0 L 0 ${coneH} L ${s * 0.42} 0 Z`} fill={FOOD.coneShade} />
      <path d={`M ${-s * 0.42} 0 L 0 ${coneH} L ${s * 0.26} 0 Z`} fill={FOOD.cone} />
      <g stroke={FOOD.coneShade} strokeWidth={s * 0.03} strokeLinecap="round">
        <line x1={-s * 0.24} y1={s * 0.08} x2={s * 0.12} y2={s * 0.5} />
        <line x1={s * 0.0} y1={s * 0.06} x2={-s * 0.2} y2={s * 0.4} />
        <line x1={s * 0.22} y1={s * 0.1} x2={-s * 0.06} y2={s * 0.6} />
      </g>
      {scoops.slice().reverse().map((col, i) => (
        <Character key={i} shape="circle" w={sr * 2} h={sr * 1.8} color={col} shade={shadeOf(col)} x={0} y={-sr * 0.55 - i * sr * 1.25} noFace />
      ))}
    </Wrap>
  );
};

/** Chocolate bar with a peeled wrapper. */
export const Chocolate: React.FC<Base> = (b) => {
  const s = b.size;
  const w = s * 0.62;
  const h = s;
  return (
    <Wrap {...b} baseY={h / 2}>
      <Character shape="roundRect" w={w} h={h} color={FOOD.choco} shade={FOOD.chocoShade} x={0} y={0} noFace />
      {[0, 1].map((cx) => [0, 1].map((cy) => (
        <rect key={`${cx}${cy}`} x={-w * 0.36 + cx * w * 0.38} y={-h * 0.42 + cy * h * 0.2} width={w * 0.3} height={h * 0.16} rx={s * 0.03} fill="#8A4E2A" />
      )))}
      <path d={`M ${-w / 2} ${h * 0.02} L ${w / 2} ${-h * 0.06} L ${w / 2} ${h / 2 - s * 0.05} Q ${w / 2} ${h / 2} ${w / 2 - s * 0.05} ${h / 2} L ${-w / 2 + s * 0.05} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} ${h / 2 - s * 0.05} Z`} fill={C.blue} />
      <rect x={-w / 2} y={h * 0.18} width={w} height={h * 0.08} fill={C.yellow} />
    </Wrap>
  );
};

const SHADES: Record<string, string> = {
  [C.pink]: C.pinkShade, [C.yellow]: C.yellowShade, [C.lightBlue]: C.lightBlueShade, [C.green]: C.greenShade,
  [C.orange]: C.orangeShade, [C.purple]: C.purpleShade, [FOOD.choco]: FOOD.chocoShade, '#FFFFFF': C.lightGray, [C.offWhite]: C.lightGray,
};
const shadeOf = (c: string) => SHADES[c] ?? C.grayShade;

export type FoodKind = 'ramen' | 'sushi' | 'burger' | 'donut' | 'icecream' | 'chocolate';

/** Any food by kind, for menus and lists. */
export const FoodIcon: React.FC<Base & {kind: FoodKind}> = ({kind, ...b}) => {
  switch (kind) {
    case 'ramen': return <RamenBowl {...b} />;
    case 'sushi': return <Nigiri {...b} />;
    case 'burger': return <BurgerStack {...b} />;
    case 'donut': return <Donut {...b} />;
    case 'icecream': return <IceCream {...b} size={b.size * 0.7} />;
    case 'chocolate': return <Chocolate {...b} size={b.size * 0.9} />;
  }
};

/**
 * Food-delivery menu on a phone screen (screen-local coords, see Phone): a list of cards that scrolls by `scroll` px.
 * Cards have a food icon and text-free placeholder lines; `highlight` rings the card at that index.
 */
export const MenuScreen: React.FC<{sw: number; sh: number; items: FoodKind[]; scroll: number; highlight?: number; hlK?: number}> = ({sw, sh, items, scroll, highlight, hlK = 0}) => {
  const pad = sw * 0.07;
  const ch = sh * 0.2;
  const gap = sh * 0.04;
  const top = -sh / 2 + sh * 0.13;
  const span = items.length * (ch + gap);
  return (
    <g>
      {Array.from({length: items.length * 3}).map((_, i) => {
        const kind = items[i % items.length];
        let y = top + i * (ch + gap) - (scroll % span);
        if (y < -sh / 2 - ch) y += span * 2;
        if (y > sh / 2 + ch) return null;
        const hl = highlight !== undefined && i % items.length === highlight;
        return (
          <g key={i}>
            {hl && hlK > 0.01 && <rect x={-sw / 2 + pad - 8} y={y - 8} width={sw - pad * 2 + 16} height={ch + 16} rx={ch * 0.28} fill={C.yellow} opacity={hlK} />}
            <rect x={-sw / 2 + pad} y={y} width={sw - pad * 2} height={ch} rx={ch * 0.22} fill="#FFFFFF" />
            <FoodIcon kind={kind} x={-sw / 2 + pad + ch * 0.55} y={y + ch * 0.48} size={ch * 0.62} />
            <rect x={-sw / 2 + pad + ch * 1.1} y={y + ch * 0.3} width={sw * 0.34} height={ch * 0.13} rx={ch * 0.065} fill={C.ink} opacity={0.75} />
            <rect x={-sw / 2 + pad + ch * 1.1} y={y + ch * 0.56} width={sw * 0.22} height={ch * 0.11} rx={ch * 0.055} fill={C.grayShade} />
          </g>
        );
      })}
      <rect x={-sw / 2} y={-sh / 2} width={sw} height={sh * 0.09} fill={C.orange} />
      <rect x={-sw / 2 + pad} y={-sh / 2 + sh * 0.03} width={sw * 0.4} height={sh * 0.03} rx={sh * 0.015} fill="#FFFFFF" />
    </g>
  );
};
