// "China's AI bubble just popped — is the US next?" — 9:16, bilingual captions, user's own English voiceover.
import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import narration from '../../assets/audio/ai-bubble.m4a';
import {Captions, Cue} from '../Captions';
import {Character} from '../Character';
import {blinkAt, breathe, ci, darting, EASE, fall, hop, landSquash, pop, shake} from '../motion';
import {CalendarCard, Card, Coin, ServerBlock, Sign, SpeechBubble} from '../Props';
import {Reveal, RevealKind} from '../Reveal';
import {PopText, ArcText, Tag} from '../Text';
import {C, FONT} from '../theme';

const W = 1080;
const H = 1920;
const FPS = 30;
const G = 1330; // ground line (characters stand on it); captions live below ~1500
const fr = (sec: number) => Math.round(sec * FPS);
const mkT = (s: number) => (sec: number) => fr(sec) - fr(s);

type SceneProps = {s: number};
const Stage: React.FC<{bg: string; children: React.ReactNode}> = ({bg, children}) => (
  <AbsoluteFill style={{backgroundColor: bg}}>
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>{children}</svg>
  </AbsoluteFill>
);

// ---------- 1. China's AI bubble pops; is the US next? ----------
const S1: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const popF = T(1.75);
  const cx = 540;
  const cy = 780;
  const grow = ci(f, [0, popF], [0.5, 1], Easing.in(Easing.quad));
  const bw = 640 * grow;
  const shards = Array.from({length: 12}).map((_, i) => {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    const sp = 26 + (i % 4) * 7;
    const t = f - popF;
    return {x: cx + Math.cos(a) * sp * t, y: cy + Math.sin(a) * sp * t + 0.9 * t * t, w: 50 + (i % 3) * 30, i};
  });
  // remnant falls to the ground and sulks
  const remLand = popF + 22;
  const remY = fall(f, popF, remLand, cy, G - 80);
  const usX = ci(f, [T(2.9), T(3.5)], [1300, 600], EASE);
  const usLook = f < T(5.4) ? {x: -1, y: 0.3} : {x: 0.8, y: 0};
  const gF = T(5.5);
  const gY = fall(f, gF, gF + 12, -200, G - 90);
  return (
    <Stage bg={C.offWhite}>
      {f < popF + 1 && (
        <>
          <Character shape="circle" w={bw} h={bw} color={C.pink} shade={C.pinkShade} x={cx} y={cy}
            squash={1 + 0.05 * Math.sin(f * 0.9) * (f / popF)} expression={f < T(1.0) ? 'look' : 'strained'} look={{x: 0, y: -1}} blink={blinkAt(f, 80, 40)} />
          <ellipse cx={cx - bw * 0.22} cy={cy - bw * 0.25} rx={bw * 0.08} ry={bw * 0.05} fill="#FFFFFF" opacity={0.85} transform={`rotate(-35 ${cx - bw * 0.22} ${cy - bw * 0.25})`} />
        </>
      )}
      {f >= popF && f < popF + 10 &&
        Array.from({length: 10}).map((_, i) => {
          const a = (i / 10) * Math.PI * 2;
          const r0 = 330 + (f - popF) * 14;
          return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * (r0 + 90)} y2={cy + Math.sin(a) * (r0 + 90)}
            stroke={C.ink} strokeWidth={20} strokeLinecap="round" />;
        })}
      {f >= popF && shards.map((p) => <Character key={p.i} shape="circle" w={p.w} h={p.w} color={p.i % 2 ? C.pink : C.orange} shade={p.i % 2 ? C.pinkShade : C.orangeShade} x={p.x} y={p.y} noFace />)}
      {f >= popF && (
        <Character shape="circle" w={160} h={160} color={C.pink} shade={C.pinkShade} x={250} y={f < remLand ? cy + (remY - cy) : G - 80}
          squash={landSquash(f, remLand, fps, 0.3)} expression={f < remLand ? 'shocked' : 'sad'} />
      )}
      {f >= T(2.9) && (
        <Character shape="circle" w={320} h={320} color={C.blue} shade={C.blueShade} x={usX} y={G - 160} rotate={ci(f, [T(2.9), T(3.5)], [-30, 0])}
          squash={breathe(f, fps, 2.2)} expression={f < T(5.4) ? 'look' : 'shocked'} look={usLook} blink={f < T(5.4) ? blinkAt(f, 70, 10) : 0} />
      )}
      {f >= gF && (
        <Character shape="roundRect" w={180} h={180} color={C.lightBlue} shade={C.lightBlueShade} x={900} y={gY} squash={landSquash(f, gF + 12, fps)}
          expression="look" look={{x: -1, y: 0}} blink={blinkAt(f, 60, 5)} />
      )}
      <PopText text="中国 AI 泡沫" x={540} y={300} start={0} end={T(2.75)} size={110} />
      <PopText text="破了！" x={540} y={440} start={popF} end={T(2.75)} size={130} color={C.orange} />
      <PopText text="美国是下一个？" x={540} y={300} start={T(2.9)} end={T(5.3)} size={100} />
      <PopText text="原因可能是谷歌" x={540} y={300} start={T(5.45)} size={96} />
      {f >= remLand + 6 && <Tag text="中国 AI" x={250} y={G + 70} start={remLand + 6} />}
      <Tag text="美国" x={600} y={G + 70} start={T(3.3)} bg={C.blue} />
      <Tag text="谷歌" x={900} y={G + 70} start={gF + 10} bg={C.lightBlueShade} />
    </Stage>
  );
};

