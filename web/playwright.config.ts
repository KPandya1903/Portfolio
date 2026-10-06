import { defineConfig, devices } from "@playwright/test";

// `npm run build` must run first (serves out/). The port must be free in CI; locally an existing server is reused.
const PORT = process.env.E2E_PORT ?? "4173";
const BASE = `http://localhost:${PORT}`;
const viewport = { width: 1440, height: 900 };

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  // The guide renders WebGL in software, which is CPU-bound: parallel workers starve each other and flake.
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  failOnFlakyTests: !!process.env.CI,
  use: { baseURL: BASE, trace: "on-first-retry" },
  webServer: { command: `npx serve out -l ${PORT}`, url: BASE, reuseExistingServer: !process.env.CI },
  projects: [
    {
      name: "chromium",
      // Headless Chromium renders WebGL through SwiftShader (Chromium-only flag).
      use: { ...devices["Desktop Chrome"], viewport, launchOptions: { args: ["--enable-unsafe-swiftshader"] } },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"], viewport } },
    { name: "webkit", use: { ...devices["Desktop Safari"], viewport } },
  ],
});
