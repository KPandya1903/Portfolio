# ADR-0006: Vercel Hobby primary, Cloudflare Pages fallback

- Status: Accepted, 2026-10-05
- Details and sources: [07 hosting](../07-hosting.md)

## Context
Free tiers checked 2026-10-05: Vercel Hobby 100 GB/month with hard caps, personal non-commercial use; Cloudflare
Pages unlimited bandwidth, 500 builds/month, 25 MiB per file; Render's free Hobby workspace dropped to 5 GB/month in
April 2026; Netlify's free plan is 300 credits at 20 credits per GB; GitHub Pages 100 GB soft, needs a basePath for
project pages. A first visit costs about 3.1 MB.

## Decision
Deploy to Vercel Hobby (Kunj's existing platform, branch previews) and mirror to Cloudflare Pages from the same repo.
Skip Render and Netlify. Keep GitHub Pages as an undocumented-in-CI emergency option.

## Consequences
+ $0/month with roughly 100× headroom on the primary and no cap on the fallback.
+ Two independent hosts: a pause or terms change on one is a link swap, not an outage.
- Two dashboards to configure once. Both build from the same push.