// ---------- 2. Index fell ~40% in under four months ----------
const PATH: [number, number][] = [[110, 600], [330, 740], [450, 670], [650, 1000], [760, 930], [980, G]];
const segLens = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const totalLen = segLens.reduce((a, b) => a + b, 0);
const along = (u: number) => {
  let d = u * totalLen;
  for (let i = 0; i < segLens.length; i++) {
    if (d <= segLens[i] || i === segLens.length - 1) {
      const k = Math.min(1, d / segLens[i]);
      const [x0, y0] = PATH[i];
      const [x1, y1] = PATH[i + 1];
      return {x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k, ang: (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI};
    }
    d -= segLens[i];
  }
  return {x: PATH[0][0], y: PATH[0][1], ang: 0};
};
const S2: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const draw = ci(f, [0, 36], [0, 1], EASE);
  const u = ci(f, [T(8.6), T(12.3)], [0, 1], Easing.in(Easing.cubic));
  const landF = T(12.3);
  const p = along(u);
  const d = PATH.map((q, i) => `${i ? 'L' : 'M'} ${q[0]} ${q[1]}`).join(' ');
  const r = 85;
  const nx = Math.sin((p.ang * Math.PI) / 180);
  const ny = -Math.cos((p.ang * Math.PI) / 180);
  const charX = f >= landF ? 980 - 40 : p.x + nx * (r + 18);
  const charY = f >= landF ? G - r : p.y + ny * (r + 18);
  const pct = Math.round(ci(f, [T(9.6), T(12.3)], [0, 40]));
  return (
    <Stage bg={C.yellow}>
      <path d={d} fill="none" stroke={C.blueShade} strokeWidth={48} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 1`} transform="translate(0 14)" />
      <path d={d} fill="none" stroke={C.blue} strokeWidth={48} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${draw} 1`} />
      <Character shape="circle" w={r * 2} h={r * 2} color={C.orange} shade={C.orangeShade} x={charX} y={charY}
        rotate={f >= landF ? 0 : p.ang * 0.6} squash={f >= landF ? landSquash(f, landF, fps, 0.3) : u > 0 ? 0.92 : breathe(f, fps)}
        expression={u <= 0 ? 'look' : f < landF ? 'strained' : 'sad'} look={{x: 0.8, y: 0.6}} blink={blinkAt(f, 60, 12)} />
      <PopText text="科创50 AI 指数" x={540} y={300} start={0} size={84} />
      <PopText text={`-${pct}%`} x={330} y={1110} start={T(9.6)} size={170} color={C.ink} stagger={0} />
      <Tag text="不到 4 个月" x={330} y={1270} start={T(11.0)} size={50} />
    </Stage>
  );
};

// ---------- 3. ~$480B in market value gone ----------
const S3: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const T = mkT(s);
  const n = 9;
  const v0 = T(13.5);
  return (
    <Stage bg={C.charcoal}>
      {Array.from({length: n}).map((_, i) => {
        const idx = n - 1 - i; // top coin vanishes first
        const vf = v0 + idx * 8;
        const sc = ci(f, [vf, vf + 6], [1, 0], Easing.in(Easing.back(2)));
        const y = 1300 - i * 46 - ci(f, [vf, vf + 6], [0, 30]);
        const ring = f >= vf && f < vf + 10 ? (f - vf) / 10 : -1;
        return (
          <g key={i}>
            {sc > 0.01 && <Coin x={640} y={y} w={300} scale={sc} />}
            {ring >= 0 && <ellipse cx={640} cy={y} rx={150 + ring * 120} ry={50 + ring * 40} fill="none" stroke="#FFFFFF" strokeWidth={14 * (1 - ring)} />}
          </g>
        );
      })}
      <Character shape="triangle" w={240} h={210} color={C.green} shade={C.greenShade} x={230} y={G - 105}
        expression={f < T(16.0) ? 'look' : 'sad'} look={darting(f, 30, [{x: 0.6, y: -1}, {x: 0.9, y: -0.6}], 24)} blink={blinkAt(f, 66, 20)}
        squash={f < T(16.0) ? breathe(f, 30) : ci(f, [T(16.0), T(16.4)], [1, 1.12])} />
      <PopText text="$4800 亿" x={540} y={360} start={T(13.1)} size={150} color="#FFFFFF" />
      <PopText text="市值蒸发" x={540} y={530} start={T(14.0)} size={110} color={C.yellow} />
    </Stage>
  );
};

