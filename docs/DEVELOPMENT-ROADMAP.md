# Syncthing for UGOS Pro — 应用开发与迁移任务规划

> 路径：docs/DEVELOPMENT-ROADMAP.md
> 文档版本：v1.0.0
> 适用包版本：UPK `1.27.0.5`（应用版本 `1.27.0` + 构建号 `5`）
> 生成日期：2026-11-19
> 定位：本文是**开发/迁移任务的唯一行动清单**，事实陈述以仓库真相源为准，行动项标注来源与待验证状态。

## 0. 真相源与证据基线

本文所有"现状"结论均来自下列文件，避免按记忆或文档二手描述推断：

| 事实 | 真相源 | 当前值 |
|------|--------|--------|
| UPK 包版本 | `VERSION` | `1.27.0.5` |
| 应用/上游版本 | `project.yaml` `version` | `1.27.0` |
| 镜像 tag 真相源 | `project.yaml` `x_image_tag` | `1.27.0` |
| 固件依赖 | `project.yaml` `depend_fw_version` | `1.13.0.0000` |
| Docker 依赖 | `project.yaml` `depend_docker_version` | `1.7.0.0000` |
| 迁移声明 | `project.yaml` `support_migration` | `false` |
| Web 工作台版本 | `package.json` `version` | `1.27.0` |
| 变更记录 | `CHANGELOG.md` | 最新 `1.27.0.5`（2026-08-13） |

> 注意：`project.yaml` 头部注释自称 `v1.0.3`，`00-overview.md` 为 `v1.2.0`，`docs/README.md` 为 `v1.0.0`——这些是**文档自版本**，与 UPK 包版本无关（见 `docs/README.md` §四）。

---

## 1. 目标版本与兼容矩阵

### 1.1 目标版本

- **本轮目标包版本**：`1.27.0.5`（保持当前，除非有功能变更再递增构建号）。
- **上游 Syncthing 版本**：`1.27.0`（固定 tag，**不使用 `latest`**，见 `SECURITY.md` §5）。
- **镜像**：`docker.io/syncthing/syncthing:1.27.0`，由 `x_image_tag` 单点控制。
- **升级策略**：应用版本跟随上游（x.y.z），UPK 构建号由 `ugcli pack --build N` 递增；二者组合成产物名 `{arch}_{appid}_{version}.{build}.upk`。

### 1.2 兼容矩阵

| 维度 | 要求 | 来源 |
|------|------|------|
| UGOS Pro 固件 | ≥ `1.13.0.0000` | `project.yaml` `depend_fw_version` |
| Docker 套件 | ≥ `1.7.0.0000` | `project.yaml` `depend_docker_version` |
| 底层系统 | Debian 12 (Bookworm) | `docs/specs/04` §4.1 |
| CPU 架构 | `amd64` / `arm64` | `project.yaml` `support_arch` |
| 客户端 | `app` / `pc` | `project.yaml` `supports` |
| 运行身份 | 非 root（`PUID`/`PGID` 对齐） | `docs/specs/07` §7.5 |

> 兼容矩阵需在真机（1.13.0.0000 基线固件）实测确认，当前仅有文档声明，无实测记录。

---

## 2. 现有功能完整性梳理

状态标记：✅ 已实现且有真相源 / ⚠️ 部分实现或有缺口 / ❌ 缺失 / ❓ 文档声明但未经实测。

### 2.1 服务启动

| 项 | 状态 | 现状 | 缺口 |
|----|------|------|------|
| 容器拉起方式 | ✅ | `start_cmd: ""`，系统按 `rootfs_common/docker-compose.yaml` 拉起（`project.yaml`、`05` §5.1） | — |
| compose 自启动 | ✅ | `restart: always`（`docker-compose.yaml.tpl` L20） | 需验证平台停止应用时不被 `always` 反向拉起 |
| 启动完成探测 | ✅ | 系统探测 `port: 8384` 可连接（`05` §5.1） | GUI 密码错误时端口仍通但无法登录，探测可能误判"成功" |
| 优雅退出 | ✅ | 官方镜像处理 `SIGTERM`，10s 内退出（`05` §5.1） | 未实测 |

