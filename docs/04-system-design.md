# 04 — System design

## 1. Load sequence

```
0 ms     HTML (all content) streams from the CDN. Hero text is the LCP element.
~100 ms  CSS + fonts. Page is fully usable at full width; the guide reserves no space, so nothing shifts when it loads, fails or is turned off (§6).
idle     GuideRoot chunk loads via next/dynamic(ssr:false), started by requestIdleCallback
         (fallback setTimeout 1200 ms). ~250 KB gzip: three + R3F + drei subset + maath.
+        <Canvas> mounts; useGLTF fetches /guide/kunj.glb (≤ 2.5 MB, Meshopt).
ready    GuideAvatar's mount effect runs once useGLTF has resolved (Suspense lifted) →
         store.markModelReady() sets modelReady = true and the intro machine gets MODEL_READY.
```

If the model is not ready 4 s after the guide chunk mounts, the intro machine gets `LOAD_TIMEOUT` and goes to
`done`: the hero is never dimmed, and the robot appears in its corner whenever loading finishes (the hotspot, the menu and every stage wait for `modelReady`). A GLB load error
is caught by `GuideErrorBoundary` (wrapping `GuideRoot` inside `GuideLoader`), which unmounts the guide quietly
(pattern: [R4.1](01-references.md) falls back rather than leaving an empty canvas); see §8.

WebGL is checked before the chunk loads: `primeGuideState` calls `hasWebGL()` (a canvas `getContext("webgl2")`
probe) from `GuideLoader`'s mount effect. Without WebGL the chunk is never requested; see §8.

## 2. The frame loop (`GuideAvatar`, inside `useFrame((state, dt) => …)`)

```
1. s = store.getState()                                   (no React re-render)
2. stop = stopFor(s.section)            // hero stop until the visitor scrolls
3. anchor = resolveAnchor(s.mode, s.intro, s.stage !== null, viewport)   // { x, y, heightPx }
   intro pending/hello → centre; stage → centre, smaller; otherwise the resting corner (§3)
4. targetWorld = pxToWorld(anchor, viewport)
5. damp3(group.position, targetWorld, 0.35, dt); damp3(group.scale, heightPx / modelHeight, 0.35, dt)
   (placed with no damping on the first frame and always under reduced motion)
6. moving = distance(group.position, targetWorld) > 4 px
7. if (!moving && intro is not pending/hello && stop.id !== arrivedAt) {
     store.arrive(stop); refresh target centre; flashHighlight(stop.target) }
   (a section about to stage does not speak here: arrive() returns early and the stage speaks)
8. gaze = pickGaze({ hover, cursor, target, … })
     hover   the hovered item's cached centre, while store.hover is set
     cursor  the mouse position, while it moved in the last 2 s AND resting (intro done, no stage)
             AND wide AND motion allowed
     target  the section target's cached centre, except during the intro or a stage
     none    straight ahead
   Precedence: hover > cursor > section target.
9. body yaw: yawToward(gaze.x, avatar px x, 0.6 rad) = sign(gaze side) × 0.6 rad (~34°, a fixed turn, not
   proportional; 0 inside a 40 px dead zone) → dampE 0.25 s (snaps under reduced motion).
   Cursor and hover positions are viewport px; the section target comes from useTargetCenter (measured when the
   stop changes and on arrival, refreshed on passive scroll / resize at most once per frame), and the hovered
   item's centre is measured on dwell and on scroll. The loop reads layout only on the frame the stop changes
   (track) and on the arrival frame (refresh).
10. click reaction: a new s.reaction.key arms `reacting` only if resting (intro done, no stage), not moving and
    motion allowed; reactionActive() ends it when Wave finishes or a stage / walk interrupts it.
11. clip = nextClip({ intro, moving, staging, reducedMotion, stopClip: stop.clip, finished, reacting })
    if clip !== current → fadeOut(current, .3); actions[clip].reset().fadeIn(.3).play()
12. head look, after the mixer update: lookAngles(gaze, head px, body yaw, ±40°, ±20°) → damp
    yaw/pitch with smoothTime 0.15 s → createHeadLook().apply(headBone, yaw, pitch), which multiplies an offset onto
    the pose the mixer wrote. Angles damp toward zero (0.15 s) without a gaze, and are zeroed immediately under reduced motion.
    Ordering constraint: drei's useAnimations registers its own frame callback that calls mixer.update; it must
    run before this loop's callback (same priority → registration order), so GuideAvatar calls useAnimations
    above its own useFrame. Reordering makes the head look flicker or vanish.
13. write bubble anchor (avatar x, top of the avatar in px) to the shared bubbleAnchor read by SpeechBubble
14. non-production builds only: write clip, stop id, target and current x/y/height, and the gaze source to debugInfo (§9)
```

