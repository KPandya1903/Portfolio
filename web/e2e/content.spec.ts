import { expect, test } from "@playwright/test";

const SECTIONS = ["hero", "journey", "about", "experience", "projects", "skills", "contact"];

test("every guided section and target exists", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kunj Pandya");
  for (const id of SECTIONS) await expect(page.locator(`section#${id}`)).toHaveCount(1);
  for (const t of ["resume", "experience-list", "contact-links"]) {
    await expect(page.locator(`[data-guide-target="${t}"]`)).toHaveCount(1);
  }
});
