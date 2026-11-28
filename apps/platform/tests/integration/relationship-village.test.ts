import { afterAll, beforeAll, expect, test } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApiClient } from "@eco-nojin/api-client";

/** REAL Village → Project relationship test (existing generic-resource contract + SQLite). */
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
      if ((await fetch(`${url}/health`)).ok) return;
    } catch {
      /* not up */
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw new Error("server not healthy");
}

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
  dbDir = mkdtempSync(join(tmpdir(), "nojin-vil-"));
  child = spawn(process.execPath, [resolve("services/api/src/server.mjs")], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NOJIN_DB: join(dbDir, "vil.db") },
    stdio: "ignore",
  });
  await waitHealthy(baseUrl);
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
    /* best effort */
  }
});

test("village → project: create, retrieve, reassign, clear; villages + territory link intact", async () => {
  const api = createApiClient({ baseUrl, fetchImpl: makeJarFetch(), retry: { attempts: 0, baseDelayMs: 0 } });
  const reg = await api.auth.register({ email: `vil-${Date.now()}@nojin.local`, name: "Vil", password: "correct-horse-battery", organizationName: "Vil Org" });
  const orgId = reg.organizations![0]!.id;

  const v1 = await api.resources.create("villages", { organizationId: orgId, name: "Deh Nokhod" });
  const v2 = await api.resources.create("villages", { organizationId: orgId, name: "Deh Sorkh" });
  const territory = await api.resources.create("landscapes", { organizationId: orgId, name: "Alborz" });

  // Create project linked to v1.
  const project = await api.resources.create("projects", { organizationId: orgId, name: "Linked", villageId: String(v1.id), territoryId: String(territory.id) });
  const projectId = String(project.id);

  const fetched = await api.resources.get("projects", projectId);
  expect(fetched.villageId).toBe(String(v1.id));
  expect(fetched.territoryId).toBe(String(territory.id)); // Territory → Project preserved

  // Reassign to v2.
  await api.resources.update("projects", projectId, { villageId: String(v2.id) });
  expect((await api.resources.get("projects", projectId)).villageId).toBe(String(v2.id));

  // Clear.
  await api.resources.update("projects", projectId, { villageId: null });
  const cleared = await api.resources.get("projects", projectId);
  expect(cleared.villageId ?? null).toBeNull();
  expect(cleared.territoryId).toBe(String(territory.id)); // territory link untouched

  // Villages remain intact; project remains.
  const villages = await api.resources.list("villages");
  expect(villages.total).toBe(2);
  expect((await api.resources.get("projects", projectId)).id).toBe(projectId);
});