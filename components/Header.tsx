"use client";

import React from "react";
import Image from "next/image";
import {
  FolderSync,
  PackageCheck,
  BookOpen,
  Layers,
  CheckCircle2,
  HardDrive,
  ExternalLink,
} from "lucide-react";

interface HeaderProps {
  activeTab: "manager" | "packaging" | "specs" | "arch";
  setActiveTab: (tab: "manager" | "packaging" | "specs" | "arch") => void;
  serviceState: string;
  version: string;
  upkVersion: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  serviceState,
  version,
  upkVersion,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-slate-200/80 bg-slate-50 flex items-center justify-center">
              <Image
                src="/icon.png"
                alt="Syncthing Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">
                  Syncthing for UGOS Pro
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {serviceState === "running" ? "NAS 服务运行中" : serviceState}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span>应用: {version}</span>
                <span>•</span>
                <span>UPK: {upkVersion}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 font-medium">
                  <HardDrive className="w-3 h-3 text-slate-400" />
                  绿联 NAS (Debian 12)
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab("manager")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "manager"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <FolderSync className="w-4 h-4 text-cyan-600" />
              <span>同步管理面板</span>
            </button>

            <button
              onClick={() => setActiveTab("packaging")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "packaging"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>UPK 打包与校验</span>
            </button>

            <button
              onClick={() => setActiveTab("specs")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "specs"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>规范文档中心</span>
            </button>

            <button
              onClick={() => setActiveTab("arch")}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === "arch"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <Layers className="w-4 h-4 text-amber-600" />
              <span>架构与安全设计</span>
            </button>
          </nav>

          {/* Direct GUI link badge */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="http://localhost:8384"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
              title="模拟直连 Syncthing 原生 Web GUI (端口 8384)"
            >
              <span>Web GUI (8384)</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};
