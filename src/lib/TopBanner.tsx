import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT_JA} from '../theme';

export type BannerPhase = {
  from: number; // global frame this text takes over
  main: React.ReactNode; // big line (yellow)
  sub?: React.ReactNode; // second line (white)
  mainSize?: number;
};

/**
 * TikTok hook banner for the top safe area (≈12–26% of a 1080×1920 frame): a dark card with a series tag
 * and a big high-contrast hook. Phase changes are hard cuts with a small pop — the first phase is fully
 * visible on frame 0 so the first frame works as the cover.
 */
export const TopBanner: React.FC<{tag: string; phases: BannerPhase[]; top?: number; height?: number}> = ({tag, phases, top = 250, height = 250}) => {
  const f = useCurrentFrame();
  const {fps, width: W} = useVideoConfig();
  let idx = 0;
  phases.forEach((p, i) => {
    if (f >= p.from) idx = i;
  });
  const p = phases[idx];
  const k = idx === 0 ? 1 : spring({frame: f - p.from, fps, config: {damping: 11, stiffness: 260}});
  const s = 0.86 + 0.14 * k;
  return (
    <div style={{position: 'absolute', top, left: 40, width: W - 80, height}}>
      <div style={{position: 'absolute', inset: 0, top: 12, left: 12, borderRadius: 44, background: C.charcoalShade}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 44, background: C.charcoal}} />
      <div style={{position: 'absolute', top: -30, left: 0, width: '100%', textAlign: 'center'}}>
        <span style={{display: 'inline-block', padding: '8px 30px', borderRadius: 40, background: C.yellow, color: C.ink, fontFamily: FONT_JA, fontWeight: 900, fontSize: 40, letterSpacing: 1}}>
          {tag}
        </span>
      </div>
      <div style={{position: 'absolute', top: 46, width: '100%', textAlign: 'center', transform: `scale(${s})`}}>
        <div style={{fontFamily: FONT_JA, fontWeight: 900, fontSize: p.mainSize ?? 86, lineHeight: 1.15, color: C.yellow}}>{p.main}</div>
        {p.sub && <div style={{marginTop: 14, fontFamily: FONT_JA, fontWeight: 900, fontSize: 58, lineHeight: 1.2, color: '#FFFFFF'}}>{p.sub}</div>}
      </div>
    </div>
  );
};
