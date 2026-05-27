"use client";
import { useState } from "react";
import {
  SandpackProvider,
  SandpackPreview,
  SandpackCodeEditor,
  SandpackLayout,
  SandpackFileExplorer,
} from "@codesandbox/sandpack-react";
import { useProjectStore } from "@/store/projectStore";
import { Monitor, Code2, FolderOpen, RefreshCw } from "lucide-react";

type Tab = "preview" | "code" | "files";

/* Blueprint wireframe SVG — communicates the tool's purpose visually */
function BlueprintPlaceholder() {
  return (
    <svg
      width="220"
      height="160"
      viewBox="0 0 220 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.5 }}
    >
      {/* Browser chrome */}
      <rect x="0.5" y="0.5" width="219" height="159" rx="7.5" stroke="#1A2038"/>
      {/* Traffic lights */}
      <circle cx="16" cy="14" r="3.5" fill="#1A2038"/>
      <circle cx="26" cy="14" r="3.5" fill="#1A2038"/>
      <circle cx="36" cy="14" r="3.5" fill="#1A2038"/>
      {/* URL bar */}
      <rect x="50" y="9" width="120" height="10" rx="4" fill="#1A2038"/>
      <rect x="180" y="9" width="30" height="10" rx="4" fill="#1A2038"/>
      {/* Divider */}
      <line x1="0" y1="28" x2="220" y2="28" stroke="#1A2038" strokeWidth="1"/>
      {/* Nav bar */}
      <rect x="10" y="36" width="200" height="20" rx="3" fill="#141828" stroke="#1A2038" strokeWidth="1"/>
      <rect x="18" y="41" width="40" height="10" rx="2" fill="#1A2038"/>
      <rect x="160" y="40" width="42" height="12" rx="3" fill="#FF6B35" opacity="0.18"/>
      {/* Hero */}
      <rect x="10" y="64" width="200" height="38" rx="4" fill="#141828" stroke="#1A2038" strokeWidth="1"/>
      {/* Hero lines */}
      <rect x="50" y="72" width="120" height="6" rx="2" fill="#1A2038"/>
      <rect x="65" y="82" width="90" height="4" rx="2" fill="#1A2038"/>
      <rect x="80" y="90" width="60" height="8" rx="3" fill="#FF6B35" opacity="0.2"/>
      {/* 3 cards */}
      <rect x="10" y="110" width="62" height="40" rx="4" fill="none" stroke="#1A2038" strokeWidth="1"/>
      <rect x="79" y="110" width="62" height="40" rx="4" fill="none" stroke="#1A2038" strokeWidth="1"/>
      <rect x="148" y="110" width="62" height="40" rx="4" fill="none" stroke="#1A2038" strokeWidth="1"/>
      {/* Card content lines */}
      {[10, 79, 148].map((x, i) => (
        <g key={i}>
          <rect x={x + 8} y="118" width="28" height="6" rx="1.5" fill="#1A2038"/>
          <rect x={x + 8} y="128" width="46" height="4" rx="1.5" fill="#141828"/>
          <rect x={x + 8} y="136" width="36" height="4" rx="1.5" fill="#141828"/>
        </g>
      ))}
      {/* Cursor spark hint */}
      <path
        d="M96 52L96 64L100 60L102 66L104 65L102 59L106 59L96 52Z"
        fill="#FF6B35"
        opacity="0.5"
      />
      <circle cx="108" cy="50" r="1.5" fill="#FF6B35" opacity="0.35"/>
      <circle cx="110" cy="55" r="1" fill="#FF6B35" opacity="0.2"/>
    </svg>
  );
}

const TABS: { id: Tab; icon: React.ReactNode; label: string }[] = [
  { id: "preview", icon: <Monitor size={12} />, label: "Preview" },
  { id: "code", icon: <Code2 size={12} />, label: "Code" },
  { id: "files", icon: <FolderOpen size={12} />, label: "Files" },
];

