import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/destinations",
  "/destinations/kondor-village",
  "/nomadic",
  "/nomadic/taleghan-migration",
  "/stays",
  "/stays/kondor-homestay",
  "/experiences",
  "/experiences/kondor-harvest-walk",
  "/events",
  "/map",
  "/host",
  "/bookings",
];

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("eco.locale", "en");
    // The host workspace and bookings are gated; sign in as the demo host.
    window.localStorage.setItem("eco.tourism.host", "1");
  });
});

test.describe("routes", () => {
  for (const route of ROUTES) {
    test(`renders ${route}`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(String(error)));
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe("destinations", () => {
  test("filters by search and type", async ({ page }) => {
    await page.goto("/destinations");
    const cards = page.locator("article.tourism-card");
    const initial = await cards.count();
    expect(initial).toBeGreaterThan(5);

    await page.locator("#dest-kind").selectOption("village");
    await expect(page).toHaveURL(/kind=village/);
    await expect.poll(async () => cards.count()).toBeLessThan(initial);

    await page.locator("#dest-q").fill("saffron");
    await expect(page.locator("article.tourism-card")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Kondor Village" })).toBeVisible();
  });

  test("shows the landscape reference and a map", async ({ page }) => {
    await page.goto("/destinations/kondor-village");
    await expect(page.getByText(/land-kondor/).first()).toBeVisible();
    await expect(page.getByRole("application")).toBeVisible();
  });
});

test.describe("nomadic territories", () => {
  test("withholds review-required zones from public overlap", async ({ page }) => {
    await page.goto("/nomadic/taleghan-migration");
    // Spring and summer zones are `review-required`, so they are withheld from
    // public geometry and must not produce a public overlap message.
    await expect(page.getByText("No two zones overlap on this date.")).toBeVisible();
    await expect(page.getByText(/pending review/i).first()).toBeVisible();

    await page.locator("#nomadic-asof").fill("2026-01-15");
    await expect(page.getByText("No two zones overlap on this date.")).toBeVisible();
  });

  test("withholds a community without publication consent", async ({ page }) => {
    await page.goto("/nomadic/zagros-migration");
    await expect(page.getByText("Publication consent not recorded").first()).toBeVisible();
    await expect(page.getByRole("application")).toHaveCount(0);
  });

  test("hides sensitive geometry from the map note", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByText("Sensitive routes and locations are hidden on this map.")).toBeVisible();
  });

  test("renders a real map canvas", async ({ page }) => {
    await page.goto("/map");
    await expect(page.getByRole("application")).toBeVisible();
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    await expect.poll(async () => canvas.evaluate((element) => (element as HTMLCanvasElement).width)).toBeGreaterThan(0);
  });
});

test.describe("booking request flow", () => {
  test("creates a demo stay request and lists it", async ({ page }) => {
    await page.goto("/stays/kondor-homestay");
    await page.getByRole("button", { name: "Request to book" }).click();
    await expect(page).toHaveURL(/\/book\/stay\/kondor-homestay$/);

    await page.locator("#book-guests").fill("1");
    await page.getByRole("button", { name: "Send demo request" }).click();
    await expect(page.getByRole("heading", { name: "Demo request recorded" })).toBeVisible();

    await page.getByRole("button", { name: "View my requests" }).click();
    await expect(page).toHaveURL(/\/bookings$/);
    await expect(page.getByRole("heading", { name: "Kondor Family Homestay" })).toBeVisible();

    const bookings = await page.evaluate(() => JSON.parse(window.localStorage.getItem("eco.tourism.bookings") ?? "[]") as unknown[]);
    expect(bookings).toHaveLength(1);
  });

  test("creates a demo experience request", async ({ page }) => {
    await page.goto("/experiences/kondor-harvest-walk");
    await page.getByRole("button", { name: "Request to book" }).click();
    await expect(page).toHaveURL(/\/book\/experience\/kondor-harvest-walk$/);
    await page.getByRole("button", { name: "Send demo request" }).click();
    await expect(page.getByRole("heading", { name: "Demo request recorded" })).toBeVisible();
  });

  test("never claims a real payment or confirmation", async ({ page }) => {
    await page.goto("/stays/kondor-homestay");
    await page.getByRole("button", { name: "Request to book" }).click();
    await expect(page.getByText("Payments are not enabled in this environment. A booking is a demo request only.").first()).toBeVisible();
    await expect(page.getByText(/payment successful|paid successfully|confirmed by the host/i)).toHaveCount(0);
  });

  test("shows a closed experience as closed", async ({ page }) => {
    await page.goto("/experiences/taleghan-calving-visit");
    await expect(page.getByRole("button", { name: "Booking closed" })).toBeDisabled();
  });
});

test.describe("host workspace", () => {
  test("shows demo requests and the marketplace link status", async ({ page }) => {
    await page.goto("/host");
    await expect(page.getByRole("heading", { name: "Host workspace" })).toBeVisible();
    await expect(page.getByText("NOT_CONNECTED").first()).toBeVisible();
    await expect(page.getByText(/Product and seller records are owned by the marketplace/)).toBeVisible();
  });

  test("is gated: a guest is sent to the host sign-in page", async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("eco.tourism.host"));
    await page.goto("/host");
    await expect(page).toHaveURL(/\/host\/signin$/);
    await expect(page.getByRole("heading", { name: "Host workspace" })).toBeVisible();
  });
});

test.describe("localization and responsiveness", () => {
  test("renders RTL in Persian", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Language/ }).first().click();
    await page.getByRole("menuitem", { name: /فارسی/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("سرزمین‌های زنده");
  });

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

  for (const route of ["/host", "/stays/kondor-homestay", "/events"]) {
    test(`no horizontal overflow at 390px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  for (const route of ["/destinations", "/nomadic/taleghan-migration", "/experiences", "/map"]) {
    test(`no horizontal overflow at 360px on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});