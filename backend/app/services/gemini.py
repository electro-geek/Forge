import json
import google.generativeai as genai
from typing import Generator


SKILL_PROMPTS: dict[str, str] = {
    "uiux_pro_max": """
DESIGN FRAMEWORK — UI/UX Pro Max (professional, accessible, structured):

ACCESSIBILITY (non-negotiable):
- All text minimum 4.5:1 color contrast ratio
- Every interactive element minimum 44x44px touch target
- Add cursor-pointer to ALL clickable elements (buttons, cards, links)
- Visible focus ring on all interactive elements (focus:outline-none focus:ring-2 focus:ring-offset-2)
- All img tags must have descriptive alt attributes
- Form inputs must have associated visible labels

TYPOGRAPHY:
- Line height 1.5-1.75 for body text (leading-relaxed or leading-loose)
- Limit line length to 65-75 chars (max-w-prose on text blocks)
- Pair a distinctive heading font with a clean body font — import from Google Fonts via <style>@import url(...)</style>
- Minimum 16px body text, never smaller on mobile
- NEVER use Inter, Roboto, Arial, or system-ui — choose characterful fonts

LAYOUT:
- Consistent max container: max-w-6xl or max-w-7xl throughout
- Fixed/sticky navbar: add matching top padding to page content to prevent overlap
- Floating navbar pattern preferred: top-4 left-4 right-4 rounded-2xl shadow-lg
- No layout shift: reserve space for dynamic content

INTERACTIONS & STATES:
- All hover transitions: 150-300ms (transition-all duration-200)
- Hover = color/opacity/shadow change ONLY — no scale transforms that shift layout
- Buttons disabled during async (disabled:opacity-50 disabled:cursor-not-allowed)
- Loading states: spinner or pulse skeleton — never silent waiting
- Error messages placed near the source of the error, not at top of page

VISUAL QUALITY:
- SVG icons only — NEVER use emoji as UI icons
- Consistent icon size throughout (w-5 h-5 or w-6 h-6)
- Match aesthetic style to product purpose
- No abrupt state changes — everything transitions smoothly

ANIMATION:
- Animate only transform and opacity — never width/height/top/left
- Stagger list item reveals: each item has animation-delay (50ms, 100ms, 150ms...)
- One orchestrated page-load sequence, not scattered random animations
- Include prefers-reduced-motion support via @media (prefers-reduced-motion: reduce)

RESPONSIVE:
- Mobile-first classes, override for md: lg: xl:
- No horizontal scroll at any breakpoint
- Touch targets always 44px+ on mobile

Make it professional, accessible, production-ready, and polished.
""",
    "frontend_design": """
DESIGN FRAMEWORK — Frontend Design (distinctive, bold, unforgettable):

CORE MANDATE:
Commit to ONE clear aesthetic direction and execute it with total precision.
The design must be UNFORGETTABLE — one signature element that defines it.
NEVER produce generic AI output. Every decision must feel intentional.

CHOOSE ONE AESTHETIC AND FULLY COMMIT (do not mix):
brutally minimal | maximalist editorial | retro-futuristic | art deco geometric |
luxury refined | playful toy-like | brutalist raw | industrial utilitarian |
dark cinematic | neon cyberpunk | swiss international | organic natural | solarpunk

TYPOGRAPHY (this is where generic designs fail most — be bold):
FORBIDDEN: Inter, Roboto, Arial, system-ui, Space Grotesk, Nunito — never use any
Import Google Fonts via <style>@import url('https://fonts.googleapis.com/css2?family=...')</style>
Choose unexpected, characterful pairings — examples:
  Playfair Display + DM Sans | Bebas Neue + Inter | Syne + Fraunces |
  Unbounded + Outfit | Cormorant + Jost | Space Mono + Manrope
Use dramatic type scale: oversized headings (text-7xl, text-8xl, clamp-based sizes)
Tight tracking (tracking-tighter) or loose (tracking-widest) — commit to one

COLOR & PALETTE:
- Dominant color story + 1-2 sharp accents only
- FORBIDDEN palettes: purple-to-blue gradient on white, light blue corporate, all-gray muted
- Use CSS variables: declare --color-bg, --color-text, --color-accent etc. in :root
- Vary drastically per generation: dark moody, warm earthy, vibrant jewel, dusty muted, stark mono

SPATIAL COMPOSITION:
- Break the predictable grid: asymmetry, overlapping elements, diagonal flow
- Generous negative space (luxury) OR controlled density (editorial) — pick one
- Grid-breaking hero: text that bleeds, off-center, spanning unusual columns
- FORBIDDEN layouts: centered hero with equal margins, 3-column equal card grid, navbar-hero-features-footer

BACKGROUNDS & DEPTH (never plain solid colors):
- Gradient mesh: multiple radial-gradient() layers with mix-blend-mode
- Geometric patterns: repeating-linear-gradient for grid/stripe/dot backgrounds
- Grain overlay: <svg> filter feTurbulence as a pseudo-element
- Layered transparencies, dramatic drop-shadows (shadow-2xl with colored shadows)
- Contextual textures that match the aesthetic

MOTION:
- Page load: one orchestrated staggered reveal using @keyframes + animation-delay
- Hover states that surprise: color flood, underline reveal morphing, intentional scale
- Use CSS @keyframes for custom animations — define them in <style> tag in _app.js
- High-impact moments beat scattered micro-interactions

NEVER produce:
- Purple-to-blue gradient hero on white background
- Identical-looking cards with same padding/radius/shadow
- Standard navbar + centered hero + 3-feature-cards + footer template
- Any design that looks like default AI output with generic color and layout

Make it visually striking, contextually unique, and completely unlike generic output.
""",
}

