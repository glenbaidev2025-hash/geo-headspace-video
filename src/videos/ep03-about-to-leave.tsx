import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {Owl} from '../Owl';
import {C, FONT_EN, FONT_JA} from '../theme';
import {lineStart, sceneWindow, timelineFrames, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {ArcText} from '../lib/ArcText';
import {Captions} from '../lib/Captions';
import {blinkAt, breathe, landing, pulse} from '../lib/motion';
import {Bag, Door, IconBubble, KeyIcon, PhoneIcon, Shoe, SweatDrop, WalletIcon} from '../props/Home';
import timeline from '../../public/audio/ep03-about-to-leave/timeline.json';

// Episode 3 · "I Was Just About to Leave" — TikTok 9:16, EN voice (Sarah), EN/JA captions, Owl Listen outro.
const tl = timeline as VoiceTimeline;
const FPS = 30;
const W = 1080;
const H = 1920;
export const EP03_FRAMES = timelineFrames(tl, FPS);

const S1 = sceneWindow(tl, FPS, ['S01']);
const S2 = sceneWindow(tl, FPS, ['S02']);
const S3 = sceneWindow(tl, FPS, ['S03']);
const S4 = sceneWindow(tl, FPS, ['S04']);
const S5 = sceneWindow(tl, FPS, ['S05', 'S06']);
const rel = (id: string, w: {from: number}) => lineStart(tl, FPS, id) - w.from;
const sec = (s: number) => Math.round(s * FPS);

// Layout
const FLOOR = 1240;
const HERO = {w: 380, h: 340};
const HERO_Y = FLOOR - HERO.h / 2;
const X_START = 340;
const X_DOOR = 420; // hero position after walking to the door
const DOOR = {x: 830, w: 340, h: 620};
const CAPTION_TOP = 1350;

// ---------- shared pieces ----------
const Hallway: React.FC<{open?: number}> = ({open = 0}) => (
  <g>
    <Door x={DOOR.x} floorY={FLOOR} w={DOOR.w} h={DOOR.h} open={open} />
    {/* coat hook + mat */}
    <rect x={120} y={560} width={150} height={20} rx={10} fill={C.lightGray} />
    {[150, 210].map((x) => <circle key={x} cx={x} cy={596} r={14} fill={C.grayShade} />)}
    <rect x={-20} y={FLOOR} width={W + 40} height={70} fill={C.lightGray} />
    <rect x={-20} y={FLOOR + 70} width={W + 40} height={H - FLOOR} fill={C.grayShade} />
    <rect x={DOOR.x - 200} y={FLOOR - 6} width={400} height={22} rx={11} fill={C.orange} opacity={0.85} />
  </g>
);

/** Hero with shoes on its base and (optionally) a bag on its side. */
const Hero: React.FC<{x: number; y?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; shoes?: number; bag?: number; w?: number; h?: number}> = ({
  x, y = HERO_Y, w = HERO.w, h = HERO.h, shoes = 1, bag = 1, ...p
}) => {
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

// ---------- S01: shoes on, bag grabbed ----------
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const land = landing(f, fps, 0, 12, HERO_Y - 600, HERO_Y);
  const shoeL = spring({frame: f - 22, fps, config: {damping: 12, stiffness: 180}});
  const shoeR = spring({frame: f - 30, fps, config: {damping: 12, stiffness: 180}});
  const bagK = spring({frame: f - sec(1.55), fps, config: {damping: 9, stiffness: 180}});
  const hook = spring({frame: f - 2, fps, config: {damping: 12, stiffness: 160}});
  const bottom = HERO_Y + HERO.h / 2;
  // shoes hop in from the sides, then the hero "wears" them
  const shoesOn = f >= 40;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway />
        <Hero x={X_START} y={land.y} squash={f < 30 ? land.squash : breathe(f, fps) * pulse(f, fps, 40, 0.1) * pulse(f, fps, sec(1.55) + 6, 0.08)} expression="happy"
          look={{x: 0, y: 0.6}} blink={blinkAt(f, 80, 50)} shoes={shoesOn ? 1 : 0} bag={bagK} />
        {!shoesOn && (
          <g>
            <Shoe x={interpolate(shoeL, [0, 1], [-120, X_START - 95])} y={bottom + 4 - 120 * Math.sin(shoeL * Math.PI)} size={HERO.w * 0.36} flip rotate={(1 - shoeL) * -30} />
            <Shoe x={interpolate(shoeR, [0, 1], [W + 120, X_START + 95])} y={bottom + 4 - 120 * Math.sin(shoeR * Math.PI)} size={HERO.w * 0.36} rotate={(1 - shoeR) * 30} />
          </g>
        )}
      </svg>
      <div style={{position: 'absolute', top: 210, width: W, textAlign: 'center', fontFamily: FONT_JA, fontWeight: 900, fontSize: 84, color: C.ink, transform: `scale(${hook})`, opacity: Math.min(1, hook * 1.4)}}>
        ちょうど出かけようと
        <br />
        した瞬間…
      </div>
      <Captions top={CAPTION_TOP} start={0} en="I put on my shoes and grabbed my bag." ja="靴を履いて、カバンをつかんだ。" />
    </AbsoluteFill>
  );
};