### 2.2 配置持久化

| 项 | 状态 | 现状 | 缺口 |
|----|------|------|------|
| 持久化路径 | ✅ | `./data:/var/syncthing`（`docker-compose.yaml.tpl` L6），含 `config.xml`/`cert.pem`/`key.pem`/`index-*`（`OPS.md` §3） | — |
| 配置注入 | ⚠️ | `GUI_PASSWORD`/`PUID`/`PGID`/`TZ` 经环境变量注入（`05` §5.3） | `GUI_PASSWORD` 是否被 Syncthing 官方镜像 entrypoint 消费**存疑**（见 §5 BUG-01） |
| 配置变更生效 | ⚠️ | 改 `changeable` 项需重启（`OPS.md` §2） | 文档自述"取决于版本对参数注入的处理方式"（`OPS.md` §6.4），行为不确定 |
| 卸载数据保留 | ✅ | `data` 随应用目录，卸载时可选保留（`OPS.md` §4） | 需实测"卸载并保留数据"是否真的保留 `@appdata` |

### 2.3 权限与目录映射

| 项 | 状态 | 现状 | 缺口 |
|----|------|------|------|
| 非 root 运行 | ✅ | 官方镜像 `syncthing` 用户 + `PUID`/`PGID` + `UMASK=022` | — |
| 同步目录授权 | ✅ | `allow_add_access_path: true`，`${UGAPP_SHARED_DIR}` → `/var/syncthing/Sync` | compose 里该挂载**无 `:ro`/条件判断**，未授权时变量为空可能导致无效挂载（见 §5 BUG-02） |
| 平台权限 | ✅ | 仅 `NETWORK.ACCESS_INTERNET`，无 `SYSTEM.EXEC_SYSTEM_COMMAND`（`SECURITY.md` §1） | — |
| 目录可写校验 | ❌ | 无安装前/运行时校验 `PUID`/`PGID` 对挂载目录可写 | 权限拒绝只能事后从日志排查（`OPS.md` §6.2） |

### 2.4 端口与网络

| 项 | 状态 | 现状 | 缺口 |
|----|------|------|------|
| GUI 端口 | ✅ | `port: 8384`，compose `8384:8384`，系统代理 + UGREENlink | — |
| 同步端口 | ✅ | `22000/tcp+udp`、`21027/udp` 映射，不走系统代理（`07` §7.2） | — |
| 外网同步 | ⚠️ | 建议端口映射/中继/公网地址（`OPS.md` §5） | 属用户侧配置，应用不提供引导或检测 |

### 2.5 日志与错误处理

| 项 | 状态 | 现状 | 缺口 |
|----|------|------|------|
| 平台日志 | ✅ | `log/{appid}.log`（`04` §4.1） | — |
| 容器日志 | ✅ | `docker logs syncthing`（`OPS.md` §7） | — |
| Syncthing 日志级别 | ✅ | GUI 或 `config.xml` `<logger>` 调整（`OPS.md` §7） | — |
| 结构化错误码/健康检查 | ❌ | 无应用层健康检查脚本、无明确错误码表 | 启动失败仅靠日志文本判断 |

### 2.6 升级与回滚机制

| 项 | 状态 | 现状 | 缺口 |
|----|------|------|------|
| 应用包升级 | ⚠️ | 应用中心装新版 `.upk`，`data` 保留（`OPS.md` §4） | 未实测版本升级的索引兼容 |
| 镜像版本升级 | ⚠️ | 改 `x_image_tag` → 导出 → 打包 → 升级（`OPS.md` §4） | `x_image_tag` 未真正成为全链路真相源（见 §5 BUG-03） |
| 回滚 | ❓ | "卸载并保留数据"装旧版，或恢复 `data` 备份（`OPS.md` §4） | 官方回滚规则未获取（`08` §8.6 待补充），无标准化回滚 SOP |

---

## 3. 安装 / 卸载流程与验证要求

### 3.1 安装流程

