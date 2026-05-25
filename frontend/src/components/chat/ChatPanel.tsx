"use client";
import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Send } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import ChatMessage from "./ChatMessage";

interface ChatPanelProps {
  sessionId: string;
}

function CursorIdleMark() {
  return (
    <svg
      width="52"
      height="52"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-float"
    >
      <path
        d="M7 7L7 37L16 28L21.5 42L28.5 39L23 25L35 25L7 7Z"
        fill="#FF6B35"
        opacity="0.85"
      />
      <circle cx="39" cy="14" r="3.5" fill="#FF6B35" opacity="0.5" />
      <circle cx="44" cy="23" r="2.2" fill="#FF6B35" opacity="0.3" />
      <circle cx="43" cy="8" r="1.6" fill="#FF6B35" opacity="0.2" />
      <circle cx="37" cy="32" r="1.2" fill="#4D9CFF" opacity="0.35" />
    </svg>
  );
}

const STARTERS = [
  { label: "SaaS landing page", sub: "Hero, features & pricing", delay: 0 },
  { label: "Dashboard UI", sub: "Charts, KPIs & tables", delay: 60 },
  { label: "Portfolio site", sub: "Dark theme + animations", delay: 120 },
  { label: "Auth screens", sub: "Login & register flows", delay: 180 },
];

const SKILLS = [
  {
    id: "uiux_pro_max",
    label: "UI/UX Pro Max",
    badge: "Structured",
    desc: "Accessible · Polished · Production-ready",
    accent: "#4D9CFF",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    id: "frontend_design",
    label: "Frontend Design",
    badge: "Creative",
    desc: "Bold · Distinctive · Unforgettable",
    accent: "#FF6B35",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
      </svg>
    ),
  },
] as const;

type SkillId = typeof SKILLS[number]["id"];