Allocation rule ([R2.6](01-references.md)): every Vector3/Euler/Quaternion used here is created once at module or
`useMemo` scope. Nothing in the loop calls `new`.

## 3. Coordinates: why an orthographic camera

The canvas uses R3F's orthographic camera with `zoom: 1`. R3F sizes the orthographic frustum to the canvas in CSS
pixels, so **one world unit equals one CSS pixel**, and the origin is the viewport centre. That turns every
screen↔world conversion into arithmetic:

```ts
// anchors.ts
export const pxToWorld = (p: { x: number; y: number }, v: { w: number; h: number }) =>
  ({ x: p.x - v.w / 2, y: v.h / 2 - p.y });
```

Avatar size is set in pixels too: `scale = heightPx / modelHeightInModelUnits`, where model height comes from a
`Box3` computed once after load. Perspective is lost, which is invisible for a single character standing still
([ADR-0002](adr/0002-orthographic-camera.md)).

Anchor resolution (`resolveAnchor`, first match wins):

| Situation | x (px) | y (px) | height (px) |
|---|---|---|---|
| Intro `pending` / `hello`, wide | `w / 2` | `0.52 h` | `clamp(0.55 h, 320, 520)` |
| Intro `pending` / `hello`, compact | `w / 2` | `0.50 h` | `0.40 h` |
| Center stage (wide only; compact never stages) | `w / 2` | `0.52 h` | `clamp(0.45 h, 260, 420)` |
| Resting, wide | `16 + 0.3 × 140` (58) | `h − 16 − 70` | `140` |
| Resting, compact | `16 + 0.3 × 120` (52) | `h − 16 − 60` | `120` |

`y` is the avatar's vertical centre. The resting spot is the same for every section. `restingBox(mode)` gives the
same box as fixed-position CSS (`left: 16, bottom: 16, size`), and the hotspot covers exactly it.

## 4. State machines

### 4.1 Intro (`introMachine.ts`)

```
pending ──MODEL_READY──▶ hello ──HELLO_DONE──▶ leaving ──ARRIVED──▶ done

ALREADY_SEEN, REDUCED_MOTION, LEFT_HERO, FAILED:  any phase ──▶ done
LOAD_TIMEOUT:                                     pending ──▶ done (ignored in other phases)
```

- `hello`: avatar at centre, Wave then Talk, hero dimmed (`html[data-guide-intro="hello"]`), bubble shows
  `INTRO.line`. `HELLO_DONE` fires `INTRO.helloMs` (4000) after the typewriter starts.
- `leaving`: hero undimmed, avatar walks to its resting corner. `ARRIVED` when it gets there.
- `done`: write `sessionStorage["guide:intro-seen"] = "1"` (try/catch). Normal behaviour: resting, stages, interactions.
- `FAILED`: the guide crashed (error boundary); goes to `done` from any phase.
- `LEFT_HERO`: the visitor scrolled the hero out of the middle band. There is no skip button (D3), but the page
  never blocks scrolling, so scrolling ends the intro.
- Before the chunk mounts (`primeGuideState`): if the flag is set → `ALREADY_SEEN`; if reduced motion → `REDUCED_MOTION` (the bubble still shows the
  hero line on arrival).

### 4.2 Clip choice (`clipMachine.ts`)

| Condition (first match wins) | Clip |
|---|---|
| reduced motion | `Idle` |
| intro = pending/hello and Wave not finished | `Wave` (once) |
| intro = pending/hello | `Talk` |
| moving | `Travel` |
| center stage running | `Talk` |
| click reaction pending and Wave not finished | `Wave` (once; a stage or a walk cancels it) |
| stop clip is `ThumbsUp` and it finished | `Idle` (ThumbsUp returns to Idle; `Point` plays once and holds its clamped final pose) |
| otherwise | stop's clip (`Point`, `Talk`, `Idle`, `ThumbsUp`) |

