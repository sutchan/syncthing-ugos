import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export interface DocItem {
  id: string;
  title: string;
  category: "specs" | "guides" | "root";
  path: string;
  summary: string;
}

const DOC_CATALOG: DocItem[] = [
  {
    id: "00-overview",
    title: "00 — 项目规范文档总览",
    category: "specs",
    path: "docs/specs/00-overview.md",
    summary: "UGOS Pro Docker 应用平台规范总览与 Syncthing 适配设计决策速览",
  },
  {
    id: "01-project-structure",
    title: "01 — 项目目录结构规范",
    category: "specs",
    path: "docs/specs/01-project-structure.md",
    summary: "UPK 打包目录结构、rootfs_common、rootfs_amd64、rootfs_arm64 硬约束",
  },
  {
    id: "02-project-yaml",
    title: "02 — project.yaml 字段规范",
    category: "specs",
    path: "docs/specs/02-project-yaml.md",
    summary: "project.yaml 全量字段详细定义、约束规则与 Syncthing 权威取值",
  },
  {
    id: "03-docker-image",
    title: "03 — Docker 镜像与 compose 规范",
    category: "specs",
    path: "docs/specs/03-docker-image.md",
    summary: "Dockerfile 最佳实践、镜像导出规约、docker-compose 模板与安全红线",
  },
  {
    id: "04-runtime-env",
    title: "04 — 运行时环境约定",
    category: "specs",
    path: "docs/specs/04-runtime-env.md",
    summary: "UGOS Pro 受限运行环境、持久化路径、PUID/PGID 权限与环境变量映射",
  },
  {
    id: "05-app-lifecycle",
    title: "05 — 应用生命周期与管理",
    category: "specs",
    path: "docs/specs/05-app-lifecycle.md",
    summary: "安装、启停、配置变更、端口映射、Web GUI 登录认证及升级流程",
  },
  {
    id: "06-build-pack",
    title: "06 — 构建与打包规范 (ugcli)",
    category: "specs",
    path: "docs/specs/06-build-pack.md",
    summary: "ugcli 工具链、交互式创建、配置修改、检查 (check) 与打包 (pack)",
  },
  {
    id: "07-syncthing-design",
    title: "07 — Syncthing 适配设计决策",
    category: "specs",
    path: "docs/specs/07-syncthing-design.md",
    summary: "形态选择、端口规划、认证策略、非 root 权限与 9 项设计决策状态",
  },
  {
    id: "08-publishing",
    title: "08 — 发布上架与测试流程",
    category: "specs",
    path: "docs/specs/08-publishing.md",
    summary: "绿联应用市场上架流程、开发者授权 (ugdev.sig) 与版本发布流程",
  },
  {
    id: "development",
    title: "开发与打包实操指南 (DEVELOPMENT.md)",
    category: "guides",
    path: "docs/DEVELOPMENT.md",
    summary: "Linux 打包机配置、一键构建流程、镜像导出与常见问题排查",
  },
  {
    id: "ops",
    title: "运维与故障排查手册 (OPS.md)",
    category: "guides",
    path: "docs/OPS.md",
    summary: "容器状态查看、日志定位、网络与外网同步、权限排查实战",
  },
  {
    id: "security",
    title: "安全说明与风险评估 (SECURITY.md)",
    category: "guides",
    path: "docs/SECURITY.md",
    summary: "攻击面分析、GUI 密码防弱口令策略、权限隔离与端口暴露防护",
  },
  {
    id: "readme",
    title: "项目说明文档 (README.md)",
    category: "root",
    path: "README.md",
    summary: "Syncthing for UGOS Pro 核心特性、目录结构与快速开始",
  },
  {
    id: "changelog",
    title: "版本变更记录 (CHANGELOG.md)",
    category: "root",
    path: "CHANGELOG.md",
    summary: "1.27.0.5 等历史版本演进与规范对齐细节",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const docId = searchParams.get("id");
  const rootDir = process.cwd();

  if (!docId) {
    return NextResponse.json({ docs: DOC_CATALOG });
  }

  const found = DOC_CATALOG.find((d) => d.id === docId);
  if (!found) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  try {
    const fullPath = path.join(rootDir, found.path);
    const content = await fs.readFile(fullPath, "utf-8");
    return NextResponse.json({ doc: found, content });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
