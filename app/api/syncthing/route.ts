import { NextRequest, NextResponse } from "next/server";

export interface SyncFolder {
  id: string;
  label: string;
  path: string;
  globalBytes: number;
  localBytes: number;
  globalFiles: number;
  localFiles: number;
  state: "idle" | "syncing" | "error" | "paused";
  sharedWith: string[];
  lastScan: string;
  readOnly: boolean;
}

export interface RemoteDevice {
  id: string;
  name: string;
  address: string;
  clientVersion: string;
  connected: boolean;
  paused: boolean;
  downloadRate: number; // bytes/sec
  uploadRate: number; // bytes/sec
  lastSeen: string;
}

export interface SyncthingStatus {
  serviceState: "running" | "stopped" | "restarting";
  uptimeSeconds: number;
  cpuPercent: number;
  memoryMb: number;
  myID: string;
  version: string;
  upkVersion: string;
  port: number;
  guiAuthRequired: boolean;
  folders: SyncFolder[];
  devices: RemoteDevice[];
  systemLogs: Array<{ timestamp: string; level: "INFO" | "WARNING" | "ERROR"; message: string }>;
}

let statusState: SyncthingStatus = {
  serviceState: "running",
  uptimeSeconds: 84210,
  cpuPercent: 1.4,
  memoryMb: 86,
  myID: "SYNCTH-UGOS-DX4600-7X9AB2-KLMNO4-PQ5678-RSTUV9",
  version: "v1.27.0",
  upkVersion: "1.27.0.5",
  port: 8384,
  guiAuthRequired: true,
  folders: [
    {
      id: "ugos-default-sync",
      label: "NAS Shared Sync (UGAPP_SHARED_DIR)",
      path: "/var/syncthing/Sync",
      globalBytes: 42949672960, // 40 GB
      localBytes: 42949672960,
      globalFiles: 1420,
      localFiles: 1420,
      state: "idle",
      sharedWith: ["MacBook-Pro-Workstation", "Pixel-9-Client"],
      lastScan: "Just now",
      readOnly: false,
    },
    {
      id: "ugos-nas-backup",
      label: "App Configuration & Database",
      path: "/var/syncthing/config",
      globalBytes: 256000000, // 256 MB
      localBytes: 256000000,
      globalFiles: 84,
      localFiles: 84,
      state: "idle",
      sharedWith: ["MacBook-Pro-Workstation"],
      lastScan: "5 mins ago",
      readOnly: true,
    },
  ],
  devices: [
    {
      id: "MBP-M3-XYZ123-ABC456",
      name: "MacBook-Pro-Workstation",
      address: "192.168.1.120:22000 (TCP direct)",
      clientVersion: "Syncthing v1.27.0 (macOS arm64)",
      connected: true,
      paused: false,
      downloadRate: 2450000, // 2.45 MB/s
      uploadRate: 512000, // 512 KB/s
      lastSeen: "Online now",
    },
    {
      id: "PIXEL9-PHONE-987654",
      name: "Pixel-9-Client",
      address: "relay://relay.syncthing.net:443 (Relayed)",
      clientVersion: "Syncthing-Fork v1.27.0 (Android)",
      connected: true,
      paused: false,
      downloadRate: 320000,
      uploadRate: 120000,
      lastSeen: "Online now",
    },
    {
      id: "OFFICE-DESKTOP-555888",
      name: "Office-Workstation-Backup",
      address: "tcp://nas.ugreenlink.com:22000",
      clientVersion: "Syncthing v1.26.1 (Windows)",
      connected: false,
      paused: false,
      downloadRate: 0,
      uploadRate: 0,
      lastSeen: "2 hours ago",
    },
  ],
  systemLogs: [
    {
      timestamp: new Date(Date.now() - 3600000).toISOString().substring(11, 19),
      level: "INFO",
      message: "Syncthing v1.27.0 'Fermium Flea' (go1.21.5 linux-amd64) docker@syncthing",
    },
    {
      timestamp: new Date(Date.now() - 3500000).toISOString().substring(11, 19),
      level: "INFO",
      message: "Access granted for UGAPP_SHARED_DIR mounted at /var/syncthing/Sync",
    },
    {
      timestamp: new Date(Date.now() - 3400000).toISOString().substring(11, 19),
      level: "INFO",
      message: "GUI and API listening on 0.0.0.0:8384 (UGOS Pro tab mode)",
    },
    {
      timestamp: new Date(Date.now() - 2400000).toISOString().substring(11, 19),
      level: "INFO",
      message: "Device MBP-M3-XYZ123-ABC456 connected at 192.168.1.120:22000 (TLS 1.3)",
    },
    {
      timestamp: new Date(Date.now() - 1200000).toISOString().substring(11, 19),
      level: "INFO",
      message: "Folder 'ugos-default-sync' is in sync. 1420 items verified without discrepancy.",
    },
  ],
};

export async function GET() {
  return NextResponse.json(statusState);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === "rescan") {
    const folder = statusState.folders.find((f) => f.id === body.folderId);
    if (folder) {
      folder.state = "syncing";
      folder.lastScan = "Scanning...";
      statusState.systemLogs.unshift({
        timestamp: new Date().toISOString().substring(11, 19),
        level: "INFO",
        message: `Manual rescan triggered for folder '${folder.label}' (${folder.path})`,
      });
      setTimeout(() => {
        folder.state = "idle";
        folder.lastScan = "Just now";
      }, 3000);
    }
  } else if (body.action === "toggle_pause") {
    const folder = statusState.folders.find((f) => f.id === body.folderId);
    if (folder) {
      folder.state = folder.state === "paused" ? "idle" : "paused";
      statusState.systemLogs.unshift({
        timestamp: new Date().toISOString().substring(11, 19),
        level: "INFO",
        message: `Folder '${folder.label}' is now ${folder.state}`,
      });
    }
  } else if (body.action === "add_folder") {
    const newFolder: SyncFolder = {
      id: "folder-" + Date.now().toString(36),
      label: body.label || "New Sync Folder",
      path: body.path || "/var/syncthing/Sync/" + (body.label || "Folder"),
      globalBytes: 0,
      localBytes: 0,
      globalFiles: 0,
      localFiles: 0,
      state: "idle",
      sharedWith: ["MacBook-Pro-Workstation"],
      lastScan: "Never",
      readOnly: body.readOnly ?? false,
    };
    statusState.folders.push(newFolder);
    statusState.systemLogs.unshift({
      timestamp: new Date().toISOString().substring(11, 19),
      level: "INFO",
      message: `Created new synchronized folder: ${newFolder.label} at ${newFolder.path}`,
    });
  } else if (body.action === "restart_service") {
    statusState.serviceState = "restarting";
    statusState.systemLogs.unshift({
      timestamp: new Date().toISOString().substring(11, 19),
      level: "WARNING",
      message: "UGOS Pro lifecycle signal: restarting Syncthing container...",
    });
    setTimeout(() => {
      statusState.serviceState = "running";
      statusState.uptimeSeconds = 0;
      statusState.systemLogs.unshift({
        timestamp: new Date().toISOString().substring(11, 19),
        level: "INFO",
        message: "Syncthing container reloaded cleanly with latest project.yaml parameters",
      });
    }, 2000);
  }

  return NextResponse.json({ success: true, status: statusState });
}
