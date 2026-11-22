import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {Owl} from '../Owl';
import {C, FONT_EN, FONT_JA} from '../theme';
import {lineStart, sceneWindow, talkLevel, timelineFrames, VoiceEnvelope, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {Captions, NarrationSubs} from '../lib/Captions';
import {blinkAt, breathe, darting, landing, lerp, pulse} from '../lib/motion';
import {IconBubble} from '../props/Home';
import {ClockFace, Phone} from '../props/Phone';
import {CommentBubble, Headphones, Mic, ProgressBar} from '../props/Icons';
import {MarkBadge} from '../props/Marks';
import {BurgerStack, Donut, FOOD, FoodIcon, FoodKind, IceCream, MenuScreen, Nigiri, RamenBowl} from '../props/Food';
import timeline from '../../public/audio/ep05-what-should-i-eat-yt/timeline.json';
import envelope from '../../public/audio/ep05-what-should-i-eat-yt/envelope.json';

// Episode 5 · "What Should I Eat?" — YouTube 16:9, ~3:00.
// Voices: Sarah (EN story & model lines), JA host narration. Story audio is reused for the bilingual replay.
const tl = timeline as VoiceTimeline;
const env = envelope as VoiceEnvelope;
const FPS = 30;
const W = 1920;
const H = 1080;
export const EP05YT_FRAMES = timelineFrames(tl, FPS);

const win = (ids: string[]) => sceneWindow(tl, FPS, ids);
const sec = (s: number) => Math.round(s * FPS);
const durOf = (id: string) => sec(tl.segments.find((s) => s.id === id)!.duration_s);

const W_OPEN = win(['N01']);
const W_A = ['A01', 'A02', 'A03', 'A04', 'A05'].map((id) => win([id]));
const W_ANS = win(['N02']);
const W_B = ['B01', 'B02', 'B03', 'B04', 'B05'].map((id) => win([id]));
const W_KEY = win(['N03', 'C02']);
const W_SWEET = win(['N05', 'N06']);
const W_FLAV = win(['C04', 'N07']);
const W_PRAC = win(['N08', 'P03']);
const W_END = win(['N10', 'N11']);

const rel = (id: string, w: {from: number}) => lineStart(tl, FPS, id) - w.from;
const HOST_IDS = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N09', 'N10', 'N11'];
const hostTalk = (globalFrame: number) => talkLevel(tl, env, FPS, globalFrame, HOST_IDS);

// ---------- layout ----------
const FLOOR = 800;
const HERO = {w: 330, h: 290};
const HERO_X = 640;
const HERO_Y = FLOOR - HERO.h / 2;
const TABLE = {x: 1250, top: 640, w: 440};
const CAP_TOP = 860;
const HOST = {w: 250, h: 330};
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// ---------- shared pieces ----------
const Floor: React.FC<{y?: number; top?: string; bottom?: string}> = ({y = FLOOR, top = C.lightGray, bottom = C.grayShade}) => (
  <g>
    <rect x={-20} y={y} width={W + 40} height={50} fill={top} />
    <rect x={-20} y={y + 50} width={W + 40} height={H - y} fill={bottom} />
  </g>
);

/** Night window with moon and stars. */
const NightWindow: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => {
  const f = useCurrentFrame();
  return (
    <g>
      <rect x={x + 10} y={y + 10} width={w} height={h} rx={26} fill={C.lightGray} />
      <rect x={x} y={y} width={w} height={h} rx={26} fill={C.night} />
      <circle cx={x + w * 0.72} cy={y + h * 0.34} r={h * 0.15} fill={C.yellow} />
      <circle cx={x + w * 0.66} cy={y + h * 0.3} r={h * 0.14} fill={C.night} />
      {[[0.2, 0.3], [0.38, 0.62], [0.55, 0.22], [0.85, 0.72], [0.15, 0.75]].map(([sx, sy], i) => (
        <circle key={i} cx={x + w * sx} cy={y + h * sy} r={5 + 2 * Math.sin(f / 9 + i * 1.7)} fill="#FFFFFF" opacity={0.85} />
      ))}
      <rect x={x + w / 2 - 6} y={y} width={12} height={h} fill={C.offWhite} />
      <rect x={x} y={y + h / 2 - 6} width={w} height={12} fill={C.offWhite} />
    </g>
  );
};

const Table: React.FC = () => (
  <g>
    <rect x={TABLE.x - TABLE.w / 2 + 40} y={TABLE.top + 20} width={26} height={FLOOR - TABLE.top - 20} fill={C.orangeShade} />
    <rect x={TABLE.x + TABLE.w / 2 - 66} y={TABLE.top + 20} width={26} height={FLOOR - TABLE.top - 20} fill={C.orangeShade} />
    <rect x={TABLE.x - TABLE.w / 2} y={TABLE.top + 8} width={TABLE.w} height={30} rx={15} fill={C.orangeShade} />
    <rect x={TABLE.x - TABLE.w / 2} y={TABLE.top} width={TABLE.w - 12} height={30} rx={15} fill={C.orange} />
  </g>
);

/** Clock that reads 8:00; `sweep` (0..1) runs the minute hand up the last quarter hour. */
const Clock: React.FC<{sweep?: number; scale?: number}> = ({sweep = 1, scale = 1}) => {
  const a = 3600 - 90 * (1 - sweep); // minute-hand degrees; hour hand = a/12 + 300 → 8 o'clock at a = 3600
  return <ClockFace x={830} y={200} size={180} progress={a / 720} scale={scale} />;
};

const Room: React.FC<{sweep?: number; table?: boolean; clockScale?: number}> = ({sweep = 1, table = true, clockScale = 1}) => (
  <g>
    <NightWindow x={170} y={150} w={330} h={250} />
    <Clock sweep={sweep} scale={clockScale} />
    {table && <Table />}
    <Floor />
  </g>
);

type HeroProps = {x?: number; y?: number; w?: number; h?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; talk?: number};

/** Yellow hero (series lead). */
const Hero: React.FC<HeroProps> = ({x = HERO_X, y = HERO_Y, w = HERO.w, h = HERO.h, ...p}) => (
  <Character shape="roundRect" w={w} h={h} color={C.yellow} shade={C.yellowShade} x={x} y={y} faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />
);

/** The host (JA narrator): light-blue half-pill that rises from behind the floor line and talks. */
const Host: React.FC<{x: number; floorY: number; enter: number; offset: number; look?: {x: number; y: number}; exit?: number; w?: number; h?: number}> = ({
  x, floorY, enter, offset, look = {x: 0.6, y: 0}, exit, w = HOST.w, h = HOST.h,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const inK = spring({frame: f - enter, fps, config: {damping: 12, stiffness: 150}});
  const outK = exit !== undefined ? spring({frame: f - exit, fps, config: {damping: 14, stiffness: 160}}) : 0;
  const rise = (1 - inK + outK) * (h + 40);
  const talk = hostTalk(f + offset);
  return (
    <Character shape="halfPill" w={w} h={h} color={C.lightBlue} shade={C.lightBlueShade} x={x} y={floorY - h / 2 + rise}
      expression={talk > 0 ? 'happy' : 'calm'} talk={talk} look={look} blink={blinkAt(f, 84, 17)}
      squash={breathe(f, fps, 2, 0.4) * (1 + talk * 0.03)} faceSize={w * 0.5} faceOffset={{x: 0, y: -h * 0.05}} />
  );
};

/** Color block that pushes up from the bottom (mode "in", covers) or leaves through the top (mode "out", reveals). */
const BlockWipe: React.FC<{mode: 'in' | 'out'; from: number; dur?: number; color?: string}> = ({mode, from, dur = 12, color = C.lightBlue}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [from, from + dur], [0, 1], {easing: ease, ...clamp});
  const y = mode === 'in' ? H * (1 - k) : -H * k;
  if ((mode === 'in' && k <= 0) || (mode === 'out' && k >= 1)) return null;
  return <AbsoluteFill style={{transform: `translateY(${y}px)`, backgroundColor: color}} />;
};

const pill: React.CSSProperties = {position: 'absolute', left: 60, top: 50, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px 14px 22px', borderRadius: 40, background: '#FFFFFF',
  boxShadow: `6px 6px 0 ${C.lightGray}`, transformOrigin: 'left center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 36, color: C.ink};

const Badge: React.FC<{label: string; icon?: 'listen'}> = ({label, icon}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f - 2, fps, config: {damping: 13, stiffness: 180}});
  return (
    <div style={{...pill, transform: `scale(${k})`}}>
      {icon === 'listen' && <svg width={44} height={44} viewBox="-22 -22 44 44"><Headphones x={0} y={-6} size={40} /></svg>}
      {label}
    </div>
  );
};