1. 前置：固件 ≥ `1.13.0.0000`、Docker 套件 ≥ `1.7.0.0000`。
2. 授权：本机安装自研包需 `ugdev.sig` 上传至管理员个人文件夹（`08` §8.2）。
3. 安装：应用中心手动安装 `.upk`。
4. 配置：安装时必填 `GUI_PASSWORD`，可设 `PUID`/`PGID`/`TZ`。
5. 授权目录：应用设置中授权同步文件夹（触发 `UGAPP_SHARED_DIR` 注入）。
6. 启动：系统自动拉起容器，探测 8384。

**验证要求**
- [ ] 安装后容器自动 running，`docker ps --filter name=syncthing` 有输出。
- [ ] 浏览器访问 8384 出现 Syncthing 登录页（非 502/空白）。
- [ ] `GUI_PASSWORD` 可登录；错误密码被拒。
- [ ] 授权目录出现在容器内 `/var/syncthing/Sync` 且可写。
- [ ] `data` 目录下生成 `config.xml`、`cert.pem`、`key.pem`。

### 3.2 卸载流程（当前文档空白，需补齐）

需在 `OPS.md` 新增独立章节，明确两条路径：

| 路径 | 操作 | 数据结果 | 适用 |
|------|------|----------|------|
| 卸载并保留数据 | 应用中心卸载时勾选保留数据 | `/volumeX/@appdata/{appid}` 保留 | 升级/换机/重装 |
| 彻底卸载 | 卸载后手工删除 `@appdata`/`@applog`/`@appcache` | 全部清除 | 弃用 |

**验证要求**
- [ ] "卸载并保留数据"后 `config.xml`/`key.pem` 仍在（需在真机确认平台行为）。
- [ ] 卸载后容器 `syncthing` 不再运行、8384 不再监听。
- [ ] 彻底卸载后无残留卷/容器（列出清理清单）。

### 3.3 依赖项与验证

| 依赖 | 类型 | 验证命令/方式 |
|------|------|---------------|
| 固件/Docker 套件版本 | 运行 | 系统信息页核对 ≥ 基线 |
| `ugdev.sig` | 运行（自研包） | 管理员个人文件夹存在且被接受 |
| Docker 镜像 tar | 打包 | `tar -tf` + `manifest.json` 解析 tag 一致性（**当前校验为假校验，见 BUG-04**） |
| `ugcli` | 打包 | `ugcli --version`（`06` §6.1） |
| `python3` / `docker buildx` | 打包 | 打包机 `command -v` |

### 3.4 自启动配置与验证要求

- 配置：`restart: always`（compose）+ 系统安装后自动启动（`05` §5.1）。
- 验证：
  - [ ] 安装后不手动启动，容器自动运行。
  - [ ] NAS 重启后容器自动恢复。
  - [ ] `docker stop syncthing` 后由 `always` 策略重新拉起（确认平台停止应用不被反向拉起）。

---

## 4. 数据迁移方案

### 4.1 迁移边界（关键澄清）

`project.yaml` 声明 `support_migration: false`，含义是**不支持平台级"安装目录迁移"**（换卷/换盘时系统不搬运安装目录）。这不等于"不支持用户手工迁移数据"。`OPS.md` §3 描述的是后者。两者需在文档中明确区分，避免审核/用户误解。

- 平台安装目录迁移：**不支持**（保持现状，不改 `support_migration`）。
- 手工数据迁移（换机/换卷）：**支持**，按下列 SOP。

### 4.2 迁移对象

| 对象 | 位置 | 作用 | 是否必须 |
|------|------|------|----------|
| 配置 | `data/config.xml` | 设备名、文件夹列表、GUI 设置、版本控制策略 | 必须 |
| 身份 | `data/key.pem` + `cert.pem` | 设备 ID 由 `key.pem` 派生，决定配对关系 | 必须（免重新配对） |
| 索引数据库 | `data/index-*` | 文件索引，可重建 | 可选（大库建议带上） |
| 同步目录 | `UGAPP_SHARED_DIR` 指向的宿主目录 | 实际同步文件 | 必须 |
| 忽略规则 | 各同步目录 `.stignore` | 排除规则 | 建议 |

