# Avatar-Guided Portfolio Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Kunj's portfolio as a static Next.js site with a 3D avatar guide that introduces him once per session, then docks on the left and points at each section as the visitor scrolls.

**Architecture:** All content is server-rendered HTML with native scroll (ported from the live site). One fixed, transparent, click-through React Three Fiber canvas with an orthographic camera draws the avatar. An IntersectionObserver writes the active section to a small external store; each frame the avatar eases to a screen-space anchor and a pure state machine picks its animation clip. See `docs/03-architecture.md` and `docs/04-system-design.md`.

**Tech Stack:** Next.js 16.3 (static export), React 19.3, TypeScript, Tailwind 4, framer-motion 12, three 0.186, @react-three/fiber 9.8, @react-three/drei 10.7, maath 0.10, Vitest 5, Playwright 1.63.

**Conventions for every task**
- Paths are relative to `~/Desktop/Prep/portfolio-3d/` unless they start with `web/` (the app) or `$LIVE`.
- `$LIVE` = `~/Desktop/Prep/Portfolio/Desktop/Projects/Portfolio` (the live site, read-only: never edit it from this plan).
- Run app commands from `web/`.
- Commit after every task. Do **not** push or create the GitHub repo until Task 16, and only after Kunj approves.
- Reference IDs like [R1.3] point at `docs/01-references.md`.

---

## Chunk 1: Foundation

### Task 1: Scaffold the app and repo

**Files:**
- Create: `web/` (create-next-app), `.gitignore`
- Modify: `web/next.config.ts`, `web/package.json`

- [ ] **Step 1: Init the repo**

```bash
cd ~/Desktop/Prep/portfolio-3d
git init -b main
printf "web/out/\nweb/.next/\nweb/node_modules/\nweb/test-results/\nweb/playwright-report/\nassets/clips/\nassets/avatar/*.fbx\n.DS_Store\n" > .gitignore
```

- [ ] **Step 2: Scaffold Next.js**

```bash
npx create-next-app@16.3.8 web --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
cd web
npm install react@~19.3.0 react-dom@~19.3.0
npm install framer-motion@^12 react-icons@^5 clsx@^2 tailwind-merge@^3
```

Expected: `web/package.json` lists `next 16.3.8`, `react ~19.3.0`. React must stay below 19.4 (R3F 9.8 peer range, [R7.6]).

- [ ] **Step 3: Static export config** — replace `web/next.config.ts`:

```ts
import type { NextConfig } from "next";

// Static export: the same out/ folder deploys to Vercel, Cloudflare Pages or GitHub Pages (ADR-0003).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
```

- [ ] **Step 4: Add scripts** — in `web/package.json` `"scripts"`, keep `dev`, `build`, `lint`, add:

```json
"typecheck": "tsc --noEmit",
"test": "vitest run",
"e2e": "playwright test"
```

- [ ] **Step 5: Verify the build**

Run: `npm run build && ls out/index.html`
Expected: build succeeds, `out/index.html` exists.

- [ ] **Step 6: Commit**

```bash
cd .. && git add -A && git commit -m "chore: scaffold Next.js 16 static app in web/"
```

### Task 2: Port the live site's content

**Files:**
- Create: `web/src/{components,data,lib,types}/…` (copied), `web/public/Kunj_Pandya_Resume.pdf`, `web/public/favicon.svg`
- Replace: `web/src/app/{layout.tsx,page.tsx,globals.css,robots.ts,sitemap.ts}`
- Modify (after copy): `Hero.tsx`, `Experience.tsx`, `Contact.tsx`

- [ ] **Step 1: Copy files** (from `web/`)

```bash
LIVE=~/Desktop/Prep/Portfolio/Desktop/Projects/Portfolio
mkdir -p src/components/ui src/data src/lib src/types
cp -R $LIVE/src/components/sections $LIVE/src/components/animations src/components/
cp $LIVE/src/components/ui/{Button,ExperienceCard,ProjectCard,SkillBadge}.tsx src/components/ui/
cp $LIVE/src/data/*.ts src/data/
cp $LIVE/src/lib/{constants,utils}.ts src/lib/
cp $LIVE/src/types/index.ts src/types/
cp $LIVE/src/app/{page.tsx,robots.ts,sitemap.ts} src/app/
cp $LIVE/public/{Kunj_Pandya_Resume.pdf,favicon.svg} public/
```

Not copied on purpose: `ThemeToggle.tsx` and `lib/github.ts` (unused on the live site).

- [ ] **Step 2: Make robots/sitemap static** — add as the first line of both `src/app/robots.ts` and `src/app/sitemap.ts`:

```ts
export const dynamic = "force-static";
```

