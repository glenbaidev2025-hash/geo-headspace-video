# geo-headspace-video

用 Remotion 写代码，制作扁平几何角色风格的动画视频：彩色几何形状作为角色，带表情和动作，配合文案和口播。

## 先读这些
- `docs/style-bible.md`：风格规范，包括配色、形状、表情、动画语言、声音。所有新视频都必须遵守。
- `src/theme.ts`：调色板与字体。
- `src/Character.tsx`：几何角色组件（6 种形状，自动生成同色系深色侧面，支持挤压、旋转和表情）。
- `src/Face.tsx`：参数化表情（sad / strained / look / happy / calm / sleepy，支持眨眼和眼珠移动）。
- `docs/voiceover-script.md`：口播脚本规范（ElevenLabs Audio Tags 写法、情绪弧线对应的标签、JSON 格式）。
- `src/lib/voice.tsx`：读取配音时间轴，把场景和动作对齐到口播。
- `src/Demo.tsx`：参考实现（拥挤场景 → 放大铺满转场 → 平静场景 + 弧形文字），可以照着写新场景。

## 从文案到视频的流程
1. **确认输入**：文案（或口播音频）、画幅（16:9 横屏 1920×1080，或 9:16 竖屏 1080×1920）、配音方式（用户自己录，或 TTS）。
2. **分镜**：按句子切成场景。每个场景写明：情绪（困境/转折/治愈）、出场角色（形状+颜色）、表情、动作、转场、屏幕文字。先把分镜表发给用户确认。
3. **配音与时间轴**：
   - **没有音频（默认走 ElevenLabs）**：按 `docs/voiceover-script.md` 把文案改写成带 Audio Tags 的口播脚本 `voice/<slug>.json`，每个片段对应一个场景（S01、S02……）。先把脚本发给用户确认。
     - 生成音频：用户 Mac 上有一份本工程的副本，在 `/Users/glen/Documents/Projects/HeadspaceOutputs/geo-headspace-video`，它的 `.env` 里有 ElevenLabs key（有 TTS 和读取声音列表的权限）。Claude 用 device_bash 在这份副本里运行 `python3 scripts/tts_elevenlabs.py voice/<slug>.json`：先用 device_commit_files 把 `voice/<slug>.json` 写进去，跑完后用 device_stage_files 把 `public/audio/<slug>/` 拉回云端的工作副本。不要读取或打印 key。
     - 网络不通（403）时，请用户在 claude.ai/settings/capabilities → Code execution → Allow network egress 里允许 `api.elevenlabs.io`，或者让用户自己在终端跑这条命令。
     - 默认声音：男声 George（`JBFqnCBsd6RMkjVDRZzb`），女声 Sarah（`EXAVITQu4vr4xnSDxMaL`），见 `docs/voiceover-script.md`。
   - **用户自己录的口播**：按句切成 `S01.mp3`、`S02.mp3`……放进 `public/audio/<slug>/`，再写好 `voice/<slug>.json`（text 填原句即可），运行 `--timeline-only` 生成 `timeline.json`。
   - Remotion 侧用 `src/lib/voice.tsx`：`VoiceTrack` 播放配音，`sceneWindow` 给出每个场景的帧区间，`lineStart` 给出某句开始的帧，动作和文字都卡在这些帧上（fps 30）。
4. **实现**：每条视频建一个文件 `src/videos/<slug>.tsx`，在 `src/index.ts` 里注册 Composition。优先复用 `Character`/`Face`；新形状或新动作先加到组件里，再在视频里使用。音频用 Remotion 的 `<Audio>`。
5. **自检**：用 `npm run still -- <Comp> out/x.png --frame=N` 在每个场景中点截图，对照 style-bible 的 5 个关键细节检查。
6. **渲染**：`npm run render -- <Comp> out/<slug>.mp4 --codec=h264 --crf=20`，然后把成片发给用户。

## 规则
- 不使用任何真实品牌的角色、标语和标识（参考片 Headspace 的橙色笑脸球、标语、字标都不用）。
- 中文字体用 Noto Sans CJK SC / PingFang SC，粗体（weight 900）。
- 不要往仓库提交 `out/` 和 `node_modules/`。

## 命令
```bash
npm install
npm run studio                       # 浏览器里预览和调试
npm run render -- Demo out/demo.mp4  # 渲染
```
无头 Linux 环境需要指定 Chrome：`--browser-executable=/usr/bin/google-chrome`。
