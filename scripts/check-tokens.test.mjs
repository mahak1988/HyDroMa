// Tests for the design-token guard. Run: node --test scripts/check-tokens.test.mjs
import assert from "node:assert/strict";
import test from "node:test";
import { legacyViolations, styleViolations } from "./check-tokens.mjs";

const legacyA = ["#0B", "5563"].join("");
const legacyB = ["#D9", "682B"].join("");

test("fails a deliberate fixture with a forbidden legacy colour", () => {
  const findings = legacyViolations(
    "apps/platform/src/fixture.css",
    `.card { color: ${legacyA}; }\n.badge { border-color: ${legacyB}; }`,
  );
  assert.equal(findings.length, 2);
  assert.match(findings[0], /legacy palette colour/u);
});

test("passes the documented legacy brand locations", () => {
  assert.deepEqual(
    legacyViolations("packages/design-system/src/brand/tokens.css", `--brand-primary: ${legacyA};`),
    [],
  );
  assert.deepEqual(
    legacyViolations("apps/brand/public/identity/option-01.svg", 'fill="#FBF7F0"'),
    [],
  );
});

test("does not flag canonical Aubergine/Terracotta/Champagne tokens", () => {
  assert.deepEqual(
    legacyViolations(
      "apps/platform/src/styles.css",
      "--brand-primary: #5a3d50; --brand-accent: #9c4f3b;",
    ),
    [],
  );
});

test("flags raw Tailwind palette colours and hex class values", () => {
  assert.equal(styleViolations("apps/platform/src/x.tsx", 'className="bg-red-500"').length, 1);
  assert.equal(styleViolations("apps/platform/src/x.tsx", 'className="bg-[#ff0000]"').length, 1);
});

test("allows CSS variables and map rendering values", () => {
  assert.deepEqual(styleViolations("apps/platform/src/x.tsx", 'style={{ color: "var(--fg)" }}'), []);
  assert.deepEqual(styleViolations("apps/platform/src/map.tsx", '"circle-stroke-color": "#ffffff"'), []);
});