// ---------- 4. 250x annual profits — not cheap optimism ----------
const BLOCK_COLORS: [string, string][] = [[C.blue, C.blueShade], [C.purple, C.purpleShade], [C.pink, C.pinkShade], [C.lightBlue, C.lightBlueShade], [C.green, C.greenShade]];
const S4: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const b0 = T(18.4);
  const nBlocks = 14;
  const tiltTarget = ci(f, [b0, b0 + nBlocks * 8], [0, 15], EASE);
  const tilt = tiltTarget + (f > b0 ? 1.2 * Math.sin(f * 0.6) * Math.exp(-((f - b0) % 8) / 4) : 0);
  const count = Math.max(1, Math.round(ci(f, [b0, T(21.8)], [1, 250])));
  const px = 540;
  const py = 1150;
  return (
    <Stage bg={C.offWhite}>
      <Character shape="triangle" w={220} h={180} color={C.lightGray} shade={C.grayShade} x={px} y={G - 90} noFace />
      <g transform={`translate(${px} ${py}) rotate(${tilt})`}>
        <rect x={-460} y={-20} width={920} height={40} rx={20} fill={C.orangeShade} />
        <rect x={-460} y={-26} width={920} height={36} rx={18} fill={C.orange} />
        <Character shape="circle" w={120} h={120} color={C.yellow} shade={C.yellowShade} x={-380} y={-26 - 60}
          expression={tilt > 9 ? 'shocked' : 'happy'} blink={blinkAt(f, 50)} look={{x: 0.6, y: -0.4}} />
        {Array.from({length: nBlocks}).map((_, k) => {
          const lf = b0 + k * 8;
          if (f < lf - 8) return null;
          const restY = -26 - 55 - k * 110;
          const y = fall(f, lf - 8, lf, restY - 900, restY);
          const [c, sh] = BLOCK_COLORS[k % BLOCK_COLORS.length];
          return (
            <Character key={k} shape="roundRect" w={230} h={110} color={c} shade={sh} x={330} y={y} squash={landSquash(f, lf, fps, 0.18)}
              expression={k % 4 === 1 ? 'strained' : undefined} faceSize={80} />
          );
        })}
      </g>
      <Tag text="利润" x={180} y={G + 70} start={T(18.6)} bg={C.yellowShade} />
      <PopText text="巅峰时，股价 =" x={300} y={300} start={0} end={T(22.5)} size={70} />
      <PopText text={`${count}×`} x={300} y={440} start={T(18.4)} end={T(22.5)} size={170} color={C.orange} stagger={0} />
      <PopText text="年利润" x={300} y={590} start={T(19.2)} end={T(22.5)} size={80} />
      <PopText text="这可不是" x={300} y={330} start={T(22.65)} size={84} />
      <PopText text="便宜的乐观" x={300} y={460} start={T(23.0)} size={84} color={C.orange} />
    </Stage>
  );
};

// ---------- 5. US: Alphabet's worst trading day ever ----------
const S5: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const dropA = T(27.6);
  const landF = dropA + 12;
  const y = fall(f, dropA, landF, -300, G - 190);
  const worst = T(29.76);
  return (
    <Stage bg={C.blue}>
      <Card x={300} y={720} w={300} h={180} label="昨天" labelSize={80} rotate={-6} scale={pop(f, T(26.9), fps)} />
      {f >= dropA && (
        <Character shape="roundRect" w={380} h={380} color={C.yellow} shade={C.yellowShade} x={560 + (f >= worst ? shake(f, 8) : 0)} y={y}
          squash={f < worst ? landSquash(f, landF, fps, 0.28) * breathe(f, fps) : 1 + 0.05 * Math.sin(f * 1.3)}
          expression={f < landF ? 'shocked' : f < worst ? 'look' : 'strained'} look={darting(f, fps, [{x: -1, y: 0}, {x: 1, y: -0.3}], 26)} blink={blinkAt(f, 70, 30)} />
      )}
      <PopText text="与此同时，美国" x={540} y={320} start={0} end={T(28.3)} size={96} color="#FFFFFF" />
      <PopText text="谷歌母公司" x={540} y={320} start={T(28.4)} size={96} color="#FFFFFF" />
      <PopText text="史上最惨交易日" x={540} y={480} start={worst} size={104} color={C.yellow} />
      <Tag text="Alphabet" x={560} y={G + 70} start={landF} bg={C.night} />
    </Stage>
  );
};

// ---------- 6. Fell 16%, $500B+ wiped out ----------
const S6: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const tipA = T(32.2);
  const tipB = T(32.7);
  const landF = T(33.2);
  const hw = 260;
  const x = ci(f, [tipA, tipB], [380, 700], Easing.in(Easing.quad));
  const y = f < tipB ? 720 - hw / 2 : fall(f, tipB, landF, 720 - hw / 2, G - hw / 2);
  const rot = f < landF ? ci(f, [tipA, landF], [0, 70]) : 0;
  return (
    <Stage bg={C.offWhite}>
      <Card x={250} y={760} w={500} h={80} color={C.lightGray} shade={C.grayShade} />
      {Array.from({length: 6}).map((_, i) => {
        const st = T(34.6) + i * 5;
        if (f < st) return null;
        const t = f - st;
        return <Coin key={i} x={700 + (i - 2.5) * 70 + t * (i - 2.5) * 3} y={G - 260 - t * 26 + t * t * 0.1} w={130} />;
      })}
      <Character shape="roundRect" w={hw} h={hw} color={C.yellow} shade={C.yellowShade} x={x} y={y} rotate={rot}
        squash={landSquash(f, landF, fps, 0.4)} expression={f < tipA ? 'look' : f < landF + 4 ? 'shocked' : f < T(34.5) ? 'strained' : 'sad'}
        look={{x: 1, y: 0.8}} />
      <PopText text="-16%" x={540} y={330} start={T(32.2)} size={220} color={C.orange} stagger={1} />
      <PopText text="抹去 $5000 亿+" x={540} y={520} start={T(34.5)} size={92} />
    </Stage>
  );
};

