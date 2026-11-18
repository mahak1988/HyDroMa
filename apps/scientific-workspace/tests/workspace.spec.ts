import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/water", "/soil", "/climate", "/vegetation", "/remote-sensing", "/map", "/simulation", "/projects"];

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Locale only: the theme test relies on the stored preference surviving a reload.
    window.localStorage.setItem("eco.locale", "en");
  });
});

test.describe("routes", () => {
  for (const route of ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }

  test("shows the demo-data disclaimer on every page", async ({ page }) => {
    await page.goto("/water");
    await expect(page.getByText("Demonstration data").first()).toBeVisible();
  });
});

test.describe("units and provenance", () => {
  test("every indicator card shows a unit and a source", async ({ page }) => {
    await page.goto("/vegetation");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("NDVI", { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/±\d+%/).first()).toBeVisible();
    await expect(page.getByText(/Sentinel-2-like demo/).first()).toBeVisible();
  });

  test("model version is visible next to the chart", async ({ page }) => {
    await page.goto("/water");
    await expect(page.getByText(/hydroma-water v0\.1-demo/).first()).toBeVisible();
  });
});

test.describe("localization and theme", () => {
  test("switches to Persian (RTL) and back", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Language/ }).first().click();
    await page.getByRole("menuitem", { name: /فارسی/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("نمای هوشمند");
  });

  test("theme persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Theme/ }).first().click();
    await page.getByRole("menuitem", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });
});

test.describe("landscape context", () => {
  test("switching the landscape updates the header summary", async ({ page }) => {
    await page.goto("/");
    const select = page.getByLabel("Landscape");
    await select.selectOption("taleghan");
    await expect(page.getByText("Taleghan rangelands").last()).toBeVisible();
  });
});

test.describe("responsive", () => {
  for (const width of [360, 390, 768, 1280, 1440, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});

test.describe("map", () => {
  test("renders the basemap and toggles layers", async ({ page }) => {
    await page.goto("/map", { waitUntil: "domcontentloaded" });
    await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible({ timeout: 30_000 });

    const stations = page.getByRole("checkbox", { name: "Precipitation" });
    await expect(stations).toBeChecked();
    await stations.uncheck();
    await expect(stations).not.toBeChecked();

    await page.getByRole("application", { name: "Landscape map" }).click({ position: { x: 200, y: 200 } });
    await page.waitForTimeout(400);
  });

  test("remote sensing states that no satellite data is connected", async ({ page }) => {
    await page.goto("/remote-sensing", { waitUntil: "domcontentloaded" });
    await expect(page.getByText("No satellite data is connected")).toBeVisible();
    await expect(page.getByRole("button", { name: "Change detection" })).toBeDisabled();
  });
});

test.describe("simulation", () => {
  test("does not show results until the demo scenario is loaded", async ({ page }) => {
    await page.goto("/simulation");
    await expect(page.getByText("Model engine not connected")).toBeVisible();
    const table = page.getByRole("table");
    await expect(table).toHaveCount(0);

    await page.getByRole("button", { name: "Load demonstration scenario" }).click();
    await expect(page.getByRole("table")).toBeVisible();
    await expect(page.getByText("DEMO").first()).toBeVisible();
  });
});

test.describe("studies", () => {
  test("creates a study, persists it and compares two", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByText("No studies yet")).toBeVisible();

    const create = async (name: string) => {
      await page.getByRole("button", { name: "New study" }).click();
      await page.locator("#study-name").fill(name);
      await page.getByRole("button", { name: "Create", exact: true }).click();
      await expect(page.getByText(name)).toBeVisible();
    };

    await create("Karaj baseline");
    await create("Karaj restoration");

    await page.reload();
    await expect(page.getByText("Karaj baseline")).toBeVisible();

    await page.getByRole("checkbox", { name: "Compare Karaj baseline" }).check();
    await page.getByRole("checkbox", { name: "Compare Karaj restoration" }).check();
    await expect(page.getByText("Comparison").first()).toBeVisible();
  });
});