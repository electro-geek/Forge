"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Save, Trash2, LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import { saveGeminiKey, deleteGeminiKey } from "@/lib/api";
import { signOutUser } from "@/lib/firebase";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

function CursorSparkMark({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35"/>
      <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.55"/>
      <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.35"/>
      <circle cx="14.5" cy="3" r="0.9" fill="#FF6B35" opacity="0.25"/>
    </svg>
  );
}

type SectionProps = { children: React.ReactNode; delay?: number };
const Section = ({ children, delay = 0 }: SectionProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", duration: 0.3, bounce: 0 }}
    className="rounded-xl border overflow-hidden"
    style={{ backgroundColor: "#0D1120", borderColor: "#1A2038" }}
  >
    {children}
  </motion.div>
);

export default function SettingsPage() {
  const router = useRouter();
  const { dbUser, setDbUser, logout } = useAuthStore();
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [deletingKey, setDeletingKey] = useState(false);

  const handleSaveKey = async () => {
    if (!newKey.trim()) return;
    setSavingKey(true);
    try {
      await saveGeminiKey(newKey.trim());
      if (dbUser) setDbUser({ ...dbUser, is_onboarded: true });
      setNewKey("");
      toast.success("API key updated");
    } catch { toast.error("Failed to update key"); }
    finally { setSavingKey(false); }
  };

  const handleDeleteKey = async () => {
    setDeletingKey(true);
    try {
      await deleteGeminiKey();
      if (dbUser) setDbUser({ ...dbUser, is_onboarded: false });
      toast.success("API key removed");
    } catch { toast.error("Failed to delete key"); }
    finally { setDeletingKey(false); }
  };

  const handleSignOut = async () => {
    await signOutUser();
    logout();
    router.replace("/");
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#080C14" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 h-12 px-5 flex items-center gap-3 border-b"
        style={{
          backgroundColor: "rgba(8,12,20,0.92)",
          borderColor: "#1A2038",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[11px] font-mono px-2 py-1.5 rounded-lg transition-colors"
          style={{ color: "#4A5275" }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#8892AA"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#4A5275"; }}
        >
          <ArrowLeft size={11} />
          Back
        </button>
        <div className="w-px h-3.5" style={{ backgroundColor: "#1A2038" }} />
        <div className="flex items-center gap-2">
          <CursorSparkMark size={12} />
          <span className="font-mono font-semibold text-[13px]" style={{ color: "#E8ECF4" }}>Settings</span>
        </div>
      </header>

      <main className="max-w-[480px] mx-auto px-5 py-10 space-y-3">
        {/* Account */}
        <Section delay={0}>
          <div className="px-5 py-3.5 border-b" style={{ borderColor: "#1A2038" }}>
            <p className="text-[9.5px] font-mono uppercase tracking-widest" style={{ color: "#4A5275" }}>Account</p>
          </div>
          <div className="px-5 py-4 flex items-center gap-4">
            {dbUser?.avatar_url ? (
              <img
                src={dbUser.avatar_url}
                alt={dbUser.display_name ?? "avatar"}
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ outline: "2px solid #232A42", outlineOffset: "2px" }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-mono font-bold text-sm"
                style={{
                  backgroundColor: "rgba(255,107,53,0.1)",
                  border: "1px solid rgba(255,107,53,0.2)",
                  color: "#FF6B35",
                }}
              >
                {dbUser?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <div>
              <p className="font-mono font-semibold text-[13px]" style={{ color: "#E8ECF4" }}>
                {dbUser?.display_name ?? "User"}
              </p>
              <p className="font-mono text-[11px] mt-0.5" style={{ color: "#4A5275" }}>{dbUser?.email}</p>
            </div>
          </div>
        </Section>

        {/* API Key */}
        <Section delay={0.06}>
          <div className="px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "#1A2038" }}>
            <p className="text-[9.5px] font-mono uppercase tracking-widest" style={{ color: "#4A5275" }}>
              Gemini API Key
            </p>
            {dbUser?.is_onboarded && (
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={10} style={{ color: "#22C55E" }} />
                <span className="text-[9.5px] font-mono" style={{ color: "#22C55E" }}>Key saved</span>
              </div>
            )}
          </div>
          <div className="px-5 py-4 space-y-4">
            <p className="text-[11.5px] font-mono" style={{ color: "#4A5275" }}>
              {dbUser?.is_onboarded
                ? "A key is stored. Enter a new one to replace it."
                : "No key saved. Add one to start generating."}
            </p>

            <div className="space-y-2.5">
              <div className="relative">
                <input
                  id="api-key"
                  type={showKey ? "text" : "password"}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveKey()}
                  placeholder="AIza…"
                  className="w-full px-4 py-3 rounded-xl border text-[12.5px] font-mono focus:outline-none pr-11 transition-all"
                  style={{ backgroundColor: "#141828", borderColor: "#232A42", color: "#E8ECF4" }}
                  onFocus={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,107,53,0.4)"; }}
                  onBlur={e => { (e.currentTarget as HTMLElement).style.borderColor = "#232A42"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                  style={{ color: "#4A5275" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#8892AA"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#4A5275"; }}
                >
                  {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={handleSaveKey}
                  disabled={!newKey.trim() || savingKey}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12px] font-mono font-semibold text-white disabled:opacity-35 transition-all"
                  style={{ backgroundColor: "#FF6B35" }}
                  onMouseEnter={e => {
                    if (!savingKey && newKey.trim()) (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)";
                  }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
                >
                  <Save size={12} />
                  {savingKey ? "Saving…" : "Save Key"}
                </button>

                {dbUser?.is_onboarded && (
                  <button
                    onClick={handleDeleteKey}
                    disabled={deletingKey}
                    className="flex items-center gap-1.5 border px-4 py-2.5 rounded-xl text-[12px] font-mono transition-all disabled:opacity-35"
                    style={{ borderColor: "rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.6)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#f87171"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(239,68,68,0.6)"; }}
                  >
                    <Trash2 size={12} />
                    {deletingKey ? "Removing…" : "Remove"}
                  </button>
                )}

                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-[10.5px] font-mono transition-colors"
                  style={{ color: "#4A5275" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#8892AA"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#4A5275"; }}
                >
                  <ExternalLink size={9} />
                  AI Studio
                </a>
              </div>
            </div>

            <p className="text-[10.5px] font-mono" style={{ color: "#232A42" }}>
              AES-256 encrypted · decrypted in memory only · never logged
            </p>
          </div>
        </Section>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, type: "spring", duration: 0.3, bounce: 0 }}
          className="rounded-xl border overflow-hidden"
          style={{ backgroundColor: "rgba(239,68,68,0.02)", borderColor: "rgba(239,68,68,0.1)" }}
        >
          <div className="px-5 py-3.5 border-b" style={{ borderColor: "rgba(239,68,68,0.1)" }}>
            <p className="text-[9.5px] font-mono uppercase tracking-widest" style={{ color: "rgba(239,68,68,0.45)" }}>
              Danger Zone
            </p>
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-mono font-medium text-[13px]" style={{ color: "#E8ECF4" }}>Sign out</p>
              <p className="text-[11px] font-mono mt-0.5" style={{ color: "#4A5275" }}>
                Sign out of your account on this device
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 border px-4 py-2 rounded-xl text-[12px] font-mono transition-all"
              style={{ borderColor: "rgba(239,68,68,0.2)", color: "rgba(239,68,68,0.6)" }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "#f87171";
                el.style.borderColor = "rgba(239,68,68,0.4)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "rgba(239,68,68,0.6)";
                el.style.borderColor = "rgba(239,68,68,0.2)";
              }}
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