- [ ] **Step 3: Replace `src/app/globals.css`** (Tailwind 4 theme under the live site's class names, [02 layout §4])

```css
@import "tailwindcss";

@theme {
  --color-background: #faf8f5;
  --color-background-light: #faf8f5;
  --color-surface: #f5f1eb;
  --color-surface-light: #fefdfb;
  --color-text-primary: #3e2723;
  --color-text-primary-light: #3e2723;
  --color-text-secondary: #6d4c41;
  --color-text-secondary-light: #6d4c41;
  --color-accent-primary: #5d4037;
  --color-accent-secondary: #8d6e63;
  --color-accent-hover: #4e342e;
  --color-accent-cream: #d7ccc8;
  --color-border: rgba(93, 64, 55, 0.08);
  --color-border-light: rgba(93, 64, 55, 0.04);
  --font-sans: var(--font-inter), Inter, system-ui, sans-serif;
  --font-mono: var(--font-jetbrains-mono), "JetBrains Mono", monospace;
  --shadow-card: 0 1px 3px rgba(62, 39, 35, 0.04), 0 1px 2px rgba(62, 39, 35, 0.06);
  --shadow-card-hover: 0 10px 15px rgba(62, 39, 35, 0.08), 0 4px 6px rgba(62, 39, 35, 0.04);
  --shadow-card-lg: 0 20px 25px rgba(62, 39, 35, 0.12), 0 10px 10px rgba(62, 39, 35, 0.04);
}

:root {
  --rail-width: 280px;
}

@layer base {
  html {
    scroll-behavior: smooth;
    color-scheme: light;
  }
  body {
    @apply bg-background text-text-primary;
  }
}

@utility scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

- [ ] **Step 4: Replace `src/app/layout.tsx`** (live layout minus Google Analytics, which moves over at cutover, [07 hosting §8])

```tsx
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { siteMetadata } from "@/data/metadata";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" });
const pageTitle = `${siteMetadata.name} | ${siteMetadata.title}`;

export const metadata: Metadata = {
  title: pageTitle,
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  authors: [{ name: siteMetadata.name }],
  metadataBase: new URL(siteMetadata.url),
  alternates: { canonical: "/" },
  openGraph: { title: pageTitle, description: siteMetadata.description, url: siteMetadata.url, type: "website" },
  icons: { icon: "/favicon.svg" },
};

// Runs before paint so a visitor who turned the guide off never sees the rail padding flash (CLS 0).
const guidePrefScript = `try{if(localStorage.getItem("guide:enabled")==="0")document.documentElement.dataset.guide="off"}catch(e){}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: guidePrefScript }} />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-text-primary`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Add guide hooks to the content** (from `web/`)

```bash
perl -0pi -e 's|<section className="min-h-screen|<section id="hero" className="min-h-screen|' src/components/sections/Hero.tsx
perl -0pi -e 's|href="/Kunj_Pandya_Resume.pdf"|href="/Kunj_Pandya_Resume.pdf"\n                data-guide-target="resume"|' src/components/sections/Hero.tsx
perl -0pi -e 's|<div className="relative">|<div className="relative" data-guide-target="experience-list">|' src/components/sections/Experience.tsx
perl -0pi -e 's|<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">|<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6" data-guide-target="contact-links">|' src/components/sections/Contact.tsx
grep -c 'data-guide-target\|id="hero"' src/components/sections/{Hero,Experience,Contact}.tsx
```

Expected: `Hero.tsx:2`, `Experience.tsx:1`, `Contact.tsx:1`.

- [ ] **Step 6: Build and compare visually**

Run: `npm run build && npx serve out -l 4173` and open http://localhost:4173 next to https://kunjpandya.vercel.app.
Expected: same content and colours. Tailwind 4 changed a few defaults (default border colour, `shadow-sm`/`ring` scales); fix any visible difference with an explicit class in the ported component, not by changing tokens.

- [ ] **Step 7: Commit**

```bash
cd .. && git add -A && git commit -m "feat: port live portfolio content to the new app"
```

### Task 3: Test tooling and a content smoke test

**Files:**
- Create: `web/vitest.config.ts`, `web/playwright.config.ts`, `web/e2e/content.spec.ts`

- [ ] **Step 1: Install**

```bash
npm install -D vitest@^5 @playwright/test@^1.63 serve@^14
npx playwright install chromium
```

- [ ] **Step 2: `web/vitest.config.ts`**

```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
});
```

- [ ] **Step 3: `web/playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:4173",
    // Headless Chromium renders WebGL through SwiftShader.
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: { command: "npx serve out -l 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
```

- [ ] **Step 4: Write the smoke test** — `web/e2e/content.spec.ts`

```ts
import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "journey", "about", "experience", "projects", "skills", "contact"];

test("every guided section and target exists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kunj Pandya");
  for (const id of SECTIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1);
  for (const t of ["resume", "experience-list", "contact-links"]) {
    await expect(page.locator(`[data-guide-target="${t}"]`)).toHaveCount(1);
  }
});
```

- [ ] **Step 5: Run it**

Run: `npm run build && npm run e2e`
Expected: 1 passed.

- [ ] **Step 6: Commit**

```bash
cd .. && git add -A && git commit -m "test: add vitest, playwright and a content smoke test"
```

---

## Chunk 2: Guide core logic (pure, test-first)

### Task 4: Types and guide config

**Files:**
- Create: `web/src/guide/types.ts`, `web/src/guide/config.ts`
- Test: `web/src/guide/__tests__/config.test.ts`

- [ ] **Step 1: `web/src/guide/types.ts`**

```ts
export type ClipName = "Wave" | "Talk" | "Point" | "Idle" | "Travel" | "ThumbsUp";
export type StopClip = Exclude<ClipName, "Travel" | "Wave">;
export type Mode = "wide" | "compact";
export type IntroPhase = "pending" | "hello" | "leaving" | "done";

export interface GuideStop {
  id: string;
  clip: StopClip;
  target?: string;
  line?: string;
  source?: string;
  wide: { y: number };
}

export interface ModelConfig {
  url: string;
  clipMap: Record<ClipName, string>;
  once: ClipName[];
}

export interface GuideState {
  enabled: boolean;
  mode: Mode;
  reducedMotion: boolean;
  section: string | null;
  intro: IntroPhase;
  modelReady: boolean;
  bubble: { text: string; key: number } | null;
}
```

- [ ] **Step 2: Write the failing test** — `web/src/guide/__tests__/config.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { GUIDE_STOPS, INTRO, MODEL, SECTION_IDS, stopFor } from "../config";
import { siteMetadata } from "@/data/metadata";
import { experiences } from "@/data/experience";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";

const corpus = JSON.stringify({ siteMetadata, experiences, projects, skills });
const numbersIn = (s: string) => s.match(/\d+(?:[.,]\d+)*(?:K\+|\+|%)?/g) ?? [];

describe("guide config", () => {
  it("has exactly one stop per guided section, in page order", () => {
    expect(GUIDE_STOPS.map((s) => s.id)).toEqual(SECTION_IDS.filter((id) => id !== "linkedin"));
  });

  it("keeps lines short", () => {
    expect(INTRO.line.length).toBeLessThanOrEqual(160);
    for (const s of GUIDE_STOPS) expect(s.line?.length ?? 0).toBeLessThanOrEqual(140);
  });

  it("only uses numbers that already appear in the site's data", () => {
    for (const line of [INTRO.line, ...GUIDE_STOPS.map((s) => s.line ?? "")]) {
      for (const n of numbersIn(line)) expect(corpus, `"${n}" in "${line}"`).toContain(n);
    }
  });

  it("maps every logical clip", () => {
    for (const c of ["Wave", "Talk", "Point", "Idle", "Travel", "ThumbsUp"] as const) {
      expect(MODEL.clipMap[c]).toBeTruthy();
    }
  });

  it("falls back to the nearest earlier stop for sections without one", () => {
    expect(stopFor(null).id).toBe("hero");
    expect(stopFor("linkedin").id).toBe("projects");
    expect(stopFor("skills").id).toBe("skills");
  });
});
```

- [ ] **Step 3: Run it to see it fail**

Run: `npm test`
Expected: FAIL, cannot resolve `../config`.

- [ ] **Step 4: Write `web/src/guide/config.ts`** (lines from `docs/06-guide-script.md`; placeholder model from `docs/05-avatar-pipeline.md`)

```ts
import type { GuideStop, ModelConfig } from "./types";

export const SECTION_IDS = ["hero", "journey", "about", "experience", "projects", "linkedin", "skills", "contact"] as const;

export const INTRO = {
  line: "Hi, I'm Kunj. I'm finishing my MS in CS at Stevens in May 2027, and I build distributed systems and ML that ships.",
  helloMs: 4000,
  loadTimeoutMs: 4000,
};

// Single source of truth for the choreography (pattern: R2.10).
export const GUIDE_STOPS: GuideStop[] = [
  { id: "hero", clip: "Point", target: '[data-guide-target="resume"]', line: "Want the one-page version? My resume is right here.", wide: { y: 0.58 } },
  { id: "journey", clip: "Point", target: "#journey h2", line: "This is the path so far: Mumbai to Hoboken, research to production.", source: "metadata.bio[0], metadata.location", wide: { y: 0.55 } },
  { id: "about", clip: "Talk", line: "I like building systems from their primitives. Here's a bit more about me.", source: "metadata.bio[1]", wide: { y: 0.6 } },
  { id: "experience", clip: "Point", target: '[data-guide-target="experience-list"]', line: "Right now I build AI features for Fini's iOS app. Before that, a platform serving 10K+ requests a day.", source: "experience.ts (Fini), metadata.bio[2]", wide: { y: 0.55 } },
  { id: "projects", clip: "Point", target: "#projects h2", line: "Click any card. Every public project links straight to its repo.", source: "projects.ts githubRepo", wide: { y: 0.55 } },
  { id: "skills", clip: "Point", target: "#skills h2", line: "My toolbox, grouped by what each tool is for.", source: "skills.ts", wide: { y: 0.55 } },
  { id: "contact", clip: "ThumbsUp", target: '[data-guide-target="contact-links"]', line: "That's the tour! I'm open to new-grad SWE and ML roles. Say hi.", source: "metadata.availability", wide: { y: 0.6 } },
];

// Placeholder: three.js RobotExpressive (CC0). Swap per docs/05-avatar-pipeline.md step 6.
export const MODEL: ModelConfig = {
  url: "/guide/robot-expressive.glb",
  clipMap: { Wave: "Wave", Talk: "Yes", Point: "ThumbsUp", Idle: "Idle", Travel: "Walking", ThumbsUp: "ThumbsUp" },
  once: ["Wave", "Point", "ThumbsUp"],
};

/** The stop for a section, or the nearest earlier section's stop (e.g. LinkedIn → Projects). */
export function stopFor(sectionId: string | null): GuideStop {
  const index = sectionId ? SECTION_IDS.indexOf(sectionId as (typeof SECTION_IDS)[number]) : 0;
  for (let i = Math.max(index, 0); i >= 0; i--) {
    const stop = GUIDE_STOPS.find((s) => s.id === SECTION_IDS[i]);
    if (stop) return stop;
  }
  return GUIDE_STOPS[0];
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: 5 passed. If the numbers test fails, the line cites a number not on the site: fix the line, not the test.

- [ ] **Step 6: Commit**

```bash
cd .. && git add -A && git commit -m "feat(guide): add types and choreography config"
```

### Task 5: Anchor math

**Files:**
- Create: `web/src/guide/anchors.ts`
- Test: `web/src/guide/__tests__/anchors.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { modeForWidth, pxToWorld, resolveAnchor } from "../anchors";
import type { GuideStop } from "../types";

const stop: GuideStop = { id: "skills", clip: "Point", wide: { y: 0.55 } };
const laptop = { w: 1440, h: 900 };
const phone = { w: 390, h: 844 };

// Fractions of the viewport are not exact in floating point (0.55 * 900 = 495.00000000000006).
const expectAnchor = (a: { x: number; y: number; heightPx: number }, x: number, y: number, heightPx: number) => {
  expect(a.x).toBeCloseTo(x);
  expect(a.y).toBeCloseTo(y);
  expect(a.heightPx).toBeCloseTo(heightPx);
};

describe("resolveAnchor", () => {
  it("centres the avatar during the intro (wide)", () => {
    expectAnchor(resolveAnchor(stop, "wide", "hello", laptop), 720, 468, 495);
  });
  it("treats pending like hello so the avatar first appears centred", () => {
    expect(resolveAnchor(stop, "wide", "pending", laptop)).toEqual(resolveAnchor(stop, "wide", "hello", laptop));
  });
  it("centres the avatar during the intro (compact)", () => {
    expectAnchor(resolveAnchor(stop, "compact", "hello", phone), 195, 422, 337.6);
  });
  it("puts the avatar in the rail after the intro", () => {
    expectAnchor(resolveAnchor(stop, "wide", "done", laptop), 140, 495, 378);
  });
  it("clamps rail height on very tall screens", () => {
    expect(resolveAnchor(stop, "wide", "done", { w: 2560, h: 1600 }).heightPx).toBe(420);
  });
  it("docks bottom-left at 120 px in compact mode", () => {
    expectAnchor(resolveAnchor(stop, "compact", "done", phone), 52, 768, 120);
  });
});

describe("pxToWorld", () => {
  it("maps the viewport centre to the origin", () => {
    expect(pxToWorld({ x: 720, y: 450 }, laptop)).toEqual({ x: 0, y: 0 });
  });
  it("flips y and moves the origin to the top-left corner", () => {
    expect(pxToWorld({ x: 0, y: 0 }, laptop)).toEqual({ x: -720, y: 450 });
  });
});

describe("modeForWidth", () => {
  it("switches at 1280 px", () => {
    expect(modeForWidth(1280)).toBe("wide");
    expect(modeForWidth(1279)).toBe("compact");
  });
});
```

- [ ] **Step 2: Run it** — `npm test` → FAIL (module missing).

- [ ] **Step 3: Implement `web/src/guide/anchors.ts`**

```ts
import type { GuideStop, IntroPhase, Mode } from "./types";

export interface Viewport { w: number; h: number }
export interface Anchor { x: number; y: number; heightPx: number }

export const RAIL_WIDTH = 280;
export const WIDE_MIN_WIDTH = 1280;
const COMPACT_HEIGHT = 120;
const COMPACT_INSET = 16;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const modeForWidth = (w: number): Mode => (w >= WIDE_MIN_WIDTH ? "wide" : "compact");

/** Where the avatar's vertical centre should be, in CSS pixels from the top-left (docs/04 §3). */
export function resolveAnchor(stop: GuideStop, mode: Mode, intro: IntroPhase, v: Viewport): Anchor {
  if (intro === "pending" || intro === "hello") {
    return mode === "wide"
      ? { x: v.w / 2, y: 0.52 * v.h, heightPx: clamp(0.55 * v.h, 320, 520) }
      : { x: v.w / 2, y: 0.5 * v.h, heightPx: 0.4 * v.h };
  }
  if (mode === "wide") {
    return { x: RAIL_WIDTH / 2, y: stop.wide.y * v.h, heightPx: clamp(0.42 * v.h, 260, 420) };
  }
  return {
    x: COMPACT_INSET + 0.3 * COMPACT_HEIGHT,
    y: v.h - COMPACT_INSET - COMPACT_HEIGHT / 2,
    heightPx: COMPACT_HEIGHT,
  };
}

/** Orthographic camera, zoom 1: one world unit is one CSS pixel, origin at the viewport centre (ADR-0002). */
export const pxToWorld = (p: { x: number; y: number }, v: Viewport) => ({ x: p.x - v.w / 2, y: v.h / 2 - p.y });
```

- [ ] **Step 4: Run** — `npm test` → all pass.

- [ ] **Step 5: Commit** — `git commit -am "feat(guide): add screen-space anchor math"` (from repo root: `git add -A` first).

### Task 6: Clip state machine

**Files:**
- Create: `web/src/guide/clipMachine.ts`
- Test: `web/src/guide/__tests__/clipMachine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { nextClip, type ClipInput } from "../clipMachine";
import type { ClipName } from "../types";

const base: ClipInput = { intro: "done", moving: false, reducedMotion: false, stopClip: "Point", finished: new Set() };
const done = (...c: ClipName[]) => new Set<ClipName>(c);

describe("nextClip", () => {
  it("waves first during the intro, then talks", () => {
    expect(nextClip({ ...base, intro: "hello" })).toBe("Wave");
    expect(nextClip({ ...base, intro: "hello", finished: done("Wave") })).toBe("Talk");
  });
  it("travels while moving", () => {
    expect(nextClip({ ...base, intro: "leaving", moving: true })).toBe("Travel");
    expect(nextClip({ ...base, moving: true })).toBe("Travel");
  });
  it("plays the stop clip on arrival", () => {
    expect(nextClip(base)).toBe("Point");
    expect(nextClip({ ...base, stopClip: "Talk" })).toBe("Talk");
  });
  it("holds Point after it finishes (clamped pose)", () => {
    expect(nextClip({ ...base, finished: done("Point") })).toBe("Point");
  });
  it("returns to Idle after a thumbs up", () => {
    expect(nextClip({ ...base, stopClip: "ThumbsUp" })).toBe("ThumbsUp");
    expect(nextClip({ ...base, stopClip: "ThumbsUp", finished: done("ThumbsUp") })).toBe("Idle");
  });
  it("only idles under reduced motion", () => {
    expect(nextClip({ ...base, reducedMotion: true, moving: true })).toBe("Idle");
    expect(nextClip({ ...base, reducedMotion: true, intro: "hello" })).toBe("Idle");
  });
  it("never depends on time: same input, same output (R1.3 race)", () => {
    const input = { ...base, moving: true };
    expect(nextClip(input)).toBe(nextClip(input));
  });
});
```

- [ ] **Step 2: Run** — FAIL (module missing).

- [ ] **Step 3: Implement `web/src/guide/clipMachine.ts`**

```ts
import type { ClipName, IntroPhase, StopClip } from "./types";

export interface ClipInput {
  intro: IntroPhase;
  moving: boolean;
  reducedMotion: boolean;
  stopClip: StopClip;
  finished: ReadonlySet<ClipName>;
}

const RETURN_TO_IDLE: ReadonlySet<ClipName> = new Set<ClipName>(["ThumbsUp"]);

/** Pure: picks the clip from current facts only, so fast scrolling can't leave a stale clip (ADR-0005). */
export function nextClip({ intro, moving, reducedMotion, stopClip, finished }: ClipInput): ClipName {
  if (reducedMotion) return "Idle";
  if (intro === "pending" || intro === "hello") return finished.has("Wave") ? "Talk" : "Wave";
  if (moving) return "Travel";
  if (RETURN_TO_IDLE.has(stopClip) && finished.has(stopClip)) return "Idle";
  return stopClip;
}
```

- [ ] **Step 4: Run** — all pass. **Step 5: Commit** — `git add -A && git commit -m "feat(guide): add arrival-based clip state machine"`.

### Task 7: Intro state machine

**Files:**
- Create: `web/src/guide/introMachine.ts`
- Test: `web/src/guide/__tests__/introMachine.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { introReducer, type IntroEvent } from "../introMachine";
import type { IntroPhase } from "../types";

const run = (events: IntroEvent[], from: IntroPhase = "pending") => events.reduce(introReducer, from);

describe("introReducer", () => {
  it("runs the happy path", () => {
    expect(run(["MODEL_READY"])).toBe("hello");
    expect(run(["MODEL_READY", "HELLO_DONE"])).toBe("leaving");
    expect(run(["MODEL_READY", "HELLO_DONE", "ARRIVED"])).toBe("done");
  });
  it("skips the intro for a returning session or reduced motion", () => {
    expect(run(["ALREADY_SEEN"])).toBe("done");
    expect(run(["REDUCED_MOTION"])).toBe("done");
  });
  it("ends the intro when the visitor scrolls away (no skip button, D3)", () => {
    expect(run(["MODEL_READY", "LEFT_HERO"])).toBe("done");
  });
  it("gives up only if the model never loaded", () => {
    expect(run(["LOAD_TIMEOUT"])).toBe("done");
    expect(run(["MODEL_READY", "LOAD_TIMEOUT"])).toBe("hello");
  });
  it("ignores events that don't apply", () => {
    expect(run(["HELLO_DONE"])).toBe("pending");
    expect(run(["ARRIVED"])).toBe("pending");
  });
  it("never leaves done", () => {
    expect(run(["MODEL_READY", "HELLO_DONE"], "done")).toBe("done");
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `web/src/guide/introMachine.ts`**

```ts
import type { IntroPhase } from "./types";

export type IntroEvent =
  | "MODEL_READY" | "HELLO_DONE" | "ARRIVED" | "LEFT_HERO" | "LOAD_TIMEOUT" | "ALREADY_SEEN" | "REDUCED_MOTION";

/** docs/04-system-design.md §4.1 */
export function introReducer(phase: IntroPhase, event: IntroEvent): IntroPhase {
  if (phase === "done") return "done";
  switch (event) {
    case "ALREADY_SEEN":
    case "REDUCED_MOTION":
    case "LEFT_HERO":
      return "done";
    case "LOAD_TIMEOUT":
      return phase === "pending" ? "done" : phase;
    case "MODEL_READY":
      return phase === "pending" ? "hello" : phase;
    case "HELLO_DONE":
      return phase === "hello" ? "leaving" : phase;
    case "ARRIVED":
      return phase === "leaving" ? "done" : phase;
  }
}
```

- [ ] **Step 4: Run** — all pass. **Step 5: Commit** — `git add -A && git commit -m "feat(guide): add intro state machine"`.

### Task 8: Guide store

**Files:**
- Create: `web/src/guide/store.ts`
- Test: `web/src/guide/__tests__/store.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { createGuideStore, INITIAL_STATE } from "../store";
import { GUIDE_STOPS } from "../config";

const hero = GUIDE_STOPS[0];
const skills = GUIDE_STOPS.find((s) => s.id === "skills")!;

describe("guide store", () => {
  it("does not notify when nothing changed (R5.3)", () => {
    const store = createGuideStore();
    const spy = vi.fn();
    store.subscribe(spy);
    store.set({ mode: INITIAL_STATE.mode });
    expect(spy).not.toHaveBeenCalled();
    store.set({ mode: "compact" });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("clears the bubble on section change and ends the intro when leaving the hero", () => {
    const store = createGuideStore();
    store.markModelReady();
    store.say("hello");
    store.setSection("journey");
    expect(store.getState().bubble).toBeNull();
    expect(store.getState().intro).toBe("done");
  });

  it("finishes the intro on arrival, then speaks the hero line once", () => {
    const store = createGuideStore();
    store.markModelReady();
    store.dispatchIntro("HELLO_DONE");
    store.arrive(hero);
    expect(store.getState().intro).toBe("done");
    expect(store.getState().bubble?.text).toBe(hero.line);
    store.set({ bubble: null });
    store.arrive(hero);
    expect(store.getState().bubble).toBeNull();
  });

  it("stays quiet on arrival while the intro is still saying hello", () => {
    const store = createGuideStore();
    store.markModelReady();
    store.arrive(skills);
    expect(store.getState().bubble).toBeNull();
  });

  it("gives each bubble a new key so the typewriter restarts", () => {
    const store = createGuideStore();
    store.say("a");
    const first = store.getState().bubble!.key;
    store.say("a");
    expect(store.getState().bubble!.key).toBe(first + 1);
  });
});
```

- [ ] **Step 2: Run** — FAIL.

- [ ] **Step 3: Implement `web/src/guide/store.ts`**

```ts
import { useSyncExternalStore } from "react";
import { introReducer, type IntroEvent } from "./introMachine";
import type { GuideState, GuideStop } from "./types";

export const INITIAL_STATE: GuideState = {
  enabled: true,
  mode: "wide",
  reducedMotion: false,
  section: null,
  intro: "pending",
  modelReady: false,
  bubble: null,
};

/** One store, discrete writers only; per-frame code reads getState() (docs/03 §6). */
export function createGuideStore(initial: GuideState = INITIAL_STATE) {
  let state = initial;
  let bubbleKey = 0;
  const listeners = new Set<() => void>();
  const spoken = new Set<string>();

  const set = (partial: Partial<GuideState>) => {
    const keys = Object.keys(partial) as (keyof GuideState)[];
    if (!keys.some((k) => !Object.is(partial[k], state[k]))) return;
    state = { ...state, ...partial };
    listeners.forEach((l) => l());
  };
  const dispatchIntro = (event: IntroEvent) => set({ intro: introReducer(state.intro, event) });
  const say = (text: string) => set({ bubble: { text, key: ++bubbleKey } });

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => void listeners.delete(listener);
    },
    set,
    say,
    dispatchIntro,
    setSection(id: string) {
      if (id === state.section) return;
      set({ section: id, bubble: null });
      if (id !== "hero") dispatchIntro("LEFT_HERO");
    },
    markModelReady() {
      set({ modelReady: true });
      dispatchIntro("MODEL_READY");
    },
    arrive(stop: GuideStop) {
      if (state.intro === "leaving") dispatchIntro("ARRIVED");
      if (state.intro !== "done" || !stop.line || spoken.has(stop.id)) return;
      spoken.add(stop.id);
      say(stop.line);
    },
  };
}

export type GuideStore = ReturnType<typeof createGuideStore>;
export const guideStore = createGuideStore();

export function useGuide<T>(selector: (s: GuideState) => T): T {
  return useSyncExternalStore(
    guideStore.subscribe,
    () => selector(guideStore.getState()),
    () => selector(INITIAL_STATE),
  );
}
```

- [ ] **Step 4: Run** — all pass (5 files, ~25 tests). Also run `npm run typecheck` → no errors.

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(guide): add external guide store"`.

---

## Chunk 3: Guide runtime

### Task 9: Dependencies, placeholder model, environment helpers

**Files:**
- Create: `web/public/guide/robot-expressive.glb`, `web/THIRD_PARTY.md`, `web/src/guide/environment.ts`, `web/src/guide/bubbleAnchor.ts`, `web/src/guide/highlight.ts`
- Modify: `web/src/app/globals.css`

- [ ] **Step 1: Install 3D deps**

```bash
npm install three@^0.186 @react-three/fiber@^9.8 @react-three/drei@^10.7 maath@^0.10
npm install -D @types/three@^0.186
```

Expected: no peer-dependency errors (React 19.3 is inside R3F's `>=19 <19.4`).

- [ ] **Step 2: Download the placeholder and check its clips**

```bash
mkdir -p public/guide
curl -fL -o public/guide/robot-expressive.glb \
  https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb
npx @gltf-transform/cli@4.5.1 inspect public/guide/robot-expressive.glb | grep -E "Wave|Yes|ThumbsUp|Idle|Walking"
```

Expected: each of `Wave`, `Yes`, `ThumbsUp`, `Idle`, `Walking` appears.

- [ ] **Step 3: `web/THIRD_PARTY.md`**

```markdown
# Third-party material

- RobotExpressive.glb (public/guide/robot-expressive.glb): model by Tomás Laulhé (Quaternius), modified by Don McCurdy; CC0 1.0. Source: three.js examples.
- Patterns adapted from dayinji/sen-3d-resume (MIT, © its author): fixed pointer-events-none canvas over native scroll, DOM-anchored stops, frame-rate-independent damping. See docs/01-references.md R2.
```

- [ ] **Step 4: `web/src/guide/environment.ts`**

```ts
import { guideStore } from "./store";

export const WIDE_QUERY = "(min-width: 1280px)";
export const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
export const GUIDE_ENABLED_KEY = "guide:enabled";
export const INTRO_SEEN_KEY = "guide:intro-seen";

type Area = "local" | "session";
const area = (a: Area) => (a === "local" ? window.localStorage : window.sessionStorage);

// Storage can throw (private mode, blocked site data): never let that break the page (R5.1).
export function readStorage(a: Area, key: string): string | null {
  try { return area(a).getItem(key); } catch { return null; }
}
export function writeStorage(a: Area, key: string, value: string) {
  try { area(a).setItem(key, value); } catch { /* not persisted */ }
}

export function hasWebGL(): boolean {
  try { return !!document.createElement("canvas").getContext("webgl2"); } catch { return false; }
}

/** Called once before the guide chunk mounts, so a returning session never flashes the intro. */
export function primeGuideState() {
  const reduced = window.matchMedia(REDUCED_QUERY).matches;
  guideStore.set({
    enabled: readStorage("local", GUIDE_ENABLED_KEY) !== "0" && hasWebGL(),
    mode: window.matchMedia(WIDE_QUERY).matches ? "wide" : "compact",
    reducedMotion: reduced,
  });
  if (reduced) guideStore.dispatchIntro("REDUCED_MOTION");
  else if (readStorage("session", INTRO_SEEN_KEY) === "1") guideStore.dispatchIntro("ALREADY_SEEN");
}
```

- [ ] **Step 5: `web/src/guide/bubbleAnchor.ts`** (written every frame by the avatar, read every frame by the bubble; never React state)

```ts
export const bubbleAnchor = { x: 0, top: 0, visible: false };
```

- [ ] **Step 6: `web/src/guide/highlight.ts`**

```ts
const timers = new WeakMap<Element, number>();

/** Flash the guide's highlight ring on a target for 1.6 s (docs/02 §5). */
export function flashHighlight(selector: string) {
  const el = document.querySelector(selector);
  if (!el) return;
  const previous = timers.get(el);
  if (previous) window.clearTimeout(previous);
  el.classList.add("guide-highlight");
  timers.set(el, window.setTimeout(() => {
    el.classList.remove("guide-highlight");
    timers.delete(el);
  }, 1600));
}
```

- [ ] **Step 7: Append to `web/src/app/globals.css`**

```css
/* ---- Avatar guide ---- */
@media (min-width: 1280px) {
  html:not([data-guide="off"]) main {
    padding-left: var(--rail-width);
  }
}

#hero > * {
  transition: opacity 400ms ease;
}
html[data-guide-intro="hello"] #hero > * {
  opacity: 0.15;
  transition-duration: 300ms;
}

.guide-highlight {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 4px;
  border-radius: 8px;
  animation: guide-pulse 0.8s ease-in-out 2;
}
@keyframes guide-pulse {
  50% {
    outline-offset: 8px;
    outline-color: transparent;
  }
}

@media (prefers-reduced-motion: reduce) {
  #hero > * {
    transition: none;
  }
  .guide-highlight {
    animation: none;
  }
}
```

- [ ] **Step 8: Verify** — `npm run typecheck && npm test` → pass. **Commit** — `git add -A && git commit -m "feat(guide): add 3D deps, placeholder model and environment helpers"`.

### Task 10: Section observer, intro driver, environment hook

**Files:**
- Create: `web/src/guide/useActiveSection.ts`, `web/src/guide/useIntroSequence.ts`, `web/src/guide/useGuideEnvironment.ts`

- [ ] **Step 1: `useActiveSection.ts`** (event-driven version of [R2.3])

```ts
"use client";
import { useEffect } from "react";
import { guideStore } from "./store";

/** The section crossing a 10% band through the viewport's middle is active (docs/04 §5). */
export function useActiveSection(ids: readonly string[]) {
  useEffect(() => {
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) guideStore.setSection(entry.target.id);
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
}
```

- [ ] **Step 2: `useIntroSequence.ts`** (the only place intro timers live; each is cleared on phase change)

```ts
"use client";
import { useEffect } from "react";
import { INTRO } from "./config";
import { INTRO_SEEN_KEY, writeStorage } from "./environment";
import { guideStore, useGuide } from "./store";

export function useIntroSequence() {
  const intro = useGuide((s) => s.intro);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!guideStore.getState().modelReady) guideStore.dispatchIntro("LOAD_TIMEOUT");
    }, INTRO.loadTimeoutMs);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.guideIntro = intro;
    if (intro === "hello") {
      guideStore.say(INTRO.line);
      const t = window.setTimeout(() => guideStore.dispatchIntro("HELLO_DONE"), INTRO.helloMs);
      return () => window.clearTimeout(t);
    }
    if (intro === "leaving") guideStore.set({ bubble: null });
    if (intro === "done") writeStorage("session", INTRO_SEEN_KEY, "1");
  }, [intro]);
}
```

- [ ] **Step 3: `useGuideEnvironment.ts`**

```ts
"use client";
import { useEffect } from "react";
import { REDUCED_QUERY, WIDE_QUERY } from "./environment";
import { guideStore } from "./store";

/** Keeps mode and reduced-motion current when the window or OS setting changes. */
export function useGuideEnvironment() {
  useEffect(() => {
    const wide = window.matchMedia(WIDE_QUERY);
    const reduce = window.matchMedia(REDUCED_QUERY);
    const sync = () => guideStore.set({ mode: wide.matches ? "wide" : "compact", reducedMotion: reduce.matches });
    wide.addEventListener("change", sync);
    reduce.addEventListener("change", sync);
    return () => {
      wide.removeEventListener("change", sync);
      reduce.removeEventListener("change", sync);
    };
  }, []);
}
```

- [ ] **Step 4: Verify** — `npm run typecheck && npm run lint` → clean. **Commit** — `git add -A && git commit -m "feat(guide): add section observer, intro driver and environment hook"`.

### Task 11: Canvas and avatar

**Files:**
- Create: `web/src/guide/GuideAvatar.tsx`, `web/src/guide/GuideCanvas.tsx`

- [ ] **Step 1: `GuideAvatar.tsx`** (frame loop from docs/04 §2)

```tsx
"use client";
import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useAnimations, useGLTF } from "@react-three/drei";
import { easing } from "maath";
import * as THREE from "three";
import { pxToWorld, resolveAnchor } from "./anchors";
import { bubbleAnchor } from "./bubbleAnchor";
import { nextClip } from "./clipMachine";
import { MODEL, stopFor } from "./config";
import { flashHighlight } from "./highlight";
import { guideStore } from "./store";
import type { ClipName } from "./types";

const ARRIVE_PX = 4;
const MAX_YAW = 0.6; // rad (~34°), inside the ±70° limit in docs/02 §5
const LOGICAL = Object.keys(MODEL.clipMap) as ClipName[];

// Scratch objects: nothing is allocated inside useFrame (R2.6; R1's Background.jsx did).
const target = new THREE.Vector3();
const targetScale = new THREE.Vector3();
const yawTarget = new THREE.Euler();

export function GuideAvatar() {
  const root = useRef<THREE.Group>(null!);
  const body = useRef<THREE.Group>(null!);
  const { scene, animations } = useGLTF(MODEL.url);
  const { actions, mixer } = useAnimations(animations, body);
  const size = useThree((s) => s.size);

  const { height, centerY } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    return { height: box.getSize(new THREE.Vector3()).y || 1, centerY: box.getCenter(new THREE.Vector3()).y };
  }, [scene]);

  const current = useRef<ClipName | null>(null);
  const finished = useRef(new Set<ClipName>());
  const placed = useRef(false);
  const lastStop = useRef<string | null>(null);
  const arrivedAt = useRef<string | null>(null);
  const targetEl = useRef<Element | null>(null);

  useEffect(() => {
    guideStore.markModelReady();
    return () => void (bubbleAnchor.visible = false);
  }, []);

  useEffect(() => {
    const onFinished = (e: { action: THREE.AnimationAction }) => {
      const name = e.action.getClip().name;
      for (const c of LOGICAL) if (MODEL.clipMap[c] === name) finished.current.add(c);
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [mixer]);

  const play = (clip: ClipName) => {
    const name = MODEL.clipMap[clip];
    const next = actions[name];
    if (!next) return;
    const prevName = current.current ? MODEL.clipMap[current.current] : null;
    if (prevName && prevName !== name) actions[prevName]?.fadeOut(0.3);
    finished.current.delete(clip);
    next.reset();
    if (MODEL.once.includes(clip)) {
      next.setLoop(THREE.LoopOnce, 1);
      next.clampWhenFinished = true;
    } else {
      next.setLoop(THREE.LoopRepeat, Infinity);
    }
    next.fadeIn(prevName === name ? 0 : 0.3).play(); // crossfade as in R1.5
    current.current = clip;
  };

  useFrame((_, dt) => {
    const s = guideStore.getState();
    const stop = stopFor(s.section);
    const v = { w: size.width, h: size.height };
    const inIntro = s.intro === "pending" || s.intro === "hello";

    const anchor = resolveAnchor(stop, s.mode, s.intro, v);
    const world = pxToWorld(anchor, v);
    target.set(world.x, world.y, 0);
    targetScale.setScalar(anchor.heightPx / height);

    if (stop.id !== lastStop.current) {
      lastStop.current = stop.id;
      arrivedAt.current = null;
      finished.current.delete(stop.clip);
      targetEl.current = stop.target ? document.querySelector(stop.target) : null;
    }

    if (!placed.current || s.reducedMotion) {
      root.current.position.copy(target);
      root.current.scale.copy(targetScale);
      placed.current = true;
    } else {
      easing.damp3(root.current.position, target, 0.35, dt);
      easing.damp3(root.current.scale, targetScale, 0.35, dt);
    }
    const moving = root.current.position.distanceTo(target) > ARRIVE_PX;

    if (!moving && !inIntro && arrivedAt.current !== stop.id) {
      arrivedAt.current = stop.id;
      guideStore.arrive(stop);
      if (stop.target) flashHighlight(stop.target);
    }

    let yaw = 0;
    if (!inIntro && targetEl.current) {
      const r = targetEl.current.getBoundingClientRect();
      const avatarX = root.current.position.x + v.w / 2;
      yaw = Math.sign(r.left + r.width / 2 - avatarX) * MAX_YAW;
    }
    yawTarget.set(0, yaw, 0);
    if (s.reducedMotion) body.current.rotation.copy(yawTarget);
    else easing.dampE(body.current.rotation, yawTarget, 0.25, dt);

    const clip = nextClip({ intro: s.intro, moving, reducedMotion: s.reducedMotion, stopClip: stop.clip, finished: finished.current });
    if (clip !== current.current) play(clip);

    const heightPx = root.current.scale.y * height;
    bubbleAnchor.x = root.current.position.x + v.w / 2;
    bubbleAnchor.top = v.h / 2 - root.current.position.y - heightPx / 2;
    bubbleAnchor.visible = true;
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <group position-y={-centerY}>
          <primitive object={scene} />
        </group>
      </group>
    </group>
  );
}

useGLTF.preload(MODEL.url);
```

- [ ] **Step 2: `GuideCanvas.tsx`**

```tsx
"use client";
import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { GuideAvatar } from "./GuideAvatar";

function PauseWhenHidden() {
  const setFrameloop = useThree((s) => s.setFrameloop);
  useEffect(() => {
    const onVisibility = () => setFrameloop(document.hidden ? "never" : "always");
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [setFrameloop]);
  return null;
}

/** Fixed, transparent, click-through overlay (ADR-0001). Orthographic, 1 unit = 1 CSS px (ADR-0002). */
export function GuideCanvas() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 1000], zoom: 1, near: 1, far: 4000 }}
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      style={{ position: "fixed", inset: 0, zIndex: 40, pointerEvents: "none" }}
      aria-hidden="true"
      data-testid="guide-canvas"
    >
      <hemisphereLight args={["#FFF4EA", "#5D4037", 1.1]} />
      <directionalLight position={[400, 600, 800]} intensity={1.6} color="#FFE2CC" />
      <PauseWhenHidden />
      <Suspense fallback={null}>
        <GuideAvatar />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 3: Verify** — `npm run typecheck` → clean. (Visual check happens in Task 12, once it is mounted.)

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat(guide): add canvas and avatar frame loop"`.

### Task 12: Speech bubble, root, loader, toggle; mount on the page

**Files:**
- Create: `web/src/guide/useTypewriter.ts`, `web/src/guide/SpeechBubble.tsx`, `web/src/guide/GuideRoot.tsx`, `web/src/guide/GuideLoader.tsx`, `web/src/guide/GuideToggle.tsx`
- Modify: `web/src/app/page.tsx`, `web/src/components/sections/Navbar.tsx`

- [ ] **Step 1: `useTypewriter.ts`** (pattern [R3.1], with React cleanup)

```ts
"use client";
import { useEffect, useState } from "react";

/** Reveals `full` at `cps` characters per second; a new `key` restarts it. cps = Infinity shows it at once. */
export function useTypewriter(full: string, key: number, cps: number) {
  const [progress, setProgress] = useState({ key, count: 0 });
  const count = progress.key === key ? progress.count : 0;

  useEffect(() => {
    if (!Number.isFinite(cps)) return;
    const id = window.setInterval(() => {
      setProgress((p) => {
        const c = p.key === key ? p.count : 0;
        if (c >= full.length) {
          window.clearInterval(id);
          return { key, count: c };
        }
        return { key, count: c + 1 };
      });
    }, 1000 / cps);
    return () => window.clearInterval(id);
  }, [full, key, cps]);

  const shown = Number.isFinite(cps) ? count : full.length;
  return { text: full.slice(0, shown), finish: () => setProgress({ key, count: full.length }) };
}
```

- [ ] **Step 2: `SpeechBubble.tsx`**

```tsx
"use client";
import { useEffect, useRef } from "react";
import { bubbleAnchor } from "./bubbleAnchor";
import { guideStore, useGuide } from "./store";
import { useTypewriter } from "./useTypewriter";

export function SpeechBubble() {
  const bubble = useGuide((s) => s.bubble);
  const mode = useGuide((s) => s.mode);
  const reduced = useGuide((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const { text, finish } = useTypewriter(bubble?.text ?? "", bubble?.key ?? 0, reduced ? Infinity : 35);
  const maxWidth = mode === "wide" ? 248 : 220;

  // Follow the avatar's head every frame without React re-renders.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const left = Math.min(Math.max(12, bubbleAnchor.x - maxWidth / 2), window.innerWidth - maxWidth - 12);
        el.style.transform = `translate3d(${left}px, ${bubbleAnchor.top - 12}px, 0) translateY(-100%)`;
        el.style.visibility = bubbleAnchor.visible ? "visible" : "hidden";
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [maxWidth]);

  // Compact mode: bubbles auto-hide after 5 s (docs/02 §2).
  useEffect(() => {
    if (!bubble || mode !== "compact") return;
    const t = window.setTimeout(() => guideStore.set({ bubble: null }), 5000);
    return () => window.clearTimeout(t);
  }, [bubble, mode]);

  if (!bubble) return null;
  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      data-testid="guide-bubble"
      onClick={finish}
      style={{ position: "fixed", left: 0, top: 0, zIndex: 45, width: maxWidth, visibility: "hidden" }}
      className="rounded-[14px] border border-accent-cream bg-surface-light px-4 py-3 pr-8 text-sm leading-snug text-text-primary shadow-card-lg"
    >
      {text}
      <button
        type="button"
        aria-label="Hide guide message"
        onClick={(e) => {
          e.stopPropagation();
          guideStore.set({ bubble: null });
        }}
        className="absolute right-2 top-2 text-text-secondary hover:text-text-primary"
      >
        ×
      </button>
    </div>
  );
}
```

- [ ] **Step 3: `GuideRoot.tsx`** (default export, loaded lazily)

```tsx
"use client";
import { Component, useEffect, type ReactNode } from "react";
import { SECTION_IDS } from "./config";
import { GuideCanvas } from "./GuideCanvas";
import { SpeechBubble } from "./SpeechBubble";
import { guideStore, useGuide } from "./store";
import { useActiveSection } from "./useActiveSection";
import { useGuideEnvironment } from "./useGuideEnvironment";
import { useIntroSequence } from "./useIntroSequence";

/** A failed GLB load or WebGL error removes the guide quietly (docs/04 §8). */
class GuideErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    guideStore.dispatchIntro("LOAD_TIMEOUT");
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function GuideRoot() {
  useGuideEnvironment();
  useActiveSection(SECTION_IDS);
  useIntroSequence();

  const section = useGuide((s) => s.section);
  useEffect(() => {
    if (section) document.documentElement.dataset.guideSection = section;
  }, [section]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.guideIntro;
      delete document.documentElement.dataset.guideSection;
    },
    [],
  );

  return (
    <GuideErrorBoundary>
      <GuideCanvas />
      <SpeechBubble />
    </GuideErrorBoundary>
  );
}
```

- [ ] **Step 4: `GuideLoader.tsx`** (client wrapper: `ssr: false` dynamic imports are not allowed in server components)

```tsx
"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { primeGuideState } from "./environment";
import { useGuide } from "./store";

const GuideRoot = dynamic(() => import("./GuideRoot"), { ssr: false });

/** Loads the 3D guide after the page is idle, so it never delays first paint (docs/04 §1). */
export function GuideLoader() {
  const enabled = useGuide((s) => s.enabled);
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    primeGuideState();
    // typeof, not `in`: lib.dom always declares requestIdleCallback, so `in` would narrow the else branch to never.
    // Safari still lacks it at runtime.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => setIdle(true), 1200);
    return () => window.clearTimeout(id);
  }, []);

  return idle && enabled ? <GuideRoot /> : null;
}
```

- [ ] **Step 5: `GuideToggle.tsx`** (pattern [R5.1])

```tsx
"use client";
import { GUIDE_ENABLED_KEY, writeStorage } from "./environment";
import { guideStore, useGuide } from "./store";

export function GuideToggle() {
  const enabled = useGuide((s) => s.enabled);
  const toggle = () => {
    const next = !enabled;
    guideStore.set({ enabled: next });
    writeStorage("local", GUIDE_ENABLED_KEY, next ? "1" : "0");
    if (next) delete document.documentElement.dataset.guide;
    else document.documentElement.dataset.guide = "off";
  };
  return (
    <button
      type="button"
      aria-pressed={enabled}
      onClick={toggle}
      className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
    >
      Guide {enabled ? "on" : "off"}
    </button>
  );
}
```

- [ ] **Step 6: Mount** — in `web/src/app/page.tsx` add `import { GuideLoader } from "@/guide/GuideLoader";` and render `<GuideLoader />` right after `</main>`. In `Navbar.tsx` add `import { GuideToggle } from "@/guide/GuideToggle";` and insert `<GuideToggle />` (a) after the desktop `NAV_LINKS.map(...)` inside `<div className="hidden md:flex items-center gap-8">`, (b) before the burger button inside `<div className="flex md:hidden items-center gap-4">`.

- [ ] **Step 7: See it work**

Run: `npm run dev`, open http://localhost:3000 at 1440×900 in a fresh private window.
Expected: robot appears centred and waves, bubble types the intro line, hero is dimmed; ~4 s later it walks into the left rail and does a thumbs-up toward "View Resume", which flashes a ring; the bubble shows the resume line. Scroll: it walks with you and points at each section. Reload: no intro. Narrow the window below 1280 px: it shrinks to the bottom-left corner.

- [ ] **Step 8: Tune** — adjust `wide.y` values in `config.ts` until the avatar sits level with each section's content (docs/06 anchor table). Commit the tuned numbers.

- [ ] **Step 9: Commit** — `git add -A && git commit -m "feat(guide): mount guide with speech bubble, loader and toggle"`.

### Task 13: End-to-end tests

**Files:**
- Create: `web/e2e/guide.spec.ts`

- [ ] **Step 1: Write the tests**

```ts
import { expect, test, type Page } from "@playwright/test";

const html = (page: Page) => page.locator("html");
const bubble = (page: Page) => page.getByTestId("guide-bubble");
const scrollToSection = (page: Page, id: string) =>
  page.evaluate((s) => document.getElementById(s)!.scrollIntoView({ block: "center" }), id);

test("intro plays once per session", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", "hello", { timeout: 20_000 });
  await expect(bubble(page)).toContainText("Hi, I'm Kunj", { timeout: 10_000 });
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 20_000 });
  await expect(bubble(page)).toContainText("My resume is right here", { timeout: 10_000 });

  await page.reload();
  await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done");
});

test("points at each section while scrolling", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", /hello|done/, { timeout: 20_000 });
  await scrollToSection(page, "skills");
  await expect(html(page)).toHaveAttribute("data-guide-section", "skills");
  await expect(bubble(page)).toContainText("toolbox", { timeout: 15_000 });
});

test("reserves the rail on wide screens", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveCSS("padding-left", "280px");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("docks bottom-left and keeps content full width", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveCSS("padding-left", "0px");
    await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 25_000 });
    const box = await bubble(page).boundingBox();
    expect(box && box.x).toBeLessThan(40);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("skips the intro but still speaks", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
    await expect(html(page)).toHaveAttribute("data-guide-intro", "done");
    await expect(bubble(page)).toContainText("My resume is right here", { timeout: 10_000 });
  });
});

test("guide can be turned off and stays off", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
  await page.getByRole("button", { name: /Guide on/ }).click();
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("main")).toHaveCSS("padding-left", "0px");
  await page.waitForTimeout(3000);
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
});
```

- [ ] **Step 2: Run** — `npm run build && npm run e2e`
Expected: 7 passed (1 smoke + 6 guide). If WebGL fails in headless Chromium, the error boundary hides the guide and the guide tests fail on the canvas wait. Check the trace (`npx playwright show-trace`); the fix is in the launch args, not the app.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "test(guide): add end-to-end guide tests"`.

---

## Chunk 4: Real avatar, quality, hosting

### Task 14: Swap in Kunj's avatar

Blocked on Kunj: `docs/05-avatar-pipeline.md` steps 1–3 (photo, MetaPerson export, Mixamo clips).

- [ ] **Step 1:** Run steps 4–5 of `docs/05-avatar-pipeline.md` (Blender merge, gltf-transform optimize).
- [ ] **Step 2: Check the asset**

```bash
npx @gltf-transform/cli@4.5.1 inspect public/guide/kunj.glb | grep -E "Wave|Talk|Point|Idle|Travel|ThumbsUp"
stat -f%z public/guide/kunj.glb   # must print ≤ 2621440
```

- [ ] **Step 3:** Update `MODEL` in `config.ts` (docs/05 step 6). Run `npm test` (the clipMap test still passes).
- [ ] **Step 4:** `npm run dev` and walk every section; re-tune `wide.y` (the new model's proportions differ from the robot's).
- [ ] **Step 5:** `npm run build && npm run e2e` → all pass.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat(guide): use Kunj's avatar"`.

### Task 15: Performance and accessibility pass

- [ ] **Step 1:** `npm run build` and note the guide chunk size in the build output. Budget ≤ 260 KB gzip (docs/04 §6). If over, check that only `useGLTF`/`useAnimations` are imported from drei.
- [ ] **Step 2:** Lighthouse (Chrome DevTools, mobile preset, 3 runs) on `npx serve out` and on https://kunjpandya.vercel.app. Record medians in `docs/perf-2026-xx-xx.md`. Pass: Performance ≥ 85, Accessibility ≥ 95, LCP ≤ live + 100 ms, CLS 0.
- [ ] **Step 3:** Chrome Performance panel, 10 s of scrolling at 1440×900: frame time ≤ 8 ms. In dev, `renderer.info.render.calls` ≤ 15.
- [ ] **Step 4:** Safari and Firefox: intro, scroll, toggle. VoiceOver: the bubble is announced once per section; the canvas is not announced.
- [ ] **Step 5:** Fix what fails, re-run, commit — `git commit -am "perf/a11y: meet guide budgets"`.

### Task 16: CI and hosting

**Files:**
- Create: `.github/workflows/ci.yml`, `web/vercel.json`, `web/public/_headers`

- [ ] **Step 1: `.github/workflows/ci.yml`**

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  web:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run e2e
```

- [ ] **Step 2:** Create `web/vercel.json` and `web/public/_headers` with the contents in `docs/07-hosting.md` §4 and §5.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "ci: add workflow and host headers"`.
- [ ] **Step 4: Ask Kunj** before publishing anything. With approval: `gh auth status` (KPandya1903 active), then `gh repo create KPandya1903/portfolio-3d --private --source . --push`.
- [ ] **Step 5:** Kunj imports the repo in the Vercel dashboard (docs/07 §4) and in Cloudflare Pages (docs/07 §5). Record both URLs in `README.md`.
- [ ] **Step 6:** Verify both: `curl -sI <url>/guide/robot-expressive.glb | grep -i cache-control` shows `immutable`; open each URL and watch the intro.
- [ ] **Step 7:** Cutover to kunjpandya.vercel.app only via docs/07 §8, after Task 15 passes.

---

## Self-review notes (writing-plans review loop)

The skill's reviewer subagent was not dispatched (Kunj did not ask for subagents). Checked by hand against the spec docs:
- Every module in docs/03 §4 has a creating task; every pure module has a failing-test-first step.
- Every reference defect in docs/01 R1 has a guard: single store (Task 8), no clip timers (Task 6), no per-frame allocation (Task 11), real listener cleanup (Tasks 10–12), no leva, `htmlFor` (none needed: no form).
- Kunj's decisions D1–D5 map to Task 14 (look-alike), `compact` mode (Tasks 5, 13), session-once intro without skip (Tasks 7, 10, 13), no audio (nothing plays sound), rail (Tasks 9, 13).
- Known risk: `stopFor` returns the hero stop while `section` is null, so on a mid-page reload the avatar heads to the hero spot for one frame before the observer fires. Harmless (it is placed without damping on the first frame and immediately retargets).
