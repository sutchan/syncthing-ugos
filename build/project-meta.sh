#!/usr/bin/env bash
# build/project-meta.sh v1.27.0.5
# 构建真相源读取库：从 project.yaml 提取镜像 tag / 端口，供 build-*.sh source 复用
# 约定：镜像 tag 以 x_image_tag 为唯一真相源（缺省回退 version）；port 为宿主机 GUI 映射端口
# 说明：本文件只定义函数，不设置 shell 选项，避免影响 source 它的调用者

# 由脚本位置推导仓库根；PROJECT_ROOT 可覆盖（便于隔离测试）
project_meta_root() {
  printf '%s' "${PROJECT_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
}

# 读取 project.yaml 顶层标量字段（仅匹配行首无缩进的 key），剥离行内注释与首尾引号
# 用法：project_field x_image_tag
project_field() {
  local key="$1"
  local file
  file="$(project_meta_root)/project.yaml"
  sed -n "s/^${key}[[:space:]]*:[[:space:]]*\([^#]*\).*/\1/p" "$file" \
    | head -n 1 \
    | sed 's/^[[:space:]]*//; s/[[:space:]]*$//; s/^"//; s/"$//'
}

# 镜像 tag 真相源：优先 x_image_tag，缺失回退 version
project_image_tag() {
  local tag
  tag="$(project_field x_image_tag)"
  [ -n "$tag" ] || tag="$(project_field version)"
  printf '%s' "$tag"
}

# 宿主机 GUI 映射端口：读取 project.yaml port，缺失回退 8384
project_port() {
  local port
  port="$(project_field port)"
  [ -n "$port" ] || port="8384"
  printf '%s' "$port"
}
