import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character} from '../Character';
import {Expression} from '../Face';
import {Owl} from '../Owl';
import {C, FONT_EN, FONT_JA} from '../theme';
import {sceneWindow, talkLevel, timelineFrames, VoiceEnvelope, VoiceTimeline, VoiceTrack} from '../lib/voice';
import {Captions} from '../lib/Captions';
import {TopBanner} from '../lib/TopBanner';
import {Waveform} from '../lib/Waveform';
import {blinkAt, breathe, darting, landing, pulse} from '../lib/motion';
import {SpeechBubble} from '../props/Cafe';
import {MarkBadge} from '../props/Marks';
import {Headphones} from '../props/Icons';
import {IconBubble, SweatDrop} from '../props/Home';
import {ClockFace} from '../props/Phone';
import {Burger, Ramen, Sushi} from '../props/Food';
import timeline from '../../public/audio/ep05-what-should-i-eat/timeline.json';
import envelope from '../../public/audio/ep05-what-should-i-eat/envelope.json';

// Episode 5 · "What Should I Eat?" — TikTok v2.1 hook cut (Day 2/30), 9:16.
// All lines = Sarah; S04 replays the exact S02 clip for the "aha" moment.
const tl = timeline as VoiceTimeline;
const env = envelope as VoiceEnvelope;
const FPS = 30;
const W = 1080;
const H = 1920;
export const EP05_FRAMES = timelineFrames(tl, FPS);
const sec = (s: number) => Math.round(s * FPS);

const S1 = sceneWindow(tl, FPS, ['S01']);
const S2 = sceneWindow(tl, FPS, ['S02']);
const S3 = sceneWindow(tl, FPS, ['S03']);
const S4all = sceneWindow(tl, FPS, ['S04']);
const S4dur = sec(tl.segments.find((s) => s.id === 'S04')!.duration_s) + 12;
const S4 = {from: S4all.from, durationInFrames: S4dur};
const S5 = {from: S4all.from + S4dur, durationInFrames: EP05_FRAMES - (S4all.from + S4dur)};

const talk = (g: number, id: string) => talkLevel(tl, env, FPS, g, [id]);

// Layout (safe areas: banner 13–26%, stage 28–60%, captions 62–76%, nothing below 78%)
const FLOOR = 1150;
const CAP_TOP = 1200;

// ---------- shared pieces ----------
const Hero: React.FC<{x: number; y: number; w?: number; h?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; talk?: number; phones?: boolean}> = ({
  x, y, w = 300, h = 270, phones, ...p
}) => {
  const sq = p.squash ?? 1;
  const top = y + h / 2 - h / sq;
  return (
    <g>
      <Character shape="roundRect" w={w} h={h} color={C.yellow} shade={C.yellowShade} x={x} y={y} faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />
      {phones && (
        <g transform={`rotate(${p.rotate ?? 0} ${x} ${y + h / 2})`}>
          <Headphones x={x} y={top + h * 0.2} size={w * 1.12} color={C.owlGreen} />
        </g>
      )}
    </g>
  );
};

const QMarks: React.FC<{f: number; at: number[]; color: string}> = ({f, at, color}) => {
  const {fps} = useVideoConfig();
  const spots = [{x: 290, y: 640, r: -14}, {x: 800, y: 600, r: 12}, {x: 860, y: 790, r: 18}];
  return (
    <g>
      {at.map((a, i) => {
        if (f < a) return null;
        const k = spring({frame: f - a, fps, config: {damping: 8, stiffness: 220}});
        const s = spots[i % spots.length];
        const bob = 10 * Math.sin((f - a) / 7 + i);
        return <text key={i} x={s.x} y={s.y + bob} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={110 * k} fill={color} transform={`rotate(${s.r} ${s.x} ${s.y})`}>?</text>;
      })}
    </g>
  );
};

const circleWipe = (f: number, cx: number, cy: number, color: string, frames = 12) => (
  <circle cx={cx} cy={cy} r={interpolate(f, [0, frames], [0, 2300], {easing: Easing.in(Easing.cubic), extrapolateRight: 'clamp'})} fill={color} />
);

