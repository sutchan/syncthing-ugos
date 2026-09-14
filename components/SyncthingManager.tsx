"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Play,
  Pause,
  FolderPlus,
  Server,
  Laptop,
  Smartphone,
  CheckCircle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Terminal,
  Copy,
  Check,
  Cpu,
  Activity,
  FolderSync,
} from "lucide-react";
import { SyncFolder, RemoteDevice, SyncthingStatus } from "@/app/api/syncthing/route";

interface SyncthingManagerProps {
  status: SyncthingStatus;
  onRefresh: () => void;
  onTriggerAction: (action: string, payload?: Record<string, unknown>) => Promise<void>;
}

export const SyncthingManager: React.FC<SyncthingManagerProps> = ({
  status,
  onRefresh,
  onTriggerAction,
}) => {
  const [copiedId, setCopiedId] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderPath, setNewFolderPath] = useState("");
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatSpeed = (bytesPerSec: number) => {
    if (bytesPerSec === 0) return "0 KB/s";
    return (bytesPerSec / 1024).toFixed(1) + " KB/s";
  };

  const copyDeviceId = () => {
    navigator.clipboard.writeText(status.myID);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    setIsSubmitting(true);
    await onTriggerAction("add_folder", {
      label: newFolderName,
      path: newFolderPath || `/var/syncthing/Sync/${newFolderName}`,
      readOnly: isReadOnly,
    });
    setNewFolderName("");
    setNewFolderPath("");
    setShowAddFolder(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Container Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              UGOS 容器状态
            </span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 capitalize">
              {status.serviceState === "running" ? "健康运行" : status.serviceState}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              运行时长: {Math.floor(status.uptimeSeconds / 3600)} 小时{" "}
              {Math.floor((status.uptimeSeconds % 3600) / 60)} 分钟
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">隔离用户: PUID 1000</span>
            <button
              onClick={() => onTriggerAction("restart_service")}
              className="text-cyan-600 hover:text-cyan-700 font-medium hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> 重启容器
            </button>
          </div>
        </div>

        {/* Card 2: Port & Web GUI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              原生 Web GUI
            </span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-100">
              端口 8384
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">open_type: tab</div>
            <p className="text-xs text-slate-500 mt-1">
              通过 UGREENlink 及本地网络直达 Web UI
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> GUI 密码校验已强制启用
            </span>
          </div>
        </div>

        {/* Card 3: Storage Sync Volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              同步总容量
            </span>
            <FolderSync className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {formatBytes(
                status.folders.reduce((acc, f) => acc + f.globalBytes, 0)
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              共 {status.folders.reduce((acc, f) => acc + f.globalFiles, 0)} 个同步文件
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>授权目录挂载:</span>
            <code className="text-[11px] font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
              /var/syncthing/Sync
            </code>
          </div>
        </div>

        {/* Card 4: System Resource */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              硬件占用
            </span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">
              {status.memoryMb} MB
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-400" /> CPU 利用率: {status.cpuPercent}%
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>官方镜像: syncthing/syncthing</span>
            <span className="text-emerald-600 font-medium">轻量无侵入</span>
          </div>
        </div>
      </div>

      {/* Local Device ID Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/10 text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-300">
              本机 Syncthing 节点识别码 (Device ID)
            </div>
            <div className="font-mono text-sm sm:text-base font-semibold tracking-wide text-slate-100 mt-0.5 break-all">
              {status.myID}
            </div>
          </div>
        </div>
        <button
          onClick={copyDeviceId}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 active:bg-white/25 rounded-lg transition-colors"
        >
          {copiedId ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制 ID</span>
            </>
          )}
        </button>
      </div>

      {/* Synchronized Folders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderSync className="w-5 h-5 text-cyan-600" />
              <span>已同步文件夹</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              由 UGOS Pro 用户授权路径 (UGAPP_SHARED_DIR) 与应用专用卷 (./data) 挂载驱动
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRefresh()}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> 刷新状态
            </button>
            <button
              onClick={() => setShowAddFolder(true)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <FolderPlus className="w-3.5 h-3.5" /> 添加同步目录
            </button>
          </div>
        </div>

        {/* Folder Add Form Modal */}
        {showAddFolder && (
          <div className="p-5 bg-slate-50 border-b border-slate-200">
            <form onSubmit={handleCreateFolder} className="space-y-4 max-w-2xl">
              <h3 className="text-sm font-bold text-slate-900">
                新建 NAS 同步文件夹
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    文件夹标签 (Label)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="例如: Documents"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    容器内挂载路径 (Path)
                  </label>
                  <input
                    type="text"
                    placeholder="/var/syncthing/Sync/..."
                    value={newFolderPath}
                    onChange={(e) => setNewFolderPath(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="readonly"
                  checked={isReadOnly}
                  onChange={(e) => setIsReadOnly(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500"
                />
                <label htmlFor="readonly" className="text-xs text-slate-600">
                  仅发送 (Send Only) - 不接收远端变更
                </label>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  确认添加
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddFolder(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Folders List */}
        <div className="divide-y divide-slate-200">
          {status.folders.map((folder) => (
            <div
              key={folder.id}
              className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">
                    {folder.label}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      folder.state === "syncing"
                        ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                        : folder.state === "paused"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {folder.state === "syncing" && (
                      <RefreshCw className="w-3 h-3 animate-spin text-cyan-600" />
                    )}
                    {folder.state === "paused" && (
                      <Pause className="w-3 h-3 text-amber-600" />
                    )}
                    {folder.state === "idle" && (
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                    )}
                    <span>
                      {folder.state === "syncing"
                        ? "正在扫描同步"
                        : folder.state === "paused"
                        ? "已暂停"
                        : "已最新"}
                    </span>
                  </span>
                  {folder.readOnly && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      只读
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                  <span className="font-mono text-slate-600">{folder.path}</span>
                  <span>•</span>
                  <span>容量: {formatBytes(folder.globalBytes)}</span>
                  <span>•</span>
                  <span>文件数: {folder.globalFiles}</span>
                  <span>•</span>
                  <span>上次扫描: {folder.lastScan}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                  <span className="text-slate-400">共享节点:</span>
                  {folder.sharedWith.map((device) => (
                    <span
                      key={device}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]"
                    >
                      {device}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    onTriggerAction("rescan", { folderId: folder.id })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>立即重新扫描</span>
                </button>
                <button
                  onClick={() =>
                    onTriggerAction("toggle_pause", { folderId: folder.id })
                  }
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {folder.state === "paused" ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-emerald-600" />
                      <span>继续同步</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600" />
                      <span>暂停</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Connected Devices Grid & Network Discovery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices Column (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                关联的远程设备与拓扑
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                基于 Syncthing 22000 (数据) 与 21027 (本地发现) 端口通信
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              在线: {status.devices.filter((d) => d.connected).length} / {status.devices.length}
            </span>
          </div>

          <div className="divide-y divide-slate-200">
            {status.devices.map((device) => (
              <div
                key={device.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-2.5 rounded-xl ${
                      device.connected
                        ? "bg-cyan-50 text-cyan-600 border border-cyan-100"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {device.name.includes("Phone") || device.name.includes("Pixel") ? (
                      <Smartphone className="w-5 h-5" />
                    ) : (
                      <Laptop className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        {device.name}
                      </h3>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          device.connected ? "bg-emerald-500" : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 font-mono">
                      {device.address}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      客户端: {device.clientVersion}
                    </div>
                  </div>
                </div>

                {/* Transfer Speed Indicator */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 text-right">
                  {device.connected ? (
                    <>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          {formatSpeed(device.downloadRate)}
                        </span>
                        <span className="flex items-center gap-1 text-cyan-600 font-medium">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          {formatSpeed(device.uploadRate)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        状态: 直连已加密 (TLS 1.3)
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400">
                      离线 • 上次在线: {device.lastSeen}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Logs Stream (1 col) */}
        <div className="bg-slate-950 text-slate-300 rounded-2xl border border-slate-800 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Syncthing 运行日志
                </h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <div className="mt-3 font-mono text-[11px] leading-relaxed space-y-2.5 max-h-96 overflow-y-auto">
              {status.systemLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span
                    className={`font-semibold shrink-0 ${
                      log.level === "ERROR"
                        ? "text-rose-400"
                        : log.level === "WARNING"
                        ? "text-amber-400"
                        : "text-cyan-400"
                    }`}
                  >
                    {log.level}:
                  </span>
                  <span className="text-slate-300 break-words">{log.message}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>日志源: /var/packages/.../log/</span>
            <span className="text-cyan-400 font-mono">UGOS Pro 容器隔离</span>
          </div>
        </div>
      </div>
    </div>
  );
};
