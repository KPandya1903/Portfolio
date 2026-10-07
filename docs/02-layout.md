# 02 — Layout

## 1. Information architecture

One page, eight sections, in the live site's order. The guide has one **stop** per section.

| Order | Section id | Content source (copied from the live site) | Guide stop | Avatar points at |
|---|---|---|---|---|
| 0 | `hero` | `siteMetadata` (name, title, tagline, availability), resume link | intro, then `hero` | `[data-guide-target="resume"]` |
| 1 | `journey` | `timeline.ts` | `journey` | `#journey h2` |
| 2 | `about` | `siteMetadata.bio`, `education.ts`, `achievements.ts` | `about` | none (talks) |
| 3 | `experience` | `experience.ts` | `experience` | the experience list (`[data-guide-target="experience-list"]`) |
| 4 | `projects` | `projects.ts` | `projects` | `#projects h2` |
| 5 | `linkedin` | `linkedinPosts.ts` (section hidden while empty) | skipped when absent | none |
| 6 | `skills` | `skills.ts` | `skills` | `#skills h2` |
| 7 | `contact` | email, LinkedIn, GitHub links | `contact` | contact links |

The stop's line is spoken at center stage for every section except `hero` (wide screens, motion allowed, first time
only); everywhere else it is spoken from the corner on arrival. The ring flash and the body turn happen at the resting
corner as the section becomes active; during a stage the robot faces forward.

## 2. Screen modes

There is no rail: content is full width in every mode and the guide reserves no space.

| Mode | Width | Resting robot | Bubble | Interactions |
|---|---|---|---|---|
| `wide` | ≥ 1280 px | 140 px tall, bottom-left, 16 px from the edges | Above the robot's head, fixed 248 px wide, kept 12 px inside the viewport | Center stage at new sections, cursor follow, hover reactions, click menu |
| `compact` | < 1280 px | 120 px tall, bottom-left, 16 px from the edges | Above the robot, fixed 220 px wide, auto-hides after 5 s | Click menu only (no stage, no cursor follow, no hover) |
| any + reduced motion | — | Appears at its spot without travel; Idle clip only | Shown, no typewriter | Click menu only; the click does not wave; a chip scrolls instantly |
| guide off | — | Not rendered (canvas, hotspot and menu unmounted) | None | None |

