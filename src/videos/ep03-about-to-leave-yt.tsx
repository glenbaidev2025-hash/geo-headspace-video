import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {Owl} from '../Owl';
import {C, FONT_EN, FONT_JA} from '../theme';
import {lineStart, sceneWindow, talkLevel, timelineFrames, VoiceEnvelope, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {Captions, NarrationSubs} from '../lib/Captions';
import {blinkAt, breathe, landing, lerp, pulse} from '../lib/motion';
import {Bag, Door, IconBubble, KeyIcon, PhoneIcon, Shoe, SweatDrop, WalletIcon} from '../props/Home';
import {ChatScreen, Phone} from '../props/Phone';
import {CommentBubble, Headphones, Mic, ProgressBar} from '../props/Icons';
import timeline from '../../public/audio/ep03-about-to-leave-yt/timeline.json';
import envelope from '../../public/audio/ep03-about-to-leave-yt/envelope.json';

// Episode 3 · "I Was Just About to Leave" — YouTube 16:9, ~2:37.
// Voices: Sarah (EN story & model lines, story reused from the 9:16 cut), JA host narration.
const tl = timeline as VoiceTimeline;
const env = envelope as VoiceEnvelope;
const FPS = 30;
const W = 1920;
const H = 1080;
export const EP03YT_FRAMES = timelineFrames(tl, FPS);

const win = (ids: string[]) => sceneWindow(tl, FPS, ids);
const sec = (s: number) => Math.round(s * FPS);
const durOf = (id: string) => sec(tl.segments.find((s) => s.id === id)!.duration_s);

const W_OPEN = win(['N01']);
const W_A = ['A01', 'A02', 'A03', 'A04'].map((id) => win([id]));
const W_ANS = win(['N02']);
const W_B = ['B01', 'B02', 'B03', 'B04'].map((id) => win([id]));
const W_KEY = win(['N03', 'N04']);
const W_MSG = win(['C03', 'N05']);
const W_PRAC = win(['N06', 'P03']);
const W_END = win(['N08', 'E01']);

const rel = (id: string, w: {from: number}) => lineStart(tl, FPS, id) - w.from;
const HOST_IDS = ['N01', 'N02', 'N03', 'N04', 'N05', 'N06', 'N07', 'N08'];
const hostTalk = (globalFrame: number) => talkLevel(tl, env, FPS, globalFrame, HOST_IDS);

// ---------- layout ----------
const FLOOR = 800;
const HERO = {w: 340, h: 300};
const HERO_Y = FLOOR - HERO.h / 2;
const X_START = 620;
const X_DOOR = 1010;
const DOOR = {x: 1390, w: 320, h: 580};
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

const Hallway: React.FC<{open?: number}> = ({open = 0}) => (
  <g>
    <Door x={DOOR.x} floorY={FLOOR} w={DOOR.w} h={DOOR.h} open={open} />
    <rect x={150} y={330} width={170} height={20} rx={10} fill={C.lightGray} />
    {[185, 255].map((x) => <circle key={x} cx={x} cy={366} r={14} fill={C.grayShade} />)}
    <Floor />
    <rect x={DOOR.x - 210} y={FLOOR - 6} width={420} height={22} rx={11} fill={C.orange} opacity={0.85} />
  </g>
);

type HeroProps = {x: number; y?: number; w?: number; h?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; talk?: number; shoes?: number; bag?: number};

/** Yellow hero; optional shoes on its base and bag on its side. */
const Hero: React.FC<HeroProps> = ({x, y = HERO_Y, w = HERO.w, h = HERO.h, shoes = 0, bag = 0, ...p}) => {
  const sq = p.squash ?? 1;
  const bottom = y + h / 2;
  const half = (w * sq) / 2;
  return (
    <g>
      {bag > 0.01 && (
        <g transform={`translate(${x - half} ${bottom - h * 0.3}) scale(${bag}) translate(${-(x - half)} ${-(bottom - h * 0.3)})`}>
          <Bag x={x - half - w * 0.08} y={bottom - h * 0.3} size={w * 0.36} rotate={-4} strapTo={{x: x - half * 0.7, y: y - (h * sq) / 2 + 8}} />
        </g>
      )}
      <Character shape="roundRect" w={w} h={h} color={C.yellow} shade={C.yellowShade} x={x} y={y} faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />
      {shoes > 0.01 && (
        <g opacity={Math.min(1, shoes * 2)}>
          <Shoe x={x - half * 0.5} y={bottom + 4} size={w * 0.36} flip />
          <Shoe x={x + half * 0.5} y={bottom + 4} size={w * 0.36} />
        </g>
      )}
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

// ---------- pocket-check bubbles ----------
const KEY_POS = {x: 760, y: 400};
const WALLET_POS = {x: 560, y: 290};
const PHONE_POS = {x: 820, y: 180};

const Bubbles: React.FC<{keyAt: number; walletAt: number; phoneAt?: number; wobble?: boolean}> = ({keyAt, walletAt, phoneAt, wobble}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = (at: number) => spring({frame: f - at, fps, config: {damping: 9, stiffness: 200}});
  const badge = (at: number) => spring({frame: f - at - 8, fps, config: {damping: 7, stiffness: 260}});
  const w = (i: number) => (wobble ? 5 * Math.sin(f / 5 + i) : 2 * Math.sin(f / 12 + i));
  return (
    <g>
      {f >= keyAt && <IconBubble x={KEY_POS.x} y={KEY_POS.y} size={180} scale={k(keyAt)} rotate={w(0)} badge="x" badgeK={badge(keyAt)}><KeyIcon s={115} /></IconBubble>}
      {f >= walletAt && <IconBubble x={WALLET_POS.x} y={WALLET_POS.y} size={180} scale={k(walletAt)} rotate={w(1)} badge="x" badgeK={badge(walletAt)}><WalletIcon s={105} /></IconBubble>}
      {phoneAt !== undefined && f >= phoneAt && <IconBubble x={PHONE_POS.x} y={PHONE_POS.y} size={220} scale={k(phoneAt) * 1.05} rotate={w(2)} badge="?" badgeK={badge(phoneAt)}><PhoneIcon s={140} /></IconBubble>}
    </g>
  );
};

// ---------- story beats (first listen + bilingual replay) ----------
type StoryProps = {captions: boolean};
const capProps = {top: CAP_TOP, enSize: 46, jaSize: 34, width: 1600};

const Story1: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const land = landing(f, fps, 0, 12, HERO_Y - 700, HERO_Y);
  const shoeL = spring({frame: f - 22, fps, config: {damping: 12, stiffness: 180}});
  const shoeR = spring({frame: f - 30, fps, config: {damping: 12, stiffness: 180}});
  const bagK = spring({frame: f - sec(1.55), fps, config: {damping: 9, stiffness: 180}});
  const bottom = HERO_Y + HERO.h / 2;
  const shoesOn = f >= 40;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway />
        <Hero x={X_START} y={land.y} squash={f < 30 ? land.squash : breathe(f, fps) * pulse(f, fps, 40, 0.1) * pulse(f, fps, sec(1.55) + 6, 0.08)} expression="happy"
          look={{x: 0, y: 0.6}} blink={blinkAt(f, 80, 50)} shoes={shoesOn ? 1 : 0} bag={bagK} />
        {!shoesOn && (
          <g>
            <Shoe x={interpolate(shoeL, [0, 1], [-120, X_START - 85])} y={bottom + 4 - 140 * Math.sin(shoeL * Math.PI)} size={HERO.w * 0.36} flip rotate={(1 - shoeL) * -30} />
            <Shoe x={interpolate(shoeR, [0, 1], [W + 120, X_START + 85])} y={bottom + 4 - 140 * Math.sin(shoeR * Math.PI)} size={HERO.w * 0.36} rotate={(1 - shoeR) * 30} />
          </g>
        )}
      </svg>
      {captions && <Captions {...capProps} start={0} en="I put on my shoes and grabbed my bag." ja="靴を履いて、カバンをつかんだ。" />}
    </AbsoluteFill>
  );
};

const Story2: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const walk = spring({frame: f, fps, config: {damping: 16, stiffness: 120}});
  const x = interpolate(walk, [0, 1], [X_START, X_DOOR]);
  const hop = Math.abs(Math.sin(walk * Math.PI * 2)) * 34 * (1 - walk);
  const open = spring({frame: f - 22, fps, config: {damping: 13, stiffness: 110}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway open={open} />
        <Hero x={x} y={HERO_Y - hop} shoes={1} bag={1} expression={open > 0.5 ? 'happy' : 'look'} look={{x: 1, y: -0.2}} squash={breathe(f, fps) * pulse(f, fps, 22, 0.06)}
          rotate={(1 - walk) * 4 * Math.sin(f / 2)} blink={blinkAt(f, 70, 30)} />
      </svg>
      {captions && <Captions {...capProps} start={0} en="I opened the front door." ja="玄関のドアを開けた。" />}
    </AbsoluteFill>
  );
};

const Story3: React.FC<StoryProps> = ({captions}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const PAT = sec(1.95);
  const PAT_END = sec(3.55);
  const KEY = sec(4.2);
  const WALLET = sec(5.5);
  const patting = f >= PAT && f < PAT_END;
  const freeze = f < 6 ? 1 - 0.1 * Math.sin((f / 6) * Math.PI) : 1;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway open={1} />
        <Hero x={X_DOOR} shoes={1} bag={1} expression={f < KEY ? 'look' : 'strained'} look={patting ? {x: Math.sin(f / 3), y: 1} : f < PAT ? {x: 1, y: -0.2} : {x: -0.8, y: -0.8}}
          rotate={patting ? 7 * Math.sin(f / 2.5) : 0}
          squash={freeze * (patting ? 1 + 0.05 * Math.abs(Math.sin(f / 2.5)) : breathe(f, fps)) * pulse(f, fps, KEY, 0.08) * pulse(f, fps, WALLET, 0.08)} blink={blinkAt(f, 90, 10)} />
        <Bubbles keyAt={KEY} walletAt={WALLET} />
      </svg>
      {captions && (
        <>
          <Captions {...capProps} start={0} end={sec(4.05)} en="Then I stopped and checked my pockets." ja="そこで立ち止まって、ポケットを確かめた。" />
          <Captions {...capProps} start={sec(4.05)} en="No keys. No wallet." ja="鍵がない。財布もない。" enSize={56} jaSize={40} />
        </>
      )}
    </AbsoluteFill>
  );
};

