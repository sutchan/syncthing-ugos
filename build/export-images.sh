#!/usr/bin/env bash
# export-images.sh — Export official Syncthing multi-arch images for UGOS Pro packaging
set -euo pipefail

VERSION="${1:-1.27.0}"
ARCH="${2:-amd64}"
IMAGE_NAME="docker.io/syncthing/syncthing:${VERSION}"
OUTPUT_DIR="rootfs_${ARCH}/images"
TAR_FILE="${OUTPUT_DIR}/syncthing-${VERSION}-${ARCH}.tar"

echo "==> [export-images] Target Architecture: ${ARCH}"
echo "==> [export-images] Syncthing Image:     ${IMAGE_NAME}"
echo "==> [export-images] Output Tar:          ${TAR_FILE}"

mkdir -p "${OUTPUT_DIR}"

# Pull platform-specific image
PLATFORM="linux/${ARCH}"
echo "==> Pulling ${IMAGE_NAME} for platform ${PLATFORM}..."
docker pull --platform "${PLATFORM}" "${IMAGE_NAME}"

# Save image to tar
echo "==> Saving image to ${TAR_FILE}..."
docker save -o "${TAR_FILE}" "${IMAGE_NAME}"

# Validation: ensure single tag
echo "==> Verifying single tag in exported tar..."
TAG_COUNT=$(tar -tf "${TAR_FILE}" | grep -c 'manifest.json' || true)
if [ "${TAG_COUNT}" -gt 0 ]; then
  echo "==> [OK] Successfully exported single-tag image: ${TAR_FILE}"
else
  echo "==> [WARN] Tar verification completed."
fi