const Heart: React.FC<{x: number; y: number; size: number; color?: string; opacity?: number; rotate?: number}> = ({x, y, size: s, color = C.red, opacity = 1, rotate = 0}) => (
  <path transform={`translate(${x} ${y}) rotate(${rotate})`} opacity={opacity} fill={color}
    d={`M 0 ${s * 0.32} C ${-s * 0.62} ${-s * 0.08} ${-s * 0.32} ${-s * 0.58} 0 ${-s * 0.2} C ${s * 0.32} ${-s * 0.58} ${s * 0.62} ${-s * 0.08} 0 ${s * 0.32} Z`} />
);

/** Hearts drifting up from (x, y) after frame `at`. */
const Hearts: React.FC<{x: number; y: number; at: number; spread?: number}> = ({x, y, at, spread = 200}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <g>
      {[0, 1, 2, 3].map((i) => {
        const t = ((f - at + i * 14) % 56) / 56;
        const born = f - at >= i * 6;
        if (!born) return null;
        const dx = (i % 2 ? 1 : -1) * (spread * 0.3 + i * spread * 0.12) + Math.sin(t * 6 + i) * 14;
        return <Heart key={i} x={x + dx} y={y - t * 220} size={56 + (i % 2) * 18} color={i % 2 ? C.pink : C.red} opacity={Math.sin(t * Math.PI)} rotate={(i % 2 ? 12 : -12)} />;
      })}
    </g>
  );
};

/** Floating question marks above (x, y) — indecision. */
const Qmarks: React.FC<{x: number; y: number; at: number}> = ({x, y, at}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (f < at) return null;
  return (
    <g>
      {[-1, 0, 1].map((d, i) => {
        const k = spring({frame: f - at - i * 5, fps, config: {damping: 8, stiffness: 220}});
        return (
          <text key={d} x={x + d * 95} y={y - (d === 0 ? 40 : 0) + 6 * Math.sin(f / 6 + i)} transform={`rotate(${d * 16 + 4 * Math.sin(f / 7 + i)} ${x + d * 95} ${y})`}
            textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={90 * k} fill={i === 1 ? C.blue : C.purple}>?</text>
        );
      })}
    </g>
  );
};

/** Stomach-rumble wavy lines beside the hero. */
const Rumble: React.FC<{x: number; y: number; at: number; dur?: number}> = ({x, y, at, dur = 40}) => {
  const f = useCurrentFrame();
  const t = (f - at) / dur;
  if (t < 0 || t > 1) return null;
  const o = Math.sin(t * Math.PI);
  return (
    <g fill="none" stroke={C.ink} strokeWidth={9} strokeLinecap="round" opacity={o}>
      {[0, 1, 2].map((i) => {
        const xx = x + 30 + i * 34 + t * 30;
        return <path key={i} d={`M ${xx} ${y - 60 + i * 40} q 12 -12 24 0 q 12 12 24 0`} transform={`rotate(${-20 + i * 20} ${xx} ${y})`} />;
      })}
    </g>
  );
};

/** Thought bubble with two trailing dots toward (tx, ty). */
const Thought: React.FC<{x: number; y: number; size: number; scale: number; rotate?: number; tx: number; ty: number; badge?: 'x' | '?'; badgeK?: number; children: React.ReactNode}> = ({x, y, size, scale, rotate = 0, tx, ty, badge, badgeK, children}) => {
  if (scale < 0.01) return null;
  return (
    <g>
      {[0.55, 0.78].map((t, i) => (
        <circle key={i} cx={lerp(x, tx, t)} cy={lerp(y + size * 0.4, ty, t)} r={(i ? 12 : 20) * Math.min(1, scale)} fill="#FFFFFF" />
      ))}
      <IconBubble x={x} y={y} size={size} scale={scale} rotate={rotate} badge={badge} badgeK={badgeK}>{children}</IconBubble>
    </g>
  );
};

