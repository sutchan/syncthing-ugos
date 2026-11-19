# 06 — 构建与打包规范（ugcli）

> 路径：docs/specs/06-build-pack.md
> 文档版本：v1.1.0（文档自版本，与 UPK 包版本无关）
> 规范来源：<https://developer.ugnas.com/doc/tools/ugcli.html>
> 开发准备：<https://developer.ugnas.com/doc/backend/quick-start/prepare.html>

## 6.1 环境准备

- 开发机：Debian 12（Linux），支持 X86_64 / ARM64；
- 测试设备：UGOS Pro 1.13.0.0000 及以上绿联 NAS；
- 安装开发者工具 `ugcli`（跨 Windows/Linux/macOS），`ugcli --version` 验证；
- NAS 开发者授权：向绿联官方提供设备序列号、MAC、管理员用户名，获取 `ugdev.sig` 并上传至管理员个人文件夹。

## 6.2 ugcli 命令

### 创建项目（交互式）

```bash
ugcli create my-app
```

交互项含：应用 ID、版本、类别、架构、客户端、打开方式、启动命令、端口、代理路径、多语言信息。

> 本项目可直接使用仓库内已写好的 `project.yaml`，跳过 `create` 或仅用于校验结构。

### 查看 / 修改配置

```bash
ugcli config list        # 查看配置
ugcli config edit        # 交互式修改
ugcli config edit i18n   # 新增语言
```

### 检查项目

```bash
ugcli check
```

检查 `project.yaml` 与 `rootfs_*` 目录结构是否符合规范。

### 打包

```bash
ugcli pack --arch all --build 1
ugcli pack --build 1 --arch amd64   # 仅打某一架构
```

参数：

- `--build` / `-b`：构建号（整数）；
- `--arch` / `-a`：目标架构 `amd64` / `arm64` / `all`。

产物命名：`{arch}_{appid}_{version}.{build}.upk`，位于 `build_dir/pkgs/upk/`。

## 6.3 本项目推荐构建流程

1. 由 `build/export-images.sh` 拉取并 `docker save` 导出 amd64/arm64 两套 Syncthing 镜像 tar 到 `rootfs_*/images/`；
2. 将 `project.yaml`、`assets/icon.png`、`build/docker-compose.yaml` 组装到打包目录 `rootfs_common/`；
3. `ugcli check` 校验；
4. `ugcli pack --arch all --build 1` 生成 `.upk`。

## 6.4 本地测试

- 通过 NAS「应用中心」手动安装生成的 `.upk`；
- 在「已安装」列表查看，点击「打开应用」进行功能验证；
- 异常排查日志：`/var/packages/{app_id}/log/{app_id}.log`。

## 6.5 支持语言

`en-US`、`zh-CN`、`de-DE`、`ja-JP`、`fr-FR`、`nl-NL`、`pt-PT`、`es-ES`、`it-IT`、`ko-KR`、`zh-TW`。本项目至少提供 `en-US` 与 `zh-CN`。
