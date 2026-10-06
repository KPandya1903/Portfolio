# ADR-0003: Static export (`output: "export"`), no server code

- Status: Accepted, 2026-10-05

## Context
The live site is a Next.js app on Vercel, but uses no server features that matter at runtime (its GitHub API helper
is unused). Free hosts differ mainly in how they treat server functions; static files are portable everywhere.

## Decision
Build with `output: "export"`, `images.unoptimized: true`, `trailingSlash: true`. `robots.ts` and `sitemap.ts` use
`export const dynamic = "force-static"`. Contact is links (email, LinkedIn, GitHub), not a form.

## Consequences
+ The same `out/` folder deploys to Vercel, Cloudflare Pages, GitHub Pages or any CDN ([07 hosting](../07-hosting.md)).
+ Zero function invocations, no cold starts, no secrets.
- No `next/image` optimisation; images must be pre-sized (there are few images).
- No contact form. Revisit with a form service only if Kunj wants one.