// ---------- S02: opens the front door ----------
const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const walk = spring({frame: f, fps, config: {damping: 16, stiffness: 120}});
  const x = interpolate(walk, [0, 1], [X_START, X_DOOR]);
  const hop = Math.abs(Math.sin(walk * Math.PI * 2)) * 30 * (1 - walk);
  const open = spring({frame: f - 22, fps, config: {damping: 13, stiffness: 110}});
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway open={open} />
        <Hero x={x} y={HERO_Y - hop} expression={open > 0.5 ? 'happy' : 'look'} look={{x: 1, y: -0.2}} squash={breathe(f, fps) * pulse(f, fps, 22, 0.06)} rotate={(1 - walk) * 4 * Math.sin(f / 2)} blink={blinkAt(f, 70, 30)} />
      </svg>
      <Captions top={CAPTION_TOP} start={0} en="I opened the front door." ja="玄関のドアを開けた。" />
    </AbsoluteFill>
  );
};

// ---------- S03 + S04 share the pocket-check bubbles ----------
const KEY_POS = {x: 200, y: 690};
const WALLET_POS = {x: 450, y: 600};
const PHONE_POS = {x: 330, y: 380};

const Bubbles: React.FC<{keyAt: number; walletAt: number; phoneAt?: number; wobble?: boolean}> = ({keyAt, walletAt, phoneAt, wobble}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const k = (at: number) => spring({frame: f - at, fps, config: {damping: 9, stiffness: 200}});
  const badge = (at: number) => spring({frame: f - at - 8, fps, config: {damping: 7, stiffness: 260}});
  const w = (i: number) => (wobble ? 5 * Math.sin(f / 5 + i) : 2 * Math.sin(f / 12 + i));
  return (
    <g>
      {f >= keyAt && <IconBubble x={KEY_POS.x} y={KEY_POS.y} size={190} scale={k(keyAt)} rotate={w(0)} badge="x" badgeK={badge(keyAt)}><KeyIcon s={120} /></IconBubble>}
      {f >= walletAt && <IconBubble x={WALLET_POS.x} y={WALLET_POS.y} size={190} scale={k(walletAt)} rotate={w(1)} badge="x" badgeK={badge(walletAt)}><WalletIcon s={110} /></IconBubble>}
      {phoneAt !== undefined && f >= phoneAt && <IconBubble x={PHONE_POS.x} y={PHONE_POS.y} size={240} scale={k(phoneAt) * 1.05} rotate={w(2)} badge="?" badgeK={badge(phoneAt)}><PhoneIcon s={150} /></IconBubble>}
    </g>
  );
};

