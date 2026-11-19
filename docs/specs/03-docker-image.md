# 03 — Docker 镜像与 compose 规范

> 路径：docs/specs/03-docker-image.md
> 文档版本：v1.1.0（文档自版本，与 UPK 包版本无关）
> 规范来源：<https://developer.ugnas.com/doc/backend/quick-start/develop-docker-app.html>

## 3.1 Dockerfile 与镜像构建

Docker 应用需将镜像导出为 `.tar`。Syncthing 官方已维护多架构镜像 `syncthing/syncthing`，**直接复用即可，无需自建 Dockerfile、不要覆盖其 `ENTRYPOINT`**（官方镜像 entrypoint 为 `/usr/bin/entrypoint.sh`，已处理 `SIGTERM` 优雅退出与非 root 运行）。

若确实需要在官方镜像基础上追加配置，应仅追加文件/环境变量，保持官方 entrypoint 不变：

```dockerfile
FROM syncthing/syncthing:1.27.0
# 仅追加必要配置文件，切勿覆盖官方 ENTRYPOINT / USER
COPY config-overrides/ /var/syncthing/
```

构建与导出（复用官方镜像时 `docker build` 可省略，直接 `docker pull` + `docker save`）：

```bash
# amd64
docker buildx build --platform linux/amd64 -t docker.io/syncthing/syncthing:1.27.0 .
docker save -o rootfs_amd64/images/syncthing-1.27.0-amd64.tar docker.io/syncthing/syncthing:1.27.0

# arm64
docker buildx build --platform linux/arm64 -t docker.io/syncthing/syncthing:1.27.0 .
docker save -o rootfs_arm64/images/syncthing-1.27.0-arm64.tar docker.io/syncthing/syncthing:1.27.0
```

### 镜像规范

- 所有引用镜像需导出为独立 `.tar`；
- 每个 `.tar` 只能有一个 tag，且与 `docker-compose.yaml` 中的 `image:` 完全一致；
- 同时支持 amd64/arm64 需分别导出两套 tar；
- **禁止**使用 `latest` 等浮动 tag，必须锁定具体版本。

## 3.2 docker-compose.yaml

路径：`rootfs_common/docker-compose.yaml`。

```yaml
services:
  syncthing:
    image: docker.io/syncthing/syncthing:1.27.0
    container_name: syncthing
    volumes:
      - ./data:/var/syncthing
      - ${UGAPP_SHARED_DIR}:/var/syncthing/Sync
    network_mode: bridge
    ports:
      - 8384:8384      # Web GUI（宿主端口由 project.yaml port 注入，默认 8384；容器内固定 8384）
      - 22000:22000    # 设备间同步（TCP）
      - 22000:22000/udp
      - 21027:21027/udp # 本地发现
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - GUI_PASSWORD=${GUI_PASSWORD}
      - UMASK=022
    restart: always
```

> 说明：
> - `ports` 中 GUI 宿主端口取自 `project.yaml` 的 `port`（默认 `8384`），由 `build/assemble.sh` 渲染模板时注入，容器内端口固定 `8384`，二者须与本应用声明一致；
> - 同步/发现端口（22000、21027）为 Syncthing 协议端口，系统不为其提供代理转发，仅局域网/直连可用；
> - 镜像导出后由 `export-images.sh` 解析 `manifest.json`，断言单一 tag、tag 与 `x_image_tag` 一致、架构与 `--platform` 一致，失败即删除坏 tar；
> - `${UGAPP_SHARED_DIR}` 由平台在用户通过 `allow_add_access_path: true` 授权文件夹后注入，挂载为默认同步库 `/var/syncthing/Sync`；若用户未授权任何目录，该挂载为空，数据默认存于 `./data`。无需在 `parameters` 中声明额外 `path` 配置项。

## 3.3 安全红线（必须遵守）

- **禁止** `privileged: true`；
- **禁止** `cap_add`（不额外提权）；
- **禁止** `network_mode: host`、不挂载 host PID/IPC；
- **禁止**镜像使用 `latest` 等浮动 tag；
- 容器应以非 root 用户运行（Syncthing 官方镜像默认用户 `syncthing`，通过 `PUID/PGID` 对齐宿主机权限）；
- 数据卷必须挂载到平台数据目录（`data`），保证卸载时随应用清理。

## 3.4 端口与远程访问

- 仅在 `project.yaml` 的 `port`（8384）声明对外 HTTP 服务；系统据此分配 HTTP/HTTPS 代理端口并支持 UGREENlink 远程访问；
- 22000/21027 等协议端口为应用自行监听端口，系统**不**提供代理与远程访问，仅限局域网/直连。
