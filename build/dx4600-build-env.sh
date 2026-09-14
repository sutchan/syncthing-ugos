#!/usr/bin/env bash
# dx4600-build-env.sh — Spawn Debian 12 build container on UGREEN DX4600 NAS
set -euo pipefail

REPO_PATH="${1:-/volume1/@appdata/syncthing-ugos}"
BUILD_ENV_PATH="${2:-/volume1/@appdata/ugos-build}"
CONTAINER_NAME="ugos-build"

echo "==> Setting up Debian 12 build container on UGOS Pro..."
mkdir -p "${REPO_PATH}"
mkdir -p "${BUILD_ENV_PATH}"

docker run -d \
  --name "${CONTAINER_NAME}" \
  --restart unless-stopped \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v "${REPO_PATH}:/repo" \
  -v "${BUILD_ENV_PATH}:/build" \
  -w /repo \
  debian:12-slim \
  sleep infinity

echo "==> Build container '${CONTAINER_NAME}' is running."
echo "==> Run: docker exec -it ${CONTAINER_NAME} bash"
