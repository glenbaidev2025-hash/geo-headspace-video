# 口播稿收件箱（几何角色视频）

每天把要做的口播稿放进这个目录，一条视频一个 `.md` 文件，文件名就是视频 slug（英文小写加连字符，例如 `ep04-sunday-night.md`）。
定时任务每天自动处理 `status: ready` 的稿子：分镜 → 口播脚本 → ElevenLabs 配音（在 Mac 上）→ 渲染 → 成片放到 Mac 的 `HeadspaceOutputs/` → 提交推送 → 稿子移到 `inbox/done/` 并改成 `status: done`。

复制 `_template.md` 开始写。`status: draft` 的稿子不会被处理，写完再改成 `ready`。
