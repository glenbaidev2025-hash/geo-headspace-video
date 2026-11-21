import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {Owl} from '../Owl';
import {C, FONT_EN, FONT_JA} from '../theme';
import {lineStart, sceneWindow, talkLevel, timelineFrames, VoiceEnvelope, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {Captions, NarrationSubs} from '../lib/Captions';
import {blinkAt, breathe, landing, pulse} from '../lib/motion';
import {Counter, Cup, SpeechBubble, SpeedLines} from '../props/Cafe';
import {MarkBadge} from '../props/Marks';
import {CommentBubble, Headphones, Mic, ProgressBar} from '../props/Icons';
import {SweatDrop} from '../props/Home';
import timeline from '../../public/audio/ep04-didnt-catch-that-yt/timeline.json';
import envelope from '../../public/audio/ep04-didnt-catch-that-yt/envelope.json';

// Episode 4 · "I Didn't Catch That" — YouTube 16:9, ~2:55.
// Voices: Sarah (EN story & model lines; C01/P01/P03 reuse the 9:16 cut), JA host narration.
const tl = timeline as VoiceTimeline;
const env = envelope as VoiceEnvelope;
const FPS = 30;
const W = 1920;
const H = 1080;
export const EP04YT_FRAMES = timelineFrames(tl, FPS);

const win = (ids: string[]) => sceneWindow(tl, FPS, ids);
const sec = (s: number) => Math.round(s * FPS);
const durOf = (id: string) => sec(tl.segments.find((s) => s.id === id)!.duration_s);

const W_OPEN = win(['N01']);
const W_A = ['A01', 'A02', 'A03', 'A04', 'A05'].map((id) => win([id]));
const W_ANS = win(['N02']);
const W_B = ['B01', 'B02', 'B03', 'B04', 'B05'].map((id) => win([id]));
const W_TEXTBOOK = win(['N03']);
const W_KEY = win(['N04', 'N06']);
const W_USE = win(['N07', 'C03']);
const W_PRAC = win(['N08', 'P03']);
const W_END = win(['N10', 'N11']);

const rel = (id: string, w: {from: number}) => lineStart(tl, FPS, id) - w.from;
const HOST_IDS = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08', 'N09', 'N10', 'N11'];
const hostTalk = (globalFrame: number) => talkLevel(tl, env, FPS, globalFrame, HOST_IDS);

// ---------- layout ----------
const FLOOR = 800;
const HERO = {w: 300, h: 270};
const HERO_Y = FLOOR - HERO.h / 2;
const HERO_X = 760;
const BAR = {x: 1430, y: 470}; // barista capsule center (lower half hidden by the counter)
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

type HeroProps = {x: number; y?: number; w?: number; h?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; talk?: number; stone?: boolean};

/** Yellow hero (the learner, "I"). `stone` = frozen grey when the English was too fast. */
const Hero: React.FC<HeroProps> = ({x, y = HERO_Y, w = HERO.w, h = HERO.h, stone, ...p}) => (
  <Character shape="roundRect" w={w} h={h} color={stone ? C.lightGray : C.yellow} shade={stone ? C.grayShade : C.yellowShade} x={x} y={y}
    faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />
);

/** Fake fast-talk mouth for the barista (her lines are only implied, never voiced). */
const fakeTalk = (f: number, on: boolean) => (on ? 0.25 + 0.6 * Math.abs(Math.sin(f * 0.9) * Math.cos(f * 0.37)) : 0);

/** Café set: menu board, blue barista behind an orange counter, cups. */
const CafeSet: React.FC<{f: number; baristaTalk?: number; baristaExpr?: Expression; look?: {x: number; y: number}}> = ({f, baristaTalk = 0, baristaExpr = 'happy', look = {x: -0.8, y: 0.2}}) => {
  const {fps} = useVideoConfig();
  return (
    <g>
      <rect x={1560} y={150} width={280} height={140} rx={26} fill={C.charcoal} />
      {[186, 222, 256].map((y, i) => <rect key={y} x={1590} y={y} width={[190, 150, 210][i]} height={14} rx={7} fill={C.grayShade} />)}
      <Character shape="capsule" w={230} h={420} color={C.blue} shade={C.blueShade} x={BAR.x} y={BAR.y} rotate={baristaTalk > 0 ? 2 * Math.sin(f / 4) : 0}
        squash={breathe(f, fps, 2.2, 1) * (1 + 0.03 * baristaTalk)} expression={baristaExpr} talk={baristaTalk} faceSize={140} faceOffset={{x: -6, y: -110}}
        blink={blinkAt(f, 70, 20)} look={look} />
      <Counter x={1150} y={600} w={560} h={FLOOR - 600} />
      <Cup x={1270} y={545} size={100} steam={(f % 40) / 40} />
      <Cup x={1385} y={550} size={84} />
    </g>
  );
};

/** Fast, unreadable barista speech typed into a bubble. */
const FastBubble: React.FC<{f: number; start: number; scale: number}> = ({f, start, scale}) => {
  const l1 = 'For-here-or-to-go?!';
  const l2 = 'Want-room-for-cream?!';
  const typed = interpolate(f, [start + 4, start + 60], [0, 1], clamp);
  const n = Math.round(typed * (l1.length + l2.length));
  return (
    <g>
      <SpeechBubble x={1060} y={250} w={560} h={150} tx={1320} ty={360} scale={scale}>
        <text x={-240} y={-12} fontFamily={FONT_EN} fontWeight={900} fontSize={44} fill={C.ink} letterSpacing={-3} transform="skewX(-12)">{l1.slice(0, Math.min(n, l1.length))}</text>
        <text x={-230} y={44} fontFamily={FONT_EN} fontWeight={900} fontSize={44} fill={C.ink} letterSpacing={-3} transform="skewX(-12)">{l2.slice(0, Math.max(0, n - l1.length))}</text>
      </SpeechBubble>
      {scale > 0.5 && <SpeedLines x={1395} y={250} size={80} f={f} />}
    </g>
  );
};

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

const Bubble: React.FC<{x: number; y: number; w: number; tx: number; ty: number; k: number; children: React.ReactNode; size?: number; color?: string; shade?: string; h?: number}> = ({x, y, w, tx, ty, k, children, size = 44, color, shade, h = 100}) => (
  <SpeechBubble x={x} y={y} w={w} h={h} tx={tx} ty={ty} scale={k} color={color} shade={shade}>
    <text x={0} y={size * 0.34} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={size} fill={C.ink}>{children}</text>
  </SpeechBubble>
);

// ---------- story beats (first listen + bilingual replay) ----------
type StoryProps = {captions: boolean};
const capProps = {top: CAP_TOP, enSize: 46, jaSize: 34, width: 1600};
const HERO_TOP = HERO_Y - HERO.h / 2;

// 1 · "The barista asked me a quick question."
const Story1: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const land = landing(f, fps, 0, 12, HERO_Y - 700, HERO_Y);
  const ASK = sec(0.7);
  const k = spring({frame: f - ASK, fps, config: {damping: 10, stiffness: 220}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} baristaTalk={fakeTalk(f, f >= ASK)} />
        <Floor />
        <Hero x={HERO_X} y={land.y} squash={f < 30 ? land.squash : breathe(f, fps)} expression="look" look={{x: 1, y: -0.4}} blink={blinkAt(f, 80, 50)} />
        <FastBubble f={f} start={ASK} scale={k} />
      </svg>
      {captions && <Captions {...capProps} start={0} en="The barista asked me a quick question." ja="店員さんに、さっと質問された。" highlight={['quick question']} spokenFrames={durOf('A01')} />}
    </AbsoluteFill>
  );
};