No timers. Fast scrolling keeps `moving = true`, so the avatar stays in `Travel` until it lands, then plays the clip
for wherever it landed. That removes [R1.3](01-references.md)'s race.

### 4.3 Bubble

Who sets `bubble = { text, key: ++n }`:

| Writer | When |
|---|---|
| `useIntroSequence` | intro enters `hello`: `INTRO.line` |
| `store.arrive(stop)` | after the intro is `done`, the robot has stopped moving, and the stop has a line not yet spoken. Arriving during `leaving` first dispatches `ARRIVED` (intro → `done`) and then speaks the hero line in the same call. Returns without speaking when the stop is the active section and the rules would stage it (the stage speaks instead) |
| `store.startStage(id)` | the stage's section line, if not yet spoken |
| `store.skipStage(id)` | the dwell elapsed but the stage was not played (compact, reduced motion, intro cut short): the line from the corner, if not yet spoken. Waits for intro `done` and `modelReady` |
| `useHoverReaction` | a hover line (replaces whatever is showing; cooldown 6 s) |

Each section's line is spoken at most once per page view (`spoken`). A section change clears the bubble. Opening the
menu clears it. Wide: the bubble stays until the next section, a hover line, the menu, or the visitor's close
button. Compact: auto-hides after 5 s. The bubble element has `role="status"` and `aria-live="polite"`, plus a close
button.

### 4.4 Center stage (`stageRules.ts`, `store.ts`, `useStage.ts`)

`shouldStage` returns true only when none of these hold (first match wins):

| # | Rule | Result |
|---|---|---|
| 1 | section is `hero` (its stage is the intro) | no stage |
| 2 | reduced motion, compact mode, intro not `done`, model not ready, or a stage already running | no stage |
| 3 | `forced` (a chip request) | stage |
| 4 | section already staged this page view | no stage |
| 5 | section active for less than `STAGE_MIN_DWELL_MS` (700 ms) | no stage |
| 6 | otherwise | stage |

`store.canStage` adds that the section must have a stop of its own (so `linkedin` never stages).

```
section becomes active → useStage waits (700 ms − time already active)
   ├─ timer fires and canStage → startStage: staged.add, stage = { sectionId }, clears hover / menu / forcedStage,
   │                             speaks the line once; robot walks to the centre and plays Talk
   │      └─ ends after min(4.5 s, line length / 35 cps + 3.5 s) → endStage → robot walks back to the corner
   └─ timer fires and not canStage → skipStage: the line from the corner (once)
section changes first → timer cleared (a section passed in under 700 ms is neither staged nor spoken, and can still stage later)
section changes during a stage → setSection sets stage = null at once; the new section is evaluated from scratch
```

Other rules:
- The section that cuts the intro short (the first non-hero section while the intro is `hello` or `leaving`) is added to `staged` and never staged: the robot is mid-walk to its corner.
- Compact mode or reduced motion switching on mid-stage ends it.
- `data-guide-stage="<section>"` is on `<html>` while a stage runs (for tests); it is removed on unmount.
- A chip's forced stage (`forcedStage`) skips rules 4 and 5 for its own section only; `useStage` still waits the 700 ms so the scroll can settle. Sections passed on the way are ignored, an unreachable request expires after 3 s, and a request the rules refuse (rule 2) is dropped. A forced stage of an already-spoken section walks again but does not repeat the line.

### 4.5 Hover reactions (`hoverRules.ts`, `useHoverReaction.ts`)

Markup: project cards, skill groups, experience cards and journey entries carry `data-guide-hover="<id>"` (ids from
`hoverIds.ts`, lines in `HOVER_LINES`, [06](06-guide-script.md)). The hook listens to `pointerover` / `pointerout` on
`document`, `pointerType === "mouse"` only.

| Event | Effect |
|---|---|
| `enter` | records the hovered id, if hover is allowed |
| `dwell-complete` (350 ms after enter, same id still hovered) | if still allowed: the robot looks at the item; if the id has a line and 6 s passed since the last spoken hover line, it says it. An id without a line is looked at silently |
| `leave` | clears the hovered id (moving to a child of the same item does not count) |
| `leave-complete` (800 ms after leave) | stops looking, unless another item was entered |
| `reset` | on section change, stage start, or hover no longer allowed: clears timers and the look; the cooldown clock is kept |