### 4.3 迁移步骤

**源端（旧 NAS）**
1. 应用中心停止应用（优雅退出，写完配置）。
2. 备份 `data` 目录：`tar czf syncthing-data-<date>.tar.gz /volumeX/@appdata/com.syncthing.docker.syncthing/`（`OPS.md` §3）。
3. 备份同步目录（含 `.stignore`），记录其绝对路径与权限（`PUID`/`PGID`）。
4. 导出设备 ID 与文件夹列表（GUI 或 `config.xml`）作为对照基线。

**目标端（新 NAS）**
1. 安装本应用（版本与源端一致或更高）。
2. 停止应用；将 `data` 备份解回目标 `@appdata` 对应目录，保持属主/权限。
3. 将同步目录放回目标路径，在应用设置中授权该目录（生成新的 `UGAPP_SHARED_DIR`）。
4. 因挂载点变化，需进入 GUI 核对每个文件夹的"路径"字段，改为容器内新挂载路径（`/var/syncthing/Sync/...` 或新增授权映射）。
5. 启动应用，观察日志索引状态。

### 4.4 校验方式

| 校验项 | 方式 | 通过判据 |
|--------|------|----------|
| 身份一致 | 对比迁移前后 GUI 显示的 Device ID | 完全相同（源自 `key.pem`） |
| 配置完整 | 对比文件夹数量、ID、共享设备列表 | 与基线一致 |
| 目录可写 | 容器内 `touch /var/syncthing/Sync/.migration-check` | 成功且属主正确 |
| 索引健康 | 日志/GUI 各文件夹状态 | 无 `error`，从 `syncing` 收敛到 `idle` |
| 数据一致 | 抽样对比源/目标文件数量与关键文件哈希 | 一致 |
| 无重复配对 | 远程设备列表连接状态 | 旧设备自动连回，无需重新添加 |

---

## 5. 待修复问题清单

> 严重度：**P0** 阻断发布 / **P1** 影响正确性或可维护性 / **P2** 改进项。

