import { expect, test } from "@playwright/test";
import { ensureHostSession } from "./tourism-auth.helper";

/**
 * Tourism section e2e — the section is internal to the unified platform SPA and
 * served under `/tourism` by the platform dev server (port 5181). Host routes
 * use the real API session; the server remains the authority.
 */
const ROUTES = [
  "/tourism",
  "/tourism/destinations",
  "/tourism/destinations/kondor-village",
  "/tourism/nomadic",
  "/tourism/nomadic/taleghan-migration",
  "/tourism/stays",
  "/tourism/stays/kondor-homestay",
  "/tourism/experiences",
  "/tourism/experiences/kondor-harvest-walk",
  "/tourism/tours",
  "/tourism/events",
  "/tourism/map",
];

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem("eco.locale", "en"));
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
    await page.goto("/tourism/destinations");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
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
    await page.goto("/tourism/destinations/kondor-village");
    await expect(page.getByText(/land-kondor/).first()).toBeVisible();
    await expect(page.getByRole("application")).toBeVisible();
  });
});

test.describe("nomadic territories", () => {
  test("withholds review-required zones from public overlap", async ({ page }) => {
    await page.goto("/tourism/nomadic/taleghan-migration");
    await expect(page.getByText("No two zones overlap on this date.")).toBeVisible();
    await expect(page.getByText(/pending review/i).first()).toBeVisible();
  });

  test("withholds a community without publication consent", async ({ page }) => {
    await page.goto("/tourism/nomadic/zagros-migration");
    await expect(page.getByText("Publication consent not recorded").first()).toBeVisible();
    await expect(page.getByRole("application")).toHaveCount(0);
  });
});

test.describe("map", () => {
  test("hides sensitive geometry from the map note", async ({ page }) => {
    await page.goto("/tourism/map");
    await expect(page.getByText("Sensitive routes and locations are hidden on this map.")).toBeVisible();
  });

  test("renders a real map canvas", async ({ page }) => {
    await page.goto("/tourism/map");
    await expect(page.getByRole("application")).toBeVisible();
    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    await expect.poll(async () => canvas.evaluate((element) => (element as HTMLCanvasElement).width)).toBeGreaterThan(0);
  });
});

test.describe("booking request flow", () => {
  test("records a demo stay request without claiming payment", async ({ page }) => {
    await page.goto("/tourism/stays/kondor-homestay");
    await page.getByRole("button", { name: "Request to book" }).click();
    await expect(page).toHaveURL(/\/tourism\/book\/stay\/kondor-homestay$/);
    await expect(page.getByText("Payments are not enabled in this environment. A booking is a demo request only.").first()).toBeVisible();

    await page.locator("#book-guests").fill("1");
    await page.getByRole("button", { name: "Send demo request" }).click();
    await expect(page.getByRole("heading", { name: "Demo request recorded" })).toBeVisible();

    const bookings = await page.evaluate(
      () => JSON.parse(window.localStorage.getItem("eco.tourism.bookings") ?? "[]") as unknown[],
    );
    expect(bookings).toHaveLength(1);
    await expect(page.getByText(/payment successful|paid successfully|confirmed by the host/i)).toHaveCount(0);
  });

  test("creates a demo experience request", async ({ page }) => {
    await page.goto("/tourism/experiences/kondor-harvest-walk");
    await page.getByRole("button", { name: "Request to book" }).click();
    await expect(page).toHaveURL(/\/tourism\/book\/experience\/kondor-harvest-walk$/);
    await page.getByRole("button", { name: "Send demo request" }).click();
    await expect(page.getByRole("heading", { name: "Demo request recorded" })).toBeVisible();
  });

  test("shows a closed experience as closed", async ({ page }) => {
    await page.goto("/tourism/experiences/taleghan-calving-visit");
    await expect(page.getByRole("button", { name: "Booking closed" })).toBeDisabled();
  });
});

test.describe("host workspace", () => {
  test("is gated: a guest is sent to the host sign-in page", async ({ page }) => {
    await page.goto("/tourism/host");
    await expect(page).toHaveURL(/\/tourism\/host\/signin$/);
    await expect(page.getByRole("heading", { name: "Host workspace" })).toBeVisible();
  });

  test("opens with a real business session", async ({ page, context }) => {
    await ensureHostSession(context);
    await page.goto("/tourism/host");
    await expect(page.getByRole("heading", { name: "Host workspace" })).toBeVisible();
    await expect(page.getByText("NOT_CONNECTED").first()).toBeVisible();
    await expect(page.getByText(/Product and seller records are owned by the marketplace/)).toBeVisible();
  });

  test("bookings are listed for a signed-in host", async ({ page, context }) => {
    const validBooking = {
      id: "req-valid",
      kind: "stay",
      targetId: "stay-kondor-homestay",
      startDate: "2026-06-01",
      endDate: "2026-06-03",
      guests: 2,
      status: "requested",
      quote: { amountMinor: 8_400_000, currency: "IRR" },
      createdAt: "2026-11-19T08:00:00.000Z",
      demo: true,
    };
    await context.addInitScript((items) => {
      window.localStorage.setItem("eco.tourism.bookings", JSON.stringify(items));
    }, [validBooking]);
    await ensureHostSession(context);
    await page.goto("/tourism/bookings");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText("Kondor Family Homestay")).toBeVisible();
  });
});

test.describe("localization and responsiveness", () => {
  test("renders RTL in Persian", async ({ page }) => {
    await page.goto("/tourism");
    await page.getByRole("button", { name: /Language/ }).first().click();
    await page.getByRole("menuitem", { name: /فارسی/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("سرزمین‌های زنده");
  });

  for (const width of [360, 390, 768, 1280, 1440, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/tourism");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }

  for (const route of ["/tourism/stays/kondor-homestay", "/tourism/events"]) {
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

  for (const route of ["/tourism/destinations", "/tourism/nomadic/taleghan-migration", "/tourism/experiences", "/tourism/map"]) {
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