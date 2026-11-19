import React from 'react';
import {AbsoluteFill, Easing, interpolate, Sequence, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Character, CharacterProps} from './Character';
import {C} from './theme';
import {ArcText} from './lib/ArcText';

const W = 1920;
const H = 1080;

// Blink curve: closes and reopens over ~6 frames, every `period` frames
const blinkAt = (f: number, period: number, offset = 0) => {
  const t = (f + offset) % period;
  return t < 6 ? 1 - Math.abs(t - 3) / 3 : 0;
};

// Pupils dart between targets, holding each for `hold` frames
const darting = (f: number, fps: number, targets: {x: number; y: number}[], hold: number, offset = 0) => {
  const idx = Math.floor((f + offset) / hold);
  const local = (f + offset) % hold;
  const a = targets[(idx - 1 + targets.length) % targets.length];
  const b = targets[idx % targets.length];
  const k = spring({frame: local, fps, config: {damping: 14, stiffness: 220}});
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
};

// ---------------- Scene 1: crowded, "no space" ----------------
const Crowd: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const breathe = (speed: number, phase: number, amt = 0.03) => 1 + amt * Math.sin((f / fps) * speed + phase);
  const pressure = interpolate(f, [0, 95], [1, 1.07], {extrapolateRight: 'clamp'}); // shapes slowly crowd in

  // Yellow hero grows to fill the frame as the transition
  const grow = interpolate(f, [95, 135], [1, 9], {easing: Easing.bezier(0.65, 0, 0.35, 1), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const strainedPulse = 1 + 0.06 * Math.max(0, Math.sin((f / fps) * 5));

  const cast: CharacterProps[] = [
    {shape: 'circle', w: 330, h: 330, color: C.orange, shade: C.orangeShade, x: 230, y: 230, expression: 'sad', squash: breathe(2.2, 0)},
    {shape: 'capsule', w: 900, h: 230, color: C.green, shade: C.greenShade, x: 470, y: 520, rotate: -32, expression: 'strained', squash: strainedPulse, faceOffset: {x: -170, y: 0}, faceSize: 150},
    {shape: 'dome', w: 640, h: 330, color: C.blue, shade: C.blueShade, x: 1290, y: 300, rotate: 28, expression: 'sad', faceSize: 190, squash: breathe(1.6, 1)},
    {shape: 'circle', w: 200, h: 200, color: C.purple, shade: C.purpleShade, x: 1700, y: 140, expression: 'look', look: darting(f, fps, [{x: -1, y: 0}, {x: 1, y: 0.3}, {x: 0, y: -1}], 28), blink: blinkAt(f, 70, 20)},
    {shape: 'capsule', w: 150, h: 470, color: C.orange, shade: C.orangeShade, x: 1820, y: 580, noFace: true},
    {shape: 'roundRect', w: 470, h: 330, color: C.pink, shade: C.pinkShade, x: 640, y: 890, rotate: 4, expression: 'sad', faceSize: 170, squash: breathe(1.9, 2)},
    {shape: 'roundRect', w: 380, h: 300, color: C.lightGray, shade: C.grayShade, x: 1260, y: 760, rotate: 35, expression: 'strained', faceSize: 130},
    {shape: 'triangle', w: 330, h: 290, color: C.green, shade: C.greenShade, x: 1670, y: 930, expression: 'look', look: darting(f, fps, [{x: 0.8, y: -0.6}, {x: -0.8, y: -0.6}], 34, 10), blink: blinkAt(f, 60)},
    {shape: 'circle', w: 220, h: 220, color: C.lightBlue, shade: C.lightBlueShade, x: 140, y: 920, noFace: true},
    {shape: 'halfPill', w: 260, h: 340, color: C.lightBlue, shade: C.lightBlueShade, x: 740, y: 60, rotate: 180, noFace: true},
    {shape: 'circle', w: 230, h: 230, color: C.blue, shade: C.blueShade, x: 1010, y: 1060, noFace: true},
  ];

  return (
    <AbsoluteFill style={{backgroundColor: C.offWhite}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <g transform={`translate(${W / 2} ${H / 2}) scale(${pressure}) translate(${-W / 2} ${-H / 2})`}>
          {cast.map((c, i) => (
            <Character key={i} {...c} />
          ))}
        </g>
        {/* Yellow hero: looks around, squints, then swells to fill the screen */}
        <g transform={`translate(${W / 2 - 30} ${H / 2 - 20}) scale(${grow}) translate(${-(W / 2 - 30)} ${-(H / 2 - 20)})`}>
          <Character
            shape="circle" w={300} h={300} color={C.yellow} shade={C.yellowShade} x={W / 2 - 30} y={H / 2 - 20}
            expression={f < 70 ? 'look' : 'strained'}
            look={darting(f, fps, [{x: -1, y: 0.2}, {x: 1, y: 0.2}, {x: 0, y: -0.8}], 22)}
            blink={blinkAt(f, 55, 30)}
            squash={f < 70 ? breathe(2.5, 0.5) : 1 + 0.08 * Math.sin((f / fps) * 14)}
            noFace={grow > 2.5}
          />
        </g>
      </svg>
    </AbsoluteFill>
  );
};

// ---------------- Scene 2: calm, "a little space" ----------------
const wavePath = (yBase: number, amp: number, len: number, phase: number) => {
  let d = `M -20 ${H + 20} L -20 ${yBase}`;
  for (let x = -20; x <= W + 20; x += 20) {
    d += ` L ${x} ${yBase + amp * Math.sin((x / len) * Math.PI * 2 + phase)}`;
  }
  return d + ` L ${W + 20} ${H + 20} Z`;
};

const Calm: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const rise = spring({frame: f, fps, config: {damping: 18, stiffness: 60}});
  const waveY = (base: number) => H + 300 - (H + 300 - base) * rise;

  // Hero drops in, lands on the wave with squash & a small rebound
  const landF = 42;
  const restY = 640;
  const dropY = interpolate(f, [12, landF], [-300, restY], {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const impact = f >= landF ? spring({frame: f - landF, fps, config: {damping: 7, stiffness: 260}}) : 0;
  const squash = f < landF ? interpolate(f, [12, landF], [1, 0.86], {extrapolateLeft: 'clamp'}) : 1 + 0.28 * Math.sin(impact * Math.PI) * (1 - impact * 0.6);
  const bob = f > landF + 20 ? 10 * Math.sin((t - (landF + 20) / fps) * 2.4) : 0;
  const expression = f < landF + 22 ? 'look' : 'calm';

  return (
    <AbsoluteFill style={{backgroundColor: C.yellow}}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <circle cx={W / 2} cy={restY - 40} r={interpolate(f, [60, 110], [0, 420], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)})} fill="#FFE45C" />
        <ArcText text="深呼吸，给自己一点空间" cx={W / 2} cy={restY + 20} r={480} start={70} />
        <path d={wavePath(waveY(760), 26, 900, t * 1.6)} fill={C.lightBlue} />
        <Character shape="triangle" w={330} h={290} color={C.green} shade={C.greenShade} x={W / 2} y={dropY + bob - 145 + 145}
          rotate={f < landF ? interpolate(f, [12, landF], [-25, 0], {extrapolateLeft: 'clamp'}) : 0}
          squash={squash} expression={expression} look={{x: 0, y: 1}} blink={f >= landF + 16 && f < landF + 22 ? 1 : 0} faceSize={170} />
        <path d={wavePath(waveY(830), 30, 1100, t * 1.2 + 1)} fill={C.blue} />
        <path d={wavePath(waveY(930), 24, 800, t * 1.9 + 2)} fill={C.blueShade} />
      </svg>
    </AbsoluteFill>
  );
};

export const Demo: React.FC = () => (
  <AbsoluteFill>
    <Sequence durationInFrames={135}>
      <Crowd />
    </Sequence>
    <Sequence from={135} durationInFrames={165}>
      <Calm />
    </Sequence>
  </AbsoluteFill>
);
