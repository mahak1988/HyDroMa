import { test, expect } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /field collection/i })).toBeVisible();
});

test("survey page renders", async ({ page }) => {
  await page.goto("/survey");
  await expect(page.getByRole("button", { name: /save/i })).toBeVisible();
});

test("map page renders", async ({ page }) => {
  await page.goto("/map");
  await expect(page.locator("div").first()).toBeVisible();
});