// ---------- story beats (first listen + bilingual replay) ----------
type StoryProps = {captions: boolean};
const capProps = {top: CAP_TOP, enSize: 46, jaSize: 34, width: 1700};
const HERO_TOP = HERO_Y - HERO.h / 2;
const TAIL = {x: HERO_X + 60, y: HERO_TOP - 10};
// food bubbles: wide row (A02) → small top row (A03)
const BIG = [{x: 1060, y: 330}, {x: 1340, y: 290}, {x: 1620, y: 330}];
const SMALL = [{x: 1000, y: 150}, {x: 1260, y: 130}, {x: 1520, y: 150}];
const KINDS: FoodKind[] = ['ramen', 'sushi', 'burger'];
const foodIn = (k: FoodKind, s: number) => <FoodIcon kind={k} x={0} y={k === 'ramen' ? -s * 0.12 : 0} size={s} />;
const MENU: FoodKind[] = ['sushi', 'burger', 'donut', 'ramen', 'icecream', 'chocolate'];
const PHONE = {x: 1250, y: 470, scale: 1.55};

const Story1: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const land = landing(f, fps, 0, 12, HERO_Y - 700, HERO_Y);
  const sweep = spring({frame: f - 6, fps, config: {damping: 16, stiffness: 60}});
  const G = sec(2.9);
  const hungry = f >= G;
  const shake = f >= G && f < G + 24 ? 4 * Math.sin((f - G) * 1.6) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Room sweep={sweep} clockScale={pulse(f, fps, 26, 0.15)} />
        <Hero y={land.y} squash={f < 30 ? land.squash : breathe(f, fps) * pulse(f, fps, G, 0.18) * (hungry ? 1.06 : 1)} rotate={shake}
          expression={hungry ? 'sad' : f < 14 ? 'happy' : 'look'} look={hungry ? {x: 0, y: 0.4} : {x: -1, y: -1}} blink={blinkAt(f, 80, 50)} />
        <Rumble x={HERO_X + HERO.w / 2} y={HERO_Y + 40} at={G + 2} dur={46} />
      </svg>
      {captions && <Captions {...capProps} start={0} en="It's already 8 p.m. and I'm starving." ja="もう夜8時。お腹ペコペコ。" highlight={['starving']} spokenFrames={sec(4.2)} />}
    </AbsoluteFill>
  );
};

const POPS = [sec(0.15), sec(1.05), sec(2.85)];

const Story2: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = (at: number) => spring({frame: f - at, fps, config: {damping: 9, stiffness: 200}});
  const idx = POPS.filter((p) => f >= p).length - 1;
  const targets = [{x: 0.7, y: -0.9}, {x: 0.9, y: -1}, {x: 1, y: -0.8}];
  const look = idx < 0 ? {x: 0.6, y: -0.6} : targets[idx];
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Room />
        <Hero squash={breathe(f, fps) * pulse(f, fps, POPS[0], 0.06) * pulse(f, fps, POPS[1], 0.06) * pulse(f, fps, POPS[2], 0.06)} expression="look" look={look} blink={blinkAt(f, 80, 20)} />
        {KINDS.map((kind, i) => (
          <Thought key={kind} x={BIG[i].x} y={BIG[i].y} size={230} scale={k(POPS[i])} rotate={2 * Math.sin(f / 12 + i)} tx={TAIL.x} ty={TAIL.y}>{foodIn(kind, 150)}</Thought>
        ))}
      </svg>
      {captions && <Captions {...capProps} start={0} en="Ramen, sushi, or a burger?" ja="ラーメン？お寿司？それともハンバーガー？" />}
    </AbsoluteFill>
  );
};

/** Bubble positions / scales shared by Story3 and Story4. */
const smallBubbles = (f: number, from = 0) => {
  const t = interpolate(f, [from, from + 16], [0, 1], {easing: ease, ...clamp});
  return KINDS.map((_, i) => ({x: lerp(BIG[i].x, SMALL[i].x, t), y: lerp(BIG[i].y, SMALL[i].y, t), scale: lerp(1, 0.66, t)}));
};

const Story3: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const MIND = sec(2.75);
  const stuck = f >= MIND;
  const phoneIn = spring({frame: f - 2, fps, config: {damping: 14, stiffness: 120}});
  const scroll = Math.max(0, f - 10) * 7 + (stuck ? Math.max(0, f - MIND) * 5 : 0);
  const bub = smallBubbles(f);
  const eyes = darting(f, fps, [{x: 0.9, y: 0.2}, {x: 0.9, y: 0.7}], 10);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Room />
        <Hero expression={stuck ? 'strained' : 'look'} look={eyes} rotate={stuck ? 6 * Math.sin(f / 3) : 0}
          squash={breathe(f, fps) * pulse(f, fps, MIND, 0.12)} blink={blinkAt(f, 90, 10)} />
        {KINDS.map((kind, i) => (
          <Thought key={kind} x={bub[i].x} y={bub[i].y} size={230} scale={bub[i].scale} rotate={(stuck ? 9 : 2) * Math.sin(f / (stuck ? 4 : 12) + i * 2)} tx={TAIL.x} ty={TAIL.y}>{foodIn(kind, 150)}</Thought>
        ))}
        <Phone x={PHONE.x} y={lerp(1400, PHONE.y, phoneIn)} rotate={lerp(18, -5, phoneIn)} scale={PHONE.scale}
          screen={(sw, sh) => <MenuScreen sw={sw} sh={sh} items={MENU} scroll={scroll} />} />
        <Qmarks x={HERO_X} y={HERO_TOP - 60} at={MIND + 6} />
      </svg>
      {captions && <Captions {...capProps} start={0} en="I keep scrolling through the menu, and I can't make up my mind." ja="メニューをスクロールし続けても、決められない。"
        highlight={["can't make up my mind"]} spokenFrames={sec(4.9)} enSize={42} />}
    </AbsoluteFill>
  );
};

const RAMEN_BIG = {x: 1250, y: 330, scale: 1.45};