export default function SandpackWrapper() {
  const { files, activeVersion } = useProjectStore();
  const [tab, setTab] = useState<Tab>("preview");
  const [previewKey, setPreviewKey] = useState(0);

  const hasFiles = Object.keys(files).length > 0;

  if (!hasFiles) {
    return (
      <div className="blueprint-grid flex-1 flex items-center justify-center relative overflow-hidden">
        {/* Radial vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 20%, #080810 100%)",
          }}
        />
        {/* Center glow */}
        <div
          className="absolute"
          style={{
            width: "300px",
            height: "200px",
            background: "radial-gradient(ellipse, rgba(255,107,53,0.04) 0%, transparent 70%)",
            transform: "translate(-50%, -50%)",
            left: "50%",
            top: "50%",
          }}
        />
        <div className="relative z-10 flex flex-col items-center gap-5">
          <BlueprintPlaceholder />
          <div className="text-center space-y-1.5">
            <p className="font-syne font-semibold text-[13px]" style={{ color: "#4A5275" }}>
              Preview will appear here
            </p>
            <p className="text-[10.5px] font-mono" style={{ color: "#232A42" }}>
              Send a prompt to generate your first UI
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Build sandpack files — prefix paths with /
  const sandpackFiles: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    const key = path.startsWith("/") ? path : `/${path}`;
    sandpackFiles[key] = content;
  }

  // Drop App Router files when Pages Router files exist — Next.js crashes if both are present
  const hasPagesRouter = Object.keys(sandpackFiles).some((k) => k.startsWith("/pages/"));
  const hasAppRouter = Object.keys(sandpackFiles).some((k) => k.startsWith("/app/"));
  if (hasPagesRouter && hasAppRouter) {
    for (const k of Object.keys(sandpackFiles)) {
      if (k.startsWith("/app/")) delete sandpackFiles[k];
    }
  }

  // Sandpack's nextjs template ships pages/_app.js and pages/index.js by default.
  // If Gemini generated .tsx versions, delete the conflicting .js defaults so only
  // one file exists per route. Keep .tsx files as-is — Sandpack's Next.js template
  // handles TypeScript natively, and renaming .tsx→.js corrupts TypeScript syntax.
  for (const path of Object.keys(sandpackFiles)) {
    if (path.endsWith(".tsx") || path.endsWith(".ts")) {
      const jsEquivalent = path.replace(/\.tsx$/, ".js").replace(/\.ts$/, ".js");
      const jsxEquivalent = path.replace(/\.tsx$/, ".jsx");
      delete sandpackFiles[jsEquivalent];
      delete sandpackFiles[jsxEquivalent];
    }
  }

  // Ensure styles/globals.css exists so _app import never breaks
  if (!sandpackFiles["/styles/globals.css"]) {
    sandpackFiles["/styles/globals.css"] = "body { margin: 0; font-family: sans-serif; }\n";
  }

  // Always force _app.js to the minimal safe form — strips any CDN <script> tag that
  // Gemini may have generated (causes NonErrorEmittedError in Sandpack's bundler).
  sandpackFiles["/pages/_app.js"] = `import '../styles/globals.css'
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
`;

  // Override next.config.js to allow any image hostname — prevents next/image domain errors
  sandpackFiles["/next.config.js"] = `/** @type {import('next').NextConfig} */
module.exports = {
  images: {
    domains: [
      'via.placeholder.com', 'picsum.photos', 'images.unsplash.com',
      'source.unsplash.com', 'placehold.co', 'loremflickr.com',
      'avatars.githubusercontent.com', 'i.pravatar.cc',
    ],
    unoptimized: true,
  },
};
`;

  const entryFile =
    sandpackFiles["/pages/index.js"] ? "/pages/index.js" :
    sandpackFiles["/pages/index.jsx"] ? "/pages/index.jsx" :
    sandpackFiles["/pages/index.tsx"] ? "/pages/index.tsx" :
    Object.keys(sandpackFiles)[0];

  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: "#080C14" }}
    >
      {/* Tab bar */}
      <div
        className="flex items-center gap-0.5 px-3 py-2 border-b flex-shrink-0"
        style={{ backgroundColor: "#0D1120", borderColor: "#1A2038" }}
      >
        {/* Segmented tab control */}
        <div
          className="flex items-center p-0.5 rounded-lg gap-0.5"
          style={{ backgroundColor: "#141828" }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-label={`${t.label} view`}
              aria-pressed={tab === t.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-mono transition-all"
              style={
                tab === t.id
                  ? {
                      backgroundColor: "#0D1120",
                      color: "#FF6B35",
                      border: "1px solid rgba(255,107,53,0.2)",
                    }
                  : {
                      color: "#4A5275",
                      backgroundColor: "transparent",
                      border: "1px solid transparent",
                    }
              }
              onMouseEnter={e => {
                if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "#8892AA";
              }}
              onMouseLeave={e => {
                if (tab !== t.id) (e.currentTarget as HTMLElement).style.color = "#4A5275";
              }}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Right side: file info + refresh */}
        <div className="ml-auto flex items-center gap-2">
          {activeVersion && (
            <span
              className="text-[9.5px] font-mono hidden sm:inline"
              style={{ color: "#4A5275" }}
            >
              v{activeVersion.version_number}
            </span>
          )}
          <span
            className="text-[9.5px] font-mono px-2 py-1 rounded"
            style={{
              color: "#4D9CFF",
              backgroundColor: "rgba(77,156,255,0.06)",
              border: "1px solid rgba(77,156,255,0.1)",
            }}
          >
            Next.js
          </span>
          <button
            onClick={() => setPreviewKey((k) => k + 1)}
            className="p-1.5 rounded-md transition-all"
            style={{ color: "#4A5275" }}
            aria-label="Refresh preview"
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "#8892AA";
              el.style.backgroundColor = "#141828";
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement;
              el.style.color = "#4A5275";
              el.style.backgroundColor = "transparent";
            }}
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Sandpack */}
      <div className="flex-1 overflow-hidden">
        <SandpackProvider
          key={previewKey}
          template="nextjs"
          files={sandpackFiles}
          options={{
            activeFile: entryFile,
            visibleFiles: Object.keys(sandpackFiles).slice(0, 10),
            // Load Tailwind CDN via externalResources so it's injected into the
            // preview iframe *before* the app runs — avoids NonErrorEmittedError
            // that occurs when <script src="cdn"> is inside _app.js Head at build time.
            externalResources: ["https://cdn.tailwindcss.com"],
          }}
          theme={{
            colors: {
              surface1: "#080C14",
              surface2: "#0D1120",
              surface3: "#141828",
              clickable: "#4A5275",
              base: "#E8ECF4",
              disabled: "#232A42",
              hover: "#FF6B35",
              accent: "#FF6B35",
              error: "#f87171",
              errorSurface: "#2A0A0A",
            },
            font: {
              body: "'DM Sans', sans-serif",
              mono: "'JetBrains Mono', monospace",
              size: "13px",
              lineHeight: "1.65",
            },
          }}
        >
          <SandpackLayout style={{ height: "100%", border: "none" }}>
            {tab === "files" && (
              <SandpackFileExplorer style={{ height: "100%", minWidth: "180px", maxWidth: "200px" }} />
            )}
            {tab === "code" && (
              <SandpackCodeEditor
                showLineNumbers
                showInlineErrors
                style={{ height: "100%", flex: 1 }}
              />
            )}
            {tab === "preview" && (
              <SandpackPreview
                showNavigator
                showOpenInCodeSandbox={false}
                style={{ height: "100%", flex: 1 }}
              />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
