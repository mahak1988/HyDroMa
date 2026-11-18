# ECONOJJIN-ARCHITECTURE-BASELINE
## خط پایه معماری Eco Nojin

**Date:** 2026-11-18
**Status:** PROPOSED baseline. It defines boundaries and rules; it authorises no implementation and
no final technology choice.
**Filename note:** the requested name `ECONOJJIN-…` is kept verbatim so the deliverable matches the
mission brief; the canonical product name elsewhere is **Eco Nojin**.

---

## 0. خلاصه (Persian summary)

- معماری پیشنهادی: **Modular Monolith** با مرزهای ماژولی سخت و امکان استخراج تدریجی سرویس‌ها؛
  نه میکروسرویس زودهنگام.
- پنج برنامه فرانت‌اند، سیزده دامنه کسب‌وکار، دو موتور مستقل (`hydroma`, `ai-workforce`).
- تنها راه ارتباط بین دامنه‌ها: `contracts/`. هیچ سرویسی جدول سرویس دیگر را نمی‌خواند؛ هیچ سرویسی
  به داخل `engines/hydroma` import نمی‌کند.
- مرز علمی: هر خروجی HyDroMA باید واحد، نسخه مدل، منبع داده، provenance، عدم‌قطعیت و روش
  اعتبارسنجی داشته باشد.
- مرز عامل هوشمند: مجوز، ابزار مجاز، محدودیت، مسئولیت و Audit برای هر عامل؛ اتصال به ابزار مالی ممنوع.
- داده و پایگاه داده: **هیچ چیزی نصب نمی‌شود**؛ فقط نقش هر مخزن و گزینه‌ها ثبت شده است.
- هفده تصمیم باز در `ARCHITECTURE-DECISIONS-OPEN.md` ثبت شده و هیچ‌کدام توسط این سند نهایی نشده است.

---

## 1. Architectural style

**Modular monolith first.** One deployable backend process at the start, containing 13 modules with
enforced boundaries, one schema owner per module, and a shared contract layer. Extraction to a
separate service is allowed later only when a module proves a scaling, isolation, or compliance need
(D-ARC-01).

Why not microservices now: the domain boundaries are still being validated against the owner's
product decisions; distributed transactions, service mesh, and 13 CI pipelines would add cost before
any value. Why not a single "app" module: the scientific engine and the financial domain have
incompatible change rates, testing needs and risk profiles; they must stay separable from day one.

Layering:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ apps: portal │ console │ marketplace │ tourism │ scientific-workspace   │  UI only
└───────────────┬─────────────────────────────────────────────────────────┘
                │ contracts/api (typed, versioned)
┌───────────────▼─────────────────────────────────────────────────────────┐
│ services (modular monolith)                                             │
│  api-gateway │ identity │ organization │ user-management │ marketplace  │
│  finance │ inventory │ tourism │ notification │ content │ workflow      │
│  ai-orchestration │ reporting                                          │
│            │ contracts/events          │ adapters                       │
└────────────┼───────────────────────────┼────────────────────────────────┘
             │                           │
