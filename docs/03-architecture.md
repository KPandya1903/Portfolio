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
| E2E tests | Playwright | 1.63 | Chromium, Firefox and WebKit, one worker: intro, scroll, stage, hover, menu, modes, reduced motion, failure paths |
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
app/layout.tsx  (server; fonts and metadata only: no inline script, no data-guide attribute)
└─ app/page.tsx  (server; renders all content as static HTML, full width)
   ├─ <Navbar/>                  client: anchors + <GuideToggle/> (hidden when store.available is false)
   ├─ <main>
   │    <Hero/> <Journey/> <About/> <Experience/> <Projects/> <LinkedIn/> <Skills/> <Contact/>
   │    (each <section id="…">; pointing targets carry data-guide-target="…", hoverable items data-guide-hover="…")
   └─ <GuideLoader/>             client: primeGuideState(), then loads GuideRoot when idle and enabled
        └─ <GuideErrorBoundary>  failed chunk / GLB / WebGL error → failGuide()
             └─ <GuideRoot/>     next/dynamic({ ssr: false })
                  ├─ useGuideEnvironment()    keeps width mode and reduced motion current (matchMedia change events)
                  ├─ useActiveSection(SECTION_IDS)  IntersectionObserver → store.setSection
                  ├─ useIntroSequence()       intro state machine driver (timers live here, cleaned up)
                  ├─ useStage()               center stage driver: dwell, forced-request expiry, end timers, data-guide-stage
                  ├─ useHoverReaction()       delegated pointerover/out on document → store.say / store.hover, publishes hoverGaze
                  ├─ <GuideCanvas>            fixed, transparent, pointer-events:none, orthographic camera, z 40
                  │    └─ <Suspense fallback={null}>
                  │         └─ <GuideAvatar/>   GLB + clips, per-frame: anchor → damp → gaze → yaw → clip → head
                  │                             (uses usePointer for the cursor and useTargetCenter for the section target)
                  ├─ <SpeechBubble/>          DOM, z 45, positioned each frame from `bubbleAnchor` (avatar centre x, top of its scaled bounding box)
                  ├─ <GuideHotspot/>          DOM button over the resting robot, z 42; click → toggleMenu + react
                  ├─ <GuideChips/>            DOM nav next to the hotspot, z 46; chips scroll / open the resume / request a stage
                  └─ <GuideDebug/>            dev only, `?guideDebug=1` ([04](04-system-design.md) §9)
```

Server components render all text, so the content is in the HTML for crawlers and for no-JS visitors. The guide is
a client-only island that adds nothing to the server HTML and reserves no layout space.

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
   ├─ vercel.json                 headers for Vercel (immutable cache for /guide/*, nosniff, referrer policy)
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
   │     ├─ config.ts            GUIDE_STOPS, SECTION_IDS, INTRO, MODEL, stopFor, stage/hover/pointer constants, HOVER_LINES, CHIPS, RESUME_URL (single source of truth, R2.10)
   │     ├─ types.ts
   │     ├─ store.ts             external store + useGuide(selector, store?)
   │     ├─ anchors.ts           pure: anchor → screen px → world, yaw, bubble box, restingBox
   │     ├─ clipMachine.ts       pure: which clip to play; reactionActive
   │     ├─ introMachine.ts      pure: intro phase reducer
   │     ├─ stageRules.ts        pure: shouldStage skip rules, stageDurationMs
   │     ├─ hoverRules.ts        pure: nextHover (dwell, cooldown, leave delay), hoverAllowed
   │     ├─ chips.ts             pure: chipAction, menuAllowed
   │     ├─ look.ts              pure lookAngles, pickGaze; createHeadLook (head-bone offset)
   │     ├─ hoverIds.ts          id builders shared by markup and HOVER_LINES
   │     ├─ hoverGaze.ts         shared mutable ref: hovered item's centre (hook writes, avatar reads)
   │     ├─ environment.ts       storage, WebGL check, primeGuideState, failGuide
   │     ├─ bubbleAnchor.ts      shared mutable anchor: avatar centre x and top of its scaled bounding box (avatar writes, bubble reads)
   │     ├─ highlight.ts         flashHighlight (1.6 s ring)
   │     ├─ debugInfo.ts  shouldShowDebug.ts  GuideDebug.tsx   dev-only overlay
   │     ├─ useGuideEnvironment.ts  useActiveSection.ts  useIntroSequence.ts  useStage.ts  useHoverReaction.ts
   │     ├─ usePointer.ts  useTargetCenter.ts  usePresence.ts  useTypewriter.ts
   │     ├─ GuideLoader.tsx  GuideErrorBoundary.tsx  GuideRoot.tsx  GuideCanvas.tsx  GuideAvatar.tsx
   │     ├─ SpeechBubble.tsx  GuideHotspot.tsx  GuideChips.tsx  GuideToggle.tsx
   │     └─ __tests__/           one test file per module above except bubbleAnchor, debugInfo, hoverGaze, types,
   │                             GuideCanvas, GuideLoader and GuideAvatar (.test.ts[x])
   └─ e2e/                       guide.spec.ts  content.spec.ts  helpers.ts (intro / stage / section recorders)
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
}

export interface ModelConfig {
  url: string;                          // "/guide/robot-expressive.glb" today
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
  stage: { sectionId: string } | null;           // center stage in progress
  hover: { id: string } | null;                  // item the robot is looking at because of a hover
  menuOpen: boolean;                             // chips menu open
  reaction: { clip: "Wave"; key: number } | null; // one-shot click reaction; a new key replays it
  forcedStage: string | null;                    // a chip asked for this section to be staged once it is active
}
```

