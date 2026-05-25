export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_onboarded: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  current_version_number: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  title: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  version_id: string | null;
  created_at: string;
}

export interface GeneratedFile {
  file_path: string;
  content: string;
  language: string | null;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_number: number;
  prompt: string | null;
  summary: string | null;
  is_latest: boolean;
  created_at: string;
  files: GeneratedFile[];
}

// WebSocket event types from backend
export type WSEvent =
  | { type: "connected"; session_id: string }
  | { type: "status"; content: string }
  | { type: "text_chunk"; content: string }
  | { type: "files"; content: Record<string, string>; summary: string; version: number; version_id: string }
  | { type: "done"; version: number }
  | { type: "error"; content: string }
  | { type: "pong" };
