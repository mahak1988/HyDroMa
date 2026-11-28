import { afterAll, beforeAll, expect, test } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createApiClient } from "@eco-nojin/api-client";

/**
 * REAL cross-module relationship test: Territory (landscapes) → Project (projects).
 * The relationship is persisted as `territoryId` on the project resource (existing
 * generic-resource contract) and retrieved through the real API + SQLite.
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
  dbDir = mkdtempSync(join(tmpdir(), "nojin-rel-"));
  child = spawn(process.execPath, [resolve("services/api/src/server.mjs")], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NOJIN_DB: join(dbDir, "rel.db") },
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

test("territory → project relationship persists and is retrieved via the real API", async () => {
  const api = createApiClient({ baseUrl, fetchImpl: makeJarFetch(), retry: { attempts: 0, baseDelayMs: 0 } });

  const reg = await api.auth.register({ email: `rel-${Date.now()}@nojin.local`, name: "Rel", password: "correct-horse-battery", organizationName: "Rel Org" });
  const orgId = reg.organizations![0]!.id;

  // Source entity: a territory.
  const territory = await api.resources.create("landscapes", { organizationId: orgId, name: "Alborz Territory" });
  const territoryId = String(territory.id);

  // Target entity with the persisted relationship.
  const project = await api.resources.create("projects", { organizationId: orgId, name: "Linked Project", territoryId });
  const projectId = String(project.id);

  // Retrieval proves persistence of the relationship.
  const fetched = await api.resources.get("projects", projectId);
  expect(fetched.territoryId).toBe(territoryId);

  // Reassign the relationship (update) and re-read.
  const territory2 = await api.resources.create("landscapes", { organizationId: orgId, name: "Zagros Territory" });
  await api.resources.update("projects", projectId, { territoryId: String(territory2.id) });
  const after = await api.resources.get("projects", projectId);
  expect(after.territoryId).toBe(String(territory2.id));

  // Removing the relationship does not delete the related entities.
  await api.resources.update("projects", projectId, { territoryId: null });
  const cleared = await api.resources.get("projects", projectId);
  expect(cleared.territoryId ?? null).toBeNull();
  const stillThere = await api.resources.list("landscapes");
  expect(stillThere.total).toBe(2);
  expect((await api.resources.get("projects", projectId)).id).toBe(projectId);
});