const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const PAT = sec(1.95);
  const PAT_END = sec(3.55);
  const KEY = sec(4.2);
  const WALLET = sec(5.5);
  const patting = f >= PAT && f < PAT_END;
  const freeze = f < 6 ? 1 - 0.1 * Math.sin((f / 6) * Math.PI) : 1;
  const expr: Expression = f < KEY ? 'look' : 'strained';
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway open={1} />
        <Hero x={X_DOOR} expression={expr} look={patting ? {x: Math.sin(f / 3), y: 1} : f < PAT ? {x: 1, y: -0.2} : {x: -0.6, y: -0.8}}
          rotate={patting ? 7 * Math.sin(f / 2.5) : 0} squash={freeze * (patting ? 1 + 0.05 * Math.abs(Math.sin(f / 2.5)) : breathe(f, fps)) * pulse(f, fps, KEY, 0.08) * pulse(f, fps, WALLET, 0.08)}
          blink={blinkAt(f, 90, 10)} />
        <Bubbles keyAt={KEY} walletAt={WALLET} />
      </svg>
      <Captions top={CAPTION_TOP} start={0} end={sec(4.05)} en="Then I stopped and checked my pockets." ja="その瞬間止まってポケットを確認。" />
      <Captions top={CAPTION_TOP} start={sec(4.05)} en="No keys. No wallet." ja="鍵がない。財布もない。" enSize={66} />
    </AbsoluteFill>
  );
};

