#!/usr/bin/env bash
# assemble.sh v1.1.0
# 组装 UPK 打包目录结构，供 ugcli pack 使用
# 变更：镜像 tag / 端口统一从 project.yaml 真相源读取，不再硬编码默认 tag
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ID="com.syncthing.docker.syncthing"
TARGET_DIR="${ROOT_DIR}/${APP_ID}"
# shellcheck source=build/project-meta.sh
source "${ROOT_DIR}/build/project-meta.sh"

# 真相源：x_image_tag（回退 version）；环境变量 SYNCTHING_IMAGE 仅用于覆盖调试
IMAGE_TAG="${SYNCTHING_IMAGE:-$(project_image_tag)}"
GUI_PORT="${SYNCTHING_PORT:-$(project_port)}"

echo "==> [assemble] Creating package layout at ${TARGET_DIR}..."
mkdir -p "${TARGET_DIR}/rootfs_common"
mkdir -p "${TARGET_DIR}/rootfs_amd64/images"
mkdir -p "${TARGET_DIR}/rootfs_arm64/images"

# 1. Copy project.yaml
echo "==> Copying project.yaml..."
cp "${ROOT_DIR}/project.yaml" "${TARGET_DIR}/project.yaml"

# 2. Copy icon.png
echo "==> Copying icon.png to rootfs_common/..."
cp "${ROOT_DIR}/assets/icon.png" "${TARGET_DIR}/rootfs_common/icon.png"

# 3. Render docker-compose.yaml（注入镜像 tag 与 GUI 端口，均来自 project.yaml）
echo "==> Rendering docker-compose.yaml with image: ${IMAGE_TAG}, port: ${GUI_PORT}..."
sed \
  -e "s|\${SYNCTHING_IMAGE}|${IMAGE_TAG}|g" \
  -e "s|\${SYNCTHING_PORT}|${GUI_PORT}|g" \
  "${ROOT_DIR}/build/docker-compose.yaml.tpl" > "${TARGET_DIR}/rootfs_common/docker-compose.yaml"

# 渲染后校验：不得残留未替换占位符
if grep -q '\${SYNCTHING_IMAGE}\|\${SYNCTHING_PORT}' "${TARGET_DIR}/rootfs_common/docker-compose.yaml"; then
  echo "==> [ERROR] docker-compose.yaml 存在未替换占位符" >&2
  exit 1
fi

# 4. Copy image tars if present
if [ -d "${ROOT_DIR}/rootfs_amd64/images" ]; then
  cp -r "${ROOT_DIR}/rootfs_amd64/images/"* "${TARGET_DIR}/rootfs_amd64/images/" 2>/dev/null || true
fi
if [ -d "${ROOT_DIR}/rootfs_arm64/images" ]; then
  cp -r "${ROOT_DIR}/rootfs_arm64/images/"* "${TARGET_DIR}/rootfs_arm64/images/" 2>/dev/null || true
fi

echo "==> [assemble] Assembly completed successfully at ${TARGET_DIR}."
