# 08 — 发布与上架规范

> 规范来源：<https://developer.ugnas.com/doc/backend/quick-start/publish.html>
> 完整上架流程参考：<https://developer.ugnas.com/doc/backend/quick-start/flow.html>
> 本文件基于已确认的发布页要点整理；完整审核要求以官方 `flow.html` 为准。

## 8.1 发布前置条件

- 应用已在本地设备（UGOS Pro 1.13.0.0000+）测试通过；
- 已完成 `ugcli pack`，产出 `.upk` 安装包（见 [06-build-pack.md](./06-build-pack.md)）；
- 已获得绿联开发者授权（见 8.2）。

## 8.2 开发者授权（ugdev.sig）

- 向绿联官方提供设备 **序列号、MAC 地址、管理员用户名**；
- 官方返回 `ugdev.sig` 授权文件；
- 将 `ugdev.sig` 上传至 NAS **管理员个人文件夹**；
- 完成授权后方可在本机安装/调试自研 `.upk`。

## 8.3 提审与上架

- 本地测试通过后，将 `.upk` 文件通过**邮件**发送给绿联官方审核；
- 审核通过后，应用上架到 **应用中心**；
- 具体提审材料清单、审核标准、版本迭代与回滚规则以官方 `flow.html` 为准（文档暂未完整获取，待补充）。

## 8.4 版本与迭代

- `project.yaml` 的 `version` 为应用版本，每次上架需递增；
- `ugcli pack --build N` 的 `build` 为构建号，与 `version` 共同构成产物名 `{arch}_{appid}_{version}.{build}.upk`；
- 迭代时建议同步更新 `i18n.description`、CHANGELOG（若有），保持 `app_id` 不变（`app_id` 上架后不可修改）。

## 8.5 Syncthing 上架注意

- 应用分类建议 `utility` + `backup`（见 [02-project-yaml.md](./02-project-yaml.md) `tag_types`）；
- 需声明 `NETWORK.ACCESS_INTERNET`（同步依赖外网），避免审核因权限不足被拒；
- 安全红线（[03-docker-image.md](./03-docker-image.md)）必须全部满足，否则审核不通过；
- 图标 `icon.png` 需符合平台规范（尺寸待官方明确，建议 512×512 PNG）。

## 8.6 待补充（依赖官方 flow.html）

- 提审材料完整清单（截图、说明文档、隐私政策等要求）；
- 审核周期与驳回处理流程；
- 线上版本回滚机制；
- 多架构产物是否需分别提审。