// 2 · "I smiled and said, 'Yes, please.'"
const Story2: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const SMILE = sec(0.35);
  const YES = sec(1.6);
  const yesK = spring({frame: f - YES, fps, config: {damping: 9, stiffness: 240}});
  const heroTalk = f >= YES && f < YES + 26 ? 0.3 + 0.5 * Math.abs(Math.sin(f * 0.6)) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} baristaExpr="happy" />
        <Floor />
        <Hero x={HERO_X} expression={f < SMILE ? 'look' : f < YES ? 'calm' : 'happy'} talk={heroTalk} look={{x: 1, y: -0.4}}
          squash={breathe(f, fps) * pulse(f, fps, YES, 0.08)} blink={blinkAt(f, 80, 30)} />
        {f >= YES && <Bubble x={560} y={340} w={400} tx={700} ty={HERO_TOP + 20} k={yesK}>Yes, please!</Bubble>}
      </svg>
      {captions && <Captions {...capProps} start={0} en={'I smiled and said, "Yes, please."'} ja="私は笑顔で「Yes, please」と答えた。" highlight={['Yes, please.']} spokenFrames={durOf('A02')} />}
    </AbsoluteFill>
  );
};

// 3 · "Wait. … What did she just say?"
const Story3: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const Q = sec(1.86);
  const shock = spring({frame: f - Q, fps, config: {damping: 6, stiffness: 240}});
  const sweatY = f >= Q ? ((f - Q) * 3) % 80 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} baristaExpr="look" look={{x: -1, y: 0}} />
        <Floor />
        <Hero x={HERO_X} stone={f >= 2} expression={f < Q ? 'look' : 'strained'} look={{x: 0, y: 0}}
          rotate={f >= Q ? 3 * Math.sin(f * 2.1) : 0} squash={f < 14 ? pulse(f, fps, 2, 0.14) : pulse(f, fps, Q, 0.12)} blink={0} />
        {f >= 2 && f < Q && (
          <g stroke={C.ink} strokeWidth={10} strokeLinecap="round">
            {[-28, 0, 28].map((a) => {
              const rad = ((a - 90) * Math.PI) / 180;
              const r2 = 230 + 10 * Math.sin(f);
              return <line key={a} x1={HERO_X + 180 * Math.cos(rad)} y1={HERO_Y + 180 * Math.sin(rad)} x2={HERO_X + r2 * Math.cos(rad)} y2={HERO_Y + r2 * Math.sin(rad)} />;
            })}
          </g>
        )}
        {f >= Q && <SweatDrop x={HERO_X + HERO.w * 0.44} y={HERO_TOP + 30 + sweatY} size={64} opacity={interpolate(sweatY, [60, 80], [1, 0], clamp)} />}
        {f >= Q && (
          <text x={HERO_X + 170} y={HERO_TOP - 40} transform={`rotate(10 ${HERO_X + 170} ${HERO_TOP - 40})`} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={150 * shock} fill={C.blue}>?!</text>
        )}
      </svg>
      {captions && (
        <>
          <Captions {...capProps} start={0} end={Q - 3} en="Wait." ja="待って。" jaDelay={12} enSize={60} jaSize={44} />
          <Captions {...capProps} start={Q} en="What did she just say?" ja="今なんて言われたの？" jaDelay={10} enSize={60} jaSize={44} />
        </>
      )}
    </AbsoluteFill>
  );
};

