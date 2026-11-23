import type { BrowserContext } from "@playwright/test";

/**
 * Real host sign-in for tourism e2e tests.
 *
 * The API request jar and the browser jar are separate, so the session cookie
 * is copied by hand. The account's active organization is created as a
 * `business` (the tourism host definition), selected through the real session
 * storage key before the SPA boots.
 */
const API_BASE = process.env.E2E_API_BASE ?? "http://127.0.0.1:8000";
const SESSION_COOKIE = "nojin_session";

function tokenFromSetCookie(setCookie: string | undefined): string | null {
  if (!setCookie) return null;
  const pair = setCookie.split(";")[0] ?? "";
  const index = pair.indexOf("=");
  if (index < 0) return null;
  return decodeURIComponent(pair.slice(index + 1));
}

export async function ensureHostSession(context: BrowserContext): Promise<void> {
  const request = context.request;
  const run = Date.now();
  const email = `tourism-host-${run}@e2e.nojin.local`;
  const password = "e2e-host-password-1";

  let response = await request.post(`${API_BASE}/v1/auth/register`, {
    data: { name: `Tourism Host ${run}`, email, password },
  });
  if (response.status() === 409) {
    response = await request.post(`${API_BASE}/v1/auth/login`, { data: { email, password } });
  }
  if (!response.ok()) throw new Error(`host sign-in failed: ${response.status()} ${await response.text()}`);

  const setCookie = response.headersArray().find((header) => header.name.toLowerCase() === "set-cookie")?.value;
  const token = tokenFromSetCookie(setCookie);
  if (!token) throw new Error("host sign-in returned no session cookie");

  const organizationResponse = await request.post(`${API_BASE}/v1/organizations`, {
    data: { name: `Tourism Host Org ${run}`, kind: "business" },
  });
  if (!organizationResponse.ok()) {
    throw new Error(`host organization failed: ${organizationResponse.status()}`);
  }
  const organization = (await organizationResponse.json()) as { id: string };

  await context.addInitScript((orgId: string) => {
    window.localStorage.setItem("eco.console.org", orgId);
  }, organization.id);

  await context.addCookies([
    { name: SESSION_COOKIE, value: token, domain: "localhost", path: "/", httpOnly: true, sameSite: "Lax" },
  ]);
}