import { expect, test, type Page } from "@playwright/test";
import { readIntroPhases, recordIntroPhases } from "./helpers";

// GuideLoader mounts the canvas from requestIdleCallback (timeout 2000 ms) or a 1200 ms setTimeout fallback.
// Absence checks must wait past that, or they pass before a wrongly-mounting guide could appear.
const IDLE_MOUNT_GRACE_MS = 2500;

// The app degrades to "no guide" when a browser cannot create a WebGL2 context. Guide-behaviour tests need one.
let hasWebGL2 = true;
test.beforeAll(async ({ browser }, testInfo) => {
  const page = await browser.newPage();
  hasWebGL2 = await page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"));
  await page.close();
  // Never let the guide tests skip silently where WebGL2 is known to exist. Firefox/WebKit stay skippable until a CI
  // run shows they have WebGL2 on ubuntu; then set E2E_REQUIRE_WEBGL=1 in ci.yml.
  if (testInfo.project.name === "chromium" || process.env.E2E_REQUIRE_WEBGL) {
    expect(hasWebGL2, "WebGL2 required for guide tests in this project").toBe(true);
  }
});
const needsWebGL = () => test.skip(!hasWebGL2, "this browser cannot create a WebGL2 context headless; the guide degrades by design");

const html = (page: Page) => page.locator("html");
const bubble = (page: Page) => page.getByTestId("guide-bubble");
const railPadding = (page: Page) => page.locator("section#skills");
const scrollToSection = (page: Page, id: string) =>
  page.evaluate((s) => document.getElementById(s)!.scrollIntoView({ block: "center" }), id);

test("intro plays once per session", async ({ page }) => {
  needsWebGL();
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", "hello", { timeout: 20_000 });
  await expect(bubble(page)).toContainText("Hi, I'm Kunj", { timeout: 10_000 });
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 20_000 });
  await expect(bubble(page)).toContainText("My resume is right here", { timeout: 10_000 });

  // A replayed intro would also reach "done" a few seconds later, so record every phase the reloaded page enters.
  await recordIntroPhases(page);
  await page.reload();
  await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done");
  const phases = await readIntroPhases(page);
  expect(phases[0]).toBe("done");
  expect(phases).not.toContain("pending");
  expect(phases).not.toContain("hello");
});

test("points at each section while scrolling", async ({ page }) => {
  needsWebGL();
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", /hello|done/, { timeout: 20_000 });
  await scrollToSection(page, "skills");
  await expect(html(page)).toHaveAttribute("data-guide-section", "skills");
  await expect(bubble(page)).toContainText("toolbox", { timeout: 15_000 });
  await expect(page.locator("#skills h2")).toHaveClass(/guide-highlight/);
});

test("reserves the rail on wide screens", async ({ page }) => {
  needsWebGL();
  await page.goto("/");
  await expect(railPadding(page)).toHaveCSS("padding-left", "280px");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("docks bottom-left and keeps content full width", async ({ page }) => {
    needsWebGL();
    await page.goto("/");
    await expect(railPadding(page)).not.toHaveCSS("padding-left", "280px");
    await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 25_000 });
    await expect(bubble(page)).toBeVisible({ timeout: 10_000 });
    const box = await bubble(page).boundingBox();
    expect(box && box.x).toBeLessThan(40);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("skips the intro but still speaks", async ({ page }) => {
    needsWebGL();
    await recordIntroPhases(page);
    await page.goto("/");
    await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
    await expect(html(page)).toHaveAttribute("data-guide-intro", "done");
    const phases = await readIntroPhases(page);
    expect(phases[0]).toBe("done");
    expect(phases).not.toContain("pending");
    expect(phases).not.toContain("hello");
    await expect(bubble(page)).toContainText("My resume is right here", { timeout: 10_000 });
  });
});

test("guide can be turned off and stays off", async ({ page }) => {
  needsWebGL();
  await page.goto("/");
  await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
  await page.getByRole("button", { name: /Guide on/ }).click();
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  await page.reload();
  await expect(railPadding(page)).not.toHaveCSS("padding-left", "280px");
  await page.waitForTimeout(IDLE_MOUNT_GRACE_MS);
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
});

test("degrades gracefully without WebGL", async ({ page }) => {
  // Remove WebGL2 only; the app's own hasWebGL() detection must notice. Other context types pass through.
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      if (type === "webgl2") return null;
      return (orig as (...a: unknown[]) => unknown).call(this, type, ...rest);
    } as typeof orig;
  });
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide", "off");
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Guide/ })).toHaveCount(0);
  await expect(railPadding(page)).not.toHaveCSS("padding-left", "280px");
  await page.waitForTimeout(IDLE_MOUNT_GRACE_MS); // catch a late mount
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
});

test("a failed model load removes the guide and frees the rail", async ({ page }) => {
  needsWebGL();
  await page.route("**/*.glb", (r) => r.abort());
  await recordIntroPhases(page);
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide", "off", { timeout: 20_000 });
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Guide/ })).toHaveCount(0);
  expect(await readIntroPhases(page)).not.toContain("hello"); // the hero was never dimmed
  await expect(railPadding(page)).not.toHaveCSS("padding-left", "280px");
});
