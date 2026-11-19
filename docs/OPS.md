# 运维与故障排查手册 (OPS)

本文档面向 NAS 管理员 / 使用者，说明 Syncthing for UGOS Pro 的日常运维、备份、升级与常见问题处理。开发/构建见 [DEVELOPMENT.md](./DEVELOPMENT.md)，平台规范见 `docs/specs/`。

## 1. 服务位置与状态

- 安装目录软链：`/var/packages/com.syncthing.docker.syncthing/`
- 数据目录：`/volumeX/@appdata/com.syncthing.docker.syncthing/`（容器内 `/var/syncthing`）
- 日志目录：`/var/packages/com.syncthing.docker.syncthing/log/`
- 容器名：`syncthing`（由 `docker-compose.yaml` 固定）

查看容器状态：

```bash
docker ps --filter name=syncthing
docker logs syncthing
```

## 2. 启停

- **启动/停止**：在 NAS「应用中心」对 Syncthing 执行启动/停止；系统探测 8384 端口就绪即视为启动成功。
- **优雅退出**：停止时系统发 `SIGTERM`，Syncthing 官方镜像已正确处理，应在 10 秒内退出；超时则 `SIGKILL`。
- **修改配置后重启**：在应用设置页修改 `GUI_PASSWORD`/`PUID`/`PGID`/`TZ` 后，**需重启应用生效**（环境变量注入时机为容器启动）。

## 3. 数据备份与迁移

> **迁移边界澄清**：`project.yaml` 的 `support_migration: false` 指的是**不支持平台级"安装目录迁移"**（换卷/换盘时系统不自动搬运安装目录）。这不等于禁止用户手工迁移数据。本节描述的是**手工数据迁移**（换机/换卷），与平台安装目录迁移是两回事，勿混淆。

### 备份

需备份两类数据：

1. **配置与索引**：`data` 目录（`config.xml`、`cert.pem`、`key.pem`、`index-*`）；
2. **同步文件**：用户授权的同步目录（默认 `UGAPP_SHARED_DIR` 挂载的 `/var/syncthing/Sync` 及自定义文件夹）。

```bash
# 备份 data 目录
tar czf syncthing-data-$(date +%F).tar.gz \
  /volumeX/@appdata/com.syncthing.docker.syncthing/
```

> 提示：迁移设备时，保留 `config.xml` 与证书可免重新配对设备 ID。

### 迁移到其他设备（手工数据迁移）

**源端（旧 NAS）**
1. 在应用中心停止应用，等待配置写盘（优雅退出）；
2. 备份 `data` 目录（见上）与同步目录（含 `.stignore`）；
3. 记录 GUI 显示的 Device ID、文件夹列表与共享设备列表作为对照基线。

**目标端（新 NAS）**
1. 安装本应用（版本与源端一致或更高）；
2. 停止应用，将 `data` 备份解回目标 `@appdata` 对应目录，保持属主/权限（对 `PUID`/`PGID` 可写）；
3. 将同步目录放回目标路径，在应用设置中重新授权该目录（平台生成新的 `UGAPP_SHARED_DIR`）；
4. 因挂载点可能变化，进入 GUI 核对每个文件夹的"路径"，指向容器内新挂载路径（`/var/syncthing/Sync/...`）；
5. 启动应用，观察日志索引状态。

**迁移校验**（全部通过才算迁移成功）

| 校验项 | 方式 | 通过判据 |
|--------|------|----------|
| 身份一致 | 对比迁移前后 GUI 的 Device ID | 完全相同（由 `key.pem` 派生，免重新配对） |
| 配置完整 | 对比文件夹数量/ID、共享设备列表 | 与基线一致 |
| 目录可写 | 容器内 `touch /var/syncthing/Sync/.migration-check` | 成功且属主为 `PUID`/`PGID` |
| 索引健康 | 日志/GUI 各文件夹状态 | 无 `error`，从 `syncing` 收敛到 `idle` |
| 数据一致 | 抽样对比文件数量与关键文件哈希 | 一致 |

> 迁移后远程设备应自动连回；若 Device ID 变化（如 `key.pem` 未迁移），需在设备上重新添加对方。

## 4. 安装与卸载

### 4.1 安装

1. 前置：固件 ≥ `1.13.0.0000`、Docker 套件 ≥ `1.7.0.0000`；自研包需 `ugdev.sig`（见 `docs/specs/08-publishing.md`）；
2. 应用中心手动安装 `.upk`；
3. 安装时必填 `GUI_PASSWORD`，可设 `PUID`/`PGID`/`TZ`；
4. 在应用设置中授权同步目录；
5. 系统自动拉起容器（compose `restart: always`），探测 8384 就绪。

安装验证：容器 running、8384 出现登录页、`GUI_PASSWORD` 可登录且错误密码被拒、授权目录容器内可写、`data` 下生成 `config.xml`/`cert.pem`/`key.pem`。

