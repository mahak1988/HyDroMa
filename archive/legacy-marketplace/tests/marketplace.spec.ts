import { expect, test } from "@playwright/test";

const ROUTES = ["/", "/catalog", "/p/saffron-kondor", "/s/kondor-village", "/cart", "/orders", "/checkout", "/seller"];

test.use({ viewport: { width: 1440, height: 1000 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Locale only: each Playwright test already gets a fresh context/storage.
    window.localStorage.setItem("eco.locale", "en");
    // The seller workspace is gated; sign in as the demo seller so the route
    // renders the dashboard instead of the sign-in page.
    window.localStorage.setItem("eco.market.role", "seller");
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

test.describe("catalog", () => {
  test("filters by category and search", async ({ page }) => {
    await page.goto("/catalog");
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
    await page.goto("/catalog?q=zzzz-nothing");
    await expect(page.getByText("No products match these filters")).toBeVisible();
  });

  test("sorts the list view by price and cycles asc → desc → none", async ({ page }) => {
    await page.goto("/catalog?view=list");
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
    await page.goto("/p/walnuts-kondor");
    await page.locator("#product-qty").fill("2");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await expect(page.getByRole("link", { name: /Cart\s*2/ })).toBeVisible();
  });

  test("splits a multi-seller cart into separate orders", async ({ page }) => {
    await page.goto("/p/saffron-kondor");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.goto("/p/nomad-dairy");
    await page.getByRole("button", { name: "Add to cart" }).first().click();

    await page.goto("/cart");
    await expect(page.getByRole("heading", { name: "Kondor Village Producers" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Taleghan Nomadic Cooperative" })).toBeVisible();

    await page.getByRole("link", { name: "Checkout" }).click();
    await expect(page.getByRole("heading", { name: "Review and place order" })).toBeVisible();
    await page.getByRole("button", { name: "Place order (demo)" }).click();

    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByText("DEMO").first()).toBeVisible();
    const orders = await page.evaluate(() => JSON.parse(window.localStorage.getItem("eco.market.orders") ?? "[]") as unknown[]);
    expect(orders).toHaveLength(2);
    const leftovers = await page.evaluate(() => JSON.parse(window.localStorage.getItem("eco.market.cart") ?? "[]") as unknown[]);
    expect(leftovers).toHaveLength(0);
  });

  test("never claims a real payment", async ({ page }) => {
    await page.goto("/p/saffron-kondor");
    await page.getByRole("button", { name: "Add to cart" }).first().click();
    await page.goto("/checkout");
    await expect(page.getByText("Payments are not enabled in this environment.").first()).toBeVisible();
    await expect(page.getByText(/payment successful|paid successfully/i)).toHaveCount(0);
  });
});

test.describe("seller workspace", () => {
  test("adjusts demo stock and shows settlement as not connected", async ({ page }) => {
    await page.goto("/seller");
    const stockCell = page.locator("tbody tr").first().locator("td").nth(2);
    const before = Number(await stockCell.innerText());
    await page.getByRole("button", { name: /Intake \+ / }).first().click();
    await expect(stockCell).toHaveText(String(before + 1));
    await expect(page.getByText("NOT_CONNECTED").first()).toBeVisible();
  });

  test("is gated: a guest is sent to the sign-in page", async ({ page }) => {
    // Override the demo-seller seed from beforeEach to exercise the guard.
    await page.addInitScript(() => window.localStorage.removeItem("eco.market.role"));
    await page.goto("/seller");
    await expect(page).toHaveURL(/\/seller\/signin$/);
    await expect(page.getByRole("heading", { name: "Seller sign-in" })).toBeVisible();
  });
});

test.describe("localization and responsiveness", () => {
  test("renders RTL in Persian", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Language/ }).first().click();
    await page.getByRole("menuitem", { name: /فارسی/ }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "fa");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("از منظر");
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
});