"use client";

import React, { useState, useEffect } from "react";
import Markdown from "react-markdown";
import {
  BookOpen,
  Search,
  FileText,
  Bookmark,
  ChevronRight,
  ExternalLink,
  Info,
  Shield,
  Wrench,
  Sparkles,
} from "lucide-react";
import { DocItem } from "@/app/api/docs/route";

interface DocsViewerProps {
  initialDocs: DocItem[];
}

export const DocsViewer: React.FC<DocsViewerProps> = ({ initialDocs }) => {
  const [selectedDocId, setSelectedDocId] = useState<string>("00-overview");
  const [docContent, setDocContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchDoc = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/docs?id=${selectedDocId}`);
        const data = await res.json();
        if (data.content) {
          setDocContent(data.content);
        }
      } catch (err) {
        console.error("Failed to load doc", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDoc();
  }, [selectedDocId]);

  const filteredDocs = initialDocs.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const specsDocs = filteredDocs.filter((d) => d.category === "specs");
  const guidesDocs = filteredDocs.filter((d) => d.category === "guides");
  const rootDocs = filteredDocs.filter((d) => d.category === "root");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Sidebar: Document Catalog (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden sticky top-24">
        <div className="p-4 border-b border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-600" />
              <span>UGOS 规范与文档目录</span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {filteredDocs.length} 篇
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="搜索规范、端口、权限、命令..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="divide-y divide-slate-100 max-h-[calc(100vh-240px)] overflow-y-auto">
          {/* Section: Platform Specs */}
          {specsDocs.length > 0 && (
            <div className="p-3 bg-slate-50/50">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
                平台接入规范 (00~08)
              </span>
              <div className="mt-1.5 space-y-0.5">
                {specsDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                      selectedDocId === doc.id
                        ? "bg-cyan-50 text-cyan-900 font-semibold border border-cyan-200 shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs truncate">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {doc.summary}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        selectedDocId === doc.id ? "text-cyan-600" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Operational Guides */}
          {guidesDocs.length > 0 && (
            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
                工程与运维实践
              </span>
              <div className="mt-1.5 space-y-0.5">
                {guidesDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                      selectedDocId === doc.id
                        ? "bg-cyan-50 text-cyan-900 font-semibold border border-cyan-200 shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs truncate">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {doc.summary}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        selectedDocId === doc.id ? "text-cyan-600" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section: Project Root */}
          {rootDocs.length > 0 && (
            <div className="p-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-2">
                项目说明与更新
              </span>
              <div className="mt-1.5 space-y-0.5">
                {rootDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-2 ${
                      selectedDocId === doc.id
                        ? "bg-cyan-50 text-cyan-900 font-semibold border border-cyan-200 shadow-xs"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs truncate">{doc.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {doc.summary}
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                        selectedDocId === doc.id ? "text-cyan-600" : "text-slate-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Markdown Viewer (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 min-h-[600px]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-3 border-cyan-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500">正在读取文档内容...</p>
          </div>
        ) : (
          <div>
            <div className="pb-5 mb-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                <FileText className="w-4 h-4 text-cyan-600" />
                <span>文件路径: {initialDocs.find((d) => d.id === selectedDocId)?.path}</span>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                UGOS Pro 规范
              </span>
            </div>

            {/* Markdown rendered area */}
            <article className="prose prose-slate prose-sm sm:prose-base max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-h1:text-2xl prose-h2:text-xl prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-h3:text-lg prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:text-slate-200 prose-pre:rounded-xl prose-code:text-cyan-700 prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-table:border prose-table:border-slate-200 prose-th:bg-slate-50 prose-th:border prose-th:border-slate-200 prose-td:border prose-td:border-slate-200">
              <Markdown>{docContent}</Markdown>
            </article>
          </div>
        )}
      </div>
    </div>
  );
};
