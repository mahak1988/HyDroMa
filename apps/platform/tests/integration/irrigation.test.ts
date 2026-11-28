import { afterAll, beforeAll, expect, test } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApiClient } from "@eco-nojin/api-client";

/** REAL irrigation persistence test: farm → irrigationEvent via existing API + SQLite. */
let child: ChildProcess;
let baseUrl: string;
let dbDir: string;

function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.listen(0, "127.0.0.1", () => { const p = (srv.address() as { port: number }).port; srv.close(() => res(p)); });
    srv.on("error", rej);
  });
}
async function waitHealthy(url: string, t = 15000): Promise<void> {
  const s = Date.now();
  while (Date.now() - s < t) { try { if ((await fetch(`${url}/health`)).ok) return; } catch { /* */ } await new Promise((r) => setTimeout(r, 150)); }
  throw new Error("not healthy");
}
function jar() {
  let c = "";
  return (async (i: RequestInfo | URL, init?: RequestInit) => {
    const h = new Headers(init?.headers); if (c) h.set("cookie", c);
    const r = await fetch(i, { ...init, headers: h });
    const g = (r.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie; const sc = g ? g.call(r.headers) : [];
    if (sc.length) c = sc.map((x) => x.split(";")[0]).join("; ");
    return r;
  }) as typeof fetch;
}

beforeAll(async () => {
  const port = await freePort(); baseUrl = `http://127.0.0.1:${port}`; dbDir = mkdtempSync(join(tmpdir(), "nojin-irr-"));
  child = spawn(process.execPath, [resolve("services/api/src/server.mjs")], { cwd: process.cwd(), env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NOJIN_DB: join(dbDir, "irr.db") }, stdio: "ignore" });
  await waitHealthy(baseUrl);
});
afterAll(async () => {
  if (child) { child.kill("SIGTERM"); await new Promise((r) => setTimeout(r, 300)); if (!child.killed) child.kill("SIGKILL"); }
  try { rmSync(dbDir, { recursive: true, force: true }); } catch { /* */ }
});

test("irrigation event persists and is retrieved linked to a farm", async () => {
  const api = createApiClient({ baseUrl, fetchImpl: jar(), retry: { attempts: 0, baseDelayMs: 0 } });
  const reg = await api.auth.register({ email: `irr-${Date.now()}@nojin.local`, name: "Irr", password: "correct-horse-battery", organizationName: "Irr Org" });
  const orgId = reg.organizations![0]!.id;
  const farm = await api.resources.create("farms", { organizationId: orgId, name: "River Plot" });
  const ev = await api.resources.create("irrigationEvents", { organizationId: orgId, farmId: String(farm.id), quantity: 12.5, unit: "mm", method: "drip", occurredAt: "2026-05-01T08:00" });
  const id = String(ev.id);
  const got = await api.resources.get("irrigationEvents", id);
  expect(got.farmId).toBe(String(farm.id));
  expect(got.quantity).toBe(12.5);
  expect(got.unit).toBe("mm");
  expect(got.method).toBe("drip");
  const list = await api.resources.list("irrigationEvents");
  expect(list.total).toBe(1);
  await api.resources.remove("irrigationEvents", id);
  expect((await api.resources.list("irrigationEvents")).total).toBe(0);
  expect((await api.resources.get("farms", String(farm.id))).id).toBe(String(farm.id));
});