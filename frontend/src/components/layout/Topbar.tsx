"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Settings } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { zipSync, strToU8 } from "fflate";

function CursorSparkMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35"/>
      <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.55"/>
      <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.35"/>
      <circle cx="14.5" cy="3" r="0.9" fill="#FF6B35" opacity="0.25"/>
    </svg>
  );
}

export default function Topbar() {
  const router = useRouter();
  const { activeProject, files } = useProjectStore();
  const { dbUser } = useAuthStore();
  const { isGenerating, streamingStatus } = useChatStore();

  const handleExport = () => {
    const { files: f } = useProjectStore.getState();
    if (!Object.keys(f).length) return;

    const zipEntries: Record<string, Uint8Array> = {};
    for (const [filePath, content] of Object.entries(f)) {
      // Strip leading slash if present so paths are relative inside the zip
      const key = filePath.startsWith("/") ? filePath.slice(1) : filePath;
      zipEntries[key] = strToU8(content);
    }

    const zipped = zipSync(zipEntries, { level: 6 });
    const blob = new Blob([zipped], { type: "application/zip" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const name = (activeProject?.title ?? "uiwiz-project")
      .replace(/[^a-z0-9_-]/gi, "-")
      .toLowerCase();
    a.download = `${name}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileCount = Object.keys(files).length;

  return (
    <header
      className="relative h-11 flex items-center px-4 flex-shrink-0 border-b"
      style={{ backgroundColor: "#0D1120", borderColor: "#1A2038" }}
    >
      {/* Generating shimmer bar */}
      {isGenerating && (
        <div
          className="gen-bar absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden"
          style={{ backgroundColor: "rgba(255,107,53,0.1)" }}
        />
      )}

      {/* Left: back + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={() => router.push("/dashboard")}
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
          style={{ color: "#4A5275" }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#8892AA";
            el.style.backgroundColor = "#141828";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#4A5275";
            el.style.backgroundColor = "transparent";
          }}
          aria-label="Back to projects"
        >
          <ArrowLeft size={13} />
        </button>

        <div className="w-px h-3 flex-shrink-0" style={{ backgroundColor: "#1A2038" }} />

        {/* Brand breadcrumb */}
        <div className="flex items-center gap-1.5 min-w-0">
          <CursorSparkMark size={15} />
          <span
            className="text-[11px] font-mono flex-shrink-0 hidden sm:inline"
            style={{ color: "#4A5275" }}
          >
            UIWiz
          </span>
          <span className="text-[11px] flex-shrink-0 hidden sm:inline" style={{ color: "#232A42" }}>
            /
          </span>
          <span
            className="font-syne text-[12.5px] font-semibold truncate"
            style={{ color: "#E8ECF4" }}
          >
            {activeProject?.title ?? "Untitled"}
          </span>
        </div>
      </div>

      {/* Center: generating indicator */}
      {isGenerating && (
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
          <span
            className="animate-gen-pulse w-[5px] h-[5px] rounded-full flex-shrink-0"
            style={{ backgroundColor: "#FF6B35", boxShadow: "0 0 6px rgba(255,107,53,0.7)" }}
          />
          <span className="text-[10.5px] font-mono tracking-wide" style={{ color: "#FF6B35" }}>
            {streamingStatus || "Generating…"}
          </span>
        </div>
      )}

      {/* Right: actions */}
      <div className="ml-auto flex items-center gap-1">
        {fileCount > 0 && (
          <span
            className="text-[9.5px] font-mono px-2 py-0.5 rounded hidden sm:inline-block mr-1"
            style={{
              color: "#4D9CFF",
              backgroundColor: "rgba(77,156,255,0.06)",
              border: "1px solid rgba(77,156,255,0.12)",
            }}
          >
            {fileCount}f
          </span>
        )}

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-md transition-all"
          style={{ color: "#4A5275" }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#E8ECF4";
            el.style.backgroundColor = "#141828";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#4A5275";
            el.style.backgroundColor = "transparent";
          }}
        >
          <Download size={11} />
          <span className="hidden sm:inline">export</span>
        </button>

        <div className="w-px h-4 mx-1" style={{ backgroundColor: "#1A2038" }} />

        <button
          onClick={() => router.push("/settings")}
          className="p-1.5 rounded-md transition-all"
          style={{ color: "#4A5275" }}
          aria-label="Settings"
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#8892AA";
            el.style.backgroundColor = "#141828";
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement;
            el.style.color = "#4A5275";
            el.style.backgroundColor = "transparent";
          }}
        >
          <Settings size={13} />
        </button>

        {dbUser?.avatar_url ? (
          <img
            src={dbUser.avatar_url}
            alt={dbUser.display_name ?? "U"}
            className="w-6 h-6 rounded-full ml-1.5 flex-shrink-0"
            style={{ outline: "1.5px solid #232A42", outlineOffset: "1px" }}
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full ml-1.5 flex-shrink-0 flex items-center justify-center text-[9px] font-bold"
            style={{ backgroundColor: "#FF6B35", color: "#fff" }}
          >
            {dbUser?.display_name?.[0]?.toUpperCase() ?? "U"}
          </div>
        )}
      </div>
    </header>
  );
}
