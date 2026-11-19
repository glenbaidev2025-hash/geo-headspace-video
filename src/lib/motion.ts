import {Easing, interpolate, spring} from 'remotion';

/** Blink curve: closes and reopens over ~6 frames, every `period` frames. 0 = open, 1 = closed. */
export const blinkAt = (f: number, period: number, offset = 0) => {
  const t = (((f + offset) % period) + period) % period;
  return t < 6 ? 1 - Math.abs(t - 3) / 3 : 0;
};

/** Slow 2–3% breathing, as a squash value around 1. */
export const breathe = (f: number, fps: number, speed = 2.2, phase = 0, amt = 0.025) => 1 + amt * Math.sin((f / fps) * speed + phase);

/** Pupils dart between targets, holding each for `hold` frames. */
export const darting = (f: number, fps: number, targets: {x: number; y: number}[], hold: number, offset = 0) => {
  const idx = Math.floor((f + offset) / hold);
  const local = (f + offset) % hold;
  const a = targets[(((idx - 1) % targets.length) + targets.length) % targets.length];
  const b = targets[((idx % targets.length) + targets.length) % targets.length];
  const k = spring({frame: local, fps, config: {damping: 14, stiffness: 220}});
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
};

/**
 * Drop-and-land: falls from `fromY` to `toY` between `start` and `land` (ease-in),
 * stretches while falling, squashes on impact and settles with a small rebound.
 */
export const landing = (f: number, fps: number, start: number, land: number, fromY: number, toY: number, amt = 0.26) => {
  const y = interpolate(f, [start, land], [fromY, toY], {easing: Easing.in(Easing.quad), extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  if (f < land) return {y, squash: interpolate(f, [start, land], [1, 0.88], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})};
  const k = spring({frame: f - land, fps, config: {damping: 7, stiffness: 260}});
  return {y, squash: 1 + amt * Math.sin(k * Math.PI) * (1 - k * 0.6)};
};

/** Quick squash pulse (0→peak→0) starting at `at`, for jolts, chuckles and slumps. */
export const pulse = (f: number, fps: number, at: number, amt = 0.12) => {
  if (f < at) return 1;
  const k = spring({frame: f - at, fps, config: {damping: 8, stiffness: 240}});
  return 1 + amt * Math.sin(k * Math.PI) * (1 - k * 0.5);
};

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
