# Phase 3.64 — Rewards, Challenges & EcoCoin Foundation Report

## 1. Implemented capabilities

A functional, integrated **Rewards & Challenges** foundation was implemented end-to-end
(UI → api-client → API → SQLite) on top of the existing generic resources architecture
(RBAC + per-organization tenancy + audit + i18n). No new app, package, engine, service,
dependency or infrastructure was introduced.

Implemented and exercised:

- **EcoCoin** — an internal, **non-tradable** participation/reward accounting unit
  (no crypto, no blockchain, no transfer, no redemption, no monetary value).
- **Reward rules** — configurable EcoCoin amount + per-user issuance limit + status;
  inert until a challenge references them (configuration, not an economic decision).
- **Immutable reward ledger** — append-only, idempotent, with compensating (debit)
  corrections; balances are always reconstructed from the ledger, never trusted from
  the client.
- **User reward balance / summary / history** — per-user balance, aggregate summary
  (credits/debits/by-source) and the org ledger.
- **Reconciliation** — owner/admin read-only recompute of every member's balance with
  anomaly (negative-balance) detection.
- **Challenges catalogue + detail** — code/title/description/eligibility/completion
  criteria/verification method/reward rule/window/max participants.
- **Challenge lifecycle** — server-owned state machine `draft → published → closed →
  archived` (direct status writes rejected).
- **Challenge participation** — join a published challenge with duplicate-participation
  protection, capacity limit and start/end window enforcement.
- **Participation verification foundation** — explicit owner/admin attestation; a reward
  is issued **only** on verification, idempotently, within the rule's per-user limit.
- **Administrative management** — reward-rule CRUD, challenge CRUD + transitions,
  EcoCoin adjustments and reconciliation, all backend-authorized.
- **Navigation & integration** — canonical module routes `/platform/ecocoin` (M10) and
  `/platform/challenges` (M11) wired to real modules; capability registry updated to
  `IMPLEMENTED_WITH_LIMITATIONS` with the real endpoint list.

Route ids: `ecocoin`, `challenges` (workspace `/platform`).

## 2. Architecture

The module reuses the existing service boundaries and does **not** create a parallel
subsystem:

- **Persistence**: existing `services/api` SQLite (`node:sqlite`). New tables only:
  `reward_rules`, `challenges`, `challenge_participations`, `eco_coin_ledger`.
- **API**: new routes on the existing `createApp()` router, inheriting the existing
  session auth, `orgFrom()` tenancy scope, `requireWrite()` RBAC and `audit()` helpers.
- **Client**: `packages/api-client` gained `rewards`, `challenges` and `ecocoin`
  namespaces (typed); no component calls `fetch` directly.
- **UI**: `apps/platform/src/sections/rewards/{RewardsModule,ChallengesModule}.tsx`,
  using the shared hooks (`services/hooks.ts`), `ApiBoundary`/`ApiEmpty` states and the
  design-token/table classes; full fa/en/ar i18n via the local `t()` helper.

## 3. API & persistence

EcoCoin / rewards:

- `POST /v1/ecocoin/adjustments` — owner/admin only; compensating credit/debit with a
  server-generated unique `reference` (idempotent).
- `GET /v1/ecocoin/summary` — caller's own balance, totalCredits, totalDebits, bySource.
- `GET /v1/ecocoin/balance?userId=` — own balance, or another member's for write roles.
- `GET /v1/ecocoin/ledger?organizationId=` — org ledger (write role), append-only.
- `GET /v1/ecocoin/reconcile` — owner/admin; recompute balances + anomalies.
- `GET/POST /v1/rewards/rules`, `PATCH /v1/rewards/rules/:id` — rule config (write role;
  unique code per org).

Challenges:

- `GET/POST /v1/challenges`, `GET/PATCH /v1/challenges/:id` (status is workflow-owned).
- `POST /v1/challenges/:id/transition` — state machine.
- `GET /v1/challenges/:id/participations`.
- `POST /v1/challenges/:id/participate` — duplicate/capacity/window enforced.
- `POST /v1/challenges/:id/participations/:pid/verify` — owner/admin; issues reward once.

Persistence is the existing org-scoped SQLite; **no migration framework** is added
(`CREATE TABLE IF NOT EXISTS` in the schema bootstrap).

## 4. Ledger design

- **Immutable / append-only**: rows are only INSERTed. There is no update/delete path
  over the API; corrections are opposite **compensating** entries (`entry_type = debit`).
- **Idempotency / duplicate prevention**: `UNIQUE (org_id, reference)` on
  `eco_coin_ledger`; a repeated issuance returns the original entry with
  `duplicate: true` and does not double-credit.
- **Provenance**: every entry carries `source` (`challenge_reward`, `admin_adjustment`),
  `reason`, `reference`, and optional `challenge_id` / `participation_id` /
  `reward_rule_id`, plus `created_at`.
- **Ownership**: `org_id` + `user_id` on every row; all reads filtered by tenancy.
- **Balance integrity**: balance = `SUM(credit) − SUM(debit)`; never stored on the
  client, never accepted from the frontend.
- **Reconciliation**: `GET /v1/ecocoin/reconcile` recomputes and flags negative balances.
- **Backend-enforced permissions**: only owner/admin may post adjustments or reconcile;
  the ledger is read-only to write roles; arbitrary frontend reward creation is
  impossible (no client-supplied amount reaches the ledger except via validated,
  authorized endpoints).
