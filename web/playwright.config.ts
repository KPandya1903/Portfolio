import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:4173",
    // Headless Chromium renders WebGL through SwiftShader.
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
  webServer: { command: "npx serve out -l 4173", url: "http://localhost:4173", reuseExistingServer: !process.env.CI },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
