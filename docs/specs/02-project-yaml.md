# 02 — project.yaml 字段规范

> 规范来源：<https://developer.ugnas.com/doc/tools/project-yaml.html>
> 当前 `spec_version` 固定为 `2.1`。

## 2.1 字段总表

### 基础配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `spec_version` | string | 是 | 当前版本 `2.1` |
| `app_id` | string | 是 | 应用 ID，上架后不可修改；格式 `com.公司名.应用名`（小写字母、数字、点，字母开头） |
| `version` | string | 是 | 版本号 `x.y.z` |
| `support_arch` | string[] | 是 | 支持架构：`amd64`、`arm64` |
| `supports` | string[] | 否 | 客户端类型：`app`/`pc`/`tv`，默认 `app`、`pc` |
| `tag_types` | string[] | 是 | 应用类别：`system`/`media`/`utility`/`security`/`download`/`backup`/`devtool` |

### 运行配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `start_cmd` | string | 是 | 启动命令（Docker 应用可填 compose 服务名或占位，实际由 compose 拉起） |
| `port` | number | 是 | 服务端口（Syncthing GUI 端口） |
| `proxy_path` | string | 否 | 代理路径前缀，如 `api/v1` |
| `open_type` | string | 是 | `inner`（桌面窗口）或 `tab`（浏览器标签） |
| `depend_fw_version` | string | 是 | 依赖最低系统版本，如 `1.13.0.0000` |

### 功能配置

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `support_migration` | boolean | 否 | 是否支持迁移安装目录，默认 `false` |
| `allow_add_access_path` | boolean | 否 | 是否允许用户授权访问文件夹，默认 `false` |

### 权限配置

```yaml
permissions:
  - SYSTEM.EXEC_SYSTEM_COMMAND # 执行系统命令
  - NETWORK.ACCESS_INTERNET   # 访问网络
```

### Docker 应用专用

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `is_docker_app` | boolean | 是 | 设为 `true` |
| `depend_docker_version` | string | 是 | 依赖 Docker 套件版本 |
| `only_admin` | boolean | 否 | 仅管理员可用 |

### parameters 配置项

`parameters` 为数组，每个元素字段：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `key` | string | 是 | 配置项标识（运行时作为环境变量名） |
| `type` | string | 是 | `string` / `number` / `path` / `password` |
| `required` | boolean | 否 | 是否必填 |
| `changeable` | boolean | 否 | 配置后是否可修改 |
| `multi` | boolean | 否 | 是否支持多值 |
| `i18n` | object | 是 | 多语言展示，含 `name` + `description`，按 `en-US`/`zh-CN` 等语言码组织 |

### i18n 应用级

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | 是 | 应用显示名称 |
| `description` | string | 是 | 应用描述 |
| `author` | string | 是 | 应用开发者 |
| `official` | string | 否 | 官网链接 |
| `help` | string | 否 | 帮助链接 |
| `publisher` | string | 否 | 发布者 |
| `publisher_link` | string | 否 | 发布者官网链接 |

## 2.2 Syncthing 应用取值建议

```yaml
spec_version: "2.1"
app_id: com.syncthing.docker.syncthing
version: 1.27.0
support_arch:
  - amd64
  - arm64
supports:
  - app
  - pc
start_cmd: docker-compose up -d   # 占位；实际由系统按 compose 拉起
port: 8384                         # Syncthing Web GUI 默认端口
open_type: tab                     # 浏览器标签打开 Syncthing 原生 UI
tag_types:
  - utility
  - backup
depend_fw_version: 1.13.0.0000
is_docker_app: true
depend_docker_version: 1.7.0.0000
only_admin: true
allow_add_access_path: true        # 允许用户授权同步目录
permissions:
  - NETWORK.ACCESS_INTERNET
parameters:
  - key: GUI_PASSWORD
    type: password
    required: true
    changeable: true
    i18n:
      en-US:
        name: GUI Password
        description: Password for Syncthing Web GUI
      zh-CN:
        name: GUI 管理密码
        description: Syncthing Web 管理界面登录密码
  - key: PUID
    type: number
    required: false
    changeable: true
    i18n:
      en-US:
        name: User ID
        description: UID for files ownership inside container
      zh-CN:
        name: 用户 ID
        description: 容器内文件归属的用户 ID
  - key: PGID
    type: number
    required: false
    changeable: true
    i18n:
      en-US:
        name: Group ID
        description: GID for files ownership inside container
      zh-CN:
        name: 用户组 ID
        description: 容器内文件归属的用户组 ID
  - key: TZ
    type: string
    required: false
    changeable: true
    i18n:
      en-US:
        name: Timezone
        description: Container timezone, e.g. Asia/Shanghai
      zh-CN:
        name: 时区
        description: 容器内时区，如 Asia/Shanghai
i18n:
  en-US:
    name: Syncthing
    description: Open-source continuous file synchronization
    author: Syncthing Community
    official: https://syncthing.net
    help: https://docs.syncthing.net
  zh-CN:
    name: Syncthing
    description: 开源的持续文件同步工具
    author: Syncthing 社区
    official: https://syncthing.net
    help: https://docs.syncthing.net
```

> 说明：`start_cmd` 在 Docker 应用形态下由平台依据 `docker-compose.yaml` 拉起容器，字段值以平台实际要求为准（可填入服务名或占位命令）。本应用不设置 `proxy_path`（省略该字段），即不通过系统网关代理，直接以 `port` 暴露原生 UI（配合 `open_type: tab`）。
