"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SyncthingManager } from "@/components/SyncthingManager";
import { UpkValidator } from "@/components/UpkValidator";
import { DocsViewer } from "@/components/DocsViewer";
import { ArchitectureViewer } from "@/components/ArchitectureViewer";
import { UgcliTerminalModal } from "@/components/UgcliTerminalModal";
import { SyncthingStatus } from "@/app/api/syncthing/route";
import { ValidationRule } from "@/app/api/project/route";
import { DocItem } from "@/app/api/docs/route";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"manager" | "packaging" | "specs" | "arch">("manager");
  const [projectData, setProjectData] = useState<Record<string, unknown>>({});
  const [rawYaml, setRawYaml] = useState<string>("");
  const [version, setVersion] = useState<string>("1.27.0");
  const [upkVersion, setUpkVersion] = useState<string>("1.27.0.5");
  const [rules, setRules] = useState<ValidationRule[]>([]);
  const [dockerCompose, setDockerCompose] = useState<string>("");
  const [complianceScore, setComplianceScore] = useState<number>(100);
  const [docsCatalog, setDocsCatalog] = useState<DocItem[]>([]);
  const [syncthingStatus, setSyncthingStatus] = useState<SyncthingStatus | null>(null);
  const [terminalCommand, setTerminalCommand] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch Project metadata & UPK rules
  const fetchProjectData = async () => {
    try {
      const res = await fetch("/api/project");
      const data = await res.json();
      if (data.projectYaml) {
        setProjectData(data.projectYaml);
        setRawYaml(data.rawYaml);
        setVersion(data.projectYaml.version || "1.27.0");
        setUpkVersion(data.version || "1.27.0.5");
        setRules(data.rules || []);
        setDockerCompose(data.dockerCompose || "");
        setComplianceScore(data.complianceScore ?? 100);
      }
    } catch (err) {
      console.error("Failed to load project metadata", err);
    }
  };

  // Fetch Syncthing runtime state
  const fetchSyncthingStatus = async () => {
    try {
      const res = await fetch("/api/syncthing");
      const data = await res.json();
      setSyncthingStatus(data);
    } catch (err) {
      console.error("Failed to load Syncthing state", err);
    }
  };

  // Fetch Docs catalog
  const fetchDocsCatalog = async () => {
    try {
      const res = await fetch("/api/docs");
      const data = await res.json();
      if (data.docs) {
        setDocsCatalog(data.docs);
      }
    } catch (err) {
      console.error("Failed to load docs catalog", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchProjectData(), fetchSyncthingStatus(), fetchDocsCatalog()]);
      setIsLoading(false);
    };
    init();
  }, []);

  const handleTriggerAction = async (action: string, payload?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/syncthing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.status) {
        setSyncthingStatus(data.status);
      }
    } catch (err) {
      console.error("Action trigger error", err);
    }
  };

  const handleSaveYaml = async (yamlStr: string, versionStr?: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawYaml: yamlStr, version: versionStr }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchProjectData();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Failed to save YAML", err);
      return false;
    }
  };

  if (isLoading || !syncthingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">正在加载 Syncthing for UGOS Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serviceState={syncthingStatus.serviceState}
        version={version}
        upkVersion={upkVersion}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "manager" && (
          <SyncthingManager
            status={syncthingStatus}
            onRefresh={fetchSyncthingStatus}
            onTriggerAction={handleTriggerAction}
          />
        )}

        {activeTab === "packaging" && (
          <UpkValidator
            projectData={projectData}
            rawYaml={rawYaml}
            version={upkVersion}
            rules={rules}
            dockerCompose={dockerCompose}
            complianceScore={complianceScore}
            onSaveYaml={handleSaveYaml}
            onRunTerminal={(cmd) => setTerminalCommand(cmd)}
          />
        )}

        {activeTab === "specs" && <DocsViewer initialDocs={docsCatalog} />}

        {activeTab === "arch" && <ArchitectureViewer />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">Syncthing for UGOS Pro</span>
            <span className="mx-2">•</span>
            <span>App ID: com.syncthing.docker.syncthing</span>
            <span className="mx-2">•</span>
            <span>MPL-2.0 开源许可</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/syncthing/syncthing"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600 transition-colors"
            >
              Syncthing 上游仓库
            </a>
            <span>•</span>
            <a
              href="https://developer.ugnas.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cyan-600 transition-colors"
            >
              绿联开发者平台
            </a>
          </div>
        </div>
      </footer>

      {/* Interactive Terminal Modal for ugcli commands */}
      {terminalCommand && (
        <UgcliTerminalModal
          command={terminalCommand}
          onClose={() => setTerminalCommand(null)}
        />
      )}
    </div>
  );
}
