# portfolio-3d

A rebuild of Kunj Pandya's portfolio around a 3D avatar guide. The avatar opens the site in the center of the
screen, introduces Kunj in a speech bubble, points at the resume, then docks on the left and points at each section
as the visitor scrolls.

**Status (2026-10-05):** docs only. No application code yet. The Next.js app will live in `web/` (Task 1 of the
implementation plan creates it).

> The folder is `portfolio-3d`, not `portfolio`: this Mac's disk is case-insensitive, so `Prep/portfolio` would be
> the same folder as the existing `Prep/Portfolio` (the live site's repo).

## Read in this order

| # | Document | What it answers |
|---|---|---|
| 0 | [docs/00-overview.md](docs/00-overview.md) | What we are building, Kunj's decisions, goals and non-goals, done criteria |
| 1 | [docs/01-references.md](docs/01-references.md) | Every reference repo, pinned to a commit, with line-level citations and licenses |
| 2 | [docs/02-layout.md](docs/02-layout.md) | Page layout, wireframes per screen size, the intro storyboard, design tokens, motion spec |
| 3 | [docs/03-architecture.md](docs/03-architecture.md) | Stack, module map, directory tree, data model, state and data flow |
| 4 | [docs/04-system-design.md](docs/04-system-design.md) | Frame loop, state machines, coordinate math, loading, performance, accessibility, failure modes |
| 5 | [docs/05-avatar-pipeline.md](docs/05-avatar-pipeline.md) | How Kunj's look-alike avatar and its animations are made (Kunj's to-do list) |
| 6 | [docs/06-guide-script.md](docs/06-guide-script.md) | What the avatar says in each section, and where every fact comes from |
| 7 | [docs/07-hosting.md](docs/07-hosting.md) | Free hosting compared (Vercel, Cloudflare Pages, GitHub Pages, Render, Netlify), the pick, step-by-step deploy |
| 8 | [docs/adr/](docs/adr/) | Six architecture decision records |
| 9 | [docs/superpowers/plans/2026-10-05-avatar-portfolio.md](docs/superpowers/plans/2026-10-05-avatar-portfolio.md) | Task-by-task implementation plan with tests and commands |

## One-paragraph architecture

A static Next.js 16 site (`output: "export"`) renders all content as normal HTML with native scrolling. A single
fixed, transparent, click-through React Three Fiber canvas sits on top and draws only the avatar. An
`IntersectionObserver` reports the active section; a small store holds the guide's state; every frame the avatar
eases toward a screen-space anchor for that section and switches animation clips when it arrives. The site has no
server code, so it can be hosted free on Vercel (primary) with Cloudflare Pages as the fallback.

## Related

- Live site today: https://kunjpandya.vercel.app (repo `KPandya1903/Portfolio`, local `Prep/Portfolio`)
- First-pass plan written against the live repo: `Prep/Portfolio/Desktop/Projects/Portfolio/docs/avatar-guide-plan.md`.
  This folder supersedes it.
