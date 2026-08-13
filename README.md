# Syncthing for UGOS Pro

将 [Syncthing](https://github.com/syncthing/syncthing) 封装为绿联 NAS（UGOS Pro）Docker 应用的工程。

- 平台规范来源：<https://developer.ugnas.com/doc/backend/quick-start/develop-docker-app.html>
- 系统基础环境：<https://github.com/ugreen-opensource/ugospro-debian12>（UGOS Pro 基于 Debian 12）
- 应用形态：**Docker 应用**（`project.yaml` + `docker-compose.yaml` + 多架构镜像 tar）

## 文档

规范文档集位于 [`docs/specs/`](./docs/specs/)：

| 文档 | 内容 |
|------|------|
| [00-overview.md](./docs/specs/00-overview.md) | 总览、索引、待确认项 |
| [01-project-structure.md](./docs/specs/01-project-structure.md) | 打包目录结构 |
| [02-project-yaml.md](./docs/specs/02-project-yaml.md) | `project.yaml` 字段与取值 |
| [03-docker-image.md](./docs/specs/03-docker-image.md) | 镜像、compose、安全红线 |
| [04-runtime-env.md](./docs/specs/04-runtime-env.md) | 运行环境、目录、权限 |
| [05-app-lifecycle.md](./docs/specs/05-app-lifecycle.md) | 启停、端口、配置、打开方式 |
| [06-build-pack.md](./docs/specs/06-build-pack.md) | ugcli 构建与打包 |
| [07-syncthing-design.md](./docs/specs/07-syncthing-design.md) | 适配设计决策与待确认项 |

## 开发态结构

```
syncthing-ugos/
├── docs/specs/            # 规范文档集
├── build/                 # 构建脚本（导出镜像、渲染 compose）
├── assets/icon.png        # 应用图标源
├── project.yaml           # 应用元数据
└── README.md
```

## 当前进度

仓库目前**仅含规范文档**，实现文件（见 [`07-syncthing-design.md` 7.7](./docs/specs/07-syncthing-design.md#77-后续实现清单规范落地)）尚未创建。

## 快速构建（实现后）

```bash
# 1. 导出多架构镜像 tar
bash build/export-images.sh

# 2. 组装打包目录并提交 ugcli 校验
ugcli check

# 3. 打包
ugcli pack --arch all --build 1
```

产物：`{arch}_com.syncthing.docker.syncthing_{version}.{build}.upk`，经 NAS 应用中心安装。
