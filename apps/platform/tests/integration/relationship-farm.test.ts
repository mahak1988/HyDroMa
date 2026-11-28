import { afterAll, beforeAll, expect, test } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApiClient } from "@eco-nojin/api-client";

/** REAL Farm → Project relationship test; verifies Territory & Village links remain intact. */
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
  dbDir = mkdtempSync(join(tmpdir(), "nojin-farm-"));
  child = spawn(process.execPath, [resolve("services/api/src/server.mjs")], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NOJIN_DB: join(dbDir, "farm.db") },
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

test("farm → project: create, retrieve, reassign, clear; farms + territory/village links intact", async () => {
  const api = createApiClient({ baseUrl, fetchImpl: makeJarFetch(), retry: { attempts: 0, baseDelayMs: 0 } });
  const reg = await api.auth.register({ email: `farm-${Date.now()}@nojin.local`, name: "Farm", password: "correct-horse-battery", organizationName: "Farm Org" });
  const orgId = reg.organizations![0]!.id;

  const f1 = await api.resources.create("farms", { organizationId: orgId, name: "Kondor Farm" });
  const f2 = await api.resources.create("farms", { organizationId: orgId, name: "Nomad Farm" });
  const territory = await api.resources.create("landscapes", { organizationId: orgId, name: "Alborz" });
  const village = await api.resources.create("villages", { organizationId: orgId, name: "Deh Nokhod" });

  const project = await api.resources.create("projects", {
    organizationId: orgId,
    name: "Linked",
    farmId: String(f1.id),
    territoryId: String(territory.id),
    villageId: String(village.id),
  });
  const projectId = String(project.id);

  const fetched = await api.resources.get("projects", projectId);
  expect(fetched.farmId).toBe(String(f1.id));
  expect(fetched.territoryId).toBe(String(territory.id)); // Territory preserved
  expect(fetched.villageId).toBe(String(village.id)); // Village preserved

  await api.resources.update("projects", projectId, { farmId: String(f2.id) });
  expect((await api.resources.get("projects", projectId)).farmId).toBe(String(f2.id));

  await api.resources.update("projects", projectId, { farmId: null });
  const cleared = await api.resources.get("projects", projectId);
  expect(cleared.farmId ?? null).toBeNull();
  expect(cleared.territoryId).toBe(String(territory.id)); // untouched
  expect(cleared.villageId).toBe(String(village.id)); // untouched

  const farms = await api.resources.list("farms");
  expect(farms.total).toBe(2);
  expect((await api.resources.get("projects", projectId)).id).toBe(projectId);
});