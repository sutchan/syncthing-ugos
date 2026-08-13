# 05 — 应用生命周期、端口、配置、打开方式与登录认证

> 规范来源：
> - 启停：<https://developer.ugnas.com/doc/backend/application/start-stop.html>
> - 端口：<https://developer.ugnas.com/doc/backend/application/app-port.html>
> - 配置：<https://developer.ugnas.com/doc/backend/application/app-config.html>
> - 打开方式：<https://developer.ugnas.com/doc/backend/application/open-type.html>
> - 登录认证：<https://developer.ugnas.com/doc/backend/system-capabilities/login-auth.html>

## 5.1 启停生命周期

### 启动

- 应用安装后，系统**自动启动**后端服务（Docker 应用由 compose 拉起容器）；
- 系统通过**探测 `project.yaml` 声明的 `port` 是否可连接**来判断启动完成（Syncthing 即探测 8384 GUI）；
- 进程工作目录设为 `data` 目录。

### 停止

- 停止应用时，系统向服务进程发送 `SIGTERM`；
- 进程应在 **10 秒内**优雅退出（保存配置、关闭连接等）；
- 超时未退出则发送 `SIGKILL` 强制终止。

> Syncthing 官方镜像的 entrypoint 已正确处理 `SIGTERM` 优雅退出，无需额外处理。

## 5.2 端口规范

- 应用必须在 `project.yaml` 的 `port` 声明**一个固定端口**用于 HTTP 服务（Syncthing 为 8384）；
- 系统为已声明端口分配 HTTP 与 HTTPS 两个代理端口，并支持 UGREENlink 远程访问；
- 路径前缀与 `proxy_path` 匹配的请求会被转发到该 `port`；
- 应用可自行监听其他**未声明**端口（如 Syncthing 的 22000/21027），但系统**不**为其提供代理与远程访问。

## 5.3 配置（parameters）

- 自定义配置在 `project.yaml` 的 `parameters` 中声明；
- 支持类型：`string` / `number` / `path` / `password`；
- 配置值通过**环境变量**在运行时注入，变量名即 `key`；
- 用户可在应用设置页修改 `changeable: true` 的项，**修改后需重启应用生效**；
- 详见 [02-project-yaml.md](./02-project-yaml.md) 的 `parameters` 示例。

## 5.4 打开方式（open_type）

| 取值 | 含义 | JSSDK | 认证 |
|------|------|-------|------|
| `inner` | 系统桌面内独立窗口 | 支持 | 可集成 NAS 用户登录 |
| `tab` | 浏览器新标签页 | 不支持 | 应用自身实现 |

- Syncthing 自带完整 Web UI 与账号体系，建议 `open_type: tab`，直接暴露其原生 GUI，避免二次封装成本；
- 若未来需复用 NAS 登录，可改为 `inner` 并配置 `proxy_path`，通过系统网关注入认证头（见 5.5）。

## 5.5 登录认证（仅 inner 适用）

前提：`open_type: inner` 且配置了 `proxy_path`。

后端从系统网关转发的请求头获取登录用户：

| 请求头 | 含义 |
|--------|------|
| `Ugreen-User-ID` | 用户 ID |
| `Ugreen-User-Name` | 用户名 |
| `Ugreen-User-Type` | `admin` / `users` |

前端通过 UGOS JSSDK 获取 `third_token` 并在请求头携带 `Ugreen-Ttk`。

> 本项目采用 `open_type: tab`，Syncthing 自身负责认证，不依赖此机制；该小节仅供后续扩展参考。