Allowed means: intro `done`, no stage running, section's own line not pending (the section would stage, or has been active under 700 ms), wide mode, motion allowed.

### 4.6 Click menu (`chips.ts`, `GuideHotspot.tsx`, `GuideChips.tsx`)

Both components render only while `menuAllowed`: guide available and enabled, intro `done`, model ready, no stage.

| Event | Effect |
|---|---|
| Click on the hotspot | `toggleMenu()` (opening clears the bubble) and `react()` (a Wave, unless reduced motion) |
| Chip: Resume | opens `/Kunj_Pandya_Resume.pdf` in a new tab (`noopener`) and closes the menu |
| Chip: Projects / Experience / Skills / Contact | closes the menu; on wide screens with motion allowed requests a forced stage; `scrollIntoView` (smooth, or instant under reduced motion); the section gets `tabindex="-1"` and focus (`preventScroll`) |
| Escape (menu open) | closes; if focus was in the menu or on the hotspot it returns to the hotspot |
| `pointerdown` outside the hotspot and menu | closes |
| Section change, stage start | closes (store) |

If the menu closes while focus is inside it (Resume chip, outside press), focus moves to the hotspot instead of falling to `<body>`.

## 5. Section detection (`useActiveSection`)

```ts
new IntersectionObserver(onEntries, { rootMargin: "-45% 0px -45% 0px", threshold: 0 })
```

The root is shrunk to a 10% band through the middle of the viewport; whichever section intersects it is active.
Works for sections of any height (Journey is long). Sections not in the DOM (empty LinkedIn) are skipped. The
store ignores writes of the same id. Compared with [R2.3](01-references.md), this avoids layout reads every frame.

The active section id is mirrored to `<html data-guide-section>` (used by the e2e recorders). Entering a section
starts the stage dwell clock (`store.dwellMs()`), see §4.4.

