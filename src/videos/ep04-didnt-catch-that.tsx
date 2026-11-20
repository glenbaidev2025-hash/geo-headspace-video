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
import {Counter, Cup, SpeechBubble, SpeedLines} from '../props/Cafe';
import {MarkBadge} from '../props/Marks';
import {Headphones} from '../props/Icons';
import {SweatDrop} from '../props/Home';
import timeline from '../../public/audio/ep04-didnt-catch-that/timeline.json';
import envelope from '../../public/audio/ep04-didnt-catch-that/envelope.json';

// Episode 4 · "I Didn't Catch That" — TikTok v2.1 hook cut (Day 1/30), 9:16.
// Barista = George (fast), learner line = Sarah; S04 replays the exact S02 clip for the "aha" moment.
const tl = timeline as VoiceTimeline;
const env = envelope as VoiceEnvelope;
const FPS = 30;
const W = 1080;
const H = 1920;
export const EP04_FRAMES = timelineFrames(tl, FPS);
const sec = (s: number) => Math.round(s * FPS);

const S1 = sceneWindow(tl, FPS, ['S01']);
const S2 = sceneWindow(tl, FPS, ['S02']);
const S3 = sceneWindow(tl, FPS, ['S03']);
const S4all = sceneWindow(tl, FPS, ['S04']);
const S4dur = sec(tl.segments.find((s) => s.id === 'S04')!.duration_s) + 12;
const S4 = {from: S4all.from, durationInFrames: S4dur};
const S5 = {from: S4all.from + S4dur, durationInFrames: EP04_FRAMES - (S4all.from + S4dur)};

const talk = (g: number, id: string) => talkLevel(tl, env, FPS, g, [id]);

// Layout (safe areas: banner 13–26%, stage 28–60%, captions 62–76%, nothing below 78%)
const FLOOR = 1150;
const CAP_TOP = 1200;

// ---------- shared pieces ----------
const Hero: React.FC<{x: number; y: number; w?: number; h?: number; expression: Expression; look?: {x: number; y: number}; blink?: number; squash?: number; rotate?: number; talk?: number; phones?: boolean; stone?: boolean}> = ({
  x, y, w = 300, h = 270, phones, stone, ...p
}) => {
  const sq = p.squash ?? 1;
  const top = y + h / 2 - h / sq; // top edge after squash (pivot at bottom)
  return (
    <g>
      <Character shape="roundRect" w={w} h={h} color={stone ? C.lightGray : C.yellow} shade={stone ? C.grayShade : C.yellowShade} x={x} y={y}
        faceSize={Math.min(w, h) * 0.55} faceOffset={{x: 0, y: -h * 0.04}} {...p} />
      {phones && (
        <g transform={`rotate(${p.rotate ?? 0} ${x} ${y + h / 2})`}>
          <Headphones x={x} y={top + h * 0.2} size={w * 1.12} color={C.owlGreen} />
        </g>
      )}
    </g>
  );
};

/** Floating "?" marks while listening. */
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
        return (
          <text key={i} x={s.x} y={s.y + bob} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={110 * k} fill={color} transform={`rotate(${s.r} ${s.x} ${s.y})`}>?</text>
        );
      })}
    </g>
  );
};

const circleWipe = (f: number, cx: number, cy: number, color: string, frames = 12) => (
  <circle cx={cx} cy={cy} r={interpolate(f, [0, frames], [0, 2300], {easing: Easing.in(Easing.cubic), extrapolateRight: 'clamp'})} fill={color} />
);

