import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Demo} from './Demo';
import {Ep02CheckTheTime, EP02_FRAMES} from './videos/ep02-check-the-time';
import {Ep02CheckTheTimeYT, EP02YT_FRAMES} from './videos/ep02-check-the-time-yt';
import {Ep03AboutToLeave, EP03_FRAMES} from './videos/ep03-about-to-leave';
import {Ep04DidntCatchThat, EP04_FRAMES} from './videos/ep04-didnt-catch-that';
import {Ep05WhatShouldIEat, EP05_FRAMES} from './videos/ep05-what-should-i-eat';
import {Ep03AboutToLeaveYT, EP03YT_FRAMES} from './videos/ep03-about-to-leave-yt';
import {Ep05WhatShouldIEatYT, EP05YT_FRAMES} from './videos/ep05-what-should-i-eat-yt';

const Root: React.FC = () =>
  React.createElement(
    React.Fragment,
    null,
    React.createElement(Composition, {id: 'Demo', component: Demo, durationInFrames: 300, fps: 30, width: 1920, height: 1080}),
    React.createElement(Composition, {id: 'Ep05WhatShouldIEat', component: Ep05WhatShouldIEat, durationInFrames: EP05_FRAMES, fps: 30, width: 1080, height: 1920}),
    React.createElement(Composition, {id: 'Ep05WhatShouldIEatYT', component: Ep05WhatShouldIEatYT, durationInFrames: EP05YT_FRAMES, fps: 30, width: 1920, height: 1080}),
    React.createElement(Composition, {id: 'Ep04DidntCatchThat', component: Ep04DidntCatchThat, durationInFrames: EP04_FRAMES, fps: 30, width: 1080, height: 1920}),
    React.createElement(Composition, {id: 'Ep03AboutToLeaveYT', component: Ep03AboutToLeaveYT, durationInFrames: EP03YT_FRAMES, fps: 30, width: 1920, height: 1080}),
    React.createElement(Composition, {id: 'Ep03AboutToLeave', component: Ep03AboutToLeave, durationInFrames: EP03_FRAMES, fps: 30, width: 1080, height: 1920}),
    React.createElement(Composition, {id: 'Ep02CheckTheTimeYT', component: Ep02CheckTheTimeYT, durationInFrames: EP02YT_FRAMES, fps: 30, width: 1920, height: 1080}),
    React.createElement(Composition, {id: 'Ep02CheckTheTime', component: Ep02CheckTheTime, durationInFrames: EP02_FRAMES, fps: 30, width: 1080, height: 1920}),
  );

registerRoot(Root);
