import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Demo} from './Demo';
import {AiBubble, AI_BUBBLE_FRAMES} from './videos/ai-bubble';

const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {id: 'Demo', component: Demo, durationInFrames: 300, fps: 30, width: 1920, height: 1080}),
    React.createElement(Composition, {id: 'AiBubble', component: AiBubble, durationInFrames: AI_BUBBLE_FRAMES, fps: 30, width: 1080, height: 1920}),
  );

registerRoot(Root);
