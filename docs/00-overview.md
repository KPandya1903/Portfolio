# 00 — Overview

## The experience in one sentence

A visitor lands, a 3D avatar that looks like Kunj appears in the middle of the screen, waves, says hello in a
speech bubble, walks to the left edge and points at the resume button; as the visitor scrolls, the avatar stays
on the left and points at each section's heading with one short line of text.

## Decisions (Kunj, 2026-10-05)

| # | Question | Decision | Consequence |
|---|---|---|---|
| D1 | Avatar look | Should resemble Kunj; not an exact replica, but some of his features | Selfie-based avatar (MetaPerson Creator), see [05-avatar-pipeline](05-avatar-pipeline.md) |
| D2 | Phones | Keep a small avatar in the corner, left side | `compact` mode below 1280 px: bottom-left corner, small bubbles |
| D3 | Intro | Play once per browser session, for every visitor; no skip button | `sessionStorage` flag; scrolling away still ends it (the page never locks scrolling) |
| D4 | Voice | No audio. Text only | No Web Speech API, no sound files. Bubble text is first person ("Hi, I'm Kunj") because the avatar looks like him |
| D5 | Layout | Wide screens as they normally open on a laptop/desktop are fine | 280 px left guide rail at ≥1280 px; content shifts right |
| D6 | Project | New folder, docs first, built on cited references, free hosting | This folder; [01-references](01-references.md); [07-hosting](07-hosting.md) |

Defaults chosen without asking (change any of them in the docs before Task 1 starts):
- Content is the live site's content (`Prep/Portfolio/.../src/data/*.ts`), copied, not rewritten. Numbers stay the
  repo-verified ones.
- No contact form backend. Contact is email, LinkedIn and GitHub links, so the site needs no server.
- A visible "Guide on/off" toggle in the navbar for visitors who find the avatar distracting.

## Goals

1. The avatar effect works on a 1440 px laptop in Chrome, Safari and Firefox at 60 fps.
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
- [ ] Avatar reaches each section's anchor, points, shows its line, and the target element flashes a highlight.
- [ ] Fast scrolling from top to bottom never leaves the avatar stuck in the travel clip or in the wrong spot.
- [ ] Below 1280 px the avatar sits small in the bottom-left corner; nothing it covers is unreachable.
- [ ] `prefers-reduced-motion` gets no travel animation and no intro motion; text still shows.
- [ ] Lighthouse (mobile preset): Performance ≥ 85, Accessibility ≥ 95, no LCP regression versus the live site.
- [ ] Deployed on a free host with preview deploys per branch.