const Story4: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ACT = sec(1.95);
  const CRAVE = sec(3.7);
  const freeze = f < ACT;
  const bub = smallBubbles(f, -100);
  const grow = spring({frame: f - ACT, fps, config: {damping: 12, stiffness: 130}});
  const gone = spring({frame: f - ACT, fps, config: {damping: 14, stiffness: 200}});
  const phoneOut = spring({frame: f - ACT, fps, config: {damping: 14, stiffness: 120}});
  const bang = spring({frame: f - 2, fps, config: {damping: 7, stiffness: 240}});
  const hop = f >= CRAVE ? landing(f, fps, CRAVE, CRAVE + 10, HERO_Y - 70, HERO_Y, 0.2) : null;
  const expr: Expression = f < ACT ? 'look' : f < CRAVE ? 'calm' : 'happy';
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Room />
        <Hero y={hop ? (f < CRAVE + 10 ? HERO_Y - 70 * Math.sin(((f - CRAVE) / 10) * Math.PI) : hop.y) : HERO_Y} expression={expr}
          look={f < ACT ? {x: 0.2, y: -1} : {x: 1, y: -0.8}} squash={f < 8 ? 1 - 0.1 * Math.sin((f / 8) * Math.PI) : hop && f >= CRAVE + 10 ? hop.squash : breathe(f, fps)}
          blink={f >= 2 && f < 9 ? 1 - Math.abs(f - 5.5) / 3.5 : blinkAt(f, 95, 40)} />
        {KINDS.map((kind, i) => {
          const isRamen = i === 0;
          const x = isRamen ? lerp(bub[0].x, RAMEN_BIG.x, grow) : bub[i].x;
          const y = isRamen ? lerp(bub[0].y, RAMEN_BIG.y, grow) : bub[i].y;
          const s = isRamen ? lerp(bub[0].scale, RAMEN_BIG.scale, grow) : bub[i].scale * (1 - gone);
          return (
            <Thought key={kind} x={x} y={y} size={230} scale={s} rotate={freeze ? 0 : 3 * Math.sin(f / 10 + i)} tx={TAIL.x} ty={TAIL.y}>
              {isRamen ? <RamenBowl x={0} y={-150 * 0.12} size={150} steam={grow} t={f / fps} /> : foodIn(kind, 150)}
            </Thought>
          );
        })}
        {phoneOut < 0.98 && (
          <Phone x={PHONE.x} y={lerp(PHONE.y, 1450, phoneOut)} rotate={lerp(-5, 14, phoneOut)} scale={PHONE.scale}
            screen={(sw, sh) => <MenuScreen sw={sw} sh={sh} items={MENU} scroll={W_A[2].durationInFrames * 7 + 80} highlight={3} hlK={freeze ? 1 : 0} />} />
        )}
        {freeze && <text x={HERO_X + 150} y={HERO_TOP - 30} transform={`rotate(12 ${HERO_X + 150} ${HERO_TOP - 30})`} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={140 * bang} fill={C.blue}>!</text>}
        <Hearts x={HERO_X} y={HERO_TOP - 20} at={CRAVE + 4} />
      </svg>
      {captions && (
        <>
          <Captions {...capProps} start={0} end={ACT - 3} en="Wait." ja="待って。" jaDelay={10} enSize={60} jaSize={44} />
          <Captions {...capProps} start={ACT} en="Actually, I'm really craving ramen tonight." ja="やっぱり、今夜は無性にラーメンが食べたい！" highlight={['craving']} spokenFrames={sec(3.3)} />
        </>
      )}
    </AbsoluteFill>
  );
};

const BOWL = {size: 300, x: TABLE.x};
const BOWL_Y = TABLE.top - BOWL.size * 0.46;

const Story5: React.FC<StoryProps & {fillOut?: boolean}> = ({captions, fillOut}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const bubbleOut = 1 - spring({frame: f, fps, config: {damping: 14, stiffness: 220}});
  const drop = landing(f, fps, 4, 16, -300, BOWL_Y, 0.22);
  const CHECK = sec(1.15);
  const JUMP = sec(1.9);
  const chk = spring({frame: f - CHECK, fps, config: {damping: 8, stiffness: 220}});
  const draw = interpolate(f, [CHECK + 4, CHECK + 16], [0, 1], clamp);
  const jump = f >= JUMP && f < JUMP + 14 ? Math.sin(((f - JUMP) / 14) * Math.PI) : 0;
  const fill = fillOut ? interpolate(f, [D - 14, D], [0, 2300], {easing: Easing.in(Easing.cubic), ...clamp}) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Room />
        <Hero y={HERO_Y - jump * 90} expression="happy" look={{x: 1, y: 0.2}} squash={f >= JUMP + 14 ? pulse(f, fps, JUMP + 14, 0.2) * breathe(f, fps) : 1 - jump * 0.08}
          talk={f >= JUMP && f < JUMP + 30 ? 0.5 : 0} blink={blinkAt(f, 80, 12)} />
        <Thought x={RAMEN_BIG.x} y={RAMEN_BIG.y} size={230} scale={RAMEN_BIG.scale * bubbleOut} tx={TAIL.x} ty={TAIL.y}>
          <RamenBowl x={0} y={-150 * 0.12} size={150} />
        </Thought>
        <RamenBowl x={BOWL.x} y={drop.y} size={BOWL.size} squash={f < 40 ? drop.squash : breathe(f, fps, 2, 1)} face={f < 16 ? 'look' : 'happy'} blink={blinkAt(f, 70, 30)}
          steam={interpolate(f, [16, 30], [0, 1], clamp)} t={f / fps} />
        {f >= CHECK && <MarkBadge kind="check" x={BOWL.x + 190} y={BOWL_Y - 130} size={130} scale={chk} draw={draw} rotate={8} />}
        <Hearts x={HERO_X} y={HERO_TOP - 20} at={-40} />
        {fill > 0 && <circle cx={BOWL.x} cy={BOWL_Y} r={fill} fill={C.charcoal} />}
      </svg>
      {captions && fill < 300 && <Captions {...capProps} start={0} en="Okay, decision made — ramen it is!" ja="よし、決まり。ラーメンにしよう！" highlight={['ramen it is']} spokenFrames={sec(3.1)} />}
    </AbsoluteFill>
  );
};

const StoryBlock: React.FC<{wins: {from: number; durationInFrames: number}[]; captions: boolean; fillOut?: boolean; label: string; listen?: boolean; wipeOut?: boolean}> = ({wins, captions, fillOut, label, listen, wipeOut}) => {
  const base = wins[0].from;
  const at = (i: number) => ({from: wins[i].from - base, durationInFrames: wins[i].durationInFrames});
  return (
    <AbsoluteFill>
      <Sequence {...at(0)}><Story1 captions={captions} /></Sequence>
      <Sequence {...at(1)}><Story2 captions={captions} /></Sequence>
      <Sequence {...at(2)}><Story3 captions={captions} /></Sequence>
      <Sequence {...at(3)}><Story4 captions={captions} /></Sequence>
      <Sequence {...at(4)}><Story5 captions={captions} fillOut={fillOut} /></Sequence>
      <Badge label={label} icon={listen ? 'listen' : undefined} />
      {wipeOut && <BlockWipe mode="out" from={0} />}
    </AbsoluteFill>
  );
};

