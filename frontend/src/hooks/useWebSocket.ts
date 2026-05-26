"use client";
import { useRef, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { useChatStore } from "@/store/chatStore";
import { useProjectStore } from "@/store/projectStore";
import { WSEvent, Message, ProjectVersion } from "@/types";
import { toast } from "sonner";

// Auto-upgrade ws:// → wss:// on HTTPS pages to prevent mixed-content errors
const _rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
const WS_URL =
  typeof window !== "undefined" && window.location.protocol === "https:"
    ? _rawWsUrl.replace(/^ws:\/\//, "wss://")
    : _rawWsUrl;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { setGenerating, setStreamingStatus, addMessage } = useChatStore();
  const { setFiles, addVersion } = useProjectStore();

  const connect = useCallback(async (sessionId: string): Promise<WebSocket> => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return wsRef.current;
    }

    const token = await auth.currentUser?.getIdToken();
    if (!token) throw new Error("Not authenticated");

    const wsUrl = `${WS_URL}/ws/${sessionId}?token=${token}`;
    console.log("[WS] connecting to", wsUrl);

    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("[WS] connected");
        wsRef.current = ws;
        resolve(ws);
      };

      ws.onmessage = (event) => {
        const data: WSEvent = JSON.parse(event.data);
        handleEvent(data, sessionId);
      };

      ws.onerror = (e) => {
        console.error("[WS] connection error", e, "url:", wsUrl);
        reject(new Error("WebSocket connection failed"));
      };
      ws.onclose = (e) => {
        console.log("[WS] closed", e.code, e.reason);
        wsRef.current = null;
        setGenerating(false);
      };
    });
  }, []);

  const handleEvent = useCallback((event: WSEvent, sessionId: string) => {
    switch (event.type) {
      case "connected":
        break;

      case "status":
        const statusMap: Record<string, string> = {
          generating: "Thinking...",
          calling_gemini: "Calling Gemini AI...",
        };
        setStreamingStatus(statusMap[event.content] || event.content);
        break;

      case "files": {
        setFiles(event.content);
        setStreamingStatus("");

        // Add assistant message to chat
        const assistantMsg: Message = {
          id: crypto.randomUUID(),
          session_id: sessionId,
          role: "assistant",
          content: event.summary,
          version_id: event.version_id,
          created_at: new Date().toISOString(),
        };
        addMessage(assistantMsg);

        // Add version to store
        const version: ProjectVersion = {
          id: event.version_id,
          project_id: "",
          version_number: event.version,
          prompt: null,
          summary: event.summary,
          is_latest: true,
          created_at: new Date().toISOString(),
          files: Object.entries(event.content).map(([file_path, content]) => ({
            file_path,
            content,
            language: null,
          })),
        };
        addVersion(version);
        break;
      }

      case "done":
        setGenerating(false);
        setStreamingStatus("");
        break;

      case "error":
        setGenerating(false);
        setStreamingStatus("");
        toast.error(event.content);
        break;
    }
  }, []);

  const sendPrompt = useCallback(async (sessionId: string, prompt: string, skill: string = "dark_pro") => {
    try {
      setGenerating(true);
      setStreamingStatus("Connecting...");

      // Add user message to UI immediately
      const userMsg: Message = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        role: "user",
        content: prompt,
        version_id: null,
        created_at: new Date().toISOString(),
      };
      addMessage(userMsg);

      const ws = await connect(sessionId);
      ws.send(JSON.stringify({ type: "generate", prompt, skill }));
    } catch (err) {
      setGenerating(false);
      setStreamingStatus("");
      toast.error("Failed to connect to generation service");
    }
  }, [connect]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
  }, []);

  return { sendPrompt, disconnect };
}
