import { defineConfig, devices } from "@playwright/test";

const viewport = { width: 1440, height: 900 };

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  // The guide renders WebGL in software, which is CPU-bound: parallel workers starve each other and flake.
  workers: 1,
  fullyParallel: false,
  use: { baseURL: "http://localhost:4173" },
  webServer: { command: "npx serve out -l 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
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
