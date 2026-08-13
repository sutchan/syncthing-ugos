# 04 — 运行环境、目录、权限、环境变量

> 规范来源：<https://developer.ugnas.com/doc/backend/application/runtime-environment.html>
> 系统基础环境：<https://github.com/ugreen-opensource/ugospro-debian12>（UGOS Pro 基于 Debian 12 Bookworm）

## 4.1 受限运行环境

应用默认运行在受限环境中：

- 独立的**非 root 运行用户**，所有进程以该用户身份运行；
- 独立的文件系统视图；
- 受限的网络访问权限；
- 可只读访问系统目录：`/lib`、`/sys`、`/dev`；
- 若声明 `SYSTEM.EXEC_SYSTEM_COMMAND` 权限，可额外访问 `/usr/bin`、`/usr/sbin`、`/bin`、`/sbin`；
- 进程标准输出/错误自动重定向至 `log/{appid}.log`。

> **基础环境一致性（Debian 12）**：UGOS Pro 基于 Debian 12 (Bookworm) 构建（见 `ugospro-debian12` 合规仓库）。
> Docker 应用建议以 Debian 12 系基础镜像（如 `debian:bookworm-slim` 或 Syncthing 官方基于 Debian 的镜像）构建，
> 以获得与宿主一致的 glibc/库环境，减少兼容性问题。该上游仓库仅为开源合规与根文件系统复刻用途，
> **不定义**运行时用户、目录或 namespace 限制，应用约束仍以开发者平台文档为准。

## 4.2 目录路径约定

应用安装目录格式：`/volume{卷号}/@appstore/{app_id}`，系统软链至 `/var/packages/{app_id}/`。

| 逻辑目录 | 实际路径 | 权限 | 用途 |
|----------|----------|------|------|
| 安装目录 | `/var/packages/{appid}` | 只读 | 程序与元数据 |
| `data` | `/var/packages/{appid}/data` → `/volume{卷号}/@appdata/{appid}` | 读写 | 应用数据（工作目录） |
| `log` | `/var/packages/{appid}/log` → `/volume{卷号}/@applog/{appid}` | 读写 | 日志 |
| `cache` | `/var/packages/{appid}/cache` → `/volume{卷号}/@appcache/{appid}` | 读写 | 缓存 |
| `shared` | `/var/packages/{appid}/shared` | 读写 | 用户授权文件夹软链（需 `allow_add_access_path: true`） |

> Docker 应用通过 compose 卷挂载将 `./data` 映射到容器内的 `/var/syncthing`（Syncthing 主目录），实现持久化。

## 4.3 权限声明（permissions）

| 权限值 | 含义 |
|--------|------|
| `SYSTEM.EXEC_SYSTEM_COMMAND` | 执行系统命令 |
| `NETWORK.ACCESS_INTERNET` | 访问外网 |

Syncthing 需跨设备同步，至少声明 `NETWORK.ACCESS_INTERNET`。默认无需 `SYSTEM.EXEC_SYSTEM_COMMAND`。

## 4.4 环境变量约定

### 系统环境变量（带 `UGAPP_` 前缀，应用只读）

| 变量 | 含义 |
|------|------|
| `UGAPP_INSTALL_DIR` | 应用安装目录 |
| `UGAPP_DATA_DIR` | 应用数据目录 |
| `UGAPP_CACHE_DIR` | 应用缓存目录 |
| `UGAPP_LOG_DIR` | 应用日志目录 |
| `UGAPP_SHARED_DIR` | 用户授权的可访问目录 |

### 自定义配置项

- 通过环境变量传入，变量名与 `parameters` 中的 `key` 一致；
- **约定**：自定义配置避免使用 `UGAPP_` 前缀，以防与系统变量冲突；
- 对于 Syncthing，自定义变量包括 `GUI_PASSWORD`、`PUID`、`PGID`、`TZ`（见 [02-project-yaml.md](./02-project-yaml.md)）。

## 4.5 非 root 运行要点（Syncthing）

- 官方镜像默认以 `syncthing` 用户运行，容器内外权限通过 `PUID`/`PGID` 对齐；
- 挂载的数据卷目录（`data`、`SYNC_PATH`）需保证对应 `PUID`/`PGID` 可写，避免权限拒绝；
- 建议 `UMASK=022` 控制新建文件权限。