// 4 · "I actually didn't catch a single word."
const Story4: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ZERO = sec(1.3);
  const ghost = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 200}});
  const cross = spring({frame: f - ZERO, fps, config: {damping: 8, stiffness: 240}});
  const draw = interpolate(f, [ZERO + 4, ZERO + 16], [0, 1], clamp);
  const qs = [{x: 900, y: 230, r: -14, at: 6}, {x: 1000, y: 380, r: 12, at: 12}, {x: 820, y: 140, r: 18, at: 18}];
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} baristaExpr="look" look={{x: -1, y: 0}} />
        <Floor />
        <g opacity={0.55}><FastBubble f={f + 200} start={0} scale={ghost} /></g>
        {f >= ZERO && <MarkBadge kind="cross" x={1310} y={170} size={120} scale={cross} draw={draw} rotate={-8} />}
        <Hero x={HERO_X} stone expression="sad" squash={breathe(f, fps, 1.6) * 0.97} blink={0} />
        {qs.map((q, i) => {
          if (f < q.at) return null;
          const k = spring({frame: f - q.at, fps, config: {damping: 8, stiffness: 220}});
          return <text key={i} x={q.x} y={q.y + 10 * Math.sin((f - q.at) / 7 + i)} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={100 * k} fill={C.grayShade} transform={`rotate(${q.r} ${q.x} ${q.y})`}>?</text>;
        })}
      </svg>
      {captions && <Captions {...capProps} start={0} en="I actually didn't catch a single word." ja="実は、一言も聞き取れていなかった。" highlight={["didn't catch"]} spokenFrames={durOf('A04')} />}
    </AbsoluteFill>
  );
};

