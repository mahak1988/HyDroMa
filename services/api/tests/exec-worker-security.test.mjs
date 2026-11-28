/**
 * Phase 3.102 — worker subprocess security (no shell, bounded, structured errors).
 * Run: node --test services/api/tests/exec-worker-security.test.mjs
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";

const PY = "D:/NOJIN/engines/hydroma/.venv/Scripts/python.exe";
const CWD = "D:/NOJIN/engines/hydroma";

function run(input) {
  return spawnSync(PY, ["-m", "hydroma.exec_worker"], { cwd: CWD, input, encoding: "utf8", timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
}

test("worker rejects malformed JSON and unsupported models without a shell", { skip: existsSync(PY) ? false : "engine venv missing" }, () => {
  const bad = run("not-json");
  assert.equal(bad.status, 2);
  assert.equal(JSON.parse(bad.stdout).error.code, "invalid_request");

  const unsupported = run(JSON.stringify({ model_id: "unknown", model_version: "1.0.0", input: {} }));
  assert.equal(unsupported.status, 2);
  assert.equal(JSON.parse(unsupported.stdout).error.code, "unsupported_model");
});