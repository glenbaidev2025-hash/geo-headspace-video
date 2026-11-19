import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {C, FONT_EN, FONT_JA} from '../theme';
import {lineStart, sceneWindow, talkLevel, timelineFrames, VoiceEnvelope, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {ArcText} from '../lib/ArcText';
import {Captions, NarrationSubs} from '../lib/Captions';
import {blinkAt, breathe, darting, landing, lerp, pulse} from '../lib/motion';
import {ClipCard, ClockFace, ClockScreen, Phone, VideoBubble, VideoScreen} from '../props/Phone';
import {CommentBubble, Headphones, Mic, ProgressBar} from '../props/Icons';
import {BasketBack, BasketFront, Grocery, GroceryKind, MilkCarton, PriceTag} from '../props/Shop';
import timeline from '../../public/audio/ep02-check-the-time-yt/timeline.json';
import envelope from '../../public/audio/ep02-check-the-time-yt/envelope.json';

// Episode 2 · "I Only Meant to Check the Time" — YouTube 16:9, ~2:30.
// Voices: Sarah (EN story & model lines), Jessica (JA host narration).
const tl = timeline as VoiceTimeline;
const env = envelope as VoiceEnvelope;
const FPS = 30;
const W = 1920;
const H = 1080;
export const EP02YT_FRAMES = timelineFrames(tl, FPS);

const win = (ids: string[]) => sceneWindow(tl, FPS, ids);
const sec = (s: number) => Math.round(s * FPS);
const durOf = (id: string) => sec(tl.segments.find((s) => s.id === id)!.duration_s);

const W_OPEN = win(['N01']);
const W_A = ['A01', 'A02', 'A03', 'A04'].map((id) => win([id]));
const W_ANS = win(['N02']);
const W_B = ['B01', 'B02', 'B03', 'B04'].map((id) => win([id]));
const W_KEY = win(['N03', 'N04']);
const W_SHOP = win(['C03', 'N05']);
const W_PRAC = win(['N06', 'P03']);
const W_END = win(['N08', 'E01']);

/** Frame of a line relative to a scene window. */
const rel = (id: string, w: {from: number}) => lineStart(tl, FPS, id) - w.from;
const HOST_IDS = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08'];
const hostTalk = (globalFrame: number) => talkLevel(tl, env, FPS, globalFrame, HOST_IDS);

// ---------- layout ----------
const DESK_Y = 800;
const HERO = {x: 760, w: 360, h: 320};
const HERO_Y = DESK_Y - HERO.h / 2;
type PhonePos = {x: number; y: number; rotate: number; scale: number};
const PHONE_REST: PhonePos = {x: 1090, y: DESK_Y - 72, rotate: 90, scale: 0.9};
const PHONE_HELD: PhonePos = {x: 1050, y: 470, rotate: -8, scale: 1.05};
const PHONE_BIG: PhonePos = {x: 1230, y: 430, rotate: 0, scale: 1.45};
const CAP_TOP = 845;
const HOST = {w: 250, h: 330};

// ---------- shared pieces ----------
const Desk: React.FC<{y?: number}> = ({y = DESK_Y}) => (
  <g>
    <rect x={-20} y={y} width={W + 40} height={50} fill={C.lightGray} />
    <rect x={-20} y={y + 50} width={W + 40} height={H - y} fill={C.grayShade} />
  </g>
);

const Hero: React.FC<{x?: number; y?: number; w?: number; h?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; talk?: number}> = ({
  x = HERO.x, y = HERO_Y, w = HERO.w, h = HERO.h, ...p
}) => <Character shape="roundRect" w={w} h={h} color={C.yellow} shade={C.yellowShade} x={x} y={y} faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />;

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

const phoneBetween = (k: number, from: PhonePos, to: PhonePos, arc = 140): PhonePos => ({
  x: lerp(from.x, to.x, k),
  y: lerp(from.y, to.y, k) - arc * Math.sin(Math.min(1, Math.max(0, k)) * Math.PI),
  rotate: lerp(from.rotate, to.rotate, k),
  scale: lerp(from.scale, to.scale, k),
});

/** Color block that pushes up from the bottom (mode "in", covers) or leaves through the top (mode "out", reveals). */
const BlockWipe: React.FC<{mode: 'in' | 'out'; from: number; dur?: number; color?: string}> = ({mode, from, dur = 12, color = C.lightBlue}) => {
  const f = useCurrentFrame();
  const k = interpolate(f, [from, from + dur], [0, 1], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const y = mode === 'in' ? H * (1 - k) : -H * k;
  if ((mode === 'in' && k <= 0) || (mode === 'out' && k >= 1)) return null;
  return <AbsoluteFill style={{transform: `translateY(${y}px)`, backgroundColor: color}} />;
};

const Badge: React.FC<{label: string; icon?: 'listen'}> = ({label, icon}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f - 2, fps, config: {damping: 13, stiffness: 180}});
  return (
    <div style={{position: 'absolute', left: 60, top: 50, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 30px 14px 22px', borderRadius: 40, background: '#FFFFFF',
      boxShadow: `6px 6px 0 ${C.lightGray}`, transform: `scale(${k})`, transformOrigin: 'left center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 36, color: C.ink}}>
      {icon === 'listen' && (
        <svg width={44} height={44} viewBox="-22 -22 44 44"><Headphones x={0} y={-6} size={40} /></svg>
      )}
      {label}
    </div>
  );
};

// ---------- floating clips (story beat 2) ----------
const SHADE: Record<string, string> = {pink: C.pinkShade, lightBlue: C.lightBlueShade, green: C.greenShade, purple: C.purpleShade, orange: C.orangeShade, blue: C.blueShade};
const CARDS: {x: number; y: number; w: number; h: number; c: string; r: number; e?: Expression; t: number}[] = [
  {x: 540, y: 300, w: 220, h: 180, c: 'pink', r: -8, e: 'happy', t: 76},
  {x: 1400, y: 330, w: 220, h: 180, c: 'lightBlue', r: 9, e: 'happy', t: 112},
  {x: 290, y: 170, w: 240, h: 200, c: 'green', r: 14, e: 'look', t: 119},
  {x: 800, y: 150, w: 210, h: 180, c: 'purple', r: -6, e: 'happy', t: 125},
  {x: 1640, y: 170, w: 230, h: 200, c: 'orange', r: 12, e: 'happy', t: 131},
  {x: 110, y: 540, w: 220, h: 280, c: 'blue', r: -18, e: 'look', t: 137},
  {x: 1820, y: 540, w: 230, h: 260, c: 'pink', r: 16, e: 'happy', t: 143},
  {x: 1150, y: 40, w: 260, h: 200, c: 'lightBlue', r: 5, t: 148},
  {x: 520, y: 20, w: 230, h: 190, c: 'green', r: -10, t: 153},
  {x: 1470, y: 610, w: 190, h: 160, c: 'orange', r: 20, e: 'happy', t: 158},
  {x: 340, y: 600, w: 180, h: 150, c: 'purple', r: -14, e: 'look', t: 163},
];

const Clips: React.FC<{f: number; exit?: number}> = ({f, exit = 0}) => {
  const {fps} = useVideoConfig();
  const crowd = interpolate(f, [110, 178], [1, 1.07], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g transform={`translate(${W / 2} 380) scale(${crowd}) translate(${-W / 2} -380)`}>
      {CARDS.map((c, i) => {
        const s = spring({frame: f - c.t, fps, config: {damping: 10, stiffness: 200}}) * (1 - exit);
        if (s <= 0.001) return null;
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${s}) translate(${-c.x} ${-c.y})`}>
            <ClipCard x={c.x} y={c.y} w={c.w} h={c.h} color={(C as Record<string, string>)[c.c]} shade={SHADE[c.c]} rotate={c.r + 4 * Math.sin(f / 9 + i)}
              expression={c.e} noFace={!c.e} blink={blinkAt(f, 64, i * 11)} look={{x: Math.sin(f / 20 + i), y: 0.3}} squash={breathe(f, fps, 2.4, i)} />
          </g>
        );
      })}
    </g>
  );
};

// ---------- story beats (used for the first listen and the bilingual replay) ----------
type StoryProps = {captions: boolean};

const Story1: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = spring({frame: f - 8, fps, config: {damping: 13, stiffness: 120}});
  const ph = phoneBetween(k, PHONE_REST, PHONE_HELD);
  const clockPop = spring({frame: f - 30, fps, config: {damping: 9, stiffness: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Desk />
        <Hero expression="look" squash={breathe(f, fps)} look={k < 0.5 ? {x: 1, y: 0.7} : {x: 1, y: -0.3}} blink={blinkAt(f, 80, 50)} />
        <Phone {...ph} glow={interpolate(f, [22, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
          screen={(sw, sh) => <ClockScreen sw={sw} sh={sh} time="10:32" pop={clockPop} />} />
      </svg>
      {captions && <Captions top={CAP_TOP} start={0} en="I picked up my phone to check the time." ja="時間を見るためにスマホを手に取った。" enSize={46} jaSize={34} width={1600} />}
    </AbsoluteFill>
  );
};

const Story2: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const TAP = sec(2.2);
  const SWIPE = sec(3.65);
  const bubble = spring({frame: f - 4, fps, config: {damping: 10, stiffness: 200}}) * (1 - spring({frame: f - TAP, fps, config: {damping: 14, stiffness: 240}}));
  const swipeK = spring({frame: f - SWIPE, fps, config: {damping: 16, stiffness: 220}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Desk />
        <Hero expression={f < TAP ? 'look' : 'happy'} squash={breathe(f, fps) * pulse(f, fps, SWIPE, 0.08)}
          look={f < TAP ? {x: 0.9, y: -0.8} : darting(f, fps, [{x: 1, y: -0.3}, {x: 0, y: -1}, {x: -0.8, y: -0.8}, {x: 1, y: -0.6}], 22)} blink={blinkAt(f, 70, 20)} />
        <Phone {...PHONE_HELD} y={PHONE_HELD.y + 8 * Math.sin(f / 12)} screen={(sw, sh) =>
          f < TAP ? <ClockScreen sw={sw} sh={sh} time="10:32" /> : (
            <g>
              <g transform={`translate(0 ${-swipeK * sh})`}><VideoScreen sw={sw} sh={sh} t={f / fps} color={C.pink} shade={C.pinkShade} accent={C.yellow} /></g>
              {f >= SWIPE && <g transform={`translate(0 ${(1 - swipeK) * sh})`}><VideoScreen sw={sw} sh={sh} t={f / fps + 1} color={C.lightBlue} shade={C.lightBlueShade} accent={C.green} /></g>}
              {f >= TAP && f < TAP + 12 && <circle cx={0} cy={sh * 0.1} r={(f - TAP) * 6} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={1 - (f - TAP) / 12} />}
            </g>
          )} />
        <VideoBubble x={1030} y={210} scale={bubble} />
        <Clips f={f} />
      </svg>
      {captions && (
        <>
          <Captions top={CAP_TOP} start={0} end={sec(2.2)} en="Then a friend sent me a video." ja="すると友達から動画が届いた。" enSize={46} jaSize={34} width={1600} />
          <Captions top={CAP_TOP} start={sec(2.2)} en="I watched it… and then another one." ja="それを見て……またもう1本。" enSize={46} jaSize={34} width={1600} />
        </>
      )}
    </AbsoluteFill>
  );
};

const Story3: React.FC<StoryProps & {prevLen: number}> = ({captions, prevLen}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nightIn = interpolate(f, [0, 16], [0, 1], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateRight: 'clamp'});
  const nightOut = interpolate(f, [54, 68], [0, 1], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const clockS = spring({frame: f - 6, fps, config: {damping: 10, stiffness: 180}}) * (1 - nightOut);
  const spin = interpolate(f, [8, 50], [0, 1], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const DOWN = 42;
  const k = 1 - spring({frame: f - DOWN, fps, config: {damping: 14, stiffness: 140}});
  const ph = phoneBetween(k, PHONE_REST, PHONE_HELD, 60);
  const slump = f >= 62 ? 1 + 0.1 * spring({frame: f - 62, fps, config: {damping: 9, stiffness: 160}}) : breathe(f, fps, 1.4);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={PHONE_HELD.x} cy={PHONE_HELD.y} r={2600 * nightIn * (1 - nightOut)} fill={C.night} />
        {f < 20 && <Clips f={prevLen + f} exit={interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'})} />}
        <Desk />
        <Hero expression="sleepy" squash={slump} />
        <Phone {...ph} glow={interpolate(f, [DOWN, DOWN + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
          screen={(sw, sh) => <VideoScreen sw={sw} sh={sh} t={f / fps + 2} color={C.orange} shade={C.orangeShade} accent={C.lightBlue} />} />
        <g opacity={1 - nightOut}>
          <ClockFace x={420} y={330} size={260} progress={spin} turns={3} scale={clockS} />
          <ArcText text="10 MINUTES LATER" cx={420} cy={330} r={200} start={10} fontSize={46} spacingDeg={8.8} color="#FFFFFF" fontFamily={FONT_EN} stagger={1} />
        </g>
      </svg>
      {captions && <Captions top={CAP_TOP} start={0} en="Ten minutes later, I put my phone down." ja="10分後、スマホを机に置いた。" enSize={46} jaSize={34} width={1600} />}
    </AbsoluteFill>
  );
};

const Story4: React.FC<StoryProps & {fillOut?: boolean}> = ({captions, fillOut}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const Q = sec(1.95);
  const jolt = f < 14 ? 1 - 0.12 * Math.sin(spring({frame: f, fps, config: {damping: 8, stiffness: 260}}) * Math.PI) : 1;
  const expr: Expression = f < 3 ? 'sleepy' : f < Q + 10 ? 'look' : 'strained';
  const wake = spring({frame: f - (Q - 10), fps, config: {damping: 12, stiffness: 150}});
  const ph = phoneBetween(wake, PHONE_REST, PHONE_BIG, 120);
  const digits = spring({frame: f - Q, fps, config: {damping: 6, stiffness: 220}});
  const fill = fillOut ? interpolate(f, [D - 14, D], [1, 14], {easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;
  const shake = expr === 'strained' ? 4 * Math.sin(f * 1.6) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Desk />
        <Hero expression={expr} squash={jolt} rotate={shake} blink={f >= 3 && f < 10 ? 1 - Math.abs(f - 6.5) / 3.5 : blinkAt(f, 90, 30)}
          look={wake < 0.3 ? {x: 1, y: 0.8} : {x: 1, y: -0.7}} />
        <Phone {...ph} scale={ph.scale * fill} glow={interpolate(f, [Q - 6, Q], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
          screen={(sw, sh) => <ClockScreen sw={sw} sh={sh} time="10:42" pop={digits * 1.05} color={C.yellow} />} />
      </svg>
      {captions && fill < 1.5 && (
        <>
          <Captions top={CAP_TOP} start={0} end={Q - 3} en="Wait." ja="あれ？" jaDelay={12} enSize={60} jaSize={44} />
          <Captions top={CAP_TOP} start={Q} en="What time is it?" ja="今、何時？" jaDelay={14} enSize={60} jaSize={44} />
        </>
      )}
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
      <Sequence {...at(2)}><Story3 captions={captions} prevLen={wins[1].durationInFrames} /></Sequence>
      <Sequence {...at(3)}><Story4 captions={captions} fillOut={fillOut} /></Sequence>
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
  const q = spring({frame: f - sec(4.0), fps, config: {damping: 8, stiffness: 180}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Host x={300} floorY={DESK_Y} enter={12} offset={W_OPEN.from} exit={W_OPEN.durationInFrames - 16} />
        <Desk />
        <Hero y={land.y} squash={f < 34 ? land.squash : breathe(f, fps)} expression={f < 18 ? 'look' : 'calm'} look={{x: -0.6, y: 0}} blink={blinkAt(f, 80, 40)} />
        <Phone {...PHONE_REST} glow={0} />
        <g transform={`translate(${HERO.x + 120} ${HERO_Y - 300}) scale(${q}) rotate(${6 * Math.sin(f / 10)})`}>
          <Character shape="circle" w={170} h={170} color={C.blue} shade={C.blueShade} x={0} y={0} noFace />
          <text x={-6} y={6} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={120} fill="#FFFFFF">?</text>
        </g>
      </svg>
      <div style={{position: 'absolute', left: 60, top: 50, fontFamily: FONT_EN, fontWeight: 900, fontSize: 36, color: C.ink, padding: '14px 30px', borderRadius: 40, background: '#FFFFFF', boxShadow: `6px 6px 0 ${C.lightGray}`}}>
        Listening Quiz
      </div>
      <NarrationSubs top={CAP_TOP + 20} start={0} end={W_OPEN.durationInFrames} chunks={[
        {at: 0.2, text: 'これから短い英語のストーリーが流れます。'},
        {at: 4.0, text: '話し手は、何をするのを忘れてしまったでしょうか？'},
        {at: 7.8, text: '聞き取ってみましょう。'},
      ]} />
    </AbsoluteFill>
  );
};

// ---------- 3. Answer reveal ----------
const Answer: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const card = spring({frame: f - sec(2.85), fps, config: {damping: 10, stiffness: 170}});
  const ring = (i: number) => ((f + i * 20) % 60) / 60;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={PHONE_BIG.x} cy={PHONE_BIG.y} r={180 + ring(i) * 260} fill="none" stroke={C.yellow} strokeWidth={18 * (1 - ring(i))} opacity={1 - ring(i)} />
        ))}
        <Host x={260} floorY={DESK_Y} enter={4} offset={W_ANS.from} look={{x: 1, y: -0.3}} />
        <Desk />
        <Hero expression={f < sec(5.4) ? 'strained' : f < sec(11.5) ? 'sad' : 'calm'} squash={breathe(f, fps)} look={{x: 1, y: -0.6}} rotate={f < sec(5.4) ? 3 * Math.sin(f * 1.4) : 0} />
        <Phone {...PHONE_BIG} squash={1 + 0.03 * Math.sin(f / 6)} screen={(sw, sh) => <ClockScreen sw={sw} sh={sh} time="10:42" color={C.yellow} pop={1.05} />} />
      </svg>
      <div style={{position: 'absolute', left: 140, top: 70, width: 760, padding: '26px 40px', borderRadius: 36, background: '#FFFFFF', boxShadow: `10px 10px 0 ${C.lightGray}`,
        transform: `scale(${card}) rotate(${-2 + 2 * (1 - card)}deg)`, opacity: Math.min(1, card * 1.5), textAlign: 'center'}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 58, color: C.ink}}>答え：時間を見ること</div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 44, color: C.blue, marginTop: 6}}>check the time</div>
      </div>
      <NarrationSubs top={CAP_TOP + 20} start={0} end={D} chunks={[
        {at: 0, text: '聞き取れましたか？'},
        {at: 1.9, text: '答えは、「時間を見ること」でした。'},
        {at: 5.4, text: 'スマホを手に取ったのに、動画を次々と見てしまい、肝心の時間を見忘れてしまったのです。'},
        {at: 12.1, text: 'では、英語と日本語の字幕付きで、もう一度聞いてみましょう。'},
      ]} size={40} width={1700} />
      <BlockWipe mode="in" from={D - 12} />
    </AbsoluteFill>
  );
};

// ---------- 5a. Key expressions ----------
const PatternCard: React.FC<{cx: number; cy: number; show: number; active: boolean; sentence: string; hl: string; hlAt: number; ja: string; pattern: string; patternAt: number; meaning: string; meaningAt: number}> = (p) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - p.show, fps, config: {damping: 11, stiffness: 170}});
  const act = spring({frame: p.active ? f : 0, fps, config: {damping: 20, stiffness: 200}});
  const pat = spring({frame: f - p.patternAt, fps, config: {damping: 10, stiffness: 200}});
  const mean = spring({frame: f - p.meaningAt, fps, config: {damping: 12, stiffness: 200}});
  const hlOn = f >= p.hlAt;
  const [pre, post] = p.sentence.split(p.hl);
  const cw = 800;
  const ch = 540;
  if (s < 0.001) return null;
  return (
    <div style={{position: 'absolute', left: p.cx - cw / 2, top: p.cy - ch / 2, width: cw, height: ch, transform: `scale(${s * (p.active ? 1.03 : 0.97)})`, opacity: p.active ? 1 : 0.75 + 0.25 * (1 - act)}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: C.lightGray, transform: 'translate(14px, 14px)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: '#FFFFFF', padding: '44px 50px', textAlign: 'center'}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 44, lineHeight: 1.3, color: C.ink}}>
          {pre}
          <span style={{padding: '0 12px', borderRadius: 16, background: hlOn ? C.blue : 'transparent', color: hlOn ? '#FFFFFF' : C.ink}}>{p.hl}</span>
          {post}
        </div>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 30, color: C.ink, opacity: 0.7, marginTop: 10}}>{p.ja}</div>
        <div style={{height: 6, borderRadius: 3, background: C.lightGray, margin: '34px 60px 30px'}} />
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 70, color: C.blue, transform: `scale(${pat})`, opacity: Math.min(1, pat * 1.5)}}>{p.pattern}</div>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 46, color: C.ink, marginTop: 14, transform: `translateY(${(1 - mean) * 16}px)`, opacity: Math.min(1, mean * 1.5)}}>{p.meaning}</div>
      </div>
    </div>
  );
};

const KeyExpressions: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const open = interpolate(f, [0, 16], [0, 2300], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const c1 = rel('C01', W_KEY);
  const c2 = rel('C02', W_KEY);
  const n4 = rel('N04', W_KEY);
  const aActive = f < c2 || (f >= n4 && f < n4 + sec(5.4));
  const bActive = (f >= c2 && f < n4) || (f >= n4 + sec(5.4) && f < n4 + sec(10.4));
  return (
    <AbsoluteFill style={{backgroundColor: C.charcoal}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={H / 2} r={open} fill={C.yellow} />
        <Host x={170} floorY={1000} enter={10} offset={W_KEY.from} w={200} h={270} look={{x: 0.8, y: -0.6}} />
        <rect x={-20} y={1000} width={W + 40} height={100} fill={C.yellowShade} />
      </svg>
      <PatternCard cx={520} cy={450} show={c1 - 4} active={aActive} sentence="I only meant to check the time." hl="only meant to" hlAt={c1 + sec(0.3)} ja="時間を見るだけのつもりだった。"
        pattern="I only meant to …" patternAt={n4 + 2} meaning="〜するだけのつもりだった" meaningAt={n4 + sec(2.4)} />
      <PatternCard cx={1400} cy={450} show={c2 - 4} active={bActive} sentence="I ended up scrolling for ten minutes." hl="ended up scrolling" hlAt={c2 + sec(0.3)} ja="結局10分もスクロールしてしまった。"
        pattern="I ended up …-ing" patternAt={n4 + sec(5.4)} meaning="結局〜してしまった" meaningAt={n4 + sec(8.2)} />
      <NarrationSubs top={1010} start={0} end={c1} chunks={[{at: 0.5, text: 'この場面を英語で振り返ると、こう言えます。'}]} size={40} />
      <NarrationSubs top={1010} start={n4} end={D} chunks={[
        {at: 0, text: '「I only meant to」は、「〜するだけのつもりだった」。'},
        {at: 5.4, text: '「I ended up …ing」は、「結局〜してしまった」という意味です。'},
        {at: 10.4, text: '日常の買い物でもよく使えます。'},
        {at: 14.2, text: 'たとえば、こうです。'},
      ]} size={40} />
      <BlockWipe mode="in" from={D - 12} />
    </AbsoluteFill>
  );
};

// ---------- 5b. Transfer: shopping ----------
const ITEMS: {kind: GroceryKind; dx: number; y: number; r: number}[] = [
  {kind: 'orange', dx: -80, y: 700, r: 0},
  {kind: 'box', dx: 70, y: 680, r: 10},
  {kind: 'bread', dx: -10, y: 640, r: -8},
  {kind: 'bottle', dx: 110, y: 600, r: 14},
  {kind: 'cheese', dx: -110, y: 610, r: -12},
  {kind: 'can', dx: 30, y: 570, r: 6},
  {kind: 'orange', dx: -60, y: 540, r: 0},
  {kind: 'box', dx: 90, y: 500, r: -10},
  {kind: 'bread', dx: -20, y: 480, r: 12},
  {kind: 'can', dx: -120, y: 470, r: -6},
];
const BASKET = {x: 1160, y: 730, w: 360};

const ShelfBackdrop: React.FC = () => (
  <g opacity={0.9}>
    {[250, 470].map((y, row) => (
      <g key={y}>
        <rect x={-20} y={y} width={W + 40} height={26} rx={13} fill={C.lightGray} />
        {Array.from({length: 11}).map((_, i) => {
          const kinds: GroceryKind[] = ['box', 'can', 'bottle', 'orange', 'cheese', 'bread'];
          const k = kinds[(i + row * 2) % kinds.length];
          return <Grocery key={i} kind={k} x={90 + i * 175} y={y - 46} size={100} />;
        })}
      </g>
    ))}
  </g>
);

const Shop: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const n5 = rel('N05', W_SHOP);
  const MILK = sec(1.1);
  const PILE = sec(2.6);
  const TAG = sec(4.25);
  const FLOOR = 860;
  const heroY = FLOOR - 160;
  const milk = landing(f, fps, MILK, MILK + 12, -200, 690, 0.2);
  const expr: Expression = f < PILE ? 'happy' : f < TAG ? 'look' : f < n5 + sec(1) ? 'strained' : 'sad';
  const tag = spring({frame: f - TAG, fps, config: {damping: 6, stiffness: 200}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <ShelfBackdrop />
        <Host x={260} floorY={FLOOR} enter={n5 - 6} offset={W_SHOP.from} look={{x: 1, y: -0.2}} />
        <rect x={-20} y={FLOOR} width={W + 40} height={40} fill={C.lightGray} />
        <rect x={-20} y={FLOOR + 40} width={W + 40} height={H} fill={C.grayShade} />
        <Hero x={720} y={heroY} expression={expr} squash={breathe(f, fps) * pulse(f, fps, TAG, 0.14)} rotate={expr === 'strained' ? 4 * Math.sin(f * 1.5) : 0}
          look={f < PILE ? {x: 1, y: 0.6} : f < TAG ? darting(f, fps, [{x: 1, y: 0}, {x: 1, y: -0.8}], 10) : {x: 1, y: -1}} blink={blinkAt(f, 80, 10)} />
        <BasketBack x={BASKET.x} y={BASKET.y} w={BASKET.w} />
        {f >= MILK && <MilkCarton x={BASKET.x - 20} y={milk.y} size={170} rotate={-6} squash={milk.squash} />}
        {ITEMS.map((it, i) => {
          const t0 = PILE + i * 4;
          if (f < t0) return null;
          const l = landing(f, fps, t0, t0 + 10, -150, it.y, 0.15);
          return <Grocery key={i} kind={it.kind} x={BASKET.x + it.dx} y={l.y} size={150} rotate={it.r} />;
        })}
        <BasketFront x={BASKET.x} y={BASKET.y} w={BASKET.w} />
        {f >= TAG && <PriceTag x={1560} y={330} text="$30" scale={tag} rotate={8 + 3 * Math.sin(f / 8)} />}
      </svg>
      <Captions top={FLOOR + 50} start={0} end={n5} en="I only meant to buy milk. I ended up spending thirty dollars." ja="牛乳だけ買うつもりだったのに、結局30ドルも使ってしまった。"
        highlight={['only meant to', 'ended up spending']} spokenFrames={sec(5)} enSize={44} jaSize={34} width={1700} />
      <NarrationSubs top={FLOOR + 60} start={n5} end={D} chunks={[{at: 0, text: '牛乳だけ買うつもりだったのに、結局30ドルも使ってしまった、という意味になります。'}]} size={40} width={1700} />
      <BlockWipe mode="out" from={0} />
      <BlockWipe mode="in" from={D - 12} color={C.purple} />
    </AbsoluteFill>
  );
};

// ---------- 6. Repeat after me ----------
const Practice: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const r = (id: string) => rel(id, W_PRAC);
  const FLOOR = 900;
  const land = landing(f, fps, 4, 18, -300, FLOOR - 135);
  // pause windows after each model line
  const gaps = [
    {from: r('P01') + durOf('P01'), to: r('P02')},
    {from: r('P02') + durOf('P02'), to: r('N07')},
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
  else if (f < r('P02')) { en = ['I only meant to check the time.']; ja = '時間を見るだけのつもりだった。'; key = 'p1'; }
  else if (f < r('N07')) { en = ['I ended up scrolling for ten minutes.']; ja = '結局10分もスクロールしてしまった。'; key = 'p2'; }
  else if (f < r('P03')) { en = ['Now say both lines!']; ja = '2文をつなげて言ってみよう'; key = 'both'; }
  else { en = ['I only meant to check the time.', 'I ended up scrolling for ten minutes.']; ja = ''; key = 'p3'; }
  const keyStart = {title: 0, p1: r('P01'), p2: r('P02'), both: r('N07'), p3: r('P03')}[key]!;
  const txt = spring({frame: f - keyStart, fps, config: {damping: 13, stiffness: 190}});
  const turn = gap ? spring({frame: f - gap.from, fps, config: {damping: 9, stiffness: 200}}) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={FLOOR - 135} r={interpolate(f, [10, 30], [0, 260], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} fill="#FFF1A8" />
        <Host x={300} floorY={FLOOR} enter={8} offset={W_PRAC.from} look={{x: 1, y: 0}} />
        <rect x={-20} y={FLOOR} width={W + 40} height={40} fill={C.lightGray} />
        <rect x={-20} y={FLOOR + 40} width={W + 40} height={H} fill={C.grayShade} />
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
      <NarrationSubs top={FLOOR + 60} start={0} end={r('P01')} chunks={[
        {at: 0, text: 'それでは、声に出して練習してみましょう。'},
        {at: 3.2, text: 'ポーズのあとに、続けて言ってみてください。'},
      ]} size={40} />
      <NarrationSubs top={FLOOR + 60} start={r('N07')} end={r('P03')} chunks={[{at: 0, text: '次は、2文をつなげて言ってみましょう。'}]} size={40} />
      <BlockWipe mode="out" from={0} color={C.purple} />
      <BlockWipe mode="in" from={D - 12} color={C.green} />
    </AbsoluteFill>
  );
};

// ---------- 7. Viewer prompt ----------
const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const e1 = rel('E01', W_END);
  const COUNTER = 730;
  const card = spring({frame: f - 8, fps, config: {damping: 11, stiffness: 170}});
  const ask = spring({frame: f - sec(6.4), fps, config: {damping: 10, stiffness: 190}});
  const hl = f >= e1 + sec(1.3);
  const blank = 0.55 + 0.45 * Math.abs(Math.sin(f / 9));
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <ShelfBackdrop />
        <Host x={330} floorY={COUNTER + 40} enter={6} offset={W_END.from} look={{x: 1, y: -0.5}} />
        <Hero x={960} y={COUNTER - 60} w={320} h={290} expression={f < e1 ? 'calm' : 'happy'} look={{x: 0, y: -0.4}} squash={breathe(f, fps) * pulse(f, fps, e1 + sec(1.2), 0.08)} blink={blinkAt(f, 80, 5)} />
        <rect x={-20} y={COUNTER} width={W + 40} height={36} rx={10} fill={C.lightGray} />
        <rect x={-20} y={COUNTER + 36} width={W + 40} height={H} fill={C.charcoal} />
        <BasketBack x={1420} y={COUNTER - 120} w={300} />
        <MilkCarton x={1400} y={COUNTER - 180} size={140} rotate={-6} />
        {ITEMS.slice(0, 7).map((it, i) => <Grocery key={i} kind={it.kind} x={1420 + it.dx * 0.8} y={COUNTER - 140 - (700 - it.y) * 0.7} size={120} rotate={it.r} />)}
        <BasketFront x={1420} y={COUNTER - 120} w={300} />
      </svg>
      <div style={{position: 'absolute', left: 210, top: 60, width: 1500, padding: '34px 40px', borderRadius: 44, background: '#FFFFFF', boxShadow: `12px 12px 0 ${C.lightGray}`, textAlign: 'center',
        transform: `scale(${card})`, opacity: Math.min(1, card * 1.5)}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 62, color: C.ink, lineHeight: 1.3}}>
          <div>I only meant to buy milk,</div>
          <div style={{whiteSpace: 'nowrap'}}>
          but{' '}
          <span style={{padding: '0 12px', borderRadius: 16, background: hl ? C.blue : 'transparent', color: hl ? '#FFFFFF' : C.ink}}>I ended up</span>{' '}
          <span style={{display: 'inline-block', width: 260, borderBottom: `10px solid ${C.blue}`, opacity: blank}}>&nbsp;</span> .
          </div>
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, marginTop: 22, fontFamily: FONT_JA, fontWeight: 900, fontSize: 42, color: C.blue, transform: `scale(${ask})`, opacity: Math.min(1, ask * 1.5)}}>
          <svg width={70} height={70} viewBox="-35 -35 70 70"><CommentBubble x={0} y={0} size={64} /></svg>
          コメント欄で文を完成させてね！
        </div>
      </div>
      <NarrationSubs top={COUNTER + 120} start={0} end={e1} color="#FFFFFF" chunks={[
        {at: 0.2, text: '最後に、あなたならどう続けますか？'},
        {at: 3.6, text: 'お店で買い物をする場面を思い浮かべて、'},
        {at: 6.4, text: 'コメント欄で文を完成させてみてください。'},
      ]} size={42} />
      <BlockWipe mode="out" from={0} color={C.green} />
    </AbsoluteFill>
  );
};

export const Ep02CheckTheTimeYT: React.FC = () => {
  const local = (w: {from: number; durationInFrames: number}, base: number) => ({from: w.from - base, durationInFrames: w.durationInFrames});
  const blockA = {from: W_A[0].from, durationInFrames: W_A[3].from + W_A[3].durationInFrames - W_A[0].from};
  const blockB = {from: W_B[0].from, durationInFrames: W_B[3].from + W_B[3].durationInFrames - W_B[0].from};
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <Sequence {...W_OPEN}><Opening /></Sequence>
      <Sequence {...blockA}><StoryBlock wins={W_A.map((w) => local(w, 0))} captions={false} label="Listen" listen /></Sequence>
      <Sequence {...W_ANS}><Answer /></Sequence>
      <Sequence {...blockB}><StoryBlock wins={W_B.map((w) => local(w, 0))} captions label="English + 日本語" fillOut wipeOut /></Sequence>
      <Sequence {...W_KEY}><KeyExpressions /></Sequence>
      <Sequence {...W_SHOP}><Shop /></Sequence>
      <Sequence {...W_PRAC}><Practice /></Sequence>
      <Sequence {...W_END}><Closing /></Sequence>
      <VoiceTrack tl={tl} fps={FPS} />
    </AbsoluteFill>
  );
};
