import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';

// Shape of public/audio/<slug>/timeline.json written by scripts/tts_elevenlabs.py
export type VoiceSegment = {id: string; file: string; start_s: number; duration_s: number; text: string};
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