### 4.2 卸载

| 路径 | 操作 | 数据结果 | 适用场景 |
|------|------|----------|----------|
| 卸载并保留数据 | 应用中心卸载时勾选"保留数据" | `/volumeX/@appdata/com.syncthing.docker.syncthing` 保留 | 升级、换机、临时重装 |
| 彻底卸载 | 卸载后手工删除 `@appdata`/`@applog`/`@appcache` | 配置、身份、索引全部清除 | 弃用应用 |

卸载验证：容器 `syncthing` 不再运行、8384 不再监听；选择保留数据时确认 `config.xml`/`key.pem` 仍在；彻底卸载后无残留卷/容器。

> 卸载前请先按第 3 节备份 `data` 与同步目录；同步 ≠ 备份，误删会双向同步删除。

## 5. 升级与回滚

### 应用（本包）升级

- 通过「应用中心」安装新版 `.upk`；`data` 目录随应用保留，配置不丢。
- 构建号通过 `ugcli pack --build N` 递增，应用版本跟随 Syncthing 上游。

### Syncthing 版本升级

升级 Syncthing 镜像版本（如 1.27.0 → 1.28.0）步骤：

1. 更新 `project.yaml` 的 `x_image_tag`（镜像 tag 真相源，与 `version` 解耦）；
2. 重新导出镜像 tar、重新打包 `.upk`；
3. 应用中心升级安装；
4. 观察日志确认索引迁移成功（Syncthing 升级通常自动迁移数据库）。

### 回滚

当升级后出现异常（无法启动、索引报错、配置异常）时，按以下顺序选择回滚路径：

**路径 A — 保留数据降级（推荐，最快）**
1. 停止应用；
2. 在应用中心安装上一版 `.upk`（构建号更小的包）；
3. 启动应用，观察日志与文件夹状态。

**路径 B — 恢复升级前备份（数据层面回退）**
1. 停止应用；
2. 将升级前备份的 `data` 目录解回 `@appdata` 对应位置（覆盖当前配置/索引）；
3. 安装上一版 `.upk` 并启动；
4. 按第 3 节迁移校验表核对身份、配置与索引。

**回滚验证**：容器 running、8384 可登录、Device ID 与升级前一致、各文件夹状态收敛到 `idle`、抽样文件哈希一致。

> 注意：降级到更低的上游版本可能导致新版本写入的索引数据库格式不兼容。若路径 A 后索引报错，改用路径 B（连带恢复索引）或让 Syncthing 重建索引。

## 6. 端口与网络

| 端口 | 协议 | 用途 | 远程访问 |
|------|------|------|----------|
| 8384 | TCP | Web GUI | 经系统代理 + UGREENlink |
| 22000 | TCP/UDP | 设备间同步 | 否（仅直连/局域网） |
| 21027 | UDP | 本地发现 | 否 |

**外网同步建议**：
- 8384 可经 UGREENlink 远程管理；
- 设备间同步（22000）不走系统代理，跨公网需：
  - 在路由器做 22000 TCP/UDP 端口映射到 NAS；或
  - 使用 Syncthing 中继服务器（`relays.syncthing.net`，需外网可达）；
  - 或在「高级设置」为远程设备填写公网地址/端口。

## 7. 常见问题

### 7.1 打不开 Web GUI（8384）
- 确认应用已启动、端口 8384 未被占用；
- 查看日志 `log/` 是否容器启动失败（如卷权限）；
- 确认 `GUI_PASSWORD` 已设置（新版禁止空密码）。

### 7.2 同步目录权限拒绝
- 挂载目录需对 `PUID`/`PGID` 可写；
- 若未显式设置，检查默认用户（Syncthing 官方镜像默认 `syncthing` 用户）对宿主目录权限；
- 建议显式设置 `PUID`/`PGID` 与宿主共享用户一致。

### 7.3 设备无法互相发现/连接
- 局域网：确认 21027/UDP、22000 在防火墙放行；
- 跨网：见第 6 节「外网同步建议」配置中继或端口映射。

### 7.4 忘记 GUI 密码
- 停止应用，编辑 `data/config.xml` 删除 `<gui><password></password>` 与 `<gui><user></user>` 节点，重启后重新设置；
- 或重设 `GUI_PASSWORD` 参数并重启（取决于版本对参数注入的处理方式）。

### 7.5 索引重建缓慢
- 首次添加大目录会扫描并建立索引，属正常；
- 避免在同步目录存放频繁变动的小文件（如数据库文件），建议改用 `.stignore` 排除。

## 8. 日志与诊断

- 容器日志：`docker logs syncthing`；
- 平台日志：`/var/packages/com.syncthing.docker.syncthing/log/com.syncthing.docker.syncthing.log`；
- Syncthing 自身日志级别可在 GUI「操作 → 日志」或 `config.xml` 的 `<logger>` 调整。
