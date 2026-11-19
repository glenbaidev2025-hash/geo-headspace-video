import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {C, FONT} from './theme';

export type Cue = {s: number; e: number; en?: string; zh: string}; // seconds

/** Burned-in captions (bilingual or Chinese only), cut on sentence boundaries. */
export const Captions: React.FC<{cues: Cue[]; bottom?: number; zhSize?: number; enSize?: number; maxWidth?: number}> = ({
  cues, bottom = 150, zhSize = 50, enSize = 34, maxWidth = 1000,
}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = f / fps;
  const cue = cues.find((c) => t >= c.s && t < c.e);
  if (!cue) return null;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: bottom, pointerEvents: 'none'}}>
      <div style={{maxWidth, padding: '22px 34px', borderRadius: 34, backgroundColor: 'rgba(43,38,35,0.86)', textAlign: 'center'}}>
        <div style={{fontFamily: FONT, fontWeight: 900, fontSize: zhSize, lineHeight: 1.3, color: '#FFFFFF'}}>{cue.zh}</div>
        {cue.en && (
          <div style={{fontFamily: FONT, fontWeight: 700, fontSize: enSize, lineHeight: 1.3, color: C.yellow, marginTop: 8}}>{cue.en}</div>
        )}
      </div>
    </AbsoluteFill>
  );
};