// ---------- 7. What spooked investors: massive spending / who pays ----------
const S7: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const spend = T(39.77);
  const pay = T(41.15);
  const bagH = 260 * ci(f, [pay, pay + 40], [1, 0.55], EASE);
  const from = {x: 230, y: G - bagH / 2 - 40};
  const to = {x: 720, y: 820};
  return (
    <Stage bg={C.charcoal}>
      {[330, 540, 750].map((x, i) => (
        <Character key={i} shape={i === 1 ? 'triangle' : 'circle'} w={150} h={i === 1 ? 140 : 150} color={[C.pink, C.green, C.lightBlue][i]}
          shade={[C.pinkShade, C.greenShade, C.lightBlueShade][i]} x={x + shake(f + i * 7, 4)} y={520} expression="shocked"
          squash={0.9 + 0.1 * pop(f, i * 4, fps)} look={{x: 0, y: 1}} />
      ))}
      <Character shape="halfPill" w={420} h={560} color={C.lightBlue} shade={C.lightBlueShade} x={720} y={G - 280}
        expression={f < spend ? 'look' : 'happy'} squash={f >= spend ? 1 + 0.04 * Math.sin(f * 0.8) : breathe(f, fps)} blink={blinkAt(f, 64, 8)} look={{x: -1, y: 0}} />
      <Tag text="AI 投入" x={720} y={G + 70} start={spend} bg={C.lightBlueShade} />
      {f >= spend &&
        Array.from({length: 14}).map((_, i) => {
          const st = spend + i * 6;
          const t = (f - st) / 22;
          if (t < 0 || t > 1) return null;
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t - 380 * 4 * t * (1 - t);
          return <Coin key={i} x={x} y={y} w={110} />;
        })}
      <Character shape="dome" w={340} h={bagH} color={C.green} shade={C.greenShade} x={230} y={G - bagH / 2}
        expression={f < pay ? 'look' : 'sad'} faceSize={Math.min(150, bagH * 0.6)} look={{x: 1, y: -0.5}} />
      <Tag text="买单的业务" x={230} y={G + 70} start={pay} bg={C.greenShade} />
      <PopText text="什么吓到了投资者？" x={540} y={300} start={0} end={T(39.6)} size={84} color="#FFFFFF" />
      <PopText text="巨额支出" x={540} y={300} start={spend} end={T(41.0)} size={120} color={C.yellow} />
      <PopText text="谁来买单？" x={540} y={300} start={pay} size={120} color="#FFFFFF" />
    </Stage>
  );
};

// ---------- 8. AI mode shows fewer ads ----------
const S8: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  return (
    <Stage bg={C.offWhite}>
      <Tag text="传统搜索" x={280} y={430} start={T(43.6)} />
      {Array.from({length: 5}).map((_, i) => {
        const ad = i !== 2 && i !== 4;
        return (
          <Card key={i} x={280} y={570 + i * 150} w={400} h={120} color={ad ? C.yellow : '#FFFFFF'} shade={ad ? C.yellowShade : C.grayShade}
            label={ad ? '广告' : undefined} labelSize={56} scale={pop(f, T(43.7) + i * 4, fps)}>
            {!ad && <rect x={-150} y={-12} width={260} height={24} rx={12} fill={C.lightGray} />}
          </Card>
        );
      })}
      <Tag text="AI 模式" x={800} y={430} start={T(44.6)} bg={C.purpleShade} />
      {f >= T(44.7) && (
        <Character shape="roundRect" w={380} h={460} color={C.purple} shade={C.purpleShade} x={800} y={820} squash={landSquash(f, T(44.7) + 6, fps, 0.15)}
          expression="happy" blink={blinkAt(f, 56, 14)} look={{x: -0.6, y: 0}} />
      )}
      <Card x={800} y={1170} w={300} h={100} color={C.yellow} shade={C.yellowShade} label="广告" labelSize={50} scale={pop(f, T(45.2), fps)} />
      <PopText text="广告变少了" x={540} y={270} start={T(45.6)} size={110} />
    </Stage>
  );
};

// ---------- 9. AI answers questions… and raises one ----------
const S9: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const q = T(50.17);
  const qs = pop(f, q, fps, 260);
  return (
    <Stage bg={C.yellow}>
      <Character shape="circle" w={420} h={420} color={C.blue} shade={C.blueShade} x={430} y={G - 210}
        expression={f < q ? 'happy' : 'look'} look={f < q ? {x: 0.5, y: -0.5} : darting(f, fps, [{x: -1, y: -0.2}, {x: 1, y: -0.2}, {x: 0, y: 1}], 16)}
        blink={blinkAt(f, 60, 30)} squash={f < q ? breathe(f, fps, 3, 0, 0.04) : landSquash(f, q, fps, 0.2)} />
      <SpeechBubble x={650} y={680} w={520} h={300} scale={pop(f, T(47.5), fps)}>
        {f < q ? (
          <text x={0} y={6} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={84} fill={C.ink}>有问必答 ✓</text>
        ) : (
          <text transform={`scale(${qs})`} x={0} y={14} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={220} fill={C.orange}>?</text>
        )}
      </SpeechBubble>
      <PopText text="会回答问题的 AI" x={540} y={300} start={T(47.5)} end={T(51.2)} size={90} />
      <PopText text="广告钱在哪？" x={540} y={300} start={T(51.39)} size={110} />
    </Stage>
  );
};

