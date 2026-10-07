# 07 — Hosting

The site is a static export (`web/out/`: HTML, JS, CSS, the GLB, the resume PDF). It needs no server, no database
and no secrets, so any static host works. This doc compares the free options, picks one, and gives the exact setup.

## 1. What the site costs to serve

| Asset | Size (budget) | Cached after first visit? |
|---|---|---|
| HTML + CSS + fonts | ~150 KB | Yes |
| Page JS (Next runtime + sections) | ~150 KB gzip | Yes |
| Guide JS (three, R3F, drei subset, maath) | ≤ 260 KB gzip | Yes |
| `guide/kunj.glb` | ≤ 2.5 MB | Yes (immutable, versioned filename) |
| **First visit** | **≈ 3.1 MB** | |
| Repeat visit | ≈ 10–50 KB (HTML revalidation) | |

So 1 GB of bandwidth serves about **320 first visits**. A job-search portfolio might see a few hundred to a few
thousand visits a month.

## 2. Free tiers compared (checked 2026-10-05)

| Host | Free bandwidth | Builds | Other limits that matter | Commercial use | Fit |
|---|---|---|---|---|---|
| **Vercel Hobby** | 100 GB/month Fast Data Transfer (≈ 32,000 first visits) | 100 deployments/day; 45 min max build | Hard caps: no paying for overage on Hobby, so a traffic spike pauses usage rather than billing. Cannot connect repos owned by a GitHub **organisation** (personal repos are fine) | Personal, non-commercial only (a personal portfolio qualifies) | **Primary** |
| **Cloudflare Pages Free** | Unlimited bandwidth and requests | 500 builds/month | 20,000 files per site; 25 MiB max per file (the GLB is ~2.5 MB) | Allowed | **Fallback / mirror** |
| GitHub Pages | 100 GB/month *soft* limit; site ≤ 1 GB | 10 builds/hour soft (none with a custom Actions workflow) | Project pages live under `/portfolio-3d/`, so Next needs `basePath` | Not for business/e-commerce | Works, more setup |
| Render (static site) | Since 2026-04-23 a free Hobby workspace includes **5 GB/month**, then $0.15/GB (was 100 GB) | Pipeline minutes count against the workspace | Free *web services* sleep after 15 min idle and take about 1 min to wake (irrelevant here, no server) | Allowed | **Avoid**: 5 GB ≈ 1,600 first visits |
| Netlify Free | 300 credits/month; bandwidth costs 20 credits/GB, so at most 15 GB if credits went only to bandwidth | Builds also spend credits | — | — | Possible, smallest headroom after Render |