| ID | 严重度 | 问题 | 证据 | 影响 | 建议修复 |
|----|--------|------|------|------|----------|
| BUG-01 | P0 | `GUI_PASSWORD` 经环境变量注入，但 Syncthing 官方镜像是否消费该变量**未经实测**，文档亦自述不确定 | `docker-compose.yaml.tpl` L18；`OPS.md` §6.4 | 用户设了密码却登不上，或空密码被新版拒绝 | 真机验证；若无效，改用首次启动写 `config.xml` 或 GUI 引导设密码，并修正文档 |
| BUG-02 | P0 | compose 中 `${UGAPP_SHARED_DIR}` 挂载无存在性/空值防护 | `docker-compose.yaml.tpl` L7 | 用户未授权目录时变量为空，可能导致无效挂载、容器启动失败 | 验证平台未授权时的变量值；必要时改挂载策略或提供默认子目录 |
| BUG-03 | P1 | `x_image_tag` 未成为全链路真相源：`assemble.sh` 默认硬编码 tag，`build-all.sh` 用位置参数 `VERSION` 拼镜像名 | `assemble.sh` L8；`build-all.sh` L27；`CHANGELOG.md` 1.27.0.4 声称已统一 | 改 `x_image_tag` 不生效，镜像 tag 与文档脱节 | 令 `build-all.sh`/`assemble.sh` 从 `project.yaml` 读取 `x_image_tag`，参数仅覆盖 |
| BUG-04 | P1 | 镜像 tar 校验是假校验：仅 `grep -c manifest.json`，未解析 tag 一致性；与文档/CHANGELOG 声明的 python3 解析不符 | `export-images.sh` L26-33；`DEVELOPMENT.md` §4；`CHANGELOG.md` 1.27.0.2 | 错架构/错 tag 镜像被静默打入包 | 恢复 `manifest.json` 的 python3 解析校验 + tag 一致性断言 |
| BUG-05 | P1 | 端口在 compose 模板中硬编码 `8384:8384`，与 `api/project/route.ts` 动态生成的 `${port}:8384` 不一致 | `docker-compose.yaml.tpl` L10；`api/project/route.ts` L132 | 改 `project.yaml` `port` 后模板产物与校验预览不一致 | 模板端口也从 `project.yaml` 渲染 |
| BUG-06 | P1 | 卸载流程无独立章节；回滚无标准 SOP（`08` §8.6 官方规则待补） | `OPS.md` 仅 §4 一句话；`08` §8.6 | 用户误删数据、审核材料不全 | 按 §3.2 补齐卸载双路径 + 回滚 SOP |
| BUG-07 | P1 | 无安装前目录权限预检与运行时健康检查 | 全仓搜索无相关脚本 | 权限问题只能事后排障 | 增加可写性预检与 8384 健康检查 |
| BUG-08 | P2 | `ugcli check`/`ugcli pack` 从未实测 | `07` §7.7 最后一项未勾选 | 打包合法性未验证，上架有风险 | 在 Debian 12 打包机执行 `build-all.sh` |
| BUG-09 | P2 | Web 工作台 4 面板数据为硬编码模拟数据 | `api/syncthing/route.ts` L44 起全为写死的 `statusState` | 无法反映真实 NAS 状态 | 明确工作台定位（真实管理 / 演示站），再决定是否接 API |
| BUG-10 | P2 | Web 工作台多文件 >200 行，违反单文件拆分规范 | `SyncthingManager.tsx` 543 行、`UpkValidator.tsx` 378 行、`ArchitectureViewer.tsx` 270 行、`DocsViewer.tsx` 220 行、`api/syncthing/route.ts` 218 行 | 可维护性差 | 按职责拆分，保持导出契约 |
| BUG-11 | P2 | Web 工作台缺 i18n 三语、页脚缺版本/build 标识 | `layout.tsx` 仅 `zh-CN`；`page.tsx` 页脚无版本 | 违反全局 i18n 与页脚规范 | 补简中/繁中/英文 + 页脚 `V1.27.0.5· build <10位>` |
| BUG-12 | P2 | `api/project` POST 直接写仓库 `project.yaml`/`VERSION`，无备份与格式保护 | `api/project/route.ts` L158-183 | 误操作可破坏真相源文件 | 写前备份 + 落盘校验 + 审计 |

---

## 6. 验收标准与测试场景

### 6.1 验收标准（AC）

- **AC-1** 在固件 `1.13.0.0000` 真机可完成安装、自启动、8384 登录全流程。
- **AC-2** 官方多架构镜像 tar 通过 `ugcli check`，tag/架构一致。
- **AC-3** `GUI_PASSWORD` 生效（能登录 + 错误密码被拒），配置重启后持久。
- **AC-4** 授权目录容器内可写，`PUID`/`PGID` 权限正确。
- **AC-5** 迁移后 Device ID 不变、文件夹关系不变、索引收敛到 `idle`、抽样文件一致。
- **AC-6** 升级与回滚后配置不丢、服务可用。
- **AC-7** 卸载两路径行为符合 §3.2 定义。
- **AC-8** 全链路真相源一致：镜像 tag 仅由 `x_image_tag` 控制，`VERSION`/`CHANGELOG` 同步。

### 6.2 测试场景

| 场景 | 前置 | 步骤 | 通过判据 |
|------|------|------|----------|
| **S1 全新安装** | 干净 NAS（≥基线固件），有 `ugdev.sig` | 安装 `.upk` → 填 `GUI_PASSWORD` → 授权目录 → 打开 8384 → 建文件夹 → 重启 NAS | 容器自启、登录成功、目录可写、重启后配置与文件夹仍在（AC-1/3/4） |
| **S2 升级安装** | 已装 `1.27.0.5`，`data` 有真实配置与配对设备 | 安装新版（构建号+1 / 镜像版本升级）→ 观察日志 | 配置/设备/文件夹保留，索引无报错，服务可用（AC-3/6/8） |
| **S3 迁移后同步** | 旧 NAS 运行 + 新 NAS 已装应用 | 按 §4.3 迁移 → 启动 → 校验表逐项核对 | Device ID 一致、连接恢复、状态收敛 `idle`、抽样哈希一致（AC-5） |
| **S4 异常恢复** | 已装应用且有数据 | 分别制造：①容器被 kill ②同步目录权限改错 ③回滚到上一版 ④迁移中断后重试 | ①`always` 自恢复 ②日志清晰可定位 ③配置不丢 ④可从备份重入且幂等（AC-6/7） |