// ---------- S04: Wait. Where is my phone? ----------
const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const {fps, durationInFrames: D} = useVideoConfig();
  const Q = sec(1.88);
  const shock = spring({frame: f - Q, fps, config: {damping: 6, stiffness: 240}});
  const sweatY = interpolate(f, [Q + 4, Q + 40], [0, 80], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const fill = interpolate(f, [D - 14, D], [0, 2400], {easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const heroTop = HERO_Y - HERO.h / 2;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Hallway open={1} />
        <Hero x={X_DOOR} expression={f < Q ? 'look' : 'strained'} look={f < Q ? {x: 0, y: -1} : {x: 0, y: 0}}
          rotate={f >= Q ? 5 * Math.sin(f * 1.7) : 0} squash={f < 12 ? 1 - 0.1 * Math.sin((f / 12) * Math.PI) : pulse(f, fps, Q, 0.16)}
          blink={f >= 2 && f < 9 ? 1 - Math.abs(f - 5.5) / 3.5 : 0} />
        <Bubbles keyAt={-30} walletAt={-30} phoneAt={Q - 2} wobble={f >= Q} />
        {f >= Q && <SweatDrop x={X_DOOR + HERO.w * 0.42} y={heroTop + 40 + sweatY} size={70} opacity={interpolate(sweatY, [60, 80], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} />}
        {f >= Q && (
          <text x={X_DOOR + 150} y={heroTop - 60} transform={`rotate(10 ${X_DOOR + 150} ${heroTop - 60})`} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={150 * shock} fill={C.blue}>?!</text>
        )}
        <circle cx={DOOR.x} cy={FLOOR - DOOR.h / 2} r={fill} fill={C.purple} />
      </svg>
      {fill < 300 && (
        <>
          <Captions top={CAPTION_TOP} start={0} end={Q - 3} en="Wait." ja="あれ？" jaDelay={12} enSize={72} jaSize={54} />
          <Captions top={CAPTION_TOP} start={Q} en="Where is my phone?" ja="スマホはどこ？" jaDelay={14} enSize={72} jaSize={54} />
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- S05 + S06: Owl Listen takeaway ----------
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const B = rel('S06', S5);
  const a5 = rel('S05', S5);
  const GROUND = 1180;
  const open = interpolate(f, [0, 16], [0, 1500], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const hw = 300;
  const hh = 270;
  const heroLand = landing(f, fps, 6, 20, -200, GROUND - hh / 2);
  const OWL = 330;
  const owlY = GROUND - OWL * 0.54;
  const owlLand = landing(f, fps, 14, 30, -300, owlY);
  const wave = f > 34 && f < 70 ? 25 * Math.sin((f - 34) / 3) : 0;
  const chuckle = pulse(f, fps, B + sec(3.85), 0.1) * pulse(f, fps, B + sec(3.85) + 7, 0.08);
  // a key floats above the hero and slips away during "completely slipped my mind"
  const keyIn = spring({frame: f - (B + 6), fps, config: {damping: 10, stiffness: 180}});
  const slip = interpolate(f, [B + sec(1.6), B + sec(2.6)], [0, 1], {easing: Easing.in(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const arc1 = interpolate(f, [B - 8, B], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <AbsoluteFill style={{backgroundColor: C.purple}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={540} cy={900} r={open} fill={C.yellow} />
        <rect x={-20} y={GROUND} width={W + 40} height={H} fill={C.yellowShade} opacity={open > 1200 ? 1 : 0} />
        <circle cx={540} cy={GROUND - 170} r={interpolate(f, [16, 40], [0, 400], {easing: Easing.out(Easing.cubic), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})} fill="#FFE45C" />
        {f < B && (
          <g opacity={arc1}>
            <ArcText text="I was just about to …" cx={540} cy={GROUND - 170} r={420} start={a5 + 4} fontSize={64} spacingDeg={5.2} color={C.night} fontFamily={FONT_EN} stagger={1} />
          </g>
        )}
        {f >= B - 2 && <ArcText text="… slipped my mind" cx={540} cy={GROUND - 170} r={420} start={B} fontSize={64} spacingDeg={5.2} color={C.blue} fontFamily={FONT_EN} stagger={1} />}
        <Hero x={360} y={heroLand.y} w={hw} h={hh} shoes={1} bag={1} expression={f < B ? 'calm' : f < B + sec(2.6) ? 'look' : 'happy'}
          look={f < B ? {x: 0, y: 0} : {x: -1, y: -1}} squash={f < 34 ? heroLand.squash : breathe(f, fps) * chuckle} blink={blinkAt(f, 75, 10)} />
        {f >= B + 6 && (
          <IconBubble x={360 - slip * 520} y={GROUND - hh - 140 - slip * 120} size={170} scale={keyIn * (1 - slip * 0.3)} rotate={-slip * 60}>
            <KeyIcon s={110} />
          </IconBubble>
        )}
        <Owl x={740} y={owlLand.y} size={OWL} squash={f < 44 ? owlLand.squash : breathe(f, fps, 2, 1)} blink={blinkAt(f, 70, 33)} wing={wave}
          look={f < B ? {x: -0.8, y: 0.2} : {x: -1, y: -0.6}} happy={f >= B + sec(3.6)} />
      </svg>
      <Captions top={1300} start={a5 + 8} end={B} en="I was just about to leave." ja="ちょうど出かけようとしていたのに。" highlight={['was just about to']} spokenFrames={sec(2.3)} hlBg={C.blue} />
      <Captions top={1300} start={B} en="My keys completely slipped my mind." ja="鍵のことをすっかり忘れていた。" highlight={['completely slipped my mind']} spokenFrames={sec(3.3)} hlBg={C.blue} />
      <div style={{position: 'absolute', top: 160, width: W, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, fontSize: 58, color: C.owlBrownShade, letterSpacing: 2,
        opacity: interpolate(f, [30, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}}>
        Owl Listen
      </div>
    </AbsoluteFill>
  );
};

export const Ep03AboutToLeave: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.offWhite}}>
    <Sequence {...S1}><Scene1 /></Sequence>
    <Sequence {...S2}><Scene2 /></Sequence>
    <Sequence {...S3}><Scene3 /></Sequence>
    <Sequence {...S4}><Scene4 /></Sequence>
    <Sequence {...S5}><Scene5 /></Sequence>
    <VoiceTrack tl={tl} fps={FPS} />
  </AbsoluteFill>
);
