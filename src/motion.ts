// Reusable motion helpers (style-bible §3: squash & stretch, breathing, blinking, weighty landings)
import {Easing, interpolate, spring} from 'remotion';

export const EASE = Easing.bezier(0.22, 1, 0.36, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);

/** Clamped interpolate. */
export const ci = (f: number, input: number[], output: number[], easing?: (t: number) => number) =>
  interpolate(f, input, output, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});

/** Blink curve: closes and reopens over ~6 frames every `period` frames. */
export const blinkAt = (f: number, period: number, offset = 0) => {
  const t = (((f + offset) % period) + period) % period;
  return t < 6 ? 1 - Math.abs(t - 3) / 3 : 0;
};

/** Pupils dart between targets, holding each for `hold` frames. */
export const darting = (f: number, fps: number, targets: {x: number; y: number}[], hold: number, offset = 0) => {
  const idx = Math.floor((f + offset) / hold);
  const local = (f + offset) % hold;
  const a = targets[(idx - 1 + targets.length) % targets.length];
  const b = targets[idx % targets.length];
  const k = spring({frame: local, fps, config: {damping: 14, stiffness: 220}});
  return {x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k};
};

/** Idle breathing: 2–3% slow rise and fall. */
export const breathe = (f: number, fps: number, speed = 2, phase = 0, amt = 0.025) => 1 + amt * Math.sin((f / fps) * speed + phase);

/** Pop-in scale (0 → 1) with a light rebound. */
export const pop = (f: number, start: number, fps: number, stiffness = 200) =>
  f < start ? 0 : spring({frame: f - start, fps, config: {damping: 11, stiffness}});

/** Squash after landing at `landF`: quick flatten then a small rebound (no exaggerated overshoot). */
export const landSquash = (f: number, landF: number, fps: number, amt = 0.25) => {
  if (f < landF) return 1;
  const k = spring({frame: f - landF, fps, config: {damping: 7, stiffness: 260}});
  return 1 + amt * Math.sin(k * Math.PI) * (1 - k * 0.6);
};

/** Fall from y0 to y1 between frames a and b (gravity ease-in). */
export const fall = (f: number, a: number, b: number, y0: number, y1: number) => ci(f, [a, b], [y0, y1], Easing.in(Easing.quad));

/** Small hop arc (0 → peak → 0) over `dur` frames starting at `start`. */
export const hop = (f: number, start: number, dur: number, height: number) => {
  const t = (f - start) / dur;
  return t <= 0 || t >= 1 ? 0 : -height * 4 * t * (1 - t);
};

/** Shake offset for strain / panic. */
export const shake = (f: number, amt: number, speed = 2.3) => amt * Math.sin(f * speed) * Math.cos(f * 0.7);
