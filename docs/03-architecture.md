# 03 — Architecture

## 1. Stack

| Layer | Choice | Version (npm, 2026-10-05) | Why |
|---|---|---|---|
| Framework | Next.js App Router, `output: "export"` | 16.3 | Same framework as the live site; static export means any static host works ([ADR-0003](adr/0003-static-export.md)) |
| UI | React | 19.3 | Inside R3F 9's peer range (`>=19 <19.4`). **Pin `~19.3.0`** |
| Language | TypeScript, strict | 5.x | — |
| Styling | Tailwind CSS | 4.3 | Tokens as CSS variables ([02](02-layout.md) §4) |
| DOM motion | framer-motion | 12 | Section reveal animations (as on the live site) |
| 3D | three | 0.186 | — |
| React renderer for three | @react-three/fiber | 9.8 | React 19 support. Same combo as [R3](01-references.md) |
| 3D helpers | @react-three/drei | 10.7 | `useGLTF`, `useAnimations`, `useProgress` only |
| Easing | maath | 0.10 | `easing.damp3` / `dampE` ([ADR-0004](adr/0004-maath-over-framer-motion-3d.md)) |
| Unit tests | Vitest | 5 | Pure guide logic |
| E2E tests | Playwright | 1.63 | Intro, scroll, modes, reduced motion |
| Asset tooling | @gltf-transform/cli | 4.5 | Via `npx`, not a dependency |

Not used, on purpose: gsap, lenis (native scroll only), jotai/zustand (a 30-line store is enough), leva,
framer-motion-3d (incompatible with R3F 9), postprocessing (cost without benefit for one character).

## 2. System context

```
                ┌───────────────────────────────────────────┐
 Visitor ──────▶│ Static host (Vercel Hobby; CF Pages backup)│
 (browser)      │  /index.html  /_next/*  /guide/kunj.glb    │
                │  /Kunj_Pandya_Resume.pdf                   │
                └───────────────────────────────────────────┘
                         ▲  git push (main / branches)
                         │
                ┌────────┴─────────┐        ┌──────────────────────┐
                │ GitHub repo       │◀───────│ Kunj's machine        │
                │ KPandya1903/      │        │ web/ (Next app)       │
                │ portfolio-3d      │        │ assets/ (source GLB)  │
                └──────────────────┘        └──────────────────────┘
 No server, no database, no API keys. Analytics: Vercel Web Analytics (optional, free tier).
```

## 3. Runtime component map

```
app/layout.tsx  (server)
└─ app/page.tsx  (server; renders all content as static HTML)
   ├─ <Navbar/>                  client: anchors + <GuideToggle/>
   ├─ <main class="guide-rail-offset">
   │    <Hero/> <Journey/> <About/> <Experience/> <Projects/> <LinkedIn/> <Skills/> <Contact/>
   │    (each <section id="…">, targets carry data-guide-target="…")
   └─ <GuideRoot/>               client island, loaded with next/dynamic({ ssr: false })
        ├─ useGuideEnvironment()    width mode, reduced motion, guide on/off, intro-seen flag
        ├─ useActiveSection(ids)    IntersectionObserver → store.section
        ├─ useIntroSequence()       intro state machine driver (timers live here, cleaned up)
        ├─ <GuideCanvas>            fixed, transparent, pointer-events:none, orthographic camera
        │    └─ <Suspense fallback={null}>
        │         └─ <GuideAvatar/>   GLB + clips, per-frame: anchor → damp → yaw → head → clip
        └─ <SpeechBubble/>          DOM, positioned by the avatar's projected head each frame
```

Server components render all text, so the content is in the HTML for crawlers and for no-JS visitors. The guide is
a client-only island that adds nothing to the server HTML.

## 4. Directory tree (target)

