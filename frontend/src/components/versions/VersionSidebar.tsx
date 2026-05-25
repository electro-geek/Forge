"use client";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { RotateCcw, GitBranch } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { restoreVersion, getVersion } from "@/lib/api";
import { ProjectVersion } from "@/types";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useState } from "react";

interface VersionSidebarProps {
  projectId: string;
}

export default function VersionSidebar({ projectId }: VersionSidebarProps) {
  const { versions, activeVersion, setFiles, setActiveVersion, addVersion, updateVersionFiles } = useProjectStore();
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleVersionClick = async (version: ProjectVersion) => {
    if (version.files.length > 0) {
      const fileMap: Record<string, string> = {};
      for (const f of version.files) fileMap[f.file_path] = f.content;
      setFiles(fileMap);
      setActiveVersion(version);
      return;
    }
    // Files not yet loaded — fetch on demand and cache in store
    setLoadingId(version.id);
    try {
      const full = await getVersion(projectId, version.id);
      updateVersionFiles(version.id, full.files);
      const fileMap: Record<string, string> = {};
      for (const f of full.files) fileMap[f.file_path] = f.content;
      setFiles(fileMap);
      setActiveVersion({ ...version, files: full.files });
    } catch {
      toast.error("Failed to load version files");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRestore = async (version: ProjectVersion, e: React.MouseEvent) => {
    e.stopPropagation();
    setRestoringId(version.id);
    try {
      const result = await restoreVersion(projectId, version.id);
      const fileMap: Record<string, string> = {};
      for (const f of result.new_version.files) fileMap[f.file_path] = f.content;
      setFiles(fileMap);
      addVersion(result.new_version);
      toast.success(`Restored to v${version.version_number}`);
    } catch {
      toast.error("Failed to restore version");
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div
      className="flex flex-col h-full w-52 border-l flex-shrink-0"
      style={{ backgroundColor: "#0D1120", borderColor: "#1A2038" }}
    >
      {/* Header */}
      <div
        className="px-4 py-3.5 border-b flex items-center gap-2 flex-shrink-0"
        style={{ borderColor: "#1A2038" }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,107,53,0.08)" }}
        >
          <GitBranch size={10} style={{ color: "#FF6B35" }} />
        </div>
        <span className="font-syne font-semibold text-[12px]" style={{ color: "#E8ECF4" }}>
          History
        </span>
        {versions.length > 0 && (
          <span
            className="ml-auto text-[9.5px] font-mono px-1.5 py-0.5 rounded"
            style={{ backgroundColor: "#141828", color: "#4A5275", border: "1px solid #1A2038" }}
          >
            {versions.length}
          </span>
        )}
      </div>

      {/* Version list */}
      <div className="flex-1 overflow-y-auto py-3 px-3">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <div
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ backgroundColor: "#141828", border: "1px solid #1A2038" }}
            >
              <GitBranch size={13} style={{ color: "#232A42" }} />
            </div>
            <p className="text-[10px] font-mono text-center" style={{ color: "#232A42" }}>
              No versions yet.{"\n"}Generate your first UI.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* Dotted timeline rail */}
            {versions.length > 1 && <div className="version-rail" />}

            <AnimatePresence>
              {versions.map((version, i) => {
                const isActive = activeVersion?.id === version.id;
                const isRestoring = restoringId === version.id;
                const isLoading = loadingId === version.id;
                const fileCount = version.files?.length ?? 0;

                return (
                  <motion.div
                    key={version.id}
                    initial={prefersReducedMotion ? false : { opacity: 0, x: 8, filter: "blur(2px)" }}
                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                    transition={{
                      type: "spring",
                      duration: 0.28,
                      bounce: 0,
                      delay: prefersReducedMotion ? 0 : Math.min(i * 0.04, 0.24),
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`Version ${version.version_number}${version.is_latest ? " (current)" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => handleVersionClick(version)}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleVersionClick(version);
                      }
                    }}
                    className="group relative flex gap-2.5 p-2 rounded-lg mb-0.5"
                    style={{ border: "1px solid transparent" }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = "#141828";
                        el.style.borderColor = "#1A2038";
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.backgroundColor = "transparent";
                        el.style.borderColor = "transparent";
                      }
                    }}
                  >
                    {/* Active highlight — FLIP animated via layoutId */}
                    {isActive && (
                      <motion.div
                        layoutId="version-active-bg"
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          backgroundColor: "rgba(255,107,53,0.07)",
                          border: "1px solid rgba(255,107,53,0.14)",
                        }}
                        transition={
                          prefersReducedMotion
                            ? { duration: 0 }
                            : { type: "spring", duration: 0.32, bounce: 0 }
                        }
                      />
                    )}

                    {/* Version number badge */}
                    <div className="flex-shrink-0 relative z-10">
                      <div
                        className="w-[22px] h-[22px] rounded flex items-center justify-center text-[9.5px] font-mono font-bold leading-none relative"
                        style={
                          version.is_latest
                            ? { backgroundColor: "#FF6B35", color: "#fff" }
                            : isActive
                            ? { backgroundColor: "#141828", border: "1px solid rgba(255,107,53,0.3)", color: "#FF6B35" }
                            : { backgroundColor: "#141828", border: "1px solid #1A2038", color: "#4A5275" }
                        }
                      >
                          {isLoading ? (
                            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin opacity-70" />
                          ) : version.version_number}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Live badge */}
                      {version.is_latest && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                            style={{ backgroundColor: "#3DD68C", boxShadow: "0 0 4px rgba(61,214,140,0.6)" }}
                          />
                          <span
                            className="text-[9px] font-mono font-semibold tracking-wider uppercase"
                            style={{ color: "#3DD68C" }}
                          >
                            live
                          </span>
                        </div>
                      )}

                      <p
                        className="text-[11px] leading-snug line-clamp-2"
                        style={{ color: isActive ? "#E8ECF4" : "#8892AA" }}
                      >
                        {version.summary ?? version.prompt ?? "Generated UI"}
                      </p>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9.5px] font-mono" style={{ color: "#232A42" }}>
                            {formatDate(version.created_at)}
                          </span>
                          {fileCount > 0 && (
                            <span className="text-[9px] font-mono" style={{ color: "#232A42" }}>
                              · {fileCount}f
                            </span>
                          )}
                        </div>

                        {/* Restore button — appears on hover */}
                        {!version.is_latest && (
                          <button
                            onClick={(e) => handleRestore(version, e)}
                            disabled={isRestoring}
                            aria-label={`Restore version ${version.version_number}`}
                            className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-[9.5px] font-mono transition-all px-2 py-1 rounded min-h-[28px]"
                            style={{ color: "#4A5275" }}
                            onMouseEnter={e => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.color = "#FF6B35";
                              el.style.backgroundColor = "rgba(255,107,53,0.08)";
                            }}
                            onMouseLeave={e => {
                              const el = e.currentTarget as HTMLElement;
                              el.style.color = "#4A5275";
                              el.style.backgroundColor = "transparent";
                            }}
                          >
                            <RotateCcw size={9} className={isRestoring ? "animate-spin" : ""} />
                            {isRestoring ? "…" : "restore"}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