// 5 · "Next time, I'll just say, 'Sorry, I didn't catch that. Could you say that again?'"
const Story5: React.FC<StoryProps & {fillOut?: boolean}> = ({captions, fillOut}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const SORRY = sec(2.09);
  const COULD = sec(3.98);
  const colorBack = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 200}});
  const k1 = spring({frame: f - SORRY, fps, config: {damping: 9, stiffness: 220}});
  const k2 = spring({frame: f - COULD, fps, config: {damping: 9, stiffness: 220}});
  const ok = spring({frame: f - COULD - 14, fps, config: {damping: 7, stiffness: 260}});
  const fill = fillOut ? interpolate(f, [D - 14, D], [0, 2300], {easing: Easing.in(Easing.cubic), ...clamp}) : 0;
  const heroTalk = f >= SORRY && f < sec(5.3) ? 0.3 + 0.5 * Math.abs(Math.sin(f * 0.55)) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} baristaExpr={f >= COULD + 14 ? 'happy' : 'look'} look={{x: -1, y: 0}} />
        <Floor />
        <Hero x={HERO_X} stone={colorBack < 0.5} expression={f < SORRY ? 'calm' : 'happy'} talk={heroTalk} look={{x: 1, y: -0.3}}
          squash={breathe(f, fps) * pulse(f, fps, 4, 0.12)} blink={blinkAt(f, 80, 10)} />
        {f >= SORRY && <Bubble x={560} y={250} w={560} tx={700} ty={HERO_TOP + 10} k={k1} size={40}>Sorry, I didn't catch that.</Bubble>}
        {f >= COULD && <Bubble x={560} y={385} w={560} tx={700} ty={HERO_TOP + 10} k={k2} size={40}>Could you say that again?</Bubble>}
        {f >= COULD + 14 && <MarkBadge kind="check" x={860} y={200} size={110} scale={ok} draw={interpolate(f, [COULD + 18, COULD + 30], [0, 1], clamp)} rotate={8} />}
        {fill > 0 && <circle cx={HERO_X} cy={HERO_Y} r={fill} fill={C.charcoal} />}
      </svg>
      {captions && fill < 300 && (
        <Captions {...capProps} start={0} en={'Next time, I\'ll just say, "Sorry, I didn\'t catch that. Could you say that again?"'} ja="次はこう言おう。「すみません、聞き取れませんでした。もう一度言ってもらえますか？」"
          highlight={["I didn't catch that.", 'Could you say that again?']} spokenFrames={durOf('A05')} enSize={42} jaSize={32} width={1760} />
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
  const q = spring({frame: f - sec(3.95), fps, config: {damping: 8, stiffness: 180}});
  const pill0 = spring({frame: f - 2, fps, config: {damping: 13, stiffness: 180}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} />
        <Host x={300} floorY={FLOOR} enter={12} offset={W_OPEN.from} exit={W_OPEN.durationInFrames - 16} />
        <Floor />
        <Hero x={HERO_X} y={land.y} squash={f < 34 ? land.squash : breathe(f, fps)} expression={f < 18 ? 'look' : 'calm'} look={{x: -0.6, y: 0}} blink={blinkAt(f, 80, 40)} />
        <g transform={`translate(${HERO_X + 150} ${HERO_Y - 280}) scale(${q}) rotate(${6 * Math.sin(f / 10)})`}>
          <Character shape="circle" w={170} h={170} color={C.blue} shade={C.blueShade} x={0} y={0} noFace />
          <text x={-6} y={6} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={120} fill="#FFFFFF">?</text>
        </g>
      </svg>
      <div style={{...pill, transform: `scale(${pill0})`, paddingLeft: 30}}>Listening Quiz</div>
      <NarrationSubs top={CAP_TOP + 10} start={0} end={W_OPEN.durationInFrames} chunks={[
        {at: 0.2, text: 'これから短い英語のストーリーが流れます。'},
        {at: 3.95, text: 'カフェで、話し手はなぜ困ってしまったのでしょうか？'},
        {at: 7.95, text: 'まずは字幕なしで、聞き取ってみましょう。'},
      ]} />
    </AbsoluteFill>
  );
};

// ---------- 3. Answer reveal ----------
const Answer: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const FAST = sec(1.9);
  const SMILE = sec(6.4);
  const card = spring({frame: f - FAST, fps, config: {damping: 10, stiffness: 170}});
  const bubK = spring({frame: f - FAST - 6, fps, config: {damping: 10, stiffness: 220}});
  const yesK = spring({frame: f - SMILE, fps, config: {damping: 9, stiffness: 240}});
  const crossK = spring({frame: f - FAST - 20, fps, config: {damping: 8, stiffness: 240}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <CafeSet f={f} baristaTalk={fakeTalk(f, f >= FAST && f < SMILE)} />
        <Host x={240} floorY={FLOOR} enter={4} offset={W_ANS.from} look={{x: 1, y: -0.3}} />
        <Floor />
        <Hero x={HERO_X} stone={f < SMILE} expression={f < SMILE ? 'strained' : 'happy'} look={{x: 1, y: -0.4}} rotate={f < SMILE ? 2 * Math.sin(f * 2) : 0}
          squash={breathe(f, fps) * pulse(f, fps, SMILE, 0.1)} blink={blinkAt(f, 80, 12)} />
        {f >= FAST && <FastBubble f={f} start={FAST} scale={bubK} />}
        {f >= FAST + 20 && <MarkBadge kind="cross" x={1310} y={170} size={110} scale={crossK} draw={interpolate(f, [FAST + 24, FAST + 36], [0, 1], clamp)} rotate={-8} />}
        {f >= SMILE && <Bubble x={560} y={330} w={420} tx={700} ty={HERO_TOP + 20} k={yesK}>Yes, please!</Bubble>}
        {f >= SMILE + 10 && <SweatDrop x={HERO_X + HERO.w * 0.44} y={HERO_TOP + 30 + ((f - SMILE) * 2) % 70} size={60} />}
      </svg>
      <div style={{position: 'absolute', left: (W - 1100) / 2, top: 36, width: 1100, padding: '16px 36px', borderRadius: 36, background: '#FFFFFF', boxShadow: `10px 10px 0 ${C.lightGray}`,
        transform: `scale(${card}) rotate(${-1.5 + 1.5 * (1 - card)}deg)`, opacity: Math.min(1, card * 1.5), textAlign: 'center'}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 44, color: C.ink, whiteSpace: 'nowrap'}}>答え：一言も聞き取れず、笑顔で「Yes, please」！</div>
      </div>
      <NarrationSubs top={CAP_TOP + 10} start={0} end={D} chunks={[
        {at: 0, text: '聞き取れましたか？'},
        {at: 1.9, text: '答えは、店員さんの英語が早すぎて一言も聞き取れず、'},
        {at: 6.4, text: 'とりあえず笑顔で「Yes, please」と言ってしまったこと、でした。'},
        {at: 11.95, text: 'では、英語と日本語の字幕付きで、もう一度聞いてみましょう。'},
      ]} size={40} width={1700} />
      <BlockWipe mode="in" from={D - 12} />
    </AbsoluteFill>
  );
};

// ---------- 4. Textbook phrases vs. real conversation ----------
const Textbook: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const P = sec(1.9);
  const O = sec(3.3);
  const BAD = sec(8.3);
  const kP = spring({frame: f - P, fps, config: {damping: 10, stiffness: 220}});
  const kO = spring({frame: f - O, fps, config: {damping: 10, stiffness: 220}});
  const kX = spring({frame: f - BAD, fps, config: {damping: 7, stiffness: 260}});
  const draw = interpolate(f, [BAD + 4, BAD + 18], [0, 1], clamp);
  const book = spring({frame: f - 4, fps, config: {damping: 12, stiffness: 170}});
  const TF = 820;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* textbook */}
        <g transform={`translate(1500 ${TF - 150}) scale(${book}) rotate(-6)`}>
          <rect x={-170} y={-130} width={340} height={260} rx={22} fill={C.purpleShade} />
          <rect x={-170} y={-140} width={322} height={256} rx={22} fill={C.purple} />
          <rect x={-120} y={-90} width={220} height={60} rx={14} fill="#FFFFFF" opacity={0.9} />
          <text x={-10} y={-50} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={34} fill={C.purpleShade}>ENGLISH</text>
        </g>
        <Host x={260} floorY={TF} enter={6} offset={W_TEXTBOOK.from} look={{x: 1, y: -0.4}} />
        <Floor y={TF} />
        <Hero x={1080} y={TF - 135} expression={f < BAD ? 'look' : 'strained'} look={{x: -0.6, y: -0.8}} squash={breathe(f, fps) * pulse(f, fps, BAD, 0.1)} blink={blinkAt(f, 80, 10)}
          rotate={f >= BAD && f < BAD + 30 ? 3 * Math.sin(f * 2) : 0} />
        {f >= P && <Bubble x={720} y={230} w={420} h={120} tx={1000} ty={TF - 260} k={kP} size={64}>Pardon?</Bubble>}
        {f >= O && <Bubble x={1300} y={300} w={560} h={120} tx={1160} ty={TF - 260} k={kO} size={60}>One more time.</Bubble>}
        {f >= BAD && <MarkBadge kind="cross" x={920} y={150} size={100} scale={kX} draw={draw} rotate={-8} />}
        {f >= BAD && <MarkBadge kind="cross" x={1570} y={220} size={100} scale={kX} draw={draw} rotate={8} />}
      </svg>
      {f >= BAD && (
        <div style={{position: 'absolute', left: 1340, top: 400, width: 540, textAlign: 'left', fontFamily: FONT_JA, fontWeight: 900, fontSize: 42, lineHeight: 1.35, color: C.red, transform: `scale(${kX})`, transformOrigin: 'left center'}}>
          ちょっと硬い・<br />命令っぽく聞こえることも
        </div>
      )}
      <NarrationSubs top={TF + 70} start={0} end={D} chunks={[
        {at: 0, text: '英語が聞き取れなかったとき、'},
        {at: 1.07, text: '教科書では「Pardon?」や「One more time.」を習いますが、'},
        {at: 5.83, text: '日常会話では、少し硬かったり、命令っぽく聞こえることがあります。'},
      ]} size={40} width={1700} />
      <BlockWipe mode="out" from={0} color={C.charcoal} />
      <BlockWipe mode="in" from={D - 12} color={C.charcoal} />
    </AbsoluteFill>
  );
};