// ---------- 10. Up to $205B on infrastructure ----------
const S10: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const cols = [130, 345, 735, 950];
  const rows = 6;
  const start = T(53.4);
  const filled = ci(f, [start, start + rows * 4 * 4], [0, 1]);
  return (
    <Stage bg={C.night}>
      <Character shape="circle" w={220} h={220} color={C.yellow} shade={C.yellowShade} x={540} y={G - 110}
        squash={1 - filled * 0.25 + 0.02 * Math.sin(f * 0.9)} expression={filled < 0.3 ? 'look' : 'strained'} look={darting(f, fps, [{x: -1, y: 0}, {x: 1, y: 0}], 20)} />
      {cols.map((x, c) =>
        Array.from({length: rows}).map((_, r) => {
          const lf = start + (r * 4 + c) * 4 + 10;
          if (f < lf - 10) return null;
          const restY = G - 110 - r * 120;
          const y = fall(f, lf - 10, lf, -200, restY);
          return <ServerBlock key={`${c}-${r}`} x={x} y={y} w={200} h={110} squash={landSquash(f, lf, fps, 0.15)} t={f + r * 3 + c} />;
        }),
      )}
      <PopText text="$2050 亿" x={540} y={260} start={T(55.0)} size={160} color={C.yellow} />
      <PopText text="今年砸向基础设施" x={540} y={410} start={T(56.8)} size={76} color="#FFFFFF" />
    </Stage>
  );
};

// ---------- 11. Anthropic filed to go public; OpenAI planning its debut ----------
const S11: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const aIn = T(60.85);
  const ax = ci(f, [aIn, aIn + 24], [-260, 300], EASE);
  const aHop = hop(f, aIn, 12, 120) + hop(f, aIn + 12, 12, 60);
  const oIn = T(64.86);
  const ox = ci(f, [oIn, oIn + 24], [1340, 780], EASE);
  const oHop = hop(f, oIn, 12, 120) + hop(f, oIn + 12, 12, 60);
  return (
    <Stage bg={C.offWhite}>
      <Character shape="dome" w={380} h={260} color={C.purple} shade={C.purpleShade} x={ax} y={G - 130 + aHop}
        squash={landSquash(f, aIn + 24, fps, 0.2) * breathe(f, fps)} expression="happy" blink={blinkAt(f, 58, 3)} look={{x: 0.6, y: -0.3}} />
      <Sign x={300} y={880} text="IPO" scale={pop(f, T(63.13), fps)} />
      <Tag text="Anthropic" x={300} y={G + 70} start={aIn + 18} bg={C.purpleShade} />
      {f >= oIn && (
        <Character shape="triangle" w={300} h={270} color={C.green} shade={C.greenShade} x={ox} y={G - 135 + oHop}
          squash={landSquash(f, oIn + 24, fps, 0.2) * breathe(f, fps, 2.4, 1)} expression="happy" blink={blinkAt(f, 64, 20)} look={{x: -0.6, y: -0.3}} />
      )}
      <Sign x={780} y={880} text="IPO？" scale={pop(f, T(66.9), fps)} color={C.lightBlue} shade={C.lightBlueShade} />
      <Tag text="OpenAI" x={780} y={G + 70} start={oIn + 18} bg={C.greenShade} />
      <PopText text="排队上市" x={540} y={320} start={T(61.0)} size={130} />
    </Stage>
  );
};

// ---------- 12. Passing around the collection plate ----------
const S12: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const xs = [150, 410, 670, 930];
  const cast = [
    {shape: 'dome' as const, w: 230, h: 160, color: C.purple, shade: C.purpleShade},
    {shape: 'triangle' as const, w: 210, h: 190, color: C.green, shade: C.greenShade},
    {shape: 'circle' as const, w: 200, h: 200, color: C.blue, shade: C.blueShade},
    {shape: 'roundRect' as const, w: 200, h: 200, color: C.pink, shade: C.pinkShade},
  ];
  const p0 = T(71.7);
  const step = 26;
  const k = Math.max(0, Math.min(3, (f - p0) / step));
  const seg = Math.min(2, Math.floor(k));
  const frac = Math.min(1, (k - seg) / 0.75);
  const bx = xs[seg] + (xs[Math.min(3, seg + 1)] - xs[seg]) * (k >= 3 ? 1 : EASE(frac));
  const by = 960 - (k >= 3 ? 0 : 160 * 4 * frac * (1 - frac));
  return (
    <Stage bg={C.yellow}>
      {cast.map((c, i) => (
        <Character key={i} {...c} x={xs[i]} y={G - c.h / 2 + hop(f, p0 + (i - 1) * step + step * 0.75, 10, 30)}
          expression={i <= k + 0.3 ? 'happy' : 'look'} look={{x: Math.max(-1, Math.min(1, (bx - xs[i]) / 200)), y: -0.8}} blink={blinkAt(f, 60, i * 15)} />
      ))}
      {Array.from({length: 4}).map((_, i) => {
        const st = p0 + i * step - 14;
        const t = f - st;
        if (t < 0 || t > 16) return null;
        return <Coin key={i} x={xs[i]} y={ci(t, [0, 14], [520, 940])} w={90} />;
      })}
      <g transform={`translate(${bx} ${by}) scale(${pop(f, T(69.5), fps)})`}>
        <Character shape="dome" w={230} h={120} color={C.orange} shade={C.orangeShade} x={0} y={0} rotate={180} noFace />
      </g>
      <PopText text="AI 账单遭质疑" x={540} y={300} start={T(68.95)} end={T(71.5)} size={100} />
      <PopText text="排队“传盘子”" x={540} y={300} start={T(71.68)} size={110} />
      <PopText text="找钱" x={540} y={450} start={T(72.6)} size={110} color={C.orange} />
    </Stage>
  );
};

