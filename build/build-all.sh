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

VERSION="${1:-1.27.0}"; shift || true
BUILD="${1:-1}"; shift || true
ARCH_ARG=("${@:-amd64 arm64}")

log() { echo "[build-all] $*"; }
err() { echo "[build-all][ERROR] $*" >&2; }

# 前置: 图标存在
if [ ! -f "${SCRIPT_DIR}/../assets/icon.png" ]; then
  err "缺少 assets/icon.png。请先在 Windows 运行:"
  err "  powershell -ExecutionPolicy Bypass -File build/make-icon.ps1"
  exit 1
fi

# 1. 导出镜像 tar
log "步骤 1/4: 导出镜像 (version=${VERSION}, arch=${ARCH_ARG[*]})"
"${SCRIPT_DIR}/export-images.sh" "${VERSION}" "${ARCH_ARG[@]}"

# 2. 组装打包目录
log "步骤 2/4: 组装打包目录"
"${SCRIPT_DIR}/assemble.sh"

# 3. ugcli 校验
if command -v ugcli >/dev/null 2>&1; then
  log "步骤 3/4: ugcli check"
  ugcli check
else
  err "未找到 ugcli，跳过 check（请在打包机安装开发者工具 ugcli）"
fi

# 4. 打包
if command -v ugcli >/dev/null 2>&1; then
  log "步骤 4/4: ugcli pack --arch all --build ${BUILD}"
  ugcli pack --arch all --build "${BUILD}"
  log "构建完成，产物位于 build_dir/pkgs/upk/"
else
  err "未找到 ugcli，跳过 pack。请安装 ugcli 后手动执行:"
  err "  ugcli pack --arch all --build ${BUILD}"
  exit 1
fi
