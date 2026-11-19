import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

// Shape of public/audio/<slug>/timeline.json written by scripts/tts_elevenlabs.py
export type VoiceSegment = {id: string; file: string; start_s: number; duration_s: number; text: string; gap_after_s?: number};
export type VoiceTimeline = {slug: string; gap_s: number; total_s: number; segments: VoiceSegment[]};

export const LEAD_IN_S = 0.5; // silence before the first line
export const TAIL_S = 1.5; // hold after the last line

const sec = (s: number, fps: number) => Math.round(s * fps);

/** Total composition length in frames for a timeline. */
export const timelineFrames = (tl: VoiceTimeline, fps: number) => sec(LEAD_IN_S + tl.total_s + TAIL_S, fps);

/**
 * Frame window for a scene that covers one or more voice segments.
 * The scene starts with its first segment and runs until the next scene's first segment
 * (or the end of the video), so cuts land between sentences.
 */
export const sceneWindow = (tl: VoiceTimeline, fps: number, ids: string[]) => {
  const segs = tl.segments;
  const first = segs.findIndex((s) => s.id === ids[0]);
  const last = segs.findIndex((s) => s.id === ids[ids.length - 1]);
  if (first < 0 || last < 0) throw new Error(`Unknown segment ids: ${ids.join(',')}`);
  const start = first === 0 ? 0 : LEAD_IN_S + segs[first].start_s;
  const end = last === segs.length - 1 ? LEAD_IN_S + tl.total_s + TAIL_S : LEAD_IN_S + segs[last + 1].start_s;
  return {from: sec(start, fps), durationInFrames: sec(end, fps) - sec(start, fps)};
};

/** Frame (relative to the video start) at which a segment's line begins. */
export const lineStart = (tl: VoiceTimeline, fps: number, id: string) => {
  const s = tl.segments.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown segment id: ${id}`);
  return sec(LEAD_IN_S + s.start_s, fps);
};

/** Plays every voice segment at its timeline position. */
export const VoiceTrack: React.FC<{tl: VoiceTimeline; fps: number; volume?: number}> = ({tl, fps, volume = 1}) => (
  <>
    {tl.segments.map((s) => (
      <Sequence key={s.id} from={sec(LEAD_IN_S + s.start_s, fps)} durationInFrames={sec(s.duration_s, fps) + 2}>
        <Audio src={staticFile(s.file)} volume={volume} />
      </Sequence>
    ))}
  </>
);

// Per-frame loudness written by scripts/envelope.py (public/audio/<slug>/envelope.json)
export type VoiceEnvelope = {fps: number; segments: Record<string, number[]>};

/**
 * Mouth openness (0..1) at a global frame, from the loudness of whichever of `ids` is playing.
 * Lightly smoothed so the mouth doesn't flicker.
 */
export const talkLevel = (tl: VoiceTimeline, env: VoiceEnvelope, fps: number, frame: number, ids?: string[]) => {
  for (const s of tl.segments) {
    if (ids && !ids.includes(s.id)) continue;
    const vals = env.segments[s.id];
    if (!vals) continue;
    const i = frame - sec(LEAD_IN_S + s.start_s, fps);
    if (i < 0 || i >= vals.length) continue;
    const a = vals[i] ?? 0;
    const b = vals[i - 1] ?? a;
    const v = (a * 2 + b) / 3;
    return v < 0.15 ? 0 : Math.min(1, v * 1.1);
  }
  return 0;
};
