"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProject, getChatSession, getMessages, listVersions, getLatestVersion } from "@/lib/api";
import type { ProjectVersion } from "@/types";
import { useProjectStore } from "@/store/projectStore";
import { useChatStore } from "@/store/chatStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import ChatPanel from "@/components/chat/ChatPanel";
import SandpackWrapper from "@/components/preview/SandpackWrapper";
import VersionSidebar from "@/components/versions/VersionSidebar";
import Topbar from "@/components/layout/Topbar";
import { toast } from "sonner";

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { setActiveProject, setVersions, setActiveVersion, setFiles } = useProjectStore();
  const { setSession, setMessages } = useChatStore();
  const { disconnect } = useWebSocket();

  useEffect(() => {
    if (!id) return;

    (async () => {
      try {
        // Batch 1: fetch project, session, version list, and latest files in parallel
        const [project, session, versions, latestVersion] = await Promise.all([
          getProject(id),
          getChatSession(id),
          listVersions(id),
          // getLatestVersion returns null-ish if no versions exist; catch silently
          getLatestVersion(id).catch(() => null) as Promise<ProjectVersion | null>,
        ]);

        setActiveProject(project);
        setSession(session);
        setVersions(versions);
        if (latestVersion) {
          const fileMap: Record<string, string> = {};
          for (const f of latestVersion.files) fileMap[f.file_path] = f.content;
          setFiles(fileMap);
          setActiveVersion(latestVersion);
        }

        // Batch 2: messages need session.id — fire after batch 1 resolves
        const msgs = await getMessages(session.id);
        setMessages(msgs);
      } catch {
        toast.error("Failed to load project");
        router.replace("/dashboard");
      }
    })();

    return () => {
      disconnect();
      setActiveProject(null);
      setSession(null);
      setMessages([]);
      setVersions([]);
      setFiles({});
      setActiveVersion(null);
    };
  }, [id]);

  const { session } = useChatStore();

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#0a0a0f]">
      <Topbar />

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Panel — 28% */}
        <div className="w-[28%] min-w-[260px] max-w-[380px] flex-shrink-0 overflow-hidden">
          {session ? (
            <ChatPanel sessionId={session.id} />
          ) : (
            <div className="h-full flex items-center justify-center bg-[#0d0d14]">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                <p className="text-zinc-600 text-xs">Loading chat...</p>
              </div>
            </div>
          )}
        </div>

        {/* Preview — flexible center */}
        <div className="flex-1 flex overflow-hidden border-x border-white/5">
          <SandpackWrapper />
        </div>

        {/* Version sidebar — fixed right */}
        <div className="flex-shrink-0 overflow-hidden">
          <VersionSidebar projectId={id} />
        </div>
      </div>
    </div>
  );
}