- **Auditability**: every mutation writes an `audit` row (`ecocoin.credit/debit`,
  `ecocoin.reconcile`, `rewardRule.*`, `challenge.*`).

## 5. Challenge design

- Fields: code, title, description, category/status, eligibility, completion criteria,
  verification method, reward rule association, start/end window, max participants.
- **Lifecycle**: `draft → published → closed → archived`, advanced only via the
  transition endpoint (direct status writes → 409 `status_is_workflow_owned`).
- **Participation**: `joined` → `verified` (→ reward). Duplicate participation blocked
  by `UNIQUE (org_id, challenge_id, user_id)` and an explicit pre-check.
- **Verification**: explicit owner/admin attestation; **no EcoCoin is issued for
  unverified activity**. Reward is idempotent and bounded by the rule's per-user
  issuance limit (over-limit verification still marks the participation verified but
  withholds the reward: `limitReached: true`).
- **Administration & audit**: full CRUD + transitions + verify, all audited.

## 6. Security

- **RBAC**: write role (owner/admin/manager) for create/update/rules; owner/admin for
  adjustments, reconcile and verification; viewer → 403.
- **Tenancy**: every query scoped by the caller's `org_id`; cross-org access → 404.
- **API validation**: integer amounts/limits, code/title length, date windows,
  reward-rule existence, enum statuses; invalid input → 422.
- **Ledger integrity**: idempotent, append-only, compensating corrections.
- **Idempotency & duplicate prevention**: unique reference / unique participation.
- **No secrets, no external calls, no blockchain, no financial/legal commitment.**

## 7. Tests & execution evidence

Full `pnpm run verify` executed to completion, **exit 0**:

- typecheck: clean · lint: clean
- check:boundaries: **560 files / 21 units OK**
- check:arch: 5 files OK · test:arch: **6 passed**
- check:tokens: **215 files / 10 targets OK**
- check:apps: **2 apps OK** (five-way manifest checks pass)
- **vitest: 75 files / 530 tests passed**
- **test:api: 35 tests passed** (includes the reward/challenge/EcoCoin suite)
- build:all: platform + brand **OK**
- check:bundle: **868.88 KB / 900 KB OK**

Reward/challenge coverage includes:

- API (`services/api/tests/api.test.mjs`): EcoCoin owner/admin adjustment idempotency,
  append-only (no update/delete route), tenancy isolation, member-forbidden; reward-rule
  CRUD + code uniqueness + RBAC + tenancy; challenge lifecycle state machine, duplicate
  participation refusal, member-cannot-verify, idempotent single reward issuance,
  per-user issuance-limit withholding, close→archive, cross-org 404.
- Frontend unit (`apps/platform/tests/unit/services/RewardsChallenges.test.tsx`) and the
  existing `ApiState`/`CapabilityBoundary` tests (updated for the now-implemented M10).

### Tests NOT executed (explicit)

- **Playwright e2e** (`test:e2e`) — not run: requires the unified dev host + API + DB
  running, which was not started in this mission.
- **HyDroMA pytest** — not run: engine `.venv` base interpreter missing (pre-existing;
  not repaired per mission constraint).

## 8. Limitations

- EcoCoin is an internal accounting unit only; issuance/transfer/blockchain/exchange/
  redemption are intentionally **not** implemented and require an owner/legal decision.
- `issuance_limit` is enforced **per user** (not a global org pool).
- Verification is a manual owner/admin attestation; no automated/evidence-based verifier.
- HIC is **not** defined, merged, issued or converted here; the architecture stays
  extensible but dormant for HIC/token/blockchain.
- No integration yet with farms/crop cycles/irrigation/MRV/marketplace beyond the shared
  org/tenancy/audit foundation (by design — not prematurely coupled).

## 9. Pending decisions

- Authoritative HIC definition, full name, economic role and its relation to EcoCoin.
- Whether/when any owner-approved redemption or external transfer may be considered.
- Global vs per-user reward pools; automated verification sources.
- Reward-rule governance (who may set amounts/limits) beyond owner/admin.

## 10. Git preservation

- HEAD unchanged: `3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (branch `main`).
- No commit / push / pull / merge / rebase / branch / tag / remote / deploy performed.
- No destructive operation; no source relocated or deleted.
- All pre-existing working-tree changes preserved; a concurrent agent's in-flight
  implementation of this same phase was preserved and not overwritten (this session
  contributed the reward/challenge/EcoCoin **API test coverage**, an api-client
  de-duplication, and full verification, avoiding collisions on shared source files).

## 11. Manifest reconciliation

No new app/package/engine/service was introduced, so `app-manifest.mjs` and
`check:apps` remain valid (verified green: 2 apps, 2 folders). The feature is a section
inside the existing `apps/platform` app; routes are registered in `router.tsx` and
`pages.ts`; the capability registry (`capabilities.ts`) and api-client were extended so
the shared surfaces stay type-complete (typecheck clean).

## 12. Classification

**IMPLEMENTED** — a real, integrated rewards/challenges/EcoCoin foundation
(UI → api-client → API → SQLite) with an immutable idempotent ledger, reconstructible
balances, challenge lifecycle, server-verified participation, RBAC, tenancy, audit,
i18n and automated tests; full `verify` green. Not production-ready; no scientific,
monetary or legal claim is made.