// ---------- 5. Key expressions + linking sound ----------
const PhraseCard: React.FC<{cx: number; cy: number; show: number; active: boolean; sentence: string; hl: string; hlAt: number; meaning: string; meaningAt: number}> = (p) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - p.show, fps, config: {damping: 11, stiffness: 170}});
  const mean = spring({frame: f - p.meaningAt, fps, config: {damping: 12, stiffness: 200}});
  const hlOn = f >= p.hlAt;
  const [pre, post] = p.sentence.split(p.hl);
  const cw = 820;
  const ch = 400;
  if (s < 0.001) return null;
  return (
    <div style={{position: 'absolute', left: p.cx - cw / 2, top: p.cy - ch / 2, width: cw, height: ch, transform: `scale(${s * (p.active ? 1.03 : 0.97)})`, opacity: p.active ? 1 : 0.8}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: C.yellowShade, transform: 'translate(14px, 14px)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: '#FFFFFF', padding: '60px 40px', textAlign: 'center'}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 50, lineHeight: 1.3, color: C.ink, whiteSpace: 'nowrap'}}>
          {pre}
          <span style={{padding: '0 12px', borderRadius: 16, whiteSpace: 'nowrap', background: hlOn ? C.blue : 'transparent', color: hlOn ? '#FFFFFF' : C.ink}}>{p.hl}</span>
          {post}
        </div>
        <div style={{height: 6, borderRadius: 3, background: C.lightGray, margin: '36px 60px 30px'}} />
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 44, color: C.ink, whiteSpace: 'nowrap', transform: `translateY(${(1 - mean) * 16}px)`, opacity: Math.min(1, mean * 1.5)}}>{p.meaning}</div>
      </div>
    </div>
  );
};

