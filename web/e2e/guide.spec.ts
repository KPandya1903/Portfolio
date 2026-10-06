import { expect, test, type Page } from "@playwright/test";
import { readIntroPhases, readStages, recordIntroPhases, recordStages } from "./helpers";

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
// No rail: the guide pushes nothing aside, so a full-width block (the h2) is centred on the viewport.
const expectFullWidth = async (page: Page) => {
  const box = await page.locator("#skills h2").boundingBox();
  const vw = await page.evaluate(() => document.documentElement.clientWidth);
  expect(box).not.toBeNull();
  expect(Math.abs(box!.x + box!.width / 2 - vw / 2)).toBeLessThan(2);
};
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

test("rests bottom-left over full-width content on wide screens", async ({ page }) => {
  needsWebGL();
  await page.goto("/");
  await expectFullWidth(page);
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 25_000 });
  await expect(bubble(page)).toBeVisible({ timeout: 10_000 });
  const box = await bubble(page).boundingBox();
  const vh = page.viewportSize()!.height;
  expect(box && box.x).toBeLessThan(300);
  expect(box && box.y).toBeGreaterThan(vh / 2);
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("docks bottom-left and keeps content full width", async ({ page }) => {
    needsWebGL();
    await page.goto("/");
    await expectFullWidth(page);
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
  await expectFullWidth(page);
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
  await expectFullWidth(page);
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Guide/ })).toHaveCount(0);
  await page.waitForTimeout(IDLE_MOUNT_GRACE_MS); // catch a late mount
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
});

test("a failed model load removes the guide", async ({ page }) => {
  needsWebGL();
  await page.route("**/*.glb", (r) => r.abort());
  await recordIntroPhases(page);
  // Registered before navigation so the failure cannot be missed; the toggle must disappear after it, not before it ever mounted.
  const modelFailed = page.waitForEvent("requestfailed", { predicate: (r) => r.url().endsWith(".glb"), timeout: 20_000 });
  await page.goto("/");
  await modelFailed;
  await expect(page.getByRole("button", { name: /Guide/ })).toHaveCount(0, { timeout: 20_000 });
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  const phases = await readIntroPhases(page);
  expect(phases).toContain("pending"); // the recorder captured something, so the next check cannot pass on []
  expect(phases).not.toContain("hello"); // the hero was never dimmed
  await expectFullWidth(page);
});

const STAGE = "data-guide-stage";
const noStage = (page: Page) => expect(html(page)).not.toHaveAttribute(STAGE, /.+/);

test("center stage plays once for a new section", async ({ page }) => {
  needsWebGL();
  await recordStages(page);
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 25_000 });
  await scrollToSection(page, "experience");
  await expect(html(page)).toHaveAttribute(STAGE, "experience", { timeout: 10_000 });
  await expect(bubble(page)).toContainText("Fini", { timeout: 10_000 });
  await noStage(page); // the stage ends by itself and the robot walks back
  await expect(bubble(page)).toContainText("Fini");

  await scrollToSection(page, "projects");
  await expect(html(page)).toHaveAttribute(STAGE, "projects", { timeout: 10_000 });
  await scrollToSection(page, "experience");
  await expect(html(page)).toHaveAttribute("data-guide-section", "experience");
  await page.waitForTimeout(1500); // past the dwell: a second stage for experience would have started
  expect((await readStages(page)).filter((s) => s === "experience")).toHaveLength(1);
  await noStage(page);
});

test.describe("no stage", () => {
  test.describe("phone", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    test("never stages a section", async ({ page }) => {
      needsWebGL();
      await recordStages(page);
      await page.goto("/");
      await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 25_000 });
      await scrollToSection(page, "experience");
      await expect(bubble(page)).toContainText("Fini", { timeout: 10_000 });
      await page.waitForTimeout(1500);
      expect(await readStages(page)).toEqual([]);
      await noStage(page);
    });
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("never stages a section", async ({ page }) => {
      needsWebGL();
      await recordStages(page);
      await page.goto("/");
      await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 25_000 });
      await scrollToSection(page, "experience");
      await expect(bubble(page)).toContainText("Fini", { timeout: 10_000 });
      await page.waitForTimeout(1500);
      expect(await readStages(page)).toEqual([]);
      await noStage(page);
    });
  });
});
