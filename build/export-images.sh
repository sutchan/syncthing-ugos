#!/usr/bin/env bash
# export-images.sh v1.2.0
# 按架构拉取官方 Syncthing 镜像并导出为 tar，校验 tag 与架构一致性
# 变更：恢复 manifest.json 真实解析校验（替换原 grep -c 假校验），修复 BUG-04
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=build/project-meta.sh
source "${SCRIPT_DIR}/project-meta.sh"

VERSION="${1:-$(project_image_tag)}"
ARCH="${2:-amd64}"
IMAGE_NAME="docker.io/syncthing/syncthing:${VERSION}"
OUTPUT_DIR="${SCRIPT_DIR}/../rootfs_${ARCH}/images"
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

# 关键校验：解析 manifest.json，断言 (1) 单一 tag (2) tag 与期望一致 (3) 架构与 --platform 一致。
# 校验失败立即删除坏 tar，避免 assemble 误用（沿用 CHANGELOG 1.27.0.3 的约定）。
echo "==> Verifying manifest.json: tag count / tag match / architecture..."
# 用子 shell 包裹校验，失败时删除坏 tar 后退出，避免 assemble 误用
(
python3 - "${TAR_FILE}" "${IMAGE_NAME}" "${ARCH}" <<'PY'
import json
import sys
import tarfile

tar_path, expected_image, expected_arch = sys.argv[1], sys.argv[2], sys.argv[3]


def fail(message: str) -> None:
    print(f"==> [FAIL] {message}", file=sys.stderr)
    sys.exit(1)


try:
    with tarfile.open(tar_path) as tar:
        manifest = json.load(tar.extractfile("manifest.json"))
except Exception as exc:  # noqa: BLE001 - 任何解析异常都视为校验失败
    fail(f"无法解析 manifest.json: {exc}")

if not isinstance(manifest, list) or len(manifest) == 0:
    fail("manifest.json 为空或格式异常")

# 收集所有 RepoTags 并去重
tags = set()
for entry in manifest:
    for tag in entry.get("RepoTags", []) or []:
        tags.add(tag)

if len(tags) != 1:
    fail(f"期望单一 tag，实际得到 {len(tags)} 个: {sorted(tags)}")

actual_tag = next(iter(tags))
if actual_tag != expected_image:
    fail(f"tag 不一致: 期望 {expected_image}，实际 {actual_tag}")

# 读取首个 layer 对应的 config.json 校验架构
config_path = manifest[0].get("Config")
if not config_path:
    fail("manifest.json 缺少 Config 字段")
try:
    with tarfile.open(tar_path) as tar:
        image_config = json.load(tar.extractfile(config_path))
except Exception as exc:  # noqa: BLE001
    fail(f"无法解析镜像配置 {config_path}: {exc}")

actual_arch = image_config.get("architecture", "")
if actual_arch and actual_arch != expected_arch:
    fail(f"架构不一致: 期望 {expected_arch}，实际 {actual_arch}")

print(f"==> [OK] tag={actual_tag}, arch={actual_arch or '未声明(跳过架构断言)'}")
PY
) || {
  echo "==> Removing invalid tar: ${TAR_FILE}" >&2
  rm -f "${TAR_FILE}"
  exit 1
}

echo "==> [export-images] Image tar verified: ${TAR_FILE}"
