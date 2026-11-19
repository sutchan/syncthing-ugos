# 贡献指南 (CONTRIBUTING)

> CONTRIBUTING.md v1.1.0（文档自版本，与 UPK 包版本无关）

欢迎为 **Syncthing for UGOS Pro** 项目贡献代码、文档或问题反馈。

## 行为准则

- 友善、专业、就事论事；
- 不提交含密钥、Token、个人隐私的内容；
- 尊重上游 Syncthing 的 MPL-2.0 许可证。

## 开发环境

- 开发机：Debian 12 (Linux)，支持 amd64 / arm64；
- 工具链：`git`、`docker`（含 buildx）、`python3`、`jq`、`tar`、`bash`（均经 `build/preflight.sh` 预检）；
- 平台工具：`ugcli`（见 [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)）；
- 测试设备：UGOS Pro 1.13.0.0000+ NAS，已申请开发者授权 `ugdev.sig`。

## 工作流

1. 从 `main` 切出分支：`feature/*`（新功能）、`fix/*`（修复）、`docs/*`（文档）；
2. 本地开发与自测；
3. 提交遵循本仓库 commit 规范（见下）；
4. 推送并创建 PR 到 `main`，描述变更动机与测试方式。

## 提交信息规范

格式：

```
<type>: <description>

[可选正文]
[可选页脚]
```

类型：`feat` / `fix` / `docs` / `refactor` / `style` / `test` / `chore` / `perf`。
描述 ≤50 字符、首字母小写、动词开头、无句号。

涉及版本变更时，在正文或页脚标注版本，例如：

```
chore: 同步文档并更新版本至 v1.27.0.2

Closes #123
```

## 版本号

遵循 SemVer。本仓库同时维护：

- 应用语义版本（`VERSION` 文件）：`x.y.z`，跟随 Syncthing 上游；
- 打包构建号：`ugcli pack --build N` 的 `N`，递增。

## 文档约定

- 平台规范文档统一放 `docs/specs/`（`00`~`08`）；
- 修改平台相关配置（`project.yaml`、`docker-compose.yaml.tpl`）后，需同步更新对应规范小节；
- 文件头部含路径/版本注释的，改动后同步 bump 头注释版本（仅改被改动文件）。

## 代码质量

- Shell 脚本保持 POSIX-ish，`bash` 运行无告警；
- 关键逻辑加中文注释；
- 不引入 `privileged` / `cap_add` / `host` 网络等安全红线（见 `docs/specs/03-docker-image.md`）。

## 问题反馈

- Bug / 需求请提 Issue，附复现步骤、设备固件版本、日志（`/var/packages/com.syncthing.docker.syncthing/log/`）。
