import { afterAll, beforeAll, expect, test } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApiClient } from "@eco-nojin/api-client";

/**
 * REAL API integration test.
 *
 * Boots the actual `services/api` server (real node:sqlite DB) on an ephemeral
 * port and drives it through the REAL `@eco-nojin/api-client` (not raw fetch),
 * with a cookie jar so the session cookie is exercised end-to-end. This is live
 * service integration — no mocked responses. The server uses a throwaway temp DB.
 */

let child: ChildProcess;
let baseUrl: string;
let dbDir: string;

function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = (srv.address() as { port: number }).port;
      srv.close(() => res(port));
    });
    srv.on("error", rej);
  });
}

async function waitHealthy(url: string, timeoutMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${url}/health`);
      if (r.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server did not become healthy in time");
}

/** Cookie-jar fetch so the real session cookie is stored and resent. */
function makeJarFetch() {
  let cookie = "";
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (cookie) headers.set("cookie", cookie);
    const res = await fetch(input, { ...init, headers });
    const getSet = (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie;
    const setCookies = getSet ? getSet.call(res.headers) : [];
    if (setCookies.length) cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
    return res;
  }) as typeof fetch;
}

beforeAll(async () => {
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  dbDir = mkdtempSync(join(tmpdir(), "nojin-live-"));
  const serverPath = resolve("services/api/src/server.mjs");
  child = spawn(process.execPath, [serverPath], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NOJIN_DB: join(dbDir, "live.db") },
    stdio: "ignore",
  });
  await waitHealthy(`http://127.0.0.1:${port}`);
});

afterAll(async () => {
  if (child) {
    child.kill("SIGTERM");
    await new Promise((r) => setTimeout(r, 300));
    if (!child.killed) child.kill("SIGKILL");
  }
  try {
    rmSync(dbDir, { recursive: true, force: true });
  } catch {
    // best effort
  }
});

test("real client → live server: full authed resource + catalog lifecycle", async () => {
  const api = createApiClient({ baseUrl, fetchImpl: makeJarFetch(), retry: { attempts: 0, baseDelayMs: 0 } });

  // 1. Register (bootstrap owner + organization) — real 201 + session cookie.
  const reg = await api.auth.register({
    email: `live-${Date.now()}@nojin.local`,
    name: "Live Tester",
    password: "correct-horse-battery",
    organizationName: "Live Org",
  });
  const orgId = reg.organizations![0]!.id;
  expect(reg.user.email).toContain("live-");

  // 2. Session is established (cookie round-trip).
  const me = await api.auth.me();
  expect(me.user.id).toBe(reg.user.id);
  expect(me.memberships.length).toBeGreaterThan(0);

  // 3. Create a resource (real write).
  const created = await api.resources.create("farms", { organizationId: orgId, name: "Live Farm", areaHa: 12.5 });
  const id = String(created.id);
  expect(id).toBeTruthy();

  // 4. List reflects it.
  const list = await api.resources.list("farms");
  expect(list.total).toBe(1);
  expect(list.items[0]?.name).toBe("Live Farm");

  // 5. Get by id.
  const one = await api.resources.get("farms", id);
  expect(one.name).toBe("Live Farm");

  // 6. Update (PATCH).
  await api.resources.update("farms", id, { name: "Live Farm (renamed)" });
  const after = await api.resources.get("farms", id);
  expect(after.name).toBe("Live Farm (renamed)");

  // 7. Notifications derive from the audit log (real).
  const notes = await api.notifications.list();
  expect(Array.isArray(notes.items)).toBe(true);

  // 8. Models registry is served (real file-backed).
  const models = await api.models.list();
  expect(Array.isArray(models.models)).toBe(true);

  // 9. Catalog product create + list (real).
  await api.catalog.createProduct({ organizationId: orgId, name: "Live Saffron", priceMinor: 1850, currency: "EUR", unit: "kg", stock: 5 });
  const products = await api.catalog.products();
  expect(products.total).toBe(1);
  expect(products.items[0]?.name).toBe("Live Saffron");

  // 10. Delete (real DELETE 204) → list empty.
  await api.resources.remove("farms", id);
  const empty = await api.resources.list("farms");
  expect(empty.total).toBe(0);

  // 11. Logout invalidates the session; a follow-up me() is 401.
  await api.auth.logout();
  await expect(api.auth.me()).rejects.toMatchObject({ status: 401 });
});