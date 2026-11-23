import { expect, test } from "@playwright/test";

/**
 * Marketplace section e2e — internal to the unified platform SPA and served
 * under `/market` by the platform dev server. Cart and orders are local demo
 * state with an explicit "payments not enabled" label; sellers are real API
 * records (a registered organization with a seller record).
 */
const ROUTES = [
  "/market",
  "/market/catalog",
  "/market/categories",
  "/market/stores",
  "/market/p/saffron-kondor",
  "/market/s/kondor-village",
  "/market/cart",
  "/market/checkout",
  "/market/orders",
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

test.describe("catalog", () => {
  test("filters by category and search", async ({ page }) => {
    await page.goto("/market/catalog");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const cards = page.locator("section.product-card");
    const initial = await cards.count();
    expect(initial).toBeGreaterThan(10);

    await page.locator("#cat-category").selectOption("handicrafts");
    await expect(page).toHaveURL(/category=handicrafts/);
    await expect.poll(async () => cards.count()).toBeLessThan(initial);
    expect(await cards.count()).toBeGreaterThan(0);

    await page.locator("#cat-q").fill("felt");
    await expect(page.locator("section.product-card")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Felt slippers" })).toBeVisible();
  });

  test("shows an empty state for impossible filters", async ({ page }) => {
    await page.goto("/market/catalog?q=zzzz-nothing");
    await expect(page.getByText("No products match these filters")).toBeVisible();
  });

  test("sorts the list view by price and cycles asc -> desc -> none", async ({ page }) => {
    await page.goto("/market/catalog?view=list");
    const priceHeader = page.getByRole("button", { name: /Price/ });

    await priceHeader.click();
    await expect(page).toHaveURL(/sort=price-asc/);
    await expect(page.locator("tbody tr")).not.toHaveCount(0);

    await priceHeader.click();
    await expect(page).toHaveURL(/sort=price-desc/);

    await priceHeader.click();
    await expect(page).not.toHaveURL(/sort=/);
  });
});

test.describe("product and cart", () => {
  test("adds a product and shows the cart badge", async ({ page }) => {
    await page.goto("/market/p/walnuts-kondor");
    await page.locator("#product-qty").fill("2");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await expect(page.getByRole("link", { name: /Cart\s*2/ })).toBeVisible();
  });

  test("splits a multi-seller cart into separate orders", async ({ page }) => {
    await page.goto("/market/p/saffron-kondor");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.goto("/market/p/nomad-dairy");
    await page.getByRole("button", { name: "Add to cart" }).first().click();

    await page.goto("/market/cart");
    await expect(page.getByRole("heading", { name: "Kondor Village Producers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Taleghan Nomadic Cooperative" })).toBeVisible();

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Review and place order" })).toBeVisible();
    await page.getByRole("button", { name: "Place order (demo)" }).click();

    await expect(page).toHaveURL(/\/market\/orders$/);
    await expect(page.getByText("DEMO").first()).toBeVisible();
    const orders = await page.evaluate(() => JSON.parse(window.localStorage.getItem("eco.market.orders") ?? "[]") as unknown[]);
    expect(orders).toHaveLength(2);
    const leftovers = await page.evaluate(() => JSON.parse(window.localStorage.getItem("eco.market.cart") ?? "[]") as unknown[]);
    expect(leftovers).toHaveLength(0);
  });

  test("never claims a real payment", async ({ page }) => {
    await page.goto("/market/p/saffron-kondor");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.goto("/market/checkout");
    await expect(page.getByText("Payments are not enabled in this environment.").first()).toBeVisible();
    await expect(page.getByText(/payment successful|paid successfully/i)).toHaveCount(0);
  });
});

test.describe("seller workspace", () => {
  test("is gated: a guest is sent to the sign-in page", async ({ page }) => {
    await page.goto("/market/seller");
    await expect(page).toHaveURL(/\/market\/seller\/signin$/);
    await expect(page.getByRole("heading", { name: "Seller sign-in" })).toBeVisible();
  });

  test("sign-in panel is real and offers registration", async ({ page }) => {
    await page.goto("/market/seller/signin");
    await expect(page.getByRole("heading", { name: "Seller sign-in" })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Register|ثبت‌نام|تسجيل/ })).toBeVisible();
  });
});

test.describe("localization and responsiveness", () => {
  test("renders RTL in Persian", async ({ page }) => {
    await page.goto("/market");
    await page.getByRole("button", { name: /Language/ }).first().click();
    await page.getByRole("menuitem", { name: /فارسی/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  for (const width of [360, 390, 768, 1280, 1440, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/market");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const overflow = await page.evaluate(
        () => (document.scrollingElement?.scrollWidth ?? 0) - (document.scrollingElement?.clientWidth ?? 0),
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});