Not in `GuideState` (kept inside the store closure, never notifying): `spoken` (sections whose line was said),
`staged` (sections already staged, exposed read-only as `store.staged`) and `sectionSince` (when the current section
became active, exposed as `store.dwellMs()`).

`config.ts` holds `SECTION_IDS`, `GUIDE_STOPS: GuideStop[]` (one per section except `linkedin`, [06](06-guide-script.md)),
`INTRO` (line, timings), `MODEL`, `stopFor(sectionId)` (the stop of the nearest earlier section, so `linkedin` uses
the `projects` stop), and the interaction constants:

| Constant | Value | Used by |
|---|---|---|
| `STAGE_MIN_DWELL_MS` | 700 | a section must stay active this long before it is staged |
| `STAGE_HOLD_MS` | 3500 | hold after the line is typed |
| `STAGE_MAX_MS` | 4500 | hard cap on a stage |
| `TYPE_CPS` | 35 | typewriter speed; also stage duration |
| `POINTER_IDLE_MS` | 2000 | mouse counts as idle after this |
| `HOVER_DWELL_MS` / `HOVER_COOLDOWN_MS` / `HOVER_LEAVE_MS` | 350 / 6000 / 800 | hover rules |
| `FORCED_STAGE_TTL_MS` | 3000 | a chip's stage request expires if its section is not reached |
| `HOVER_LINES` | id → line | [06](06-guide-script.md) §Hover lines |
| `CHIPS`, `RESUME_URL` | five chips; `/Kunj_Pandya_Resume.pdf` | `GuideChips` |

Swapping the placeholder robot for another model changes `MODEL`; `HEAD_YAW_SIGN` / `HEAD_PITCH_SIGN` in `GuideAvatar.tsx` may also need flipping for a new rig.

## 6. State and data flow

One store. Writers: `useActiveSection` (`setSection`), `useIntroSequence`, `useGuideEnvironment`, `useStage` (`startStage`, `skipStage`, `endStage`, `forcedStage`), `useHoverReaction` (`say`, `hover`), `GuideAvatar` (`arrive`, `markModelReady`), `SpeechBubble` (dismiss, compact auto-hide), `GuideHotspot` (`toggleMenu`, `react`), `GuideChips` (`closeMenu`, `requestStage`), `GuideRoot` (unmount cleanup of `bubble`, `menuOpen`, `reaction`, `forcedStage`), `GuideToggle`, `primeGuideState`, `failGuide`. Readers: `GuideAvatar`, `SpeechBubble`, `GuideToggle`, `GuideLoader`, `GuideRoot`, `GuideHotspot`, `GuideChips`, `GuideDebug`, `useIntroSequence`, `useStage`, `useHoverReaction`. This fixes R1's two-sources-of-truth defect.

```
 IntersectionObserver ──▶ useActiveSection ──┐
 matchMedia change ─────▶ useGuideEnvironment┤
 timers + store events ─▶ useIntroSequence ──┼──▶ store (GuideState) ──▶ GuideAvatar (reads in useFrame via getState())
 dwell timers ──────────▶ useStage ──────────┤                     ├──▶ SpeechBubble, GuideHotspot, GuideChips (React subscriptions)
 pointerover / pointerout▶ useHoverReaction ─┤                     
 click, chip, Escape ───▶ GuideHotspot/Chips ┘
                                   ▲
 GuideAvatar ── "arrived at stop X" ┘   (store.arrive(stop) → sets bubble; the avatar adds the highlight class)

 Not through the store (per-frame refs): mouse position (usePointer, read by GuideAvatar), hovered item's centre (hoverGaze), avatar anchor for the bubble (bubbleAnchor).
```

