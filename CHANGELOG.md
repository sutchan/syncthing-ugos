# Changelog

本项目遵循语义化版本（应用版本 `x.y.z` 取自上游 Syncthing，UPK 包版本为 `应用版本.构建号`）。

## [1.27.0.2] - 2026-08-13

### 修复
- 同步目录挂载改用平台用户授权目录变量 `${UGAPP_SHARED_DIR}`（依赖 `allow_add_access_path: true`），移除冗余的自定义 `SYNC_PATH` 参数，与 `docker-compose.yaml.tpl` 保持一致。
- 修正镜像导出逻辑，按 `linux/amd64`、`linux/arm64` 分别 `docker pull --platform` 拉取单平台镜像，确保 `rootfs_*/images/*.tar` 架构正确。
- 将镜像 tar 校验由无效的 `RepoTags` 关键字计数改为用 `python3` 解析 `manifest.json` 真实统计 tag 数量与一致性检查，并提供无 python3 时的退化方案。
- `build/assemble.sh` 渲染后增加 `${SYNCTHING_IMAGE}` 占位符残留校验，避免静默留空。
- `build/build-all.sh` 参数解析改为显式位置参数 `VERSION BUILD ARCH`，避免误将架构当作构建号。

### 文档
- 同步 `docs/specs/`（`02/03/04`）与 `README.md` 配置项表，移除已废弃的 `SYNC_PATH` 参数说明，统一以 `UGAPP_SHARED_DIR` 描述同步目录。
- `README.md` 结构图补全 `build-all.sh`，规范文档索引补全 `08-publishing`。

---

## 历史版本

- 1.27.0.0 — 初始封装：复用官方多架构镜像 `syncthing/syncthing:1.27.0`，Docker 应用形态，暴露原生 Web GUI（8384）。