// ---------- 13. Is the bubble bursting? Not necessarily. Not yet. ----------
const S13: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const nope = T(78.08);
  const wob = f < nope ? 0.07 * Math.sin(f * 1.1) * ci(f, [0, nope], [0.3, 1]) : 0.07 * Math.sin(f * 0.6) * Math.exp(-(f - nope) / 10);
  const bw = 680;
  return (
    <Stage bg={C.night}>
      <Character shape="circle" w={bw} h={bw} color={C.pink} shade={C.pinkShade} x={540} y={830} squash={1 + wob}
        expression={f < nope ? 'strained' : f < T(79.3) ? 'look' : 'calm'} look={{x: 0, y: 0.5}} blink={blinkAt(f, 70)} />
      <ellipse cx={540 - bw * 0.24} cy={830 - bw * 0.24} rx={bw * 0.08} ry={bw * 0.05} fill="#FFFFFF" opacity={0.85} transform={`rotate(-35 ${540 - bw * 0.24} ${830 - bw * 0.24})`} />
      {[{x: 200, c: C.yellow, sh: C.yellowShade}, {x: 540, c: C.lightBlue, sh: C.lightBlueShade}, {x: 880, c: C.green, sh: C.greenShade}].map((m, i) => (
        <Character key={i} shape="circle" w={160} h={160} color={m.c} shade={m.sh} x={m.x + (f < nope ? shake(f + i * 5, 3) : 0)} y={G - 80}
          expression={f < nope ? 'strained' : 'look'} look={{x: (540 - m.x) / 400, y: -1}} blink={blinkAt(f, 50, i * 13)}
          squash={f < nope ? 1.06 : landSquash(f, nope + i * 3, fps, 0.15)} />
      ))}
      <PopText text="美国 AI 泡沫要破了？" x={540} y={260} start={T(75.1)} end={T(77.9)} size={78} color="#FFFFFF" />
      <PopText text="未必" x={540} y={270} start={nope} end={T(79.1)} size={170} color={C.yellow} />
      <PopText text="至少现在还没有" x={540} y={270} start={T(79.23)} size={90} color="#FFFFFF" />
    </Stage>
  );
};

// ---------- 14. When does it pay off? Checking 401(k)s ----------
const S14: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const card = T(85.6);
  const shrink = ci(f, [card + 20, T(88.4)], [1, 0.35], EASE);
  const xs = [220, 540, 860];
  return (
    <Stage bg={C.offWhite}>
      {xs.map((x, i) => (
        <PopText key={i} text="?" x={x} y={980 - (i === 1 ? 60 : 0)} start={T(80.6) + i * 6} end={card - 4} size={140} color={C.orange} />
      ))}
      <Character shape="circle" w={220} h={220} color={C.orange} shade={C.orangeShade} x={xs[0]} y={G - 110} squash={breathe(f, fps, 2, 0)}
        expression={f < T(87.6) ? 'look' : 'sad'} look={f < card ? {x: 0, y: -1} : {x: 0.8, y: -0.6}} blink={blinkAt(f, 62, 4)} />
      <Character shape="capsule" w={170} h={300} color={C.lightBlue} shade={C.lightBlueShade} x={xs[1]} y={G - 150} squash={breathe(f, fps, 2.3, 1)}
        expression={f < T(87.6) ? 'look' : 'sad'} look={{x: 0, y: -1}} blink={blinkAt(f, 70, 22)} faceSize={110} faceOffset={{x: 0, y: -60}} />
      <Character shape="triangle" w={240} h={210} color={C.green} shade={C.greenShade} x={xs[2]} y={G - 105} squash={breathe(f, fps, 1.8, 2)}
        expression={f < T(87.6) ? 'look' : 'sad'} look={f < card ? {x: 0, y: -1} : {x: -0.8, y: -0.6}} blink={blinkAt(f, 55, 40)} />
      <Card x={540} y={680} w={560} h={420} scale={pop(f, card, fps)}>
        <text x={0} y={-130} textAnchor="middle" dominantBaseline="middle" fontFamily={FONT} fontWeight={900} fontSize={80} fill={C.ink}>401(k)</text>
        {[0, 1, 2, 3].map((i) => {
          const hgt = (120 + i * 40) * (i === 3 ? shrink : i === 2 ? Math.min(1, shrink * 1.3) : 1);
          return <rect key={i} x={-190 + i * 100} y={150 - hgt} width={70} height={hgt} rx={14} fill={i >= 2 ? C.orange : C.green} />;
        })}
      </Card>
      <PopText text="投资者都在问" x={540} y={290} start={T(80.6)} end={T(83.3)} size={96} />
      <PopText text="什么时候回本？" x={540} y={290} start={T(83.45)} end={card - 2} size={104} />
      <PopText text="打开养老账户…" x={540} y={290} start={card} size={96} />
    </Stage>
  );
};

