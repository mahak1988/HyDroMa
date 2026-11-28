/**
 * Phase 3.86 — execution integrity & gateway hardening.
 * Mock engine speaking the documented HTTP contract. NOT actual engine execution.
 * Run: node --test services/api/tests/runs-integrity.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";
import { assertSafeGatewayUrl, GatewayError } from "../src/engine-gateway.mjs";

const PASS = "correct-horse-battery";
const validInput = () => ({ layers: [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }], p: 0.5, depletion_mm: 40 });

async function makeApp(t) {
  const db = openDatabase(":memory:");
  const server = createServer(createApp({ db }));
  t.after(() => { server.closeAllConnections(); server.close(); });
  server.unref();
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  return { base: `http://127.0.0.1:${server.address().port}`, db };
}

async function call(base, path, { method = "GET", body, cookie, expect = 200 } = {}) {
  const r = await fetch(base + path, {
    method,
    headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch { json = null; }
  assert.equal(r.status, expect, `${method} ${path} -> ${r.status}: ${text.slice(0, 200)}`);
  return { json, headers: r.headers };
}

const cookieOf = (h) => h.get("set-cookie").split(";")[0];
async function bootstrap(base, email, orgName) {
  const { headers } = await call(base, "/v1/auth/register", { method: "POST", body: { email, name: email, password: PASS, organizationName: orgName }, expect: 201 });
  return cookieOf(headers);
}

function mockEngine(t, mode = "success") {
  const state = { created: 0 };
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      const send = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
      if (req.method === "POST" && req.url === "/v1/runs") { state.created += 1; return send(202, { run_id: "e1", status: "queued" }); }
      if (req.method === "GET" && req.url === "/v1/runs/e1") {
        if (mode === "timeout") return send(200, { run_id: "e1", status: "running" });
        if (mode === "failure") return send(200, { run_id: "e1", status: "failed", error_json: { code: "NUMERICAL_FAILURE", message: "bad" } });
        if (mode === "malformed") return send(200, { run_id: "e1", status: "completed", result_json: null });
        if (mode === "huge") return send(200, { run_id: "e1", status: "completed", result_json: { blob: "x".repeat(300 * 1024) } });
        const finish = () => send(200, {
          run_id: "e1",
          status: "completed",
          result_json: { ok: true, result: { net_irrigation_mm: 12.5 } },
          provenance_json: { model_id: "eco-nojin.hydroma.irrigation-schedule", model_version: "1.0.0", code_version: "1.0.0", run_id: "e1", validation_status: "NOT_VALIDATED" },
        });
        if (mode === "slow") return setTimeout(finish, 250);
        return finish();
      }
      send(404, {});
    });
  });
  server.unref();
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve({
    url: `http://127.0.0.1:${server.address().port}`,
    state,
    close: () => { server.closeAllConnections(); server.close(); },
  })));
}

async function withEngine(t, mode, fn, extraEnv = {}) {
  const engine = await mockEngine(t, mode);
  t.after(() => engine.close());
  const saved = { url: process.env.NOJIN_HYDROMA_URL, timeout: process.env.NOJIN_HYDROMA_TIMEOUT_MS, poll: process.env.NOJIN_HYDROMA_POLL_MS, max: process.env.NOJIN_HYDROMA_MAX_CONCURRENT };
  process.env.NOJIN_HYDROMA_URL = engine.url;
  process.env.NOJIN_HYDROMA_TIMEOUT_MS = "500";
  process.env.NOJIN_HYDROMA_POLL_MS = "40";
  Object.assign(process.env, extraEnv);
  t.after(() => {
    for (const [key, value] of Object.entries({ NOJIN_HYDROMA_URL: saved.url, NOJIN_HYDROMA_TIMEOUT_MS: saved.timeout, NOJIN_HYDROMA_POLL_MS: saved.poll, NOJIN_HYDROMA_MAX_CONCURRENT: saved.max })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  });
  return fn(engine);
}

test("state integrity: clients cannot complete or cancel runs", async (t) => {
  const { base } = await makeApp(t);
  const cookie = await bootstrap(base, "i1@eco.local", "I Org 1");
  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "s1", modelId: "m", modelVersion: "1.0.0", input: validInput() }, expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "COMPLETED", output: { fake: true } }, expect: 409 });
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "CANCELLED" }, expect: 409 });
});

test("execution integrity: timeout is uncertain and flagged for reconciliation, never completed", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i2@eco.local", "I Org 2");
  await withEngine(t, "timeout", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "t1", input: validInput() }, expect: 504 });
  });
  const row = db.prepare("SELECT * FROM hydroma_runs WHERE run_key = 't1'").get();
  assert.equal(row.status, "FAILED");
  assert.equal(row.reconciliation_required, 1, "uncertain outcome flagged");
  assert.equal(row.output_json, null, "no fabricated completion");
});

test("execution integrity: explicit engine failure and malformed output are authoritative failures", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i3@eco.local", "I Org 3");
  await withEngine(t, "failure", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "f1", input: validInput() }, expect: 502 });
  });
  await withEngine(t, "malformed", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "m1", input: validInput() }, expect: 502 });
  });
  assert.equal(db.prepare("SELECT reconciliation_required FROM hydroma_runs WHERE run_key = 'f1'").get().reconciliation_required, 0);
  assert.equal(db.prepare("SELECT reconciliation_required FROM hydroma_runs WHERE run_key = 'm1'").get().reconciliation_required, 0);
});

test("execution integrity: oversized engine output is rejected", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i4@eco.local", "I Org 4");
  await withEngine(t, "huge", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "h1", input: validInput() }, expect: 502 });
  });
  assert.equal(db.prepare("SELECT status FROM hydroma_runs WHERE run_key = 'h1'").get().status, "FAILED");
});

test("recovery: stale RUNNING runs are reconciled without auto re-execution", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i5@eco.local", "I Org 5");
  const run = (await call(base, "/v1/hydroma/runs", { method: "POST", cookie, body: { runKey: "r1", modelId: "m", modelVersion: "1.0.0", input: validInput() }, expect: 201 })).json.run;
  await call(base, `/v1/hydroma/runs/${run.id}/status`, { method: "POST", cookie, body: { status: "RUNNING" } });
  db.prepare("UPDATE hydroma_runs SET updated_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(run.id);
  const result = (await call(base, "/v1/hydroma/runs/reconcile", { method: "POST", cookie, body: {}, expect: 200 })).json;
  assert.equal(result.reconciled, 1);
  const row = db.prepare("SELECT * FROM hydroma_runs WHERE id = ?").get(run.id);
  assert.equal(row.status, "FAILED");
  assert.equal(row.reconciliation_required, 1);
  assert.equal(row.output_json, null, "no false completion");
});

test("concurrency: per-process capacity bounds simultaneous executions", async (t) => {
  const { base } = await makeApp(t);
  const cookie = await bootstrap(base, "i6@eco.local", "I Org 6");
  await withEngine(t, "slow", async (engine) => {
    const first = fetch(base + "/v1/hydroma/irrigation/runs", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ runKey: "c1", input: validInput() }) });
    await new Promise((r) => setTimeout(r, 60));
    const second = await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "c2", input: validInput() }, expect: 429 });
    assert.equal(second.json.error.code, "execution_capacity_exceeded");
    const firstResponse = await first;
    assert.equal(firstResponse.status, 200);
    assert.equal(engine.state.created, 1, "only one execution reached the engine");
  }, { NOJIN_HYDROMA_MAX_CONCURRENT: "1" });
});

test("concurrency: duplicate runKey under concurrency executes once", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i7@eco.local", "I Org 7");
  await withEngine(t, "slow", async (engine) => {
    const responses = await Promise.all([
      fetch(base + "/v1/hydroma/irrigation/runs", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ runKey: "dup", input: validInput() }) }),
      fetch(base + "/v1/hydroma/irrigation/runs", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ runKey: "dup", input: validInput() }) }),
    ]);
    assert.deepEqual(responses.map((r) => r.status).sort(), [200, 200]);
    assert.equal(engine.state.created, 1, "duplicate does not re-execute");
    assert.equal(db.prepare("SELECT COUNT(*) AS n FROM hydroma_runs WHERE run_key = 'dup'").get().n, 1);
  });
});

test("gateway security: unsafe endpoint configuration is rejected", () => {
  for (const value of ["ftp://engine", "http://user:pass@engine", "http://engine?x=1", "not-a-url"]) {
    assert.throws(() => assertSafeGatewayUrl(value), (error) => error instanceof GatewayError && error.code === "invalid_configuration");
  }
  assert.equal(assertSafeGatewayUrl("http://127.0.0.1:8001/"), "http://127.0.0.1:8001");
});
test("race: reconciliation during an active execution is not overwritten by completion", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i8@eco.local", "I Org 8");
  await withEngine(t, "slow", async () => {
    const pending = fetch(base + "/v1/hydroma/irrigation/runs", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ runKey: "race1", input: validInput() }) });
    let id = null;
    for (let i = 0; i < 100 && !id; i += 1) {
      const row = db.prepare("SELECT id FROM hydroma_runs WHERE run_key = 'race1'").get();
      if (row) id = row.id;
      else await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(id, "run created");
    db.prepare("UPDATE hydroma_runs SET updated_at = '2000-01-01T00:00:00.000Z' WHERE id = ?").run(id);
    const rec = (await call(base, "/v1/hydroma/runs/reconcile", { method: "POST", cookie, body: {}, expect: 200 })).json;
    assert.equal(rec.reconciled, 1);
    const response = await pending;
    assert.equal(response.status, 409, "completion must not overwrite a reconciled run");
    const row = db.prepare("SELECT * FROM hydroma_runs WHERE id = ?").get(id);
    assert.equal(row.status, "FAILED");
    assert.equal(row.reconciliation_required, 1);
    assert.equal(row.output_json, null);
  });
});

test("abort integrity: a client abort is logical only and cannot be overwritten by completion", async (t) => {
  const { base, db } = await makeApp(t);
  const cookie = await bootstrap(base, "i9@eco.local", "I Org 9");
  await withEngine(t, "slow", async () => {
    const pending = fetch(base + "/v1/hydroma/irrigation/runs", { method: "POST", headers: { "content-type": "application/json", cookie }, body: JSON.stringify({ runKey: "abort1", input: validInput() }) });
    let id = null;
    for (let i = 0; i < 100 && !id; i += 1) {
      const row = db.prepare("SELECT id FROM hydroma_runs WHERE run_key = 'abort1'").get();
      if (row) id = row.id;
      else await new Promise((r) => setTimeout(r, 10));
    }
    assert.ok(id, "run created");
    const aborted = (await call(base, `/v1/hydroma/runs/${id}/status`, { method: "POST", cookie, body: { status: "FAILED", error: "operator abort" } })).json.run;
    assert.equal(aborted.status, "FAILED");
    const response = await pending;
    assert.equal(response.status, 409, "gateway completion must not overwrite an aborted run");
    const row = db.prepare("SELECT * FROM hydroma_runs WHERE id = ?").get(id);
    assert.equal(row.status, "FAILED");
    assert.equal(row.output_json, null);
    assert.match(row.error, /operator abort/);
  });
});
