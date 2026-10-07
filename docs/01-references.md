# 01 — References

Every pattern in this project traces to a file and line range in a public repo, pinned to the commit read on
2026-10-05. Line links are permalinks, so they keep pointing at the code that was read even if the repos change.

## License rule

| Repo | License | What we may do |
|---|---|---|
| dayinji/sen-3d-resume | **MIT** for code. The author's name, model, resume and logos are excluded (repo `NOTICE`) | Adapt code with attribution in `web/THIRD_PARTY.md`. Never ship their `me.glb` or content |
| wass08/r3f-portfolio-final | **None** (all rights reserved by default) | Learn the pattern, write our own code. Do not copy files or the avatar `646d…913.glb` (his likeness) |
| Sameer069/portfolio | None | Pattern reference only |
| awaisahmad6059/3D-Portfolio | None | Pattern reference only |
| HxnDev/Portfolio | None | Pattern reference only |
| three.js `RobotExpressive.glb` | **CC0 1.0** (Tomás Laulhé / Quaternius, edits by Don McCurdy) | Free to ship. Our placeholder avatar until Kunj's is ready |

"Pattern reference" means our implementation is written from scratch against the idea, with its own structure and
names, and the doc that uses the idea cites the source.

---

## R1 — Wawa Sensei: `wass08/r3f-portfolio-final` (primary reference)