// ---------- 15. Fun fact: Oct 29 — same date as the 1929 crash. Right? Right? ----------
const S15: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const c1 = T(90.84);
  const c2 = T(94.46);
  const smug = T(99.77);
  const r1 = T(101.66);
  const r2 = T(102.75);
  const look = f < c2 ? {x: -1, y: -0.4} : f < smug ? darting(f, fps, [{x: -1, y: -0.4}, {x: 1, y: -0.4}], 30) : {x: 0, y: 0};
  const expr = f < smug ? 'look' : f < r1 ? 'calm' : f < r2 ? 'look' : 'shocked';
  return (
    <Stage bg={C.charcoal}>
      <CalendarCard x={280} y={830} date="10.29" year="谷歌最惨日" rotate={-5} scale={pop(f, c1, fps)} top={C.blue} topShade={C.blueShade} />
      <CalendarCard x={800} y={830} date="10.29" year="1929 股灾" rotate={5} scale={pop(f, c2, fps)} />
      <PopText text="=" x={540} y={850} start={T(95.6)} size={140} color={C.yellow} />
      <Tag text="大萧条的开端" x={800} y={1110} start={T(97.2)} bg={C.orange} size={44} />
      <Character shape="circle" w={220} h={220} color={C.yellow} shade={C.yellowShade} x={540 + (f >= r2 ? shake(f, 6) : 0)} y={G - 110 + hop(f, r2, 10, 50)}
        expression={expr} look={look} blink={expr === 'look' ? blinkAt(f, 72, 30) : 0}
        squash={f < r1 ? breathe(f, fps) : landSquash(f, r1, fps, 0.15) * landSquash(f, r2 + 10, fps, 0.2)} />
      <PopText text="冷知识" x={540} y={300} start={T(89.44)} end={smug - 2} size={130} color={C.yellow} />
      <PopText text="绝非巧合……" x={540} y={270} start={smug} size={110} color="#FFFFFF" />
      <PopText text="对吧？" x={540} y={400} start={r1} size={110} color={C.yellow} />
      <PopText text="真的对吧？" x={540} y={520} start={r2} size={110} color={C.orange} />
    </Stage>
  );
};

// ---------- 16. Not financial advice. I can barely afford eggs. ----------
const S16: React.FC<SceneProps> = ({s}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const T = mkT(s);
  const eggs = T(107.26);
  return (
    <Stage bg={C.offWhite}>
      <circle cx={540} cy={960} r={ci(f, [6, 40], [0, 300], EASE)} fill={C.lightGray} />
      <Character shape="egg" w={300} h={380} color="#FFFFFF" shade={C.grayShade} x={540} y={960 + 10 * Math.sin(f / 12)}
        squash={f < eggs ? breathe(f, fps, 2, 0, 0.03) : landSquash(f, eggs, fps, 0.18)}
        expression={f < eggs ? 'calm' : 'shocked'} look={{x: 0.7, y: -0.6}} />
      <ArcText text="以上不构成投资建议" cx={540} cy={960} r={330} start={T(105.47)} size={66} degPerChar={13} color={C.night} />
      <g transform={`rotate(12 820 1100)`}>
        <Tag text="¥¥¥" x={820} y={1100} start={eggs + 4} bg={C.orange} size={60} />
      </g>
      <PopText text="鸡蛋：买不起" x={540} y={1380} start={eggs + 8} size={70} color={C.orangeShade} />
    </Stage>
  );
};

// ---------- timeline ----------
const SCENES: {s: number; C: React.FC<SceneProps>; reveal: RevealKind; cx?: number; cy?: number}[] = [
  {s: 0, C: S1, reveal: 'circle'},
  {s: 7.45, C: S2, reveal: 'wipeUp'},
  {s: 12.95, C: S3, reveal: 'circle', cx: 640, cy: 1200},
  {s: 17.4, C: S4, reveal: 'wave'},
  {s: 24.5, C: S5, reveal: 'wave'},
  {s: 31.9, C: S6, reveal: 'circle', cx: 560, cy: 1140},
  {s: 38.0, C: S7, reveal: 'wipeUp'},
  {s: 43.4, C: S8, reveal: 'circle', cx: 720, cy: 1050},
  {s: 47.3, C: S9, reveal: 'wave'},
  {s: 52.5, C: S10, reveal: 'wipeUp'},
  {s: 60.7, C: S11, reveal: 'circle', cx: 540, cy: 1200},
  {s: 68.85, C: S12, reveal: 'wave'},
  {s: 75.0, C: S13, reveal: 'circle', cx: 540, cy: 830},
  {s: 80.45, C: S14, reveal: 'wipeUp'},
  {s: 89.3, C: S15, reveal: 'wave'},
  {s: 104.4, C: S16, reveal: 'circle', cx: 540, cy: 960},
];
export const AI_BUBBLE_END = 109.3;
export const AI_BUBBLE_FRAMES = fr(AI_BUBBLE_END);

