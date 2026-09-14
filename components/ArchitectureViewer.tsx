"use client";

import React from "react";
import {
  ShieldAlert,
  ShieldCheck,
  HardDrive,
  Network,
  Lock,
  Globe,
  Radio,
  Server,
  KeyRound,
  FileCheck2,
  FolderLock,
} from "lucide-react";

export const ArchitectureViewer: React.FC = () => {
  const designDecisions = [
    {
      id: 1,
      name: "应用形态",
      choice: "Docker 应用",
      detail: "复用官方多架构镜像 syncthing/syncthing，免本地交叉编译，支持 amd64/arm64",
    },
    {
      id: 2,
      name: "启动命令语义",
      choice: "start_cmd 留空 \"\"",
      detail: "遵循规范 02-project-yaml.md，Docker 应用由系统按 docker-compose.yaml 拉起",
    },
    {
      id: 3,
      name: "GUI 密码安全",
      choice: "GUI_PASSWORD 强制注入",
      detail: "Syncthing 1.27+ 废弃空密码，安装时必填 GUI_PASSWORD 并支持后续变更",
    },
    {
      id: 4,
      name: "权限边界",
      choice: "only_admin: true",
      detail: "文件同步涉及 NAS 系统存储与跨设备穿透，归属管理员特权",
    },
    {
      id: 5,
      name: "环境基线",
      choice: "固件 1.13+ / Docker 1.7+",
      detail: "声明最低依赖版本，保障 compose 解析及 UGAPP_SHARED_DIR 注入",
    },
    {
      id: 6,
      name: "远程访问隔离",
      choice: "仅 8384 经系统代理",
      detail: "22000(数据)与 21027(发现)仅限直连/局域网，不增加 NAS 反代暴露面",
    },
    {
      id: 7,
      name: "国际化支持",
      choice: "en-US + zh-CN",
      detail: "提供中英文全套字段说明、参数提示与帮助指引",
    },
    {
      id: 8,
      name: "版本协同",
      choice: "version 与 UPK 构建号解耦",
      detail: "version 跟随上游 1.27.0；UPK 包版本通过 build 参数形如 1.27.0.5",
    },
    {
      id: 9,
      name: "打开方式",
      choice: "open_type: tab",
      detail: "直接在独立浏览器标签打开 Syncthing 原生 Web UI，保持最高兼容性",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Visual System Architecture Diagram */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              UGOS Pro 运行拓扑与容器隔离模型
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              宿主系统（Debian 12）通过 Docker Engine、命名卷与非 root PUID/PGID 对齐实现安全沙箱
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            Debian 12 Bookworm 宿主
          </span>
        </div>

        {/* Diagram Box */}
        <div className="bg-slate-950 rounded-xl p-6 text-slate-200 font-mono text-xs overflow-x-auto space-y-4">
          <div className="text-center font-bold text-slate-400">
            [ 绿联 NAS 宿主机 (UGOS Pro 1.13+) / 端口与代理层 ]
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-cyan-400 font-bold flex items-center justify-center gap-1.5">
                <Globe className="w-4 h-4" /> 8384 HTTP(S)
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                系统反向代理 + UGREENlink 远程直通
              </p>
              <div className="text-[10px] text-emerald-400 mt-1.5">open_type: tab</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-indigo-400 font-bold flex items-center justify-center gap-1.5">
                <Network className="w-4 h-4" /> 22000 TCP/UDP
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                设备间端到端加密同步传输
              </p>
              <div className="text-[10px] text-slate-400 mt-1.5">直连 / 局域网直达</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg">
              <div className="text-amber-400 font-bold flex items-center justify-center gap-1.5">
                <Radio className="w-4 h-4" /> 21027 UDP
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                本地网络局域网广播发现 (Discovery)
              </p>
              <div className="text-[10px] text-slate-400 mt-1.5">无远程映射</div>
            </div>
          </div>

          <div className="text-center text-slate-500 py-1">
            │ 桥接网络隔离 (network_mode: bridge) │
          </div>

          {/* Docker container box */}
          <div className="bg-slate-900 border-2 border-cyan-900/60 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-cyan-300 font-bold text-sm">
                Docker 隔离容器: syncthing/syncthing:1.27.0
              </span>
              <span className="text-slate-400 text-[11px]">
                运行身份: syncthing (PUID: $PUID, PGID: $PGID, UMASK: 022)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4" /> 持久化配置数据卷
                </div>
                <div className="text-slate-300 text-[11px] mt-1">
                  宿主路径: <code className="text-cyan-300">./data</code>
                </div>
                <div className="text-slate-300 text-[11px]">
                  容器映射: <code className="text-cyan-300">/var/syncthing</code>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  存放密钥、索引数据库与配置；卸载时随应用彻底清理
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <div className="text-indigo-400 font-bold flex items-center gap-1.5">
                  <FolderLock className="w-4 h-4" /> 用户授权同步共享卷
                </div>
                <div className="text-slate-300 text-[11px] mt-1">
                  宿主路径: <code className="text-cyan-300">${"{UGAPP_SHARED_DIR}"}</code>
                </div>
                <div className="text-slate-300 text-[11px]">
                  容器映射: <code className="text-cyan-300">/var/syncthing/Sync</code>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  由 allow_add_access_path 触发平台授权注入，用户指定同步盘
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Redlines & Confirmed Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Redline Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <h3 className="text-base font-bold text-slate-900">
              平台安全红线 (docs/specs/03)
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">禁止特权容器 (privileged: true)</span>
                <p className="text-slate-500 mt-0.5">
                  严禁开启特权模式，防止容器逃逸影响 NAS 底层系统。
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">禁止 network_mode: host</span>
                <p className="text-slate-500 mt-0.5">
                  所有外部流量必须经由显式端口映射（8384、22000、21027）。
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">禁止浮动标签 (如 latest)</span>
                <p className="text-slate-500 mt-0.5">
                  镜像 tag 必须精确锁定（如 1.27.0），确保多架构 tar 与 compose 强校验一致。
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="font-bold text-slate-800">非 root 最小特权运行</span>
                <p className="text-slate-500 mt-0.5">
                  容器内以非 root 用户 syncthing 运行，通过 PUID/PGID 与宿主机权限对齐。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmed Design Decisions Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileCheck2 className="w-5 h-5 text-cyan-600" />
            <h3 className="text-base font-bold text-slate-900">
              9 项核心设计决策结论 (07-syncthing-design §7.6)
            </h3>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {designDecisions.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {d.id}. {d.name}
                  </span>
                  <span className="font-semibold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-100">
                    {d.choice}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  {d.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
