# portfolio-3d

A rebuild of Kunj Pandya's portfolio around a 3D robot guide. The robot opens the site in the middle of the
screen, introduces Kunj in a speech bubble, then rests in the bottom-left corner over full-width content. At each new
section it walks to the centre of the screen for a few seconds to say that section's line, then walks back.

While resting, the robot's head follows the mouse and it looks at (and sometimes comments on) project cards, skill
groups, experience cards and timeline entries you hover. Clicking it waves and opens a small menu (Resume, Projects,
Experience, Skills, Contact). Phones get the corner robot and the menu only; reduced motion removes the walking,
cursor follow and hover reactions.

**Status (2026-10-07):** the site and the interactive guide are built in `web/` and run on the
CC0 placeholder robot, which stays (the custom look-alike avatar was dropped on 2026-10-06, see
[docs/00-overview.md](docs/00-overview.md) D11). The `3d` branch of `KPandya1903/Portfolio` deploys from its own
Vercel project; moving the `kunjpandya.vercel.app` domain to it is the cutover ([docs/07-hosting.md](docs/07-hosting.md)
§4.1 and §8) and has not been done. Open items: [docs/interactive-guide-notes.md](docs/interactive-guide-notes.md).
Performance notes (measured on the earlier rail layout): [docs/perf-2026-10-05.md](docs/perf-2026-10-05.md).

Run it: `cd web && npm install && npm run dev`, then open http://localhost:3000 in a private window (the intro
plays once per browser session). Add `?guideDebug=1` in development for the debug overlay. Checks, from `web/`:
`npm run lint && npm run typecheck && npm test && npm run build && npm run check:prod-strip && npm run e2e`
(`npm run e2e` serves `out/`, so build first; it runs Chromium, Firefox and WebKit with one worker, and
`npm run e2e:chromium` runs one browser). `check:prod-strip` fails if debug-overlay code is in the production build.

> The folder is `portfolio-3d`, not `portfolio`: this Mac's disk is case-insensitive, so `Prep/portfolio` would be
> the same folder as the existing `Prep/Portfolio` (the live site's repo).

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 0 | [docs/00-overview.md](docs/00-overview.md) | What we are building, Kunj's decisions, goals and non-goals, done criteria |
| 1 | [docs/01-references.md](docs/01-references.md) | Every reference repo, pinned to a commit, with line-level citations and licenses |
| 2 | [docs/02-layout.md](docs/02-layout.md) | Page layout, wireframes (corner, center stage, menu, phone), the intro storyboard, design tokens, motion spec |
| 3 | [docs/03-architecture.md](docs/03-architecture.md) | Stack, module map, directory tree, data model, state and data flow, module contracts |
| 4 | [docs/04-system-design.md](docs/04-system-design.md) | Frame loop, state machines, coordinate math, loading, performance, accessibility, failure modes |
| 5 | [docs/05-avatar-pipeline.md](docs/05-avatar-pipeline.md) | How Kunj's look-alike avatar and its animations are made (dropped on 2026-10-06; kept for reference) |
| 6 | [docs/06-guide-script.md](docs/06-guide-script.md) | What the avatar says in each section, and where every fact comes from |
| 7 | [docs/07-hosting.md](docs/07-hosting.md) | Free hosting compared (Vercel, Cloudflare Pages, GitHub Pages, Render, Netlify), the pick, step-by-step deploy |
| 8 | [docs/adr/](docs/adr/) | Six architecture decision records |
| 9 | [docs/interactive-guide-notes.md](docs/interactive-guide-notes.md) | Open questions and known trade-offs of the interactive guide |
| 10 | [docs/superpowers/plans/2026-10-05-avatar-portfolio.md](docs/superpowers/plans/2026-10-05-avatar-portfolio.md), [2026-10-06-interactive-guide.md](docs/superpowers/plans/2026-10-06-interactive-guide.md) | Task-by-task implementation plans: the base guide, then the interactive companion |

## One-paragraph architecture

A static Next.js 16 site (`output: "export"`) renders all content as normal HTML with native scrolling. A single
fixed, transparent, click-through React Three Fiber canvas sits on top and draws only the avatar. An
`IntersectionObserver` reports the active section; a small store holds the guide's state; every frame the avatar
eases toward a screen-space anchor (the corner, or the centre during the intro and a stage), picks where to look
(hovered item, cursor, or the section's target) and switches animation clips. One small transparent button over the
resting robot is the only click target. The site has no
server code, so it can be hosted free on Vercel (primary) with Cloudflare Pages as the fallback.

## Related

- Live site today: https://kunjpandya.vercel.app (repo `KPandya1903/Portfolio`, local `Prep/Portfolio`)
- First-pass plan written against the live repo: `Prep/Portfolio/Desktop/Projects/Portfolio/docs/avatar-guide-plan.md`.
  This folder supersedes it.