const Story4: React.FC<StoryProps & {fillOut?: boolean}> = ({captions, fillOut}) => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const Q = sec(1.88);
  const shock = spring({frame: f - Q, fps, config: {damping: 6, stiffness: 240}});
  const sweatY = interpolate(f, [Q + 4, Q + 40], [0, 80], clamp);
  const fill = fillOut ? interpolate(f, [D - 14, D], [0, 2300], {easing: Easing.in(Easing.cubic), ...clamp}) : 0;
  const heroTop = HERO_Y - HERO.h / 2;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway open={1} />
        <Hero x={X_DOOR} shoes={1} bag={1} expression={f < Q ? 'look' : 'strained'} look={f < Q ? {x: -0.4, y: -1} : {x: 0, y: 0}}
          rotate={f >= Q ? 5 * Math.sin(f * 1.7) : 0} squash={f < 12 ? 1 - 0.1 * Math.sin((f / 12) * Math.PI) : pulse(f, fps, Q, 0.16)}
          blink={f >= 2 && f < 9 ? 1 - Math.abs(f - 5.5) / 3.5 : 0} />
        <Bubbles keyAt={-30} walletAt={-30} phoneAt={Q - 2} wobble={f >= Q} />
        {f >= Q && <SweatDrop x={X_DOOR + HERO.w * 0.42} y={heroTop + 40 + sweatY} size={70} opacity={interpolate(sweatY, [60, 80], [1, 0], clamp)} />}
        {f >= Q && (
          <text x={X_DOOR + 170} y={heroTop - 50} transform={`rotate(10 ${X_DOOR + 170} ${heroTop - 50})`} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={150 * shock} fill={C.blue}>?!</text>
        )}
        {fill > 0 && <circle cx={X_DOOR} cy={HERO_Y} r={fill} fill={C.charcoal} />}
      </svg>
      {captions && fill < 300 && (
        <>
          <Captions {...capProps} start={0} end={Q - 3} en="Wait." ja="あれ？" jaDelay={12} enSize={60} jaSize={44} />
          <Captions {...capProps} start={Q} en="Where is my phone?" ja="スマホはどこ？" jaDelay={14} enSize={60} jaSize={44} />
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
      <Sequence {...at(2)}><Story3 captions={captions} /></Sequence>
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
  const q = spring({frame: f - sec(3.8), fps, config: {damping: 8, stiffness: 180}});
  const pill0 = spring({frame: f - 2, fps, config: {damping: 13, stiffness: 180}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Host x={300} floorY={FLOOR} enter={12} offset={W_OPEN.from} exit={W_OPEN.durationInFrames - 16} />
        <Hallway />
        <Hero x={X_DOOR - 60} y={land.y} squash={f < 34 ? land.squash : breathe(f, fps)} expression={f < 18 ? 'look' : 'calm'} look={{x: -0.6, y: 0}} blink={blinkAt(f, 80, 40)} />
        <g transform={`translate(${X_DOOR + 130} ${HERO_Y - 290}) scale(${q}) rotate(${6 * Math.sin(f / 10)})`}>
          <Character shape="circle" w={170} h={170} color={C.blue} shade={C.blueShade} x={0} y={0} noFace />
          <text x={-6} y={6} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={120} fill="#FFFFFF">?</text>
        </g>
      </svg>
      <div style={{...pill, transform: `scale(${pill0})`, paddingLeft: 30}}>Listening Quiz</div>
      <NarrationSubs top={CAP_TOP + 10} start={0} end={W_OPEN.durationInFrames} chunks={[
        {at: 0.2, text: 'これから短い英語のストーリーが流れます。'},
        {at: 3.8, text: '話し手は、玄関で何に気づいたでしょうか？'},
        {at: 7.3, text: 'まずは字幕なしで、聞き取ってみましょう。'},
      ]} />
    </AbsoluteFill>
  );
};

// ---------- 3. Answer reveal ----------
const ANS_ITEMS = [
  {x: 640, at: 2.6, icon: <KeyIcon s={130} />, label: '鍵'},
  {x: 960, at: 3.4, icon: <WalletIcon s={120} />, label: '財布'},
  {x: 1280, at: 4.3, icon: <PhoneIcon s={140} />, label: 'スマホ'},
];

const Answer: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const card = spring({frame: f - sec(1.9), fps, config: {damping: 10, stiffness: 170}});
  const BY = 470;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {ANS_ITEMS.map((it, i) => {
          const t0 = sec(it.at);
          const s = spring({frame: f - t0, fps, config: {damping: 9, stiffness: 200}});
          const ring = f >= t0 ? ((f - t0) % 45) / 45 : 0;
          const bk = spring({frame: f - t0 - 8, fps, config: {damping: 7, stiffness: 260}});
          return (
            <g key={i}>
              {f >= t0 && <circle cx={it.x} cy={BY} r={120 + ring * 120} fill="none" stroke={C.yellow} strokeWidth={16 * (1 - ring)} opacity={1 - ring} />}
              {f >= t0 && <IconBubble x={it.x} y={BY} size={220} scale={s} rotate={3 * Math.sin(f / 12 + i)} badge="x" badgeK={bk}>{it.icon}</IconBubble>}
            </g>
          );
        })}
        <Host x={240} floorY={FLOOR} enter={4} offset={W_ANS.from} look={{x: 1, y: -0.3}} />
        <Floor />
        <Hero x={1640} expression={f < sec(7.4) ? 'strained' : f < sec(13.2) ? 'sad' : 'calm'} squash={breathe(f, fps)} look={{x: -1, y: -0.6}}
          rotate={f < sec(7.4) ? 3 * Math.sin(f * 1.4) : 0} shoes={1} bag={1} w={280} h={250} y={FLOOR - 125} blink={blinkAt(f, 80, 12)} />
        {ANS_ITEMS.map((it, i) => (
          <text key={i} x={it.x} y={BY + 165} textAnchor="middle" fontFamily={FONT_JA} fontWeight={900} fontSize={46} fill={C.ink}
            opacity={interpolate(f, [sec(it.at) + 6, sec(it.at) + 14], [0, 1], clamp)}>{it.label}</text>
        ))}
      </svg>
      <div style={{position: 'absolute', left: (W - 1100) / 2, top: 70, width: 1100, padding: '24px 40px', borderRadius: 36, background: '#FFFFFF', boxShadow: `10px 10px 0 ${C.lightGray}`,
        transform: `scale(${card}) rotate(${-1.5 + 1.5 * (1 - card)}deg)`, opacity: Math.min(1, card * 1.5), textAlign: 'center'}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 56, color: C.ink}}>答え：鍵・財布・スマホを全部忘れた！</div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 40, color: C.blue, marginTop: 6}}>keys · wallet · phone</div>
      </div>
      <NarrationSubs top={CAP_TOP + 10} start={0} end={D} chunks={[
        {at: 0, text: '聞き取れましたか？'},
        {at: 1.9, text: '答えは、「鍵も、財布も、スマホも忘れたこと」でした。'},
        {at: 7.4, text: '靴を履いてドアまで開けたのに、肝心の持ち物が、ポケットに何も入っていなかったのです。'},
        {at: 13.9, text: 'では、英語と日本語の字幕付きで、もう一度聞いてみましょう。'},
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
  const pat = spring({frame: f - p.patternAt, fps, config: {damping: 10, stiffness: 200}});
  const mean = spring({frame: f - p.meaningAt, fps, config: {damping: 12, stiffness: 200}});
  const hlOn = f >= p.hlAt;
  const [pre, post] = p.sentence.split(p.hl);
  const cw = 820;
  const ch = 560;
  if (s < 0.001) return null;
  return (
    <div style={{position: 'absolute', left: p.cx - cw / 2, top: p.cy - ch / 2, width: cw, height: ch, transform: `scale(${s * (p.active ? 1.03 : 0.97)})`, opacity: p.active ? 1 : 0.8}}>
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: C.yellowShade, transform: 'translate(14px, 14px)'}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 48, background: '#FFFFFF', padding: '44px 44px', textAlign: 'center'}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 44, lineHeight: 1.3, color: C.ink}}>
          {pre}
          <span style={{padding: '0 12px', borderRadius: 16, whiteSpace: 'nowrap', background: hlOn ? C.blue : 'transparent', color: hlOn ? '#FFFFFF' : C.ink}}>{p.hl}</span>
          {post}
        </div>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 30, color: C.ink, opacity: 0.7, marginTop: 10}}>{p.ja}</div>
        <div style={{height: 6, borderRadius: 3, background: C.lightGray, margin: '30px 60px 26px'}} />
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 64, color: C.blue, transform: `scale(${pat})`, opacity: Math.min(1, pat * 1.5)}}>{p.pattern}</div>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: p.meaning.length > 14 ? 34 : 42, color: C.ink, marginTop: 14, whiteSpace: 'nowrap', transform: `translateY(${(1 - mean) * 16}px)`, opacity: Math.min(1, mean * 1.5)}}>{p.meaning}</div>
      </div>
    </div>
  );
};

