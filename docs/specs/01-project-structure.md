# 01 — 项目目录结构规范

> 路径：docs/specs/01-project-structure.md
> 文档版本：v1.1.0（文档自版本，与 UPK 包版本无关）
> 规范来源：<https://developer.ugnas.com/doc/backend/quick-start/develop-docker-app.html>

## 1.1 UPK 打包目录结构

Docker 应用最终需组织为如下目录，由 `ugcli pack` 打包成 `.upk` 安装包：

```
com.syncthing.docker.syncthing/
├── project.yaml              # 应用元数据（必需）
├── rootfs_common/            # 跨架构共用资源
│   ├── icon.png              # 应用图标（必需）
│   └── docker-compose.yaml   # 容器编排（必需）
├── rootfs_amd64/             # amd64 架构专用
│   └── images/               # 仅放 .tar 镜像文件
│       └── syncthing-<ver>-amd64.tar
└── rootfs_arm64/             # arm64 架构专用
    └── images/
        └── syncthing-<ver>-arm64.tar
```

## 1.2 目录约束（硬规则）

| 路径 | 允许内容 | 说明 |
|------|----------|------|
| `rootfs_common/` | 仅 `icon.png`、`docker-compose.yaml` | 不得放其他文件/子目录 |
| `rootfs_amd64/images/` | 仅 `.tar` 镜像文件 | 不得放非镜像文件 |
| `rootfs_arm64/images/` | 仅 `.tar` 镜像文件 | 同上 |
| `rootfs_*/images/*.tar` | 单 tag 镜像 | 每个 tar 仅含一个 tag，且与 compose 中 `image:` 完全一致 |

## 1.3 镜像 tar 规范

- 所有被引用的镜像必须 `docker save` 导出为独立 `.tar`；
- 每个 `.tar` 只能有一个 tag（如 `docker.io/syncthing/syncthing:1.27.0`）；
- 若同时支持 amd64/arm64，需分别导出两套 tar，分置 `rootfs_amd64/images/`、`rootfs_arm64/images/`；
- 禁止使用 `latest` 等浮动 tag，必须锁定具体版本。

## 1.4 安装后实际目录（参考，非打包结构）

安装后系统软链映射（运行时视角）：

```
/var/packages/{app_id}/ -> /volume{卷号}/@appstore/{app_id}
├── icon.png
└── （Docker 应用由 compose 拉起，数据卷挂到 data 目录）
```

应用运行时数据目录约定见 [04-runtime-env.md](./04-runtime-env.md)。

## 1.5 Syncthing 项目落地结构（开发态）

代码仓库（本仓库）与打包目录可分离，建议开发态结构：

```
syncthing-ugos/
├── docs/specs/                 # 本规范文档集
├── build/                     # 构建脚本（导出镜像、生成 compose）
│   ├── export-images.sh
│   └── docker-compose.yaml.tpl
├── assets/icon.png            # 应用图标源文件
├── project.yaml               # 应用元数据（与打包目录一致）
└── README.md
```

`ugcli pack` 前由构建脚本将 `project.yaml`、`assets/icon.png`、`docker-compose.yaml` 与 `images/*.tar` 组装到临时打包目录。
