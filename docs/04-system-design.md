# 04 — System design

## 1. Load sequence

```
0 ms     HTML (all content) streams from the CDN. Hero text is the LCP element.
~100 ms  CSS + fonts. Page is fully usable. Rail padding is in CSS from the start (no layout shift).
idle     GuideRoot chunk loads via next/dynamic(ssr:false), started by requestIdleCallback
         (fallback setTimeout 1200 ms). ~250 KB gzip: three + R3F + drei subset + maath.
+        <Canvas> mounts; useGLTF fetches /guide/kunj.glb (≤ 2.5 MB, Meshopt).
ready    drei useProgress reaches 100 → store.modelReady = true → intro machine gets MODEL_READY.
```

If the model is not ready 4 s after the guide chunk mounts, the intro machine gets `LOAD_TIMEOUT` and goes to
`done`: the hero is never dimmed, and the avatar appears in the rail whenever loading finishes. A GLB load error
is caught by an error boundary around the canvas and unmounts the guide quietly (pattern: [R4.1](01-references.md)
falls back rather than leaving an empty canvas).

## 2. The frame loop (`GuideAvatar`, inside `useFrame((state, dt) => …)`)

```
1. s = store.getState()                                   (no React re-render)
2. stop = stopFor(s.section)            // hero stop until the visitor scrolls
3. {px, heightPx} = resolveAnchor(stop, s.mode, s.intro, viewport)
4. targetWorld = pxToWorld(px, viewport)
5. damp3(group.position, targetWorld, s.reducedMotion ? 0 : 0.35, dt)
   damp(scale, heightPx / modelHeight, 0.35, dt)
6. moving = distance(group.position, targetWorld) > 4 px
7. if (!moving && stop.id !== lastArrived) { store.arrive(stop.id); lastArrived = stop.id }
8. yaw: target element centre (cached rect) left/right of the avatar → dampE to ±0.6 rad, clamp ±70°
9. clip = nextClip({ intro, moving, stopClip: stop.clip, reducedMotion, onceDone })
   if clip !== current → fadeOut(current, .3); actions[clip].reset().fadeIn(.3).play()
10. after the mixer update: head bone slerps toward the target, clamped (R2.8)
11. write bubble anchor (head position in px) to a shared ref read by SpeechBubble
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

Anchor resolution:

| Situation | x (px) | y (px) | height (px) |
|---|---|---|---|
| Intro `hello`, wide | `w / 2` | `0.52 h` | `clamp(0.55 h, 320, 520)` |
| Intro `hello`, compact | `w / 2` | `0.50 h` | `0.40 h` |
| Stop, wide | `railWidth / 2` (140) | `stop.wide.y × h` | `clamp(0.42 h, 260, 420)` |
| Stop, compact | `16 + 0.3 × 120` | `h − 16 − 60` | `120` |

`y` is the avatar's vertical centre. The navbar (64 px) is above every wide anchor because `stop.wide.y ≥ 0.4`.

## 4. State machines

### 4.1 Intro (`introMachine.ts`)

```
              ALREADY_SEEN / REDUCED_MOTION / LOAD_TIMEOUT
   ┌──────────────────────────────────────────────────────────────┐
   │                                                              ▼
pending ──MODEL_READY──▶ hello ──HELLO_DONE──▶ leaving ──ARRIVED──▶ done
                           │                      │
                           └───── LEFT_HERO ──────┴────────────────▶ done