// ---------- S01: 8 p.m., starving, three food bubbles crowd the frame ----------
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const V = sec(0.5); // voice starts after the lead-in
  const GROWL = V + sec(1.9); // "STARVING"
  const FOODS = [V + sec(2.95), V + sec(3.55), V + sec(4.25)]; // ramen, sushi, burger
  const STUCK = FOODS[2] + 18;
  const heroY = FLOOR - 135;
  const clockP = 1; // 8:00 from the first frame (cover)
  const clockK = pulse(f, fps, 6, 0.1);
  const growl = f >= GROWL && f < GROWL + 30;
  const growlK = spring({frame: f - GROWL, fps, config: {damping: 9, stiffness: 240}});
  const foodK = FOODS.map((a, i) => 0.62 + 0.03 * Math.sin(f / 8 + i * 2) + (f < a ? 0 : 0.38 * spring({frame: f - a, fps, config: {damping: 8, stiffness: 230}})));
  // bubbles jostle once all three are out (crowded = 困境)
  const jostle = (i: number) => (f > STUCK ? 6 * Math.sin((f - STUCK) / 5 + i * 2) : 0);
  const bubbles = [
    {x: 770, y: 650, size: 270, node: () => <Ramen x={0} y={18} size={190} steam={(f % 45) / 45} />},
    {x: 590, y: 900, size: 220, node: () => <Sushi x={0} y={-6} size={150} rotate={-8} />},
    {x: 900, y: 930, size: 230, node: () => <Burger x={0} y={0} size={160} rotate={6} />},
  ];
  const lookAt = darting(f, fps, [{x: 0.9, y: -0.7}, {x: 0.6, y: 0.1}, {x: 1, y: 0.3}], 9);
  let expr: Expression = 'look';
  let look = {x: -0.6, y: -0.9}; // looking at the clock
  if (f >= GROWL && f < FOODS[0]) {
    expr = 'sad';
  } else if (f >= FOODS[0] && f < STUCK) {
    look = FOODS.reduce((acc, a, i) => (f >= a ? [{x: 0.9, y: -0.7}, {x: 0.5, y: 0}, {x: 1, y: 0.2}][i] : acc), look);
  } else if (f >= STUCK) {
    expr = 'strained';
    look = lookAt;
  }
  const sweatY = f >= STUCK ? ((f - STUCK) * 3) % 70 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <ClockFace x={190} y={640} size={190} progress={clockP} turns={10} scale={clockK} />
        <text x={190} y={790} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={44} fill={C.ink}>8:00 PM</text>
        <rect x={-20} y={FLOOR} width={W + 40} height={28} fill={C.lightGray} />
        {bubbles.map((b, i) => (
          (
            <IconBubble key={i} x={b.x + jostle(i)} y={b.y + jostle(i + 1)} size={b.size} scale={foodK[i]} rotate={f > STUCK ? 3 * Math.sin((f - STUCK) / 6 + i) : 0}>
              {b.node()}
            </IconBubble>
          )
        ))}
        <Hero x={300} y={heroY} expression={expr} look={look} rotate={growl ? 4 * Math.sin(f * 1.8) : f >= STUCK ? 2 * Math.sin(f / 3) : 0}
          squash={breathe(f, fps) * pulse(f, fps, GROWL, 0.16) * (f >= STUCK ? pulse(f, fps, STUCK, 0.1) : 1)} blink={blinkAt(f, 80, 20)} />
        {f >= GROWL && f < GROWL + 40 && (
          <text x={330} y={heroY + 40} textAnchor="middle" fontFamily={FONT_JA} fontWeight={900} fontSize={64 * growlK} fill={C.orange}
            transform={`rotate(-10 330 ${heroY + 40}) translate(${-120 - (f - GROWL) * 1.5} ${-20})`} opacity={interpolate(f, [GROWL + 28, GROWL + 40], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>
            グゥ〜
          </text>
        )}
        {f >= STUCK && <SweatDrop x={440} y={heroY - 120 + sweatY} size={56} opacity={interpolate(sweatY, [50, 70], [1, 0], {extrapolateLeft: 'clamp'})} />}
      </svg>
      <div style={{position: 'absolute', top: CAP_TOP + 10, width: W, textAlign: 'center', fontFamily: FONT_JA, fontWeight: 900, fontSize: 60, lineHeight: 1.3, color: C.ink}}>
        夜8時、お腹<span style={{color: C.orange}}>ペコペコ</span>で
        <br />
        メニューが<span style={{color: C.red}}>決められない</span>時…
      </div>
    </AbsoluteFill>
  );
};

