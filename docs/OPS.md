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

### 迁移到其他设备

1. 在新 NAS 安装本应用；
2. 停止应用，将 `data` 备份解回对应 `@appdata` 目录；
3. 启动应用，设备 ID 与配对关系保持不变（若设备 ID 变化需重新添加远程设备）。

## 4. 升级

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

- 若新版异常，在应用中心「卸载并保留数据」后安装上一版 `.upk`；
- 或恢复 `data` 备份至升级前状态。

## 5. 端口与网络

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

## 6. 常见问题

### 6.1 打不开 Web GUI（8384）
- 确认应用已启动、端口 8384 未被占用；
- 查看日志 `log/` 是否容器启动失败（如卷权限）；
- 确认 `GUI_PASSWORD` 已设置（新版禁止空密码）。

### 6.2 同步目录权限拒绝
- 挂载目录需对 `PUID`/`PGID` 可写；
- 若未显式设置，检查默认用户（Syncthing 官方镜像默认 `syncthing` 用户）对宿主目录权限；
- 建议显式设置 `PUID`/`PGID` 与宿主共享用户一致。

### 6.3 设备无法互相发现/连接
- 局域网：确认 21027/UDP、22000 在防火墙放行；
- 跨网：见 5「外网同步建议」配置中继或端口映射。

### 6.4 忘记 GUI 密码
- 停止应用，编辑 `data/config.xml` 删除 `<gui><password></password>` 与 `<gui><user></user>` 节点，重启后重新设置；
- 或重设 `GUI_PASSWORD` 参数并重启（取决于版本对参数注入的处理方式）。

### 6.5 索引重建缓慢
- 首次添加大目录会扫描并建立索引，属正常；
- 避免在同步目录存放频繁变动的小文件（如数据库文件），建议改用 `.stignore` 排除。

## 7. 日志与诊断

- 容器日志：`docker logs syncthing`；
- 平台日志：`/var/packages/com.syncthing.docker.syncthing/log/com.syncthing.docker.syncthing.log`；
- Syncthing 自身日志级别可在 GUI「操作 → 日志」或 `config.xml` 的 `<logger>` 调整。
