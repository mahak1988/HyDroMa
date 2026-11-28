# Testing Strategy

**Status:** SCAFFOLDED. Defines test layers, boundaries and the distinction between test success,
verification, validation, acceptance and production approval. Existing tests are not modified.

## 1. Test layers (tests/README.md)

| Layer | Proves | Tooling (current/target) |
|---|---|---|
| Unit | pure logic/calculations | vitest (TS), pytest (Python) |
| Integration | service + storage behaviour | vitest/pytest |
| Contract | producer/consumer compatibility, schema versions | schema tests (planned) |
| E2E | critical journeys across apps | Playwright |
| Architecture | dependency/boundary rules | `scripts/check-boundaries.mjs` now; dependency-cruiser later |
| Security | authz bypass, tenancy leaks, injection, secrets | security suite (planned) |
| Performance | latency/throughput budgets | perf suite (planned) |
| Resilience | timeout/retry/idempotency | resilience suite (planned) |
| Scientific | model skill vs reference datasets with metrics | pytest scientific-validation |
| Accessibility | WCAG 2.2 AA | a11y specs (Playwright + axe) |

## 2. Boundaries

- A unit test never substitutes for an integration or scientific test.
- A contract test is required before a contract is VERIFIED.
- A scientific test that cannot state units and tolerance is not valid (seven-part contract).
- E2E runs against real data paths for a slice; blocked capabilities are asserted unavailable.

## 3. Terminology (do not conflate)

- **Test success** — tests pass.
- **Verification** — independent reproduction of a claim.
- **Validation** — meets real requirements/acceptance (scientific: observational evidence).
- **Acceptance** — recorded sign-off for a slice.
- **Production approval** — owner decision.

Passing tests never promotes scientific status (D-HYDROMA-04).

## 4. Current verified baseline (from root README)

- `pnpm run verify` = typecheck + lint + boundaries + tokens + app-manifest + unit + API tests + build
  + bundle budget.
- 309 unit tests, 385 e2e tests, 0 boundary violations (20 units), 0 token violations (8 targets).
- CI: `.github/workflows/verify.yml`.

> Counts are owned by the root README and CI; this document records the strategy, not the counts.

## 5. What not to do

- Do not create an extensive new test suite for unimplemented architecture.
- Do not alter existing tests unnecessarily.
- Do not claim the whole system is tested when only scaffolding was checked.

## Related

- [vertical-slice-strategy.md](./vertical-slice-strategy.md)
- `tests/README.md`, `engines/hydroma/README.md` (scientific contract)