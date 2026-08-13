#!/usr/bin/env bash
# export-images.sh v1.0.3
# Syncthing for UGOS Pro — 导出多架构镜像 tar
#
# 功能:
#   1. 按架构分别拉取 syncthing/syncthing 单平台镜像
#   2. 导出为独立 .tar (单 tag、单平台)，符合 UPK 镜像规范
#
# 规范: docs/specs/03-docker-image.md, docs/specs/06-build-pack.md
# 注意: 本脚本只负责镜像导出；compose 渲染由 assemble.sh 完成。
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
AMD64_DIR="${PKG_ROOT}/rootfs_amd64/images"
ARM64_DIR="${PKG_ROOT}/rootfs_arm64/images"

IMAGE_FULL="${IMAGE_BASE}:${VERSION}"

log() { echo "[export-images] $*"; }
err() { echo "[export-images][ERROR] $*" >&2; }

# ---- 前置检查 ----
command -v docker >/dev/null 2>&1 || { err "未找到 docker，请先安装 Docker"; exit 1; }

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

  log "拉取单平台镜像 ${plat} -> ${IMAGE_FULL}"
  # --platform 确保只拉取目标架构的镜像，避免多架构 manifest
  docker pull --platform "${plat}" "${IMAGE_FULL}"

  log "导出 ${plat} -> ${tar_path}"
  docker save "${IMAGE_FULL}" -o "${tar_path}"

  # 校验: tar 内必须且仅含一个 tag，且与 compose 中 image: 完全一致
  # 用 python3 解析 manifest.json 中 RepoTags 数组的真实 tag 数量（避免旧版按关键字计数误判）
  if command -v python3 >/dev/null 2>&1; then
    read -r tag_count first_tag < <(tar -xf "${tar_path}" -O manifest.json 2>/dev/null \
      | python3 -c 'import sys,json
m=json.load(sys.stdin)
tags=[t for c in m for t in c.get("RepoTags",[])]
print(len(tags), (tags[0] if tags else ""))')
  else
    # 退化方案: 提取 RepoTags 数组内的实际 tag 字符串并计数
    manifest="$(tar -xf "${tar_path}" -O manifest.json 2>/dev/null)"
    tags="$(printf '%s' "${manifest}" | grep -o '"RepoTags":\[[^]]*\]' | head -1 \
      | sed -E 's/"RepoTags":\["?([^"]*)"?\]/\1/' | tr ',' '\n' | grep -v '^$')"
    tag_count="$(printf '%s\n' "${tags}" | grep -c .)"
    first_tag="$(printf '%s\n' "${tags}" | head -1)"
  fi
  if [ "${tag_count}" -ne 1 ]; then
    err "校验失败: ${tar_path} 含 ${tag_count} 个 tag(应仅 1 个)"
    rm -f "${tar_path}"
    exit 1
  fi
  if [ "${first_tag}" != "${IMAGE_FULL}" ]; then
    err "校验失败: tar 内 tag='${first_tag}' 与期望 '${IMAGE_FULL}' 不一致"
    rm -f "${tar_path}"
    exit 1
  fi
  log "已导出并通过校验: ${tar_path} (tag=${IMAGE_FULL}, 单平台 ${plat})"
done

log "完成。镜像 tar 位于:"
log "  ${AMD64_DIR}"
log "  ${ARM64_DIR}"
log "下一步: 运行 ./assemble.sh 组装目录，再执行 ugcli check / ugcli pack"