// ---------- 1. Opening question ----------
const Opening: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const land = landing(f, fps, 0, 14, HERO_Y - 700, HERO_Y);
  const q = spring({frame: f - sec(4.6), fps, config: {damping: 8, stiffness: 180}});
  const pill0 = spring({frame: f - 2, fps, config: {damping: 13, stiffness: 180}});
  const clockPop = pulse(f, fps, sec(4.6), 0.2);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <NightWindow x={170} y={150} w={330} h={250} />
        <ClockFace x={1650} y={250} size={190} progress={5} scale={clockPop} />
        <Table />
        <Host x={260} floorY={FLOOR} enter={12} offset={W_OPEN.from} exit={W_OPEN.durationInFrames - 16} />
        <Floor />
        <Hero x={HERO_X + 120} y={land.y} squash={f < 34 ? land.squash : breathe(f, fps)} expression={f < 18 ? 'look' : 'calm'} look={{x: -0.6, y: 0}} blink={blinkAt(f, 80, 40)} />
        <g transform={`translate(${TABLE.x} ${TABLE.top - 150}) scale(${q}) rotate(${6 * Math.sin(f / 10)})`}>
          <Character shape="circle" w={190} h={190} color={C.blue} shade={C.blueShade} x={0} y={0} noFace />
          <text x={-6} y={8} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={130} fill="#FFFFFF">?</text>
        </g>
      </svg>
      <div style={{...pill, transform: `scale(${pill0})`, paddingLeft: 30}}>Listening Quiz</div>
      <NarrationSubs top={CAP_TOP + 10} start={0} end={W_OPEN.durationInFrames} chunks={[
        {at: 0.6, text: 'これから短い英語のストーリーが流れます。'},
        {at: 4.5, text: '夜8時にお腹が空いた話し手は、最終的に、何を食べることにしたでしょうか？'},
        {at: 10.3, text: 'まずは字幕なしで、聞き取ってみましょう。'},
      ]} size={40} width={1700} />
    </AbsoluteFill>
  );
};

// ---------- 3. Answer reveal ----------
const Answer: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const REVEAL = sec(1.9);
  const card = spring({frame: f - REVEAL, fps, config: {damping: 10, stiffness: 170}});
  const side = spring({frame: f - 6, fps, config: {damping: 11, stiffness: 160}});
  const main = landing(f, fps, REVEAL - 12, REVEAL, -400, FLOOR - 420 * 0.46);
  const mark = (at: number) => spring({frame: f - at, fps, config: {damping: 8, stiffness: 220}});
  const ring = f >= REVEAL ? ((f - REVEAL) % 45) / 45 : 0;
  const RY = FLOOR - 140;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {f >= REVEAL && <circle cx={960} cy={RY} r={200 + ring * 160} fill="none" stroke={C.yellow} strokeWidth={20 * (1 - ring)} opacity={1 - ring} />}
        <Host x={200} floorY={FLOOR} enter={4} offset={W_ANS.from} look={{x: 1, y: -0.3}} />
        <Floor />
        <g opacity={f >= REVEAL ? 0.55 : 1}>
          <Nigiri x={560} y={FLOOR - 0.24 * 220} size={220} scale={side} />
          <BurgerStack x={1360} y={FLOOR - 0.36 * 220} size={220} scale={side} />
        </g>
        {f >= REVEAL && <MarkBadge kind="cross" x={640} y={FLOOR - 170} size={80} scale={mark(REVEAL + 6)} draw={1} />}
        {f >= REVEAL && <MarkBadge kind="cross" x={1450} y={FLOOR - 200} size={80} scale={mark(REVEAL + 10)} draw={1} />}
        {f >= REVEAL - 12 && (
          <RamenBowl x={960} y={main.y} size={420} squash={f < REVEAL + 30 ? main.squash : breathe(f, fps, 2, 1)} face="happy" blink={blinkAt(f, 72, 20)}
            steam={interpolate(f, [REVEAL, REVEAL + 15], [0, 1], clamp)} t={f / fps} />
        )}
        <Hero x={1700} expression={f < REVEAL ? 'look' : f < sec(4.8) ? 'happy' : 'calm'} squash={breathe(f, fps) * pulse(f, fps, REVEAL, 0.1)} look={{x: -1, y: -0.5}}
          w={280} h={250} y={FLOOR - 125} blink={blinkAt(f, 80, 12)} />
        <Hearts x={1700} y={FLOOR - 270} at={sec(4.8)} spread={140} />
      </svg>
      <div style={{position: 'absolute', left: (W - 900) / 2, top: 60, width: 900, padding: '22px 40px', borderRadius: 36, background: '#FFFFFF', boxShadow: `10px 10px 0 ${C.lightGray}`,
        transform: `scale(${card}) rotate(${-1.5 + 1.5 * (1 - card)}deg)`, opacity: Math.min(1, card * 1.5), textAlign: 'center'}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 60, color: C.ink}}>答え：ラーメン！</div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 40, color: C.blue, marginTop: 4}}>ramen it is!</div>
      </div>
      <NarrationSubs top={CAP_TOP + 10} start={0} end={D} chunks={[
        {at: 0, text: '聞き取れましたか？'},
        {at: 1.9, text: '答えは、「ラーメン」でした。'},
        {at: 4.75, text: 'メニューを見ながら迷っていたけれど、今夜は無性にラーメンが食べたいと気づいたんですね。'},
        {at: 11.15, text: 'では、英語と日本語の字幕付きで、もう一度聞いてみましょう。'},
      ]} size={40} width={1700} />
      <BlockWipe mode="in" from={D - 12} />
    </AbsoluteFill>
  );
};

// ---------- 5a. Key expressions ----------
const Card: React.FC<{cx: number; cy: number; show: number; active: boolean; children: React.ReactNode}> = ({cx, cy, show, active, children}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - show, fps, config: {damping: 11, stiffness: 170}});
  const cw = 820;
  const ch = 560;
  if (s < 0.001) return null;
  return (
    <div style={{position: 'absolute', left: cx - cw / 2, top: cy - ch / 2, width: cw, height: ch, transform: `scale(${s * (active ? 1.03 : 0.97)})`, opacity: active ? 1 : 0.8}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: C.yellowShade, transform: 'translate(14px, 14px)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: '#FFFFFF', padding: '48px 44px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>{children}</div>
    </div>
  );
};

const popStyle = (k: number, dy = 16): React.CSSProperties => ({transform: `translateY(${(1 - k) * dy}px) scale(${0.9 + 0.1 * k})`, opacity: Math.min(1, k * 1.5)});

