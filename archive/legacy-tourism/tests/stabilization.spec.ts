import { expect, test } from "@playwright/test";

const validBooking = (id: string, targetId: string) => ({
  id,
  kind: "stay",
  targetId,
  startDate: "2026-06-01",
  endDate: "2026-06-03",
  guests: 2,
  status: "requested",
  quote: { amountMinor: 8_400_000, currency: "IRR" },
  createdAt: "2026-11-19T08:00:00.000Z",
  demo: true,
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("eco.locale", "en");
    // The host workspace and bookings are gated; sign in as the demo host.
    window.localStorage.setItem("eco.tourism.host", "1");
  });
});

test("clearing the start date does not crash the booking form", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.goto("/book/stay/kondor-homestay");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.locator("#book-start").fill("");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  const min = await page.locator("#book-end").getAttribute("min");
  expect(min === null || min === "").toBe(true);
  await expect(page.getByRole("button", { name: "Send demo request" })).toBeDisabled();
  await expect(page.getByText("The end date must be after the start date.").first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("changing the booking target resets the previous form state", async ({ page }) => {
  await page.goto("/book/stay/kondor-homestay");
  await page.locator("#book-guests").fill("1");
  await page.getByRole("button", { name: "Send demo request" }).click();
  await expect(page.getByRole("heading", { name: "Demo request recorded" })).toBeVisible();

  // Param-only navigation: the route element is reused, so this is the case
  // where stale state would otherwise survive.
  await page.evaluate(() => {
    window.history.pushState({}, "", "/book/stay/taleghan-rural-guesthouse");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect(page.getByRole("heading", { name: "Taleghan Rural Guesthouse" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send demo request" })).toBeVisible();
  await expect(page.locator("#book-guests")).toHaveValue("2");
});

test("persists valid bookings and drops malformed records without crashing", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));

  await page.addInitScript((items) => {
    window.localStorage.setItem("eco.tourism.bookings", JSON.stringify(items));
  }, [
    { demo: true, id: "bad", targetId: "stay-kondor-homestay" },
    validBooking("req-valid", "stay-kondor-homestay"),
  ]);

  await page.goto("/bookings");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Kondor Family Homestay")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Kondor Family Homestay")).toBeVisible();
  expect(errors).toEqual([]);
});

test("host dashboard isolates bookings by host", async ({ page }) => {
  await page.addInitScript((items) => {
    window.localStorage.setItem("eco.tourism.bookings", JSON.stringify(items));
  }, [
    validBooking("req-kondor", "stay-kondor-homestay"),
    validBooking("req-zagros", "stay-zagros-farm-stay"),
  ]);

  await page.goto("/host?host=sel-kondor");
  await expect(page.getByText("Kondor Family Homestay").first()).toBeVisible();
  await expect(page.getByText("Zagros Farm Stay")).toHaveCount(0);
  await expect(page.locator(".kpi-value").last()).toHaveText("1");

  await page.getByLabel("Host").selectOption("sel-zagros-farm");
  await expect(page.getByText("Zagros Farm Stay").first()).toBeVisible();
  await expect(page.getByText("Kondor Family Homestay")).toHaveCount(0);
  await expect(page.locator(".kpi-value").last()).toHaveText("1");
});

test("map keeps camera and layer visibility across data changes", async ({ page }) => {
  await page.goto("/map");
  await expect(page.locator('[data-map-ready="true"]')).toBeVisible();

  await page.evaluate(() => {
    const el = document.querySelector('[role="application"]') as HTMLDivElement & { __spatialMap?: any };
    el.__spatialMap?.jumpTo({ center: [51.2, 36.2], zoom: 9.5 });
  });

  const before = await page.evaluate(() => {
    const el = document.querySelector('[role="application"]') as HTMLDivElement & { __spatialMap?: any };
    const map = el.__spatialMap;
    return { zoom: map?.getZoom(), lng: map?.getCenter().lng, lat: map?.getCenter().lat };
  });

  await page.getByRole("checkbox", { name: "Destinations" }).uncheck();
  await page.locator("#map-kind").selectOption("village");
  await page.waitForTimeout(400);

  const after = await page.evaluate(() => {
    const el = document.querySelector('[role="application"]') as HTMLDivElement & { __spatialMap?: any };
    const map = el.__spatialMap;
    return {
      zoom: map?.getZoom(),
      lng: map?.getCenter().lng,
      lat: map?.getCenter().lat,
      destinations: map?.getLayoutProperty("dest-points", "visibility"),
    };
  });

  expect(after.zoom).toBe(before.zoom);
  expect(after.zoom).toBe(9.5);
  expect(after.lng).toBeCloseTo(51.2, 5);
  expect(after.lat).toBeCloseTo(36.2, 5);
  expect(after.destinations).toBe("none");
  await expect(page.getByRole("checkbox", { name: "Destinations" })).not.toBeChecked();
});