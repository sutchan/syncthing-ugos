# Syncthing for UGOS Pro — 项目规范文档总览

> 本目录（`docs/specs/`）汇总将 [Syncthing](https://github.com/syncthing/syncthing) 封装为绿联 NAS（UGOS Pro）Docker 应用所需遵循的全部平台规范，以及本项目的适配设计决策。

- 路径：docs/specs/00-overview.md
- 文档版本：v1.3.0（文档自版本，与 UPK 包版本无关）
- 适用平台：UGOS Pro（最低依赖固件 `1.13.0.0000`、Docker 套件 `1.7.0.0000`）
- 上游项目：<https://github.com/syncthing/syncthing>
- 平台规范来源：<https://developer.ugnas.com/doc/backend/quick-start/develop-docker-app.html>
- 系统基础环境（上游开源合规仓库）：<https://github.com/ugreen-opensource/ugospro-debian12>
  - 说明：UGOS Pro 基于 **Debian 12 (Bookworm)** 构建；该仓库为绿联履行开源义务发布的源代码合规仓库（构建脚本 + 配置 + 软件清单），用于复刻根文件系统，**非运行时约定文档**，对 Docker 应用开发的约束仍以开发者平台文档为准。

## 文档索引

| 文档 | 内容 |
|------|------|
| [01-project-structure.md](./01-project-structure.md) | UPK 打包目录结构、`project.yaml`、`rootfs_*` 约束 |
| [02-project-yaml.md](./02-project-yaml.md) | `project.yaml` 全部字段定义与 Syncthing 取值 |
| [03-docker-image.md](./03-docker-image.md) | Dockerfile、镜像导出、docker-compose.yaml 规范与安全红线 |
| [04-runtime-env.md](./04-runtime-env.md) | 受限运行环境、目录路径、权限、环境变量约定 |
| [05-app-lifecycle.md](./05-app-lifecycle.md) | 启停生命周期、端口、配置 parameters、open_type、登录认证 |
| [06-build-pack.md](./06-build-pack.md) | ugcli 初始化、检查、打包命令与产物命名 |
| [07-syncthing-design.md](./07-syncthing-design.md) | 本项目针对 Syncthing 的适配设计决策与待确认项 |
| [08-publishing.md](./08-publishing.md) | 发布/上架流程、开发者授权、版本迭代 |

### 项目级文档（位于 `docs/` 根目录，非平台规范）

| 文档 | 内容 |
|------|------|
| [../README.md](../README.md) | 文档导航索引（本目录总入口） |
| [../DEVELOPMENT.md](../DEVELOPMENT.md) | 开发/构建/打包/调试指南 |
| [../OPS.md](../OPS.md) | 运维与故障排查手册 |
| [../SECURITY.md](../SECURITY.md) | 安全说明与暴露风险 |

## 关键结论速览

1. **采用 Docker 应用形态**：使用 `project.yaml` + `rootfs_common/docker-compose.yaml` + 各架构 `images/*.tar`，而非原生二进制形态。
2. **`project.yaml` 是核心元数据**，字段规范见 [02-project-yaml.md](./02-project-yaml.md)。Docker 应用需额外声明 `is_docker_app`、`depend_docker_version`、`only_admin`。
3. **目录硬约束**：
   - `rootfs_common/` 仅允许 `icon.png` 与 `docker-compose.yaml`；
   - `rootfs_amd64/`、`rootfs_arm64/` 仅允许 `images/` 且只放 `.tar` 镜像；
   - 每个 `.tar` 仅含一个 tag，且与 compose 中 `image:` 完全一致。
4. **安全红线**：禁用 `privileged`、`cap_add`、`host` 网络/PID/IPC；镜像不得用 `latest`。
5. **运行身份非 root**：Syncthing 官方镜像已支持以非 root 运行，需显式配置 `PUID/PGID` 与数据卷目录权限。
6. **应用对外端口**需在 `project.yaml` 的 `port` 声明固定端口，系统据此分配 HTTP/HTTPS 代理端口并支持 UGREENlink 远程访问。
7. **发布上架**：本地测试通过后邮件提交 `.upk` 给官方审核；上架前需申请 `ugdev.sig` 开发者授权（序列号/MAC/管理员用户名）。详见 [08-publishing.md](./08-publishing.md)。

## 待确认 / 待验证事项

设计层面 9 项决策已在 [07-syncthing-design.md](./07-syncthing-design.md) 第 7.6 节全部给出明确结论（含 `start_cmd` 留空语义、`open_type: tab` + 省略 `proxy_path` 组合的合规性），**无遗留设计待确认项**。

仅剩的收尾动作为打包机实测验证（非设计待确认）：

- 在 Debian 12 打包机执行 `ugcli check` / `ugcli pack`，确认 `project.yaml` 与 `rootfs_*` 目录结构、镜像 tar 被平台正确接受（见 07 第 7.7 节实现清单）。

> 自 v1.2.0 起，原「`start_cmd` 语义」「`open_type: tab` + 省略 `proxy_path`」两条待确认项的合法性已由 07 第 7.6 节依据 `02-project-yaml.md` 字段定义正式确认，自待确认清单移除。

## 版本说明

本规范文档集依据绿联开发者平台公开文档整理，平台规范如有更新应同步修订对应小节并在本文件 `文档版本` 处升级。
