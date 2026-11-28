/**
 * Isolated local execution adapter (Phase 3.101 → Phase 5 async).
 * Spawns the engine's own Python worker in the engine venv via async `spawn`, so
 * the Node event loop is never blocked. The API never imports engine internals;
 * the worker emits result + observed manifest on stdout.
 *
 * Concurrency is bounded by an in-process semaphore (fail-fast when full — no
 * unbounded pending queue). The slot is always released. Per-process only; a
 * multi-instance deployment needs a shared coordinator (documented limitation).
 */
import { spawn } from "node:child_process";
import { resolve } from "node:path";

const ENGINE_DIR = resolve(process.cwd(), "engines/hydroma");
const PYTHON = process.env.NOJIN_HYDROMA_PYTHON || resolve(ENGINE_DIR, ".venv/Scripts/python.exe");
const DEFAULT_TIMEOUT_MS = Number(process.env.NOJIN_HYDROMA_EXEC_TIMEOUT_MS ?? 30000);
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;

// ---- bounded in-process concurrency (SEC-04) --------------------------------
let activeExecutions = 0;
export const executionCapacity = () => Math.max(1, Number(process.env.NOJIN_HYDROMA_MAX_CONCURRENT ?? 4));
export const activeExecutionCount = () => activeExecutions;
function tryAcquire() {
  if (activeExecutions >= executionCapacity()) return false;
  activeExecutions += 1;
  return true;
}
function release() {
  activeExecutions = Math.max(0, activeExecutions - 1);
}

// Minimal environment: no inherited secrets. Keep only what the Python runtime
// needs to start on the host platform.
function defaultEnv() {
  const env = { PATH: process.env.PATH ?? "", PYTHONIOENCODING: "utf-8" };
  for (const key of ["SystemRoot", "windir", "TEMP", "TMP", "PATHEXT"]) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return env;
}

/**
 * Execute a model in the local Python worker.
 * @returns {Promise<object>} parsed worker output on success, or
 *   { ok:false, code, message, details? } on failure. New code `capacity_exhausted`
 *   is returned (fail-fast) when no execution slot is free.
 */
export async function executeModel({
  modelId,
  modelVersion,
  input,
  runId,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  python = PYTHON,
  args = ["-m", "hydroma.exec_worker"],
  env = defaultEnv(),
  maxOutputBytes = MAX_OUTPUT_BYTES,
  spawnFn = spawn,
} = {}) {
  if (!tryAcquire()) {
    return { ok: false, code: "capacity_exhausted", message: "engine execution capacity exhausted" };
  }
  try {
    return await runProcess({ modelId, modelVersion, input, runId, timeoutMs, python, args, env, maxOutputBytes, spawnFn });
  } finally {
    release(); // released on every termination path (success, error, timeout, spawn failure)
  }
}

async function runProcess({ modelId, modelVersion, input, runId, timeoutMs, python, args, env, maxOutputBytes, spawnFn }) {
  let child;
  try {
    child = spawnFn(python, args, { cwd: ENGINE_DIR, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  } catch (error) {
    return { ok: false, code: "engine_unavailable", message: "engine execution failed" };
  }

  let stdout = "";
  let stderr = "";
  let outLen = 0;
  let errLen = 0;
  let truncated = false;
  let timedOut = false;
  let spawnError = null;

  const capture = (chunk, isOut) => {
    const len = isOut ? outLen : errLen;
    if (len < maxOutputBytes) {
      const text = chunk.toString("utf8");
      if (isOut) { stdout += text; outLen += chunk.length; } else { stderr += text; errLen += chunk.length; }
    } else {
      truncated = true;
    }
  };
  child.stdout.on("data", (c) => capture(c, true));
  child.stderr.on("data", (c) => capture(c, false));
  child.stdin.on("error", () => {}); // ignore EPIPE if the worker exits early
  child.stdin.write(JSON.stringify({ model_id: modelId, model_version: modelVersion, input, run_id: runId }));
  child.stdin.end();

  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL"); // force-terminate the child (Windows: TerminateProcess; tree not killed — documented)
  }, timeoutMs);

  const outcome = await new Promise((resolvePromise) => {
    let settled = false;
    const done = (value) => { if (!settled) { settled = true; resolvePromise(value); } };
    child.on("error", (error) => { spawnError = error; done({ spawnError: true }); });
    child.on("close", (code, signal) => done({ code, signal }));
  });
  clearTimeout(timer);

  if (spawnError) return { ok: false, code: "engine_unavailable", message: "engine execution failed" };
  if (timedOut) return { ok: false, code: "timeout", message: "engine execution timed out" };
  if (truncated) return { ok: false, code: "engine_error", message: "engine output exceeded the allowed size" };
  if (outcome.code !== 0) {
    try {
      const parsed = JSON.parse(stdout || "{}");
      return { ok: false, code: parsed.error?.code ?? "engine_error", message: parsed.error?.message ?? "engine error", details: parsed.error?.details };
    } catch {
      return { ok: false, code: "engine_error", message: "engine returned invalid output" };
    }
  }
  try {
    return JSON.parse(stdout);
  } catch {
    return { ok: false, code: "invalid_output", message: "engine output was not JSON" };
  }
}