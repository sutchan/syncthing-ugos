# Syncthing for UGOS Pro

将 [Syncthing](https://github.com/syncthing/syncthing) 封装为绿联 NAS（UGOS Pro）**Docker 应用**的安装包（`.upk`）。

- 应用 ID：`com.syncthing.docker.syncthing`
- 应用版本：跟随上游 `1.27.0`
- UPK 包版本：`1.27.0.5`（应用版本 + 构建号 5，见 `VERSION`）
- 形态：Docker 应用（复用官方多架构镜像 `syncthing/syncthing`）
- 最低依赖：固件 `1.13.0.0000`、Docker 套件 `1.7.0.0000`

## 文档

| 文档 | 说明 |
|------|------|
| [README.md](./README.md) | 项目说明、构建与配置 |
| [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) | 开发/构建/打包/调试指南 |
| [docs/OPS.md](./docs/OPS.md) | 运维与故障排查手册 |
| [docs/SECURITY.md](./docs/SECURITY.md) | 安全说明与暴露风险 |
| [docs/specs/](./docs/specs/) | 绿联 UPK 平台规范文档（`00`~`08`） |
| [CHANGELOG.md](./CHANGELOG.md) | 版本变更记录 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 贡献指南 |
| [LICENSE](./LICENSE) | MPL-2.0（与上游 Syncthing 一致） |

## 特性

- 开源持续文件同步，跨设备点对点加密传输
- 对外暴露 Syncthing 原生 Web GUI（端口 `8384`），`open_type: tab` 浏览器打开
- 支持 `amd64` / `arm64` 双架构
- 非 root 运行（通过 `PUID`/`PGID` 对齐宿主机权限）
- 用户可授权同步目录（`allow_add_access_path: true`）

## 目录结构

```
syncthing-ugos/
├── docs/specs/                 # 平台规范与适配设计文档
├── build/                      # 构建脚本
│   ├── export-images.sh        # 导出 amd64/arm64 镜像 tar
│   ├── assemble.sh             # 组装打包目录 (Linux 打包机)
│   ├── build-all.sh            # 一键串联 export→assemble→check→pack
│   ├── dx4600-build-env.sh     # 在绿联 DX4600 一键起 Debian 12 构建容器
│   ├── make-icon.ps1           # 生成应用图标 (Windows)
│   └── docker-compose.yaml.tpl # compose 模板
├── assets/icon.png             # 应用图标 (512×512)
├── project.yaml                # 应用元数据
└── README.md
```

打包产物目录（由脚本生成）：

```
com.syncthing.docker.syncthing/
├── project.yaml
├── rootfs_common/
│   ├── icon.png
│   └── docker-compose.yaml
├── rootfs_amd64/images/*.tar
└── rootfs_arm64/images/*.tar
```

## 构建流程

开发机为 Windows，打包机为 Debian 12（Linux）。绿联 DX4600（UGOS Pro）底层即 Debian 12 且自带 Docker，可直接在其上起构建容器。

### 0. 创建构建环境（绿联 DX4600）

在 DX4600 的 SSH / Docker 套件终端执行，一键起挂载宿主 `docker.sock` 的 Debian 12 容器：

```bash
./build/dx4600-build-env.sh /volume1/@appdata/syncthing-ugos /volume1/@appdata/ugos-build
docker exec -it ugos-build bash
```

进入容器后，需自行放入 `ugcli` 二进制（及 `ugdev.sig`，详见 `docs/specs/08-publishing.md` §8.2）。

### 1. 生成图标（Windows）

```powershell
powershell -ExecutionPolicy Bypass -File build/make-icon.ps1
```

### 2. 一键构建（构建容器内）

```bash
cd /repo
./build/build-all.sh 1.27.0 2 amd64 arm64
```

脚本自动完成：导出 `syncthing/syncthing:1.27.0` 的 amd64/arm64 两套 tar → 组装打包目录 → `ugcli check` → `ugcli pack --arch all --build 2`。
（亦可在 Linux 打包机分步执行 `export-images.sh` / `assemble.sh` / `ugcli check` / `ugcli pack`。）

### 3. 校验与打包（手动分步，等价于一键）

```bash
ugcli check
ugcli pack --arch all --build 2
```

产物：`build_dir/pkgs/upk/{arch}_com.syncthing.docker.syncthing_1.27.0.5.upk`

## 端口说明

| 端口 | 用途 | 远程访问 |
|------|------|----------|
| 8384 | Web GUI（管理界面） | 是（系统代理 + UGREENlink） |
| 22000/tcp+udp | 设备间同步传输 | 否（仅直连/局域网） |
| 21027/udp | 本地网络发现 | 否 |

> 远程访问仅覆盖 8384。外网设备同步建议：
> - 通过 UGREENlink 的 8384 端口中继 GUI；
> - 或在路由器转发 22000/21027，或使用 Syncthing 公共中继服务器。

## 配置项（parameters）

| Key | 类型 | 说明 |
|-----|------|------|
| `GUI_PASSWORD` | password | Web GUI 登录密码（必填，可改） |
| `PUID` | number | 容器内文件归属用户 ID |
| `PGID` | number | 容器内文件归属用户组 ID |
| `TZ` | string | 时区，如 `Asia/Shanghai` |

修改 `changeable: true` 的项后需重启应用生效。

> 同步目录由用户在应用设置中授权（`allow_add_access_path: true`），系统以环境变量 `UGAPP_SHARED_DIR` 注入并挂载为容器内 `/var/syncthing/Sync`，无需在配置项中额外声明路径。

## 同步目录

- 应用数据（配置 + 默认库）挂载到 `./data` → 容器内 `/var/syncthing`，卸载时随应用清理；
- 用户授权目录由系统注入环境变量 `UGAPP_SHARED_DIR`（需 `allow_add_access_path: true`，在应用设置中授权文件夹），挂载为容器内 `/var/syncthing/Sync` 作为默认同步库；
- 容器内以非 root 用户 `syncthing` 运行，通过 `PUID`/`PGID` 对齐宿主机权限，请确保授权目录对该用户可写。

## 规范文档

详见 `docs/specs/`：`00-overview` ~ `08-publishing`（含平台规范、适配设计与发布上架流程）。

## 许可证

Syncthing 遵循 MPL-2.0。本封装项目遵循相同许可。
