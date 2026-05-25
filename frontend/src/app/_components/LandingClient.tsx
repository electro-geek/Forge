"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

// ─── Brand mark ──────────────────────────────────────────────────────────────
function LogoMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35" />
      <circle cx="16.5" cy="5" r="1.8" fill="#FF6B35" opacity="0.55" />
      <circle cx="18" cy="9.5" r="1.1" fill="#FF6B35" opacity="0.35" />
      <circle cx="14.5" cy="3" r="0.9" fill="#FF6B35" opacity="0.25" />
    </svg>
  );
}

// ─── Animated terminal demo ───────────────────────────────────────────────────
const PROMPT = "Build me a pricing page with a monthly/yearly toggle";

const CODE_LINES = [
  { t: '"use client"', c: "#6EE7B7" },
  { t: 'import { useState } from "react"', c: "#93C5FD" },
  { t: "", c: "" },
  { t: "type Plan = {", c: "#C4B5FD" },
  { t: "  name: string", c: "#C8D0E0" },
  { t: "  monthly: number", c: "#C8D0E0" },
  { t: "  yearly: number", c: "#C8D0E0" },
  { t: "}", c: "#C8D0E0" },
  { t: "", c: "" },
  { t: "const plans: Plan[] = [", c: "#C4B5FD" },
  { t: '  { name: "Starter", monthly: 9, yearly: 7 },', c: "#C8D0E0" },
  { t: '  { name: "Pro", monthly: 29, yearly: 24 },', c: "#C8D0E0" },
  { t: "]", c: "#C8D0E0" },
  { t: "", c: "" },
  { t: "export default function PricingPage() {", c: "#C4B5FD" },
  { t: "  const [yearly, setYearly] = useState(false)", c: "#C8D0E0" },
  { t: "  return (", c: "#C8D0E0" },
  { t: '    <section className="pricing">', c: "#FF8C6B" },
  { t: "      <Toggle value={yearly} onChange={setYearly} />", c: "#FF8C6B" },
  { t: "      <PricingCards plans={plans} yearly={yearly} />", c: "#FF8C6B" },
  { t: "    </section>", c: "#FF8C6B" },
  { t: "  )", c: "#C8D0E0" },
  { t: "}", c: "#C8D0E0" },
];

type Phase = "typing" | "generating" | "code" | "pause";

