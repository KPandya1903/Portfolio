import type { Page } from "@playwright/test";

const PHASES_KEY = "test:intro-phases";

/**
 * Records every value `<html data-guide-intro>` takes, in order, in sessionStorage (so it survives reloads).
 * Polling the attribute can miss a transient "hello"; a MutationObserver cannot.
 * Init scripts run before <html> exists, so the observer is attached to `document` with subtree.
 */
export async function recordIntroPhases(page: Page) {
  await page.addInitScript((key) => {
    new MutationObserver(() => {
      const v = document.documentElement?.dataset.guideIntro;
      if (!v) return;
      const seen: string[] = JSON.parse(sessionStorage.getItem(key) ?? "[]");
      if (seen[seen.length - 1] !== v) sessionStorage.setItem(key, JSON.stringify([...seen, v]));
    }).observe(document, { subtree: true, attributes: true, attributeFilter: ["data-guide-intro"] });
  }, PHASES_KEY);
}

export async function readIntroPhases(page: Page): Promise<string[]> {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? "[]") as string[], PHASES_KEY);
}
