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
| 3D helpers | @react-three/drei | 10.7 | `useGLTF`, `useAnimations` only |
| Easing | maath | 0.10 | `easing.damp3` / `dampE` ([ADR-0004](adr/0004-maath-over-framer-motion-3d.md)) |
| Unit tests | Vitest | 5 | Pure guide logic, plus hooks and components via happy-dom and Testing Library |
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
app/layout.tsx  (server; inline script sets html[data-guide="off"] before paint if the visitor turned the guide off)
└─ app/page.tsx  (server; renders all content as static HTML)
   ├─ <Navbar/>                  client: anchors + <GuideToggle/> (hidden when store.available is false)
   ├─ <main>                     rail padding is CSS on `main > section` (globals.css), not a class on <main>
   │    <Hero/> <Journey/> <About/> <Experience/> <Projects/> <LinkedIn/> <Skills/> <Contact/>
   │    (each <section id="…">, targets carry data-guide-target="…")
   └─ <GuideLoader/>             client: primeGuideState(), then loads GuideRoot when idle and enabled
        └─ <GuideErrorBoundary>  failed chunk / GLB / WebGL error → failGuide()
             └─ <GuideRoot/>     next/dynamic({ ssr: false })
                  ├─ useGuideEnvironment()    keeps width mode and reduced motion current (matchMedia change events)
                  ├─ useActiveSection(SECTION_IDS)  IntersectionObserver → store.setSection
                  ├─ useIntroSequence()       intro state machine driver (timers live here, cleaned up)
                  ├─ <GuideCanvas>            fixed, transparent, pointer-events:none, orthographic camera
                  │    └─ <Suspense fallback={null}>
                  │         └─ <GuideAvatar/>   GLB + clips, per-frame: anchor → damp → yaw → clip → head
                  ├─ <SpeechBubble/>          DOM, positioned each frame from `bubbleAnchor` (avatar centre x, top of its scaled bounding box)
                  └─ <GuideDebug/>            dev only, `?guideDebug=1` ([04](04-system-design.md) §9)
