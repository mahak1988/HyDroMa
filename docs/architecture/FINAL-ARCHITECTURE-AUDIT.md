# FINAL-ARCHITECTURE-AUDIT
## ممیزی نهایی معماری ریشه Eco Nojin

**Date:** 2026-11-18
**Auditor:** resident agent (read-only audit + isolated experiments)
**Scope:** `D:\Nojin` root architecture, the four extracted frontends, and the readiness to start
real development.
**Mode:** no file was deleted, moved or rewritten; no rebrand, no merge, no backend, no database,
no service, no migration, no owner decision.

---

## 0. خلاصه اجرایی (Persian summary)

- ساختار ریشه **از نظر مرزبندی قابل تأیید است** (PASS با ۶ ایراد ساختاری قابل رفع).
- `services` با `engines` اشتباه گرفته نشده‌اند؛ `engines/hydroma` مستقل است و مسیر داده/قرارداد
  قابل فهم است.
- بزرگ‌ترین ابهام: **`app/` و `apps/`**. با بررسی واقعی کد روشن شد `app/` یک پورتال **بدون وابستگی،
  RTL-first (`lang="fa" dir="rtl"`)، با ۶۹ تست موفق** و اعتبارسنجی علمی water-balance است — نه یک دموی
  دورریختنی. پیشنهاد: حفظ و تبدیل آن به بذر `apps/portal` در یک مرحله رسمی، نه حذف.
- ۱۷ تصمیم باز به ماتریس تصمیم با گروه A/B/C/D تبدیل شد؛ هیچ‌کدام Approved نشد.
- چهار فرانت‌اند با شواهد واقعی Auditing شدند: **هیچ‌کدام RTL آماده نیست** (۰ توکن logical در هر چهار).
- آزمایش عملی RTL روی Nellavio و Velora انجام و با مهاجرت مکانیکی به Logical Properties اندازه‌گیری شد:
  Nellavio **۳۲۴ توکن در ۱۰۶ فایل**، Velora **۱۶۶ توکن در ۱۰۴ فایل**، سپس **بدون سرریز افقی و بدون خطای کنسول**.
- پورتال فعلی پروژه (`app/`) از هر چهار گزینه خارجی برای نقش «پورتال» آماده‌تر است.
- Git: `D:\Nojin` همچنان Repository نیست؛ فقط پیشنهاد Baseline ارائه شده است.

---

## 1. Verified state snapshot

| Item | Observed value | Evidence |
|---|---|---|
| Git repository | **No** — `fatal: not a git repository` | `git -C D:\Nojin rev-parse --is-inside-work-tree` |
| Disk (D:) | 363.6 GB free, 102.2 GB used | `Get-PSDrive D` |
| Protected projects | `D:\HyDroMA` 53 items, `D:\eco_nojin` 122 items, newest mtime 2026-11-17 03:30 (unchanged) | directory listing |
| Archives | `batch-16-frontend-foundations`: 4 ZIPs, 13,112,211 bytes total | archive listing |
| Registry | 4 extracted frontends + earlier 54 projects | `upstream-registry/` |
| Scaffold script | `scripts/scaffold-architecture.mjs`, 30,256 bytes, idempotent (`created: 0, skipped: 30` on re-run) | run output |
| Root docs | 8 deliverables from the previous mission present | file listing |
| `FRONTEND-UPSTREAM-CODE-ANALYSIS.md` | **Exists**, 24,545 bytes, mtime 2026-11-18 07:33 — **not authored by this mission** | file listing |
| `firebase-debug.log` | 239 bytes (was 0); unrelated Firebase tooling noise | file listing |

New files from the previous mission that this audit treats as input (unmodified):
`ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`, `ROOT-STRUCTURE-MANIFEST.md`,
`README.md`, `AGENTS.md`, `FRONTEND-FOUNDATIONS-REPORT.md`, `FRONTEND-COMPARISON-MATRIX.md`,
`UPSTREAM-FRONTEND-MANIFEST.json`, `.gitignore`, `scripts/scaffold-architecture.mjs`, and the 30
skeleton READMEs.

## 2. Requirement verdict

