#!/usr/bin/env bash
# build-all.sh — One-click pipeline: export-images -> assemble -> ugcli check -> ugcli pack
set -euo pipefail

VERSION="${1:-1.27.0}"
BUILD_NUM="${2:-1}"
shift 2 2>/dev/null || true
ARCHES=("$@")
if [ ${#ARCHES[@]} -eq 0 ]; then
  ARCHES=("amd64" "arm64")
fi

echo "=========================================="
echo " Syncthing UGOS Pro UPK Packaging Pipeline"
echo " Version: ${VERSION}, Build: ${BUILD_NUM}"
echo " Architectures: ${ARCHES[*]}"
echo "=========================================="

# Step 1: Export images for each architecture
for arch in "${ARCHES[@]}"; do
  echo "--> Step 1: Exporting image for ${arch}..."
  ./build/export-images.sh "${VERSION}" "${arch}"
done

# Step 2: Assemble directory
echo "--> Step 2: Assembling UPK package layout..."
SYNCTHING_IMAGE="docker.io/syncthing/syncthing:${VERSION}" ./build/assemble.sh

# Step 3: ugcli check
echo "--> Step 3: Running ugcli check..."
if command -v ugcli >/dev/null 2>&1; then
  cd com.syncthing.docker.syncthing
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