// ---------- S01: barista speed-talks, hero turns to stone ----------
const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = f + S1.from;
  const FREEZE = 42;
  const YES = 82;
  const bTalk = talk(g, 'S01');
  const bubbleK = f < 0 ? 0 : spring({frame: f - 10, fps, config: {damping: 10, stiffness: 220}});
  const typed = interpolate(f, [14, 96], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const l1 = 'For-here-or-to-go?!';
  const l2 = 'Want-room-for-cream?!';
  const n = Math.round(typed * (l1.length + l2.length));
  const frozen = f >= FREEZE;
  const yesK = spring({frame: f - YES, fps, config: {damping: 9, stiffness: 240}});
  const heroY = FLOOR - 135;
  const sweatY = frozen ? ((f - FREEZE) * 3) % 70 : 0;
  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {/* wall menu board */}
        <rect x={720} y={560} width={300} height={150} rx={26} fill={C.charcoal} />
        {[600, 640, 676].map((y, i) => <rect key={y} x={750} y={y} width={[200, 160, 220][i]} height={14} rx={7} fill={C.grayShade} />)}
        {/* barista behind counter */}
        <Character shape="capsule" w={230} h={420} color={C.blue} shade={C.blueShade} x={830} y={830} rotate={2 * Math.sin(f / 4)}
          squash={breathe(f, fps) * (1 + 0.03 * bTalk)} expression="happy" talk={bTalk} faceSize={140} faceOffset={{x: -6, y: -110}} blink={blinkAt(f, 70, 20)} look={{x: -0.8, y: 0.2}} />
        <Counter x={540} y={960} w={560} h={FLOOR - 960} />
        <Cup x={650} y={905} size={100} steam={(f % 40) / 40} />
        <Cup x={760} y={910} size={84} />
        <rect x={-20} y={FLOOR} width={W + 40} height={28} fill={C.lightGray} />
        {/* hero */}
        <Hero x={250} y={heroY} expression={!frozen ? 'look' : f < YES ? 'strained' : 'happy'} look={{x: 1, y: -0.4}} stone={frozen}
          rotate={frozen ? 2.2 * Math.sin(f * 2.3) : 0} squash={frozen ? pulse(f, fps, FREEZE, 0.14) : breathe(f, fps)} blink={!frozen ? blinkAt(f, 80, 50) : 0} />
        {frozen && <SweatDrop x={385} y={heroY - 120 + sweatY} size={60} opacity={interpolate(sweatY, [50, 70], [1, 0], {extrapolateLeft: 'clamp'})} />}
        {frozen && f < YES && (
          <g stroke={C.ink} strokeWidth={10} strokeLinecap="round">
            {[-28, 0, 28].map((a) => {
              const r1 = 190;
              const r2 = 240 + 10 * Math.sin(f);
              const rad = ((a - 90) * Math.PI) / 180;
              return <line key={a} x1={250 + r1 * Math.cos(rad)} y1={heroY + r1 * Math.sin(rad)} x2={250 + r2 * Math.cos(rad)} y2={heroY + r2 * Math.sin(rad)} />;
            })}
          </g>
        )}
        {/* fast speech bubble */}
        <SpeechBubble x={400} y={620} w={600} h={156} tx={700} ty={700} scale={bubbleK}>
          <text x={-260} y={-14} fontFamily={FONT_EN} fontWeight={900} fontSize={46} fill={C.ink} letterSpacing={-3} transform="skewX(-12)">{l1.slice(0, Math.min(n, l1.length))}</text>
          <text x={-250} y={46} fontFamily={FONT_EN} fontWeight={900} fontSize={46} fill={C.ink} letterSpacing={-3} transform="skewX(-12)">{l2.slice(0, Math.max(0, n - l1.length))}</text>
        </SpeechBubble>
        {bubbleK > 0.5 && f < 100 && <SpeedLines x={90} y={620} size={90} f={f} />}
        {f >= YES && (
          <SpeechBubble x={250} y={800} w={400} h={96} tx={250} ty={872} scale={yesK}>
            <text x={0} y={15} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={44} fill={C.ink}>Yes, please…</text>
          </SpeechBubble>
        )}
      </svg>
      <div style={{position: 'absolute', top: CAP_TOP + 10, width: W, textAlign: 'center', fontFamily: FONT_JA, fontWeight: 900, fontSize: 62, lineHeight: 1.3, color: C.ink}}>
        英語が早すぎて
        <br />
        <span style={{color: C.red}}>フリーズ</span>した時…
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
  const hl = reveal && f >= 24 && f < 60;
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
            {!reveal && <QMarks f={f} at={[18, 40, 66]} color="#FFFFFF" />}
            {isAha && (
              <text x={800} y={740} textAnchor="middle" fontFamily={FONT_EN} fontWeight={900} fontSize={150 * ahaK} fill={C.yellow} transform={`rotate(12 800 740)`}>!</text>
            )}
            <Waveform x={540} y={1080} w={880} h={150} f={f} level={lv} color={hl ? C.yellow : '#FFFFFF'} />
          </>
        )}
      </svg>
      {!reveal && f >= 4 && <MaskedCaption f={f} line2At={sec(2.05)} after={after} />}
      {reveal && (
        <Captions top={CAP_TOP - 10} start={2} en="Sorry, I didn't catch that. Could you say that again?" ja="今の聞き取れませんでした。もう一度言ってもらえますか？"
          highlight={["didn't catch that"]} spokenFrames={140} color="#FFFFFF" hlBg={C.yellow} hlColor={C.ink} enSize={54} jaSize={34} width={1000} />
      )}
    </AbsoluteFill>
  );
};

