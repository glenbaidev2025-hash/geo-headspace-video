# 口播脚本规范（ElevenLabs Audio Tags）

没有现成音频时，先把文案或字幕改写成**带情感标注的口播脚本**，再用 ElevenLabs 生成配音。
依据是 ElevenLabs 官方文档（Eleven v4 / v3 的 Audio Tags）。模型和规则可能更新，有疑问时以官方文档为准：
- https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4
- https://elevenlabs.io/docs/best-practices/prompting/eleven-v3
- https://elevenlabs.io/blog/elevenlabs-audio-tags-list

## 1. 模型与基本规则

- 默认模型：`eleven_v4`（最高质量）。`eleven_v4_turbo` 延迟更低，适合实时场景，做视频不需要。普通话的 `language_code` 是 `zh`。
- v4 **不支持 SSML**（`<break>` 等都无效），也没有 Style 和 Speed 滑块。停顿、语速和情绪全靠 Audio Tags、标点和文本结构控制。
- Audio Tag 写在**方括号**里，是自然语言的表演指示，不会被念出来。
- 标签不限于固定列表，可以组合，例如 `[whispering, fearful]`；也可以描述情境或人设。
- 官方提示：标签还不是百分之百可靠，重要片段请多生成几次，挑最好的一版。

## 2. 本项目的写法约定

1. **标签统一用英文**，中文正文照常写。官方示例全部是英文标签；文档没有说明中文标签是否有效，所以不要用中文标签。
2. **标签放在它要影响的句子前面**。叹气、轻笑这类反应可以放在句子后面。
3. **每个片段开头放一个情绪/语气标签**，片段中间最多再加 1～2 个（转折、叹气、停顿）。官方建议标签要少而准：标签和文字情绪不符时（比如不好笑的话配 `[laughs]`），效果会很假。
4. **标签只描述声音**，例如 `[warm, gentle voice]`、`[sighs]`；不要描述音乐、画面或场景调度。
5. 标签要符合所选声音的性格：沉稳的旁白音色不适合太俏皮的标签。
6. **停顿**用 `[short pause]`、`[long pause]`，或者省略号「……」、句号。不要用 `<break>`。
7. **强调**靠标点（！？）和短句。英文单词可以用大写加强语气。
8. 多音字、英文缩写、品牌名念不准时，可以改写成更好读的写法；英文词可以用 IPA，格式是 `"/ˈaɪ.pæd/"`，用斜杠包住并加双引号。

## 3. 本风格的情绪弧线 → 推荐标签

| 段落 | 情绪 | 推荐标签（可组合） |
|---|---|---|
| 困境 / 共鸣 | 克制、共情、略低沉 | `[softly]` `[empathetic]` `[low, gentle voice]` `[sighs]` `[tired]` |
| 转折 | 有希望、语气抬起 | `[hopeful]` `[short pause]` `[inhales deeply]` |
| 方案 / 介绍 | 清晰、亲切、轻快 | `[warm]` `[friendly]` `[curious]` `[chuckles]` |
| 治愈 / 收尾 | 温暖、安心、放慢 | `[warm, reassuring]` `[calm]` `[slowly]` `[exhales]` |

## 4. 文件格式：`voice/<slug>.json`

每个**片段**对应分镜表里的一个场景（S01、S02……）。片段分开生成，这样能拿到每段的准确时长，直接对齐到 Remotion。

```json
{
  "slug": "example",
  "model_id": "eleven_v4",
  "voice_id": "在 ElevenLabs 声音库里复制的 Voice ID",
  "language_code": "zh",
  "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
  "gap_s": 0.35,
  "segments": [
    {"id": "S01", "text": "[low, gentle voice] 每天醒来，消息一条接一条…… [sighs] 好像永远处理不完。"},
    {"id": "S02", "text": "[hopeful] 但其实，[short pause] 你可以先停下来。"},
    {"id": "S03", "text": "[warm, reassuring] [slowly] 深呼吸，给自己一点空间。"}
  ]
}
```

- `stability`：越低表达越丰富、每次差异越大，越高越稳定。官方没有给推荐值，先用 0.5，再根据试听调整。
- `gap_s`：片段之间留的静音（秒）。

## 5. 生成音频

```bash
# 首次：在仓库根目录建 .env 文件（已在 .gitignore，不会提交），写一行 ELEVENLABS_API_KEY=你的key
python3 scripts/tts_elevenlabs.py voice/<slug>.json
```

输出到 `public/audio/<slug>/`：
- `S01.mp3`、`S02.mp3`……：每个片段一个音频文件
- `timeline.json`：每段的起点和时长（秒）。Remotion 按它排镜头。
- `<slug>_full.mp3`：拼好的整段配音，方便试听（需要本机装了 ffmpeg）

只想重做某几段时，加 `--only S02,S03`。

不想用脚本的话，也可以把每段的 `text` 粘贴到 ElevenLabs 网页版生成，下载后按 `S01.mp3`、`S02.mp3` 命名放进 `public/audio/<slug>/`，然后运行 `python3 scripts/tts_elevenlabs.py voice/<slug>.json --timeline-only`，只生成 `timeline.json`。
