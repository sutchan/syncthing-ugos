services:
  syncthing:
    image: ${SYNCTHING_IMAGE}
    container_name: syncthing
    volumes:
      - ./data:/var/syncthing
      - ${UGAPP_SHARED_DIR}:/var/syncthing/Sync
    network_mode: bridge
    ports:
      - ${SYNCTHING_PORT}:8384
      - 22000:22000
      - 22000:22000/udp
      - 21027:21027/udp
    environment:
      - PUID=${PUID}
      - PGID=${PGID}
      - TZ=${TZ}
      - GUI_PASSWORD=${GUI_PASSWORD}
      - UMASK=022
    restart: always