const KeyExpressions: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const open = interpolate(f, [0, 16], [0, 2300], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const c1 = rel('C01', W_KEY);
  const n5 = rel('N05', W_KEY);
  const n6 = rel('N06', W_KEY);
  const showA = rel('N04', W_KEY) + sec(2.6);
  const aActive = f < c1 + sec(1.7) || (f >= n5 && f < n5 + sec(4.7));
  const bActive = (f >= c1 + sec(1.7) && f < n5) || f >= n5 + sec(4.7);
  const linking = f >= n6;
  const tDrop = interpolate(f, [n6 + sec(1.77), n6 + sec(1.77) + 12], [1, 0.2], clamp);
  const kana = spring({frame: f - n6 - sec(3.64), fps, config: {damping: 9, stiffness: 200}});
  const linkCard = spring({frame: f - n6, fps, config: {damping: 11, stiffness: 170}});
  return (
    <AbsoluteFill style={{backgroundColor: C.charcoal}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={H / 2} r={open} fill={C.yellow} />
        <Host x={170} floorY={1000} enter={10} offset={W_KEY.from} w={200} h={270} look={{x: 0.8, y: -0.6}} />
        <rect x={-20} y={1000} width={W + 40} height={100} fill={C.yellowShade} />
      </svg>
      {!linking && (
        <>
          <div style={{position: 'absolute', top: 80, width: W, textAlign: 'center', fontFamily: FONT_JA, fontWeight: 900, fontSize: 48, color: C.ink, opacity: f >= showA ? 1 : 0}}>ネイティブの定番フレーズ</div>
          <PhraseCard cx={520} cy={480} show={showA} active={aActive} sentence="Sorry, I didn't catch that." hl="didn't catch that" hlAt={c1 + sec(0.5)}
            meaning="今の、聞き取れませんでした" meaningAt={n5 + sec(1.62)} />
          <PhraseCard cx={1400} cy={480} show={c1 + sec(1.7)} active={bActive} sentence="Could you say that again?" hl="say that again" hlAt={c1 + sec(2.2)}
            meaning="もう一度言ってもらえますか？" meaningAt={n5 + sec(6.38)} />
        </>
      )}
      {linking && (
        <div style={{position: 'absolute', left: (W - 1300) / 2, top: 170, width: 1300, height: 560, transform: `scale(${linkCard})`}}>
          <div style={{position: 'absolute', inset: 0, borderRadius: 52, background: C.yellowShade, transform: 'translate(14px, 14px)'}} />
          <div style={{position: 'absolute', inset: 0, borderRadius: 52, background: '#FFFFFF', textAlign: 'center', paddingTop: 50}}>
            <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 44, color: C.ink, opacity: 0.75}}>聞き取りのポイント：音がつながる</div>
            <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 120, color: C.ink, marginTop: 40, letterSpacing: 2}}>
              didn'<span style={{color: C.red, opacity: tDrop}}>t</span> catch tha<span style={{color: C.red, opacity: tDrop}}>t</span>
            </div>
            <svg width={1300} height={60} style={{display: 'block'}}>
              {kana > 0.05 && (
                <g fill="none" stroke={C.blue} strokeWidth={10} strokeLinecap="round" opacity={Math.min(1, kana)}>
                  <path d="M 340 10 Q 430 60 520 10" />
                  <path d="M 600 10 Q 760 60 920 10" />
                </g>
              )}
            </svg>
            <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 80, color: C.blue, marginTop: 10, transform: `scale(${kana})`}}>ディドゥン キャッチャッ</div>
          </div>
        </div>
      )}
      <NarrationSubs top={1010} start={0} end={c1} chunks={[{at: 0.1, text: 'そんなとき、ネイティブがよく使うのが、この表現です。'}]} size={40} />
      <NarrationSubs top={1010} start={n5} end={n6} chunks={[
        {at: 0, text: '「I didn\'t catch that」は、「今の、聞き取れませんでした」。'},
        {at: 4.73, text: '「Could you say that again?」は、「もう一度言ってもらえますか？」'},
        {at: 9.31, text: 'という、丁寧で自然なフレーズです。'},
      ]} size={38} width={1700} />
      <NarrationSubs top={1010} start={n6} end={D} chunks={[
        {at: 0, text: '聞き取りのポイントは、'},
        {at: 1.77, text: 'tの音が落ちて、「ディドゥン キャッチャッ」のように繋がるところです。'},
      ]} size={38} width={1700} />
      <BlockWipe mode="in" from={D - 12} color={C.purple} />
    </AbsoluteFill>
  );
};

