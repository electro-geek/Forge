import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

// Inject Firebase ID token on every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Auth ---
export const verifyToken = (id_token: string) =>
  api.post("/auth/verify", { id_token }).then((r) => r.data);

// --- Keys ---
export const saveGeminiKey = (gemini_api_key: string) =>
  api.post("/keys/gemini", { gemini_api_key }).then((r) => r.data);

export const deleteGeminiKey = () =>
  api.delete("/keys/gemini").then((r) => r.data);

// --- Projects ---
export const listProjects = () =>
  api.get("/projects").then((r) => r.data);

export const createProject = (title: string, description?: string) =>
  api.post("/projects", { title, description }).then((r) => r.data);

export const getProject = (id: string) =>
  api.get(`/projects/${id}`).then((r) => r.data);

export const deleteProject = (id: string) =>
  api.delete(`/projects/${id}`).then((r) => r.data);

// --- Chats ---
export const getChatSession = (project_id: string) =>
  api.get(`/chats/${project_id}/session`).then((r) => r.data);

export const getMessages = (session_id: string) =>
  api.get(`/chats/${session_id}/messages`).then((r) => r.data);

// --- Versions ---
export const listVersions = (project_id: string) =>
  api.get(`/versions/${project_id}`).then((r) => r.data);

export const getLatestVersion = (project_id: string) =>
  api.get(`/versions/${project_id}/latest`).then((r) => r.data);

export const getVersion = (project_id: string, version_id: string) =>
  api.get(`/versions/${project_id}/${version_id}`).then((r) => r.data);

export const restoreVersion = (project_id: string, version_id: string) =>
  api.post(`/versions/${project_id}/restore/${version_id}`).then((r) => r.data);

export default api;