const MaskedCaption: React.FC<{f: number; line2At: number; after: boolean}> = ({f, line2At, after}) => {
  const {fps} = useVideoConfig();
  const k = spring({frame: f - 4, fps, config: {damping: 14, stiffness: 200}});
  const k2 = spring({frame: f - line2At, fps, config: {damping: 14, stiffness: 200}});
  const jit = after ? 1 + 0.06 * Math.sin(f / 3) : 1 + 0.03 * Math.sin(f * 1.3);
  return (
    <div style={{position: 'absolute', top: CAP_TOP, width: W, textAlign: 'center', fontFamily: FONT_EN, fontWeight: 900, color: '#FFFFFF'}}>
      <div style={{fontSize: 70, opacity: Math.min(1, k * 1.4), transform: `scale(${0.9 + 0.1 * k})`}}>
        Sorry, I{' '}
        <span style={{display: 'inline-block', padding: '0 26px', borderRadius: 20, background: C.red, boxShadow: `8px 8px 0 ${C.redShade}`, transform: `scale(${jit})`}}>???</span>.
      </div>
      {f >= line2At && <div style={{marginTop: 26, fontSize: 56, opacity: Math.min(1, k2 * 1.4), transform: `translateY(${(1 - k2) * 20}px)`}}>Could you say that again?</div>}
    </div>
  );
};

const Scene2: React.FC = () => <ListenStage segId="S02" from={S2.from} wipeFrom={{x: 250, y: FLOOR - 135}} wipeUnder={C.offWhite} />;
const Scene4: React.FC = () => <ListenStage segId="S04" from={S4.from} aha={30} reveal wipeFrom={{x: 790, y: FLOOR - 135}} wipeUnder={C.offWhite} />;