// ---------- 6. Transfer: name + noisy café ----------
const Transfer: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const c2 = rel('C02', W_USE);
  const c3 = rel('C03', W_USE);
  const MF = 820;
  const friendIn = landing(f, fps, 8, 22, -300, MF - 130);
  const nameK = spring({frame: f - c2 + 4, fps, config: {damping: 9, stiffness: 220}});
  const noisy = f >= c3;
  const heroTalk = (f >= c2 && f < c2 + durOf('C02')) || (f >= c3 && f < c3 + durOf('C03')) ? talkLevel(tl, env, FPS, f + W_USE.from, ['C02', 'C03']) : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={960} cy={430} r={interpolate(f, [4, 22], [0, 360], {easing: Easing.out(Easing.cubic), ...clamp})} fill={noisy ? '#FFD9C2' : '#FFF1A8'} />
        <Host x={240} floorY={MF} enter={4} offset={W_USE.from} exit={c2 - 10} look={{x: 1, y: -0.2}} />
        <Floor y={MF} />
        <Hero x={700} y={MF - 135} expression={noisy ? 'strained' : 'happy'} talk={noisy ? 0 : heroTalk} look={{x: 1, y: -0.3}}
          squash={breathe(f, fps) * pulse(f, fps, c3, 0.1)} blink={blinkAt(f, 80, 10)} rotate={noisy ? 2 * Math.sin(f * 1.6) : 0} />
        <Character shape="circle" w={260} h={260} color={C.pink} shade={C.pinkShade} x={1240} y={friendIn.y} squash={f < 40 ? friendIn.squash : breathe(f, fps, 2, 1)}
          expression="happy" talk={f >= 24 && f < c2 ? fakeTalk(f, true) : 0} look={{x: -1, y: -0.2}} blink={blinkAt(f, 72, 30)} faceSize={150} />
        {f >= c2 - 4 && !noisy && (
          <SpeechBubble x={1380} y={300} w={420} h={130} tx={1280} ty={MF - 270} scale={nameK}>
            <text x={0} y={-6} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={40} fill={C.ink} letterSpacing={-3} transform="skewX(-12)">Hi-I'm-Mrrhh-a!</text>
            <text x={0} y={42} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={30} fill={C.grayShade}>(name?)</text>
          </SpeechBubble>
        )}
        {noisy &&
          [0, 1, 2, 3, 4].map((i) => {
            const a = f / 9 + i * 1.3;
            const nx = 960 + Math.cos(a) * 260 + (i - 2) * 80;
            const ny = 300 + Math.sin(a * 1.4) * 80;
            const k = spring({frame: f - c3 - i * 3, fps, config: {damping: 8, stiffness: 220}});
            return (
              <g key={i} transform={`translate(${nx} ${ny}) rotate(${15 * Math.sin(a)}) scale(${k})`}>
                <ellipse cx={0} cy={0} rx={22} ry={16} fill={[C.blue, C.orange, C.purple][i % 3]} transform="rotate(-20)" />
                <rect x={16} y={-70} width={10} height={72} rx={5} fill={[C.blue, C.orange, C.purple][i % 3]} />
              </g>
            );
          })}
      </svg>
      <NarrationSubs top={MF + 70} start={0} end={c2} chunks={[{at: 0, text: '日常のやり取りでも、こんなふうに応用できます。'}]} size={40} />
      <Captions top={MF + 60} start={c2} end={c3} en="Sorry, I didn't catch your name." ja="すみません、お名前が聞き取れませんでした。" highlight={["didn't catch your name"]} spokenFrames={durOf('C02')} enSize={50} jaSize={34} width={1700} />
      <Captions top={MF + 60} start={c3} en="It's a bit noisy here. Could you say that again?" ja="ここ少しうるさくて。もう一度言ってもらえますか？" highlight={['Could you say that again?']} spokenFrames={durOf('C03')} enSize={48} jaSize={34} width={1700} />
      <BlockWipe mode="out" from={0} color={C.purple} />
      <BlockWipe mode="in" from={D - 12} color={C.green} />
    </AbsoluteFill>
  );
};

// ---------- 7. Repeat after me ----------
const L1 = "Sorry, I didn't catch that.";
const L2 = 'Could you say that again?';

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
  else if (f < r('P02')) { en = [L1]; ja = 'すみません、聞き取れませんでした。'; key = 'p1'; }
  else if (f < r('N09')) { en = [L2]; ja = 'もう一度言ってもらえますか？'; key = 'p2'; }
  else if (f < r('P03')) { en = ['Now say both lines!']; ja = 'カフェで使うつもりで、2文をつなげて'; key = 'both'; }
  else { en = [L1, L2]; ja = ''; key = 'p3'; }
  const keyStart = {title: 0, p1: r('P01'), p2: r('P02'), both: r('N09'), p3: r('P03')}[key]!;
  const txt = spring({frame: f - keyStart, fps, config: {damping: 13, stiffness: 190}});
  const turn = gap ? spring({frame: f - gap.from, fps, config: {damping: 9, stiffness: 200}}) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={PF - 135} r={interpolate(f, [10, 30], [0, 260], clamp)} fill="#FFF1A8" />
        <Host x={300} floorY={PF} enter={8} offset={W_PRAC.from} look={{x: 1, y: 0}} />
        <Floor y={PF} />
        <Hero x={W / 2} y={land.y} expression={speaking ? 'happy' : playing ? 'look' : 'calm'} talk={heroTalk}
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
        {at: 3.21, text: 'ポーズのあとに、続けて言ってみてください。'},
      ]} size={40} />
      <NarrationSubs top={PF + 60} start={r('N09')} end={r('P03')} chunks={[
        {at: 0, text: '次は2文をつなげて、'},
        {at: 2.17, text: 'カフェで実際に使うつもりで言ってみましょう。'},
      ]} size={40} />
      <BlockWipe mode="out" from={0} color={C.green} />
      <BlockWipe mode="in" from={D - 12} color={C.yellow} />
    </AbsoluteFill>
  );
};

// ---------- 8. Viewer poll + Owl Listen outro ----------
const OPTS = [
  {k: 'A', t: 'Pardon?', at: 0, en: true},
  {k: 'B', t: 'One more time', at: 1.54, en: true},
  {k: 'C', t: 'とりあえず笑顔で「Yes」', at: 3.19, en: false},
];