Sources: [Vercel limits](https://vercel.com/docs/limits) (page updated 2026-09-16; Hobby allotments per
[makerkit](https://makerkit.dev/blog/saas/vercel-cost) and [fencode](https://www.fencode.dev/en/blog/vercel-free-vs-pro-2026-official-limits-pricing)),
[Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits),
[GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits),
[Render free tier](https://render.com/docs/free), [Render 2026 plan change](https://jwatte.com/blog/render-com-platform-review.md),
[Netlify pricing](https://www.netlify.com/pricing/). Free tiers change often (Render cut bandwidth 20× this year);
recheck before relying on a number.

## 3. Decision

**Vercel Hobby as primary**, because:
- Kunj already deploys kunjpandya.vercel.app there with push-to-deploy, so there is nothing new to learn.
- Next.js is Vercel's own framework; preview URLs for every branch come free, which suits the "deploy beside the
  live site first" plan.
- 100 GB/month is about 100× the expected traffic.

**Cloudflare Pages as the fallback**, set up at the same time, because it has no bandwidth cap at all and the same
static export deploys there unchanged. If Vercel ever pauses the project (a viral post, a terms change), switch the
link on the resume to the `*.pages.dev` URL. [R2.12](01-references.md) documents the same `web/` layout on Cloudflare.

**Not Render or Netlify**: they work, but give the least bandwidth for a site that ships a 2.5 MB model.
**GitHub Pages** stays an emergency third option (see §6).

## 4. Setup: Vercel (primary)

Prerequisites: GitHub account `KPandya1903` active (`gh auth status` shows it as the active account). The Vercel
dashboard is used, not the CLI: the Vercel CLI on this machine is logged in to a different account that cannot
see Kunj's Vercel projects.

Steps 1-2 are the original plan (new repo); [§4.1](#41-what-was-actually-set-up-a-separate-project-for-the-3d-branch) says what was done instead.

1. Create the repo (Kunj approves first; this publishes code):
   ```bash
   cd ~/Desktop/Prep/portfolio-3d
   gh repo create KPandya1903/portfolio-3d --private --source . --push
   ```
   Private is fine on Vercel Hobby. Make it public later if the code itself should be part of the portfolio.
2. Go to vercel.com → **Add New… → Project** → import `KPandya1903/portfolio-3d`.
3. Settings:
   | Field | Value |
   |---|---|
   | Framework preset | Next.js |
   | Root directory | `web` |
   | Build command | `npm run build` (default) |
   | Output | default (Vercel reads `output: "export"`) |
   | Node.js version | 22.x |
   | Environment variables | none |
4. Deploy. The site appears at `portfolio-3d-<hash>.vercel.app`. In **Settings → Domains** add a cleaner alias
   such as `kunjpandya-3d.vercel.app` if it is free.
5. Every branch push now gets a preview URL; `main` deploys to production.

### 4.1 What was actually set up: a separate project for the `3d` branch

The code lives on the `3d` branch of `KPandya1903/Portfolio` (the live site's repo), not in a new `portfolio-3d` repo, so
steps 1-2 above were replaced by this:

| Item | Value |
|---|---|
| Vercel project | `portfolio-portfolio`, separate from the project that serves kunjpandya.vercel.app |
| Repo / branch | `KPandya1903/Portfolio`, branch `3d` |
| Root Directory | `web` (the old site's files sit at the repo root; the new app is in `web/`) |
| Framework / build | Next.js, `npm run build` (static export), Node 22 |
| Deploys | Push to `3d`. The old project keeps building `main` and is unaffected |
| Headers | `web/vercel.json` applies because Root Directory is `web` (immutable cache for `/guide/*`, `nosniff`, referrer policy) |

To stop the old project from also building the `3d` branch (and spending a build on every push), give it an Ignored
Build Step (Settings → Git) that skips every branch except `main`:

```bash
test "$VERCEL_GIT_COMMIT_REF" != "main"   # exit 0 = skip the build
```

Pushing a commit to `3d` is the way to trigger a deploy (an empty chore commit was used to trigger the first preview
for the new project).

Headers (cache the model forever, it is versioned by filename): `web/vercel.json`
```json
{
  "headers": [
    { "source": "/guide/(.*)", "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }] },
    { "source": "/(.*)", "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
    ] }
  ]
}
```
Rename the GLB when it changes (`kunj.v2.glb`) so the immutable cache never serves a stale avatar.

## 5. Setup: Cloudflare Pages (fallback)

1. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → `KPandya1903/portfolio-3d`.
2. Build settings:
   | Field | Value |
   |---|---|
   | Production branch | `main` |
   | Framework preset | Next.js (Static HTML Export) |
   | Root directory | `web` |
   | Build command | `npm run build` |
   | Build output directory | `out` |
   | Environment variable | `NODE_VERSION = 22` |
3. Headers: `web/public/_headers` (copied into `out/` by the build)
   ```
   /guide/*
     Cache-Control: public, max-age=31536000, immutable
   /*
     X-Content-Type-Options: nosniff
     Referrer-Policy: strict-origin-when-cross-origin
   ```
4. URL: `portfolio-3d.pages.dev` (or the next free name).

Both hosts build from the same push. Two builds per push is well inside both free tiers (Vercel 100/day,
Cloudflare 500/month).

## 6. Emergency option: GitHub Pages

Only if both above fail. Needs `basePath: "/portfolio-3d"` and `assetPrefix` in `next.config.ts` driven by an env
var, plus a workflow using `actions/upload-pages-artifact` and `actions/deploy-pages`. Not set up in v1.

## 7. CI (GitHub Actions)

`.github/workflows/ci.yml` runs on every pull request and on `main`: install, lint, typecheck, unit tests, build,
`npm run check:prod-strip` (fails if the production `out/` contains debug-overlay code), end-to-end tests against
the built `out/`. Free on public repos; private repos on GitHub Free get a monthly
minutes allowance that this ~4-minute job fits easily. `.github/workflows/ci.yml` is the source of truth; the copy in the implementation plan (Task 16) predates `check:prod-strip`.

The e2e tests (`npm run e2e`) run in Chromium, Firefox and WebKit with one worker (`playwright.config.ts`); CI
installs all three browsers (cached by Playwright version), retries a failing test once with a trace
(`trace: "on-first-retry"`), and fails the job if a test only passes on retry (`failOnFlakyTests`). They render WebGL
in software (headless Chromium with SwiftShader), so they are CPU-bound; the single worker keeps parallel tests from
starving each other. `npm run e2e:chromium` runs one project. A missing WebGL2 fails the Chromium project; Firefox and
WebKit skip the guide tests silently unless `E2E_REQUIRE_WEBGL` is set (not yet set in CI). On failure CI uploads
`web/playwright-report` and `web/test-results`. Note: CI triggers on pull requests and on pushes to `main`, not on
pushes to `3d`.

## 8. Cutover from kunjpandya.vercel.app

| Stage | Action | Exit check |
|---|---|---|
| 1. Side by side | New site on its own URL; the live site unchanged | Done criteria in [00](00-overview.md) all ticked |
| 2. Compare | Lighthouse both sites, mobile preset, 3 runs each, median | New site's LCP ≤ live + 100 ms; Performance ≥ 85 |
| 3. Switch | In the Vercel dashboard (the team that owns the live project): remove `kunjpandya.vercel.app` from the old project's Domains, add it to the `3d` project (`portfolio-portfolio`). The cutover is only this domain move; no code moves. A domain serves a project's Production Branch, so make `3d` that project's Production Branch (or merge `3d` into `main`) first | `curl -sI https://kunjpandya.vercel.app` returns the new build (check `robots.txt` points at the new sitemap) |
| 4. Keep | Leave the old project deployed but unaliased for 30 days (remove its Ignored Build Step if you want it to build again) | — |
| 5. Analytics | Move the Google Analytics tag (`G-L4J7CCTJVB`, in the live layout) to the new site only at stage 3, so test traffic doesn't pollute it | — |

Rollback at any stage: Vercel **Deployments → … → Instant Rollback** (or move the domain back), Cloudflare
**Deployments → Rollback to this deployment**.

Every resume variant links to kunjpandya.vercel.app, so stage 3 is what makes the new site reach recruiters. Do it
only after stage 2 passes.