Rules:
- Per-frame code reads `store.getState()` and never calls `setState`; only discrete events write. The mouse position and the hovered item's centre are plain refs, not state.
- The store notifies subscribers only when a value changes (same as [R5.3](01-references.md)).
- Speak-once: a section's line is said at most once per page view (`spoken`), whether from the stage, the corner or a skipped stage. A section is staged at most once per page view (`staged`), except a chip's forced stage, which walks again but does not repeat a line already spoken.
- A section change clears `bubble`, `stage`, `hover` and `menuOpen`.
- In guide code, timers, intervals and rAF loops exist only in the places below (`Journey` and `ProjectCarousel` have their own). Each is cleared on unmount or when its phase or input changes, except the highlight ring's timeout, which removes its own class when it fires:

| Where | What | Cleared by |
|---|---|---|
| `useIntroSequence` | `LOAD_TIMEOUT` (4 s) and `HELLO_DONE` (4 s) timeouts | effect cleanup; the hello timer also on phase change |
| `useStage` | start timeout (remaining dwell up to 700 ms); forced-request expiry (3 s); stage end timeout (`stageDurationMs`) | effect cleanup on every dependency change and on unmount (which also ends the stage and removes `data-guide-stage`) |
| `useHoverReaction` | dwell timeout (350 ms) and leave timeout (800 ms) | next pointer event, `reset` on section / stage / disallowed change, effect cleanup |
| `SpeechBubble` | rAF loop following `bubbleAnchor`; 5 s compact auto-hide timeout | effect cleanup (`cancelAnimationFrame`, `clearTimeout`) |
| `useTypewriter` | `setInterval` at 35 chars/s | effect cleanup; also when the line is complete |
| `usePresence` | 120 ms exit-hold timeout (bubble and chips menu) | effect cleanup |
| `highlight.ts` | 1.6 s ring timeout, one per element | restarted if the same element is flashed again; not cleared on unmount, it removes the class itself when it fires |
| `GuideLoader` | `requestIdleCallback`, or a 1200 ms timeout where it is missing | effect cleanup |
| `useTargetCenter` | rAF throttle for scroll/resize re-measure (one instance in `GuideAvatar`, one in `useHoverReaction`) | effect cleanup (`cancelAnimationFrame`) |
| `GuideDebug` | 100 ms poll of `debugInfo` (dev only) | effect cleanup |

`usePointer` has no timers (it stores the last mouse position and time; idleness is computed per frame). `GuideChips` has no timers of its own beyond `usePresence`; its `keydown` and `pointerdown` listeners on `document` exist only while the menu is open.

## 7. Module contracts