| Audit question | Verdict | Basis |
|---|---|---|
| Are application boundaries clear? | **PASS** | `apps/README.md` defines audience/owns/not-owns per app; no cross-app imports exist because no app code exists |
| Are services confused with scientific engines? | **PASS** | dependency rules in `ECONOJJIN-ARCHITECTURE-BASELINE.md` §1; no engine↔service imports anywhere |
| Do shared packages duplicate responsibility? | **PARTIAL** | `contracts/schemas` vs `packages/validation` and two "configuration" homes — see F-02, F-03 |
| Are data path and contracts understandable? | **PASS** | `data/README.md` zone table + `contracts/README.md`; both name the same 4 contract kinds |
| Is the structure fit for independent app development? | **PARTIAL** | yes for boundaries; no workspace tooling yet (no root package.json) — expected at this stage |
| Are there more folders than needed / overlapping? | **PARTIAL** | 13 findings below, 5 of them structural (2 medium, 3 low) |

## 3. Structural findings

Severity: **H** = must decide before implementation · **M** = fix during first implementation
stage · **L** = cosmetic/clarification.

| ID | Finding | Sev | Evidence | Recommendation |
|---|---|---|---|---|
| F-01 | `app/` (working RTL portal, 69 passing tests) vs `apps/portal` (empty boundary) — two meanings of "portal" | **H** | `app/src/index.html` has `lang="fa" dir="rtl"`; `node --test` = 69 pass | Keep `app/` as the portal seed; migrate to `apps/portal` under an explicit decision (D-ARC-02). Do not delete, do not leave ambiguous. |
| F-02 | `packages/configuration` and `infrastructure/configuration` describe different things but share a name | M | `packages/README.md` ("build/lint/ts presets") vs `infrastructure/README.md` ("typed config loading") | Rename to `packages/tooling-config` and `infrastructure/runtime-config` when first implemented |
| F-03 | `contracts/schemas` and `packages/validation` can both become the schema source | M | both READMEs claim "single source" | Decide one direction: schemas live in `contracts/schemas`, `packages/validation` only wraps them (generated, not authored) |
| F-04 | Scientific data can plausibly live in `data/scientific-models`, `engines/hydroma/model-registry`, or `databases/*` | M | three READMEs touch "model" ownership | Adopt the rule already implied by D-DB-02: artefacts in object storage, metadata + versions in `model-registry`, no model code in `data/` |
| F-05 | `services/api-gateway` is listed among domain services but owns no data | L | `services/README.md` row 1 | Treat it as an edge/BFF component, not a domain; keep the folder for deployment clarity |
| F-06 | `workflows/` (definitions) vs `services/workflow` (runtime) — same word | L | both READMEs | Keep, but state the rule in both files: definitions are data, runtime is code |
| F-07 | `apps/marketplace` and `apps/tourism` exist while their existence is undecided (D-APP-01) | L | `apps/README.md` | Already flagged; add "NEEDS DECISION" banner when the folder gains any file |
| F-08 | 11 folders are empty (tests/*, infrastructure/*, workflows/*, integrations/*, contracts/*, databases/*, data/*, packages/*, engine domains, .github) | M | directory listing | Structural "theatre" risk. Mitigation: every empty folder is owned by a named decision (see §5) and stays empty until that decision closes |
| F-09 | `docs/architecture/README.md` is an index that does not list this mission's six new documents | L | file content | Add a one-line index entry when the owner accepts these documents (deliberately not edited here, per the "only these outputs" rule) |
| F-10 | `engines/hydroma/<domain>/` exists without per-domain contract files | L | `engines/hydroma/README.md` table | Intended: the seven-part scientific contract is a gate, not a document set. Stated explicitly in that README |
| F-11 | Scientific validation code exists in `app/tests/water-balance-validation.test.mjs`, outside `engines/hydroma` | M | test run (6 scientific tests pass) | When HyDroMA gets a real home, this test is the **seed** of `tests/scientific-validation`; record it before moving |
| F-12 | Root contains unrelated artefacts (`firebase-debug.log`, stray analysis file) | L | listing | Leave in place; exclude from the future Git baseline via `.gitignore` review |
| F-13 | No workspace tooling (root `package.json`, task runner, TS project references) | M | no root package.json | Add in roadmap stage R3, not before (D-GIT-01 first) |

## 4. Boundary verification (apps / services / engines)

| Boundary rule | Verified | Note |
|---|---|---|
| Apps speak only through `contracts/api` | PASS (by design) | no app code exists; the rule is stated once, in `apps/README.md` + baseline §1 |
| Services own their data; no cross-service table reads | PASS (by design) | `services/README.md` "Cross-cutting rules" |
| `engines/hydroma` imports nothing from `services` | PASS | stated in `engines/README.md` and baseline §1.3 |
| Business services do not import engine internals | PASS | same |
| Agents reach services only via contracts | PASS | `engines/ai-workforce/README.md` |
| Data zones unmixed | PASS (policy) | `data/README.md` + `data/.gitignore` block payloads |
| Token-only styling | PARTIAL | rule stated in `AGENTS.md`; `app/` follows it; no product UI exists yet |

**No folder mixes a service with an engine.** The most common failure mode in this kind of tree
(putting a "model service" under `services/`) did not occur.

## 5. Product-domain ownership map

Ten requested domains, mapped to the actual tree. "Placement" is where the code will live when the
blocking decision closes.

| Domain | Owner (module) | Depends on | Core responsibilities | Out of scope | Placement | Blocking decision |
|---|---|---|---|---|---|---|
| Public Portal | `apps/portal` (seed: `app/`) | content, i18n, api (public reads) | marketing, ecosystem & HyDroMA presentation, SEO, public discovery, waitlist | auth, checkout, science computation | app (Next or static) | D-ARC-02, D-FE-01 |
| User Console | `apps/console` | identity, organization, user-management, notification | authenticated shell, org switching, settings, role-aware nav, audit-visible activity | business rules, permission decisions | app | D-APP-02, D-04 |
| Marketplace | `apps/marketplace` + `services/marketplace` | inventory, finance, content | listings, storefront, cart, order UX | payments, ledger, stock truth | app+module | D-APP-01, D-INT-02 |
| Tourism | `apps/tourism` + `services/tourism` | finance, notification, inventory (optional) | properties, availability UX, reservations | rate math, payment capture | app+module | D-APP-01, D-INT-02 |
| HyDroMA Workspace | `apps/scientific-workspace` | hydroma contracts, ai-orchestration | scenario editor, run monitor, provenance/uncertainty display, MRV views | any computation | app | D-FE-01, D-17 |
| AI Workforce | `engines/ai-workforce` + `services/ai-orchestration` | model-gateway, workflow | agent definitions, tool policy, run audit, approval gates | finance tools, self-approval | engine + module | D-AI-01 |
| Finance & Accounting | `services/finance` | marketplace, tourism, reporting | invoices, payments, payouts, multi-currency, tax, ledger | wallet/token features | module | D-INT-02 |
| Inventory & Supply Chain | `services/inventory` | finance (valuation) | stock ledger, lots, units/conversions, reservations | pricing, invoicing | module | D-APP-01 |
| Organization & Identity | `services/identity`, `services/organization`, `services/user-management` | — | credentials/sessions vs legal entity/membership/role vs profile/preferences | business data | module | D-04 |
| Administration | `apps/console` (admin surfaces) + `services/*` admin APIs | identity, organization, audit | user/org administration, policy configuration, audit review | owning domain data | app + module | D-APP-02 |

Key architectural property preserved: **identity ≠ organization ≠ role** (three separate records,
three lifecycles). This is what makes multi-country/multi-org operation possible and it is already
encoded in `services/README.md`.

## 6. `app/` vs `apps/` — evidence and recommendation

### What `app/` actually is

| Property | Value |
|---|---|
| Package | `eco-nojin-web@0.1.0`, `"type": "module"`, **zero runtime dependencies** |
| Build | `build.mjs` (copies design-system CSS/fonts/logos from `../brand` at build time) |
| Serve | `serve.mjs` (zero-dependency static server, port 4173) |
| Source | `src/index.html` (41 KB), `src/styles/home.css`, `src/js/{main,i18n,theme,visuals,interactions}.js` |
| Language/RTL | `<html lang="fa" dir="rtl" data-theme="A">` — **RTL-first, Persian default** |
| Tests | 6 suites, **69 tests, all passing** (`node --test`, 0.59 s) including water-balance validation with units and provenance |
| Framework lock-in | none |
| Assets | screenshots + `dist/` committed; design tokens come from `brand/` (never edited) |

### Decision analysis

| Question | Answer |
|---|---|
| Is it active? | Yes — it builds, serves and passes its own tests today |
| Does anything depend on it? | No code imports it; several documents reference it (`README.md`, `ROOT-STRUCTURE-MANIFEST.md`, decision register) |
| Must it move to `apps/`? | Not now. It can be the `apps/portal` seed when D-FE-01/D-ARC-02 close |
| Is keeping it risky? | Only the naming ambiguity (F-01). Mitigation is documentation, not movement |

**Recommendation (advisory, owner decides):** keep `app/` in place, mark it explicitly as
"portal seed (pre-framework, RTL-first)" in the decision record, and move/rename it **once** when
D-FE-01 closes. Deleting it would destroy the only RTL-first, dependency-free, test-covered
frontend asset in the repository.

## 7. `FRONTEND-UPSTREAM-CODE-ANALYSIS.md`

- Exists (24,545 bytes, 2026-11-18 07:33). It analyses the 54 earlier repositories, not the batch-16
  frontends, and is **not** part of this mission's output.
- Content overlaps with this audit only in naming frontend candidates; it does not contradict the
  batch-16 measurements.
- Status: **present, unverified provenance, left untouched.** Not treated as evidence in this audit.

## 8. Compliance with the mission's prohibitions

| Prohibition | Status |
|---|---|
| Delete/move/rewrite existing files | Not done. New files only (`docs/architecture/*`) |
| Change original archives | Not done (4 ZIPs untouched, SHA256 unchanged) |
| Merge third-party projects | Not done |
| Rebrand | Not done |
| Change remote / push | Not done (no repository exists) |
| Destructive Git operations | Not done (no repository exists) |
| Install Docker | Not done |
| Start operational services | Not done (only local `next dev` on ports 3111/3112 for the RTL experiment, then stopped) |
| Change database/backend | Not done (none exists) |
| Decide for the owner | Not done (17 decisions remain owner-owned) |
| Initialise Git / commit | Not done (D-GIT-01 stays open) |

## 9. What this audit does not prove

- It does not prove runtime performance, security or scalability of any architecture choice —
  nothing is implemented yet.
- The Next.js prerender defect was not traced to a framework-internal root cause. The controlled
  experiments in this mission (same source, one variable at a time: Next 16.2.10 → 16.3.7, Node 26 →
  Node 22 LTS, worker count, `force-dynamic`, `output: "export"`) show the invariant **survives a
  version bump and a Node change**, moves between routes, and disappears only on the export path —
  see [FRONTEND-SELECTION-REPORT](FRONTEND-SELECTION-REPORT.md) §4.2. No claim of "version X is
  broken" is made.
- RTL results are from two apps and a finite page set (5 + 3 pages, 2 viewports), not every component.
- Licence status of bundled images remains unverified for two projects (see selection report §6).

## 10. Experiment footprint (disk)

The RTL and build investigations required isolated copies; they are evidence, not product code:

| Path | Size | Purpose |
|---|---|---|
| `experiments/rtl-proof/` | 2.24 GB | Nellavio + Velora RTL copies (with `node_modules`), fonts, screenshots, capture scripts |
| `experiments/frontend-build-repro/` | 0.98 GB | OrbynAdmin isolated build copy, Node 22 LTS runtime, build logs |
| `upstream-registry/frontend-foundations/` | 4.57 GB | evaluation copies (incl. `node_modules/.next` from the previous mission) |

Free space on `D:` moved from 363.6 GB to 360.6 GB during this mission. Both experiment trees can be
deleted once the owner has reviewed this audit; until then they are the only reproducible evidence of
the RTL and build claims.
