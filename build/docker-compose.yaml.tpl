# docker-compose.yaml.tpl v1.0.0
# Syncthing for UGOS Pro — compose 模板
# 规范: docs/specs/03-docker-image.md
# 由 build/export-images.sh 渲染为 rootfs_common/docker-compose.yaml
# 占位符:
#   ${SYNCTHING_IMAGE}  -> 镜像全名(含 tag)，与 images/*.tar 的 tag 完全一致
services:
  syncthing:
    image: ${SYNCTHING_IMAGE}
    container_name: syncthing
    volumes:
      - ./data:/var/syncthing
      - ${SYNC_PATH}:/var/syncthing/Sync
    network_mode: bridge
    ports:
      - 8384:8384      # Web GUI
      - 22000:22000    # 设备间同步（TCP）
      - 22000:22000/udp
      - 21027:21027/udp # 本地发现
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - GUI_PASSWORD=${GUI_PASSWORD}
      - UMASK=022
    restart: always
