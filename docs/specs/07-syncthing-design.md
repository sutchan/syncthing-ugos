# 07 — Syncthing 适配设计决策与待确认项

> 路径：docs/specs/07-syncthing-design.md
> 文档版本：v1.2.0（文档自版本，与 UPK 包版本无关）

本文档记录将 Syncthing 封装为 UGOS Pro Docker 应用的设计决策，以及需要用户 / 平台 / 上游进一步确认的事项。

## 7.1 形态选择

- **Docker 应用**：复用官方多架构镜像 `syncthing/syncthing`，无需编译，跨架构交付简单，符合平台 Docker 应用规范。
- 不采用原生二进制形态（需自行编译、分架构打包 `bin/`）。
- **基础环境一致**：UGOS Pro 基于 Debian 12 (Bookworm)（上游合规仓库 `ugreen-opensource/ugospro-debian12`）。Syncthing 官方镜像本身基于 Debian，与宿主环境 libc/库一致，可直接复用，无需额外调整基础镜像。

## 7.2 端口规划

| 端口 | 用途 | 是否经系统代理/远程访问 |
|------|------|------------------------|
| 8384 | Web GUI（管理界面） | 是（`project.yaml` `port` 声明） |
| 22000/tcp+udp | 设备间同步传输 | 否（仅直连/局域网） |
| 21027/udp | 本地网络发现 | 否 |

> 远程访问仅覆盖 8384。若需外网设备同步，建议通过 UGREENlink 的 8384 端口做中继或让用户自行配置转发（Syncthing 也支持中继服务器）。

## 7.3 打开方式

- 采用 `open_type: tab`，直接暴露 Syncthing 原生 Web UI；
- 理由：Syncthing 自带完整认证与配置界面，二次封装成本高且收益低；
- 备选：若绿联要求统一桌面体验，可改 `inner` + `proxy_path`，但需处理 `Ugreen-Ttk` 与 Syncthing 自身账号体系的共存（见 7.5）。

## 7.4 认证与密码

- Syncthing 1.27+ 默认要求设置 GUI 密码（不再允许空密码）；
- 通过 `parameters` 注入 `GUI_PASSWORD`，首次启动写入容器 `data` 配置；
- 建议 `changeable: true`，用户可在应用设置页修改，修改后重启生效。

## 7.5 权限与目录

- 声明 `NETWORK.ACCESS_INTERNET`（同步需外网）；
- 不声明 `SYSTEM.EXEC_SYSTEM_COMMAND`（Syncthing 无需执行宿主机命令）；
- 数据目录：`data` → 容器内 `/var/syncthing`（配置 + 默认库）；
- 同步目录：通过 `allow_add_access_path: true` 让用户授权文件夹，挂载为 `/var/syncthing/Sync` 或 `UGAPP_SHARED_DIR`；
- 非 root：通过 `PUID`/`PGID` 对齐宿主机用户，避免卷权限拒绝。

## 7.6 设计决策状态（已确认 / 待验证）

| # | 事项 | 状态 | 决策 |
|---|------|------|------|
| 1 | 图标规格 | 已确认（建议） | 512×512 PNG，透明背景（见 `build/make-icon.ps1`） |
| 2 | `start_cmd` 语义 | 已确认 | 规范 `02-project-yaml.md` 明确：Docker 应用留空 `""`，由系统按 `docker-compose.yaml` 拉起 |
| 3 | GUI 密码策略 | 已确认 | 经 `GUI_PASSWORD` 参数注入，安装时必填，`changeable: true` |
| 4 | `only_admin` | 已确认 | `true`（同步属系统级操作） |
| 5 | 依赖版本基线 | 已确认 | `depend_fw_version: 1.13.0.0000`、`depend_docker_version: 1.7.0.0000` |
| 6 | 同步端口远程访问 | 已确认 | 仅 8384 经系统代理；22000/21027 仅直连（见 `docs/OPS.md`） |
| 7 | 多语言 | 已确认 | 至少 `en-US` + `zh-CN`；扩展见 `docs/specs/02` |
| 8 | 版本号策略 | 已确认 | `version` 跟随 Syncthing 上游；UPK 包版本 `应用.构建号` |
| 9 | `proxy_path` 留空 | 已确认 | `proxy_path` 为可选字段（规范标注「否」），`open_type: tab` 直接暴露原生 UI 时省略该字段符合规范 |

> 结论：设计层面 9 项均已给出明确决策，且全部依据 `docs/specs/02-project-yaml.md` 字段定义确认；最终打包合法性仍建议在 Debian 12 打包机执行 `ugcli check` / `ugcli pack` 实测确认。

## 7.7 后续实现清单（规范落地）

> 状态：规范落地实现进行中；代码仓库态文件已创建，打包机验证（`ugcli`）待执行。

- [x] `project.yaml`（按 02 节取值）— 已建于仓库根目录
- [x] `assets/icon.png`（512×512，由 `build/make-icon.ps1` 生成）
- [x] `rootfs_common/docker-compose.yaml`（按 03 节，由 `build/assemble.sh` 渲染生成）
- [x] `build/export-images.sh`（导出 amd64/arm64 镜像 tar）
- [x] `build/docker-compose.yaml.tpl`（模板）
- [x] `README.md`（安装、使用、端口、外网同步说明）
- [x] `build/assemble.sh` / `build/make-icon.ps1`（组装与图标辅助脚本）
- [x] `build/build-all.sh`（一键串联 export→assemble→check→pack）
- [x] `build/dx4600-build-env.sh`（DX4600 上创建 Debian 12 构建容器，复用宿主 docker.sock）
- [ ] `ugcli check` / `ugcli pack` 实测（需在 Debian 12 打包机执行 `./build-all.sh`）
