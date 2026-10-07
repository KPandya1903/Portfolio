# Interactive Guide (center stage + corner companion) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development. Steps use checkbox syntax. Strict TDD (see superpowers:test-driven-development).

**Goal:** Replace the left-rail layout with a small bottom-left companion robot that does a short "center stage" moment at each new section, follows the cursor, reacts to hovered items, and opens quick-jump chips when clicked.

**Decisions (Kunj, 2026-10-06):** placement D (center stage at section breaks), resting corner bottom-left, interactions: cursor-follow, hover reactions, quick-jump chips, click-to-react; tone subtle and professional; robot stays the CC0 placeholder (custom avatar dropped).

**Architecture:** the existing store/state-machine design stays. New pure modules (stage rules, hover rules, chips model) are unit-tested; R3F glue stays thin. The canvas remains `pointer-events: none` except for one small invisible click target (DOM button) over the resting robot. Content goes back to full width (no rail).

**Tech Stack:** unchanged (Next 16 static export, React 19, R3F 9, drei 10, maath, Vitest + happy-dom, Playwright).

## Behaviour spec

| Topic | Rule |
|---|---|
| Resting spot | Bottom-left corner, 16 px inset, height 140 px (wide and compact; compact keeps 120 px). No rail: `--rail-width` padding removed. |
| Center stage | When a section becomes active for the FIRST time this page view (excluding `hero`, whose stage is the intro) the robot walks to the viewport centre, scales to ~45% of viewport height (clamp 260–420 px), plays Talk, shows that section's line (typewriter), holds `STAGE_HOLD_MS = 3500` after typing finishes or 4500 ms total max, then walks back to the corner. Scrolling is never blocked. |
| Skip stage | Skip (show the line from the corner, no walk) when: reduced motion; compact (phone) mode; the section was active for less than `STAGE_MIN_DWELL_MS = 700` (fast scroll-through) at the moment the stage would start; a stage is already running; intro not `done`; the guide was turned off. A section staged once is never staged again this page view. |
| Interrupt | If the active section changes during a stage, end the stage immediately (walk back) and apply the skip rules to the new section. |
| Cursor follow | While resting (not staging, not in intro), head + eyes-direction look at the cursor (pointer position in viewport px), clamped like the existing head look; when no pointer movement for 2 s, ease back to the section target. Disabled under reduced motion and on coarse pointers. |
| Hover reactions | Elements marked `data-guide-hover="<id>"` (project cards, skill groups, experience cards, timeline entries) make the robot turn its head/body to that element and show the line registered for `<id>` in config (fallback: no bubble, just look). Rate limit: one hover line per `HOVER_COOLDOWN_MS = 6000`, only after hover dwell `HOVER_DWELL_MS = 350`, never during intro/stage; hovering ends the look after leave + 800 ms. |
| Click | The robot has a click target (DOM `button`, `aria-label="Open guide menu"`, ~140×140 px over the resting robot, only when the guide is enabled+available). Click → small reaction clip (Wave, plays once) and toggles the chips menu. |
| Chips | A small menu next to the bubble: Resume (opens the resume PDF in a new tab), Projects, Experience, Skills, Contact. A section chip smooth-scrolls to that section and (subject to the stage rules, but force-allowed even if staged before) triggers its center stage. Closes on chip click, Escape, click outside, or section change by scrolling. Keyboard: the click target is focusable; chips are buttons in a `role="menu"`-free simple list (plain buttons in a `nav` with `aria-label="Guide menu"`). |
| Phones (compact) | Corner robot only; no stage; tap opens chips; no cursor-follow; hover reactions off. |
| Reduced motion | No walking, no stage; corner robot snaps; line shown from the corner; cursor-follow and hover look off. |

New config (in `web/src/guide/config.ts`): `STAGE_HOLD_MS`, `STAGE_MIN_DWELL_MS`, `HOVER_DWELL_MS`, `HOVER_COOLDOWN_MS`, `HOVER_LINES: Record<string,string>` (every line ≤ 120 chars; numbers only from site data, same test as stop lines), `CHIPS: { id; label; target: "resume" | sectionId }[]`.

## Tasks