const KeyExpressions: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: D} = useVideoConfig();
  const open = interpolate(f, [0, 16], [0, 2300], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const c1 = rel('C01', W_KEY);
  const c2 = rel('C02', W_KEY);
  const n4 = rel('N04', W_KEY);
  const aActive = f < c2 || (f >= n4 && f < n4 + sec(5.6));
  const bActive = (f >= c2 && f < n4) || (f >= n4 + sec(5.6) && f < n4 + sec(11.4));
  return (
    <AbsoluteFill style={{backgroundColor: C.charcoal}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={H / 2} r={open} fill={C.yellow} />
        <Host x={170} floorY={1000} enter={10} offset={W_KEY.from} w={200} h={270} look={{x: 0.8, y: -0.6}} />
        <rect x={-20} y={1000} width={W + 40} height={100} fill={C.yellowShade} />
      </svg>
      <PatternCard cx={520} cy={460} show={c1 - 4} active={aActive} sentence="I was just about to leave." hl="was just about to" hlAt={c1 + sec(0.2)} ja="ちょうど出かけようとしていた。"
        pattern="I was just about to …" patternAt={n4 + 2} meaning="ちょうど〜しようとしていた" meaningAt={n4 + sec(2.7)} />
      <PatternCard cx={1400} cy={460} show={c2 - 4} active={bActive} sentence="My keys completely slipped my mind." hl="completely slipped my mind" hlAt={c2 + sec(0.6)} ja="鍵のことをすっかり忘れていた。"
        pattern="… slipped my mind" patternAt={n4 + sec(5.6)} meaning="すっかり忘れていた・頭から抜けていた" meaningAt={n4 + sec(7.9)} />
      <NarrationSubs top={1010} start={0} end={c1} chunks={[{at: 0.3, text: 'この場面を英語で振り返ると、こう言えます。'}]} size={40} />
      <NarrationSubs top={1010} start={n4} end={D} chunks={[
        {at: 0, text: '「I was just about to」は、「ちょうど〜しようとしていた」。'},
        {at: 5.6, text: '「completely slipped my mind」は、「すっかり忘れていた・頭から抜けていた」という意味です。'},
        {at: 11.4, text: '日常のやり取りでもよく使えます。'},
        {at: 15.2, text: 'たとえば、こうです。'},
      ]} size={38} width={1700} />
      <BlockWipe mode="in" from={D - 12} />
    </AbsoluteFill>
  );
};

// ---------- 5b. Transfer: the forgotten message ----------
const Message: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const n5 = rel('N05', W_MSG);
  const MF = 820;
  const NOTICE = 10;
  const REPLY = sec(2.2);
  const phoneIn = spring({frame: f - 4, fps, config: {damping: 13, stiffness: 140}});
  const unread = spring({frame: f - NOTICE, fps, config: {damping: 7, stiffness: 240}}) * (f < REPLY ? 1 : 1 - spring({frame: f - REPLY, fps, config: {damping: 14, stiffness: 200}}));
  const replyK = spring({frame: f - REPLY, fps, config: {damping: 9, stiffness: 200}});
  const typing = interpolate(f, [sec(0.9), sec(1.2)], [0, 1], clamp);
  const heroExpr: Expression = f < NOTICE + 6 ? 'look' : f < sec(0.9) ? 'strained' : f < REPLY + 10 ? 'sad' : 'calm';
  const friendExpr: Expression = f < REPLY + 12 ? 'look' : 'happy';
  const friendHop = f >= REPLY + 12 ? landing(f, fps, REPLY + 12, REPLY + 24, MF - 130 - 60, MF - 130, 0.18) : {y: MF - 130, squash: breathe(f, fps, 2, 1)};
  const ph = {x: lerp(1060, 960, phoneIn), y: lerp(900, 430, phoneIn), rotate: lerp(20, -4, phoneIn), scale: 1.55};
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={960} cy={430} r={interpolate(f, [4, 22], [0, 330], {easing: Easing.out(Easing.cubic), ...clamp})} fill="#FFF1A8" />
        <Host x={240} floorY={MF} enter={n5 - 6} offset={W_MSG.from} look={{x: 1, y: -0.2}} />
        <Floor y={MF} />
        <Hero x={560} y={MF - 140} w={300} h={280} expression={heroExpr} look={{x: 1, y: -0.5}} blink={blinkAt(f, 80, 10)}
          squash={breathe(f, fps) * pulse(f, fps, NOTICE, 0.1) * pulse(f, fps, REPLY, 0.06)} rotate={heroExpr === 'strained' ? 4 * Math.sin(f * 1.5) : 0} />
        <Phone {...ph} screen={(sw, sh) => <ChatScreen sw={sw} sh={sh} incoming={2} unread={unread} reply="Sorry!" replyK={replyK} typing={typing} />} />
        <Character shape="circle" w={260} h={260} color={C.blue} shade={C.blueShade} x={1440} y={friendHop.y} squash={friendHop.squash}
          expression={friendExpr} look={{x: -1, y: -0.4}} blink={blinkAt(f, 72, 30)} faceSize={150} />
        {f >= REPLY + 12 && <IconBubble x={1580} y={430} size={120} scale={spring({frame: f - REPLY - 12, fps, config: {damping: 8, stiffness: 220}})} rotate={8}><CommentBubble x={0} y={0} size={70} /></IconBubble>}
      </svg>
      <Captions top={MF + 60} start={0} end={n5} en="Sorry, your message completely slipped my mind." ja="ごめん、メッセージのことすっかり忘れてた。"
        highlight={['completely slipped my mind']} spokenFrames={sec(3.4)} enSize={48} jaSize={34} width={1700} />
      <NarrationSubs top={MF + 70} start={n5} end={D} chunks={[{at: 0, text: 'ごめん、メッセージのことすっかり忘れてた、という意味になります。'}]} size={40} width={1700} />
      <BlockWipe mode="out" from={0} />
      <BlockWipe mode="in" from={D - 12} color={C.purple} />
    </AbsoluteFill>
  );
};