```

Server components render all text, so the content is in the HTML for crawlers and for no-JS visitors. The guide is
a client-only island that adds nothing to the server HTML.

## 4. Directory tree

```
portfolio-3d/
├─ README.md
├─ docs/                          (this documentation)
├─ assets/                        pending Task 14: source files, NOT deployed (does not exist yet)
│  ├─ avatar/kunj-metaperson.glb  MetaPerson export (D1)
│  ├─ clips/*.fbx                 Mixamo downloads
│  └─ build-guide-glb.md          exact commands that produce web/public/guide/kunj.glb
└─ web/                           the Next.js app (Vercel/Cloudflare root directory)
   ├─ package.json  next.config.ts  tsconfig.json  postcss.config.mjs  vitest.config.mts  playwright.config.ts
   ├─ THIRD_PARTY.md              attribution (sen-3d-resume MIT, RobotExpressive CC0)
   ├─ public/
   │  ├─ guide/robot-expressive.glb   placeholder (CC0)
   │  ├─ guide/kunj.glb               pending Task 14: final avatar + clips (≤ 2.5 MB), not present yet
   │  └─ Kunj_Pandya_Resume.pdf  _headers  favicon.svg
   ├─ src/                    (same layout as the live site, so its files copy across unchanged)
   │  ├─ app/            layout.tsx  page.tsx  globals.css  robots.ts  sitemap.ts
   │  ├─ data/           metadata.ts  experience.ts  projects.ts  skills.ts  timeline.ts  education.ts  achievements.ts  linkedinPosts.ts
   │  ├─ components/
   │  │  ├─ sections/    Navbar  Hero  Journey  About  Experience  Projects  ProjectCarousel  LinkedIn  Skills  Contact  yearLabels.ts  __tests__/yearLabels.test.ts
   │  │  ├─ ui/          Button  ExperienceCard  ProjectCard  SkillBadge
   │  │  └─ animations/  FadeIn  ScrollReveal
   │  ├─ lib/            constants.ts  utils.ts
   │  ├─ types/          index.ts
   │  └─ guide/
   │     ├─ config.ts            GUIDE_STOPS, SECTION_IDS, INTRO, MODEL, stopFor (single source of truth, R2.10)
   │     ├─ types.ts
   │     ├─ store.ts             external store + useGuide(selector, store?)
   │     ├─ anchors.ts           pure: anchor → screen px → world, yaw, bubble box
   │     ├─ clipMachine.ts       pure: which clip to play
   │     ├─ introMachine.ts      pure: intro phase reducer
   │     ├─ look.ts              pure lookAngles; createHeadLook (head-bone offset)
   │     ├─ environment.ts       storage, WebGL check, primeGuideState, failGuide, setRailFreed
   │     ├─ bubbleAnchor.ts      shared mutable anchor: avatar centre x and top of its scaled bounding box (avatar writes, bubble reads)
   │     ├─ highlight.ts         flashHighlight (1.6 s ring)
   │     ├─ debugInfo.ts  shouldShowDebug.ts  GuideDebug.tsx   dev-only overlay
   │     ├─ useGuideEnvironment.ts  useActiveSection.ts  useIntroSequence.ts
   │     ├─ useTargetCenter.ts  usePresence.ts  useTypewriter.ts
   │     ├─ GuideLoader.tsx  GuideErrorBoundary.tsx  GuideRoot.tsx  GuideCanvas.tsx  GuideAvatar.tsx
   │     ├─ SpeechBubble.tsx  GuideToggle.tsx
   │     └─ __tests__/           anchors  clipMachine  config  environment  highlight  introMachine  look  shouldShowDebug
   │                             store  useActiveSection  useGuide  useGuideEnvironment  useIntroSequence  usePresence
   │                             useTargetCenter  useTypewriter  (.test.ts[x]); components: GuideDebug  GuideErrorBoundary
   │                             GuideToggle  SpeechBubble
   └─ e2e/                       guide.spec.ts  content.spec.ts
```

The `web/` subfolder layout follows [R2](01-references.md) (app in `web/`, host root directory set to `web`).

## 5. Data model

```ts
// web/src/guide/types.ts
export type ClipName = "Wave" | "Talk" | "Point" | "Idle" | "Travel" | "ThumbsUp";
export type StopClip = Exclude<ClipName, "Travel" | "Wave">;
export type Mode = "wide" | "compact";
export type IntroPhase = "pending" | "hello" | "leaving" | "done";

export interface GuideStop {
  id: string;              // must equal a <section id>
  clip: StopClip;          // what to play after arriving
  target?: string;         // CSS selector to point at and highlight
  line?: string;           // bubble text, ≤ 140 chars, first person
  source?: string;         // where the line's facts come from (content file + field)
  wide: { y: number };     // anchor in the rail: viewport fraction; x is the rail centre
}

export interface ModelConfig {
  url: string;                          // "/guide/kunj.glb"
  clipMap: Record<ClipName, string>;    // logical clip → clip name inside the GLB
  once: ClipName[];                     // clips played LoopOnce + clampWhenFinished
  headBone: string;                     // bone the look-at offset is applied to ("Head"; Mixamo: "mixamorigHead")
}

export interface GuideState {
  available: boolean;      // false when WebGL2 is missing or the guide failed; the toggle is hidden
  enabled: boolean;
  mode: Mode;
  reducedMotion: boolean;
  section: string | null;  // id of the section crossing the viewport's middle band
  intro: IntroPhase;
  modelReady: boolean;
  bubble: { text: string; key: number } | null;  // key changes to restart the typewriter
}
```

`config.ts` holds `SECTION_IDS`, `GUIDE_STOPS: GuideStop[]` (one per section except `linkedin`, [06](06-guide-script.md)),
`INTRO` (line, timings), `MODEL`, and `stopFor(sectionId)`, which returns the stop of the nearest earlier section
(so `linkedin` uses the `projects` stop). Swapping the placeholder robot for Kunj's avatar changes `MODEL`; `HEAD_YAW_SIGN` / `HEAD_PITCH_SIGN` in `GuideAvatar.tsx` may also need flipping for a new rig.

## 6. State and data flow

One store. Writers: `useActiveSection`, `useIntroSequence`, `useGuideEnvironment`, `GuideAvatar` (`arrive`, `markModelReady`), `SpeechBubble` (dismiss, compact auto-hide), `GuideToggle`, `primeGuideState`, `failGuide`. Readers: `GuideAvatar`, `SpeechBubble`, `GuideToggle`, `GuideLoader`, `GuideRoot`, `GuideDebug`, `useIntroSequence`. This fixes R1's two-sources-of-truth defect.

```
 IntersectionObserver ──▶ useActiveSection ──┐
 matchMedia change ─────▶ useGuideEnvironment┼──▶ store (GuideState) ──▶ GuideAvatar (reads in useFrame via getState())
 timers + store events ─▶ useIntroSequence ──┘                     └──▶ SpeechBubble (React subscription)
                                   ▲
 GuideAvatar ── "arrived at stop X" ┘   (store.arrive(stop) → sets bubble; the avatar adds the highlight class)
```

Rules:
- Per-frame code reads `store.getState()` and never calls `setState`; only discrete events write.
- The store notifies subscribers only when a value changes (same as [R5.3](01-references.md)).
- In guide code, timers, intervals and rAF loops exist only in the places below (`Journey` and `ProjectCarousel` have their own). Each is cleared on unmount or when its phase or input changes, except the highlight ring's timeout, which removes its own class when it fires:

| Where | What | Cleared by |
|---|---|---|
| `useIntroSequence` | `LOAD_TIMEOUT` (4 s) and `HELLO_DONE` (4 s) timeouts | effect cleanup; the hello timer also on phase change |
| `SpeechBubble` | rAF loop following `bubbleAnchor`; 5 s compact auto-hide timeout | effect cleanup (`cancelAnimationFrame`, `clearTimeout`) |
| `useTypewriter` | `setInterval` at 35 chars/s | effect cleanup; also when the line is complete |
| `usePresence` | 120 ms exit-hold timeout | effect cleanup |
| `highlight.ts` | 1.6 s ring timeout, one per element | restarted if the same element is flashed again; not cleared on unmount, it removes the class itself when it fires |
| `GuideLoader` | `requestIdleCallback`, or a 1200 ms timeout where it is missing | effect cleanup |
| `useTargetCenter` | rAF throttle for scroll/resize re-measure | effect cleanup (`cancelAnimationFrame`) |
| `GuideDebug` | 100 ms poll of `debugInfo` (dev only) | effect cleanup |

## 7. Module contracts

| Module | Pure? | Input → Output |
|---|---|---|
| `anchors.ts` | yes | `resolveAnchor(stop, mode, intro, viewport) → { x, y, heightPx }`; `pxToWorld`/`worldToPx({x,y}, viewport) → {x,y}`; `yawToward(targetCenterX \| null, avatarX, maxYaw) → rad`; `bubbleBox({x, top}, width, viewportW) → { left, top }`; `modeForWidth(w)` |
| `clipMachine.ts` | yes | `nextClip({ intro, moving, reducedMotion, stopClip, finished: ReadonlySet<ClipName> }) → ClipName` |
| `introMachine.ts` | yes | `introReducer(phase, event) → phase` for events `MODEL_READY`, `HELLO_DONE`, `ARRIVED`, `LEFT_HERO`, `LOAD_TIMEOUT`, `FAILED`, `ALREADY_SEEN`, `REDUCED_MOTION` |
| `look.ts` | `lookAngles` yes; `createHeadLook` holds private scratch state | `lookAngles(target \| null, head, bodyYaw, maxYaw, maxPitch) → { yaw, pitch }`; `createHeadLook().apply(bone, yaw, pitch)` adds the offset on top of the mixer's pose |
| `store.ts` | no | `getState`, `subscribe`, `set(partial)`, `say(text)`, `dispatchIntro(event)`, `setSection(id)`, `markModelReady()`, `arrive(stop: GuideStop)`; `useGuide(selector, store?)` |
| `environment.ts` | no | `primeGuideState(store?, matches?, webgl?)`, `failGuide(store?)` (intro `FAILED`, `enabled: false`, `available: false`, rail freed), `setRailFreed(freed)`, `readStorage(area, key)`, `writeStorage(area, key, value)`, `hasWebGL()` |
| `useActiveSection.ts` | no | observes every `SECTION_IDS` element present in the DOM (including `linkedin`, which has no stop of its own; `stopFor` maps it to the previous stop) |
| `useGuideEnvironment.ts` | no | subscribes to the width and reduced-motion media queries; writes `mode`, `reducedMotion` |
| `useTargetCenter.ts` | no | `() → { center, track(el), refresh() }`: cached centre (px) of the pointing target |
| `usePresence.ts` | no | `(value \| null, exitMs) → { shown, leaving }`: keeps the last value mounted for `exitMs` after it becomes null |
| `useTypewriter.ts` | no | `(full, key, cps) → { text, finish }` |
| `GuideLoader.tsx` | no | `primeGuideState()`, then mounts `GuideRoot` inside `GuideErrorBoundary` when idle and `enabled` |
| `GuideErrorBoundary.tsx` | no | on a render error calls `failGuide` and renders nothing; the toggle is then hidden and a reload retries |
| `debugInfo.ts`, `shouldShowDebug.ts`, `GuideDebug.tsx` | no | dev-only overlay ([04](04-system-design.md) §9) |
| `GuideAvatar.tsx` | no | loads `MODEL.url`, runs the frame loop ([04](04-system-design.md) §2) |

The pure modules carry the logic that broke in R1, so they get unit tests first (TDD in the plan).
