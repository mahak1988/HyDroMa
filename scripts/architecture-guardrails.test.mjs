// Tests for architecture guardrails (Phase 3.60). Run: node --test scripts/architecture-guardrails.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkArchitecture } from "./architecture-guardrails.mjs";

async function fixture(files) {
  const root = await mkdtemp(path.join(tmpdir(), "arch-guard-"));
  for (const [rel, body] of Object.entries(files)) {
    const full = path.join(root, rel);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, body);
  }
  return root;
}

test("passes on a clean tree (engine + backend independent)", async () => {
  const root = await fixture({
    "engines/hydroma/src/engine.mjs": "import { helper } from './helper.mjs';\nexport const x = helper();",
    "engines/hydroma/src/helper.mjs": "export const helper = () => 1;",
    "services/api/src/server.mjs": "import { openDatabase } from './db.mjs';\nexport const db = openDatabase;",
  });
  const { scanned, violations } = await checkArchitecture(root);
  assert.equal(violations.length, 0, JSON.stringify(violations));
  assert.ok(scanned >= 3);
  await rm(root, { recursive: true, force: true });
});

test("detects HyDroMA importing a frontend package", async () => {
  const root = await fixture({ "engines/hydroma/src/bad.mjs": "import { Button } from '@eco-nojin/ui';" });
  const { violations } = await checkArchitecture(root);
  assert.equal(violations.length, 1);
  assert.match(violations[0].why, /frontend package/u);
  await rm(root, { recursive: true, force: true });
});

test("detects HyDroMA importing an app and escaping its tree", async () => {
  const root = await fixture({
    "engines/hydroma/src/bad.mjs": "import 'apps/platform/src/main.tsx'; import '../../outside.mjs';",
  });
  const { violations } = await checkArchitecture(root);
  assert.ok(violations.some((v) => /application/u.test(v.why)));
  assert.ok(violations.some((v) => /escapes/u.test(v.why)));
  await rm(root, { recursive: true, force: true });
});

test("detects backend importing a frontend package or engine", async () => {
  const root = await fixture({
    "services/api/src/bad.mjs": "import '@eco-nojin/api-client'; import 'engines/hydroma/x.mjs';",
  });
  const { violations } = await checkArchitecture(root);
  assert.ok(violations.some((v) => /frontend package/u.test(v.why)));
  assert.ok(violations.some((v) => /scientific engine/u.test(v.why)));
  await rm(root, { recursive: true, force: true });
});

test("detects a nested service importing an engine (services/* scope)", async () => {
  const root = await fixture({
    "services/edi/src/bad.mjs": "import 'engines/hydroma/api.py';",
    "services/api/src/ok.mjs": "import './db.mjs';",
    "services/api/src/db.mjs": "export const db = {};",
  });
  const { violations } = await checkArchitecture(root);
  assert.ok(violations.some((v) => /scientific engine/u.test(v.why)));
  assert.ok(violations.every((v) => v.file.startsWith("services/edi/")));
  await rm(root, { recursive: true, force: true });
});

test("ignores test directories", async () => {
  const root = await fixture({ "engines/hydroma/__tests__/x.mjs": "import '@eco-nojin/ui';" });
  const { violations } = await checkArchitecture(root);
  assert.equal(violations.length, 0);
  await rm(root, { recursive: true, force: true });
});