// ---------- S03: answer + ✗ vs ✓ ----------
const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const g = f + S3.from;
  const lv = talk(g, 'S03');
  const push = interpolate(f, [0, 10], [H, 0], {easing: Easing.out(Easing.cubic), extrapolateRight: 'clamp'});
  const leftK = spring({frame: f - 8, fps, config: {damping: 10, stiffness: 220}});
  const cross = interpolate(f, [20, 30], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const crossK = spring({frame: f - 20, fps, config: {damping: 6, stiffness: 300}});
  const rightK = spring({frame: f - 16, fps, config: {damping: 10, stiffness: 220}});
  const HL = 36;
  const check = interpolate(f, [HL, HL + 12], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const checkK = spring({frame: f - HL, fps, config: {damping: 6, stiffness: 300}});
  const hlK = spring({frame: f - HL, fps, config: {damping: 12, stiffness: 220}});
  const dim = interpolate(f, [56, 66], [1, 0.55], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const leftY = FLOOR - 115;
  const heroY = FLOOR - 135;
  const pillK = spring({frame: f - 112, fps, config: {damping: 11, stiffness: 220}});
  const land = landing(f, fps, 10, 22, heroY - 500, heroY);
  const landL = landing(f, fps, 4, 16, leftY - 500, leftY);
  return (
    <AbsoluteFill style={{backgroundColor: C.blue}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(0 ${push})`}>
          <rect x={0} y={0} width={W} height={H} fill={C.offWhite} />
          <rect x={-20} y={FLOOR} width={W + 40} height={28} fill={C.lightGray} />
          <g opacity={dim}>
            <Character shape="triangle" w={250} h={230} color={C.pink} shade={C.pinkShade} x={270} y={landL.y} expression={f < 22 ? 'look' : 'strained'}
              look={{x: 0.6, y: -0.6}} squash={f < 30 ? landL.squash * pulse(f, fps, 22, 0.12) : breathe(f, fps, 2.2, 1)} blink={blinkAt(f, 80, 30)} />
            <SpeechBubble x={270} y={720} w={440} h={250} tx={270} ty={900} scale={leftK} />
            {f >= 20 && <MarkBadge kind="cross" x={445} y={610} size={120} draw={cross} scale={crossK} rotate={-8} />}
          </g>
          <Hero x={790} y={land.y} expression="happy" talk={lv} look={{x: -0.2, y: -0.5}} squash={f < 34 ? land.squash : breathe(f, fps) * pulse(f, fps, HL, 0.08)} blink={blinkAt(f, 90, 40)} />
          <SpeechBubble x={790} y={720} w={500} h={250} tx={790} ty={872} scale={rightK} color="#FFFFFF" shade={C.green} />
          {f >= HL && <MarkBadge kind="check" x={1000} y={606} size={130} draw={check} scale={checkK} rotate={8} />}
        </g>
      </svg>
      {/* card text (HTML for inline highlight) */}
      <div style={{position: 'absolute', left: 50, top: 600 + push, width: 440, textAlign: 'center', opacity: dim * Math.min(1, leftK * 1.4), transform: `scale(${leftK})`}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 54, color: C.ink, lineHeight: 1.15, textDecoration: f >= 30 ? `line-through 7px ${C.red}` : 'none'}}>Pardon?</div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 48, color: C.ink, lineHeight: 1.25, textDecoration: f >= 30 ? `line-through 7px ${C.red}` : 'none'}}>One more time</div>
        <div style={{marginTop: 10, fontFamily: FONT_JA, fontWeight: 900, fontSize: 32, color: C.red}}>少し硬い・命令っぽい</div>
      </div>
      <div style={{position: 'absolute', left: 540, top: 610 + push, width: 500, textAlign: 'center', opacity: Math.min(1, rightK * 1.4), transform: `scale(${rightK})`}}>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 52, color: C.ink, lineHeight: 1.2}}>Sorry,</div>
        <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: 42, color: C.ink, lineHeight: 1.5}}>
          I{' '}
          <span style={{display: 'inline-block', padding: '0 10px', borderRadius: 14, background: hlK > 0.02 ? C.green : 'transparent', color: hlK > 0.02 ? '#FFFFFF' : C.ink, transform: `scale(${1 + 0.1 * Math.sin(Math.min(1, hlK) * Math.PI)})`}}>didn't catch that</span>.
        </div>
        <div style={{marginTop: 6, fontFamily: FONT_JA, fontWeight: 900, fontSize: 32, color: C.green}}>やわらかい・自然</div>
      </div>
      {push < 40 && (
        <>
          <Captions top={CAP_TOP} start={6} en="Sorry, I didn't catch that." ja="すみません、聞き取れませんでした。" highlight={["didn't catch that"]} spokenFrames={88} hlBg={C.green} enSize={60} jaSize={44} />
          {f >= 112 && (
            <div style={{position: 'absolute', top: 1376, width: W, textAlign: 'center', opacity: Math.min(1, pillK * 1.4), transform: `scale(${0.8 + 0.2 * pillK})`}}>
              <span style={{display: 'inline-block', padding: '10px 30px', borderRadius: 36, background: C.orange, color: '#FFFFFF', fontFamily: FONT_JA, fontWeight: 900, fontSize: 38}}>
                <span style={{fontFamily: FONT_EN}}>didn't catch that</span> → ディドゥン キャッチャッ
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
  const row2 = spring({frame: f - 24, fps, config: {damping: 8, stiffness: 240}});
  const owl = landing(f, fps, 16, 30, 760, 1100);
  const wave = f > 36 && f < 80 ? 25 * Math.sin((f - 36) / 3) : 0;
  const qK = spring({frame: f - 34, fps, config: {damping: 12, stiffness: 220}});
  const opts: [string, string][] = [['A', 'Pardon?'], ['B', 'One more time'], ['C', '笑顔でスルー']];
  return (
    <AbsoluteFill style={{backgroundColor: C.blue}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        {circleWipe(f, 540, 1080, C.yellow, 14)}
        <g transform={`translate(540 780) scale(${cardK}) translate(-540 -780)`}>
          <rect x={92} y={572} width={900} height={440} rx={56} fill={C.yellowShade} transform="translate(14 14)" />
          <rect x={92} y={572} width={900} height={440} rx={56} fill="#FFFFFF" />
          <g opacity={row1}>
            <MarkBadge kind="cross" x={200} y={672} size={96} scale={row1} />
            <text x={280} y={692} fontFamily={FONT_EN} fontWeight={900} fontSize={60} fill={C.grayShade}>One more time</text>
            <rect x={276} y={668} width={420} height={9} rx={4} fill={C.red} />
          </g>
          <path d="M 188 732 L 200 750 L 212 732" fill="none" stroke={C.grayShade} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" opacity={row2} />
          <g opacity={Math.min(1, row2 * 1.5)}>
            <MarkBadge kind="check" x={200} y={826} size={116} scale={row2} />
            <text x={286} y={850} fontFamily={FONT_EN} fontWeight={900} fontSize={64} fill={C.ink}>I didn't catch that.</text>
            <rect x={340} y={866} width={530} height={12} rx={6} fill={C.green} />
            <text x={286} y={950} fontFamily={FONT_JA} fontWeight={900} fontSize={40} fill={C.ink} opacity={0.75}>聞き取れない時は、これ一言！</text>
          </g>
        </g>
        <text x={120} y={1080} fontFamily={FONT_EN} fontWeight={900} fontSize={44} fill={C.owlBrownShade} opacity={interpolate(f, [30, 44], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}>Owl Listen</text>
        <Owl x={930} y={owl.y} size={150} squash={f < 40 ? owl.squash : breathe(f, fps, 2, 1)} blink={blinkAt(f, 70, 33)} wing={wave} look={f < 60 ? {x: -1, y: -0.6} : {x: -0.6, y: 1}} happy={f >= 60} />
      </svg>
      <div style={{position: 'absolute', top: CAP_TOP + 4, width: W, textAlign: 'center', opacity: Math.min(1, qK * 1.4), transform: `translateY(${(1 - qK) * 24}px)`}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: 52, color: C.ink}}>聞き取れない時、普段どれ言う？</div>
        <div style={{display: 'flex', justifyContent: 'center', gap: 18, marginTop: 34}}>
          {opts.map(([l, t], i) => {
            const k = spring({frame: f - 44 - i * 7, fps, config: {damping: 9, stiffness: 260}});
            const isC = l === 'C';
            return (
              <div key={l} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px 14px 14px', borderRadius: 50, background: isC ? C.ink : '#FFFFFF',
                boxShadow: `6px 6px 0 ${C.yellowShade}`, transform: `scale(${k})`}}>
                <span style={{width: 58, height: 58, borderRadius: 29, background: [C.blue, C.red, C.orange][i], color: '#FFFFFF', fontFamily: FONT_EN, fontWeight: 900, fontSize: 38, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{l}</span>
                <span style={{fontFamily: isC ? FONT_JA : FONT_EN, fontWeight: 900, fontSize: 34, color: isC ? '#FFFFFF' : C.ink, whiteSpace: 'nowrap'}}>{t}</span>
              </div>
            );
          })}
        </div>
        <div style={{marginTop: 26, fontFamily: FONT_JA, fontWeight: 900, fontSize: 36, color: C.ink, opacity: 0.8}}>コメント欄で A / B / C 教えてね</div>
      </div>
    </AbsoluteFill>
  );
};

const NG = <span style={{color: C.red}}>NG？</span>;

export const Ep04DidntCatchThat: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.offWhite}}>
    <Sequence {...S1}><Scene1 /></Sequence>
    <Sequence {...S2}><Scene2 /></Sequence>
    <Sequence {...S3}><Scene3 /></Sequence>
    <Sequence {...S4}><Scene4 /></Sequence>
    <Sequence {...S5}><Scene5 /></Sequence>
    <TopBanner
      tag="Day 1/30｜脱・中学英語"
      phases={[
        {from: 0, main: <>「One more time」は{NG}</>, sub: '聞き取れない時のネイティブ英語', mainSize: 74},
        {from: S2.from, main: <><span style={{color: C.red}}>【テスト】</span>聞き取れる？</>, sub: 'このネイティブ英語、何て言った？'},
        {from: S3.from, main: '答え合わせ！', sub: 'これだけ覚えればOK'},
        {from: S4.from, main: 'もう1回聴いてみよう', sub: 'ほら、聞こえる！'},
        {from: S5.from, main: '保存して使ってね', sub: '海外旅行・カフェでそのまま使える'},
      ]}
    />
    <VoiceTrack tl={tl} fps={FPS} />
  </AbsoluteFill>
);
