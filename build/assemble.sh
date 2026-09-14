#!/usr/bin/env bash
# assemble.sh — Assemble package directory structure for ugcli pack
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ID="com.syncthing.docker.syncthing"
TARGET_DIR="${ROOT_DIR}/${APP_ID}"
IMAGE_TAG="${SYNCTHING_IMAGE:-docker.io/syncthing/syncthing:1.27.0}"

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

# 3. Render docker-compose.yaml
echo "==> Rendering docker-compose.yaml with image: ${IMAGE_TAG}..."
sed "s|\${SYNCTHING_IMAGE}|${IMAGE_TAG}|g" "${ROOT_DIR}/build/docker-compose.yaml.tpl" > "${TARGET_DIR}/rootfs_common/docker-compose.yaml"

# 4. Copy image tars if present
if [ -d "${ROOT_DIR}/rootfs_amd64/images" ]; then
  cp -r "${ROOT_DIR}/rootfs_amd64/images/"* "${TARGET_DIR}/rootfs_amd64/images/" 2>/dev/null || true
fi
if [ -d "${ROOT_DIR}/rootfs_arm64/images" ]; then
  cp -r "${ROOT_DIR}/rootfs_arm64/images/"* "${TARGET_DIR}/rootfs_arm64/images/" 2>/dev/null || true
fi

echo "==> [assemble] Assembly completed successfully at ${TARGET_DIR}."
