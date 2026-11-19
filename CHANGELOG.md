# Changelog

本项目遵循语义化版本（应用版本 `x.y.z` 取自上游 Syncthing，UPK 包版本为 `应用版本.构建号`）。

## [Unreleased]

### 修复
- `x_image_tag` 与 GUI 端口成为构建链路唯一真相源：新增 `build/project-meta.sh`，`build-all.sh`/`assemble.sh`/`export-images.sh` 统一从 `project.yaml` 读取镜像 tag 与端口，命令行 `VERSION` 仅作覆盖（原 `assemble.sh` 硬编码默认 tag、compose 模板端口写死的问题已消除）。
- `export-images.sh` 恢复 `manifest.json` 真实解析校验：断言单一 tag、tag 与期望一致、架构与 `--platform` 一致，校验失败删除坏 tar，替换原 `grep -c manifest.json` 假校验。
- 新增 `build/preflight.sh` 并接入 `build-all.sh` Step 0：预检依赖工具、`x_image_tag`/`port` 真相源字段与关键文件。

### 文档
- 新增 `docs/DEVELOPMENT-ROADMAP.md`：应用开发与迁移任务规划，涵盖版本/兼容基线、功能完整性梳理、安装卸载与自启动验证、数据迁移方案、12 项待修复问题、验收标准与测试场景、P0/P1/P2 分阶段优先级与交付物；并登记到 `docs/README.md` 索引。
- `OPS.md` 补齐安装/卸载双路径、手工数据迁移步骤与校验表、升级回滚 SOP，澄清 `support_migration` 边界；`02-project-yaml.md` 同步该字段说明与示例；`DEVELOPMENT.md` 同步构建流水线与真相源说明。
- 全量文档治理：为全部 17 个 Markdown 文档补齐「路径 + 文档自版本」头部标注；根 `README.md` 同步新增构建脚本、preflight 流程与真相源说明；`CONTRIBUTING.md` 补 `jq`/`tar` 依赖；`specs/00`~`08` 版本头规范化。

## [1.27.0.5] - 2026-08-13

### 文档
- 新增 `docs/README.md` 文档导航索引，统一 specs 规范文档与项目级文档入口。
- 修正 `docs/DEVELOPMENT.md` 中 `build-all.sh` 参数顺序，与脚本签名 `[VERSION] [BUILD] [ARCH...]` 一致。
- 同步 `docs/specs/00-overview.md` 待确认事项：`start_cmd` 语义与 `open_type: tab` + 省略 `proxy_path` 组合已在 `07` 第 7.6 节正式确认，自待确认清单移除。
- 补全 `docs/specs/07-syncthing-design.md` 实现清单遗漏的 `build/dx4600-build-env.sh`。

## [1.27.0.4] - 2026-08-13

### 修复
- `build/export-images.sh` 镜像 tag 优先读取 `project.yaml` 的 `x_image_tag`，与 `assemble.sh` 共用同一真相源，脚本参数仅作覆盖。
- 修正 `docs/DEVELOPMENT.md`、`docs/OPS.md` 中过时的版本变量说明，统一指向 `x_image_tag`。

## [1.27.0.3] - 2026-08-13

### 修复
- `project.yaml` 的 `start_cmd` 置空（`""`），Docker 应用由系统按 `docker-compose.yaml` 拉起，避免与 compose 重复拉起冲突。
- 新增 `x_image_tag` 自定义字段解耦镜像 tag 与应用 `version` 语义；`build/assemble.sh` 优先读取 `x_image_tag` 拼接镜像名，缺失时回退 `version`。
- `build/export-images.sh` 镜像 tar 校验失败时自动删除已生成的坏 tar，避免后续 `assemble` 误用。
- 同步 `docs/specs/02-project-yaml.md` 的 `start_cmd` 与 `x_image_tag` 字段说明。

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
