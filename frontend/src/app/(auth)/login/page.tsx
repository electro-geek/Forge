"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signInWithGoogle } from "@/lib/firebase";
import { verifyToken } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function LogoMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35" />
      <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.55" />
      <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.35" />
      <circle cx="14.5" cy="3" r="0.9" fill="#FF6B35" opacity="0.25" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const FEATURE_LINES = [
  { label: "Chat to Code", desc: "Natural language → Next.js components" },
  { label: "Your API Key", desc: "Bring your own Gemini key — zero subscriptions" },
  { label: "Live Preview", desc: "Sandpack renders your UI instantly" },
  { label: "Version History", desc: "Browse and restore any prior generation" },
];

export default function LoginPage() {
  const router = useRouter();
  const { dbUser, isLoading } = useAuth();
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    if (!isLoading && dbUser) {
      router.replace(dbUser.is_onboarded ? "/dashboard" : "/onboarding");
    }
  }, [dbUser, isLoading, router]);

  const handleGoogleSignIn = async () => {
    setSigning(true);
    try {
      const result = await signInWithGoogle();
      const token = await result.user.getIdToken();
      const data = await verifyToken(token);
      router.replace(data.user.is_onboarded ? "/dashboard" : "/onboarding");
    } catch {
      toast.error("Sign-in failed. Please try again.");
      setSigning(false);
    }
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#09090E" }}
      >
        <div
          className="w-6 h-6 border-2 rounded-full animate-spin"
          style={{ borderColor: "#1A1E2C", borderTopColor: "#FF6B35" }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#09090E" }}>

      {/* ── LEFT: editorial panel ── */}
      <div
        className="hidden lg:flex flex-col justify-between flex-1 p-12 border-r relative overflow-hidden"
        style={{ backgroundColor: "#0B0C12", borderColor: "#1A1E2C", maxWidth: "52%" }}
      >
        {/* Background dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(rgba(255,107,53,0.06) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Ambient bloom */}
        <div
          className="absolute pointer-events-none"
          aria-hidden="true"
          style={{
            top: "-10%",
            right: "-10%",
            width: "520px",
            height: "520px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,53,0.06) 0%, transparent 65%)",
          }}
        />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.18)" }}
          >
            <LogoMark size={16} />
          </div>
          <span className="font-mono font-bold text-[15px] tracking-tight" style={{ color: "#E8E5DF" }}>
            UIWiz
          </span>
        </div>

        {/* Middle: headline */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="text-[11px] font-mono tracking-widest uppercase mb-6"
            style={{ color: "#FF6B35" }}
          >
            AI UI Generator
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(38px, 4.5vw, 58px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "#E8E5DF",
              marginBottom: "28px",
            }}
          >
            Describe it.
            <br />
            <span style={{ color: "#FF6B35" }}>Ship it.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14 }}
            className="text-[14px] leading-relaxed mb-10"
            style={{ color: "#7A8495", maxWidth: "360px" }}
          >
            From a single prompt to production-ready Next.js code, rendered live — using your own Gemini API key.
          </motion.p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURE_LINES.map(({ label, desc }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3"
              >
                <div
                  className="w-5 h-5 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center"
                  style={{ borderColor: "rgba(255,107,53,0.25)", backgroundColor: "rgba(255,107,53,0.07)" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#FF6B35" }} />
                </div>
                <div>
                  <p className="text-[13px] font-medium" style={{ color: "#BCC3CF", fontFamily: "'Space Grotesk', sans-serif" }}>
                    {label}
                  </p>
                  <p className="text-[12px] font-mono mt-0.5" style={{ color: "#4A5268" }}>
                    {desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom: code chip */}
        <div className="relative z-10">
          <div
            className="inline-flex items-center gap-2.5 px-4 py-3 rounded-xl border"
            style={{ backgroundColor: "#09090E", borderColor: "#1A1E2C" }}
          >
            <div className="flex gap-1">
              {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
                <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <code className="text-[11px] font-mono" style={{ color: "#4A5268" }}>
              <span style={{ color: "#C4B5FD" }}>const</span>{" "}
              <span style={{ color: "#93C5FD" }}>ui</span>{" "}
              <span style={{ color: "#E8E5DF" }}>= await</span>{" "}
              <span style={{ color: "#6EE7B7" }}>uiwiz</span>
              <span style={{ color: "#E8E5DF" }}>(prompt)</span>
            </code>
          </div>
        </div>
      </div>

      {/* ── RIGHT: sign-in card ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.18)" }}
          >
            <LogoMark size={14} />
          </div>
          <span className="font-mono font-bold text-[14px]" style={{ color: "#E8E5DF" }}>UIWiz</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[340px]"
        >
          <div className="mb-8">
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "26px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                color: "#E8E5DF",
                marginBottom: "8px",
              }}
            >
              Welcome to UIWiz
            </h2>
            <p className="text-[13px] font-mono" style={{ color: "#4A5268" }}>
              Sign in to start building UI from prompts
            </p>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl border p-7"
            style={{ backgroundColor: "#0D0E15", borderColor: "#1A1E2C" }}
          >
            <button
              onClick={handleGoogleSignIn}
              disabled={signing}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-[13px] font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#141820",
                borderColor: "#232A3A",
                color: "#E8E5DF",
                fontFamily: "'Space Grotesk', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (!signing) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(255,107,53,0.35)";
                  el.style.backgroundColor = "#1A1E28";
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.borderColor = "#232A3A";
                el.style.backgroundColor = "#141820";
              }}
            >
              {signing ? (
                <div
                  className="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0"
                  style={{ borderColor: "#3A4255", borderTopColor: "#FF6B35" }}
                />
              ) : (
                <GoogleIcon />
              )}
              {signing ? "Signing in…" : "Continue with Google"}
            </button>

            <div
              className="flex items-center gap-3 my-5"
              style={{ color: "#2A2E3E" }}
            >
              <div className="flex-1 h-px" style={{ backgroundColor: "#1A1E2C" }} />
              <span className="text-[11px] font-mono">or</span>
              <div className="flex-1 h-px" style={{ backgroundColor: "#1A1E2C" }} />
            </div>

            <p className="text-[11.5px] font-mono text-center leading-relaxed" style={{ color: "#3E4455" }}>
              You&apos;ll need a Gemini API key to generate UI.
              <br />
              Keys are encrypted and stored securely.
            </p>
          </div>

          <p className="text-center text-[11px] font-mono mt-6" style={{ color: "#2A2E3E" }}>
            UIWiz © {new Date().getFullYear()} · Build without limits
          </p>
        </motion.div>
      </div>
    </div>
  );
}