┌────────────▼───────────┐   ┌───────────▼──────────────────────────────┐
│ engines/hydroma        │   │ integrations/* (satellite, weather, …)   │
│ 15 scientific domains  │   │ vendor payloads → contracts only         │
└────────────────────────┘   └──────────────────────────────────────────┘
             ▲
┌────────────┴───────────┐
│ engines/ai-workforce   │  governed agents, tool allowlists, audit
└────────────────────────┘
```

Hard dependency rules:

1. `apps` → `packages` + `contracts` only. Never `services` source, never DB.
2. `services` → `contracts`, own module, adapters in `integrations`. Never another module's tables.
3. `engines/hydroma` → `contracts/scientific-models`, `data` (read), `integrations` (via adapters).
   Never `services`.
4. `engines/ai-workforce` → `contracts`, `services` **through API contracts only**, never direct DB.
5. Upstream products (IdP, workflow engine, ERP, CMS) are reached only through an adapter in
   `integrations/`; upstream code never crosses that boundary un-wrapped.

## 2. Applications

| App | Responsibility | Not responsible for |
|---|---|---|
| `portal` | public site, ecosystem and HyDroMA presentation, public discovery, SEO | authenticated workflows, pricing logic |
| `console` | the shared authenticated shell: navigation, org switching, settings, notifications, role-aware surfaces | business rules, permission decisions |
| `marketplace` | catalog, seller storefronts, cart, checkout UX, order tracking | payments, ledger, stock truth |
| `tourism` | property discovery, availability display, reservation flow | rate rules, payment capture |
| `scientific-workspace` | scenario definition, run monitoring, result/provenance/uncertainty inspection, MRV views | any computation, unit conversion authority |

Open: `marketplace` and `tourism` may become `console` modules instead of separate deployables
(D-APP-01). The skeleton supports both; nothing is built either way.

## 3. Services (13 domains)

Boundaries, ownership and prohibitions are defined in `services/README.md`. Architectural intent:

- **Identity ≠ organization ≠ role.** A person's identity (`identity`), their profile and preferences
  (`user-management`), and their membership/role inside a legal entity (`organization`) are three
  different records with three different lifecycles. This separation is what makes multi-country,
  multi-organization operation possible.
- **Finance owns money state; nothing else does.** `marketplace`, `tourism` and `inventory` may *ask*
  for an invoice or a payment intent; they never compute balances.
- **`reporting` is derived, never authoritative.** It may read cross-module read models; it may not
  become a source of truth.
- **`ai-orchestration` is the only path to agents.** No service calls a model provider directly.

Cross-cutting requirements applied to every module:

| Requirement | Rule |
|---|---|
| Tenancy | every record carries `organization_id`; every query filters by it; no cross-tenant join |
| Authorization | role + permission evaluated server-side on every command; client claims are hints |
| Audit | every mutation writes actor, org, before/after, correlation id, timestamp (UTC) |
| Idempotency | commands accept an idempotency key; events are consumed idempotently |
| Time | store UTC; render in the actor's timezone and calendar preference |
| Money | store minor units + ISO currency; never float; conversion rates are versioned records |
| Units | store canonical SI value + original unit + conversion provenance |
| Error shape | one error envelope across all services; no vendor error leakage |
| Localization | all user-facing strings come from `packages/i18n` catalogs |

## 4. HyDroMA boundary (scientific engine)

HyDroMA is a **separate engine**, not a module of the business platform. It owns scientific
computation; it does not own users, orders, or organizations.

Fifteen domains live under `engines/hydroma/` (see its README for the per-domain table):
`water`, `hydrology`, `groundwater`, `soil`, `erosion`, `climate`, `meteorology`, `agriculture`,
`vegetation`, `remote-sensing`, `gis`, `simulation`, `scenarios`, `mrv`, `model-registry`.

Mandatory scientific contract for any domain, before implementation is accepted:

| Field | Meaning |
|---|---|
| Inputs / outputs | variables, units, spatial & temporal resolution, coverage requirements |
| Data sources | provider, licence, version/date, retention |
| Model identity | name, version, calibration dataset, upstream origin (repo + commit) |
| Provenance | run lineage: inputs → parameters → code version → outputs |
| Uncertainty | method and explicit statement of what is *not* quantified |
| Validation | protocol, reference dataset, skill metrics, known failure modes |

Rule: model artefacts in `upstream-registry/` are **evidence**. Copying model code into executable
HyDroMA domains requires a review record and an owner decision (D-17).

Compute placement: heavy gridded and simulation work runs server-side/queued; the workspace may
pre-compute light aggregates in the browser but must never be the authority for a published number.

## 5. AI workforce boundary

Six components: `analyst`, `administrator`, `manager`, `employees`, `model-gateway`,
`agent-registry` (details in `engines/ai-workforce/README.md`).

Every agent definition must carry: purpose, allowed tools, permission scope (org/records), readable
data classification, action/spend limits, escalation path, and a complete audit trail of inputs,
tool calls and outputs.

Hard prohibitions in this phase: no financial execution tool, no wallet/token/payment access, no
autonomous approval of its own proposal, no unlogged model call. `model-gateway` is the only egress
and must redact secrets and account for token cost.

Runtime shape (proposal, not provisioned): durable queue + worker pool, at-least-once delivery,
idempotent steps, human-in-the-loop gates, and run records persisted by `services/ai-orchestration`.

## 6. Data architecture

### 6.1 Separation by kind

| Kind | Characteristic | Home |
|---|---|---|
| Operational | transactional truth, per tenant | `databases/relational` (PostgreSQL) |
| Scientific | versioned model inputs/outputs with provenance | `data/*` + `databases/*` per D-DB-02 |
| Analytical | derived read models, aggregates | `databases/analytical` |
| Reference | boundaries, lookups, standards | `data/reference` |
| Raw evidence | untouched downloads with checksums | `data/raw` + `data/metadata` |
| Fixtures | synthetic, clearly labelled | `data/fixtures` |

Real, sample, synthetic and simulated data are never mixed in one path. Every dataset carries a
licence and a checksum record.

### 6.2 Store roles (options, not decisions)

| Role | Candidate | Note |
|---|---|---|
| System of record | PostgreSQL | one schema per module |
| Spatial | PostGIS | CRS declared per layer |
| Time series | TimescaleDB **or** ClickHouse | D-DB-01 |
| Analytical | DuckDB / ClickHouse | D-DB-01 |
| Object storage | S3-compatible (SeaweedFS is an evaluated candidate) | large rasters/scenes |
| Search | OpenSearch (candidate) | catalog/search only |
| Cache/queue | Redis-compatible (candidate) | not for durability of record |

Nothing is installed. No migration or seed is created in this phase.

## 7. Frontend and identity standard

- **Token-first design system.** Colour, typography, spacing, radius and motion are tokens; no
  literal values in components. Final identity is not approved (COLOR-01, TYPO-01..06).
- **i18n/RTL from the first screen.** Root `dir` is set from locale; logical CSS properties; mirrored
  icons; bidi-safe tables/charts; Persian typography tested, not assumed.
- **Calendars/timezones:** UTC storage, actor-local rendering, Jalali/Hijri/Gregorian display support.
- **No hardcoded strings** in apps; catalogs live in `packages/i18n`.
- **Backend-independent UI:** every app must render a truthful empty/loading/error state without a
  backend; mock data is a labelled fixture, never a substitute for real data.
- **Browser vs server computation:** filtering, formatting, layout and light aggregation in the
  browser; scientific computation and anything authoritative on the server.

## 8. Verification strategy

Seven layers in `tests/` (unit, integration, contract, e2e, security, performance,
scientific-validation). Minimal gates before any feature is called done:

1. typecheck + lint clean;
2. contract tests for every changed API/event;
3. a security test for the tenancy and permission path of the change;
4. for scientific output: units, tolerance, provenance and validation statement present;
5. a reproducible evidence link in the task record (command + output), not a claim.

## 9. Current constraints (as of this baseline)

- No backend, database, container, migration, operational API, payment, wallet or token is created.
- No third-party repository is merged or rebranded.
- Four frontend starters were evaluated in isolation; their code remains in `upstream-registry/`.
- Three of them cannot produce a pristine production build with their pinned Next 16.1–16.2
  (upstream prerender invariant); this constrains any future host framework choice.
- `D:\Nojin` is not a Git repository yet (D-GIT-01).

## 10. Open decisions

Seventeen decisions are tracked in `ARCHITECTURE-DECISIONS-OPEN.md`, grouped as:
application shape (D-APP-01, D-APP-02), architecture (D-ARC-01, D-ARC-02), framework and identity
(D-FE-01, D-04), data (D-DB-01, D-DB-02), quality/repo (D-QA-01, D-GIT-01), integrations
(D-INT-01, D-INT-02), scientific (D-17), documentation (D-DOC-01), product scope (D-PROD-01,
D-PROD-02), and agent policy (D-AI-01).

None of them is decided here. This baseline is the *subject* of those decisions, not their answer.