const CUES: Cue[] = [
  {s: 0.1, e: 2.6, en: "China's AI bubble just popped.", zh: '中国的 AI 泡沫刚刚破了。'},
  {s: 2.6, e: 5.2, en: "Here's why the United States might be next,", zh: '下面说说为什么美国可能是下一个，'},
  {s: 5.2, e: 7.45, en: 'and that reason might be Google.', zh: '而原因可能就是谷歌。'},
  {s: 7.45, e: 12.9, en: "China's STAR 50 AI tech index fell about 40% in under four months.", zh: '中国科创50 AI 科技指数不到四个月下跌约 40%，'},
  {s: 12.9, e: 17.3, en: 'Around $480 billion in market value, gone.', zh: '约 4800 亿美元市值就此蒸发。'},
  {s: 17.3, e: 22.5, en: 'At the peak, investors were paying nearly 250 times annual profits.', zh: '在最高点，投资者愿意付出近 250 倍的年利润。'},
  {s: 22.5, e: 24.45, en: "That's not cheap optimism.", zh: '这可不是便宜的乐观。'},
  {s: 24.45, e: 28.3, en: 'Following this in the United States, yesterday, Alphabet,', zh: '紧接着在美国，昨天，Alphabet——'},
  {s: 28.3, e: 31.85, en: "Google's parent company, had its worst trading day ever.", zh: '谷歌的母公司，迎来了史上最惨交易日。'},
  {s: 31.85, e: 34.4, en: 'Its stock fell as much as 16%,', zh: '股价一度暴跌 16%，'},
  {s: 34.4, e: 37.95, en: 'wiping out more than $500 billion in market value.', zh: '抹去了超过 5000 亿美元的市值。'},
  {s: 37.95, e: 41.0, en: 'What spooked investors? Massive spending,', zh: '是什么吓到了投资者？巨额支出，'},
  {s: 41.0, e: 43.4, en: 'and a problem with the business paying for it.', zh: '以及为它买单的业务出了问题。'},
  {s: 43.4, e: 47.3, en: 'Google says its AI mode shows fewer ads than traditional search.', zh: '谷歌表示，AI 模式展示的广告比传统搜索更少。'},
  {s: 47.3, e: 50.1, en: 'So Google built an AI that answers questions…', zh: '所以谷歌造了一个会回答问题的 AI……'},
  {s: 50.1, e: 52.5, en: "and raises one: where's the ad money?", zh: '却也抛出一个问题：广告钱在哪？'},
  {s: 52.5, e: 56.7, en: 'Meanwhile, Alphabet expects to spend up to $205 billion', zh: '与此同时，Alphabet 预计今年最多投入 2050 亿美元'},
  {s: 56.7, e: 59.65, en: 'on infrastructure this year as it races into AI.', zh: '建设基础设施，全力冲刺 AI。'},
  {s: 59.65, e: 60.75, en: 'And the timing?', zh: '再看看时机：'},
  {s: 60.75, e: 64.7, en: 'Anthropic, the company behind Claude, just filed to go public.', zh: 'Claude 背后的公司 Anthropic 刚刚提交了上市申请，'},
  {s: 64.7, e: 68.8, en: 'OpenAI, behind ChatGPT, is planning its own debut later.', zh: 'ChatGPT 背后的 OpenAI 也计划稍后上市。'},
  {s: 68.8, e: 71.6, en: 'So while investors are questioning the AI bill,', zh: '所以，就在投资者质疑 AI 这笔账单时，'},
  {s: 71.6, e: 74.95, en: 'more AI companies are getting ready to pass around the collection plate.', zh: '更多 AI 公司正准备“传盘子”找钱。'},
  {s: 74.95, e: 77.95, en: "Does that mean America's AI bubble is bursting?", zh: '这是否意味着美国的 AI 泡沫正在破裂？'},
  {s: 77.95, e: 80.45, en: 'Not necessarily. Not yet, anyways.', zh: '未必。至少现在还没有。'},
  {s: 80.45, e: 83.4, en: 'But investors are all asking the same question:', zh: '但投资者都在问同一个问题：'},
  {s: 83.4, e: 85.5, en: 'when does all this spending pay off?', zh: '这些投入到底什么时候才能回本？'},
  {s: 85.5, e: 89.3, en: "That's when people start checking their 401(k)s.", zh: '这时候，人们就开始查看自己的 401(k) 养老账户了。'},
  {s: 89.3, e: 90.75, en: 'And fun fact:', zh: '冷知识：'},
  {s: 90.75, e: 94.4, en: "Google's worst day ever happened on October 29th,", zh: '谷歌史上最惨的一天发生在 10 月 29 日，'},
  {s: 94.4, e: 99.65, en: 'the exact same date as the 1929 stock market crash that started the Great Depression.', zh: '正好和 1929 年引发大萧条的股市崩盘是同一天。'},
  {s: 99.65, e: 101.6, en: "But I'm sure that's no coincidence,", zh: '但我相信，这绝不是巧合，'},
  {s: 101.6, e: 102.6, en: 'right?', zh: '对吧？'},
  {s: 102.6, e: 104.4, en: 'Right?', zh: '真的……对吧？'},
  {s: 104.4, e: 105.4, en: 'Anyways,', zh: '总之，'},
  {s: 105.4, e: 107.2, en: "this isn't financial advice.", zh: '以上不构成投资建议。'},
  {s: 107.2, e: AI_BUBBLE_END, en: 'I can barely afford eggs.', zh: '我连鸡蛋都快买不起了。'},
];

const OVERLAP = 16; // frames the outgoing scene keeps playing under the incoming reveal

export const AiBubble: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: C.offWhite}}>
    {SCENES.map((sc, i) => {
      const from = fr(sc.s);
      const next = i + 1 < SCENES.length ? fr(SCENES[i + 1].s) : AI_BUBBLE_FRAMES;
      const dur = next - from + (i + 1 < SCENES.length ? OVERLAP : 0);
      const Comp = sc.C;
      return (
        <Sequence key={i} from={from} durationInFrames={dur}>
          {i === 0 ? (
            <Comp s={sc.s} />
          ) : (
            <Reveal kind={sc.reveal} cx={sc.cx} cy={sc.cy} width={W} height={H}>
              <Comp s={sc.s} />
            </Reveal>
          )}
        </Sequence>
      );
    })}
    <Captions cues={CUES} />
    <Audio src={narration} />
  </AbsoluteFill>
);

