"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, ExternalLink, ShieldCheck } from "lucide-react";
import { saveGeminiKey } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

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

export default function OnboardingPage() {
  const router = useRouter();
  const { setDbUser, dbUser } = useAuthStore();
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!apiKey.trim()) { toast.error("Please enter your Gemini API key"); return; }
    if (!apiKey.startsWith("AI")) { toast.error("Gemini API keys typically start with 'AI'"); return; }
    setLoading(true);
    try {
      await saveGeminiKey(apiKey.trim());
      if (dbUser) setDbUser({ ...dbUser, is_onboarded: true });
      toast.success("API key saved!");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "#080C14" }}
    >
      {/* Background */}
      <div className="absolute inset-0 dot-grid opacity-40 pointer-events-none" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 65% 65% at 50% 40%, transparent 15%, #080C14 80%)" }}
      />
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[240px] rounded-full blur-[80px] pointer-events-none"
        style={{ backgroundColor: "rgba(255,107,53,0.05)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[360px] space-y-3"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.18)" }}
            >
              <CursorSparkMark size={16} />
            </div>
            <span className="font-mono font-bold text-base" style={{ color: "#E8ECF4" }}>UIWiz</span>
          </div>

          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4"
            style={{ backgroundColor: "#141828", border: "1px solid #232A42" }}
          >
            <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ backgroundColor: "#FF6B35" }} />
            <span className="text-[10px] font-mono" style={{ color: "#8892AA" }}>One-time setup</span>
          </div>

          <h1 className="font-mono font-bold text-xl mb-2" style={{ color: "#E8ECF4" }}>
            Connect Gemini API
          </h1>
          <p className="text-[12px] font-mono leading-relaxed" style={{ color: "#4A5275" }}>
            UIWiz uses your own API key to generate UI.
            <br />Your key is encrypted and never shared.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6 space-y-5"
          style={{ backgroundColor: "#0D1120", borderColor: "#232A42" }}
        >
          <div className="space-y-2">
            <label
              htmlFor="gemini-key"
              className="text-[10px] font-mono uppercase tracking-widest block"
              style={{ color: "#4A5275" }}
            >
              Gemini API Key
            </label>
            <div className="relative">
              <input
                id="gemini-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="AIza…"
                className="w-full px-4 py-3 rounded-xl border text-[13px] font-mono transition-all focus:outline-none pr-11"
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
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-mono transition-opacity"
              style={{ color: "#FF6B35" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = "0.75"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <ExternalLink size={10} />
              Get a free key from Google AI Studio
            </a>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !apiKey.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-mono text-[13px] font-semibold text-white transition-all disabled:opacity-35"
            style={{ backgroundColor: "#FF6B35" }}
            onMouseEnter={e => {
              if (!loading && apiKey.trim()) (e.currentTarget as HTMLElement).style.filter = "brightness(1.08)";
            }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                Continue to UIWiz
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

        {/* Security note */}
        <div
          className="rounded-xl border p-3.5 flex items-start gap-3"
          style={{ backgroundColor: "rgba(34,197,94,0.04)", borderColor: "rgba(34,197,94,0.14)" }}
        >
          <ShieldCheck size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#22C55E" }} />
          <p className="text-[10.5px] font-mono leading-relaxed" style={{ color: "#4A5275" }}>
            AES-256 encrypted · decrypted in memory only · never logged
          </p>
        </div>
      </motion.div>
    </div>
  );
}