The breakpoint is width only. [R2.7](01-references.md#r2--dayinjisen-3d-resume-architecture-reference-mit) uses
`(pointer: coarse)` as well; here touch input is handled per feature instead: cursor follow and hover read only
`pointerType === "mouse"` events, while the click menu works for any pointer.

## 3. Wireframes

The robot is drawn `(o)`; `░` is the transparent hotspot over it.

### 3.1 Wide (1440 × 900): intro, frame by frame

```
t = 0.0 s  page paints normally (full width); the canvas is still loading
┌──────────────────────────────── navbar ─────────────────────────────────┐
│                           Kunj Pandya                                    │
│               Software Engineer · Distributed Systems & Applied ML       │
│                  [View Projects] [Get in Touch] [Resume]                 │
└──────────────────────────────────────────────────────────────────────────┘

t ≈ 0.4 s  model ready → hero content dims to 15% → robot appears centre, waves
┌──────────────────────────────── navbar ─────────────────────────────────┐
│            ┌──────────────────────────────────────┐                      │
│            │ Hi, I'm Kunj. I'm finishing my MS... │  ← bubble types      │
│            └───────────────────▽──────────────────┘                      │
│                              (o)/   ← Wave clip                          │
│                              /|        (hero at 15% opacity)            │
│                              / \                                         │
└──────────────────────────────────────────────────────────────────────────┘

t ≈ 4.5 s  bubble closes → hero fades back to 100% → robot walks to the corner (Travel clip)

t ≈ 5.3 s  arrives bottom-left → Point clip, body turned toward the resume button, ring flashes, hero line shows
┌──────────────────────────────── navbar ─────────────────────────────────┐
│                           Kunj Pandya                                    │
│               Software Engineer · Distributed Systems & Applied ML       │
│                                                                          │
│                  [View Projects] [Get in Touch] ((Resume))  ← ring       │
│                                                                          │
│┌──────────────┐                                                          │
││Want the one- │                                                          │
││page version? │                                                          │
│└─▽────────────┘                                                          │
│ (o)→                                                                     │
│ /|                                                                       │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Wide: resting while scrolling

```
┌──────────────────────────────────────────────────────────────────────────┐
│  Technical Skills   ← ring flashes on the heading                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                                  │
│  │Languages │ │Distrib.  │ │AI / ML   │   ← hovering a card: the robot   │
│  └──────────┘ └──────────┘ └──────────┘     looks at it and may speak    │
│                                                                          │
│┌──────────────┐                                                          │
││My toolbox,   │                                                          │
││grouped by... │                                                          │
│└─▽────────────┘                                                          │
│ (o)→   body turns toward the gaze (cursor, hovered card, or section      │
│ /|     target); content is full width, the robot floats over it          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Wide: center stage (first time a section becomes active, up to 4.5 s)

```
┌──────────────────────────────── navbar ─────────────────────────────────┐
│  Experience (content stays at 100% opacity)                              │
│            ┌──────────────────────────────────────┐                      │
│            │ Right now I build AI features for... │  ← bubble over head  │
│            └───────────────────▽──────────────────┘                      │
│                              (o)   ← ~45% of viewport height (260-420),  │
│                              /|\     centre of the screen, Talk clip     │
│                                                                          │
│ (corner empty: the hotspot is unmounted while the robot is away)         │
└──────────────────────────────────────────────────────────────────────────┘
After the stage the robot walks back to the corner; the line stays up until the section changes.
```

### 3.4 Wide: chips menu (after a click on the robot)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│                 (opening the menu clears any bubble)                     │
│                                                                          │
│                                                                          │
│ ░░░░░░  [Resume] [Projects] [Experience] [Skills] [Contact]              │
│ ░(o)/░   ← robot waves once; chips sit 8 px right of the hotspot,        │
│ ░/|░░░     bottom-aligned with it                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3.5 Compact (390 × 844 phone)

```
┌───────────────────────┐        ┌───────────────────────┐
│ ☰               Kunj  │        │ ☰               Kunj  │
│                        │        │                        │
│   Kunj Pandya          │        │   Skills ...           │
│   Software Engineer…   │        │                        │
│   [Projects] [Resume]  │        │                        │
│                        │        │                        │
│┌──────────────┐        │        │                        │
││My resume is  │        │        │ ░░░░  [Resume][Projects]│
││right here.   │        │        │ ░(o)  [Experience]      │
│└──▽───────────┘        │        │ ░/|   [Skills][Contact] │
│ (o)                    │        └───────────────────────┘
│ /|\                    │         tap the robot: it opens the menu;
└───────────────────────┘         chips wrap to stay on screen
```

Intro on phones: the robot appears centre at 40% of viewport height, waves, the bubble types, then it walks to the
120 px corner spot. Same timing as wide. After the intro a phone never stages, follows no cursor and ignores hover.

## 4. Design tokens

Carried over from the live site's Tailwind theme (`Prep/Portfolio/.../tailwind.config.ts`) so the rebuild keeps
Kunj's warm coffee palette. Defined as CSS variables (Tailwind 4 `@theme`) under the live site's class names
(`bg-background`, `text-text-primary`, `shadow-card-lg`, …) so ported components work unchanged. The live site is
light-only (`color-scheme: light`; its ThemeToggle is unused), so v1 is light-only too. The dark column is the
planned v2 set.

| Token | Light (v1) | Dark (v2, planned) | Use |
|---|---|---|---|
| `--color-background` | `#FAF8F5` | `#1B1512` | Page background |
| `--color-surface` | `#F5F1EB` | `#241C18` | Alternate section background |
| `--color-surface-light` | `#FEFDFB` | `#2E2420` | Cards, speech bubble |
| `--color-text-primary` | `#3E2723` | `#F3ECE7` | Headings, body |
| `--color-text-secondary` | `#6D4C41` | `#C9B8AF` | Secondary text |
| `--color-accent-primary` | `#5D4037` | `#D7B8A8` | Buttons, links, highlight ring |
| `--color-accent-cream` | `#D7CCC8` | `#4A3B34` | Card and bubble borders |
| `--color-border` | `rgba(93, 64, 55, 0.08)` | — | Hairlines |

Names and light values are the ones in `web/src/app/globals.css`. The bubble's 14 px corner radius is a literal in
`SpeechBubble.tsx`, not a token.

Fonts: Inter (body) and JetBrains Mono (code accents), both through `next/font`.

Avatar lighting matches the palette: hemisphere light sky `#FFF4EA`, ground `#5D4037`, intensity 1.1; one key
directional light `#FFE2CC` from upper right. No shadows (performance, [04](04-system-design.md) §6).

## 5. Motion spec

| Motion | Duration / curve | Source of the idea |
|---|---|---|
| Avatar travel between anchors | `maath` `damp3`, smoothTime 0.35 s | [R2.5](01-references.md) frame-rate-independent damping |
| Avatar yaw toward target | Body turns a fixed 0.6 rad (~34°) toward the target's side (sign only, 0 without a target), `dampE` 0.25 s | [R4.4](01-references.md) per-section rotation |
| Head toward target | `damp` smoothTime 0.15 s on yaw/pitch, clamp yaw ±40°, pitch ±20° | [R2.8](01-references.md), [R1.6](01-references.md) |
| Clip crossfade | 0.3 s | [R1.5](01-references.md) used 0.5 s |
| Bubble in / out | in: opacity + 6 px rise, 180 ms ease-out; out: opacity only, 120 ms ease-in; on exit the bubble stays mounted for 120 ms, inert, with its text frozen (no exit under reduced motion) | — |
| Typewriter | 35 characters per second; click finishes the line | [R3.1](01-references.md) |
| Target highlight ring | 2 px `--color-accent-primary` outline, 2 pulses over 1.6 s | — |
| Hero dim during intro | opacity 1 → 0.15 in 300 ms, back in 400 ms | — |
| Center stage | Walk out and back use the same `damp3` (0.35 s) as any travel; every stage lasts a fixed 4.5 s (`STAGE_MAX_MS`; the walk out counts against it, and every current line types well within it); scale target 45% of viewport height, clamp 260–420 px | Plan 2026-10-06 |
| Chips menu in / out | Same `guide-bubble-in` (180 ms ease-out, 6 px rise) and `guide-bubble-out` (120 ms ease-in) classes as the bubble; held mounted 120 ms while leaving; no animation under reduced motion | — |
| Click reaction | `Wave` clip once (crossfade 0.3 s), only while resting and not moving; a stage or a walk cancels it with no replay | — |
| Cursor look | Head: `damp` 0.15 s toward the mouse, clamp yaw ±40° / pitch ±20°; body: `dampE` 0.25 s, turns 0.6 rad toward the gaze's side, forward inside a 40 px dead zone. Active for 2 s after the last mouse move, only while resting on a wide screen | Plan 2026-10-06 |
| Hover look | Same angles and damping, aimed at the hovered item's cached centre; starts 350 ms after the pointer enters, ends 800 ms after it leaves; at most one line per 6 s | Plan 2026-10-06 |

Gaze precedence for head and body: hovered item, then the mouse cursor (while it moved in the last 2 s and the robot
is resting on a wide screen with motion allowed), then the section target, else straight ahead.

Under `prefers-reduced-motion: reduce`: no travel (position snaps), no center stage, no cursor follow, no hover
reaction, no click wave (the menu still opens), the body still turns toward the section target but snaps without
damping, no head look (angles zeroed), no ring pulse (static outline for 1.6 s), no typewriter, no hero dim, no
menu or bubble animation. Same gate as [R5.2](01-references.md).

## 6. Layering (z-index)

| Layer | z-index | Pointer events |
|---|---|---|
| Navbar | 50 | auto |
| Chips menu (`nav`, `aria-label="Guide menu"`) | 46 | auto on the buttons only; `inert` while closed |
| Speech bubble | 45 | auto on the bubble only |
| Robot hotspot (`button`, 140 px / 120 px over the resting robot) | 42 | auto; it blocks clicks to the page content under that corner box |
| Guide canvas | 40 | **none** (clicks pass through) |
| Page content | auto (0) | auto |
