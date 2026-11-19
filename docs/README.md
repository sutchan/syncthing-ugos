# 项目文档导航

> docs/README.md v1.0.1
> Syncthing for UGOS Pro — 文档总入口

本文件是 `docs/` 目录的导航索引，汇总将 [Syncthing](https://github.com/syncthing/syncthing) 封装为绿联 NAS（UGOS Pro）Docker 应用的所有文档。按阅读顺序从规范到落地，帮助新成员快速建立全局认知。

## 阅读路径

```text
总览(00) → 结构(01) → project.yaml(02) → 镜像(03) → 运行环境(04)
        → 生命周期(05) → 构建打包(06) → 适配设计(07) → 发布上架(08)
```

- 只想**打包/调试**：直接看 [DEVELOPMENT.md](./DEVELOPMENT.md)
- 想**运维/排障**：直接看 [OPS.md](./OPS.md)
- 关心**安全暴露面**：直接看 [SECURITY.md](./SECURITY.md)

## 一、平台规范文档（`docs/specs/`）

依据绿联开发者平台公开文档整理，记录 UGOS Pro Docker 应用必须遵守的规范。

| 文档 | 内容 | 何时查阅 |
|------|------|----------|
| [00-overview.md](./specs/00-overview.md) | 文档总览、关键结论速览、待确认事项 | 起步，建立全局认知 |
| [01-project-structure.md](./specs/01-project-structure.md) | UPK 打包目录结构、`rootfs_*` 硬约束 | 调整目录/新增资源时 |
| [02-project-yaml.md](./specs/02-project-yaml.md) | `project.yaml` 全部字段定义与 Syncthing 取值 | 修改应用元数据/参数时 |
| [03-docker-image.md](./specs/03-docker-image.md) | 镜像导出、compose 规范、安全红线 | 调整镜像/compose 时 |
| [04-runtime-env.md](./specs/04-runtime-env.md) | 受限运行环境、目录路径、环境变量约定 | 排查路径/权限问题时 |
| [05-app-lifecycle.md](./specs/05-app-lifecycle.md) | 启停生命周期、端口、认证、open_type | 调整端口/认证方式时 |
| [06-build-pack.md](./specs/06-build-pack.md) | ugcli 初始化、检查、打包命令与产物命名 | 打包/上架准备时 |
| [07-syncthing-design.md](./specs/07-syncthing-design.md) | 本项目适配设计决策与实现清单 | 了解设计取舍/实现进度时 |
| [08-publishing.md](./specs/08-publishing.md) | 发布/上架流程、开发者授权、版本迭代 | 提交官方审核时 |

## 二、项目级文档（`docs/` 根目录）

非平台规范，面向本项目的开发、运维与安全工作流。

| 文档 | 内容 | 何时查阅 |
|------|------|----------|
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 开发环境、一键构建、手动分步打包、调试 | 本地构建/联调时 |
| [OPS.md](./OPS.md) | 安装后配置、日常运维、故障排查 | 部署运行/报障时 |
| [SECURITY.md](./SECURITY.md) | 安全模型、暴露面、加固建议 | 安全评审/审计时 |
| [DEVELOPMENT-ROADMAP.md](./DEVELOPMENT-ROADMAP.md) | 开发/迁移任务规划：版本基线、功能完整性、迁移方案、问题清单、验收与分阶段优先级 | 规划开发/迁移/测试验收时 |

## 三、仓库其他关键文件

| 文件 | 说明 |
|------|------|
| `README.md` | 项目首页：简介、安装、端口、外网同步 |
| `project.yaml` | 应用元数据核心文件（详见 02 节） |
| `VERSION` | UPK 包版本（Syncthing 版本 + 构建号） |
| `CHANGELOG.md` | 版本变更记录 |
| `build/` | 构建脚本（`export-images.sh` / `assemble.sh` / `build-all.sh` / `dx4600-build-env.sh` / `make-icon.ps1` / `docker-compose.yaml.tpl`） |
| `assets/icon.png` | 应用图标（512×512，由 `build/make-icon.ps1` 生成） |

## 四、维护约定

- 平台规范更新时，同步修订对应 `specs/*.md` 小节并升级该文件头部 `文档版本`。
- 新增文档须登记到本索引与 `00-overview.md` 的文档索引表，避免文档孤岛。
- 文档版本独立于 UPK 包版本（`VERSION` 文件）：前者记录规范/文档演进，后者记录可分发安装包版本。