Pointing targets and hovered items are cached by `useTargetCenter` (one instance in `GuideAvatar`, one in
`useHoverReaction`): measured when the target changes and on arrival, and refreshed on `scroll` (passive,
capture, so the Journey strip's inner scroller counts) and `resize`, rAF-throttled to once per frame.

## 6. Performance budget

| Item | Budget | How it is checked |
|---|---|---|
| Guide JS chunk | ≤ 260 KB gzip | `next build` output; fail review if over. Last measured 268.6 KB before the interactive features ([perf-2026-10-05](perf-2026-10-05.md)); not re-measured |
| `kunj.glb` | ≤ 2.5 MB | `ls -l` in the asset task; Meshopt + WebP textures 1024² max |
| LCP (mobile, Lighthouse) | ≤ live site's LCP + 100 ms | Lighthouse before/after |
| CLS | 0.00 with the guide on, off, failed or unavailable | The guide changes no layout: the canvas, bubble, hotspot and menu are `position: fixed` overlays, no content padding depends on guide state, and the toggle and failure paths only change store state. The hero dim is an opacity change. 0.000 was measured on the earlier rail build; not re-measured on this one |
| Frame time, wide, M1 Air | ≤ 8 ms (60 fps with headroom) | Chrome Performance panel |
| Draw calls | ≤ 15 | `renderer.info.render.calls` in dev |

Canvas settings: `dpr={[1, 1.5]}` ([R2.2](01-references.md)), `gl={{ alpha: true, antialias: true,
powerPreference: "low-power" }}`, no shadows, two lights, `frameloop="always"` but the loop is paused
(`setFrameloop("never")`) while `document.hidden`.

## 7. Accessibility

- All content is server-rendered HTML; the guide repeats nothing that is not already on the page.
- Canvas: `aria-hidden="true"`, `pointer-events: none`; `tabIndex={-1}` sits on R3F's wrapper div (keeps it out of the Tab order), not on the canvas element.
- Bubble: `role="status"`, `aria-live="polite"`, close button with `aria-label="Hide guide message"`. Hover lines are announced the same way.
- Hotspot: a real `<button aria-label="Open guide menu">` with `aria-expanded` and `aria-controls="guide-menu"`; transparent, with a visible 2 px focus ring (`:focus-visible`). It is in the DOM only while the robot rests in its corner, so it is not focusable during the intro or a stage. If it had focus when a stage starts, focus falls to `<body>` (accepted: a hidden-but-mounted button would lose it too).
- Menu: `<nav aria-label="Guide menu">` of plain buttons (no `role="menu"`), always mounted while the hotspot is, `hidden` and `inert` while closed so it is out of the Tab order. Enter / Space activate a chip. Escape closes it and returns focus to the hotspot; closing by the Resume chip or an outside press also puts focus on the hotspot instead of `<body>`. A section chip moves focus to that section (`tabindex="-1"`, `preventScroll`), so keyboard users continue from there. Chip buttons are taller on compact (`py-2.5`).
- Navbar "Guide" toggle: real `<button aria-pressed>`, persisted in `localStorage` (try/catch), following
  [R5.1](01-references.md).
- Cursor follow and hover reactions respond to mouse events only. Keyboard focus does not trigger a hover reaction (no `focusin` handling).
- `prefers-reduced-motion`: see [02](02-layout.md) §5.
- The highlight ring is decoration; it never moves focus.
- Known: while the intro dims the hero to 15% opacity, Lighthouse flags `color-contrast` (accessibility 92 vs 96 on the live site, [perf-2026-10-05](perf-2026-10-05.md)); decision pending ([interactive-guide-notes](interactive-guide-notes.md)).

## 8. Failure modes

| Failure | Behaviour |
|---|---|
| WebGL unavailable | `primeGuideState` checks `hasWebGL()` before the chunk loads: `available: false`, `enabled: false`, toggle hidden; nothing is persisted, no error shown. `GuideRoot` never mounts, so there is no hotspot or menu. No layout change |
| GLB 404 / decode error / render crash | `GuideErrorBoundary` calls `failGuide`: intro `FAILED` → `done`, `enabled: false`, `available: false`, toggle hidden. `GuideRoot`'s unmount cleanup clears `bubble`, `menuOpen`, `reaction`, `forcedStage`. Not persisted; a reload retries (the failed GLB/chunk load is cached by drei/suspend-react and `next/dynamic`, so a same-page retry cannot succeed). No layout change |
| Slow network (model > 4 s) | Intro skipped; the robot appears in its corner later. Hotspot, menu and stages wait for `modelReady`; a section's line waits too (`skipStage` / stage rules re-run when the model becomes ready) |
| `sessionStorage`/`localStorage` throws (private mode, blocked) | Intro plays every load; toggle not remembered; nothing breaks |
| Target selector not found | No yaw, no highlight; clip still plays |
| Visitor resizes across 1280 px | Mode flips; the robot damps to the new resting spot and size; a running stage ends; hover reactions and cursor follow switch off in compact |
| Reduced motion turns on mid-session | Running stage ends; the robot snaps to its spot; cursor follow, hover and click wave stop |
| Guide turned off from the navbar | `GuideRoot` unmounts (canvas, hotspot, menu gone); cleanup clears bubble, menu, reaction and any forced stage, so turning it back on does not re-type the old line |
| A chip's section is never reached (user scrolls away) | The forced-stage request expires after 3 s |
| Tab hidden mid-intro | Timers keep running; on return the machine is already `leaving`/`done`; the render loop is paused while hidden |
| Hotspot covers page content | The 140 px (120 px compact) box over the bottom-left corner takes clicks that would reach the page underneath; accepted ([interactive-guide-notes](interactive-guide-notes.md)) |

## 9. Observability

Static site, so no logs. Optional Vercel Web Analytics (free tier) for page views and Web Vitals. A dev-only overlay
(`?guideDebug=1`, never in production) shows these rows: section, intro, stage (section id or `-`), hover (id or `-`),
menu (`open` / `closed`), mode, reduced motion, clip, gaze (`hover`, `cursor`, `target` or `none`), stop, target
x/y/height (where the avatar is heading) and current x/y/height. The avatar writes per-frame values to `debugInfo`
(non-production only) and `GuideDebug` polls them every 100 ms, so there is no per-frame React state.
`npm run check:prod-strip` (also a CI step) greps the production `out/` for `guide-debug` / `guideDebug` /
`curHeightPx` and fails if any debug code shipped. The call sites keep a literal
`process.env.NODE_ENV !== "production"` check so the bundler can eliminate the code.