// ---------- 6. Repeat after me ----------
const L1 = 'I was just about to leave.';
const L2 = 'My keys completely slipped my mind.';

const Practice: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const r = (id: string) => rel(id, W_PRAC);
  const PF = 900;
  const land = landing(f, fps, 4, 18, -300, PF - 135);
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
  else if (f < r('P02')) { en = [L1]; ja = 'ちょうど出かけようとしていた。'; key = 'p1'; }
  else if (f < r('N07')) { en = [L2]; ja = '鍵のことをすっかり忘れていた。'; key = 'p2'; }
  else if (f < r('P03')) { en = ['Now say both lines!']; ja = '2文をつなげて言ってみよう'; key = 'both'; }
  else { en = [L1, L2]; ja = ''; key = 'p3'; }
  const keyStart = {title: 0, p1: r('P01'), p2: r('P02'), both: r('N07'), p3: r('P03')}[key]!;
  const txt = spring({frame: f - keyStart, fps, config: {damping: 13, stiffness: 190}});
  const turn = gap ? spring({frame: f - gap.from, fps, config: {damping: 9, stiffness: 200}}) : 0;

  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={PF - 135} r={interpolate(f, [10, 30], [0, 260], clamp)} fill="#FFF1A8" />
        <Host x={300} floorY={PF} enter={8} offset={W_PRAC.from} look={{x: 1, y: 0}} />
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
      <NarrationSubs top={PF + 60} start={r('N07')} end={r('P03')} chunks={[{at: 0, text: '次は、2文をつなげて言ってみましょう。'}]} size={40} />
      <BlockWipe mode="out" from={0} color={C.purple} />
      <BlockWipe mode="in" from={D - 12} color={C.green} />
    </AbsoluteFill>
  );
};

