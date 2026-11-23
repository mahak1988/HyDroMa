import { expect, test } from "@playwright/test";

test.describe("stage 2.8 additions", () => {
  test("arabic renders RTL without overflow", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("eco.locale", "ar"));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("map filters narrow destinations and experiences", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("eco.locale", "en"));
    await page.goto("/map");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const kind = page.getByLabel("Destination type");
    const type = page.getByLabel("Experience type");
    await kind.selectOption("village");
    await type.selectOption("cultural");
    await expect(kind).toHaveValue("village");
    await expect(type).toHaveValue("cultural");
    await expect(page.locator("canvas")).toBeVisible();
    const reviewNote = await page.getByText(/pending review/i).count();
    expect(reviewNote).toBeGreaterThan(0);
  });

  test("host studio stores drafts locally and never publishes", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("eco.locale", "en");
    window.localStorage.setItem("eco.tourism.host", "1");
  });
  await page.goto("/host");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const titleInput = page.getByRole("textbox", { name: "Title" });
    await titleInput.fill("Demo village walk");
    await page.getByRole("button", { name: "Add draft" }).click();
    await expect(page.getByText("Demo village walk")).toBeVisible();
    await expect(page.getByText("NOT_CONNECTED").first()).toBeVisible();

    await page.reload();
    await expect(page.getByText("Demo village walk")).toBeVisible();

    const draft = page.locator("li", { hasText: "Demo village walk" });
    await draft.getByRole("button", { name: "Cancel request" }).click();
    await expect(page.getByText("Demo village walk")).toHaveCount(0);
  });
});