- Live: https://r3f-portfolio-final.vercel.app · Tutorial: https://youtu.be/LooODvrYXzE
- Commit: [`cc8dd29`](https://github.com/wass08/r3f-portfolio-final/tree/cc8dd2972fe7ef169954d270f782afe364e62f4a) (2023-09-25, "fix deps") · 31 stars
- Stack: React 18, three 0.146, R3F 8.13, drei 9.75, framer-motion(-3d) 10, gsap, jotai, leva, Vite

| Ref | What it shows | Permalink | Used in our design |
|---|---|---|---|
| R1.1 | **One avatar, one position per section.** A `motion.group` whose `variants` map section 0–3 to x/y/z/rotation; `animate={""+section}` springs between them | [Experience.jsx L75–L115](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Experience.jsx#L75-L115) | The core idea. We keep "one avatar, a target per section" but express targets as screen-space anchors ([04](04-system-design.md) §3) |
| R1.2 | Section from scroll: `Math.floor(scroll * pages)` clamped to 3 | [Experience.jsx L46–L55](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Experience.jsx#L46-L55) | Replaced by an IntersectionObserver ([ADR-0001](adr/0001-native-scroll-overlay.md)) |
| R1.3 | Travel clip: on section change play `Falling`, then after a 600 ms timer `Typing`/`Standing` | [Experience.jsx L38–L44](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Experience.jsx#L38-L44) | Kept the idea of a travel clip; replaced the timer with arrival detection ([ADR-0005](adr/0005-arrival-based-clips.md)) |
| R1.4 | Mixamo clips on a Ready Player Me avatar: load GLB + FBX clips, rename each clip, bind with `useAnimations` | [Avatar.jsx L18–L35](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Avatar.jsx#L18-L35) | Same binding, but all clips merged into one GLB ([05](05-avatar-pipeline.md)) |
| R1.5 | Crossfade: `reset().fadeIn(0.5).play()`, cleanup `fadeOut(0.5)` | [Avatar.jsx L47–L52](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Avatar.jsx#L47-L52) | Same crossfade, 0.3 s |
| R1.6 | Head/upper-body follow by bone name (`Head`, `Spine2`) | [Avatar.jsx L37–L45](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Avatar.jsx#L37-L45) | Head turns toward the pointing target, clamped |
| R1.7 | Page model: `ScrollControls pages={4}` with `<Scroll>` (3D) and `<Scroll html>` (DOM) inside the canvas | [App.jsx L30–L38](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/App.jsx#L30-L38) | **Rejected** ([ADR-0001](adr/0001-native-scroll-overlay.md)) |

Defects found in R1 (we must not reproduce them):

| Defect | Where | Our guard |
|---|---|---|
| Two `section` states (App's and Experience's) that can disagree | [App.jsx L14](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/App.jsx#L14), [Experience.jsx L22](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Experience.jsx#L22) | One store, one writer ([03](03-architecture.md) §5) |
| `setTimeout` never cleared; fast scrolling applies stale clips | [Experience.jsx L41](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Experience.jsx#L41) | No timers in clip selection; unit-tested state machine |
| New materials allocated on every render | [Office.jsx L22–L32](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Office.jsx#L22-L32) | Materials created once in `useMemo` |
| `new THREE.Color()` every frame | [Background.jsx L17](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Background.jsx#L17) | Module-level scratch vectors; lint rule in review checklist |
| `addEventListener` return value (undefined) passed to `removeEventListener`; rAF loop never cancelled | [Cursor.jsx L27–L37](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Cursor.jsx#L27-L37) | Named handlers; every effect returns real cleanup |
| `for=` instead of `htmlFor` | [Interface.jsx L267](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Interface.jsx#L267) | TypeScript + eslint-plugin-jsx-a11y |
| `leva` debug panel bundled in production | [Avatar.jsx L12–L16](https://github.com/wass08/r3f-portfolio-final/blob/cc8dd2972fe7ef169954d270f782afe364e62f4a/src/components/Avatar.jsx#L12-L16) | No leva; debug values behind `process.env.NODE_ENV` |

---

## R2 — `dayinji/sen-3d-resume` (architecture reference, MIT)

- Live: https://about.senbuzy.com · 546 stars
- Commit: [`c9a9fe3`](https://github.com/dayinji/sen-3d-resume/tree/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3) (2026-08-08)
- Stack: React 18, three 0.169, R3F 8.17, drei 9.114, postprocessing, framer-motion 11, zustand 4, Vite. App lives in `web/`

| Ref | What it shows | Permalink | Used in our design |
|---|---|---|---|
| R2.1 | **Fixed canvas behind normal DOM content with native scroll.** `.scene-bg { position: fixed; inset: 0; pointer-events: none }` | [styles.css L41–L46](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/styles.css#L41-L46) | Our overlay is the same, but on top (z-index above content) and transparent ([ADR-0001](adr/0001-native-scroll-overlay.md)) |
| R2.2 | Canvas config: `dpr={[1, 1.5]}`, `<Suspense fallback={null}>` | [App.tsx L127–L139](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/App.tsx#L127-L139) | Same dpr cap |
| R2.3 | **DOM anchors drive the 3D state.** Each frame reads `getBoundingClientRect()` of `[data-point]` elements against a reference line at 30% of the viewport | [Scene.tsx L296–L334](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/scene/Scene.tsx#L296-L334) | Same principle (DOM is the source of truth), but event-driven with IntersectionObserver instead of per-frame layout reads |
| R2.4 | "Dwell" remap: hold still near each node, move quickly between | [Scene.tsx L303–L311](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/scene/Scene.tsx#L303-L311) | Equivalent effect from snapping to one anchor per section plus damping |
| R2.5 | Frame-rate-independent damping `a = 1 - damping^dt` | [Scene.tsx L296–L297](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/scene/Scene.tsx#L296-L297) | We use `maath/easing.damp3`, the same idea packaged ([ADR-0004](adr/0004-maath-over-framer-motion-3d.md)) |
| R2.6 | Reused scratch objects "to avoid per-frame allocation" | [Scene.tsx L281–L294](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/scene/Scene.tsx#L281-L294) | Same rule |
| R2.7 | Mobile detection: `(pointer: coarse)` or width ≤ 640 | [Scene.tsx L266–L272](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/scene/Scene.tsx#L266-L272) | We switch on width only (1280 px), because a touch laptop is still wide enough for the full-size robot |
| R2.8 | Clamped look-at (max yaw 15°, pitch 8°) with slerp smoothing | [Scene.tsx L462–L490](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/scene/Scene.tsx#L462-L490) | Head-toward-target clamp |
| R2.9 | Loading overlay driven by drei `useProgress`, timers cleaned up | [LoadingScreen.tsx L8–L32](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/ui/LoadingScreen.tsx#L8-L32) | We do **not** block the page with an overlay; we use the same progress signal to start the intro |
| R2.10 | Single source of truth for stops, read by both the scene and the DOM | [focusPoints.ts L1–L20](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/data/focusPoints.ts#L1-L20) | `web/src/data/guide.ts` plays this role, and a unit test enforces it |
| R2.11 | Small global store (zustand) | [store.ts L1–L21](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/web/src/store.ts#L1-L21) | Same shape, but written on `useSyncExternalStore` (no dependency) |
| R2.12 | Deploy guide for Cloudflare Pages with the app in `web/` (Root directory = `web`) | [tutor/部署教程/2-部署到-Cloudflare-Pages.md](https://github.com/dayinji/sen-3d-resume/blob/c9a9fe373cde72c77ff7f2dabde17fb79dce89b3/tutor/%E9%83%A8%E7%BD%B2%E6%95%99%E7%A8%8B/2-%E9%83%A8%E7%BD%B2%E5%88%B0-Cloudflare-Pages.md) | Our fallback host uses the same layout ([07](07-hosting.md)) |

---

## R3 — `Sameer069/portfolio` (speech bubble reference)

- Commit: [`7f3552f`](https://github.com/Sameer069/portfolio/tree/7f3552f1f9818bbc9dbd5cf69d695666babf6720) (2026-10-01). Its listed Vercel URL returned 404 on 2026-10-05
- Stack: **Next 16.3 + React 19.2 + R3F 9.7 + drei 10.7 + three 0.185**: the same major versions we plan, so it proves the combination builds

| Ref | What it shows | Permalink | Used in our design |
|---|---|---|---|
| R3.1 | Typewriter: reveal one character per tick, stop() clears the interval | [lib/speech.ts L141–L175](https://github.com/Sameer069/portfolio/blob/7f3552f1f9818bbc9dbd5cf69d695666babf6720/lib/speech.ts#L141-L175) | Bubble typewriter, written as a React hook with cleanup |
| R3.2 | "Talking" without lip-sync: small sine sway of the head while speaking | [components/Avatar3D.tsx L39–L60](https://github.com/Sameer069/portfolio/blob/7f3552f1f9818bbc9dbd5cf69d695666babf6720/components/Avatar3D.tsx#L39-L60) | Optional head sway while a bubble types, for avatars without a Talking clip |
| R3.3 | Web Speech API voice | [lib/speech.ts L42–L67](https://github.com/Sameer069/portfolio/blob/7f3552f1f9818bbc9dbd5cf69d695666babf6720/lib/speech.ts#L42-L67) | **Not used** (D4: no voice) |
| R3.4 | Free Vercel deploy guide for Next.js | [DEPLOYMENT.md](https://github.com/Sameer069/portfolio/blob/7f3552f1f9818bbc9dbd5cf69d695666babf6720/DEPLOYMENT.md) | Cross-check for [07](07-hosting.md) |

---

## R4 — `awaisahmad6059/3D-Portfolio` (character rig reference)

- Live: https://awais-ahmad-portfolio-black.vercel.app
- Commit: [`662824a`](https://github.com/awaisahmad6059/3D-Portfolio/tree/662824ad10a80b4558b8349b22420c17a9306d70) (2026-10-01)
- Stack: React 18, three 0.168, R3F 8.17, gsap ScrollTrigger, lenis, Draco-compressed character, Vite

| Ref | What it shows | Permalink | Used in our design |
|---|---|---|---|
| R4.1 | Draco-compressed character (1.44 MB → 0.73 MB) with a plain-loader fallback if decoding fails | [character.ts L30–L50](https://github.com/awaisahmad6059/3D-Portfolio/blob/662824ad10a80b4558b8349b22420c17a9306d70/src/components/Character/utils/character.ts#L30-L50) | We compress with Meshopt instead (no WASM decoder to host), keep the "fallback if load fails" idea |
| R4.2 | **Bone-filtered clips**: build a new clip from only the tracks for chosen bones | [animationUtils.ts L85–L113](https://github.com/awaisahmad6059/3D-Portfolio/blob/662824ad10a80b4558b8349b22420c17a9306d70/src/components/Character/utils/animationUtils.ts#L85-L113) | Upper-body-only Point clip layered over Idle legs, if the full-body Point clip looks stiff (stretch goal) |
| R4.3 | Head bone follows the mouse, clamped, and stops after 200 px of scroll | [mouseUtils.ts L36–L82](https://github.com/awaisahmad6059/3D-Portfolio/blob/662824ad10a80b4558b8349b22420c17a9306d70/src/components/Character/utils/mouseUtils.ts#L36-L82) | Head-follow only in the hero, then head-to-target |
| R4.4 | Per-section ScrollTrigger timelines that rotate the character and move it with `x: "-25%"`, desktop only (`innerWidth > 1024`) | [GsapScroll.ts L44–L72](https://github.com/awaisahmad6059/3D-Portfolio/blob/662824ad10a80b4558b8349b22420c17a9306d70/src/components/utils/GsapScroll.ts#L44-L72), [L101–L130](https://github.com/awaisahmad6059/3D-Portfolio/blob/662824ad10a80b4558b8349b22420c17a9306d70/src/components/utils/GsapScroll.ts#L101-L130) | Confirms the "character turns toward the content" choreography and a desktop gate. We do it without gsap |

---

## R5 — `HxnDev/Portfolio` (mode switch and reduced-motion reference)

- Live: https://hxndev.com
- Commit: [`d32e989`](https://github.com/HxnDev/Portfolio/tree/d32e9894db9e8b53bafb3a20a6ba136d514dfef9) (2026-07-12)
- Stack: React 18, three 0.171, R3F 8.18, gsap, lenis, Vite, Vercel

| Ref | What it shows | Permalink | Used in our design |
|---|---|---|---|
| R5.1 | **"Recruiter mode"**: a persisted switch that turns the cinematic layer off; storage access wrapped in try/catch | [UIModeProvider.jsx L4–L27](https://github.com/HxnDev/Portfolio/blob/d32e9894db9e8b53bafb3a20a6ba136d514dfef9/src/components/core/UIModeProvider.jsx#L4-L27) | Our "Guide on/off" toggle |
| R5.2 | Smooth-scroll layer skipped under `prefers-reduced-motion` | [SmoothScroll.jsx L15–L35](https://github.com/HxnDev/Portfolio/blob/d32e9894db9e8b53bafb3a20a6ba136d514dfef9/src/components/core/SmoothScroll.jsx#L15-L35) | Same media-query gate for travel and intro |
| R5.3 | Scroll progress → active "act" index; React state updates only when the index changes | [CinematicStage.jsx L38–L58](https://github.com/HxnDev/Portfolio/blob/d32e9894db9e8b53bafb3a20a6ba136d514dfef9/src/components/home/CinematicStage.jsx#L38-L58) | Our store only notifies on a changed section id |
| R5.4 | Vercel hosting, SPA rewrites in `vercel.json` | [README.md L100–L102](https://github.com/HxnDev/Portfolio/blob/d32e9894db9e8b53bafb3a20a6ba136d514dfef9/README.md#L100-L102) | Not needed (single page, static export) |

---

## R6 — Rejected or unverified

| Candidate | Why it is not cited |
|---|---|
| ratanchaurasiya.github.io | A search result described a speech bubble with nav chips. On 2026-10-05 the live page was 6 KB with no avatar code, and the repo `ratanchaurasiya/ratanchaurasiya.github.io` holds a different person's Next.js site. Unverified, so not used |
| MubeenAmjad205/portfolio | Repo returned 404 on 2026-10-05 |

---

## R7 — Tools, assets and platform docs

| Ref | Source | Used for |
|---|---|---|
| R7.1 | Ready Player Me shut down 2026-01-31 after the Netflix acquisition ([Genies summary](https://genies.com/blog/ready-player-me-discontinued-alternatives), [Ryan Schultz](https://ryanschultz.com/tag/ready-player-me/)) | Why R1's avatar source is unavailable |
| R7.2 | MetaPerson Creator, https://metaperson.avatarsdk.com: free personal avatar from a selfie, GLB export, described as Mixamo-ready ([avatarsdk.com](https://avatarsdk.com/ready-player-me-alternative/)) | Kunj's avatar (D1) |
| R7.3 | Mixamo, https://www.mixamo.com (free Adobe account) | Wave, Talking, Pointing, Idle, Walking, Thumbs Up clips |
| R7.4 | three.js `examples/models/gltf/RobotExpressive` ([README](https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf/RobotExpressive)), CC0, clips include Idle, Walking, Wave, ThumbsUp, Yes | Placeholder avatar during development |
| R7.5 | glTF Transform CLI 4.5 (`@gltf-transform/cli`), https://gltf-transform.dev | Merge, prune, Meshopt-compress the GLB |
| R7.6 | npm registry on 2026-10-05: next 16.3.8, react 19.3.0, three 0.186.1, @react-three/fiber 9.8.1 (peer react ≥19 <19.4), @react-three/drei 10.7.9, maath 0.10.8, framer-motion-3d 12.4.13 (peer R3F 8.2.2) | Version pins and [ADR-0004](adr/0004-maath-over-framer-motion-3d.md) |
| R7.7 | Hosting docs: [Vercel limits](https://vercel.com/docs/limits) (updated 2026-09-16), [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits), [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [Render free](https://render.com/docs/free), [Render 2026 plan change](https://jwatte.com/blog/render-com-platform-review.md), [Netlify pricing](https://www.netlify.com/pricing/) | [07-hosting](07-hosting.md) |