| Module | Pure? | Input → Output |
|---|---|---|
| `anchors.ts` | yes | `resolveAnchor(mode, intro, staging, viewport) → { x, y, heightPx }`; `restingBox(mode) → { left, bottom, size }` (16 px inset; size 140 wide, 120 compact); `pxToWorld`/`worldToPx({x,y}, viewport) → {x,y}`; `yawToward(targetCenterX \| null, avatarX, maxYaw) → rad` (0 inside `YAW_DEADZONE_PX` = 40); `bubbleBox({x, top}, width, viewportW) → { left, top }`; `modeForWidth(w)` |
| `clipMachine.ts` | yes | `nextClip({ intro, moving, staging, reducedMotion, stopClip, finished: ReadonlySet<ClipName>, reacting? }) → ClipName`; `reactionActive(reacting, { finished, staging, moving }) → boolean` |
| `introMachine.ts` | yes | `introReducer(phase, event) → phase` for events `MODEL_READY`, `HELLO_DONE`, `ARRIVED`, `LEFT_HERO`, `LOAD_TIMEOUT`, `FAILED`, `ALREADY_SEEN`, `REDUCED_MOTION` |
| `stageRules.ts` | yes | `shouldStage({ sectionId, staged, dwellMs, reducedMotion, mode, intro, modelReady, stageActive, forced? }) → boolean`; `stageDurationMs(lineLength) → ms` |
| `hoverRules.ts` | yes | `nextHover(state, event, now) → { state, say?, lookId? }` for events `enter`, `dwell-complete`, `leave`, `leave-complete`, `reset`; `hoverAllowed(ctx) → boolean`; `INITIAL_HOVER` |
| `chips.ts` | yes | `chipAction(target, { reducedMotion, mode }) → { type: "open", url } \| { type: "scroll", id, behavior, forceStage }`; `menuAllowed(state) → boolean` (available, enabled, intro done, model ready, no stage) |
| `look.ts` | `lookAngles`, `pickGaze` yes; `createHeadLook` holds private scratch state | `lookAngles(target \| null, head, bodyYaw, maxYaw, maxPitch) → { yaw, pitch }`; `pickGaze({ cursor, cursorActive, hover, target, resting, reducedMotion, mode }) → point \| null` (hover > cursor > section target); `createHeadLook().apply(bone, yaw, pitch)` adds the offset on top of the mixer's pose |
| `hoverIds.ts` | yes | `projectHoverId(id)`, `experienceHoverId(id)`, `journeyHoverId(id)`, `skillHoverId(category)`: the `data-guide-hover` values |
| `hoverGaze.ts` | no | `hoverGaze.center: MutableRefObject<{x,y} \| null>`: written by `useHoverReaction`, read by `GuideAvatar` |
| `store.ts` | no | `getState`, `subscribe`, `set(partial)`, `say(text)`, `dispatchIntro(event)`, `setSection(id)`, `markModelReady()`, `arrive(stop)`, `canStage(id, { forced?, dwellMs? })`, `startStage(id)`, `skipStage(id)`, `endStage()`, `dwellMs()`, `staged`, `toggleMenu()`, `closeMenu()`, `react()`, `requestStage(id)`; `useGuide(selector, store?)` |
| `environment.ts` | no | `primeGuideState(store?, matches?, webgl?)`, `failGuide(store?)` (intro `FAILED`, `enabled: false`, `available: false`), `readStorage(area, key)`, `writeStorage(area, key, value)`, `hasWebGL()` |
| `useActiveSection.ts` | no | observes every `SECTION_IDS` element present in the DOM (including `linkedin`, which has no stop of its own; `stopFor` maps it to the previous stop) |
| `useGuideEnvironment.ts` | no | subscribes to the width and reduced-motion media queries; writes `mode`, `reducedMotion` |
| `useIntroSequence.ts` | no | intro timers; writes `data-guide-intro` on `<html>` and the session-seen flag |
| `useStage.ts` | no | `(store?) → void`: starts a stage after the dwell if `canStage`, else `skipStage`; consumes or expires `forcedStage`; ends the stage after `stageDurationMs`, or at once if the mode becomes compact or reduced motion turns on; writes `data-guide-stage` on `<html>` |
| `useHoverReaction.ts` | no | `(store?) → void`: delegated pointer listeners for `[data-guide-hover]` (mouse only), dwell/leave timers, `store.say` and `store.hover`, publishes the item's centre through `hoverGaze` |
| `usePointer.ts` | no | `() → { pointer: ref<{x, y, lastMove}>, isActive(now) }`: mouse position for the frame loop; touch and pen ignored |
| `useTargetCenter.ts` | no | `() → { center, track(el), refresh() }`: cached centre (px) of a tracked element |
| `usePresence.ts` | no | `(value \| null, exitMs) → { shown, leaving }`: keeps the last value mounted for `exitMs` after it becomes null |
| `useTypewriter.ts` | no | `(full, key, cps) → { text, finish }` |
| `GuideLoader.tsx` | no | `primeGuideState()`, then mounts `GuideRoot` inside `GuideErrorBoundary` when idle and `enabled` |
| `GuideErrorBoundary.tsx` | no | on a render error calls `failGuide` and renders nothing; the toggle is then hidden and a reload retries |
| `GuideHotspot.tsx` | no | transparent `button#guide-hotspot` (`aria-label="Open guide menu"`, `aria-expanded`, `aria-controls="guide-menu"`) fixed over `restingBox`; rendered only while `menuAllowed` |
| `GuideChips.tsx` | no | `nav#guide-menu` (`aria-label="Guide menu"`) with one button per `CHIPS` entry; rendered while `menuAllowed`, `hidden` + `inert` while closed; owns Escape / outside-press / focus handling |
| `GuideRoot.tsx` | no | mounts the hooks and components above; writes `data-guide-section` on `<html>`; on unmount clears `bubble`, `menuOpen`, `reaction`, `forcedStage` |
| `debugInfo.ts`, `shouldShowDebug.ts`, `GuideDebug.tsx` | no | dev-only overlay ([04](04-system-design.md) §9) |
| `GuideAvatar.tsx` | no | loads `MODEL.url`, runs the frame loop ([04](04-system-design.md) §2) |

The pure modules carry the logic that broke in R1, so they get unit tests first (TDD in the plan).
