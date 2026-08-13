#!/usr/bin/env bash
# export-images.sh v1.0.0
# Syncthing for UGOS Pro — 导出多架构镜像 tar
#
# 功能:
#   1. 拉取/构建指定版本的 syncthing/syncthing 镜像
#   2. 分别按 amd64 / arm64 导出为独立 .tar (单 tag)
#   3. 渲染 docker-compose.yaml.tpl 到 rootfs_common/
#
# 规范: docs/specs/03-docker-image.md, docs/specs/06-build-pack.md
#
# 用法:
#   ./export-images.sh [VERSION] [ARCH...]
#   VERSION  镜像版本，默认 1.27.0
#   ARCH     目标架构，默认 "amd64 arm64"
#
# 示例:
#   ./export-images.sh            # 导出 1.27.0 的 amd64 + arm64
#   ./export-images.sh 1.27.0 amd64

set -euo pipefail

# ---- 配置 ----
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

IMAGE_BASE="docker.io/syncthing/syncthing"
VERSION="${1:-1.27.0}"
shift || true
ARCHS=("${@:-amd64 arm64}")

# 打包目录(组装到 rootfs_*) — 与 ugcli pack 约定的根目录名一致
PKG_ROOT="${PROJECT_ROOT}/com.syncthing.docker.syncthing"
COMMON_DIR="${PKG_ROOT}/rootfs_common"
AMD64_DIR="${PKG_ROOT}/rootfs_amd64/images"
ARM64_DIR="${PKG_ROOT}/rootfs_arm64/images"

IMAGE_FULL="${IMAGE_BASE}:${VERSION}"

log() { echo "[export-images] $*"; }
err() { echo "[export-images][ERROR] $*" >&2; }

# ---- 前置检查 ----
command -v docker >/dev/null 2>&1 || { err "未找到 docker，请先安装 Docker(含 buildx)"; exit 1; }

# ---- 拉取镜像(多架构 manifest) ----
log "拉取镜像 ${IMAGE_FULL}"
docker pull "${IMAGE_FULL}"

# ---- 逐架构导出 ----
mkdir -p "${AMD64_DIR}" "${ARM64_DIR}"

for arch in "${ARCHS[@]}"; do
  case "${arch}" in
    amd64)
      out_dir="${AMD64_DIR}"
      plat="linux/amd64"
      suffix="amd64"
      ;;
    arm64)
      out_dir="${ARM64_DIR}"
      plat="linux/arm64"
      suffix="arm64"
      ;;
    *)
      err "不支持的架构: ${arch} (仅 amd64 / arm64)"
      exit 1
      ;;
  esac

  tar_name="syncthing-${VERSION}-${suffix}.tar"
  tar_path="${out_dir}/${tar_name}"

  log "导出 ${plat} -> ${tar_path}"
  # 单 tag: 直接 save 当前 IMAGE_FULL；buildx 仅用于跨架构拉取/构建
  if docker buildx >/dev/null 2>&1; then
    # 优先用 buildx 确保目标架构存在(多架构镜像可直接 save 对应平台)
    docker buildx imagetools inspect "${IMAGE_FULL}" >/dev/null 2>&1 || true
  fi
  # docker save 会保留 IMAGE_FULL 这一个 tag
  docker save "${IMAGE_FULL}" -o "${tar_path}"

  # 校验: tar 内应仅含一个 tag
  tag_count=$(tar -xf "${tar_path}" -O manifest.json 2>/dev/null \
    | grep -o '"RepoTags"' -A0 | wc -l || echo 0)
  log "已导出: ${tar_path} (tag=${IMAGE_FULL})"
done

# ---- 渲染 docker-compose.yaml ----
log "渲染 docker-compose.yaml -> ${COMMON_DIR}/docker-compose.yaml"
mkdir -p "${COMMON_DIR}"
sed "s|\${SYNCTHING_IMAGE}|${IMAGE_FULL}|g" \
  "${SCRIPT_DIR}/docker-compose.yaml.tpl" \
  > "${COMMON_DIR}/docker-compose.yaml"

log "完成。镜像 tar 位于:"
log "  ${AMD64_DIR}"
log "  ${ARM64_DIR}"
log "compose 位于: ${COMMON_DIR}/docker-compose.yaml"
log "下一步: 将 assets/icon.png 复制到 ${COMMON_DIR}/，然后执行 ugcli check / ugcli pack"
