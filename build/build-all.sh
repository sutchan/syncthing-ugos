#!/usr/bin/env bash
# build-all.sh v1.2.0
# 一键流水线：preflight -> export-images -> assemble -> ugcli check -> ugcli pack
# 变更：镜像 tag 以 project.yaml x_image_tag 为真相源，VERSION 位置参数仅作覆盖
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=build/project-meta.sh
source "${SCRIPT_DIR}/project-meta.sh"

# 位置参数：build [VERSION] [BUILD] [ARCH...]；VERSION 为空则取真相源
VERSION="${1:-}"
BUILD_NUM="${2:-1}"
if [ $# -ge 2 ]; then
  shift 2
elif [ $# -eq 1 ]; then
  shift
fi
ARCHES=("$@")
if [ ${#ARCHES[@]} -eq 0 ]; then
  ARCHES=("amd64" "arm64")
fi

# 镜像 tag 真相源：优先命令行 VERSION 覆盖，否则取 x_image_tag（回退 version）
IMAGE_TAG="${VERSION:-$(project_image_tag)}"
IMAGE_REF="docker.io/syncthing/syncthing:${IMAGE_TAG}"

echo "=========================================="
echo " Syncthing UGOS Pro UPK Packaging Pipeline"
echo " Image tag: ${IMAGE_TAG}"
echo " Build:     ${BUILD_NUM}"
echo " Architectures: ${ARCHES[*]}"
echo "=========================================="

# Step 0: 打包前预检
echo "--> Step 0: Preflight checks..."
"${SCRIPT_DIR}/preflight.sh"

# Step 1: Export images for each architecture
for arch in "${ARCHES[@]}"; do
  echo "--> Step 1: Exporting image for ${arch}..."
  "${SCRIPT_DIR}/export-images.sh" "${IMAGE_TAG}" "${arch}"
done

# Step 2: Assemble directory（显式传入真相源镜像引用，避免再次解析不一致）
echo "--> Step 2: Assembling UPK package layout..."
SYNCTHING_IMAGE="${IMAGE_REF}" "${SCRIPT_DIR}/assemble.sh"

# Step 3: ugcli check
echo "--> Step 3: Running ugcli check..."
if command -v ugcli >/dev/null 2>&1; then
  cd "${SCRIPT_DIR}/../com.syncthing.docker.syncthing"
  ugcli check
  # Step 4: ugcli pack
  echo "--> Step 4: Running ugcli pack..."
  ugcli pack --arch all --build "${BUILD_NUM}"
  echo "==> Build finished! Packages generated in build_dir/pkgs/upk/"
else
  echo "==> [NOTICE] ugcli not found in system PATH."
  echo "    Package layout assembled in com.syncthing.docker.syncthing/"
  echo "    Install ugcli on Debian 12 to run 'ugcli check' and 'ugcli pack'."
fi
