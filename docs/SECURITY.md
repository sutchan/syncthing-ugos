# 安全说明 (SECURITY)

> docs/SECURITY.md v1.1.0（文档自版本，与 UPK 包版本无关）

本文档说明 Syncthing for UGOS Pro 的权限模型、数据隐私与暴露风险，帮助管理员安全部署。平台安全红线见 `docs/specs/03-docker-image.md`。

## 1. 权限模型

应用声明的平台权限（见 `project.yaml` `permissions`）：

| 权限 | 用途 | 风险 |
|------|------|------|
| `NETWORK.ACCESS_INTERNET` | 设备间跨网络同步、连接中继 | 中（出网） |
| *(未声明)* `SYSTEM.EXEC_SYSTEM_COMMAND` | — | 未授予，降低提权面 |

**未授予** `SYSTEM.EXEC_SYSTEM_COMMAND`，容器不能执行宿主机命令，隔离性较好。

## 2. 容器隔离

遵循平台安全红线：

- 不使用 `privileged`、不 `cap_add`、不使用 `host` 网络 / PID / IPC；
- 容器以**非 root** 用户运行（Syncthing 官方镜像默认用户 `syncthing`），通过 `PUID`/`PGID` 对齐宿主权限；
- 数据卷仅挂载 `data` 与应用授权目录，卸载应用时随应用清理。

## 3. Web GUI 暴露风险

- GUI 端口 8384 经系统代理暴露，并支持 UGREENlink 远程访问；**任何能访问该地址的人都可操作同步配置**。
- 必须设置强 `GUI_PASSWORD`（新版 Syncthing 已禁止空密码）；
- 如非必要，避免在公网长期开放 8384，或仅通过 UGREENlink 受限访问；
- `only_admin: true`，仅管理员可配置，普通用户不应获得管理入口。

## 4. 同步数据隐私

- 同步内容经加密信道在设备间传输（Syncthing 默认 TLS）；
- 中继服务器（`relays.syncthing.net`）仅转发加密流量，不解密内容，但建议敏感数据优先直连；
- 用户授权目录（`UGAPP_SHARED_DIR`）仅应挂载确需同步的文件夹，避免误包含系统/隐私目录。

## 5. 版本与漏洞

- `version` 跟随 Syncthing 上游，安全公告见 <https://github.com/syncthing/syncthing/security/advisories>；
- 发现高危漏洞时，按 [OPS.md](./OPS.md) 升级章节尽快更新镜像版本并重新打包发布；
- 上游镜像固定具体 tag（如 `1.27.0`），**不使用 `latest`**，避免不可控变更。

## 6. 漏洞报告

如发现本项目相关安全问题（非上游 Syncthing 本身的漏洞），请：

- 通过项目 Issue 私信/邮件联系维护者，勿公开披露细节；
- 提供复现步骤、影响范围与日志（脱敏）。

## 7. 数据备份建议

- 同步 ≠ 备份。设备误删会同步删除，建议对关键目录保留独立备份（见 [OPS.md](./OPS.md) 第 3 节）；
- 启用 Syncthing 的「文件版本控制」（GUI 文件夹设置 → 版本控制）可缓解误删。