// ---------- S02 / S04: listening stage (blue) ----------
const ListenStage: React.FC<{segId: string; from: number; aha?: number; reveal?: boolean; wipeFrom: {x: number; y: number}; wipeUnder: string}> = ({segId, from, aha, reveal, wipeFrom, wipeUnder}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = f + from;
  const lv = talk(g, segId);
  const heroY = 830;
  const spokenEnd = sec(tl.segments.find((s) => s.id === segId)!.duration_s);
  const after = f > spokenEnd + 4;
  const isAha = aha !== undefined && f >= aha;
  const ahaK = aha !== undefined ? spring({frame: f - aha, fps, config: {damping: 7, stiffness: 240}}) : 0;
  const pupils = darting(f, fps, [{x: -0.8, y: -0.5}, {x: 0.8, y: -0.6}, {x: 0, y: 0.3}, {x: 0.6, y: 0.4}], 13);
  const expr: Expression = isAha ? 'happy' : after && !reveal ? 'strained' : 'look';
  return (
    <AbsoluteFill style={{backgroundColor: wipeUnder}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {circleWipe(f, wipeFrom.x, wipeFrom.y, C.blue)}
        {f >= 8 && (
          <>
            <circle cx={540} cy={heroY} r={260 + 10 * Math.sin(f / 9)} fill={C.lightBlue} opacity={0.5} />
            {isAha && (
              <g transform={`translate(540 ${heroY}) rotate(${f * 0.8}) scale(${ahaK})`}>
                {Array.from({length: 12}).map((_, i) => (
                  <rect key={i} x={-13} y={-330} width={26} height={70} rx={14} fill={C.yellow} transform={`rotate(${i * 30})`} />
                ))}
              </g>
            )}
            <Hero x={540} y={heroY} w={340} h={300} phones expression={expr} look={isAha ? {x: 0, y: 0} : pupils}
              rotate={isAha ? 0 : 6 * Math.sin(f / 10)} squash={breathe(f, fps) * (aha !== undefined ? pulse(f, fps, aha, 0.16) : 1) * (1 + 0.04 * lv)} blink={blinkAt(f, 75, 10)} />
            {!reveal && <QMarks f={f} at={[18, 44, 72]} color="#FFFFFF" />}
            {isAha && <text x={800} y={740} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={150 * ahaK} fill={C.yellow} transform="rotate(12 800 740)">!</text>}
            <Waveform x={540} y={1080} w={880} h={150} f={f} level={lv} color={isAha ? C.yellow : '#FFFFFF'} />
          </>
        )}
      </svg>
      {!reveal && f >= 4 && <MaskedCaption f={f} line2At={sec(1.9)} after={after} />}
      {reveal && (
        <Captions top={CAP_TOP - 10} start={2} en="I can't make up my mind. Actually, I'm really craving ramen tonight." ja="決められない。実は今夜、無性にラーメンが食べたいんだよね。"
          highlight={['make up my mind', 'craving']} spokenFrames={spokenEnd} color="#FFFFFF" hlBg={C.yellow} hlColor={C.ink} enSize={54} jaSize={34} width={1000} />
      )}
    </AbsoluteFill>
  );
};

const Mask: React.FC<{f: number; after: boolean}> = ({f, after}) => {
  const jit = after ? 1 + 0.06 * Math.sin(f / 3) : 1 + 0.03 * Math.sin(f * 1.3);
  return (
    <span style={{display: 'inline-block', padding: '0 24px', margin: '0 6px', borderRadius: 20, background: C.red, boxShadow: `8px 8px 0 ${C.redShade}`, transform: `scale(${jit})`}}>???</span>
  );
};

const MaskedCaption: React.FC<{f: number; line2At: number; after: boolean}> = ({f, line2At, after}) => {
  const {fps} = useVideoConfig();
  const k = spring({frame: f - 4, fps, config: {damping: 14, stiffness: 200}});
  const k2 = spring({frame: f - line2At, fps, config: {damping: 14, stiffness: 200}});
  return (
    <div style={{position: 'absolute', top: CAP_TOP, width: W, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, color: '#FFFFFF'}}>
      <div style={{fontSize: 68, opacity: Math.min(1, k * 1.4), transform: `scale(${0.9 + 0.1 * k})`}}>
        I can't <Mask f={f} after={after} />.
      </div>
      {f >= line2At && (
        <div style={{marginTop: 30, fontSize: 56, opacity: Math.min(1, k2 * 1.4), transform: `translateY(${(1 - k2) * 20}px)`}}>
          Actually, I'm really <Mask f={f + 7} after={after} /> ramen.
        </div>
      )}
    </div>
  );
};

const Scene2: React.FC = () => <ListenStage segId="S02" from={S2.from} wipeFrom={{x: 300, y: FLOOR - 135}} wipeUnder={C.offWhite} />;
const Scene4: React.FC = () => <ListenStage segId="S04" from={S4.from} aha={30} reveal wipeFrom={{x: 790, y: FLOOR - 135}} wipeUnder={C.offWhite} />;

// ---------- S03: answer — ✗ "I want to eat ramen." vs ✓ "I'm craving ramen." ----------
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = f + S3.from;
  const lv = talk(g, 'S03');
  const push = interpolate(f, [0, 10], [H, 0], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const leftK = spring({frame: f - 8, fps, config: {damping: 10, stiffness: 220}});
  const cross = interpolate(f, [18, 28], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crossK = spring({frame: f - 18, fps, config: {damping: 6, stiffness: 300}});
  const rightK = spring({frame: f - 14, fps, config: {damping: 10, stiffness: 220}});
  const HL = 24; // "craving"
  const check = interpolate(f, [HL, HL + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const checkK = spring({frame: f - HL, fps, config: {damping: 6, stiffness: 300}});
  const hlK = spring({frame: f - HL, fps, config: {damping: 12, stiffness: 220}});
  const dim = interpolate(f, [46, 56], [1, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const leftY = FLOOR - 115;
  const heroY = FLOOR - 135;
  const PILL = sec(2.4); // "I can't make up my mind"
  const pillK = spring({frame: f - PILL, fps, config: {damping: 11, stiffness: 220}});
  const land = landing(f, fps, 10, 22, heroY - 500, heroY);
  const landL = landing(f, fps, 4, 16, leftY - 500, leftY);
  return (
    <AbsoluteFill style={{backgroundColor: C.blue}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(0 ${push})`}>
          <rect x={0} y={0} width={W} height={H} fill={C.offWhite} />
          <rect x={-20} y={FLOOR} width={W + 40} height={28} fill={C.lightGray} />
          <g opacity={dim}>
            <Character shape="triangle" w={250} h={230} color={C.pink} shade={C.pinkShade} x={270} y={landL.y} expression={f < 20 ? 'look' : 'sleepy'}
              look={{x: 0.6, y: -0.6}} squash={f < 30 ? landL.squash * pulse(f, fps, 20, 0.1) : breathe(f, fps, 2.2, 1)} blink={blinkAt(f, 80, 30)} />
            <SpeechBubble x={270} y={720} w={440} h={250} tx={270} ty={900} scale={leftK} />
            {f >= 18 && <MarkBadge kind="cross" x={445} y={610} size={120} draw={cross} scale={crossK} rotate={-8} />}
          </g>
          <Hero x={790} y={land.y} expression="happy" talk={lv} look={{x: -0.2, y: -0.5}} squash={f < 34 ? land.squash : breathe(f, fps) * pulse(f, fps, HL + 8, 0.08)} blink={blinkAt(f, 90, 40)} />
          <SpeechBubble x={790} y={720} w={500} h={250} tx={790} ty={872} scale={rightK} color="#FFFFFF" shade={C.green} />
          {f >= HL && <MarkBadge kind="check" x={1000} y={606} size={130} draw={check} scale={checkK} rotate={8} />}
          {f >= HL + 6 && <Ramen x={1000} y={980} size={130} steam={(f % 45) / 45} rotate={6 * Math.sin(f / 8)} />}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 50, top: 616 + push, width: 440, textAlign: 'center', opacity: dim * Math.min(1, leftK * 1.4), transform: `scale(${leftK})`}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 48, color: C.ink, lineHeight: 1.2}}>I want to</div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 48, color: C.ink, lineHeight: 1.2}}>eat ramen.</div>
        <div style={{marginTop: 10, fontFamily: FONT_JA, fontWeight: 900, fontSize: 32, color: C.red}}>少し普通…</div>
      </div>
      <div style={{position: 'absolute', left: 540, top: 606 + push, width: 500, textAlign: 'center', opacity: Math.min(1, rightK * 1.4), transform: `scale(${rightK})`}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 50, color: C.ink, lineHeight: 1.3}}>
          I'm{' '}
          <span style={{display: 'inline-block', padding: '0 12px', borderRadius: 14, background: hlK > 0.02 ? C.green : 'transparent', color: hlK > 0.02 ? '#FFFFFF' : C.ink, transform: `scale(${1 + 0.1 * Math.sin(Math.min(1, hlK) * Math.PI)})`}}>craving</span>
        </div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 50, color: C.ink, lineHeight: 1.3}}>ramen.</div>
        <div style={{marginTop: 4, fontFamily: FONT_JA, fontWeight: 900, fontSize: 32, color: C.green}}>めっちゃ・無性に食べたい！</div>
      </div>
      {push < 40 && (
        <>
          <Captions top={CAP_TOP} start={6} en="I'm craving ramen. I can't make up my mind." ja="無性にラーメンが食べたい！ ／ 決められない！" highlight={['craving', 'make up my mind']} spokenFrames={110}
            hlBg={C.green} enSize={56} jaSize={40} width={1000} />
          {f >= PILL && (
            <div style={{position: 'absolute', top: 1424, width: W, textAlign: 'center', opacity: Math.min(1, pillK * 1.4), transform: `scale(${0.8 + 0.2 * pillK})`}}>
              <span style={{display: 'inline-block', padding: '6px 28px', borderRadius: 32, background: C.orange, color: '#FFFFFF', fontFamily: FONT_JA, fontWeight: 900, fontSize: 36}}>
                <span style={{fontFamily: FONT_EN}}>make up</span> → メイカッ
              </span>
            </div>
          )}
        </>
      )}
    </AbsoluteFill>
  );
};

// ---------- S05: save card + A/B/C comment bait ----------
const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const cardK = spring({frame: f - 8, fps, config: {damping: 11, stiffness: 200}});
  const row1 = spring({frame: f - 14, fps, config: {damping: 10, stiffness: 240}});
  const row2 = spring({frame: f - 22, fps, config: {damping: 10, stiffness: 240}});
  const owl = landing(f, fps, 16, 30, 760, 1100);
  const wave = f > 36 && f < 80 ? 25 * Math.sin((f - 36) / 3) : 0;
  const qK = spring({frame: f - 30, fps, config: {damping: 12, stiffness: 220}});
  const opts: [string, string][] = [['A', 'ラーメン🍜'], ['B', '寿司🍣'], ['C', '甘いもの🍰']];
  return (
    <AbsoluteFill style={{backgroundColor: C.blue}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {circleWipe(f, 540, 1080, C.yellow, 14)}
        <g transform={`translate(540 780) scale(${cardK}) translate(-540 -780)`}>
          <rect x={92} y={572} width={900} height={440} rx={56} fill={C.yellowShade} transform="translate(14 14)" />
          <rect x={92} y={572} width={900} height={440} rx={56} fill="#FFFFFF" />
          <g opacity={Math.min(1, row1 * 1.5)}>
            <MarkBadge kind="check" x={196} y={680} size={104} scale={row1} />
            <text x={276} y={702} fontFamily={FONT_EN} fontWeight={900} fontSize={62} fill={C.ink}>I'm craving …</text>
            <rect x={366} y={718} width={250} height={11} rx={5} fill={C.green} />
            <text x={276} y={776} fontFamily={FONT_JA} fontWeight={900} fontSize={38} fill={C.ink} opacity={0.75}>無性に〜食べたい</text>
          </g>
          <g opacity={Math.min(1, row2 * 1.5)}>
            <MarkBadge kind="check" x={196} y={866} size={104} scale={row2} />
            <text x={276} y={888} fontFamily={FONT_EN} fontWeight={900} fontSize={54} fill={C.ink}>I can't make up my mind.</text>
            <rect x={430} y={902} width={410} height={11} rx={5} fill={C.green} />
            <text x={276} y={960} fontFamily={FONT_JA} fontWeight={900} fontSize={38} fill={C.ink} opacity={0.75}>決められない</text>
          </g>
        </g>
        <text x={120} y={1080} fontFamily={FONT_EN} fontWeight={900} fontSize={44} fill={C.owlBrownShade} opacity={interpolate(f, [30, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>Owl Listen</text>
        <Owl x={930} y={owl.y} size={150} squash={f < 40 ? owl.squash : breathe(f, fps, 2, 1)} blink={blinkAt(f, 70, 33)} wing={wave} look={f < 60 ? {x: -1, y: -0.6} : {x: -0.6, y: 1}} happy={f >= 60} />
      </svg>
      <div style={{position: 'absolute', top: CAP_TOP + 4, width: W, textAlign: 'center', opacity: Math.min(1, qK * 1.4), transform: `translateY(${(1 - qK) * 24}px)`}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 52, color: C.ink}}>今夜めっちゃ食べたいのは？</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 18, marginTop: 34}}>
          {opts.map(([l, t], i) => {
            const k = spring({frame: f - 40 - i * 7, fps, config: {damping: 9, stiffness: 260}});
            return (
              <div key={l} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 26px 14px 14px', borderRadius: 50, background: '#FFFFFF', boxShadow: `6px 6px 0 ${C.yellowShade}`, transform: `scale(${k})`}}>
                <span style={{width: 58, height: 58, borderRadius: 29, background: [C.red, C.orange, C.pink][i], color: '#FFFFFF', fontFamily: FONT_EN, fontWeight: 900, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{l}</span>
                <span style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 36, color: C.ink, whiteSpace: 'nowrap'}}>{t}</span>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 26, fontFamily: FONT_JA, fontWeight: 900, fontSize: 36, color: C.ink, opacity: 0.8}}>コメント欄で A / B / C 教えてね👇</div>
      </div>
    </AbsoluteFill>
  );
};

export const Ep05WhatShouldIEat: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.offWhite}}>
    <Sequence {...S1}><Scene1 /></Sequence>
    <Sequence {...S2}><Scene2 /></Sequence>
    <Sequence {...S3}><Scene3 /></Sequence>
    <Sequence {...S4}><Scene4 /></Sequence>
    <Sequence {...S5}><Scene5 /></Sequence>
    <TopBanner
      tag="Day 2/30｜脱・中学英語"
      phases={[
        {from: 0, main: <>「食べたい」を <span style={{fontFamily: FONT_EN}}>want to</span></>, sub: <>だけ言ってない？🍜</>, mainSize: 80},
        {from: S2.from, main: <><span style={{color: C.red}}>【テスト】</span>聞き取れる？🎧</>, sub: 'このネイティブ英語、何て言った？', mainSize: 72},
        {from: S3.from, main: '答え合わせ👀', sub: 'ネイティブはこう言う！'},
        {from: S4.from, main: 'もう1回聴いてみよう！🎧', sub: 'ほら、聞こえる！', mainSize: 72},
        {from: S5.from, main: '📌 保存してね', sub: '次のランチで使ってね'},
      ]}
    />
    <VoiceTrack tl={tl} fps={FPS} />
  </AbsoluteFill>
);
