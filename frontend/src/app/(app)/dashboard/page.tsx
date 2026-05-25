"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, LogOut, Settings, Calendar, X } from "lucide-react";
import { listProjects, createProject, deleteProject } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import { signOutUser } from "@/lib/firebase";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

function CursorSparkMark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35"/>
      <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.55"/>
      <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.35"/>
      <circle cx="14.5" cy="3" r="0.9" fill="#FF6B35" opacity="0.25"/>
    </svg>
  );
}

function CodeThumbnail() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="4" y="10" width="4" height="4" rx="1" fill="#232A42"/>
      <rect x="4" y="20" width="4" height="4" rx="1" fill="#232A42"/>
      <rect x="4" y="30" width="4" height="4" rx="1" fill="#232A42"/>
      <rect x="4" y="40" width="4" height="4" rx="1" fill="#232A42"/>
      <rect x="4" y="50" width="4" height="4" rx="1" fill="#232A42"/>
      <rect x="4" y="60" width="4" height="4" rx="1" fill="#232A42"/>
      <rect x="12" y="10" width="18" height="4" rx="1.5" fill="#FF6B35" opacity="0.3"/>
      <rect x="34" y="10" width="32" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="70" y="10" width="20" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="16" y="20" width="28" height="4" rx="1.5" fill="#4D9CFF" opacity="0.25"/>
      <rect x="48" y="20" width="40" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="16" y="30" width="50" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="70" y="30" width="24" height="4" rx="1.5" fill="#FF6B35" opacity="0.18"/>
      <rect x="20" y="40" width="36" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="60" y="40" width="28" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="92" y="40" width="16" height="4" rx="1.5" fill="#22C55E" opacity="0.2"/>
      <rect x="20" y="50" width="60" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="16" y="60" width="22" height="4" rx="1.5" fill="#4D9CFF" opacity="0.2"/>
      <rect x="42" y="60" width="44" height="4" rx="1.5" fill="#1C2236"/>
      <rect x="88" y="50" width="2" height="5" rx="1" fill="#FF6B35" opacity="0.7"/>
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { dbUser, logout } = useAuthStore();
  const { projects, setProjects, setActiveProject } = useProjectStore();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProjects()
      .then(setProjects)
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const project = await createProject(newTitle.trim());
      setProjects([project, ...projects]);
      setActiveProject(project);
      router.push(`/project/${project.id}`);
    } catch {
      toast.error("Failed to create project");
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#080C14" }}>
      {/* ── Sidebar ── */}
      <aside
        className="w-60 flex flex-col flex-shrink-0 border-r"
        style={{ backgroundColor: "#0D1120", borderColor: "#1A2038" }}
      >
        {/* Brand */}
        <div className="px-5 py-4 border-b" style={{ borderColor: "#1A2038" }}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.18)" }}
            >
              <CursorSparkMark size={14} />
            </div>
            <span className="font-mono font-bold text-[15px]" style={{ color: "#E8ECF4" }}>UIWiz</span>
          </div>
        </div>

        {/* New project */}
        <div className="p-3.5">
          <button
            onClick={() => setShowNewForm(true)}
            disabled={creating}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-[12px] font-mono font-semibold text-white transition-all disabled:opacity-60"
            style={{ backgroundColor: "#FF6B35" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
          >
            {creating ? (
              <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            New Project
          </button>
        </div>

        {/* New project form */}
        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden px-3 pb-2"
            >
              <div
                className="rounded-xl border p-3 flex gap-2"
                style={{ backgroundColor: "#141828", borderColor: "rgba(255,107,53,0.3)" }}
              >
                <input
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setShowNewForm(false); setNewTitle(""); }
                  }}
                  placeholder="Project name…"
                  className="flex-1 bg-transparent text-[12px] font-mono focus:outline-none"
                  style={{ color: "#E8ECF4" }}
                />
                <button
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || creating}
                  className="text-[11px] font-mono font-semibold px-2.5 py-1.5 rounded-lg text-white disabled:opacity-40 transition-all"
                  style={{ backgroundColor: "#FF6B35" }}
                >
                  {creating ? "…" : "Create"}
                </button>
                <button
                  onClick={() => { setShowNewForm(false); setNewTitle(""); }}
                  aria-label="Cancel"
                  className="p-1 rounded-lg transition-colors"
                  style={{ color: "#4A5275" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#8892AA"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#4A5275"; }}
                >
                  <X size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent projects */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <p className="text-[9.5px] font-mono uppercase tracking-widest px-2 mb-2" style={{ color: "#4A5275" }}>
            Recent
          </p>
          {projects.slice(0, 12).map((p) => (
            <button
              key={p.id}
              onClick={() => { setActiveProject(p); router.push(`/project/${p.id}`); }}
              className="w-full text-left px-2.5 py-2 rounded-lg text-[11.5px] font-mono truncate block transition-all"
              style={{ color: "#8892AA" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "#141828";
                el.style.color = "#E8ECF4";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.backgroundColor = "transparent";
                el.style.color = "#8892AA";
              }}
            >
              {p.title}
            </button>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3.5 border-t" style={{ borderColor: "#1A2038" }}>
          {dbUser && (
            <div className="flex items-center gap-2.5 mb-3">
              {dbUser.avatar_url ? (
                <img
                  src={dbUser.avatar_url}
                  alt={dbUser.display_name ?? "avatar"}
                  className="w-7 h-7 rounded-full flex-shrink-0"
                  style={{ outline: "1.5px solid #232A42", outlineOffset: "1px" }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: "rgba(255,107,53,0.1)",
                    border: "1px solid rgba(255,107,53,0.2)",
                    color: "#FF6B35",
                  }}
                >
                  {dbUser.email?.[0]?.toUpperCase() ?? "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-mono font-medium truncate" style={{ color: "#E8ECF4" }}>
                  {dbUser.display_name ?? "User"}
                </p>
                <p className="text-[10px] font-mono truncate" style={{ color: "#4A5275" }}>{dbUser.email}</p>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/settings")}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10.5px] font-mono transition-all border"
              style={{ backgroundColor: "#141828", color: "#8892AA", borderColor: "#1A2038" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#E8ECF4"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8892AA"; }}
            >
              <Settings size={11} /> Settings
            </button>
            <button
              onClick={handleSignOut}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-[10.5px] font-mono transition-all border"
              style={{ backgroundColor: "#141828", color: "#8892AA", borderColor: "#1A2038" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#8892AA"; }}
            >
              <LogOut size={11} /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-mono font-bold text-xl" style={{ color: "#E8ECF4" }}>Projects</h1>
              <p className="text-[11px] font-mono mt-1" style={{ color: "#4A5275" }}>
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowNewForm(true)}
              disabled={creating}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono font-semibold text-[12px] text-white transition-all disabled:opacity-60"
              style={{ backgroundColor: "#FF6B35" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
            >
              <Plus size={13} />
              New Project
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 rounded-xl border shimmer" style={{ borderColor: "#1A2038" }} />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-24">
              <div
                className="w-14 h-14 rounded-xl border flex items-center justify-center mx-auto mb-5"
                style={{ backgroundColor: "rgba(255,107,53,0.07)", borderColor: "rgba(255,107,53,0.15)" }}
              >
                <CursorSparkMark size={24} />
              </div>
              <h2 className="font-mono font-semibold text-base mb-2" style={{ color: "#E8ECF4" }}>
                No projects yet
              </h2>
              <p className="text-[12px] font-mono mb-6" style={{ color: "#4A5275" }}>
                Describe a UI and get working Next.js code in seconds.
              </p>
              <button
                onClick={() => setShowNewForm(true)}
                className="px-6 py-2.5 rounded-xl font-mono font-semibold text-[13px] text-white transition-all"
                style={{ backgroundColor: "#FF6B35" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
              >
                Create First Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.2), type: "spring", duration: 0.3, bounce: 0 }}
                  onClick={() => { setActiveProject(p); router.push(`/project/${p.id}`); }}
                  className="group cursor-pointer rounded-xl border transition-all duration-150 overflow-hidden"
                  style={{ backgroundColor: "#0D1120", borderColor: "#1A2038" }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "#232A42";
                    el.style.backgroundColor = "#141828";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "#1A2038";
                    el.style.backgroundColor = "#0D1120";
                  }}
                >
                  {/* Code thumbnail */}
                  <div
                    className="h-[84px] border-b relative overflow-hidden"
                    style={{ backgroundColor: "#080C14", borderColor: "#1A2038" }}
                  >
                    <div className="absolute inset-0 p-3">
                      <CodeThumbnail />
                    </div>
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      style={{ backgroundColor: "rgba(255,107,53,0.04)" }}
                    >
                      <span className="text-[10px] font-mono" style={{ color: "rgba(255,107,53,0.55)" }}>
                        Open →
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <h3
                        className="font-mono font-semibold text-[12.5px] truncate flex-1 leading-tight"
                        style={{ color: "#E8ECF4" }}
                      >
                        {p.title}
                      </h3>
                      {p.current_version_number > 0 && (
                        <span
                          className="text-[9.5px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                          style={{
                            color: "#FF6B35",
                            backgroundColor: "rgba(255,107,53,0.1)",
                            border: "1px solid rgba(255,107,53,0.18)",
                          }}
                        >
                          v{p.current_version_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: "#4A5275" }}>
                        <Calendar size={9} />
                        {formatDate(p.updated_at)}
                      </span>
                      <button
                        onClick={(e) => handleDelete(p.id, e)}
                        disabled={deletingId === p.id}
                        aria-label={`Delete project ${p.title}`}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded transition-all"
                        style={{ color: "#4A5275" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#4A5275"; }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
