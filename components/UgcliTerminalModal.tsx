"use client";

import React, { useState, useEffect } from "react";
import { Terminal, X, CheckCircle2, Play, RefreshCw, Copy, Check } from "lucide-react";

interface UgcliTerminalModalProps {
  command: string;
  onClose: () => void;
}

export const UgcliTerminalModal: React.FC<UgcliTerminalModalProps> = ({
  command,
  onClose,
}) => {
  const [lines, setLines] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLines([`$ ${command}`, "Initializing environment on Debian 12 (Bookworm)..."]);
    setIsFinished(false);

    const checkLogSequence = [
      "--> Checking project configuration: /repo/project.yaml",
      "    [PASS] spec_version: '2.1' (compliant with UGOS Pro 1.13+)",
      "    [PASS] app_id: 'com.syncthing.docker.syncthing'",
      "    [PASS] is_docker_app: true, depend_docker_version: 1.7.0.0000",
      "    [PASS] start_cmd: '' (empty string valid for Docker compose apps)",
      "    [PASS] port: 8384, open_type: 'tab' (direct native Web GUI)",
      "    [PASS] permissions: ['NETWORK.ACCESS_INTERNET'] (no SYSTEM.EXEC)",
      "    [PASS] parameters: GUI_PASSWORD, PUID, PGID, TZ defined with i18n",
      "--> Checking rootfs structure and resource restrictions...",
      "    [PASS] rootfs_common/icon.png (512x512 PNG, valid alpha channel)",
      "    [PASS] rootfs_common/docker-compose.yaml (no privileged, no host net)",
      "    [PASS] rootfs_amd64/images/: single-tag manifest validation",
      "    [PASS] rootfs_arm64/images/: single-tag manifest validation",
      "-------------------------------------------------------------",
      "==> [SUCCESS] ugcli check completed: 0 errors, 0 warnings.",
      "    Project is fully compliant with UGOS Pro UPK Packaging Specifications.",
    ];

    const buildLogSequence = [
      "==> [export-images] Pulling platform image syncthing/syncthing:1.27.0 (linux/amd64)...",
      "    docker save -> rootfs_amd64/images/syncthing-1.27.0-amd64.tar (single tag: 1.27.0)",
      "==> [export-images] Pulling platform image syncthing/syncthing:1.27.0 (linux/arm64)...",
      "    docker save -> rootfs_arm64/images/syncthing-1.27.0-arm64.tar (single tag: 1.27.0)",
      "==> [assemble] Creating temporary package layout: com.syncthing.docker.syncthing/...",
      "    Copied project.yaml",
      "    Copied assets/icon.png -> rootfs_common/icon.png",
      "    Rendered docker-compose.yaml.tpl -> rootfs_common/docker-compose.yaml",
      "==> [ugcli] Running validation checks...",
      "    [OK] Directory layout conforms to UGOS Pro spec 2.1",
      "==> [ugcli pack] Packaging for all architectures (amd64, arm64) with build number 5...",
      "    Generating package payload...",
      "    Applying metadata signature...",
      "    Created: build_dir/pkgs/upk/amd64_com.syncthing.docker.syncthing_1.27.0.5.upk",
      "    Created: build_dir/pkgs/upk/arm64_com.syncthing.docker.syncthing_1.27.0.5.upk",
      "-------------------------------------------------------------",
      "==> [BUILD FINISHED] All .upk artifacts generated successfully!",
      "    Ready for installation in UGOS Pro App Center or submission for publishing.",
    ];

    const targetSequence =
      command.includes("check") ? checkLogSequence : buildLogSequence;

    let index = 0;
    const interval = setInterval(() => {
      if (index < targetSequence.length) {
        setLines((prev) => [...prev, targetSequence[index]]);
        index++;
      } else {
        setIsFinished(true);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [command]);

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Terminal Header */}
        <div className="px-5 py-3.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-xs font-semibold text-slate-200">
              Debian 12 打包机终端: {command}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-1"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>复制日志</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-y-auto space-y-1.5 flex-1">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={`${
                line.includes("[PASS]") || line.includes("[SUCCESS]") || line.includes("[OK]") || line.includes("Created:")
                  ? "text-emerald-400"
                  : line.includes("-->") || line.includes("==>")
                  ? "text-cyan-300 font-bold"
                  : line.startsWith("$")
                  ? "text-amber-400 font-bold"
                  : "text-slate-300"
              }`}
            >
              {line}
            </div>
          ))}
          {!isFinished && (
            <div className="flex items-center gap-2 text-cyan-400 pt-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>正在执行中...</span>
            </div>
          )}
        </div>

        {/* Terminal Footer */}
        <div className="px-5 py-3 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            {isFinished ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> 进程正常退出 (code: 0)
              </span>
            ) : (
              <span>运行中 (PID: 2841)</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            关闭终端
          </button>
        </div>
      </div>
    </div>
  );
};
