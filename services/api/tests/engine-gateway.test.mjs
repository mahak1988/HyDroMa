/**
 * Phase 3.85 — EngineGateway + controlled irrigation execution.
 * Uses a mock engine that speaks the documented HTTP contract. This is a
 * contract/mock integration test, NOT actual HyDroMA execution.
 * Run: node --test services/api/tests/engine-gateway.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { openDatabase } from "../src/db.mjs";
import { createApp } from "../src/server.mjs";
import { validateIrrigationInput } from "../src/engine-gateway.mjs";

const PASS = "correct-horse-battery";
const IRRIGATION_ID = "eco-nojin.hydroma.irrigation-schedule";

const validInput = () => ({
  layers: [{ thickness_mm: 300, theta_fc: 0.3, theta_wp: 0.15 }],
  p: 0.5,
  depletion_mm: 40,
});

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
  const cookie = cookieOf(headers);
  const org = (await call(base, "/v1/organizations", { cookie })).json.items[0].id;
  return { cookie, org };
}

function mockEngine(t, mode = "success") {
  const state = { created: 0, polls: 0, lastBody: null };
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      const send = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
      if (req.method === "POST" && req.url === "/v1/runs") {
        state.created += 1;
        state.lastBody = raw ? JSON.parse(raw) : null;
        return send(202, { run_id: "engine-1", status: "queued" });
      }
      if (req.method === "GET" && req.url === "/v1/runs/engine-1") {
        state.polls += 1;
        if (mode === "timeout") return send(200, { run_id: "engine-1", status: "running" });
        if (mode === "failure") return send(200, { run_id: "engine-1", status: "failed", error_json: { code: "NUMERICAL_FAILURE", message: "bad input" } });
        if (mode === "malformed") return send(200, { run_id: "engine-1", status: "completed", result_json: null });
        if (state.polls < 2) return send(200, { run_id: "engine-1", status: "running" });
        return send(200, {
          run_id: "engine-1",
          status: "completed",
          result_json: {
            ok: true,
            model: { id: IRRIGATION_ID, version: "1.0.0" },
            inputs: validInput(),
            result: { taw_mm: 45, raw_mm: 22.5, net_irrigation_mm: 12.5, gross_irrigation_mm: 15.6, irrigation_recommended: true, status: "stressed" },
          },
          provenance_json: {
            model_id: IRRIGATION_ID,
            model_version: "1.0.0",
            code_version: "1.0.0",
            run_id: "engine-1",
            input_hashes: {},
            parameter_hash: "p",
            environment: "test",
            executed_at: "2026-11-26T00:00:00Z",
            operator: "api",
            result_hashes: {},
            validation_status: "NOT_VALIDATED",
          },
        });
      }
      send(404, { detail: "not found" });
    });
  });
  server.unref();
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({
      url: `http://127.0.0.1:${server.address().port}`,
      state,
      close: () => { server.closeAllConnections(); server.close(); },
    }));
  });
}

async function withEngine(t, mode, fn) {
  const engine = await mockEngine(t, mode);
  t.after(() => engine.close());
  const previous = process.env.NOJIN_HYDROMA_URL;
  process.env.NOJIN_HYDROMA_URL = engine.url;
  process.env.NOJIN_HYDROMA_TIMEOUT_MS = "400";
  process.env.NOJIN_HYDROMA_POLL_MS = "40";
  t.after(() => {
    if (previous === undefined) delete process.env.NOJIN_HYDROMA_URL; else process.env.NOJIN_HYDROMA_URL = previous;
    delete process.env.NOJIN_HYDROMA_TIMEOUT_MS;
    delete process.env.NOJIN_HYDROMA_POLL_MS;
  });
  return fn(engine);
}

test("gateway contract: success persists output, units, provenance and audit", async (t) => {
  const { base, db } = await makeApp(t);
  const { cookie } = await bootstrap(base, "g1@eco.local", "G Org 1");
  await withEngine(t, "success", async (engine) => {
    const created = (await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "ir1", input: validInput(), correlationId: "corr-1" }, expect: 200 })).json.run;
    assert.equal(created.status, "COMPLETED");
    assert.equal(created.output.result.net_irrigation_mm, 12.5);
    assert.equal(created.units.net_irrigation_mm, "mm");
    assert.equal(created.provenance.model_id, IRRIGATION_ID);
    assert.equal(created.correlationId, "corr-1");
    assert.equal(created.scientificStatus, "NOT_VALIDATED");
    assert.equal(created.softwareMaturity, null);
    assert.equal(engine.state.created, 1, "engine called once");
    assert.equal(engine.state.lastBody.model_id, IRRIGATION_ID, "fixed model id sent");
    assert.equal(engine.state.lastBody.model_version, "1.0.0");
    assert.equal(engine.state.lastBody.tenant_id, (await call(base, "/v1/organizations", { cookie })).json.items[0].id);
    const audits = db.prepare("SELECT COUNT(*) AS n FROM audit WHERE entity = 'hydroma_runs' AND entity_id = ?").get(created.id).n;
    assert.equal(audits, 3, "create + running + completed audited");

    const duplicate = (await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "ir1", input: validInput() }, expect: 200 })).json;
    assert.equal(duplicate.duplicate, true);
    assert.equal(engine.state.created, 1, "duplicate does not re-execute");
  });
});

test("gateway contract: invalid input is rejected before the engine is called", async (t) => {
  const { base } = await makeApp(t);
  const { cookie } = await bootstrap(base, "g2@eco.local", "G Org 2");
  await withEngine(t, "success", async (engine) => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "bad1", input: { p: 0.5, depletion_mm: 1 } }, expect: 422 });
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "bad2", input: { ...validInput(), module: "evil" } }, expect: 422 });
    assert.equal(engine.state.created, 0, "engine never called for invalid input");
  });
  assert.ok(validateIrrigationInput(validInput()).length === 0, "valid input passes local contract");
});

test("gateway contract: engine failure maps to FAILED with no fabricated output", async (t) => {
  const { base, db } = await makeApp(t);
  const { cookie } = await bootstrap(base, "g3@eco.local", "G Org 3");
  await withEngine(t, "failure", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "f1", input: validInput() }, expect: 502 });
  });
  const run = db.prepare("SELECT * FROM hydroma_runs WHERE run_key = 'f1'").get();
  assert.equal(run.status, "FAILED");
  assert.equal(run.output_json, null, "no output on failure");
  assert.match(run.error, /failed/i);
});

test("gateway contract: timeout maps to FAILED and 504", async (t) => {
  const { base, db } = await makeApp(t);
  const { cookie } = await bootstrap(base, "g4@eco.local", "G Org 4");
  await withEngine(t, "timeout", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "t1", input: validInput() }, expect: 504 });
  });
  assert.equal(db.prepare("SELECT status FROM hydroma_runs WHERE run_key = 't1'").get().status, "FAILED");
});

test("gateway contract: malformed engine output is rejected", async (t) => {
  const { base, db } = await makeApp(t);
  const { cookie } = await bootstrap(base, "g5@eco.local", "G Org 5");
  await withEngine(t, "malformed", async () => {
    await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie, body: { runKey: "m1", input: validInput() }, expect: 502 });
  });
  assert.equal(db.prepare("SELECT status FROM hydroma_runs WHERE run_key = 'm1'").get().status, "FAILED");
});

test("tenant isolation: another org cannot read or re-run the execution", async (t) => {
  const { base } = await makeApp(t);
  const a = await bootstrap(base, "g6a@eco.local", "G Org 6A");
  const b = await bootstrap(base, "g6b@eco.local", "G Org 6B");
  await withEngine(t, "success", async () => {
    const run = (await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie: a.cookie, body: { runKey: "iso", input: validInput() }, expect: 200 })).json.run;
    await call(base, `/v1/hydroma/runs/${run.id}`, { cookie: b.cookie, expect: 404 });
    const other = (await call(base, "/v1/hydroma/irrigation/runs", { method: "POST", cookie: b.cookie, body: { runKey: "iso", input: validInput() }, expect: 200 })).json;
    assert.notEqual(other.run.id, run.id, "org-scoped idempotency");
  });
});