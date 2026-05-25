import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getFileLanguage(path: string): string {
  const ext = path.split(".").pop() || "";
  const map: Record<string, string> = {
    tsx: "TypeScript React",
    ts: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript React",
    css: "CSS",
    json: "JSON",
    md: "Markdown",
    html: "HTML",
  };
  return map[ext] || ext.toUpperCase();
}

export function getFileIcon(path: string): string {
  const ext = path.split(".").pop() || "";
  const icons: Record<string, string> = {
    tsx: "⚛️",
    ts: "🔷",
    js: "🟨",
    jsx: "⚛️",
    css: "🎨",
    json: "📋",
    md: "📝",
    html: "🌐",
  };
  return icons[ext] || "📄";
}