---

## 7. 分阶段任务优先级与交付物

### 阶段 P0 — 发布阻断项（目标：可安全打包装箱）

| 任务 | 关联 BUG | 交付物 | 退出条件 |
|------|----------|--------|----------|
| T0-1 真机验证 `GUI_PASSWORD` 生效并定稿方案 | BUG-01 | 验证记录 + 修正后的 compose/文档 | AC-3 通过 |
| T0-2 验证 `UGAPP_SHARED_DIR` 未授权时空值行为并修复挂载 | BUG-02 | 修复后的 `docker-compose.yaml.tpl` | AC-4 通过 |
| T0-3 打包机执行 `ugcli check` / `ugcli pack` | BUG-08 | `.upk` 产物 + check 输出 | AC-2 通过 |

### 阶段 P1 — 正确性与可维护性

| 任务 | 关联 BUG | 交付物 | 退出条件 |
|------|----------|--------|----------|
| T1-1 `x_image_tag` 全链路真相源改造 | BUG-03/05 | 改造后的 `build-all.sh`/`assemble.sh`/模板 | 改 tag 后产物一致（AC-8） |
| T1-2 镜像 tar 校验恢复为 manifest 解析 | BUG-04 | 修复后的 `export-images.sh` + 单测 | 错 tag 镜像被拒 |
| T1-3 补齐卸载双路径与回滚 SOP | BUG-06 | 更新 `OPS.md` + 新增回滚章节 | AC-7 通过 |
| T1-4 增加权限预检与健康检查 | BUG-07 | 预检脚本 + 检查项 | AC-4 通过 |
| T1-5 明确"平台迁移"与"手工数据迁移"边界 | BUG-06 | 更新 `OPS.md`/`02` 说明 | 文档无歧义 |

### 阶段 P2 — 工程与体验改进

| 任务 | 关联 BUG | 交付物 | 退出条件 |
|------|----------|--------|----------|
| T2-1 明确 Web 工作台定位，处理模拟数据 | BUG-09 | 定位说明 + 对应实现/标注 | 定位文档化 |
| T2-2 Web 工作台超长文件拆分 | BUG-10 | 拆分后组件（≤200 行） | 导出契约不变、构建通过 |
| T2-3 Web 工作台 i18n 三语 + 页脚版本/build | BUG-11 | 语言包 + 页脚组件 | 简中/繁中/英切换、页脚符合规范 |
| T2-4 `api/project` 写入加备份与校验 | BUG-12 | 安全写入实现 | 误写可恢复 |

### 7.1 依赖关系

- P0 全部完成并完成真机验证后，方可进入提审（对应 `08` §8.3）。
- T1-1 是 T0-3 的输入（tag 真相源统一后打包才有意义），建议 T1-1 与 P0 并行推进。
- P2 与打包发布解耦，可并行，不阻断上架。

### 7.2 本轮建议起手

1. **T0-1 / T0-2**（真机验证，阻断发布）——需在有 `ugdev.sig` 的 UGOS Pro 真机执行。
2. **T1-1 / T1-4**（代码层，不依赖真机）——可立即在仓库实施。
3. 真机验证结果回填本文 §2 状态列，作为下一轮基线。

---

## 8. 待用户决策

1. Web 工作台定位：真实管理工具 / 内部演示站？（影响 BUG-09/T2-1 范围）
2. 是否本轮升级上游 Syncthing 版本（当前锁定 `1.27.0`）？若是需另立版本升级任务。
3. 是否有可用的 UGOS Pro 真机与 `ugdev.sig` 用于 P0 验证？若无，P0 只能标注"待真机验证"，不视为完成。
