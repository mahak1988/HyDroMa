/**
 * Phase 5 — Async engine execution contract (Workstream B).
 * Exercises REAL child processes (Node used as the worker executable) so process
 * behaviour is genuine, not mocked. Run: node --test services/api/tests/engine-execution.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { executeModel, executionCapacity, activeExecutionCount } from "../src/engine-execution.mjs";

const NODE = process.execPath;

// Worker scripts (run via `node -e <script>`); each reads the JSON request on stdin.
const WORKER = {
  ok: `let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{const q=JSON.parse(d);process.stdout.write(JSON.stringify({result:{echo:q.input},manifest:{code_version:'test'}}))})`,
  fail: `let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{process.stdout.write(JSON.stringify({error:{code:'model_failed',message:'boom',details:{x:1}}}));process.exit(3)})`,
  slow: `setTimeout(()=>{},60000)`,
  flood: `process.stdin.resume();process.stdin.on('end',()=>{process.stdout.write('x'.repeat(200000))})`,
};

const base = (over = {}) => ({ modelId: "m", modelVersion: "1", input: { a: 1 }, runId: "r", python: NODE, args: ["-e", WORKER.ok], ...over });

test("success: real process returns parsed output and releases the slot", async () => {
  const before = activeExecutionCount();
  const out = await executeModel(base());
  assert.equal(out.result.echo.a, 1);
  assert.equal(out.manifest.code_version, "test");
  assert.equal(activeExecutionCount(), before, "slot released after success");
});

test("nonzero exit: structured engine error is surfaced", async () => {
  const out = await executeModel(base({ args: ["-e", WORKER.fail] }));
  assert.equal(out.ok, false);
  assert.equal(out.code, "model_failed");
  assert.equal(out.details.x, 1);
});

test("spawn failure: missing executable maps to engine_unavailable", async () => {
  const out = await executeModel(base({ python: "/nonexistent/python-xyz-123" }));
  assert.equal(out.ok, false);
  assert.equal(out.code, "engine_unavailable");
});

test("timeout: a non-responding process is killed and reported", async () => {
  const out = await executeModel(base({ args: ["-e", WORKER.slow], timeoutMs: 300 }));
  assert.equal(out.ok, false);
  assert.equal(out.code, "timeout");
  assert.equal(activeExecutionCount(), 0, "slot released after timeout");
});

test("output limit: oversized stdout is rejected and the slot released", async () => {
  const out = await executeModel(base({ args: ["-e", WORKER.flood], maxOutputBytes: 1024, timeoutMs: 5000 }));
  assert.equal(out.ok, false);
  assert.equal(out.code, "engine_error");
  assert.equal(activeExecutionCount(), 0, "slot released after truncation");
});

test("invalid output: non-JSON stdout maps to invalid_output", async () => {
  const out = await executeModel(base({ args: ["-e", `process.stdin.resume();process.stdin.on('end',()=>process.stdout.write('not json'))`] }));
  assert.equal(out.ok, false);
  assert.equal(out.code, "invalid_output");
});

test("concurrency: capacity is bounded and excess is rejected (fail-fast, no queue)", async () => {
  const prev = process.env.NOJIN_HYDROMA_MAX_CONCURRENT;
  process.env.NOJIN_HYDROMA_MAX_CONCURRENT = "1";
  try {
    assert.equal(executionCapacity(), 1);
    const first = executeModel(base({ args: ["-e", WORKER.slow], timeoutMs: 800 })); // holds the only slot
    await delay(80); // let it acquire
    const second = await executeModel(base()); // capacity exhausted
    assert.equal(second.ok, false);
    assert.equal(second.code, "capacity_exhausted");
    await first; // releases the slot
    const third = await executeModel(base()); // slot free again
    assert.equal(third.result.echo.a, 1, "slot released after the first completes");
    assert.equal(activeExecutionCount(), 0);
  } finally {
    if (prev === undefined) delete process.env.NOJIN_HYDROMA_MAX_CONCURRENT; else process.env.NOJIN_HYDROMA_MAX_CONCURRENT = prev;
  }
});

test("event loop: stays responsive while a process runs", async () => {
  let ticks = 0;
  const iv = setInterval(() => { ticks += 1; }, 10);
  const run = executeModel(base({ args: ["-e", WORKER.slow], timeoutMs: 400 }));
  await delay(150);
  const mid = ticks;
  await run;
  clearInterval(iv);
  assert.ok(mid > 0, `event loop ticked ${mid} times during execution`);
});

test("isolation: simultaneous executions do not share output", async () => {
  const [a, b] = await Promise.all([
    executeModel(base({ input: { a: 1 } })),
    executeModel(base({ input: { a: 2 } })),
  ]);
  assert.equal(a.result.echo.a, 1);
  assert.equal(b.result.echo.a, 2);
  assert.equal(activeExecutionCount(), 0);
});