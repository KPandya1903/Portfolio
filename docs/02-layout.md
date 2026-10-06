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

## 2. Screen modes

| Mode | Width | Avatar | Bubble | Content |
|---|---|---|---|---|
| `wide` | ≥ 1280 px | ~42% of viewport height (clamped 260–420 px), standing in a 280 px left rail | Above the avatar's head, inside the rail, fixed 248 px wide | Shifted right by the rail (`padding-left: 280px` on each `main > section`, so backgrounds stay full width) |
| `compact` | < 1280 px | 120 px tall, bottom-left corner, 16 px from the edges | Above the avatar, fixed 220 px wide, auto-hides after 5 s | Full width; nothing shifts |
| any + reduced motion | — | Appears at each anchor without travel; Idle clip only | Shown, no typewriter | As above |
| guide off | — | Not rendered (canvas unmounted) | None | Rail padding removed |

The breakpoint is width only. [R2.7](01-references.md#r2--dayinjisen-3d-resume-architecture-reference-mit) uses
`(pointer: coarse)` as well, but a touchscreen laptop has room for the rail.

## 3. Wireframes

### 3.1 Wide (1440 × 900): intro, frame by frame

```
t = 0.0 s  page paints normally; the canvas is still loading
┌──────────────────────────────── navbar ─────────────────────────────────┐
│ rail │                    Kunj Pandya                                    │
│      │          Software Engineer · Distributed Systems & Applied ML     │
│      │              [View Projects] [Get in Touch] [Resume]              │
└──────┴──────────────────────────────────────────────────────────────────┘

t ≈ 0.4 s  avatar ready → hero content dims to 15% → avatar appears center, waves
┌──────────────────────────────── navbar ─────────────────────────────────┐
│ rail │      ┌──────────────────────────────────────┐                     │
│      │      │ Hi, I'm Kunj. I build distributed    │  ← bubble types     │
│      │      │ systems and ML that ships. ...       │                     │
│      │      └───────────────────▽──────────────────┘                     │
│      │                         (o)/   ← Wave clip                        │
│      │                         /|                                        │
│      │                         / \          (hero at 15% opacity)       │
└──────┴──────────────────────────────────────────────────────────────────┘

t ≈ 4.5 s  bubble closes → hero fades back to 100% → avatar walks left (Travel clip)

t ≈ 5.3 s  arrives in the rail → Point clip, turned toward the resume button, button ring flashes
┌──────────────────────────────── navbar ─────────────────────────────────┐
│┌────────────┐│                 Kunj Pandya                               │
││My resume is││   Software Engineer · Distributed Systems & Applied ML    │
││right here. ││                                                           │
│└─────▽──────┘│      [View Projects] [Get in Touch] ((Resume))  ← ring   │
│    (o)──→    │                                                           │
│    /|        │                                                           │
│    / \       │                                                           │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### 3.2 Wide: scrolling through sections

```
┌──────────────┬──────────────────────────────────────────────────────────┐
│┌────────────┐│  Technical Skills   ← ring flashes on the heading         │
││The toolbox,││  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
││grouped by  ││  │Languages │ │Distrib.  │ │AI / ML   │                   │
││what it's   ││  └──────────┘ └──────────┘ └──────────┘                   │
││for.        ││                                                           │
│└─────▽──────┘│                                                           │
│    (o)──→    │                                                           │
│    /|        │                                                           │
│    / \       │                                                           │
└──────────────┴──────────────────────────────────────────────────────────┘
  rail: avatar stays in the rail and turns between Point / Idle / ThumbsUp
```

### 3.3 Compact (390 × 844 phone)

```
┌───────────────────────┐
│ ☰               Kunj  │
│                        │
│   Kunj Pandya          │
│   Software Engineer…   │
│   [Projects] [Resume]  │
│                        │
│┌──────────────┐        │
││My resume is  │        │
││right here.   │        │
│└──▽───────────┘        │
│ (o)                    │  ← 120 px avatar, bottom-left, 16 px inset
│ /|\                    │
└───────────────────────┘
Intro on phones: avatar appears center at 40% of viewport height, waves, bubble types,
then shrinks into the corner. Same timing as wide.
```

## 4. Design tokens

Carried over from the live site's Tailwind theme (`Prep/Portfolio/.../tailwind.config.ts`) so the rebuild keeps
Kunj's warm coffee palette. Defined as CSS variables (Tailwind 4 `@theme`) under the live site's class names
(`bg-background`, `text-text-primary`, `shadow-card-lg`, …) so ported components work unchanged. The live site is
light-only (`color-scheme: light`; its ThemeToggle is unused), so v1 is light-only too. The dark column is the
planned v2 set.

| Token | Light (v1) | Dark (v2, planned) | Use |
|---|---|---|---|
| `--color-bg` | `#FAF8F5` | `#1B1512` | Page background, rail |
| `--color-surface` | `#F5F1EB` | `#241C18` | Alternate section background |
| `--color-surface-raised` | `#FEFDFB` | `#2E2420` | Cards, speech bubble |
| `--color-text` | `#3E2723` | `#F3ECE7` | Headings, body |
| `--color-text-muted` | `#6D4C41` | `#C9B8AF` | Secondary text |
| `--color-accent` | `#5D4037` | `#D7B8A8` | Buttons, links, highlight ring |
| `--color-border` | `#D7CCC8` | `#4A3B34` | Card and bubble borders |
| `--rail-width` | `280px` | — | Guide rail |
| `--radius-bubble` | `14px` | — | Bubble corners |

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

Under `prefers-reduced-motion: reduce`: no travel (position snaps), the body still turns toward the target but snaps without damping, no head look (angles zeroed), no ring pulse (static
outline for 1.6 s), no typewriter, no hero dim. Same gate as [R5.2](01-references.md).

## 6. Layering (z-index)

| Layer | z-index | Pointer events |
|---|---|---|
| Navbar | 50 | auto |
| Speech bubble | 45 | auto on the bubble only |
| Guide canvas | 40 | **none** (clicks pass through) |
| Page content | auto (0) | auto |