// ---------- 7. Viewer prompt + Owl Listen outro ----------
const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const e1 = rel('E01', W_END);
  const CF = 760;
  const card = spring({frame: f - 8, fps, config: {damping: 11, stiffness: 170}});
  const ask = spring({frame: f - sec(7.3), fps, config: {damping: 10, stiffness: 190}});
  const hl = f >= e1 + sec(2.2);
  const blank = 0.55 + 0.45 * Math.abs(Math.sin(f / 9));
  const OWL = 250;
  const owlY = CF - OWL * 0.54;
  const owlLand = landing(f, fps, e1 - 10, e1 + 6, -300, owlY);
  const wave = f > e1 + 10 && f < e1 + 60 ? 25 * Math.sin((f - e1 - 10) / 3) : 0;
  const arc = interpolate(f, [D - sec(3), D - sec(2.5)], [0, 1], clamp);
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Door x={1680} floorY={CF} w={240} h={340} open={0.25} />
        <Host x={300} floorY={CF + 40} enter={6} offset={W_END.from} look={{x: 1, y: -0.5}} />
        <Hero x={960} y={CF - 130} w={300} h={260} shoes={1} bag={1} expression={f < e1 ? 'calm' : 'happy'} look={{x: 0, y: -0.4}}
          squash={breathe(f, fps) * pulse(f, fps, e1 + sec(2.2), 0.08)} blink={blinkAt(f, 80, 5)} />
        {f >= e1 - 10 && <Owl x={1300} y={owlLand.y} size={OWL} squash={f < e1 + 30 ? owlLand.squash : breathe(f, fps, 2, 1)} blink={blinkAt(f, 70, 33)} wing={wave} look={{x: -0.8, y: -0.3}} happy={f > e1 + sec(2.2)} />}
        <rect x={-20} y={CF} width={W + 40} height={36} rx={10} fill={C.lightGray} />
        <rect x={-20} y={CF + 36} width={W + 40} height={H} fill={C.charcoal} />
      </svg>
      <div style={{position: 'absolute', left: 210, top: 60, width: 1500, padding: '34px 40px', borderRadius: 44, background: '#FFFFFF', boxShadow: `12px 12px 0 ${C.lightGray}`, textAlign: 'center',
        transform: `scale(${card})`, opacity: Math.min(1, card * 1.5)}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 62, color: C.ink, lineHeight: 1.3, whiteSpace: 'nowrap'}}>
          I was just about to{' '}
          <span style={{display: 'inline-block', width: 240, borderBottom: `10px solid ${C.blue}`, opacity: blank}}>&nbsp;</span> ,
          <div>
            <span style={{padding: '0 12px', borderRadius: 16, background: hl ? C.blue : 'transparent', color: hl ? '#FFFFFF' : C.ink}}>when I remembered…</span>
          </div>
        </div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: 16, marginTop: 22, fontFamily: FONT_JA, fontWeight: 900, fontSize: 42, color: C.blue, transform: `scale(${ask})`, opacity: Math.min(1, ask * 1.5)}}>
          <svg width={70} height={70} viewBox="-35 -35 70 70"><CommentBubble x={0} y={0} size={64} /></svg>
          コメント欄で文を完成させてね！
        </div>
      </div>
      <NarrationSubs top={CF + 120} start={0} end={e1} color="#FFFFFF" chunks={[
        {at: 0.2, text: '最後に、あなたならどう続けますか？'},
        {at: 3.55, text: '家を出る直前や、寝る直前の場面を思い浮かべて、'},
        {at: 7.3, text: 'コメント欄で文を完成させてみてください。'},
      ]} size={42} />
      {arc > 0 && (
        <div style={{position: 'absolute', left: 1300 - 220, top: CF + 60, width: 440, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 56, letterSpacing: 2, color: C.owlTan,
          opacity: arc, transform: `translateY(${(1 - arc) * 20}px)`}}>Owl Listen</div>
      )}
      <BlockWipe mode="out" from={0} color={C.green} />
    </AbsoluteFill>
  );
};

export const Ep03AboutToLeaveYT: React.FC = () => {
  const blockA = {from: W_A[0].from, durationInFrames: W_A[3].from + W_A[3].durationInFrames - W_A[0].from};
  const blockB = {from: W_B[0].from, durationInFrames: W_B[3].from + W_B[3].durationInFrames - W_B[0].from};
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <Sequence {...W_OPEN}><Opening /></Sequence>
      <Sequence {...blockA}><StoryBlock wins={W_A} captions={false} label="Listen" listen /></Sequence>
      <Sequence {...W_ANS}><Answer /></Sequence>
      <Sequence {...blockB}><StoryBlock wins={W_B} captions label="English + 日本語" fillOut wipeOut /></Sequence>
      <Sequence {...W_KEY}><KeyExpressions /></Sequence>
      <Sequence {...W_MSG}><Message /></Sequence>
      <Sequence {...W_PRAC}><Practice /></Sequence>
      <Sequence {...W_END}><Closing /></Sequence>
      <VoiceTrack tl={tl} fps={FPS} />
    </AbsoluteFill>
  );
};