function TerminalDemo() {
  const [phase, setPhase] = useState<Phase>("typing");
  const [typed, setTyped] = useState("");
  const [lines, setLines] = useState(0);

  useEffect(() => {
    let id: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (typed.length < PROMPT.length) {
        id = setTimeout(() => setTyped(PROMPT.slice(0, typed.length + 1)), 42);
      } else {
        id = setTimeout(() => setPhase("generating"), 600);
      }
    } else if (phase === "generating") {
      id = setTimeout(() => setPhase("code"), 1300);
    } else if (phase === "code") {
      if (lines < CODE_LINES.length) {
        id = setTimeout(() => setLines((l) => l + 1), 72);
      } else {
        id = setTimeout(() => setPhase("pause"), 2800);
      }
    } else {
      id = setTimeout(() => { setPhase("typing"); setTyped(""); setLines(0); }, 1200);
    }
    return () => clearTimeout(id);
  }, [phase, typed, lines]);

  return (
    <div
      className="w-full rounded-2xl overflow-hidden border shadow-2xl"
      style={{ backgroundColor: "#080B12", borderColor: "#1A2030" }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b"
        style={{ backgroundColor: "#0D1018", borderColor: "#1A2030" }}
      >
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex gap-1 ml-1">
          {["chat", "preview", "code"].map((tab, i) => (
            <span
              key={tab}
              className="px-2.5 py-1 rounded text-[11px] font-mono"
              style={{
                backgroundColor: i === 0 ? "#141C2A" : "transparent",
                color: i === 0 ? "#FF6B35" : "#3A4255",
              }}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 min-h-[300px] space-y-4" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        {/* User bubble */}
        <div className="flex gap-3 items-start">
          <div
            className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-bold"
            style={{ background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)", color: "#FF6B35" }}
          >
            U
          </div>
          <p className="text-[12px] leading-relaxed" style={{ color: "#BEC6D8" }}>
            {typed}
            {phase === "typing" && (
              <span
                className="inline-block w-[2px] h-[14px] ml-[1px] align-middle cursor-blink"
                style={{ backgroundColor: "#FF6B35" }}
              />
            )}
          </p>
        </div>

        {/* AI response */}
        {phase !== "typing" && (
          <div className="flex gap-3 items-start">
            <div
              className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center"
              style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.18)" }}
            >
              <LogoMark size={10} />
            </div>
            <div className="flex-1 min-w-0">
              {phase === "generating" && (
                <div className="flex items-center gap-1.5 py-0.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: "#FF6B35",
                        animation: `pulse_dot 1.4s ease-in-out ${i * 0.2}s infinite both`,
                      }}
                    />
                  ))}
                </div>
              )}
              {(phase === "code" || phase === "pause") && (
                <pre className="text-[11px] leading-[1.72] overflow-hidden">
                  {CODE_LINES.slice(0, lines).map((line, idx) => (
                    <div key={idx} style={{ color: line.c || "transparent", minHeight: "1.72em" }}>
                      {line.t || " "}
                    </div>
                  ))}
                  {phase === "code" && lines < CODE_LINES.length && (
                    <span
                      className="inline-block w-[2px] h-[13px] align-middle cursor-blink"
                      style={{ backgroundColor: "#FF6B35" }}
                    />
                  )}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    num: "01",
    title: "Chat to Code",
    desc: "Describe any UI in plain English. UIWiz translates your vision into working Next.js components, instantly.",
    tag: "Natural language → production code",
  },
  {
    num: "02",
    title: "Your Gemini Key",
    desc: "No subscriptions, no credits. Bring your own Gemini API key — usage goes directly to your Google account.",
    tag: "Zero cost, full control",
  },
  {
    num: "03",
    title: "Live Sandpack Preview",
    desc: "Sandpack renders your UI live the moment code is generated. Toggle between preview and source anytime.",
    tag: "Instant visual feedback",
  },
];

const STEPS = [
  { num: "1", title: "Describe", desc: "Type any UI description in plain English" },
  { num: "2", title: "Generate", desc: "Gemini builds production-ready Next.js code" },
  { num: "3", title: "Preview", desc: "Sandpack renders your UI live, instantly" },
  { num: "4", title: "Ship", desc: "Copy your code and deploy it anywhere" },
];

const MARQUEE_ITEMS = [
  "Next.js 14", "TypeScript", "Tailwind CSS", "Gemini AI", "Sandpack",
  "React 18", "shadcn/ui", "Vercel", "Framer Motion", "App Router",
];

// ─── Main component ───────────────────────────────────────────────────────────
export default function LandingClient() {
  const { dbUser, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && dbUser) router.push("/dashboard");
  }, [dbUser, isLoading, router]);

  return (
    <div style={{ backgroundColor: "#09090E", color: "#E8E5DF", minHeight: "100vh" }}>

      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 border-b backdrop-blur-md"
        style={{ backgroundColor: "rgba(9,9,14,0.88)", borderColor: "#1A1E2C" }}
        aria-label="Main navigation"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.18)" }}
          >
            <LogoMark size={14} />
          </div>
          <span className="font-mono font-bold text-[15px] tracking-tight" style={{ color: "#E8E5DF" }}>UIWiz</span>
        </Link>

        <Link
          href="/login"
          className="group flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-200"
          style={{ color: "#7E8899" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#FF6B35"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#7E8899"; }}
        >
          Sign in
          <ArrowUpRight
            size={13}
            className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            aria-hidden="true"
          />
        </Link>
      </nav>

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ paddingTop: "88px", paddingBottom: "96px" }}
        aria-labelledby="hero-heading"
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: "radial-gradient(rgba(255,107,53,0.07) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        {/* Radial bloom */}
        <div
          className="absolute pointer-events-none"
          aria-hidden="true"
          style={{
            top: "-15%",
            right: "-8%",
            width: "640px",
            height: "640px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,53,0.07) 0%, transparent 68%)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          aria-hidden="true"
          style={{
            bottom: "-20%",
            left: "-5%",
            width: "480px",
            height: "480px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,107,53,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 flex flex-col lg:flex-row items-start gap-14 lg:gap-20">
          {/* ── LEFT: text ── */}
          <div className="flex-1 max-w-[560px] pt-2">
            {/* Headline */}
            <motion.h1
              id="hero-heading"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(52px, 7.5vw, 88px)",
                fontWeight: 700,
                lineHeight: 1.0,
                letterSpacing: "-0.04em",
                color: "#E8E5DF",
                marginBottom: "22px",
              }}
            >
              Turn words
              <br />
              <span style={{ color: "#FF6B35" }}>into UI</span>
              <br />
              instantly.
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.13, ease: [0.16, 1, 0.3, 1] }}
              style={{ color: "#7A8495", fontSize: "16px", lineHeight: 1.7, marginBottom: "36px", maxWidth: "440px" }}
            >
              Describe the interface you want. UIWiz generates production-ready Next.js code and renders it live — using your own Gemini API key. No credits, no limits.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center flex-wrap gap-4"
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[14px] text-white transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: "#FF6B35" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
              >
                Start Building Free
                <ArrowRight
                  size={15}
                  className="group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </Link>
              <span className="text-[12px] font-mono" style={{ color: "#3E4455" }}>
                No card required
              </span>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.34 }}
              className="flex items-center gap-8 mt-12 pt-8 border-t"
              style={{ borderColor: "#1A1E2C" }}
            >
              {[
                { val: "< 5s", label: "to first render" },
                { val: "100%", label: "code ownership" },
                { val: "0", label: "subscriptions" },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div
                    className="font-mono font-bold text-xl"
                    style={{ fontFamily: "'Space Grotesk', sans-serif", color: "#E8E5DF", letterSpacing: "-0.02em" }}
                  >
                    {val}
                  </div>
                  <div className="text-[11px] font-mono mt-0.5" style={{ color: "#3E4455" }}>
                    {label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── RIGHT: terminal ── */}
          <motion.div
            initial={{ opacity: 0, x: 28, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full lg:max-w-[530px]"
          >
            <TerminalDemo />
            <div className="flex items-center gap-2 mt-3 px-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" style={{ animation: "status-pulse 2.5s ease-in-out infinite" }} />
              <span className="text-[11px] font-mono" style={{ color: "#3E4455" }}>
                Sandpack preview · Version history · One-click restore
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div
        className="border-y overflow-hidden relative"
        style={{ borderColor: "#1A1E2C", backgroundColor: "#0C0D12", paddingBlock: "14px" }}
        aria-hidden="true"
      >
        <div
          className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to right, #0C0D12, transparent)" }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
          style={{ background: "linear-gradient(to left, #0C0D12, transparent)" }}
        />
        <div
          className="marquee-track flex gap-10 whitespace-nowrap"
          style={{ willChange: "transform" }}
        >
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-3 text-[11.5px] font-mono tracking-widest uppercase"
              style={{ color: "#3E4455" }}
            >
              <span style={{ color: "#FF6B35", opacity: 0.5 }}>✦</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section
        className="max-w-7xl mx-auto px-6 md:px-10 py-28"
        aria-labelledby="features-heading"
      >
        <Reveal>
          <div className="mb-16">
            <p className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: "#FF6B35" }}>
              Why UIWiz
            </p>
            <h2
              id="features-heading"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(34px, 4.5vw, 54px)",
                fontWeight: 700,
                letterSpacing: "-0.028em",
                lineHeight: 1.1,
                color: "#E8E5DF",
                maxWidth: "520px",
              }}
            >
              The better way
              <br />
              to build UI fast.
            </h2>
          </div>
        </Reveal>

        {/* Feature grid with separator lines */}
        <div
          className="grid grid-cols-1 md:grid-cols-3"
          style={{ border: "1px solid #1A1E2C" }}
        >
          {FEATURES.map(({ num, title, desc, tag }, i) => (
            <Reveal key={num} delay={i * 0.08}>
              <div
                className="p-8 h-full transition-colors duration-200 group"
                style={{
                  borderRight: i < 2 ? "1px solid #1A1E2C" : "none",
                  backgroundColor: "#09090E",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#0D0E15"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#09090E"; }}
              >
                {/* Number */}
                <div
                  className="text-[11px] font-mono tracking-widest mb-7"
                  style={{ color: "#FF6B35", opacity: 0.55 }}
                >
                  {num}
                </div>

                {/* Title */}
                <h3
                  className="mb-3"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: "21px",
                    fontWeight: 600,
                    letterSpacing: "-0.02em",
                    color: "#E8E5DF",
                  }}
                >
                  {title}
                </h3>

                {/* Desc */}
                <p
                  className="text-[14px] leading-relaxed mb-7"
                  style={{ color: "#7A8495" }}
                >
                  {desc}
                </p>

                {/* Tag */}
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono"
                  style={{ borderColor: "#1A1E2C", color: "#3E4455" }}
                >
                  <span
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: "#FF6B35" }}
                  />
                  {tag}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        className="border-t py-28"
        style={{ borderColor: "#1A1E2C", backgroundColor: "#0B0C12" }}
        aria-labelledby="workflow-heading"
      >
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <Reveal>
            <div className="mb-16">
              <p className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: "#FF6B35" }}>
                The workflow
              </p>
              <h2
                id="workflow-heading"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "clamp(34px, 4.5vw, 54px)",
                  fontWeight: 700,
                  letterSpacing: "-0.028em",
                  lineHeight: 1.1,
                  color: "#E8E5DF",
                }}
              >
                Prompt to preview
                <br />
                in seconds.
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 border border-[#1A1E2C]">
            {STEPS.map(({ num, title, desc }, i) => (
              <Reveal key={num} delay={i * 0.07}>
                <div
                  className="p-7 h-full transition-colors duration-200"
                  style={{
                    borderRight: i < STEPS.length - 1 ? "1px solid #1A1E2C" : "none",
                    backgroundColor: "#0B0C12",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#0F1018"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#0B0C12"; }}
                >
                  {/* Step number circle */}
                  <div
                    className="w-9 h-9 rounded-full border flex items-center justify-center text-[13px] font-mono font-semibold mb-6"
                    style={{
                      borderColor: "rgba(255,107,53,0.25)",
                      backgroundColor: "rgba(255,107,53,0.07)",
                      color: "#FF6B35",
                    }}
                  >
                    {num}
                  </div>

                  <h3
                    className="mb-2 font-semibold"
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "17px",
                      letterSpacing: "-0.015em",
                      color: "#E8E5DF",
                    }}
                  >
                    {title}
                  </h3>
                  <p className="text-[13px] leading-relaxed" style={{ color: "#7A8495" }}>
                    {desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section
        className="py-36 border-t"
        style={{ borderColor: "#1A1E2C" }}
        aria-labelledby="cta-heading"
      >
        <div className="max-w-3xl mx-auto px-6 md:px-10 text-center">
          <Reveal>
            <p className="text-[11px] font-mono tracking-widest uppercase mb-7" style={{ color: "#FF6B35" }}>
              Get started today
            </p>
            <h2
              id="cta-heading"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "clamp(40px, 6vw, 72px)",
                fontWeight: 700,
                letterSpacing: "-0.04em",
                lineHeight: 1.0,
                color: "#E8E5DF",
                marginBottom: "20px",
              }}
            >
              Ready to build
              <br />
              your first UI?
            </h2>
            <p className="text-[15px] mb-10 leading-relaxed" style={{ color: "#7A8495" }}>
              No subscriptions. No credits. Just your Gemini API key and your ideas.
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-[15px] text-white transition-all duration-200 active:scale-[0.98]"
              style={{ backgroundColor: "#FF6B35" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.filter = "brightness(1.1)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.filter = "none"; }}
            >
              Start Building Free
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
                aria-hidden="true"
              />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        className="border-t py-7 px-6 md:px-10"
        style={{ borderColor: "#1A1E2C", backgroundColor: "#09090E" }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LogoMark size={12} />
            <span className="font-mono text-[12px]" style={{ color: "#3E4455" }}>UIWiz</span>
          </div>
          <p className="text-[11px] font-mono" style={{ color: "#3E4455" }}>
            © {new Date().getFullYear()} · Build without limits
          </p>
        </div>
      </footer>
    </div>
  );
}
