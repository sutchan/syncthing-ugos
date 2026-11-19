#!/usr/bin/env bash
# build/preflight.sh v1.27.0.5
# 打包前预检：校验依赖工具、真相源字段、关键产物，尽早失败并给出中文提示
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=build/project-meta.sh
source "${SCRIPT_DIR}/project-meta.sh"

echo "==> [preflight] 开始打包前预检..."

# 1) 依赖工具检查
for tool in docker python3 jq tar; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "==> [FAIL] 缺少依赖工具: ${tool}" >&2
    exit 1
  fi
done
echo "==> [OK] 依赖工具齐全 (docker/python3/jq/tar)"

# 2) 真相源字段检查（镜像 tag 与端口）
IMAGE_TAG="$(project_image_tag)"
PORT="$(project_port)"
if [ -z "${IMAGE_TAG}" ]; then
  echo "==> [FAIL] project.yaml 未定义 x_image_tag 或 version，无法确定镜像 tag" >&2
  exit 1
fi
if [ "${IMAGE_TAG}" = "latest" ]; then
  echo "==> [FAIL] 禁止使用 latest 浮动 tag（安全红线，见 docs/specs/03）" >&2
  exit 1
fi
if ! [[ "${PORT}" =~ ^[0-9]+$ ]]; then
  echo "==> [FAIL] project.yaml port 非数字: ${PORT}" >&2
  exit 1
fi
echo "==> [OK] 真相源字段: image_tag=${IMAGE_TAG}, port=${PORT}"

# 3) 关键文件检查
for f in project.yaml assets/icon.png build/docker-compose.yaml.tpl; do
  if [ ! -f "${SCRIPT_DIR}/../${f}" ]; then
    echo "==> [FAIL] 缺少关键文件: ${f}" >&2
    exit 1
  fi
done
echo "==> [OK] 关键文件齐全"

echo "==> [preflight] 预检通过。"