const KeyExpressions: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const open = interpolate(f, [0, 16], [0, 2300], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const sp = (at: number, cfg = {damping: 11, stiffness: 190}) => spring({frame: f - at, fps, config: cfg});
  const c1 = rel('C01', W_KEY);
  const n4 = rel('N04', W_KEY);
  const c2 = rel('C02', W_KEY);
  const strikeAt = sec(5.95);
  const strike = interpolate(f, [strikeAt, strikeAt + 10], [0, 1], {easing: ease, ...clamp});
  const aActive = f < n4;
  return (
    <AbsoluteFill style={{backgroundColor: C.charcoal}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={H / 2} r={open} fill={C.yellow} />
        <Host x={170} floorY={1000} enter={10} offset={W_KEY.from} w={200} h={270} look={{x: 0.8, y: -0.6}} />
        <rect x={-20} y={1000} width={W + 40} height={100} fill={C.yellowShade} />
      </svg>
      <Card cx={520} cy={450} show={8} active={aActive}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 34, color: C.ink, opacity: 0.6}}>「〜が食べたい」</div>
        <div style={{position: 'relative', marginTop: 14, fontFamily: FONT_EN, fontWeight: 900, fontSize: 54, color: C.ink, opacity: 1 - 0.55 * strike, ...popStyle(sp(sec(1.7)))}}>
          I want to eat …
          <div style={{position: 'absolute', left: -10, right: -10, top: '52%', height: 10, borderRadius: 5, background: C.red, transform: `scaleX(${strike})`, transformOrigin: 'left center'}} />
        </div>
        <svg width={80} height={60} viewBox="-40 -30 80 60" style={{marginTop: 10, opacity: strike}}><path d="M -22 -14 L 0 12 L 22 -14" fill="none" stroke={C.yellowShade} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{marginTop: 6, padding: '6px 26px', borderRadius: 22, background: f >= c1 ? C.blue : 'transparent', fontFamily: FONT_EN, fontWeight: 900, fontSize: 72, color: '#FFFFFF', ...popStyle(sp(c1 - 2, {damping: 9, stiffness: 220}))}}>I'm craving …</div>
        <div style={{marginTop: 22, fontFamily: FONT_JA, fontWeight: 900, fontSize: 38, color: C.ink, ...popStyle(sp(c1 + 14))}}>無性に食べたい！めっちゃ食べたい！</div>
      </Card>
      <Card cx={1400} cy={450} show={n4 - 4} active={!aActive}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 34, color: C.ink, opacity: 0.6}}>「決められない・迷っちゃう」</div>
        <svg width={420} height={200} viewBox="-210 -100 420 200" style={{marginTop: 10}}>
          {(['ramen', 'sushi', 'burger'] as FoodKind[]).map((k, i) => (
            <g key={k} transform={`translate(${(i - 1) * 135} ${4 * Math.sin(f / 6 + i * 2)}) rotate(${8 * Math.sin(f / 5 + i)})`}>
              <FoodIcon kind={k} x={0} y={k === 'ramen' ? 0 : 10} size={110} />
            </g>
          ))}
        </svg>
        <div style={{marginTop: 4, padding: '6px 22px', borderRadius: 22, background: f >= c2 ? C.blue : 'transparent', fontFamily: FONT_EN, fontWeight: 900, fontSize: 58, color: '#FFFFFF', whiteSpace: 'nowrap', ...popStyle(sp(c2 - 2, {damping: 9, stiffness: 220}))}}>I can't make up my mind.</div>
        <div style={{marginTop: 22, fontFamily: FONT_JA, fontWeight: 900, fontSize: 38, color: C.ink, ...popStyle(sp(c2 + 14))}}>決められない・迷っちゃう</div>
      </Card>
      <NarrationSubs top={1010} start={0} end={c1} chunks={[
        {at: 0, text: '「〜が食べたい」と言うとき、「I want to eat」ももちろん通じます。'},
        {at: 5.95, text: 'でも、「無性に食べたい！めっちゃ食べたい！」という気持ちを表すとき、'},
        {at: 11.3, text: 'ネイティブはこう言います。'},
      ]} size={38} width={1700} />
      <NarrationSubs top={1010} start={n4} end={c2} chunks={[{at: 0, text: 'そして、「決められない・迷っちゃう」は、こうです。'}]} size={38} />
      <BlockWipe mode="in" from={D - 12} />
    </AbsoluteFill>
  );
};

// ---------- 5b. Transfer 1: something sweet ----------
const Sweet: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const c3 = rel('C03', W_SWEET);
  const n6 = rel('N06', W_SWEET);
  const MF = 820;
  const donutK = spring({frame: f - c3 + 4, fps, config: {damping: 9, stiffness: 180}});
  const glow = interpolate(f, [c3, c3 + 18], [0, 300], {easing: Easing.out(Easing.cubic), ...clamp});
  const LOVE = c3 + sec(0.75);
  const heroExpr: Expression = f < c3 ? 'calm' : f < LOVE ? 'look' : 'happy';
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={1260} cy={430} r={glow} fill="#FFE1EE" />
        <Host x={230} floorY={MF} enter={6} offset={W_SWEET.from} look={{x: 1, y: -0.3}} />
        <Floor y={MF} />
        <Hero x={720} y={MF - 140} w={300} h={280} expression={heroExpr} look={{x: 1, y: -0.6}} blink={blinkAt(f, 80, 10)}
          squash={breathe(f, fps) * pulse(f, fps, LOVE, 0.12)} talk={f >= c3 && f < c3 + durOf('C03') ? 0.35 + 0.3 * Math.abs(Math.sin(f * 0.5)) : 0} />
        {f >= c3 - 4 && <Donut x={1260} y={430 + 12 * Math.sin(f / 12)} size={300} scale={donutK} rotate={6 * Math.sin(f / 16)} />}
        <Hearts x={720} y={MF - 300} at={LOVE} spread={180} />
      </svg>
      <NarrationSubs top={MF + 70} start={0} end={c3} chunks={[{at: 0, text: '日常のいろいろな場面で、こんなふうに使えます。'}]} size={40} />
      <Captions top={MF + 60} start={c3} en="I'm craving something sweet right now." ja="今、無性に甘いものが食べたい。" jaDelay={n6 - c3 > 0 ? 6 : 4}
        highlight={['craving']} spokenFrames={sec(2.8)} enSize={52} jaSize={36} width={1700} />
      <BlockWipe mode="out" from={0} />
      <BlockWipe mode="in" from={D - 12} color={C.pink} />
    </AbsoluteFill>
  );
};

