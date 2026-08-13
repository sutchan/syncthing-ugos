#!/usr/bin/env bash
# dx4600-build-env.sh v1.0.0
# Syncthing for UGOS Pro — 在绿联 DX4600 (UGOS Pro) 上创建 Debian 12 构建容器
#
# 原理:
#   DX4600 底层即 Debian 12，且自带 Docker 套件。本脚本在 UGOS 的 Docker 中
#   起一个 debian:bookworm 容器，挂载宿主 /var/run/docker.sock，从而复用宿主
#   Docker 守护进程执行 `docker pull --platform` / `docker save` 导出镜像 tar，
#   无需 Docker-in-Docker，最轻量。
#
# 用法 (在 DX4600 的 SSH 终端 / Docker 套件终端执行):
#   ./dx4600-build-env.sh [REPO_PATH] [WORKSPACE_VOLUME]
#   REPO_PATH        仓库在宿主的路径，默认 /volume1/@appdata/syncthing-ugos
#   WORKSPACE_VOLUME 容器持久卷(用于存放构建产物)，默认 /volume1/@appdata/ugos-build
#
# 说明:
#   - 容器名固定为 ugos-build；重复运行会先移除旧容器。
#   - 容器内已安装: git curl ca-certificates bash jq imagemagick
#     (imagemagick 的 identify 供 assemble.sh 校验图标尺寸)
#   - ugcli 需你自行放入容器 PATH (见 docs/specs/06-build-pack.md §6.1)，
#     本脚本仅负责构建环境，不代下载 ugcli/ugdev.sig。

set -euo pipefail

REPO_PATH="${1:-/volume1/@appdata/syncthing-ugos}"
WORKSPACE_VOL="${2:-/volume1/@appdata/ugos-build}"
CONTAINER="ugos-build"
IMAGE="debian:bookworm"

log() { echo "[dx4600-env] $*"; }
err() { echo "[dx4600-env][ERROR] $*" >&2; }

# 前置: 宿主 docker 可用
command -v docker >/dev/null 2>&1 || { err "宿主未找到 docker，请先启用 UGOS Docker 套件"; exit 1; }
docker version >/dev/null 2>&1 || { err "宿主 docker 守护进程不可达"; exit 1; }

# 拉取基础镜像 (走宿主 docker)
log "拉取 ${IMAGE}"
docker pull "${IMAGE}"

# 清理旧容器
if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER}"; then
  log "移除已存在的容器 ${CONTAINER}"
  docker rm -f "${CONTAINER}" >/dev/null
fi

# 启动构建容器
log "启动构建容器 ${CONTAINER}"
docker run -d --name "${CONTAINER}" \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "${REPO_PATH}:/repo" \
  -v "${WORKSPACE_VOL}:/workspace" \
  -w /workspace \
  "${IMAGE}" \
  tail -f /dev/null

# 安装构建依赖
log "在容器内安装构建依赖"
docker exec "${CONTAINER}" bash -c '
  apt-get update -qq
  apt-get install -y --no-install-recommends \
    git curl ca-certificates bash jq imagemagick coreutils
  apt-get clean
  rm -rf /var/lib/apt/lists/*
'

# 校验 docker 在容器内可用 (复用宿主 sock)
if docker exec "${CONTAINER}" docker version >/dev/null 2>&1; then
  log "容器内 docker 就绪 (复用宿主守护进程)"
else
  err "容器内无法访问宿主 docker，请检查 /var/run/docker.sock 挂载"
  exit 1
fi

cat <<EOF

[dx4600-env] 构建环境已就绪。

进入容器:
  docker exec -it ${CONTAINER} bash

在容器内构建 (仓库已挂到 /repo):
  cd /repo
  # 若 ugcli 尚未安装，先放入 PATH:
  #   cp /workspace/ugcli /usr/local/bin/ && chmod +x /usr/local/bin/ugcli
  ./build/build-all.sh 1.27.0 1 amd64 arm64

产物位于容器内 /repo/com.syncthing.docker.syncthing/ 及 build_dir/pkgs/upk/，
对应宿主路径: ${REPO_PATH}/ 与 ${WORKSPACE_VOL}/

注意: ugcli 二进制与 ugdev.sig 需你从绿联开发者平台获取并放入容器/宿主。
EOF
