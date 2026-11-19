import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {C, FONT_EN, FONT_JA} from '../theme';
import {lineStart, sceneWindow, timelineFrames, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {ArcText} from '../lib/ArcText';
import {Captions} from '../lib/Captions';
import {blinkAt, breathe, darting, landing, lerp, pulse} from '../lib/motion';
import {ClipCard, ClockFace, ClockScreen, Phone, VideoBubble, VideoScreen} from '../props/Phone';
import timeline from '../../public/audio/ep02-check-the-time/timeline.json';

// Episode 2 · "I Only Meant to Check the Time" — TikTok 9:16, EN voice (Sarah), EN/JA captions.
const tl = timeline as VoiceTimeline;
const FPS = 30;
const W = 1080;
const H = 1920;
export const EP02_FRAMES = timelineFrames(tl, FPS);

const S1 = sceneWindow(tl, FPS, ['S01']);
const S2 = sceneWindow(tl, FPS, ['S02']);
const S3 = sceneWindow(tl, FPS, ['S03']);
const S4 = sceneWindow(tl, FPS, ['S04']);
const S5 = sceneWindow(tl, FPS, ['S05', 'S06']);
const rel = (id: string, scene: {from: number}) => lineStart(tl, FPS, id) - scene.from;
const sec = (s: number) => Math.round(s * FPS);

// Layout
const DESK_Y = 1240;
const HERO = {x: 380, w: 420, h: 380};
const HERO_Y = DESK_Y - HERO.h / 2;
const PHONE_REST = {x: 820, y: DESK_Y - 80, rotate: 90, scale: 1};
const PHONE_HELD = {x: 800, y: 860, rotate: -8, scale: 1.15};
const CAPTION_TOP = 1350;

// ---------- shared pieces ----------
const Desk: React.FC = () => (
  <g>
    <rect x={-20} y={DESK_Y} width={W + 40} height={70} fill={C.lightGray} />
    <rect x={-20} y={DESK_Y + 70} width={W + 40} height={H - DESK_Y} fill={C.grayShade} />
  </g>
);

const Hero: React.FC<{y?: number; x?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; w?: number; h?: number}> = ({
  y = HERO_Y, x = HERO.x, w = HERO.w, h = HERO.h, ...p
}) => (
  <Character shape="roundRect" w={w} h={h} color={C.yellow} shade={C.yellowShade} x={x} y={y} faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />
);

const phoneBetween = (k: number, from: typeof PHONE_REST, to: typeof PHONE_REST, arc = 140) => ({
  x: lerp(from.x, to.x, k),
  y: lerp(from.y, to.y, k) - arc * Math.sin(Math.min(1, Math.max(0, k)) * Math.PI),
  rotate: lerp(from.rotate, to.rotate, k),
  scale: lerp(from.scale, to.scale, k),
});

// Floating video clips that crowd the frame in S02 (x, y, w, h, color, rotation, face, pop-in frame within S02)
const SH = (c: string) => (({pink: C.pinkShade, lightBlue: C.lightBlueShade, green: C.greenShade, purple: C.purpleShade, orange: C.orangeShade, blue: C.blueShade}) as Record<string, string>)[c];
const CARDS: {x: number; y: number; w: number; h: number; c: string; r: number; e?: Expression; t: number}[] = [
  {x: 300, y: 470, w: 250, h: 210, c: 'pink', r: -8, e: 'happy', t: 76},
  {x: 790, y: 430, w: 240, h: 200, c: 'lightBlue', r: 9, e: 'happy', t: 112},
  {x: 120, y: 190, w: 260, h: 220, c: 'green', r: 14, e: 'look', t: 119},
  {x: 560, y: 210, w: 230, h: 200, c: 'purple', r: -6, e: 'happy', t: 125},
  {x: 970, y: 190, w: 250, h: 220, c: 'orange', r: 12, e: 'happy', t: 131},
  {x: 50, y: 760, w: 220, h: 300, c: 'blue', r: -18, e: 'look', t: 137},
  {x: 1050, y: 650, w: 240, h: 280, c: 'pink', r: 16, e: 'happy', t: 143},
  {x: 430, y: -10, w: 280, h: 220, c: 'lightBlue', r: 5, t: 148},
  {x: 830, y: -20, w: 240, h: 200, c: 'green', r: -10, t: 153},
  {x: 210, y: 690, w: 190, h: 160, c: 'orange', r: 20, e: 'happy', t: 158},
  {x: 1030, y: 1010, w: 190, h: 250, c: 'purple', r: -14, e: 'look', t: 163},
];

const Cards: React.FC<{f: number; exit?: number}> = ({f, exit = 0}) => {
  const {fps} = useVideoConfig();
  const crowd = interpolate(f, [110, 175], [1, 1.07], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <g transform={`translate(${W / 2} 500) scale(${crowd}) translate(${-W / 2} -500)`}>
      {CARDS.map((c, i) => {
        const s = spring({frame: f - c.t, fps, config: {damping: 10, stiffness: 200}}) * (1 - exit);
        if (s <= 0.001) return null;
        const wob = 4 * Math.sin(f / 9 + i);
        return (
          <g key={i} transform={`translate(${c.x} ${c.y}) scale(${s}) translate(${-c.x} ${-c.y})`}>
            <ClipCard x={c.x} y={c.y} w={c.w} h={c.h} color={(C as Record<string, string>)[c.c]} shade={SH(c.c)} rotate={c.r + wob}
              expression={c.e} noFace={!c.e} blink={blinkAt(f, 64, i * 11)} look={{x: Math.sin(f / 20 + i), y: 0.3}} squash={breathe(f, fps, 2.4, i)} />
          </g>
        );
      })}
    </g>
  );
};

// ---------- S01: picks up the phone ----------
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const land = landing(f, fps, 0, 12, HERO_Y - 520, HERO_Y);
  const k = spring({frame: f - 16, fps, config: {damping: 13, stiffness: 120}});
  const ph = phoneBetween(k, PHONE_REST, PHONE_HELD);
  const clockPop = spring({frame: f - 38, fps, config: {damping: 9, stiffness: 200}});
  const hook = spring({frame: f - 2, fps, config: {damping: 12, stiffness: 160}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Desk />
        <Hero y={land.y} squash={f < 30 ? land.squash : breathe(f, fps)} expression="look"
          look={k < 0.5 ? {x: 1, y: 0.7} : {x: 1, y: -0.2}} blink={blinkAt(f, 80, 50)} />
        <Phone {...ph} glow={interpolate(f, [30, 36], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
          screen={(sw, sh) => <ClockScreen sw={sw} sh={sh} time="10:32" pop={clockPop} />} />
      </svg>
      <div style={{position: 'absolute', top: 230, width: W, textAlign: 'center', fontFamily: FONT_JA, fontWeight: 900, fontSize: 86, color: C.ink, transform: `scale(${hook})`, opacity: Math.min(1, hook * 1.4)}}>
        時間を見るだけの
        <br />
        つもりが…
      </div>
      <Captions top={CAPTION_TOP} start={0} en="I picked up my phone to check the time." ja="時間を見るためにスマホを手に取った。" />
    </AbsoluteFill>
  );
};

// ---------- S02: a video arrives… and another ----------
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const TAP = sec(2.2);
  const SWIPE = sec(3.65);
  const bubble = spring({frame: f - 4, fps, config: {damping: 10, stiffness: 200}}) * (1 - spring({frame: f - TAP, fps, config: {damping: 14, stiffness: 240}}));
  const swipeK = spring({frame: f - SWIPE, fps, config: {damping: 16, stiffness: 220}});
  const bob = 8 * Math.sin(f / 12);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Desk />
        <Hero expression={f < TAP ? 'look' : 'happy'} squash={breathe(f, fps) * pulse(f, fps, SWIPE, 0.08)}
          look={f < TAP ? {x: 0.9, y: -0.8} : darting(f, fps, [{x: 1, y: -0.3}, {x: 0, y: -1}, {x: -0.8, y: -0.8}, {x: 1, y: -0.6}], 22)}
          blink={blinkAt(f, 70, 20)} />
        <Phone {...PHONE_HELD} y={PHONE_HELD.y + bob} screen={(sw, sh) =>
          f < TAP ? <ClockScreen sw={sw} sh={sh} time="10:32" /> : (
            <g>
              <g transform={`translate(0 ${-swipeK * sh})`}>
                <VideoScreen sw={sw} sh={sh} t={f / fps} color={C.pink} shade={C.pinkShade} accent={C.yellow} />
              </g>
              {f >= SWIPE && (
                <g transform={`translate(0 ${(1 - swipeK) * sh})`}>
                  <VideoScreen sw={sw} sh={sh} t={f / fps + 1} color={C.lightBlue} shade={C.lightBlueShade} accent={C.green} />
                </g>
              )}
              {/* tap ripple */}
              {f >= TAP && f < TAP + 12 && <circle cx={0} cy={sh * 0.1} r={(f - TAP) * 6} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={1 - (f - TAP) / 12} />}
            </g>
          )} />
        <VideoBubble x={780} y={600} scale={bubble} />
        <Cards f={f} />
      </svg>
      <Captions top={CAPTION_TOP} start={0} en="Then a friend sent me a video. I watched it… and then another one." ja="すると友達から動画が届いた。それを見て……またもう1本。" enSize={54} jaSize={40} />
    </AbsoluteFill>
  );
};

// ---------- S03: ten minutes later ----------
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nightIn = interpolate(f, [0, 16], [0, 1], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateRight: 'clamp'});
  const nightOut = interpolate(f, [54, 68], [0, 1], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const nightR = 2300 * nightIn * (1 - nightOut);
  const cardsExit = interpolate(f, [0, 12], [0, 1], {extrapolateRight: 'clamp'});
  const clockS = spring({frame: f - 6, fps, config: {damping: 10, stiffness: 180}}) * (1 - nightOut);
  const spin = interpolate(f, [8, 50], [0, 1], {easing: Easing.inOut(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const DOWN = 42;
  const k = 1 - spring({frame: f - DOWN, fps, config: {damping: 14, stiffness: 140}});
  const ph = phoneBetween(k, PHONE_REST, PHONE_HELD, 60);
  const slump = f >= 62 ? 1 + 0.1 * spring({frame: f - 62, fps, config: {damping: 9, stiffness: 160}}) : breathe(f, fps, 1.4);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={PHONE_HELD.x} cy={PHONE_HELD.y} r={nightR} fill={C.night} />
        {f < 20 && <Cards f={175 + f} exit={cardsExit} />}
        <Desk />
        <Hero expression="sleepy" squash={slump} blink={0} />
        <Phone {...ph} glow={interpolate(f, [DOWN, DOWN + 14], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
          screen={(sw, sh) => <VideoScreen sw={sw} sh={sh} t={f / fps + 2} color={C.orange} shade={C.orangeShade} accent={C.lightBlue} />} />
        <g opacity={1 - nightOut}>
          <ClockFace x={540} y={430} size={280} progress={spin} turns={3} scale={clockS} />
          <ArcText text="10 MINUTES LATER" cx={540} cy={430} r={215} start={10} fontSize={50} spacingDeg={8.5} color="#FFFFFF" fontFamily={FONT_EN} stagger={1} />
        </g>
      </svg>
      <Captions top={CAPTION_TOP} start={0} en="Ten minutes later, I put my phone down." ja="10分後、スマホを机に置いた。" />
    </AbsoluteFill>
  );
};

// ---------- S04: Wait. What time is it? ----------
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const Q = sec(1.95); // "What time is it?"
  const jolt = f < 14 ? 1 - 0.12 * Math.sin(spring({frame: f, fps, config: {damping: 8, stiffness: 260}}) * Math.PI) : 1;
  const expr: Expression = f < 3 ? 'sleepy' : f < Q + 10 ? 'look' : 'strained';
  const wake = spring({frame: f - (Q - 10), fps, config: {damping: 12, stiffness: 150}});
  const BIG = {x: 760, y: 720, rotate: 0, scale: 1.7};
  const ph = phoneBetween(wake, PHONE_REST, BIG, 120);
  const digits = spring({frame: f - Q, fps, config: {damping: 6, stiffness: 220}});
  const fill = interpolate(f, [D - 14, D], [1, 14], {easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
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
      {fill < 1.5 && (
        <>
          <Captions top={CAPTION_TOP} start={0} end={Q - 3} en="Wait." ja="あれ？" jaDelay={12} enSize={72} jaSize={54} />
          <Captions top={CAPTION_TOP} start={Q} en="What time is it?" ja="今、何時？" jaDelay={14} enSize={72} jaSize={54} />
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- S05 + S06: takeaway ----------
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = rel('S06', S5); // second line, relative to this scene
  const a5 = rel('S05', S5);
  const open = interpolate(f, [0, 16], [0, 1500], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const GROUND = 1180;
  const hw = 340;
  const hh = 300;
  const land = landing(f, fps, 6, 22, -200, GROUND - hh / 2);
  const glowR = interpolate(f, [16, 40], [0, 340], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const chuckle = pulse(f, fps, B + sec(3.5), 0.1) * pulse(f, fps, B + sec(3.5) + 7, 0.08);
  const arc1 = interpolate(f, [B - 8, B], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: C.charcoal}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={540} cy={900} r={open} fill={C.yellow} />
        <rect x={-20} y={GROUND} width={W + 40} height={H} fill={C.yellowShade} opacity={open > 1200 ? 1 : 0} />
        <circle cx={540} cy={GROUND - hh / 2} r={glowR} fill="#FFE45C" />
        {f < B && (
          <g opacity={arc1}>
            <ArcText text="I only meant to …" cx={540} cy={GROUND - hh / 2} r={330} start={a5 + 4} fontSize={64} spacingDeg={6.4} color={C.night} fontFamily={FONT_EN} stagger={1} />
          </g>
        )}
        {f >= B - 2 && <ArcText text="I ended up …-ing" cx={540} cy={GROUND - hh / 2} r={330} start={B} fontSize={64} spacingDeg={6.4} color={C.blue} fontFamily={FONT_EN} stagger={1} />}
        <Hero x={540} y={land.y} w={hw} h={hh} expression={f < B ? 'calm' : 'happy'}
          squash={f < 40 ? land.squash : breathe(f, fps) * chuckle} blink={blinkAt(f, 75, 10)} look={{x: 0, y: 0}} />
      </svg>
      <Captions top={CAPTION_TOP} start={a5 + 8} end={B} en="I only meant to check the time." ja="時間を見るだけのつもりだったのに。" highlight={['only meant to']} spokenFrames={sec(2.4)} hlBg={C.night} />
      <Captions top={CAPTION_TOP} start={B} en="I ended up scrolling for ten minutes." ja="結局10分もスクロールしてしまった。" highlight={['ended up scrolling']} spokenFrames={sec(3.3)} hlBg={C.blue} />
    </AbsoluteFill>
  );
};

export const Ep02CheckTheTime: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.offWhite}}>
    <Sequence {...S1}><Scene1 /></Sequence>
    <Sequence {...S2}><Scene2 /></Sequence>
    <Sequence {...S3}><Scene3 /></Sequence>
    <Sequence {...S4}><Scene4 /></Sequence>
    <Sequence {...S5}><Scene5 /></Sequence>
    <VoiceTrack tl={tl} fps={FPS} />
  </AbsoluteFill>
);