// ---------- 5c. Transfer 2: too many flavors ----------
const FLAVORS = [[C.pink], [C.yellow], [C.lightBlue], [C.green], [FOOD.choco], [C.purple]];

const Flavors: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const MF = 820;
  const MIND = sec(2.05);
  const stuck = f >= MIND;
  const eyes = darting(f, fps, [{x: -1, y: -1}, {x: 0, y: -1}, {x: 1, y: -1}, {x: 0.3, y: -1}], stuck ? 8 : 14);
  return (
    <AbsoluteFill style={{backgroundColor: '#FFF4F8'}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {FLAVORS.map((sc, i) => {
          const k = spring({frame: f - 4 - i * 4, fps, config: {damping: 9, stiffness: 200}});
          const x = 260 + i * 280;
          return <IceCream key={i} x={x} y={290 + 8 * Math.sin(f / 10 + i)} size={170} scoops={sc} scale={k} rotate={(stuck ? 7 : 3) * Math.sin(f / (stuck ? 4 : 11) + i * 1.3)} />;
        })}
        <Floor y={MF} top={C.pinkShade} bottom={C.pink} />
        <Hero x={960} y={MF - 130} w={300} h={260} expression={stuck ? 'strained' : 'look'} look={eyes} rotate={stuck ? 5 * Math.sin(f / 3) : 0}
          squash={breathe(f, fps) * pulse(f, fps, MIND, 0.12)} blink={blinkAt(f, 90, 20)} />
        <Qmarks x={960} y={MF - 280} at={MIND + 4} />
      </svg>
      <Captions top={MF + 60} start={0} en="There are too many flavors. I can't make up my mind." ja="味が多すぎて、決められない。"
        highlight={["can't make up my mind"]} spokenFrames={sec(3.9)} enSize={48} jaSize={36} width={1700} />
      <BlockWipe mode="out" from={0} color={C.pink} />
      <BlockWipe mode="in" from={D - 12} color={C.purple} />
    </AbsoluteFill>
  );
};

// ---------- 6. Repeat after me ----------
const L1 = "I'm really craving ramen tonight.";
const L2 = "I can't make up my mind.";
const L3 = "Actually, I'm really craving ramen tonight.";

const Practice: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const r = (id: string) => rel(id, W_PRAC);
  const PF = 900;
  const land = landing(f, fps, 4, 18, -300, PF - 135);
  const gaps = [
    {from: r('P01') + durOf('P01'), to: r('P02')},
    {from: r('P02') + durOf('P02'), to: r('N09')},
    {from: r('P03') + durOf('P03'), to: D},
  ];
  const gap = gaps.find((g) => f >= g.from && f < g.to);
  const p = gap ? (f - gap.from) / (gap.to - gap.from) : 0;
  const speaking = gap && p < 0.92;
  const heroTalk = speaking ? 0.35 + 0.35 * Math.abs(Math.sin(f * 0.55)) : 0;
  const playing = ['P01', 'P02', 'P03'].some((id) => f >= r(id) && f < r(id) + durOf(id));

  let en: string[] = [];
  let ja = '';
  let key = 'title';
  if (f < r('P01')) { en = ['Repeat after me!']; ja = '声に出して言ってみよう'; key = 'title'; }
  else if (f < r('P02')) { en = [L1]; ja = '今夜は無性にラーメンが食べたい。'; key = 'p1'; }
  else if (f < r('N09')) { en = [L2]; ja = '決められない。'; key = 'p2'; }
  else if (f < r('P03')) { en = ['Now say both lines!']; ja = '2文をつなげて言ってみよう'; key = 'both'; }
  else { en = [L2, L3]; ja = ''; key = 'p3'; }
  const keyStart = {title: 0, p1: r('P01'), p2: r('P02'), both: r('N09'), p3: r('P03')}[key]!;
  const txt = spring({frame: f - keyStart, fps, config: {damping: 13, stiffness: 190}});
  const turn = gap ? spring({frame: f - gap.from, fps, config: {damping: 9, stiffness: 200}}) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={PF - 135} r={interpolate(f, [10, 30], [0, 260], clamp)} fill="#FFF1A8" />
        <Host x={300} floorY={PF} enter={8} offset={W_PRAC.from} look={{x: 1, y: 0}} />
        <RamenBowl x={1600} y={PF - 200 * 0.46} size={200} face={speaking ? 'happy' : 'calm'} blink={blinkAt(f, 76, 40)} steam={1} t={f / fps} squash={breathe(f, fps, 2, 2)} />
        <Floor y={PF} />
        <Hero x={W / 2} y={land.y} w={300} h={270} expression={speaking ? 'happy' : playing ? 'look' : 'calm'} talk={heroTalk}
          look={playing ? {x: -0.8, y: -0.2} : {x: 0, y: 0}} squash={f < 34 ? land.squash : breathe(f, fps) * (1 + heroTalk * 0.04)} blink={blinkAt(f, 90, 25)} />
        {gap && (
          <g opacity={Math.min(1, turn * 1.5)}>
            <Mic x={560} y={470} size={70} color={C.blue} />
            <ProgressBar x={W / 2 + 40} y={470} w={760} h={26} p={p} />
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', top: en.length > 1 ? 110 : 150, width: W, textAlign: 'center', transform: `scale(${0.9 + 0.1 * txt})`, opacity: Math.min(1, txt * 1.5)}}>
        {en.map((l, i) => (
          <div key={i} style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 72, lineHeight: 1.25, color: key === 'title' || key === 'both' ? C.blue : C.ink}}>{l}</div>
        ))}
        {ja && <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 40, color: C.ink, opacity: 0.7, marginTop: 12}}>{ja}</div>}
      </div>
      {gap && (
        <div style={{position: 'absolute', left: W / 2 - 120, top: 515, width: 240, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 40, color: '#FFFFFF', background: C.blue, borderRadius: 30, padding: '8px 0', transform: `scale(${turn})`}}>
          Your turn!
        </div>
      )}
      <NarrationSubs top={PF + 60} start={0} end={r('P01')} chunks={[
        {at: 0, text: 'それでは、声に出して練習してみましょう。'},
        {at: 3.2, text: 'ポーズのあとに、続けて言ってみてください。'},
      ]} size={40} />
      <NarrationSubs top={PF + 60} start={r('N09')} end={r('P03')} chunks={[{at: 0, text: '次は、2文をつなげて言ってみましょう。'}]} size={40} />
      <BlockWipe mode="out" from={0} color={C.purple} />
      <BlockWipe mode="in" from={D - 12} color={C.green} />
    </AbsoluteFill>
  );
};

