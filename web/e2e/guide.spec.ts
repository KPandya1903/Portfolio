import { expect, test, type Page } from "@playwright/test";

const html = (page: Page) => page.locator("html");
const bubble = (page: Page) => page.getByTestId("guide-bubble");
const railPadding = (page: Page) => page.locator("section#skills");
const scrollToSection = (page: Page, id: string) =>
  page.evaluate((s) => document.getElementById(s)!.scrollIntoView({ block: "center" }), id);

test("intro plays once per session", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", "hello", { timeout: 20_000 });
  await expect(bubble(page)).toContainText("Hi, I'm Kunj", { timeout: 10_000 });
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done", { timeout: 20_000 });
  await expect(bubble(page)).toContainText("My resume is right here", { timeout: 10_000 });

  // Record whether the reloaded page ever enters "hello". Waiting for "done" alone is not enough:
  // a replayed intro also reaches "done" a few seconds later.
  // Init scripts run before <html> exists, so observe the document node with subtree.
  await page.addInitScript(() => {
    new MutationObserver(() => {
      if (document.documentElement?.dataset.guideIntro === "hello") sessionStorage.setItem("test:saw-hello", "1");
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-guide-intro"] });
  });
  await page.reload();
  await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
  await expect(html(page)).toHaveAttribute("data-guide-intro", "done");
  await page.waitForTimeout(1500); // the model loads after the canvas mounts; give a replay time to start
  expect(await page.evaluate(() => sessionStorage.getItem("test:saw-hello"))).toBeNull();
});

test("points at each section while scrolling", async ({ page }) => {
  await page.goto("/");
  await expect(html(page)).toHaveAttribute("data-guide-intro", /hello|done/, { timeout: 20_000 });
  await scrollToSection(page, "skills");
  await expect(html(page)).toHaveAttribute("data-guide-section", "skills");
  await expect(bubble(page)).toContainText("toolbox", { timeout: 15_000 });
  await expect(page.locator("#skills h2")).toHaveClass(/guide-highlight/);
});

test("reserves the rail on wide screens", async ({ page }) => {
  await page.goto("/");
  await expect(railPadding(page)).toHaveCSS("padding-left", "280px");
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("docks bottom-left and keeps content full width", async ({ page }) => {
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
    await page.goto("/");
    await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
    await expect(html(page)).toHaveAttribute("data-guide-intro", "done");
    await expect(bubble(page)).toContainText("My resume is right here", { timeout: 10_000 });
  });
});

test("guide can be turned off and stays off", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("guide-canvas")).toHaveCount(1, { timeout: 20_000 });
  await page.getByRole("button", { name: /Guide on/ }).click();
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
  await page.reload();
  await expect(railPadding(page)).not.toHaveCSS("padding-left", "280px");
  await page.waitForTimeout(3000);
  await expect(page.getByTestId("guide-canvas")).toHaveCount(0);
});
