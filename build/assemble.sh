#!/usr/bin/env bash
# assemble.sh v1.0.1
# Syncthing for UGOS Pro — 组装打包目录
#
# 功能: 将 project.yaml / icon.png / docker-compose.yaml 组装到
#       打包根目录 com.syncthing.docker.syncthing/rootfs_common/
#       供 ugcli check / ugcli pack 使用。
#
# 规范: docs/specs/01-project-structure.md, docs/specs/06-build-pack.md
#
# 前置: 先运行 export-images.sh 导出镜像 tar 到 rootfs_*/images/
# 用法:  ./assemble.sh
# 环境:  Linux 打包机(Debian 12)，需 bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

PKG_ROOT="${PROJECT_ROOT}/com.syncthing.docker.syncthing"
COMMON_DIR="${PKG_ROOT}/rootfs_common"
ICON_SRC="${PROJECT_ROOT}/assets/icon.png"
ICON_DST="${COMMON_DIR}/icon.png"
PROJECT_YAML_SRC="${PROJECT_ROOT}/project.yaml"
COMPOSE_TPL="${SCRIPT_DIR}/docker-compose.yaml.tpl"
COMPOSE_DST="${COMMON_DIR}/docker-compose.yaml"

log() { echo "[assemble] $*"; }
err() { echo "[assemble][ERROR] $*" >&2; }

# 从 project.yaml 读取镜像版本(取 version 字段)
VERSION="$(grep -E '^version:' "${PROJECT_YAML_SRC}" | head -1 | awk '{print $2}' | tr -d '"')"
IMAGE_FULL="docker.io/syncthing/syncthing:${VERSION}"

# 校验前置产物
[ -f "${ICON_SRC}" ] || { err "缺少 ${ICON_SRC}，请先运行 build/make-icon.ps1 (Windows) 生成图标"; exit 1; }
[ -d "${PKG_ROOT}/rootfs_amd64/images" ] || [ -d "${PKG_ROOT}/rootfs_arm64/images" ] || \
  { err "缺少镜像 tar，请先运行 build/export-images.sh"; exit 1; }

mkdir -p "${COMMON_DIR}"

# 1. 复制 project.yaml 到打包根目录
cp "${PROJECT_YAML_SRC}" "${PKG_ROOT}/project.yaml"
log "复制 project.yaml -> ${PKG_ROOT}/project.yaml"

# 2. 复制图标 (确保 512x512；若系统有 convert 则校验尺寸)
if command -v identify >/dev/null 2>&1; then
  dim="$(identify -format '%wx%h' "${ICON_SRC}")"
  [ "${dim}" = "512x512" ] || log "警告: icon.png 尺寸为 ${dim}，建议 512x512"
fi
cp "${ICON_SRC}" "${ICON_DST}"
log "复制 icon.png -> ${ICON_DST}"

# 3. 渲染 compose
sed "s|\${SYNCTHING_IMAGE}|${IMAGE_FULL}|g" "${COMPOSE_TPL}" > "${COMPOSE_DST}"
# 校验: 渲染后应无残留的 ${SYNCTHING_IMAGE} 占位符
if grep -q '\${SYNCTHING_IMAGE}' "${COMPOSE_DST}"; then
  err "渲染失败: ${COMPOSE_DST} 仍残留 \${SYNCTHING_IMAGE} 占位符"
  exit 1
fi
log "渲染 docker-compose.yaml -> ${COMPOSE_DST} (image=${IMAGE_FULL})"

log "组装完成: ${PKG_ROOT}"
log "下一步: ugcli check  &&  ugcli pack --arch all --build 1"
