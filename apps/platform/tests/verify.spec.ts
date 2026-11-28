import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 3.50 functional/E2E verification.
 *
 * These tests exercise the REAL frontend (routing, session gate, API states,
 * capability boundary, API-backed pages, responsive layout) with TEST-ONLY
 * network mocks via page.route. No mock enters production runtime and no real
 * backend integration is claimed. The webServer config still boots the dev
 * server; mocked API responses are intercepted before any network call.
 */

const ME = {
  user: { id: "usr-e2e", email: "e2e@nojin.local", name: "E2E", status: "active", locale: "fa" },
  memberships: [{ id: "mem1", organizationId: "org-e2e", userId: "usr-e2e", role: "owner", status: "active", organization: { id: "org-e2e", name: "E2E Org", slug: "e2e-org" } }],
  activeOrganizationId: "org-e2e",
};

async function mockAuthed(page: Page, resources: unknown[] = []) {
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ json: ME }));
  await page.route("**/api/v1/organizations/org-e2e", (route) => route.fulfill({ json: { id: "org-e2e", name: "E2E Org", slug: "e2e-org", country: "IR", kind: "community", status: "active" } }));
  await page.route("**/api/v1/resources/**", (route) =>
    route.fulfill({ json: { items: resources, nextCursor: null, total: resources.length } }),
  );
  await page.route("**/api/v1/notifications", (route) => route.fulfill({ json: { items: [], unread: 0 } }));
}

test("public routes render a level-1 heading", async ({ page }) => {
  for (const route of ["/", "/about", "/ecosystem", "/hydroma", "/marketplace", "/accessibility", "/privacy", "/terms"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("unknown route shows the not-found page", async ({ page }) => {
  await page.goto("/this-route-does-not-exist");
  await expect(page.getByRole("heading", { name: /not found|یافت نشد|۴۰۴/i })).toBeVisible();
});

test("session gate blocks a guest and shows the real sign-in panel", async ({ page }) => {
  await page.route("**/api/v1/auth/me", (route) => route.fulfill({ status: 401, json: { error: { code: "unauthenticated", message_key: "errors.unauthenticated" } } }));
  await page.goto("/platform");
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toBeVisible();
  await expect(heading).toContainText(/sign in|login|ورود|تسجيل/i);
});

test("an authenticated session enters the workspace and sees live resource rows", async ({ page }) => {
  await mockAuthed(page, [{ id: "l1", type: "landscapes", name: "Kondor E2E" }]);
  await page.goto("/platform/landscapes");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Kondor E2E")).toBeVisible();
});

test("an empty API response shows the honest empty state", async ({ page }) => {
  await mockAuthed(page, []);
  await page.goto("/platform/agriculture");
  await expect(page.getByText(/No data recorded|هنوز داده/)).toBeVisible();
});

test("an API error shows the error state with retry", async ({ page }) => {
  await mockAuthed(page, []);
  await page.route("**/api/v1/resources/villages**", (route) => route.fulfill({ status: 503, json: { error: { code: "unavailable", message_key: "errors.unavailable" } } }));
  await page.goto("/platform/communities");
  await expect(page.getByText(/did not respond|پاسخ نداد|اتصال ناموفق/)).toBeVisible();
  await expect(page.getByRole("button", { name: /try again|تلاش مجدد/i })).toBeVisible();
});

test("a backend-blocked module shows an honest capability boundary", async ({ page }) => {
  await mockAuthed(page, []);
  await page.goto("/platform/inventory");
  await expect(page.getByText(/not connected yet|هنوز به سرویس متصل نیست/)).toBeVisible();
  await expect(page.getByText(/Blocked by backend|مسدود به‌دلیل/)).toBeVisible();
});

test("no horizontal overflow at representative viewports", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const result = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const scroll = document.documentElement.scrollWidth - vw;
      const clipped = (el: Element): boolean => {
        let node: Element | null = el.parentElement;
        while (node) {
          const s = getComputedStyle(node);
          if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) return true;
          node = node.parentElement;
        }
        return false;
      };
      const offenders: string[] = [];
      if (scroll > 0) {
        for (const el of Array.from(document.querySelectorAll("*"))) {
          const r = el.getBoundingClientRect();
          if (r.right > vw + 1 && r.width > 0 && !clipped(el)) {
            offenders.push(`${el.tagName}.${(el.className || "").toString().slice(0, 50)} right=${Math.round(r.right)}`);
          }
        }
      }
      return { scroll, offenders: offenders.slice(0, 6) };
    });
    expect(result.scroll, `horizontal scroll at ${width}px: ${result.offenders.join(" | ")}`).toBeLessThanOrEqual(0);
  }
});