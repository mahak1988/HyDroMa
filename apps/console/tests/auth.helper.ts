import type { APIRequestContext, BrowserContext } from "@playwright/test";

/**
 * Real sign-in for console e2e tests.
 *
 * The test registers its owner account on the real API (or signs in when it
 * already exists from a previous run) and installs the session cookie into the
 * browser context explicitly — the API request context's jar and the browser
 * jar are separate, so the cookie is transferred by hand from the Set-Cookie
 * header.
 */
export const E2E_ACCOUNT = {
  email: "e2e-owner@nojin.local",
  name: "E2E Owner",
  password: "e2e-owner-password-1",
  organizationName: "E2E Watershed Council",
};

export const API_BASE = process.env.E2E_API_BASE ?? "http://127.0.0.1:8000";
export const SESSION_COOKIE = "nojin_session";

function tokenFromSetCookie(setCookie: string | undefined): string | null {
  if (!setCookie) return null;
  const pair = setCookie.split(";")[0] ?? "";
  const index = pair.indexOf("=");
  if (index < 0) return null;
  return decodeURIComponent(pair.slice(index + 1));
}

async function authenticate(context: BrowserContext): Promise<void> {
  const request: APIRequestContext = context.request;
  let response = await request.post(`${API_BASE}/v1/auth/register`, { data: E2E_ACCOUNT });
  if (response.status() === 409) {
    response = await request.post(`${API_BASE}/v1/auth/login`, {
      data: { email: E2E_ACCOUNT.email, password: E2E_ACCOUNT.password },
    });
  }
  if (!response.ok()) {
    throw new Error(`e2e sign-in failed: ${response.status()} ${await response.text()}`);
  }
  const setCookie = response.headersArray().find((header) => header.name.toLowerCase() === "set-cookie")?.value;
  const token = tokenFromSetCookie(setCookie);
  if (!token) throw new Error("e2e sign-in returned no session cookie");

  await context.addCookies([
    {
      name: SESSION_COOKIE,
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}

export async function ensureSignedIn(context: BrowserContext): Promise<void> {
  await authenticate(context);
}

/** The id of the account's own organization (resolved through the real API). */
export async function ownOrganizationId(context: BrowserContext): Promise<string> {
  const request: APIRequestContext = context.request;
  const response = await request.get(`${API_BASE}/v1/organizations`);
  if (!response.ok()) throw new Error(`organizations list failed: ${response.status()}`);
  const payload = (await response.json()) as { items: Array<{ id: string }> };
  const first = payload.items[0];
  if (!first) throw new Error("e2e account has no organization");
  return first.id;
}
