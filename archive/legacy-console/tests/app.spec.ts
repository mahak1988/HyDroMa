import { expect, test } from "@playwright/test";
import { ensureSignedIn } from "./auth.helper";

test.beforeEach(async ({ context }) => {
  await ensureSignedIn(context);
});

const routes = ["/", "/components", "/notifications", "/settings"];

test.describe("shell routing", () => {
  for (const route of routes) {
    test(`renders ${route} with a single h1 and no page errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("unknown route renders the not-found page", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page.locator("body")).toContainText(/404|not found|یافت نشد/);
  });
});

test.describe("localization", () => {
  test("switches fa/en/ar without reload and sets lang/dir", async ({ page }) => {
    await page.goto("/settings");
    await page.evaluate(() => {
      (window as unknown as { __noReload?: boolean }).__noReload = true;
    });

    const select = page.locator("#settings-locale");

    await select.selectOption("fa");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await select.selectOption("en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");

    await select.selectOption("ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    expect(
      await page.evaluate(() => (window as unknown as { __noReload?: boolean }).__noReload === true),
    ).toBe(true);
  });

  test("persists locale across reload", async ({ page }) => {
    await page.goto("/settings");
    await page.locator("#settings-locale").selectOption("en");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("renders Persian numerals in Persian locale", async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem("eco.locale", "fa");
      window.localStorage.setItem("eco.theme", "light");
    });
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/[۰-۹]/);
  });
});

test.describe("theme", () => {
  test("switches light/dark/system and persists the choice", async ({ page }) => {
    await page.goto("/settings");

    await page.getByLabel(/Dark|تاریک/).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.getByLabel(/Light|روشن/).check();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect(page.getByLabel(/Light|روشن/)).toBeChecked();
  });

  test("no flash: theme is applied before first paint", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("eco.theme", "dark"));
    await page.goto("/");
    const theme = await page.locator("html").getAttribute("data-theme");
    expect(theme).toBe("dark");
  });
});

test.describe("permissions (presentation only)", () => {
  test("hides gated actions without pretending to enforce", async ({ page }) => {
    await page.goto("/settings");
    // console.export is false in the fixture: the action is hidden and labelled.
    await expect(page.getByText("console.export")).toBeVisible();
    await expect(page.locator("button", { hasText: "Save" })).toHaveCount(0);
  });
});

test.describe("responsive", () => {
  const widths = [360, 390, 768, 1280, 1440, 1920];

  for (const width of widths) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () =>
          (document.scrollingElement?.scrollWidth ?? 0) -
          (document.scrollingElement?.clientWidth ?? 0),
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  test("mobile drawer opens and closes", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: /open menu|بازکردن منو/ }).click();
    const drawer = page.locator("dialog[open]");
    await expect(drawer).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("dialog[open]")).toHaveCount(0);
  });

  test("sidebar collapses on desktop and persists", async ({ page }) => {
    await page.goto("/");
    const before = await page.locator("aside").boundingBox();
    await page.getByRole("button", { name: /collapse sidebar|جمع‌کردن/ }).click();
    const after = await page.locator("aside").boundingBox();
    expect(after?.width).toBeLessThan(before?.width ?? 0);
    await page.reload();
    expect(await page.locator("aside").boundingBox()).toMatchObject({ width: after?.width });
  });
});