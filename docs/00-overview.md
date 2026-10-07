# 00 — Overview

## The experience in one sentence

A visitor lands, a 3D robot appears in the middle of the screen, waves, says hello in a speech bubble and walks to
a small resting spot in the bottom-left corner. As the visitor scrolls, it walks back to the middle of the screen
for a few seconds at each new section, says one short line and returns to the corner. In the corner it follows the
mouse, reacts to hovered cards, and opens a quick-jump menu when clicked. Content is always full width.

## Decisions (Kunj, 2026-10-05)

| # | Question | Decision | Consequence |
|---|---|---|---|
| D1 | Avatar look | Should resemble Kunj; not an exact replica, but some of his features | Selfie-based avatar (MetaPerson Creator), see [05-avatar-pipeline](05-avatar-pipeline.md). **Dropped by D11**; the CC0 robot stays |
| D2 | Phones | Keep a small avatar in the corner, left side | `compact` mode below 1280 px: bottom-left corner (120 px), small bubbles, no center stage |
| D3 | Intro | Play once per browser session, for every visitor; no skip button | `sessionStorage` flag; scrolling away still ends it (the page never locks scrolling) |
| D4 | Voice | No audio. Text only | No Web Speech API, no sound files. Bubble text is first person ("Hi, I'm Kunj") because the avatar looks like him |
| D5 | Layout | Wide screens as they normally open on a laptop/desktop are fine | Originally a 280 px left rail at ≥1280 px. **Superseded by D7** (2026-10-06): the rail is gone and content is full width at every size |
| D6 | Project | New folder, docs first, built on cited references, free hosting | This folder; [01-references](01-references.md); [07-hosting](07-hosting.md) |

### Decisions (Kunj, 2026-10-06)

Made after seeing the rail build; they replace D5 and change D1's scope. Plan:
[2026-10-06-interactive-guide](superpowers/plans/2026-10-06-interactive-guide.md).

| # | Question | Decision | Consequence |
|---|---|---|---|
| D7 | Layout | No left rail. The robot rests in the bottom-left corner (140 px; 120 px on compact), 16 px from the edges | No `--rail-width`, no content padding, no layout shift from the guide ([02](02-layout.md) §2) |
| D8 | Where the robot shows its line | Center stage at section breaks: the first time a section (not the hero) becomes active on a wide screen with motion allowed, the robot walks to the screen centre, says the section's line, then returns | `stageRules.ts`, `useStage.ts`; skipped on compact, under reduced motion and on fast scroll-through ([04](04-system-design.md) §4.4) |
| D9 | Interactions | Cursor follow, hover reactions, click-to-open quick-jump chips | `usePointer`, `useHoverReaction`, `GuideHotspot`, `GuideChips` |
| D10 | Tone | Subtle and professional | One short first-person line per event; one hover line per 6 s; no sound |
| D11 | Avatar | The custom look-alike avatar (D1) is dropped; the CC0 robot stays | [05-avatar-pipeline](05-avatar-pipeline.md) is not on the critical path; `MODEL` still points at `robot-expressive.glb` |

Defaults chosen without asking (change any of them in the docs before Task 1 starts):
- Content is the live site's content (`Prep/Portfolio/.../src/data/*.ts`), copied, not rewritten. Numbers stay the
  repo-verified ones.
- No contact form backend. Contact is email, LinkedIn and GitHub links, so the site needs no server.
- A visible "Guide on/off" toggle in the navbar for visitors who find the avatar distracting.

## Goals

1. The guide works on a 1440 px laptop in Chrome, Safari and Firefox at 60 fps.
2. Every section's content is readable with the guide off, with JavaScript off, and by a screen reader.
3. First contentful paint is not delayed by the 3D code; the avatar loads after the page.
4. Hosting costs $0 a month at portfolio traffic.
5. Every borrowed idea is traceable to a reference repo at a pinned commit.

## Non-goals

- A 3D world, office scene or camera fly-through (Wawa's desk, sen-3d-resume's camera rail). Possible later.
- AI chat, voice input or text-to-speech (Sameer069's AI studio). Out by D4.
- A CMS. Content stays in TypeScript files.
- Replacing kunjpandya.vercel.app on day one. The new site deploys to its own URL first (see [07-hosting](07-hosting.md)).

## Done when

- [ ] Intro plays on first load of a new session, never twice in the same session.
- [ ] At rest the robot is in the bottom-left corner and content is full width at every viewport size.
- [ ] The first time each section (except the hero) becomes active on a wide screen, the robot walks to the centre, says the section's line and walks back within 4.5 s; it never stages the same section twice in a page view.
- [ ] Fast scrolling from top to bottom never leaves the avatar stuck in the travel clip, in the centre, or in the wrong spot.
- [ ] While resting, the head follows the mouse; hovering a project card, skill group, experience card or journey entry makes the robot look at it and (at most once per 6 s) say its line.
- [ ] Clicking the robot waves and opens the chips menu (Resume, Projects, Experience, Skills, Contact); Escape, an outside click or a section change closes it; it works from the keyboard.
- [ ] Below 1280 px the robot sits small in the bottom-left corner, never stages and ignores hover; nothing it covers is unreachable except the 120 px corner it occupies.
- [ ] `prefers-reduced-motion` gets no travel, no stage, no intro motion, no cursor follow, no hover reaction and no click wave; text still shows and the menu still works.
- [ ] Lighthouse (mobile preset): Performance ≥ 85, Accessibility ≥ 95, no LCP regression versus the live site.
- [ ] Deployed on a free host with preview deploys per branch ([07](07-hosting.md) §4.1: the `3d` branch has its own Vercel project).
