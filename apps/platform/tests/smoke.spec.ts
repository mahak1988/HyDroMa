import { expect, test } from "@playwright/test";

/**
 * Smoke gate for the unified platform: the public core renders, the /platform
 * workspace still works under its prefix, and the real sign-in flow works
 * against the API.
 */
const RUN = Date.now();

test("public home renders with the unified header", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/اپلیکیشنها|Applications|التطبيقات/)).toBeVisible();
});

test("public intro pages render", async ({ page }) => {
  for (const route of ["/ecosystem", "/hydroma", "/mrv", "/knowledge", "/about", "/contact", "/partner"]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});

test("the /platform workspace renders under its prefix", async ({ page }) => {
  await page.goto("/platform");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.goto("/platform/landscapes");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("register on the public login page creates a real session", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("tab", { name: /Register|ثبت‌نام|تسجيل/ }).click();
  await page.getByLabel(/Full name|نام کامل|الاسم/).fill(`E2E Owner ${RUN}`);
  await page.getByLabel(/Email|ایمیل|البريد/).fill(`owner-${RUN}@e2e.nojin.local`);
  await page.getByLabel(/Password|گذرواژه|كلمة المرور/).first().fill("e2e-owner-password-1");
  await page.getByLabel(/Organization name|نام سازمان|اسم المنظمة/).fill(`E2E Org ${RUN}`);
  await page.getByRole("button", { name: /Create account|ساخت حساب|إنشاء حساب/ }).click();
  // A successful session returns the visitor to the public home.
  await expect(page).toHaveURL(/\/$/u, { timeout: 15_000 });
});