```

- `hello`: avatar at centre, Wave then Talk, hero dimmed (`html[data-guide-intro="hello"]`), bubble shows
  `INTRO.line`. `HELLO_DONE` fires `INTRO.helloMs` (4000) after the typewriter starts.
- `leaving`: hero undimmed, avatar travels to the hero stop. `ARRIVED` when it gets there.
- `done`: write `sessionStorage["guide:intro-seen"] = "1"` (try/catch). Normal stop behaviour.
- `LEFT_HERO`: the visitor scrolled the hero out of the middle band. There is no skip button (D3), but the page
  never blocks scrolling, so scrolling ends the intro.
- On mount: if the flag is set → `ALREADY_SEEN`; if reduced motion → `REDUCED_MOTION` (the bubble still shows the
  hero line on arrival).

### 4.2 Clip choice (`clipMachine.ts`)

| Condition (first match wins) | Clip |
|---|---|
| intro = `hello` and Wave not finished | `Wave` (once) |
| intro = `hello` | `Talk` |
| moving and not reduced motion | `Travel` |
| stop clip is a once-clip and it finished | `Idle` |
| otherwise | stop's clip (`Point`, `Talk`, `Idle`, `ThumbsUp`) |

No timers. Fast scrolling keeps `moving = true`, so the avatar stays in `Travel` until it lands, then plays the clip
for wherever it landed. That removes [R1.3](01-references.md)'s race.

### 4.3 Bubble

`store.arrive(stopId)` sets `bubble = { text: stop.line, key: ++n }` if the stop has a line and the stop has not
spoken yet this page view. Section change → bubble cleared. Wide: stays until the next section. Compact:
auto-hides after 5 s. The bubble element has `role="status"` and `aria-live="polite"`, plus a close button.

## 5. Section detection (`useActiveSection`)

```ts
new IntersectionObserver(onEntries, { rootMargin: "-45% 0px -45% 0px", threshold: 0 })
```

The root is shrunk to a 10% band through the middle of the viewport; whichever section intersects it is active.
Works for sections of any height (Journey is long). Sections not in the DOM (empty LinkedIn) are skipped. The
store ignores writes of the same id. Compared with [R2.3](01-references.md), this avoids layout reads every frame.

The pointing target's rectangle is cached on arrival and refreshed on `scroll` (passive listener, rAF-throttled)
and `resize`.

## 6. Performance budget

| Item | Budget | How it is checked |
|---|---|---|
| Guide JS chunk | ≤ 260 KB gzip | `next build` output; fail review if over |
| `kunj.glb` | ≤ 2.5 MB | `ls -l` in the asset task; Meshopt + WebP textures 1024² max |
| LCP (mobile, Lighthouse) | ≤ live site's LCP + 100 ms | Lighthouse before/after |
| CLS | 0.00 from the guide | Rail padding is static CSS |
| Frame time, wide, M1 Air | ≤ 8 ms (60 fps with headroom) | Chrome Performance panel |
| Draw calls | ≤ 15 | `renderer.info.render.calls` in dev |

Canvas settings: `dpr={[1, 1.5]}` ([R2.2](01-references.md)), `gl={{ alpha: true, antialias: true,
powerPreference: "low-power" }}`, no shadows, two lights, `frameloop="always"` but the loop is paused
(`setFrameloop("never")`) while `document.hidden`.

## 7. Accessibility

- All content is server-rendered HTML; the guide repeats nothing that is not already on the page.
- Canvas: `aria-hidden="true"`, `tabIndex={-1}`, `pointer-events: none`.
- Bubble: `role="status"`, `aria-live="polite"`, close button with `aria-label="Hide guide message"`.
- Navbar "Guide" toggle: real `<button aria-pressed>`, persisted in `localStorage` (try/catch), following
  [R5.1](01-references.md).
- `prefers-reduced-motion`: see [02](02-layout.md) §5.
- The highlight ring is decoration; it never moves focus.

## 8. Failure modes

| Failure | Behaviour |
|---|---|
| WebGL unavailable | `GuideCanvas` checks `WebGL2RenderingContext` first; guide stays off, no error shown |
| GLB 404 / decode error | Error boundary unmounts the guide; intro machine → `done` |
| Slow network (model > 4 s) | Intro skipped; avatar appears in the rail later |
| `sessionStorage`/`localStorage` throws (private mode, blocked) | Intro plays every load; toggle not remembered; nothing breaks |
| Target selector not found | No yaw, no highlight; clip still plays |
| Visitor resizes across 1280 px | Mode flips; avatar damps to the new anchor; rail padding flips via CSS media query |
| Tab hidden mid-intro | Timers keep running; on return the machine is already `leaving`/`done` |

## 9. Observability

Static site, so no logs. Optional Vercel Web Analytics (free tier) for page views and Web Vitals. A dev-only overlay
(`?guideDebug=1`, stripped in production builds) shows section, intro phase, current clip and anchor.
