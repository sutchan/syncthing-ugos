# 开发指南 (DEVELOPMENT)

> docs/DEVELOPMENT.md v1.1.0（文档自版本，与 UPK 包版本无关）

本文档说明本仓库的本地开发、构建与打包流程。平台规范详见 `docs/specs/`（`00`~`08`）。

## 1. 仓库结构

```
syncthing-ugos/
├── project.yaml              # 应用元数据（核心）
├── VERSION                  # 应用语义版本 x.y.z
├── CHANGELOG.md             # 版本变更记录
├── LICENSE                  # MPL-2.0
├── CONTRIBUTING.md          # 贡献指南
├── README.md                # 项目说明
├── assets/
│   └── icon.png             # 应用图标（512×512 PNG，由 make-icon.ps1 生成）
├── build/
│   ├── build-all.sh         # 一键：预检→导出镜像→组装→ugcli check→pack
│   ├── preflight.sh         # 打包前预检（依赖/真相源字段/关键文件）
│   ├── project-meta.sh      # 真相源读取库（从 project.yaml 取镜像 tag/端口）
│   ├── export-images.sh     # 按架构 docker pull 并 save 为 tar + manifest 校验
│   ├── assemble.sh          # 组装 rootfs_common/rootfs_*/ 打包目录
│   ├── docker-compose.yaml.tpl  # compose 模板（渲染为 rootfs_common/）
│   └── make-icon.ps1        # 生成占位图标（Windows 侧）
└── docs/
    ├── specs/               # 平台规范文档 00~08
    └── DEVELOPMENT.md       # 本文件
```

## 2. 前置准备

- Linux（Debian 12）打包机，安装 `docker` + `buildx`、`python3`；
- 安装绿联开发者工具 `ugcli`：`ugcli --version` 验证；
- NAS 已申请开发者授权 `ugdev.sig`（见 `docs/specs/08-publishing.md`）。

## 3. 生成图标（Windows 侧可选）

```powershell
powershell -ExecutionPolicy Bypass -File build/make-icon.ps1
```

若已手动提供 `assets/icon.png`，可跳过。

## 4. 一键构建与打包（Linux）

```bash
# 用法: ./build/build-all.sh [VERSION] [BUILD] [ARCH...]
#   VERSION: 上游版本，如 1.27.0（默认 1.27.0）
#   BUILD:   构建号（整数，默认 1）
#   ARCH:    amd64 / arm64（可多值，默认 amd64 arm64）

./build/build-all.sh 1.27.0 1 amd64 arm64
```

脚本依次执行：

0. `preflight.sh`：预检依赖工具（docker/python3/jq/tar）、真相源字段（`x_image_tag` 非 `latest`、`port` 为数字）与关键文件；
1. `export-images.sh`：对每架构 `docker pull --platform` 拉取单平台镜像，导出为 `rootfs_{arch}/images/*.tar`，用 `python3` 解析 `manifest.json` 校验单一 tag、tag 与期望一致、架构与 `--platform` 一致，失败即删除坏 tar；
2. `assemble.sh`：渲染 `docker-compose.yaml.tpl`（注入 `SYNCTHING_IMAGE` 镜像引用与 `SYNCTHING_PORT` 宿主端口，均来自 `project.yaml`），复制 `project.yaml` 与 `assets/icon.png` 到 `rootfs_common/`；
3. `ugcli check`：校验 `project.yaml` 与 `rootfs_*` 目录结构；
4. `ugcli pack`：生成 `build_dir/pkgs/upk/{arch}_com.syncthing.docker.syncthing_{version}.{build}.upk`。

> **镜像 tag 真相源**：`build-all.sh`/`assemble.sh`/`export-images.sh` 统一通过 `project-meta.sh` 从 `project.yaml` 的 `x_image_tag`（缺省回退 `version`）读取镜像 tag；命令行 `VERSION` 位置参数仅作覆盖。GUI 宿主端口取自 `project.yaml` 的 `port`。

## 5. 仅导出镜像 / 仅组装

```bash
# 仅导出镜像 tar
./build/export-images.sh 1.27.0 amd64

# 仅组装（需先有镜像 tar）
SYNCTHING_IMAGE=docker.io/syncthing/syncthing:1.27.0 ./build/assemble.sh amd64
```

## 6. 本地安装测试

1. NAS 应用中心 → 手动安装 `build_dir/pkgs/upk/*.upk`；
2. 安装后点击「打开应用」验证 Web GUI（默认端口 8384）；
3. 设置 GUI 密码（参数 `GUI_PASSWORD`），添加同步文件夹；
4. 排查日志：`/var/packages/com.syncthing.docker.syncthing/log/`。

## 7. 自定义配置项（parameters）

运行时经环境变量注入，变量名即 `key`：

| key | 类型 | 说明 |
|-----|------|------|
| `GUI_PASSWORD` | password | Syncthing Web GUI 登录密码 |
| `PUID` | number | 容器内文件归属用户 ID |
| `PGID` | number | 容器内文件归属组 ID |
| `TZ` | string | 时区，如 `Asia/Shanghai` |

同步目录使用平台用户授权变量 `${UGAPP_SHARED_DIR}`（需 `allow_add_access_path: true`）。

## 8. 版本与发布

- 修改 `VERSION` 与应用版本后，更新 `CHANGELOG.md`；
- 打包构建号通过 `ugcli pack --build N` 递增；
- 本地测试通过后将 `.upk` 邮件提交官方审核（见 `docs/specs/08-publishing.md`）。

## 9. 常见问题

- **`ugcli: command not found`**：未安装或未加入 PATH，按平台文档安装。
- **镜像 tar 校验失败**：确认 `project.yaml` 的 `x_image_tag` 与导出的镜像 tag 一致，且未使用 `latest` 标签；`export-images.sh` 与 `assemble.sh` 均以此字段为镜像 tag 真相源。
- **权限拒绝**：检查挂载目录对 `PUID`/`PGID` 可写，或显式设置 `PUID`/`PGID`。