```
portfolio-3d/
├─ README.md
├─ docs/                          (this documentation)
├─ assets/                        source files, NOT deployed
│  ├─ avatar/kunj-metaperson.glb  MetaPerson export (D1)
│  ├─ clips/*.fbx                 Mixamo downloads
│  └─ build-guide-glb.md          exact commands that produce web/public/guide/kunj.glb
└─ web/                           the Next.js app (Vercel/Cloudflare root directory)
   ├─ package.json  next.config.ts  tsconfig.json  postcss.config.mjs  vitest.config.ts  playwright.config.ts
   ├─ THIRD_PARTY.md              attribution (sen-3d-resume MIT, RobotExpressive CC0)
   ├─ public/
   │  ├─ guide/robot-expressive.glb   placeholder (CC0)
   │  ├─ guide/kunj.glb               final avatar + clips (≤ 2.5 MB)
   │  └─ Kunj_Pandya_Resume.pdf
   ├─ src/                    (same layout as the live site, so its files copy across unchanged)
   │  ├─ app/            layout.tsx  page.tsx  globals.css  robots.ts  sitemap.ts
   │  ├─ data/           metadata.ts  experience.ts  projects.ts  skills.ts  timeline.ts  education.ts  achievements.ts  linkedinPosts.ts
   │  ├─ components/
   │  │  ├─ sections/    Navbar  Hero  Journey  About  Experience  Projects  ProjectCarousel  LinkedIn  Skills  Contact
   │  │  ├─ ui/          Button  ExperienceCard  ProjectCard  SkillBadge
   │  │  └─ animations/  FadeIn  ScrollReveal
   │  ├─ lib/            constants.ts  utils.ts
   │  ├─ types/          index.ts
   │  └─ guide/
   │     ├─ config.ts            GUIDE_STOPS, INTRO, MODEL (single source of truth, R2.10)
   │     ├─ types.ts
   │     ├─ store.ts             external store + useGuide(selector)
   │     ├─ anchors.ts           pure: anchor → screen px → world
   │     ├─ clipMachine.ts       pure: which clip to play
   │     ├─ introMachine.ts      pure: intro phase reducer
   │     ├─ environment.ts       mode / reduced motion / storage helpers
   │     ├─ useActiveSection.ts
   │     ├─ useIntroSequence.ts
   │     ├─ GuideRoot.tsx  GuideCanvas.tsx  GuideAvatar.tsx  SpeechBubble.tsx  GuideToggle.tsx
   │     └─ __tests__/           anchors.test.ts  clipMachine.test.ts  introMachine.test.ts  config.test.ts
   └─ e2e/                       guide.spec.ts
```

The `web/` subfolder layout follows [R2](01-references.md) (app in `web/`, host root directory set to `web`).

## 5. Data model

```ts
// web/src/guide/types.ts
export type ClipName = "Wave" | "Talk" | "Point" | "Idle" | "Travel" | "ThumbsUp";
export type Mode = "wide" | "compact";
export type IntroPhase = "pending" | "hello" | "leaving" | "done";

/** Screen-space anchor. x is ignored in "wide" mode (the rail centre is used); y is a viewport fraction. */
export interface Anchor { y: number }

export interface GuideStop {
  id: string;              // must equal a <section id>
  clip: Exclude<ClipName, "Travel" | "Wave">; // what to play after arriving
  target?: string;         // CSS selector to point at and highlight
  line?: string;           // bubble text, ≤ 140 chars, first person
  source?: string;         // where the line's facts come from (content file + field)
  wide: Anchor;            // anchor in the rail
}

export interface ModelConfig {
  url: string;                          // "/guide/kunj.glb"
  clipMap: Record<ClipName, string>;    // logical clip → clip name inside the GLB
  once: ClipName[];                     // clips played LoopOnce + clampWhenFinished
}

export interface GuideState {
  enabled: boolean;
  mode: Mode;
  reducedMotion: boolean;
  section: string | null;  // id of the section crossing the viewport's middle band
  intro: IntroPhase;
  modelReady: boolean;
  bubble: { text: string; key: number } | null;  // key changes to restart the typewriter
}
```

`config.ts` holds `GUIDE_STOPS: GuideStop[]` (one per section, [06](06-guide-script.md)), `INTRO` (line, timings)
and `MODEL`. Swapping the placeholder robot for Kunj's avatar changes only `MODEL`.

## 6. State and data flow

One store, written by three hooks, read by two components. This fixes R1's two-sources-of-truth defect.

```
 IntersectionObserver ──▶ useActiveSection ──┐
 matchMedia / resize ───▶ useGuideEnvironment┼──▶ store (GuideState) ──▶ GuideAvatar (reads in useFrame via getState())
 timers + store events ─▶ useIntroSequence ──┘                     └──▶ SpeechBubble (React subscription)
                                   ▲
 GuideAvatar ── "arrived at stop X" ┘   (store.arrive(id) → sets bubble, adds highlight class)
```

Rules:
- Per-frame code reads `store.getState()` and never calls `setState`; only discrete events write.
- The store notifies subscribers only when a value changes (same as [R5.3](01-references.md)).
- Timers exist only in `useIntroSequence` and `SpeechBubble`, and both clear them on unmount and on phase change.

## 7. Module contracts

| Module | Pure? | Input → Output |
|---|---|---|
| `anchors.ts` | yes | `(stop, mode, intro, viewport) → { px: {x,y}, heightPx }`; `pxToWorld({x,y}, viewport) → {x,y}` |
| `clipMachine.ts` | yes | `({ intro, moving, stopClip, reducedMotion, onceDone }) → ClipName` |
| `introMachine.ts` | yes | `(phase, event) → phase` for events `MODEL_READY`, `HELLO_DONE`, `ARRIVED`, `LEFT_HERO`, `LOAD_TIMEOUT`, `ALREADY_SEEN`, `REDUCED_MOTION` |
| `store.ts` | no | `getState`, `subscribe`, `set(partial)`, `arrive(stopId)`, `useGuide(selector)` |
| `useActiveSection.ts` | no | observes `GUIDE_STOPS` ids present in the DOM |
| `GuideAvatar.tsx` | no | loads `MODEL.url`, runs the frame loop ([04](04-system-design.md) §2) |

The three pure modules carry the logic that broke in R1, so they get unit tests first (TDD in the plan).
