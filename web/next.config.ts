import type { NextConfig } from "next";

// Static export: the same out/ folder deploys to Vercel, Cloudflare Pages or GitHub Pages (ADR-0003).
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
