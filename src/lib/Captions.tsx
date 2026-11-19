import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_EN, FONT_JA} from '../theme';

type Props = {
  en: string;
  ja?: string;
  start: number; // frame (in the current Sequence) when the English line appears
  end?: number; // frame when the caption leaves (default: stays)
  jaDelay?: number; // frames the Japanese line waits after the English (e.g. punchlines)
  /** Phrases inside `en` to highlight as they are spoken. */
  highlight?: string[];
  /** Spoken span of the line in frames, used to time highlights by character position. */
  spokenFrames?: number;
  top: number; // px from the top of the frame
  color?: string;
  jaColor?: string;
  hlBg?: string;
  hlColor?: string;
  enSize?: number;
  jaSize?: number;
  width?: number;
};

/** Bilingual caption block (EN above, JA below) for learner videos; pops in, highlights key phrases. */
export const Captions: React.FC<Props> = ({
  en, ja, start, end, jaDelay = 4, highlight = [], spokenFrames = 60, top, color = C.ink, jaColor, hlBg = C.blue, hlColor = '#FFFFFF',
  enSize = 58, jaSize = 44, width = 900,
}) => {
  const f = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  if (f < start || (end !== undefined && f >= end)) return null;
  const inEn = spring({frame: f - start, fps, config: {damping: 14, stiffness: 200}});
  const inJa = spring({frame: f - start - jaDelay, fps, config: {damping: 14, stiffness: 200}});
  const out = end !== undefined ? interpolate(f, [end - 5, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) : 1;

  // Split EN into plain / highlighted runs
  const runs: {text: string; hl: boolean; at: number}[] = [];
  let i = 0;
  const ranges = highlight
    .map((h) => ({idx: en.indexOf(h), len: h.length}))
    .filter((r) => r.idx >= 0)
    .sort((a, b) => a.idx - b.idx);
  for (const r of ranges) {
    if (r.idx > i) runs.push({text: en.slice(i, r.idx), hl: false, at: 0});
    runs.push({text: en.slice(r.idx, r.idx + r.len), hl: true, at: start + Math.round((r.idx / en.length) * spokenFrames)});
    i = r.idx + r.len;
  }
  if (i < en.length) runs.push({text: en.slice(i), hl: false, at: 0});

  return (
    <div style={{position: 'absolute', top, left: (W - width) / 2, width, textAlign: 'center', opacity: out}}>
      <div style={{fontFamily: FONT_EN, fontWeight: 900, fontSize: enSize, lineHeight: 1.3, color, transform: `translateY(${(1 - inEn) * 30}px) scale(${0.9 + 0.1 * inEn})`, opacity: Math.min(1, inEn * 1.4)}}>
        {runs.map((r, k) => {
          if (!r.hl) return <span key={k}>{r.text}</span>;
          const p = spring({frame: f - r.at, fps, config: {damping: 12, stiffness: 220}});
          return (
            <span key={k} style={{display: 'inline-block', padding: '0 14px', margin: '0 2px', borderRadius: 18, background: p > 0.02 ? hlBg : 'transparent', color: p > 0.02 ? hlColor : color, transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, p) * Math.PI)})`}}>
              {r.text}
            </span>
          );
        })}
      </div>
      {ja && (
        <div style={{marginTop: 18, fontFamily: FONT_JA, fontWeight: 900, fontSize: jaSize, lineHeight: 1.35, color: jaColor ?? color, opacity: Math.min(1, inJa * 1.4) * 0.85, transform: `translateY(${(1 - inJa) * 20}px)`}}>
          {ja}
        </div>
      )}
    </div>
  );
};

/**
 * Narration subtitles: shows one chunk at a time. `chunks[].at` is seconds from `start`
 * (take them from pauses in the voice, e.g. ffmpeg silencedetect).
 */
export const NarrationSubs: React.FC<{
  chunks: {at: number; text: string}[];
  start: number;
  end: number;
  top: number;
  color?: string;
  size?: number;
  width?: number;
  fontFamily?: string;
}> = ({chunks, start, end, top, color = C.ink, size = 42, width = 1500, fontFamily = FONT_JA}) => {
  const f = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  if (f < start || f >= end) return null;
  const t = (f - start) / fps;
  let idx = -1;
  chunks.forEach((c, i) => {
    if (t >= c.at) idx = i;
  });
  if (idx < 0) return null;
  const k = spring({frame: f - start - Math.round(chunks[idx].at * fps), fps, config: {damping: 16, stiffness: 240}});
  const out = interpolate(f, [end - 5, end], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top, left: (W - width) / 2, width, textAlign: 'center', fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.35, color, opacity: Math.min(1, k * 1.5) * out, transform: `translateY(${(1 - k) * 14}px)`}}>
      {chunks[idx].text}
    </div>
  );
};