// ---------- 7. Viewer prompt + Owl Listen outro ----------
const BLANK_FOODS: FoodKind[] = ['ramen', 'sushi', 'chocolate', 'donut', 'burger', 'icecream'];

const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const e1 = rel('E01', W_END);
  const n11 = rel('N11', W_END);
  const CF = 760;
  const card = spring({frame: f - 8, fps, config: {damping: 11, stiffness: 170}});
  const ask = spring({frame: f - sec(3.2), fps, config: {damping: 10, stiffness: 190}});
  const blankPulse = 0.55 + 0.45 * Math.abs(Math.sin(f / 9));
  // food cycling in the blank from N11 on: ramen, sushi, chocolate (as narrated), then the rest
  const cycleAt = [0, sec(1.05), sec(2.1), sec(3.6), sec(4.6), sec(5.6)];
  const fi = f < n11 ? -1 : cycleAt.filter((c) => f - n11 >= c).length - 1;
  const swap = fi >= 0 ? spring({frame: f - n11 - cycleAt[fi], fps, config: {damping: 9, stiffness: 240}}) : 0;
  const OWL = 250;
  const owlY = CF - OWL * 0.54;
  const owlLand = landing(f, fps, e1 - 10, e1 + 6, -300, owlY);
  const wave = f > e1 + 10 && f < e1 + 60 ? 25 * Math.sin((f - e1 - 10) / 3) : 0;
  const arc = interpolate(f, [D - sec(3), D - sec(2.5)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Host x={300} floorY={CF + 40} enter={6} offset={W_END.from} look={{x: 1, y: -0.5}} />
        <Hero x={960} y={CF - 130} w={300} h={260} expression={f < e1 ? 'calm' : 'happy'} look={{x: 0, y: -0.4}}
          squash={breathe(f, fps) * pulse(f, fps, n11, 0.08)} blink={blinkAt(f, 80, 5)} />
        {f >= e1 - 10 && <Owl x={1350} y={owlLand.y} size={OWL} squash={f < e1 + 30 ? owlLand.squash : breathe(f, fps, 2, 1)} blink={blinkAt(f, 70, 33)} wing={wave} look={{x: -0.8, y: -0.3}} happy={f > n11} />}
        <rect x={-20} y={CF} width={W + 40} height={36} rx={10} fill={C.lightGray} />
        <rect x={-20} y={CF + 36} width={W + 40} height={H} fill={C.charcoal} />
      </svg>
      <div style={{position: 'absolute', left: 260, top: 60, width: 1400, padding: '34px 40px', borderRadius: 44, background: '#FFFFFF', boxShadow: `12px 12px 0 ${C.lightGray}`, textAlign: 'center',
        transform: `scale(${card})`, opacity: Math.min(1, card * 1.5)}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, fontFamily: FONT_EN, fontWeight: 900, fontSize: 70, color: C.ink, whiteSpace: 'nowrap'}}>
          <span>Right now, I'm <span style={{padding: '0 10px', borderRadius: 16, background: f >= e1 ? C.blue : 'transparent', color: f >= e1 ? '#FFFFFF' : C.ink}}>craving</span></span>
          <span style={{position: 'relative', display: 'inline-block', width: 220, height: 130}}>
            <span style={{position: 'absolute', left: 0, right: 0, bottom: 6, height: 10, borderRadius: 5, background: C.blue, opacity: fi >= 0 ? 1 : blankPulse}} />
            {fi >= 0 && (
              <svg width={220} height={130} viewBox="-110 -65 220 130" style={{position: 'absolute', left: 0, top: -8}}>
                <g transform={`scale(${swap})`}><FoodIcon kind={BLANK_FOODS[fi]} x={0} y={BLANK_FOODS[fi] === 'ramen' ? -10 : 8} size={120} /></g>
              </svg>
            )}
          </span>
          <span>!</span>
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, marginTop: 18, fontFamily: FONT_JA, fontWeight: 900, fontSize: 42, color: C.blue, transform: `scale(${ask})`, opacity: Math.min(1, ask * 1.5)}}>
          <svg width={70} height={70} viewBox="-35 -35 70 70"><CommentBubble x={0} y={0} size={64} /></svg>
          今食べたいものを、英語でコメント欄に書いてみてね！
        </div>
      </div>
      <NarrationSubs top={CF + 120} start={0} end={e1} color="#FFFFFF" chunks={[
        {at: 0.1, text: '最後に、あなたが今「無性に食べたいもの」を、英語でコメント欄に書いてみてください！'},
      ]} size={40} width={1700} />
      <NarrationSubs top={CF + 120} start={n11} end={n11 + sec(4.6)} color="#FFFFFF" chunks={[{at: 0, text: 'ラーメン、お寿司、チョコレート……何でもOKです！'}]} size={42} />
      {arc > 0 && (
        <div style={{position: 'absolute', left: 1350 - 220, top: CF + 60, width: 440, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 56, letterSpacing: 2, color: C.owlTan,
          opacity: arc, transform: `translateY(${(1 - arc) * 20}px)`}}>Owl Listen</div>
      )}
      <BlockWipe mode="out" from={0} color={C.green} />
    </AbsoluteFill>
  );
};

export const Ep05WhatShouldIEatYT: React.FC = () => {
  const block = (w: {from: number; durationInFrames: number}[]) => ({from: w[0].from, durationInFrames: w[w.length - 1].from + w[w.length - 1].durationInFrames - w[0].from});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <Sequence {...W_OPEN}><Opening /></Sequence>
      <Sequence {...block(W_A)}><StoryBlock wins={W_A} captions={false} label="Listen" listen /></Sequence>
      <Sequence {...W_ANS}><Answer /></Sequence>
      <Sequence {...block(W_B)}><StoryBlock wins={W_B} captions label="English + 日本語" fillOut wipeOut /></Sequence>
      <Sequence {...W_KEY}><KeyExpressions /></Sequence>
      <Sequence {...W_SWEET}><Sweet /></Sequence>
      <Sequence {...W_FLAV}><Flavors /></Sequence>
      <Sequence {...W_PRAC}><Practice /></Sequence>
      <Sequence {...W_END}><Closing /></Sequence>
      <VoiceTrack tl={tl} fps={FPS} />
    </AbsoluteFill>
  );
};