BASE_SYSTEM_PROMPT = """You are an expert Next.js developer. Generate complete, working Next.js Pages Router code using JavaScript/JSX and Tailwind CSS.

RULES:
1. Always respond with ONLY valid JSON — no markdown, no code fences, no extra text.
2. Use this exact JSON structure:
{
  "summary": "One or two sentence description of what you built or changed",
  "files": {
    "pages/_app.js": "...complete file content...",
    "pages/index.js": "...complete file content...",
    "styles/globals.css": "...complete file content...",
    "components/SomeComponent.jsx": "...complete file content..."
  }
}
3. ALWAYS include pages/_app.js, pages/index.js, and styles/globals.css in every response.
4. pages/_app.js MUST use this exact structure — do NOT add any <script> or <Head> tags:
import '../styles/globals.css'
export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
   Tailwind CSS is already loaded externally by the preview environment — you do NOT need to load it via CDN script.
5. NEVER use the App Router — no app/ directory, no app/page.tsx, no app/layout.tsx.
6. NEVER use TypeScript (.ts/.tsx extensions) — use plain JavaScript (.js/.jsx).
7. NEVER import external packages beyond react and next.
8. Every file must contain complete, working code — never empty strings or partial snippets.
9. Use Tailwind utility classes for all styling (Tailwind is pre-loaded, no config or script tag needed).
10. Put reusable components in a components/ folder using .jsx extension.
11. Make the UI polished and professional.
12. NEVER use next/image — always use plain <img> tags instead.
13. NEVER use external image URLs — use inline SVGs, CSS shapes, emoji, or placeholder divs for images/avatars.
14. NEVER add <script src="..."> tags anywhere in the generated files — this causes build errors.
"""

FORBIDDEN_PATTERNS = [
    "child_process",
    "require('fs')",
    'require("fs")',
    "import fs",
    "eval(",
    "Function(",
    "process.env",
    "__dirname",
    "__filename",
    "execSync",
    "spawnSync",
]


def validate_generated_code(files: dict[str, str]) -> tuple[bool, str]:
    """
    Validate generated code for dangerous patterns.
    Returns (is_valid, error_message).
    """
    for file_path, content in files.items():
        for pattern in FORBIDDEN_PATTERNS:
            if pattern in content:
                return False, f"Dangerous pattern '{pattern}' found in {file_path}"
    return True, ""


def build_prompt(
    chat_history: list[dict],
    current_files: dict[str, str] | None,
    new_prompt: str,
) -> list[dict]:
    """
    Build the messages list for Gemini with full context.
    """
    messages = []

    # If there are existing files, include them as context
    if current_files:
        file_context = "Current project files:\n"
        for path, content in current_files.items():
            file_context += f"\n--- {path} ---\n{content}\n"
        messages.append({
            "role": "user",
            "parts": [file_context + "\n\nNow continue with the following instruction:"]
        })
        messages.append({
            "role": "model",
            "parts": ["Understood. I have the current file context and will modify it accordingly."]
        })

    # Add chat history
    for msg in chat_history:
        role = "user" if msg["role"] == "user" else "model"
        messages.append({
            "role": role,
            "parts": [msg["content"]],
        })

    # Add new prompt
    messages.append({
        "role": "user",
        "parts": [new_prompt],
    })

    return messages


def call_gemini(
    api_key: str,
    chat_history: list[dict],
    current_files: dict[str, str] | None,
    new_prompt: str,
    skill: str = "dark_pro",
) -> dict:
    """
    Call Gemini API and return parsed { summary, files } dict.
    """
    skill_context = SKILL_PROMPTS.get(skill, SKILL_PROMPTS["uiux_pro_max"])
    system_instruction = BASE_SYSTEM_PROMPT + "\n\n" + skill_context

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=system_instruction,
    )

    messages = build_prompt(chat_history, current_files, new_prompt)

    response = model.generate_content(
        messages,
        generation_config=genai.GenerationConfig(
            temperature=0.7,
            max_output_tokens=32768,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()

    # Defensive: strip any leftover markdown fences in case the model still wraps
    if raw.startswith("```json"):
        raw = raw[7:]
    elif raw.startswith("```"):
        raw = raw[3:]
    if raw.endswith("```"):
        raw = raw[:-3]
    raw = raw.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini returned invalid JSON: {e}. Raw (first 500 chars): {raw[:500]}")

    if "files" not in parsed:
        raise ValueError("Gemini response missing 'files' key")

    # Drop any empty files the model may have generated
    parsed["files"] = {k: v for k, v in parsed["files"].items() if v and v.strip()}

    return parsed