const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const n11 = rel('N11', W_END);
  const CF = 760;
  const card = spring({frame: f - 8, fps, config: {damping: 11, stiffness: 170}});
  const ask = spring({frame: f - n11 - sec(6.46), fps, config: {damping: 10, stiffness: 190}});
  const OWL = 250;
  const owlY = CF - OWL * 0.54;
  const owlLand = landing(f, fps, n11 + sec(6.3), n11 + sec(6.3) + 16, -300, owlY);
  const wave = f > n11 + sec(6.8) && f < n11 + sec(8.5) ? 25 * Math.sin(f / 3) : 0;
  const cMoment = f >= n11 + sec(3.19) && f < n11 + sec(6.4);
  const arc = interpolate(f, [D - sec(3), D - sec(2.5)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Host x={300} floorY={CF + 40} enter={6} offset={W_END.from} look={{x: 1, y: -0.5}} />
        <Hero x={960} y={CF - 130} w={300} h={260} expression={cMoment ? 'strained' : 'happy'} look={{x: 0, y: -0.4}} stone={cMoment}
          squash={breathe(f, fps) * pulse(f, fps, n11 + sec(3.19), 0.1)} blink={blinkAt(f, 80, 5)} />
        {f >= n11 + sec(6.3) && <Owl x={1300} y={owlLand.y} size={OWL} squash={f < n11 + sec(7.4) ? owlLand.squash : breathe(f, fps, 2, 1)} blink={blinkAt(f, 70, 33)} wing={wave} look={{x: -0.8, y: -0.3}} happy={f > n11 + sec(7.4)} />}
        <rect x={-20} y={CF} width={W + 40} height={36} rx={10} fill={C.lightGray} />
        <rect x={-20} y={CF + 36} width={W + 40} height={H} fill={C.charcoal} />
      </svg>
      <div style={{position: 'absolute', left: 260, top: 50, width: 1400, padding: '28px 50px', borderRadius: 44, background: '#FFFFFF', boxShadow: `12px 12px 0 ${C.lightGray}`,
        transform: `scale(${card})`, opacity: Math.min(1, card * 1.5)}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 46, color: C.ink, textAlign: 'center', marginBottom: 14}}>聞き取れない時、普段なんて言ってる？</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 34}}>
          {OPTS.map((o, i) => {
            const k = spring({frame: f - n11 - sec(o.at), fps, config: {damping: 9, stiffness: 220}});
            return (
              <div key={o.k} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '10px 24px', borderRadius: 30, background: i === 2 ? C.yellow : C.lightGray, transform: `scale(${k})`, opacity: Math.min(1, k * 1.5)}}>
                <span style={{display: 'inline-block', width: 52, height: 52, lineHeight: '52px', borderRadius: 26, background: C.ink, color: '#FFFFFF', textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 32}}>{o.k}</span>
                <span style={{fontFamily: o.en ? FONT_EN : FONT_JA, fontWeight: 900, fontSize: 38, color: C.ink, whiteSpace: 'nowrap'}}>{o.t}</span>
              </div>
            );
          })}
        </div>
        <div style={{textAlign: 'center'}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, marginTop: 18, fontFamily: FONT_JA, fontWeight: 900, fontSize: 40, color: C.blue, transform: `scale(${ask})`, opacity: Math.min(1, ask * 1.5)}}>
            <svg width={64} height={64} viewBox="-32 -32 64 64"><CommentBubble x={0} y={0} size={58} /></svg>
            コメント欄で教えてね！
          </div>
        </div>
      </div>
      <NarrationSubs top={CF + 120} start={0} end={n11} color="#FFFFFF" chunks={[
        {at: 0, text: '最後に、あなたは英語が聞き取れなかったとき、'},
        {at: 2.6, text: '普段なんて言っていますか？'},
      ]} size={42} />
      <NarrationSubs top={CF + 120} start={n11} end={D - sec(3)} color="#FFFFFF" chunks={[
        {at: 0, text: 'A、Pardon？　B、One more time。'},
        {at: 3.19, text: 'C、とりあえず笑顔で「Yes」。'},
        {at: 6.46, text: 'ぜひ、コメント欄で教えてください！'},
      ]} size={42} />
      {arc > 0 && (
        <div style={{position: 'absolute', left: 1300 - 220, top: CF + 60, width: 440, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 56, letterSpacing: 2, color: C.owlTan,
          opacity: arc, transform: `translateY(${(1 - arc) * 20}px)`}}>Owl Listen</div>
      )}
      <BlockWipe mode="out" from={0} color={C.yellow} />
    </AbsoluteFill>
  );
};

export const Ep04DidntCatchThatYT: React.FC = () => {
  const span = (ws: {from: number; durationInFrames: number}[]) => ({from: ws[0].from, durationInFrames: ws[ws.length - 1].from + ws[ws.length - 1].durationInFrames - ws[0].from});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <Sequence {...W_OPEN}><Opening /></Sequence>
      <Sequence {...span(W_A)}><StoryBlock wins={W_A} captions={false} label="Listen" listen /></Sequence>
      <Sequence {...W_ANS}><Answer /></Sequence>
      <Sequence {...span(W_B)}><StoryBlock wins={W_B} captions label="English + 日本語" fillOut wipeOut /></Sequence>
      <Sequence {...W_TEXTBOOK}><Textbook /></Sequence>
      <Sequence {...W_KEY}><KeyExpressions /></Sequence>
      <Sequence {...W_USE}><Transfer /></Sequence>
      <Sequence {...W_PRAC}><Practice /></Sequence>
      <Sequence {...W_END}><Closing /></Sequence>
      <VoiceTrack tl={tl} fps={FPS} />
    </AbsoluteFill>
  );
};

