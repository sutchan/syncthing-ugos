#!/usr/bin/env bash
# build-all.sh v1.0.1
# Syncthing for UGOS Pro — 一键构建 .upk
#
# 串联: 导出镜像 -> 组装目录 -> ugcli 校验 -> ugcli 打包
# 环境:  Linux 打包机(Debian 12), 需 docker(buildx) + ugcli
#
# 用法:
#   ./build-all.sh [VERSION] [BUILD] [ARCH...]
#   VERSION  镜像版本，默认 1.27.0
#   BUILD    构建号，默认 1
#   ARCH     目标架构，默认 "amd64 arm64"
#
# 说明:
#   - 图标 assets/icon.png 需在 Windows 侧先运行 build/make-icon.ps1 生成，
#     或在本机已存在；脚本会校验其存在。
#   - Windows 步骤(make-icon.ps1)不在此脚本内，因 ugcli 仅 Linux 可用。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

VERSION="${1:-1.27.0}"; shift || true
BUILD="${1:-1}"; shift || true
ARCH_ARG=("${@:-amd64 arm64}")

log() { echo "[build-all] $*"; }
err() { echo "[build-all][ERROR] $*" >&2; }

# ---- 前置校验 ----
# 1) 图标存在 (Windows 侧 make-icon.ps1 已生成)
if [ ! -f "${PROJECT_ROOT}/assets/icon.png" ]; then
  err "缺少 assets/icon.png。请先在 Windows 运行:"
  err "  powershell -ExecutionPolicy Bypass -File build/make-icon.ps1"
  exit 1
fi

# 2) docker 可用 (DX4600 构建容器需挂载宿主 /var/run/docker.sock)
if ! command -v docker >/dev/null 2>&1; then
  err "未找到 docker。请在构建容器内挂载宿主 docker.sock:"
  err "  docker run -v /var/run/docker.sock:/var/run/docker.sock -v <卷>:/workspace -w /workspace debian:bookworm"
  exit 1
fi
if ! docker version >/dev/null 2>&1; then
  err "docker 守护进程不可达。请确认已挂载宿主 /var/run/docker.sock 且 UGOS Docker 套件已启动。"
  exit 1
fi

# 3) docker 支持 --platform 多架构拉取 (buildx)
if ! docker buildx >/dev/null 2>&1 && ! docker pull --platform linux/arm64 --help >/dev/null 2>&1; then
  err "docker 不支持 --platform 拉取。请使用含 buildx 的 Docker 版本（UGOS Docker 套件默认满足）。"
  exit 1
fi

# 4) 磁盘空间检查: 至少预留 1.5GB (两套镜像 tar + 中间层)
AVAIL_KB="$(df -Pk "${PROJECT_ROOT}" | awk 'NR==2 {print $4}')"
if [ -n "${AVAIL_KB}" ] && [ "${AVAIL_KB}" -lt 1572864 ]; then
  err "磁盘空间不足: 剩余约 $((AVAIL_KB/1024))MB，需 ≥1536MB 用于导出镜像 tar。"
  exit 1
fi

# 5) ugcli 可用 (官方开发者工具，Linux 二进制放入 PATH)
if ! command -v ugcli >/dev/null 2>&1; then
  err "未找到 ugcli。请从绿联开发者平台下载 Linux x86_64 二进制并放入 PATH:"
  err "  mv ugcli /usr/local/bin/ && chmod +x /usr/local/bin/ugcli && ugcli --version"
  err "上架应用中心还需 ugdev.sig 开发者授权 (详见 docs/specs/06-build-pack.md §6.1)。"
  exit 1
fi
log "ugcli 版本: $(ugcli --version 2>/dev/null || echo unknown)"

# ---- 构建流程 ----
# 1. 导出镜像 tar
log "步骤 1/4: 导出镜像 (version=${VERSION}, arch=${ARCH_ARG[*]})"
"${SCRIPT_DIR}/export-images.sh" "${VERSION}" "${ARCH_ARG[@]}"

# 2. 组装打包目录
log "步骤 2/4: 组装打包目录"
"${SCRIPT_DIR}/assemble.sh"

# 3. ugcli 校验
log "步骤 3/4: ugcli check"
ugcli check

# 4. 打包
log "步骤 4/4: ugcli pack --arch all --build ${BUILD}"
ugcli pack --arch all --build "${BUILD}"
log "构建完成，产物位于 build_dir/pkgs/upk/"