export default function ChatPanel({ sessionId }: ChatPanelProps) {
  const { messages, isGenerating, streamingStatus } = useChatStore();
  const { sendPrompt } = useWebSocket();
  const [input, setInput] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<SkillId>("uiux_pro_max");
  const [skillOpen, setSkillOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isGenerating]);

  const handleSend = () => {
    const prompt = input.trim();
    if (!prompt || isGenerating) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    sendPrompt(sessionId, prompt, selectedSkill);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const isEmpty = messages.length === 0 && !isGenerating;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#0D1120", borderRight: "1px solid #1A2038" }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between border-b flex-shrink-0"
        style={{ borderColor: "#1A2038" }}
      >
        <div>
          <h2 className="font-syne font-semibold text-[12.5px] tracking-wide" style={{ color: "#E8ECF4" }}>
            Prompt
          </h2>
          <p className="text-[10.5px] font-mono mt-0.5" style={{ color: "#4A5275" }}>
            describe → generate → preview
          </p>
        </div>
        {messages.length > 0 && (
          <span
            className="text-[9.5px] font-mono px-2 py-1 rounded"
            style={{ color: "#4A5275", backgroundColor: "#141828", border: "1px solid #1A2038" }}
          >
            {messages.filter(m => m.role !== "system").length} msgs
          </span>
        )}
      </div>

      {/* Messages / Empty state */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div
            className="dot-grid h-full flex flex-col items-center justify-center px-5 text-center"
          >
            {/* Radial fade overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse 60% 50% at 50% 50%, transparent 30%, #0D1120 100%)",
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-5">
              <CursorIdleMark />

              <div className="space-y-1">
                <p className="font-syne font-bold text-[15px] leading-tight" style={{ color: "#E8ECF4" }}>
                  What will you build?
                </p>
                <p className="text-[11px] font-mono" style={{ color: "#4A5275" }}>
                  Describe a UI · Get working Next.js code
                </p>
              </div>

              {/* 2×2 starter grid */}
              <div className="grid grid-cols-2 gap-2 w-full">
                {STARTERS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(s.label);
                      textareaRef.current?.focus();
                    }}
                    className="fade-slide-up text-left rounded-xl border px-3 py-2.5 transition-all group"
                    style={{
                      backgroundColor: "#141828",
                      borderColor: "#1A2038",
                      animationDelay: `${s.delay}ms`,
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(255,107,53,0.3)";
                      el.style.backgroundColor = "#1C2236";
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "#1A2038";
                      el.style.backgroundColor = "#141828";
                    }}
                  >
                    <p className="text-[11px] font-syne font-semibold leading-tight" style={{ color: "#E8ECF4" }}>
                      {s.label}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: "#4A5275" }}>
                      {s.sub}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Generating indicator */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 6, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -4, filter: "blur(4px)" }}
                  transition={{ type: "spring", duration: 0.3, bounce: 0 }}
                  className="flex items-start gap-2.5"
                >
                  {/* Mini cursor mark avatar */}
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.15)" }}
                  >
                    <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                      <path d="M3.5 3.5L3.5 15L8 10.5L10.5 17L13.5 15.8L11 9.5L16 9.5L3.5 3.5Z" fill="#FF6B35"/>
                    </svg>
                  </div>

                  <div
                    className="px-3.5 py-2.5 rounded-lg rounded-tl-none"
                    style={{ backgroundColor: "#141828", border: "1px solid #232A42" }}
                  >
                    {streamingStatus ? (
                      <p className="text-[11px] font-mono" style={{ color: "#4A5275" }}>
                        {streamingStatus}
                      </p>
                    ) : (
                      <div className="flex gap-1 items-center h-3.5">
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex-shrink-0" style={{ borderColor: "#1A2038" }}>
        {/* Skill selector dropdown */}
        {(() => {
          const active = SKILLS.find(s => s.id === selectedSkill)!;
          return (
            <div className="relative mb-2">
              <button
                onClick={() => setSkillOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all text-left"
                style={{
                  backgroundColor: "#141828",
                  borderColor: skillOpen ? active.accent + "60" : "#232A42",
                  boxShadow: skillOpen ? `0 0 0 1px ${active.accent}30` : "none",
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span style={{ color: active.accent }}>{active.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11.5px] font-semibold font-mono truncate" style={{ color: "#E8ECF4" }}>
                        {active.label}
                      </span>
                      <span
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                        style={{ backgroundColor: active.accent + "18", color: active.accent, border: `1px solid ${active.accent}30` }}
                      >
                        {active.badge}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono truncate" style={{ color: "#4A5275" }}>{active.desc}</p>
                  </div>
                </div>
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A5275"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ flexShrink: 0, transform: skillOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {skillOpen && (
                <div
                  className="absolute bottom-full left-0 right-0 mb-1.5 rounded-xl border overflow-hidden z-20"
                  style={{ backgroundColor: "#0D1120", borderColor: "#1A2038", boxShadow: "0 -8px 24px rgba(0,0,0,0.4)" }}
                >
                  {SKILLS.map((skill) => {
                    const isSelected = selectedSkill === skill.id;
                    return (
                      <button
                        key={skill.id}
                        onClick={() => { setSelectedSkill(skill.id); setSkillOpen(false); }}
                        className="w-full flex items-center gap-3 px-3.5 py-3 text-left transition-all"
                        style={{
                          backgroundColor: isSelected ? skill.accent + "0D" : "transparent",
                          borderLeft: isSelected ? `2px solid ${skill.accent}` : "2px solid transparent",
                        }}
                        onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "#141828"; }}
                        onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent"; }}
                      >
                        <span style={{ color: isSelected ? skill.accent : "#4A5275" }}>{skill.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold font-mono" style={{ color: isSelected ? "#E8ECF4" : "#8892AA" }}>
                              {skill.label}
                            </span>
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: skill.accent + "18", color: skill.accent, border: `1px solid ${skill.accent}30` }}
                            >
                              {skill.badge}
                            </span>
                          </div>
                          <p className="text-[10.5px] font-mono mt-0.5" style={{ color: "#4A5275" }}>{skill.desc}</p>
                        </div>
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={skill.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        <div
          className="chat-input-wrap relative rounded-xl border"
          style={{ backgroundColor: "#141828", borderColor: "#232A42" }}
        >
          {/* Visually hidden label — associates label with textarea for screen readers */}
          <label htmlFor="prompt-input" className="sr-only">
            Describe your UI
          </label>
          <textarea
            id="prompt-input"
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={isGenerating}
            placeholder="Describe your UI…"
            rows={1}
            className="w-full px-4 pt-3 pb-9 text-sm resize-none disabled:opacity-40 focus:outline-none bg-transparent leading-relaxed"
            style={{
              color: "#E8ECF4",
              minHeight: "60px",
              maxHeight: "140px",
              fontFamily: "'DM Sans', sans-serif",
              caretColor: "#FF6B35",
            }}
          />

          {/* Bottom row inside input */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 flex items-center justify-between">
            <span className="text-[9.5px] font-mono" style={{ color: "#232A42" }}>
              shift+enter newline
            </span>
            <motion.button
              onClick={handleSend}
              disabled={!input.trim() || isGenerating}
              aria-label="Send prompt"
              whileTap={!prefersReducedMotion && input.trim() && !isGenerating ? { scale: 0.88 } : {}}
              className="w-7 h-7 rounded-lg flex items-center justify-center disabled:opacity-25 disabled:cursor-not-allowed"
              style={{
                backgroundColor: input.trim() && !isGenerating ? "#FF6B35" : "transparent",
                border: input.trim() && !isGenerating ? "none" : "1px solid #232A42",
                transition: "background-color 180ms cubic-bezier(0.22,1,0.36,1), border-color 180ms cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <Send
                size={12}
                style={{
                  color: input.trim() && !isGenerating ? "#fff" : "#4A5275",
                  transition: "color 180ms cubic-bezier(0.22,1,0.36,1)",
                }}
              />
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
