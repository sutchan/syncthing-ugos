"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  FileCode2,
  FolderTree,
  Terminal,
  Save,
  Play,
  Copy,
  Check,
  ShieldCheck,
  Layers,
  Code2,
  Box,
} from "lucide-react";
import { ValidationRule } from "@/app/api/project/route";

interface UpkValidatorProps {
  projectData: Record<string, unknown>;
  rawYaml: string;
  version: string;
  rules: ValidationRule[];
  dockerCompose: string;
  complianceScore: number;
  onSaveYaml: (yamlStr: string, versionStr?: string) => Promise<boolean>;
  onRunTerminal: (commandName: string) => void;
}

export const UpkValidator: React.FC<UpkValidatorProps> = ({
  rawYaml,
  version,
  rules,
  dockerCompose,
  complianceScore,
  onSaveYaml,
  onRunTerminal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"validator" | "yaml" | "compose" | "structure">("validator");
  const [editableYaml, setEditableYaml] = useState(rawYaml);
  const [editableVersion, setEditableVersion] = useState(version);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCompose, setCopiedCompose] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSaveYaml(editableYaml, editableVersion);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    }
  };

  const handleCopyCompose = () => {
    navigator.clipboard.writeText(dockerCompose);
    setCopiedCompose(true);
    setTimeout(() => setCopiedCompose(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              UGOS Pro UPK 打包与规范合规中心
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                complianceScore === 100
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              规范合规率: {complianceScore}%
            </span>
          </div>
          <p className="text-sm text-slate-500">
            严格对齐绿联 NAS 开发者平台《Docker 应用接入规范》(docs/specs 00~08) 与 ugcli 校验规约
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onRunTerminal("ugcli check")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>执行 ugcli check</span>
          </button>

          <button
            onClick={() => onRunTerminal("./build/build-all.sh")}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 transition-colors shadow-xs"
          >
            <Play className="w-3.5 h-3.5" />
            <span>一键全流程打包</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab("validator")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === "validator"
              ? "border-cyan-600 text-cyan-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>平台规范校验 ({rules.filter((r) => r.passed).length}/{rules.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab("yaml")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === "yaml"
              ? "border-cyan-600 text-cyan-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCode2 className="w-4 h-4" />
          <span>project.yaml 编辑器</span>
        </button>

        <button
          onClick={() => setActiveSubTab("compose")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === "compose"
              ? "border-cyan-600 text-cyan-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>docker-compose.yaml 渲染</span>
        </button>

        <button
          onClick={() => setActiveSubTab("structure")}
          className={`pb-3 text-sm font-semibold flex items-center gap-2 transition-colors border-b-2 ${
            activeSubTab === "structure"
              ? "border-cyan-600 text-cyan-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>UPK 打包文件树</span>
        </button>
      </div>

      {/* Tab Content: Rule Validator */}
      {activeSubTab === "validator" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          <div className="px-6 py-4 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              平台准入检验项
            </span>
            <span className="text-xs text-slate-500">
              依据 01-project-structure 至 08-publishing
            </span>
          </div>

          {rules.map((rule) => (
            <div
              key={rule.id}
              className="p-4.5 sm:px-6 flex items-start justify-between gap-4 hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  {rule.passed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {rule.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">{rule.message}</p>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    rule.passed
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {rule.passed ? "符合规范" : "待处理"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: project.yaml editor */}
      {activeSubTab === "yaml" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                project.yaml 核心配置源码
              </h3>
              <p className="text-xs text-slate-500">
                修改后点击右侧保存，将立即同步更新本地 project.yaml 并重新校验
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>VERSION 文件:</span>
                <input
                  type="text"
                  value={editableVersion}
                  onChange={(e) => setEditableVersion(e.target.value)}
                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs focus:ring-1 focus:ring-cyan-500"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs"
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>已保存生效</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 text-slate-300" />
                    <span>{isSaving ? "正在保存..." : "保存配置"}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950">
            <textarea
              rows={24}
              value={editableYaml}
              onChange={(e) => setEditableYaml(e.target.value)}
              className="w-full font-mono text-xs text-emerald-400 bg-transparent border-0 focus:outline-hidden focus:ring-0 leading-relaxed resize-y"
              spellCheck={false}
            />
          </div>
        </div>
      )}

      {/* Tab Content: docker-compose.yaml */}
      {activeSubTab === "compose" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                rootfs_common/docker-compose.yaml 渲染产物
              </h3>
              <p className="text-xs text-slate-500">
                打包机在 assemble 阶段由 docker-compose.yaml.tpl 注入环境变量生成
              </p>
            </div>

            <button
              onClick={handleCopyCompose}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {copiedCompose ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>已复制</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>复制 Compose</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 bg-slate-950">
            <pre className="font-mono text-xs text-cyan-300 leading-relaxed overflow-x-auto whitespace-pre">
              {dockerCompose}
            </pre>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800">安全合规审核要点：</div>
            <p>1. 无 privileged: true 与 cap_add，严格遵循非提权要求。</p>
            <p>2. network_mode: bridge，禁止 host 网络模式。</p>
            <p>3. 卷隔离：仅挂载用户授权的 ${"{UGAPP_SHARED_DIR}"} 与应用私有卷 ./data。</p>
          </div>
        </div>
      )}

      {/* Tab Content: UPK layout structure */}
      {activeSubTab === "structure" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              UPK 打包临时组装目录结构 (com.syncthing.docker.syncthing)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              由 build/assemble.sh 按照规范《01-project-structure.md》自动组装，供 ugcli pack 消费
            </p>
          </div>

          <div className="bg-slate-950 text-slate-200 p-5 rounded-xl font-mono text-xs leading-relaxed space-y-1 overflow-x-auto">
            <div className="text-amber-400 font-bold">com.syncthing.docker.syncthing/</div>
            <div className="text-slate-400">├── project.yaml                 <span className="text-slate-500"># 应用元数据 (spec 2.1)</span></div>
            <div className="text-slate-400">├── rootfs_common/               <span className="text-slate-500"># 跨架构公用资源</span></div>
            <div className="text-slate-400">│   ├── icon.png                 <span className="text-emerald-400"># 512x512 PNG 图标</span></div>
            <div className="text-slate-400">│   └── docker-compose.yaml      <span className="text-cyan-400"># 容器编排定义 (端口/挂载)</span></div>
            <div className="text-slate-400">├── rootfs_amd64/                <span className="text-slate-500"># Intel/AMD x86_64 专用</span></div>
            <div className="text-slate-400">│   └── images/                  <span className="text-slate-500"># 严禁存放非镜像文件</span></div>
            <div className="text-slate-400">│       └── syncthing-1.27.0-amd64.tar  <span className="text-indigo-400"># 单 tag: syncthing/syncthing:1.27.0</span></div>
            <div className="text-slate-400">└── rootfs_arm64/                <span className="text-slate-500"># ARM64 (RK3588/AArch64) 专用</span></div>
            <div className="text-slate-400">    └── images/</div>
            <div className="text-slate-400">        └── syncthing-1.27.0-arm64.tar  <span className="text-indigo-400"># 单 tag: syncthing/syncthing:1.27.0</span></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Box className="w-4 h-4 text-cyan-600" />
                <span>产物命名规约</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-mono">
                {"{arch}_{appid}_{version}.{build}.upk"}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                例如: amd64_com.syncthing.docker.syncthing_1.27.0.5.upk
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>镜像单 Tag 约束</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                每个 .tar 只能包含一个 tag，且必须与 docker-compose 中的 image 完全一致，严禁 latest 浮动标签。
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>开发者授权凭证</span>
              </div>
              <p className="text-xs text-slate-600 mt-2">
                真机测试需将 ugdev.sig 放入管理员个人文件夹，支持应用中心直接手动安装 .upk 进行验证。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