### Task 1: Corner layout (remove the rail)
Files: `web/src/guide/anchors.ts` (+ tests), `web/src/app/globals.css`, `web/e2e/guide.spec.ts`, `web/src/guide/GuideAvatar.tsx` (only as needed for anchor shape), `web/src/guide/config.ts` (`wide.y` no longer used for position: keep `GuideStop.wide` only if still referenced; otherwise remove it and its tests/docs mentions).
- Resting anchor: bottom-left, x = 16 + height×0.3, y = vh − 16 − height/2, height 140 (wide) / 120 (compact).
- Remove the rail padding CSS and `RAIL_WIDTH`; `setRailFreed`/`data-guide="off"` no longer exists for layout purposes — keep the attribute only if something else needs it, otherwise delete `setRailFreed` and its tests (the "frees the rail" behaviour becomes "guide unavailable → nothing reserved", which is trivially true). Update e2e tests that asserted 280 px padding (replace with: sections have no left padding added by the guide, on every project).
- Intro anchor (center) unchanged; "leaving" walks to the new corner spot.
- Head look yaw toward targets keeps working from the corner (targets are to the right).
- Spec for tests: updated anchors tests (resting anchors for wide/compact, clamps), no rail CSS in globals.css.

### Task 2: Center stage
Files: new `web/src/guide/stageRules.ts` (+ tests), `store.ts` (stage state + tests), `anchors.ts` (stage anchor, + tests), `clipMachine.ts` (stage → Talk, + tests), `GuideAvatar.tsx`, `useIntroSequence`-style `useStage.ts` hook for the timers (+ tests), `SpeechBubble` (position near centered robot: bubble above head works unchanged), `config.ts`.
- `shouldStage({sectionId, staged:Set, dwellMs, reducedMotion, mode, intro, stageActive, forced}) → boolean` pure.
- Store: `stage: { sectionId: string } | null`, `staged` set, actions `startStage(id)`, `endStage()`; section change during a stage ends it.
- Timers live only in `useStage` (cleared on unmount/phase change). `STAGE_HOLD_MS` etc. from config.
- Anchor: while `stage` is non-null the avatar targets the centre anchor (same numbers as the intro's centre anchor).
- Clip: stage → Talk (unless moving → Travel).
- The stop's `line` is shown via the bubble at stage start (instead of at arrival from the corner); when skipping the stage the line shows from the corner as today.

### Task 3: Cursor follow
Files: new `web/src/guide/usePointer.ts` (+ tests), `look.ts` (reuse `lookAngles`), `GuideAvatar.tsx`.
- `usePointer()` keeps a mutable `{x, y, active, lastMove}` (passive `pointermove` on window, `pointerType === "mouse"` only; rAF-free: just store values). Idle after 2 s → head target falls back to the section target. Gated by: not reduced motion, resting (no stage/intro), mode wide.

### Task 4: Hover reactions
Files: new `web/src/guide/hoverRules.ts` (+ tests), `useHoverTarget.ts` (+ tests), `config.ts` (`HOVER_LINES`), markup changes: add `data-guide-hover="…"` to project cards, skill group cards, experience cards, journey entries in `web/src/components/**` (minimal attribute additions).
- Pure `nextHover(state, event, now) → { state, say?: string, lookAt?: id | null }` implementing dwell, cooldown, leave delay. Event delegation on `document` (`pointerover/out` with `closest("[data-guide-hover]")`), cleaned up on unmount.
- The look target is the hovered element's centre (reuse `useTargetCenter`-style measurement; refresh on scroll).

### Task 5: Click target + chips
Files: new `GuideHotspot.tsx`, `GuideChips.tsx`, `chips.ts` (pure: `scrollToChip`, model) (+ tests), `SpeechBubble`/`GuideRoot` wiring, `store.ts` (`menuOpen`), CSS.
- Hotspot: absolutely positioned `button` over the resting robot (fixed, bottom-left, 140 px), transparent, `pointer-events: auto`, focusable, hidden from layout when stage/intro is active.
- Chips as specified; Resume chip opens `/Kunj_Pandya_Resume.pdf`; section chips `scrollIntoView({behavior: "smooth"})` then `startStage(id)` with `forced: true`.
- Escape/outside click/scroll-away closes; focus returns to the hotspot.

### Task 6: Integration, e2e, docs
- Playwright: stage plays once for a new section and not again; fast scroll skips it; phone has no stage; chips navigate; cursor-follow/hover covered with unit tests + one e2e each (hover a project card → bubble line).
- Update docs (02, 03, 04, 06) to the new behaviour; update README and the plan table; remove stale rail text.
- Final whole-branch review, then push to `3d`.
