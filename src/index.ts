import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Demo} from './Demo';

const Root: React.FC = () =>
  React.createElement(Composition, {id: 'Demo', component: Demo, durationInFrames: 300, fps: 30, width: 1920, height: 1080});

registerRoot(Root);
