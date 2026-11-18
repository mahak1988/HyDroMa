import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/ecosystem",
  "/hydroma",
  "/landscape",
  "/marketplace",
  "/tourism",
  "/mrv",
  "/knowledge",
  "/about",
  "/contact",
  "/partner",
  "/login",
];

test.use({ viewport: { width: 1440, height: 1000 } });

test.describe("routes", () => {
  for (const route of ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("unknown route shows 404 copy", async ({ page }) => {
    await page.goto("/no-such-page");
    await expect(page.getByText("404", { exact: true })).toBeVisible();
  });
});

test.describe("localization and theme", () => {
  test("switches fa → en with direction and content", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.getByRole("button", { name: /زبان|Language/ }).first().click();
    await page.getByRole("menuitem", { name: /English/ }).click();

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One platform");
  });

  test("persists locale and theme across reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /زبان|Language/ }).first().click();
    await page.getByRole("menuitem", { name: /English/ }).click();
    await page.getByRole("button", { name: /Theme|پوسته/ }).first().click();
    await page.getByRole("menuitem", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("responsive", () => {
  for (const width of [360, 390, 768, 1280, 1440, 1920]) {
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

  test("mobile navigation opens and navigates", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "منو" }).first().click();
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("link", { name: "HyDroMA" }).click();
    await expect(page).toHaveURL(/\/hydroma$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("seo", () => {
  test("each page has a distinct title and canonical", async ({ page }) => {
    const seen = new Set<string>();
    for (const route of ROUTES) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const title = await page.title();
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(title.length).toBeGreaterThan(5);
      expect(canonical).toBeTruthy();
      expect(canonical?.endsWith(route === "/" ? "/" : route)).toBe(true);
      seen.add(title);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.+/);
    }
    expect(seen.size).toBe(ROUTES.length);
  });
});

test.describe("links", () => {
  test("every internal link resolves", async ({ page, request }) => {
    await page.goto("/");
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]"))
        .map((anchor) => anchor.getAttribute("href") ?? "")
        .filter((href) => href.startsWith("/")),
    );
    const unique = [...new Set(hrefs)];
    expect(unique.length).toBeGreaterThan(4);
    for (const href of unique) {
      const response = await request.get(href);
      expect(response.status(), `link ${href}`).toBe(200);
    }
  });
});

test.describe("contact form", () => {
  test("validates input and never pretends to send", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("eco.locale", "en"));
    await page.goto("/contact");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Please complete the required fields with a valid email.")).toHaveCount(3);

    await page.getByLabel("Name").fill("Landscape Partner");
    await page.getByLabel("Email").fill("partner@example.org");
    await page.getByLabel("Message").fill("We manage a watershed of 12,000 hectares and want to measure restoration.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(page.getByText("Delivery is not enabled yet")).toBeVisible();
    await expect(page.getByText(/sent successfully|message sent/i)).toHaveCount(0);
  });
});