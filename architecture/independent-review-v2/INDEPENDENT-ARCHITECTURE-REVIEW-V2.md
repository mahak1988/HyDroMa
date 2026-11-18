# INDEPENDENT ARCHITECTURE REVIEW V2
## Eco Nojin & HyDroMA — consolidated-v1 (post RC1–RC8 corrections)

**Reviewer:** Independent critical review (READ-ONLY)
**Date:** 2026-11-17
**Reference set:** `D:\Nojin\architecture\consolidated-v1\` (12 files, post-correction)
**Mode:** Read-only. No file was modified. No code was written. No project was run. No decision was finalized.

**Verdict:** `ACCEPTED_WITH_CORRECTIONS`

---

## 1. EXECUTIVE SUMMARY

The consolidated-v1 set **after RC1–RC8 corrections** is **structurally consistent** (all 18 validation tests pass: 5 CSVs parse, 0 duplicate IDs, 0 broken role references, 54 upstream projects all with proposed decisions, 25 unique open-decision IDs, 4-state HyDroMA model present, AI security modules present, financial modules present, sitemap fully mapped). The architecture now has 14 layers, 194 modules, 40 role entries, 227 frontend pages, 21 workflows, and 54 upstream projects — all validated.

However, the review finds **two critical residual gaps** from the previous review that were **not fully resolved** by RC2, plus **several new architectural concerns** introduced by the corrections themselves:

1. **CRITICAL — Master Architecture body still contains stale HyDroMA vocabulary** in §4.5 and §10 despite RC2 claiming to fix §6 and §16. The master document contradicts the corrected HyDroMA doc in two additional sections.
2. **CRITICAL — AI security modules (RC3) are over-granular as separate deployable modules**. Four new modules (AI-INJECTION-GUARD, AI-COMMS, AI-COST, AI-SOD) represent cross-cutting security controls, not independent bounded contexts with distinct APIs. This violates modular monolith principles and inflates module count without runtime justification.
3. **HIGH — Financial idempotency module (ACC-IDEMP) is a cross-cutting concern, not a domain module**. Similar to AI security modules, it lacks independent deployment semantics.
4. **HIGH — Layer dependency graph contains potential cycles** (L3→L10→L5→L11→L3) that are not explicitly mitigated in the architecture rules.
5. **HIGH — RothC remains unprocessed** (correctly documented as `PRESENT_UNPROCESSED` but not in upstream matrix; requires owner decision D-18).
6. **MEDIUM — WPS license unknown, FloPy at dev version** (documented in RC8 but unresolved).
7. **MEDIUM — Module catalog has 4 "unidentified module additions" from Set 2** that were never identity-verified (`HISTORICAL_VERSION_NOT_RECOVERABLE`).

The architecture is **fundamentally sound** — the issues are targeted and fixable. Hence `ACCEPTED_WITH_CORRECTIONS`.

---

## 2. VERSION FIXATION — FILE INVENTORY & SHA256

| File | Size (bytes) | SHA256 (from changelog) | Status |
|---|---|---|---|
| ECO-NOJIN-MASTER-ARCHITECTURE.md | 66,231 | `A9BB844E…` | Post-correction |
| ECO-NOJIN-MODULE-CATALOG.csv | 59,457 | `B74B7164…` | Post-correction (+6 modules) |
| ECO-NOJIN-USER-ROLE-MATRIX.csv | 12,271 | `23B55C7C…` | Unchanged |
| ECO-NOJIN-FRONTEND-SITEMAP.csv | 80,764 | `CA1468C3…` | Post-correction (+module_ids) |
| ECO-NOJIN-WORKFLOW-CATALOG.csv | 11,455 | `73E79976…` | Unchanged |
| ECO-NOJIN-DATA-DOMAIN-MODEL.md | 21,513 | `694CDDC3…` | Unchanged |
| HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md | 30,752 | `7AB17190…` | Post-correction (+§6-الف, §6-ب) |
| ECO-NOJIN-UPSTREAM-DECISION-MATRIX.csv | 15,955 | `611B6D48…` | Unchanged |
| ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md | 25,045 | `CA60BC7D…` | Post-correction (+AI annex) |
| ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md | 21,674 | `F6AAB7EB…` | Post-correction (+annex 2) |
| CONSOLIDATION-CHANGELOG.md | 7,332 | `7D5D8703…` | Rewritten |
| CONSOLIDATION-VALIDATION-REPORT.md | 4,331 | `A1F08FD6…` | Rewritten |
| INDEPENDENT-ARCHITECTURE-REVIEW.md | 17,328 | `C8771F58…` | Previous review (unchanged) |

**Module count evolution:** 182 (Set 1, unrecoverable) → 188 (Set 2, +4 unidentified) → 194 (post RC3+RC4: +4 AI security +2 financial).

---

## 3. RC1–RC8 CORRECTION VERIFICATION

### RC1 — HyDroMA 4-State Scientific Model ✅ **VERIFIED COMPLETE**
- **Location:** `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` §6-الف (lines 200–259)
- **Content:** Normative 4-state enum (`UNCALIBRATED`, `CALIBRATED`, `VALIDATED`, `NOT_VALIDATED`) with definitions, entry conditions, evidence requirements, display rules, calibration/validation separation, state transitions, authorization matrix, `ScientificStateChangeLog`, and separation from maturity/release states (`EXPERIMENTAL`, `PROVISIONAL`, `REJECTED`).
- **Integration:** Job contract (§2.2) references the 4-state model. Principle S5 updated.
- **Status:** **Complete and correct.** Resolves previous C1.

### RC2 — Master Integration (§6 role count, §16 vocabulary) ⚠️ **PARTIAL — RESIDUAL STALE VOCABULARY**
- **§6 (line 423):** Updated to "34 domain + 1 system + 2 identity states + 3 capabilities = 40 entries" — **CORRECT**.
- **§16 (line 663):** Vocabulary aligned to consolidated matrix (`ADOPT_CANDIDATE`, `INTEGRATE_CANDIDATE`, `UPSTREAM_ADOPT`, `INTEGRATE`, `DEFER`, `REJECT`, `LEGAL_REVIEW_REQUIRED`, `INSUFFICIENT_EVIDENCE`); old V2 terms (`UPSTREAM_CUSTOMIZE`, `BUILD`) marked removed — **CORRECT**.
- **§4.5 (line 309):** **STILL STATES** "مرز سخت: بدون کالیبراسیون/اعتبارسنجی، نتیجه با برچسب `UNCALIBRATED` یا `EXPERIMENTAL` نمایش داده می‌شود" — **INCORRECT**; should reference 4-state model.
- **§10 (line 546):** **STILL STATES** "نتیجه بدون کالیبراسیون/اعتبارسنجی: `UNCALIBRATED`/`EXPERIMENTAL`" — **INCORRECT**; should reference 4-state model.
- **Impact:** Master document contradicts corrected HyDroMA doc in two sections. A reader of Master alone would use wrong vocabulary.
- **Correction needed:** Update §4.5 and §10 to reference the 4-state model from HyDroMA §6-الف.

### RC3 — AI Security Modules + Security Doc Annex ✅ **APPLIED BUT ARCHITECTURALLY PROBLEMATIC**
- **Modules added (4):** AI-INJECTION-GUARD, AI-COMMS, AI-COST, AI-SOD in L10.
- **Security doc:** Annex added with 12 controls (AI-1 through AI-12).
- **Problem:** These four modules represent **cross-cutting security controls**, not independent bounded contexts. They have no distinct deployment lifecycle, no independent APIs, and no separate data ownership. They are implementation details of AI-POLICY and AI-GATEWAY.
- **Evidence:** Module catalog shows them with same `deployment_unit` (DU-CORE), same `security_zone` (Z2-APP), same `compute_profile` (light/moderate), no unique `key_inputs`/`key_outputs` differentiating them from AI-POLICY.
- **Impact:** Inflates module count (194 vs 190) without architectural justification; violates modular monolith principle that modules = independently deployable units with clear APIs.
- **Recommendation:** Merge into AI-POLICY as internal components; keep security doc annex as control specification.

### RC4 — Financial Modules (ACC-PERIOD, ACC-IDEMP) ✅ **APPLIED BUT ACC-IDEMP IS CROSS-CUTTING**
- **ACC-PERIOD:** Legitimate domain module for financial period management (open/close, reopen with approval). **Valid.**
- **ACC-IDEMP:** Financial idempotency/duplicate prevention. This is a **cross-cutting infrastructure concern** (like transaction outbox), not a finance domain module. It has no independent business capability.
- **Evidence:** Module catalog shows `key_inputs` = "idempotency key", `key_outputs` = "dedup decision" — technical, not business.
- **Recommendation:** Implement as library/infrastructure component (INT-IDEMP or similar), not L9 domain module.

### RC5 — Per-Domain Scientific Contracts ✅ **VERIFIED COMPLETE**
- **Location:** `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` §6-ب (lines 262–320)
- **Domains covered:** Water, Soil, Climate, Agriculture, Remote Sensing, Vegetation — each with inputs, outputs, units (UCUM), validity scope, limitations, provenance, validation method.
- **Status:** **Complete and correct.** Resolves previous S-1.

### RC6 — Sitemap Legend + module_ids Column ✅ **VERIFIED COMPLETE**
- **Legend:** Master Annex 3 defines `L`, `EM`, `ER`, `S`, `UX` codes.
- **module_ids column:** All 227 pages mapped to module(s); 0 unmapped (validation test 13 passes).
- **Status:** **Complete and correct.** Resolves previous X4/X5.

### RC7 — RothC `PRESENT_UNPROCESSED` ✅ **DOCUMENTED CORRECTLY**
- **Location:** Open Decisions Annex 2.
- **Status:** Archive exists (`RothC_Py-1.0.0.zip`), not extracted, not in 54-project matrix, decision `INSUFFICIENT_EVIDENCE`, requires D-18.
- **Gap:** Not in upstream matrix (correct — not processed). Owner decision D-18 pending.
- **Status:** **Correctly documented as gap.**

### RC8 — WPS License + FloPy Dev Version ✅ **DOCUMENTED CORRECTLY**
- **WPS:** License `NOT FOUND` in archive; decision `LEGAL_REVIEW_REQUIRED`.
- **FloPy:** Version `3.13.0.dev0` (dev, not stable); decision `UPSTREAM_ADOPT` with warning to pin stable.
- **Status:** **Correctly documented as open issues.**

---

## 4. INTEGRATED ARCHITECTURE REVIEW

### 4.1 14-Layer Architecture & Boundaries

| Layer | Modules | Boundary Integrity | Issues |
|---|---|---|---|
| L1 Presentation | 12 UI modules | Clean — only calls Gateway/BFF | OK |
| L2 Identity & Access | 2 (PLT-IAM, PLT-SESSION) | Clean — no business logic | OK |
| L3 Core Platform | 10 (PLT-*, PLT-SET) | Clean — provides context/policy only | OK |
| L4 Territory | 12 (TER-*) | Clean — no finance/science execution | OK |
| L5 HyDroMA | 14 (SCI-*) | **Strong** — independent deployment unit (DU-ENGINE) | OK |
| L6 Geospatial | 15 (GIS-*) | Clean — shared service, no exclusive owner | OK |
| L7 Data & Integration | 3 (INT-*) | Clean — no business rules | OK |
| L8 Business & Marketplace | 18 (MKT-*, TOU-*) | Clean — uses finance/inventory APIs only | OK |
| L9 Finance & Accounting | 31 (ACC-*, INV-*, DEC-*) | **Strong** — append-only ledger, separate from marketplace | ACC-IDEMP misplaced |
| L10 AI | 22 (AI-*) | **Concern** — 4 security modules over-granular; agents as modules | See §4.2 |
| L11 Workflow | 5 (WF-*) | Clean — orchestrator only | OK |
| L12 MRV | 14 (MRV-*) | Clean — evidence owner, not credit issuer | OK |
| L13 Administration | 11 (ADM-*) | Clean — config/review only | OK |
| L14 Infrastructure | 3 (INF-*) | Clean — no business logic | OK |

**Layer dependency compliance:** Most modules respect allowed/forbidden dependencies per Master §2.1. However, the **layer dependency graph** (Master §2 mermaid) contains a **potential cycle**: L3 → L10 → L5 → L11 → L3. While "allowed" doesn't mean "implemented", the architecture lacks explicit cycle-prevention rules (e.g., "L10 must not call L5 synchronously; only via job queue"). This is a latent risk.

### 4.2 194 Modules — Responsibility Boundaries & Granularity

**Module count by layer:**
- L1: 12 | L2: 2 | L3: 10 | L4: 12 | L5: 14 | L6: 15 | L7: 3 | L8: 18 | L9: 31 | L10: 22 | L11: 5 | L12: 14 | L13: 11 | L14: 3 = **194**

**Critical granularity issues:**

| Module(s) | Issue | Evidence |
|---|---|---|
| AI-INJECTION-GUARD, AI-COMMS, AI-COST, AI-SOD | **Over-granular security controls** — no independent API, deployment, or data ownership. Same deployment_unit (DU-CORE), security_zone (Z2-APP). | Module catalog rows 195–198 (estimated); all `deployment_unit` = DU-CORE; `independence` = "independent" but no distinct capability. |
| ACC-IDEMP | **Cross-cutting concern** — idempotency is infrastructure, not finance domain. | `key_inputs` = "idempotency key"; `forbidden_dependencies` = "none"; no business capability. |
| AI-AGENT-* (12 agents) | **Agents as modules** — agents are runtime configurations, not deployable modules. They share AI-GATEWAY, AI-POLICY, AI-TOOLS. | 12 modules with near-identical `allowed_dependencies`; `deployment_unit` = DU-CORE. |
| DEC-TOKEN (REJECT) | **Documentation-only module** in catalog with `decision_status` = REJECT. | Inflates count; should be in open decisions, not module catalog. |
| 4 unidentified additions | **From Set 2** — never identity-verified (`HISTORICAL_VERSION_NOT_RECOVERABLE`). | Master Annex 4.د line 778. |

**Duplicate/overlap check:** No duplicate `module_id` (validation passes). But **functional overlap** exists:
- AI-POLICY vs AI-INJECTION-GUARD/AI-COMMS/AI-COST/AI-SOD — same domain.
- ACC-JOURNAL vs ACC-IDEMP — idempotency is part of journal posting.
- WF-ENGINE vs WF-OUTBOX — outbox is part of engine.

**Recommendation:** Rationalize to ~180 modules by merging cross-cutting controls into host modules.

### 4.3 Role Matrix, Identities & Permissions

**40 entries verified:** 34 DOMAIN_ROLE + 1 SYSTEM_ROLE + 2 IDENTITY_STATE + 3 PERMISSION_CAPABILITY.
- **No broken references** in sitemap (227 pages) or workflows (21 workflows) — validation passes.
- **RBAC + ABAC + SoD** model documented in Master §6 and Role Matrix.
- **Agent identity separation:** AI agents have distinct `role_type` (not in matrix; agents are not human roles). AI-AGENT-OPERATOR is a human role. Agents themselves are identified via `agent_id` (Security Annex AI-2).
- **Agent-to-Agent permissions:** AI-COMMS module + Security Annex AI-3 (pairwise permission required). **Implemented.**
- **Human Approval:** AI-APPROVAL module + WF-APPROVAL + Security Annex AI-6/AI-10/AI-12. **Implemented.**
- **Gap:** No explicit `agent_id` field in Role Matrix (agents not human roles) — correctly handled by separate AI-REGISTRY.

**Status:** **Solid.** Resolves previous H2/H3/H4.

### 4.4 227 Frontend Pages — Module Mapping

- All 227 pages have `module_ids` column populated (0 unmapped).
- States legend documented in Master Annex 3.
- Navigation flow (Master §7.1) covers all 17 nav groups.
- **Issue:** Some pages list excessive `module_ids` (e.g., MKT-01 lists all 12 MKT modules) — reduces traceability precision. But validation only checks presence, not precision.

**Status:** **Complete.** Resolves previous X4/X5.

### 4.5 21 Workflows — Dependencies

| WF | Phase | Key Dependencies | SoD/HITL |
|---|---|---|---|
| WF-01 User Registration | 1 | PLT-IAM | Email verification |
| WF-02 Org Creation | 1 | PLT-ORG, SUPER_ADMIN | Platform approval |
| WF-03 Village/Nomad Registration | 4 | TER-*, ORG_ADMIN | Geo validation |
| WF-04 Rangeland/Farm/Watershed | 4 | TER-*, ORG_ADMIN | Baseline snapshot |
| WF-05 Restoration Project | 4 | TER-REST, FINANCIAL_MANAGER | Multi-level approval |
| WF-06 Field Data Collection | 2 | GIS-FIELD | Supervisor review |
| WF-07 Satellite Acquisition | 2 | GIS-STAC, DATA_STEWARD | License check |
| WF-08 Scientific Model Execution | 3 | SCI-*, resource quota | Quality gate |
| WF-09 Scientific Result Validation | 3 | SCI-VAL, SoD (not own run) | Independent reviewer |
| WF-10 MRV Report Submission | 9 | MRV-*, MRV_VERIFIER + COMPLIANCE | No self-verify |
| WF-11 Vendor Registration | 6 | MKT-VENDOR, compliance | KYC screening |
| WF-12 Product Publishing | 6 | MKT-CATALOG | Moderation |
| WF-13 Order Placement | 6 | MKT-ORDER, INV-SO, payment | Payment confirmation |
| WF-14 Purchase/Sales | 5 | INV-*, approval threshold | Manager approval |
| WF-15 Warehouse In/Out | 5 | INV-STOCK | Exception review |
| WF-16 Journal Entry | 5 | ACC-JOURNAL, maker-checker | Approver ≠ preparer |
| WF-17 Order Settlement | 6 | MKT-SETTLE, ACC-PAYREC, SoD | Finance + owner |
| WF-18 Tourism Reservation | 7 | TOU-RES, hold expiry | Operator exceptions |
| WF-19 Internal Reward | 9 | DEC-REWARD, HITL | Manager + compliance |
| WF-20 Sensitive Operation Approval | 8 | WF-APPROVAL, AI-POLICY | Four-eyes for money/credits |
| WF-21 AI Agent Operation | 8 | AI-*, HITL for sensitive | Human for money/carbon/tokens |

**Coverage:** All financial paths end in balanced journal entry (WF-16, WF-17). MRV separates compilation (MRV_SPECIALIST) from verification (MRV_VERIFIER). AI agents require HITL for risk class ≥3 (WF-20, WF-21).

**Status:** **Coherent and complete.**

### 4.6 Data Model — Ownership & Transaction Support

**11 sections, 4 mermaid diagrams, 18 domains** (Data Domain Model §3).
- **Ownership:** Clear per-domain ownership (PLT, TER, GIS, SCI, MRV, MKT, INV, FIN, PAY, TOU, DOC, NOTIF, AI, WF, AUD, DEC).
- **Multi-tenancy:** `tenant_id` on all domain tables + RLS + CI leak tests (D3).
- **Financial transactions:** Double-entry (ACC-JOURNAL), balanced constraint, append-only, period control (ACC-PERIOD added), FX with provenance (ACC-FX), idempotency (ACC-IDEMP added but misplaced).
- **Scientific provenance:** Immutable `Run` → `InputSnapshot` → `Provenance` → `ResultSet` with `code_hash`, `input_hashes`, `params_hash`, `seed`.
- **MRV separation:** `InternalEstimate` (C2) vs `RegistryCredit` (C3) — distinct entities, no auto-conversion.
- **Cross-domain refs:** By ID + snapshot (D11), no cross-schema joins.
- **Event contracts:** 14 domain events with `event_id`, `tenant_id`, `schema_version`, `correlation_id`, `causation_id`; INT-EVENT-SCHEMA owns versioning.

**Status:** **Robust.** Supports financial and operational transactions with integrity guarantees.

### 4.7 Accounting, Finance & Inventory Architecture

| Capability | Module(s) | Integrity Mechanism |
|---|---|---|
| Double-entry GL | ACC-JOURNAL | DB constraint: debit = credit; append-only |
| Chart of Accounts | ACC-COA | Multi-currency aware; dimension support |
| AP/AR | ACC-AP, ACC-AR | Aging, approval, payment schedule |
| Bank Reconciliation | ACC-BANK | Statement import, matching, difference |
| Multi-currency | ACC-FX | Rate snapshot at posting; revaluation |
| Cost Accounting | ACC-COST | Cost centers, allocation, standard cost |
| Project Accounting | ACC-PROJ | Budget, commitment, profitability |
| Financial Periods | ACC-PERIOD | Open/close/reopen with approval |
| Financial Idempotency | ACC-IDEMP | **Misplaced** — should be infrastructure |
| Inventory Stock | INV-STOCK, INV-WH | Balance + reservation; movement immutable |
| Procurement | INV-PROC, INV-PO | Three-way match (PO, receipt, invoice) |
| Valuation | INV-VAL | FIFO/weighted average; posts via ACC-JOURNAL API |
| Reconciliation | INV-RECON | Physical count → adjustment journal (approval) |
| Digital Economy | DEC-LEDGER, DEC-WALLET | Internal ledger, decimal rules, HITL, owner-gated |

**Gaps:**
- ACC-IDEMP as separate module (see §4.2).
- No explicit **financial idempotency key standard** documented (though WF-13, WF-16 mention idempotency).
- **Duplicate-transaction prevention** relies on workflow idempotency + ACC-IDEMP; no application-level dedup specification (e.g., "same invoice + same payment ref = reject").

**Status:** **Strong foundation with one misplaced module.**

### 4.8 Marketplace & Commercial Cycle

- **Vendor onboarding:** WF-11 (KYC, screening, compliance) → MKT-VENDOR.
- **Catalog:** MKT-CATALOG, MKT-VARIANT, MKT-PRICE (decimal only).
- **Order:** WF-13 (cart → reserve stock → payment intent → confirm) → MKT-ORDER.
- **Fulfillment:** INV-SO (allocation/pick/ship) → MKT-SHIP.
- **Settlement:** WF-17 (commission → statement → dispute window → payout) → MKT-SETTLE, ACC-PAYREC.
- **Returns:** WF-12 reverse flow → MKT-RETURN, credit note.
- **Commission:** MKT-COMM (rule-based, versioned) → journal via ACC-JOURNAL API.
- **Multi-vendor:** MKT-VILLAGE (village storefront) + MKT-VENDOR.
- **Spree integration:** Conditional (INTEGRATE_CANDIDATE) — not decided.

**Status:** **Complete cycle with SoD at each financial touchpoint.**

### 4.9 HyDroMA Architecture & Scientific Contracts

**14 components** (SCI-REG through SCI-VIZAPI) — all present in module catalog.
- **Independence:** DU-ENGINE deployment unit; no business domain imports.
- **Job contract:** `ScenarioRequest` → `Job` → `ModelRun` → `ResultSet` + `Provenance`.
- **4-state model:** §6-الف normative (UNCALIBRATED/CALIBRATED/VALIDATED/NOT_VALIDATED) — **correct**.
- **Per-domain contracts:** §6-б (Water, Soil, Climate, Agriculture, RS, Vegetation) — **complete**.
- **Model registry:** Immutable versions; adapter per model; no exclusive dependency.
- **Calibration/Validation separation:** Separate roles (SCIENTIST vs MRV_SPECIALIST/ENVIRONMENTAL_EXPERT); SoD enforced.
- **Uncertainty:** SCI-UNC (ensemble/sensitivity/interval).
- **Provenance:** Hash-chained (code_hash, input_hashes, params_hash, seed, env).
- **Reproducibility:** Re-run with same snapshot → result within tolerance.
- **Browser vs Server:** Preview only in browser (PREVIEW label); official always server.

**Status:** **Scientifically rigorous and architecturally isolated.** Resolves previous C1 and S-1.

### 4.10 GIS, Remote Sensing & Spatial Processing

**15 GIS modules** covering: 2D maps, 3D globe (optional), terrain, imagery, STAC catalog, raster/vector processing, watershed delineation, land cover, vegetation indices, change detection, field data integration, geospatial search.
- **Standards:** STAC 1.0, OGC API, COG, GeoJSON, GeoTIFF.
- **Processing:** Server-side for heavy (pygeoprocessing, TiTiler); client-side for light (MapLibre, deck.gl).
- **Integration:** TER-WSH uses GIS-WSHED for delineation; SCI-SPATIAL uses GIS-RASTER/VECTOR for alignment.
- **Security:** Tile tokens, file validation, rate limits.

**Status:** **Comprehensive and standards-aligned.**

### 4.11 MRV — Internal vs Official Carbon Separation

| Entity | Module | Classification | Rule |
|---|---|---|---|
| InternalEstimate | MRV-ESTIMATE | C2 | Never sellable; methodology + uncertainty |
| RegistryCredit | MRV-CREDIT | C3 | Record only; issuance external |
| Evidence | MRV-EVID | C3 | Hash-chained, custody, legal hold |
| Verification | MRV-VER | C2 | Independent verifier (MRV_VERIFIER ≠ MRV_SPECIALIST) |
| Uncertainty | MRV-UNC | C2 | Explicit interval + method |

**Enforcement:** Module catalog `forbidden_dependencies` for MRV-* excludes direct credit issuance. Workflow WF-10 requires MRV_VERIFIER + COMPLIANCE_OFFICER.

**Status:** **Correctly architected.** No auto-conversion; clear ownership separation.

### 4.12 Security, Identity & Intelligent Agents

| Control | Implementation | Status |
|---|---|---|
| OIDC/MFA | PLT-IAM, PLT-MFA, Keycloak candidate | D-04 pending |
| RBAC+ABAC | PLT-RBAC (Casbin/OPA), PLT-TEN (RLS) | D-03 pending |
| Multi-tenant isolation | `tenant_id` + RLS + CI leak tests | Implemented |
| Secrets | INF-SECRETS (vault, rotation) | D-03 pending |
| Audit trail | PLT-AUDIT (append-only, hash-chain) | Implemented |
| Backup/DR | INF-BACKUP (3-2-1, quarterly test) | D-13 pending |
| AI prompt injection | AI-INJECTION-GUARD + Security Annex AI-1 | **Module over-granular** |
| AI agent identity | AI-REGISTRY + Security Annex AI-2 | Implemented |
| AI agent-to-agent | AI-COMMS + Security Annex AI-3 | **Module over-granular** |
| AI human approval | AI-APPROVAL + WF-APPROVAL + Security Annex AI-6/AI-10/AI-12 | Implemented |
| AI cost control | AI-COST + Security Annex AI-8 | **Module over-granular** |
| AI SoD | AI-SOD + Security Annex AI-12 | **Module over-granular** |
| Sensitive action protection | WF-20 (four-eyes), AI-POLICY risk class ≥3 | Implemented |

**Agent model:** 12 domain agents (ANALYST, ADMIN, MANAGER, SCIENCE, AGRI, FIN, ACC, INV, MKT, TOU, MRV, SUPPORT) — all via AI-GATEWAY with tool allowlist, budget, HITL. No raw DB/tools. Job submission to HyDroMA = risk class 3 → HITL required.

**Status:** **Control framework complete; 4 AI security modules should be merged into AI-POLICY.**

### 4.13 Infrastructure, Scalability & Processing Cost

**Three scenarios** (Security doc §15):
- A: Low-cost (1-2 VM) — **insufficient for Tier-1 (finance/MRV)** per Security §15.1 note.
- B: Scalable Production (LB, 2-4 Core, managed PG, S3, broker) — **recommended baseline**.
- C: HA International (multi-region, GPU, CDN/WAF, data residency) — for global scale.

**Cost drivers** (HyDroMA §12): Model execution (CPU/RAM/IO), result storage (raster GB/run), data prep (reproject), ensemble (run multiplier), calibration (iterations), data transfer (COG bandwidth).
- **Caching:** Result cache by `hash(inputs+params+model)` recommended.
- **Quotas:** Per-tenant/org/project; kill on exceed.
- **Docker not required** — VM/PaaS/container all valid (Assumption A-11).

**Gap:** No **capacity model** or **cost estimation** for scientific workloads (U-04, U-11 UNKNOWN).

**Status:** **Architecture supports scaling; cost unknown until pilot.**

### 4.14 Open Decisions D-01 through D-25

| Decision | Status | Dependency |
|---|---|---|
| D-01 Deployment topology | OWNER_DECISION_REQUIRED | D-25, D-13 |
| D-02 Primary DB | OWNER_DECISION_REQUIRED | D-03 |
| D-03 Multi-tenancy model | OWNER_DECISION_REQUIRED | D-02, D-25 |
| D-04 IdP | OWNER_DECISION_REQUIRED | D-25 |
| D-05 Accounting core | OWNER_DECISION_REQUIRED | D-24, D-25 |
| D-06 Marketplace core | OWNER_DECISION_REQUIRED | D-24, D-25 |
| D-07 Workflow engine | OWNER_DECISION_REQUIRED | D-08 |
| D-08 Agent framework | OWNER_DECISION_REQUIRED | D-09, D-25 |
| D-09 AI model/provider | OWNER_DECISION_REQUIRED | D-25 |
| D-10 Object Storage | OWNER_DECISION_REQUIRED | D-25 |
| D-11 Search | OWNER_DECISION_REQUIRED | D-25 |
| D-12 BI | OWNER_DECISION_REQUIRED | D-25 |
| D-13 Deployment scenario | OWNER_DECISION_REQUIRED | D-25, D-23 |
| D-14 Jurisdiction/Hosting | OWNER_DECISION_REQUIRED | D-25, D-23 |
| D-15 EcoCoin/HIC model | OWNER_DECISION_REQUIRED | D-24, D-25 |
| D-16 Payment gateway | OWNER_DECISION_REQUIRED | D-25 |
| D-17 Phase 1 models | OWNER_DECISION_REQUIRED | D-18, D-25 |
| D-18 Soil carbon model (RothC) | OWNER_DECISION_REQUIRED | U-03, D-25 |
| D-19 Copyleft project policy | OWNER_DECISION_REQUIRED | D-24 |
| D-20 Data retention | OWNER_DECISION_REQUIRED | D-14, D-25 |
| D-21 ASVS level | OWNER_DECISION_REQUIRED | D-25 |
| D-22 Client-side processing | OWNER_DECISION_REQUIRED | D-25 |
| D-23 Jurisdiction (restored) | OWNER_DECISION_REQUIRED | D-25, D-13 |
| D-24 Commercial Approval (restored) | OWNER_DECISION_REQUIRED | D-25, Upstream matrix |
| D-25 Budget (restored) | OWNER_DECISION_REQUIRED | **Root dependency** |

**All 25 decisions:** `OWNER_DECISION_REQUIRED`, none approved. Dependency chain documented: D-25 → D-23/D-24/D-13 → Deployment + Upstream Matrix.

**Status:** **Correctly documented; no false approvals.**

---

## 5. DEEP ARCHITECTURAL ANALYSIS

### 5.1 Module Responsibility Boundaries — REAL?

**Finding:** **Mostly YES, but 6 modules lack true boundary independence.**

| Module | Boundary Issue | Evidence |
|---|---|---|
| AI-INJECTION-GUARD | No distinct API; subset of AI-POLICY | Same deployment_unit, no unique inputs/outputs |
| AI-COMMS | No distinct API; pairwise permission is policy | Same deployment_unit |
| AI-COST | No distinct API; budget enforcement in AI-GATEWAY | Same deployment_unit |
| AI-SOD | No distinct API; SoD is cross-cutting rule | Same deployment_unit |
| ACC-IDEMP | Infrastructure concern, not finance domain | `key_inputs` = "idempotency key" (technical) |
| DEC-TOKEN | REJECT status; documentation only | Should not be in module catalog |

**Impact:** Inflated module count (194 vs ~188 meaningful); violates modular monolith principle that modules = independently deployable bounded contexts.

### 5.2 Duplicate or Over-Granular Modules?

**Finding:** **YES — 6 modules identified above + 12 AI agents as modules.**

- **AI agents (12):** These are **runtime configurations** of AI-GATEWAY + AI-POLICY + AI-TOOLS, not deployable modules. They share 100% of infrastructure. In a modular monolith, they should be **agent definitions in AI-REGISTRY**, not separate modules.
- **Effect:** L10 has 22 modules; realistic bounded contexts: AI-GATEWAY, AI-REGISTRY, AI-TOOLS, AI-POLICY (with security controls), AI-APPROVAL, AI-AUDIT = **6 modules**. The 12 agents + 4 security controls = 16 over-granular entries.

### 5.3 Circular Dependencies Between Modules?

**Layer graph cycle:** L3 → L10 → L5 → L11 → L3 (allowed dependencies).
- **L3 (Core)** allows L10 (AI) — for AI to read user/org context.
- **L10 (AI)** allows L5 (HyDroMA) — for AI to submit scientific jobs.
- **L5 (HyDroMA)** allows L11 (Workflow) — for job queue/execution.
- **L11 (Workflow)** allows L3 (Core) — for workflow to advance core domain states.

**Mitigation:** Architecture rules (§2.2) say "reverse forbidden unless via public contract/event". But the **allowed graph itself has a cycle**. No explicit rule prevents synchronous call chain L3→L10→L5→L11→L3.

**Risk:** Runtime circular dependency if AI synchronously calls HyDroMA which synchronously calls Workflow which synchronously calls Core.

**Correction needed:** Add rule: "L10 must not call L5 synchronously; only via async job queue (SCI-QUEUE). L5 must not call L11 synchronously for state transitions; only via domain events."

### 5.4 Data Model — Financial & Operational Transaction Support?

**Finding:** **YES — robust support.**

- **Double-entry:** ACC-JOURNAL with DB constraint (debit=credit), append-only, reversal-only correction.
- **Period control:** ACC-PERIOD (open/close/reopen with approval).
- **Idempotency:** ACC-IDEMP (misplaced) + workflow idempotency keys + outbox pattern.
- **Concurrency:** Optimistic locking via `version` on all entities (D5).
- **Audit:** PLT-AUDIT hash-chain on all mutations.
- **Multi-currency:** ACC-FX with rate snapshot at posting.
- **Inventory-finance sync:** INV-VAL posts via ACC-JOURNAL API only (no direct GL write).
- **Marketplace-finance:** MKT-ORDER → INV-SO (reservation) → ACC-INVOICE → ACC-PAYREC (reconciliation).

**Gap:** No explicit **application-level duplicate transaction spec** (e.g., "same idempotency key + same amount + same account = reject"). Relies on ACC-IDEMP + workflow.

### 5.5 Financial Operations — Integrity Guarantees Against Duplicate Posting?

**Finding:** **PARTIAL — infrastructure exists but not fully specified.**

| Layer | Mechanism | Coverage |
|---|---|---|
| Database | ACC-JOURNAL balanced constraint | Prevents unbalanced entries |
| Database | ACC-JOURNAL append-only | Prevents silent mutation |
| Application | ACC-IDEMP (idempotency key) | **Module misplaced; spec incomplete** |
| Workflow | WF-13, WF-16 idempotency keys | Order placement, journal entry |
| Event | INT-EVENTS outbox + idempotent consumers | Cross-domain |
| Process | WF-20 four-eyes approval | Sensitive operations |

**Missing:** Explicit **idempotency key format**, **deduplication window**, **collision handling**, **replay protection** for financial events. ACC-IDEMP module has no specification beyond name.

**Correction needed:** Move ACC-IDEMP to infrastructure (INT-IDEMP), specify key format (e.g., `idem:{domain}:{entity}:{operation}:{business_key}`), deduplication TTL, and integration with INT-EVENTS outbox.

### 5.6 Scientific Models — Reproducible, Versioned, Validatable?

**Finding:** **YES — HyDroMA architecture enforces this.**

| Requirement | Mechanism |
|---|---|
| Model versioning | SCI-REG: immutable versions, hash-chained, no delete |
| Adapter contract | SCI-ADP: standard input/output schema per model |
| Input snapshot | SCI-INPUT: dataset binding + hash + validation |
| Unit safety | SCI-UNIT: UCUM conversion, hard failure on mismatch |
| Execution isolation | SCI-EXEC: sandbox, quotas, timeout, artifact collection |
| Provenance | SCI-PROV: code_hash, input_hashes, params_hash, seed, env |
| Calibration | SCI-CAL: parameter estimation + diagnostics + version |
| Validation | SCI-VAL: independent reviewer, held-out data, thresholds |
| Uncertainty | SCI-UNC: ensemble/sensitivity/interval, explicit method |
| Reproducibility | Re-run with same snapshot → result within tolerance |
| 4-state gate | Only VALIDATED results usable in MRV (S5, S10) |

**Gap:** No **model deprecation policy** (P14: N-1 compatibility) for scientific models — only for APIs. Scientific models may break reproducibility if adapter changes.

**Correction needed:** Add model adapter versioning + deprecation policy to SCI-REG/SCI-ADP.

### 5.7 Agent Identity — Separate from User/Service Identity?

**Finding:** **YES — correctly separated.**

- **Users:** PLT-USER, PLT-IAM, PLT-SESSION — human identities.
- **Services:** PLT-IAM (service accounts), PLT-SCIM — system identities.
- **Agents:** AI-REGISTRY (agent_id, manifest, version, owner), AI-GATEWAY (routes requests), AI-POLICY (enforces allowlist/budget).
- **Authentication:** Agents authenticate via service credentials; AI-GATEWAY validates agent_id + scope.
- **Authorization:** Agent-to-agent requires pairwise permission (AI-COMMS/AI-3). Agent-to-tool via allowlist (AI-TOOLS/AI-4).
- **Audit:** AI-AUDIT logs all agent decisions, tool calls, costs, approvals.

**Status:** **Clean separation.** No conflation of agent identity with human identity.

### 5.8 Agent-to-Agent & Human Approval Permissions — Complete?

**Finding:** **YES — framework complete; 4 modules over-granular.**

| Control | Implementation |
|---|---|
| Agent identity | AI-REGISTRY (agent_id, manifest) |
| Agent-to-agent auth | AI-COMMS (pairwise permission) + Security Annex AI-3 |
| Tool allowlist | AI-TOOLS (schema, scope, risk class) + Security Annex AI-4 |
| Least privilege | Security Annex AI-5 (read-only data, no financial write) |
| Human approval | AI-APPROVAL + WF-APPROVAL + Security Annex AI-6/AI-10/AI-12 |
| Cost budget | AI-COST + Security Annex AI-8 |
| Rate limiting | Security Annex AI-9 |
| Sensitive action protection | WF-20 (four-eyes), AI-POLICY risk class ≥3 |
| Failure/recovery | Security Annex AI-11 (retry, DLQ, escalation) |
| SoD | AI-SOD + Security Annex AI-12 (no propose+approve) |

**Status:** **Complete control framework.** The 4 security modules (AI-INJECTION-GUARD, AI-COMMS, AI-COST, AI-SOD) should be **internal components of AI-POLICY**, not separate modules.

### 5.9 Multi-Tenant & Multi-Country — Reflected in Data Model & Security?

**Finding:** **YES — architecture supports; policies pending owner decisions.**

| Aspect | Architecture Support | Owner Decision |
|---|---|---|
| Tenant isolation | `tenant_id` on all tables + RLS + CI leak tests (D3) | D-03 (model) |
| Data residency | Object Storage bucket/prefix per tenant/region; DB region | D-10, D-14, D-23 |
| Legal compliance | Data classification C0-C4; retention per domain; legal hold | D-14, D-20 |
| Multi-currency | ACC-FX + PLT-I18N (ISO 4217, locale-aware) | D-16 |
| Multi-language | ICU MessageFormat, RTL/LTR, CLDR | D-02, D-22 |
| Cross-border transfer | Architecture enables region routing; policy TBD | D-14, D-23 |
| Jurisdiction | D-23 restored; options documented | D-23 |

**Gap:** No **data routing logic** specified for multi-region (e.g., "EU tenant data stays in EU region"). Architecture enables but doesn't prescribe.

**Correction needed:** Add data routing rules to PLT-TEN or INT-GATEWAY specification.

### 5.10 Modular Monolith — Compatible with Current Boundaries?

**Finding:** **MOSTLY YES — with 6 over-granular modules violating the principle.**

**Modular Monolith criteria (Master §3.1):**
- Modules have public APIs ✅ (mostly)
- CI enforces dependency lint ✅ (P1)
- Independent deployment only for 3 processing units (Core, Engine, Geo) ✅
- Shared DB with schema separation ✅ (PostgreSQL + RLS)

**Violations:**
1. **6 modules (4 AI security + ACC-IDEMP + DEC-TOKEN)** lack independent deployment semantics.
2. **12 AI agents** listed as modules but are runtime configurations.
3. **4 unidentified Set 2 modules** — unknown boundaries.

**If rationalized:** ~180 modules → clean modular monolith. Current 194 includes architectural noise.

**Correction needed:** Rationalize module catalog; move cross-cutting concerns to infrastructure layer; remove REJECT modules from catalog.

---

## 6. FINDINGS SUMMARY

### CRITICAL

| ID | Finding | File/Location | Evidence | Impact | Correction | Owner Decision? |
|---|---|---|---|---|---|---|
| C1 | Master Architecture §4.5 & §10 still use stale HyDroMA vocabulary (`UNCALIBRATED`/`EXPERIMENTAL`) instead of 4-state model | `ECO-NOJIN-MASTER-ARCHITECTURE.md` lines 309, 546 | Direct text contradicts corrected HyDroMA §6-الف | Reader uses wrong scientific state model; undermines RC1 fix | Update §4.5 and §10 to reference 4-state model (`UNCALIBRATED`/`CALIBRATED`/`VALIDATED`/`NOT_VALIDATED`) | No |
| C2 | Layer dependency graph has cycle L3→L10→L5→L11→L3 with no synchronous call prevention rule | `ECO-NOJIN-MASTER-ARCHITECTURE.md` §2 mermaid + §2.1 table | Allowed dependencies form cycle; §2.2 only forbids reverse | Potential runtime deadlock/circular call if AI→HyDroMA→Workflow→Core synchronous | Add rule: "L10 must call L5 only via async job queue (SCI-QUEUE). L5 must not call L11 synchronously for state transitions; only via domain events." | No |

### HIGH

| ID | Finding | File/Location | Evidence | Impact | Correction | Owner Decision? |
|---|---|---|---|---|---|---|
| H1 | 4 AI security modules (AI-INJECTION-GUARD, AI-COMMS, AI-COST, AI-SOD) are cross-cutting controls, not independent modules | `ECO-NOJIN-MODULE-CATALOG.csv` L10 rows; `ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md` Annex AI-1..AI-12 | Same deployment_unit (DU-CORE), security_zone (Z2-APP), no distinct APIs/business capabilities | Inflates module count; violates modular monolith principle; architectural noise | Merge into AI-POLICY as internal components; keep security annex as control spec | No |
| H2 | ACC-IDEMP is infrastructure concern (idempotency), not finance domain module | `ECO-NOJIN-MODULE-CATALOG.csv` L9; `key_inputs`="idempotency key" | No business capability; technical dedup function | Misplaced in L9; should be infrastructure | Move to L7 as INT-IDEMP; specify key format, TTL, outbox integration | No |
| H3 | 12 AI agents listed as modules but are runtime configurations of AI-GATEWAY/POLICY/TOOLS | `ECO-NOJIN-MODULE-CATALOG.csv` AI-AGENT-* rows | 100% shared infrastructure; agent definitions belong in AI-REGISTRY | Inflates L10 from 6 to 22 modules; no deployment independence | Remove AI-AGENT-* from module catalog; store as agent manifests in AI-REGISTRY | No |
| H4 | DEC-TOKEN (REJECT) remains in module catalog as documentation-only entry | `ECO-NOJIN-MODULE-CATALOG.csv` row 147 | `decision_status`="REJECT (activate)", `deployment_unit`="proposed" | Pollutes module count; catalog should reflect deployable modules | Move to Open Decisions (D-15); remove from catalog | No |
| H5 | 4 unidentified module additions from Set 2 never identity-verified | Master Annex 4.د line 778 | `HISTORICAL_VERSION_NOT_RECOVERABLE`, `UNIDENTIFIED_MODULE_ADDITIONS` | Unknown boundaries/responsibilities; potential duplicates | Audit or remove; cannot verify architectural integrity | Yes (audit scope) |
| H6 | RothC not in upstream matrix; D-18 pending; archive unprocessed | Open Decisions Annex 2; Upstream Matrix 54 rows | `PRESENT_UNPROCESSED`, `INSUFFICIENT_EVIDENCE` | Soil carbon model gap for MRV-SOC; cannot validate HyDroMA carbon capability | Process RothC archive; add to matrix with decision | Yes (D-18) |

### MEDIUM

| ID | Finding | File/Location | Evidence | Impact | Correction | Owner Decision? |
|---|---|---|---|---|---|---|
| M1 | WPS license unknown; cannot use until resolved | Upstream Matrix row 54; Open Decisions Annex 2 | `license`="NOT FOUND", `decision`="LEGAL_REVIEW_REQUIRED` | Meteorological preprocessing blocked | Legal review; confirm WRF Apache-2.0 from source | Yes |
| M2 | FloPy at dev version (3.13.0.dev0); not stable | Upstream Matrix row 15; Open Decisions Annex 2 | `version_in_archive`="3.13.0.dev0", `decision`="UPSTREAM_ADOPT` with warning | Groundwater model risk; may break reproducibility | Pin stable release before production | Yes |
| M3 | Sitemap module_ids sometimes overly broad (e.g., MKT-01 lists all 12 MKT modules) | `ECO-NOJIN-FRONTEND-SITEMAP.csv` | Reduces traceability precision | Harder to validate page-module coupling | Refine to minimal relevant modules per page | No |
| M4 | No model adapter deprecation policy (scientific models) | `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` SCI-REG/SCI-ADP | P14 applies to APIs only; adapters can break reproducibility | SCI-ADP changes could invalidate stored provenance | Add adapter versioning + N-1 deprecation to SCI-REG | No |
| M5 | No explicit data routing rules for multi-region tenancy | `ECO-NOJIN-MASTER-ARCHITECTURE.md` §5.1; `ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md` §5 | Architecture enables (bucket prefix, RLS) but no routing logic | EU tenant data could route to US region unintentionally | Add routing rules to PLT-TEN or INT-GATEWAY spec | Yes (D-23) |
| M6 | Financial duplicate-transaction prevention spec incomplete | ACC-IDEMP module; WF-13/16 idempotency | No key format, TTL, collision handling, replay protection | Risk of duplicate journal entries under replay | Specify in INT-IDEMP (moved from ACC-IDEMP) | No |

### LOW

| ID | Finding | File/Location | Evidence | Impact | Correction | Owner Decision? |
|---|---|---|---|---|---|---|
| L1 | Module catalog `notes` column has inconsistent language (mixed EN/FA) | `ECO-NOJIN-MODULE-CATALOG.csv` | Some rows English, some Persian | Minor readability | Standardize to one language | No |
| L2 | Some `candidate_upstream` values are descriptive not project IDs | `ECO-NOJIN-MODULE-CATALOG.csv` | e.g., "wflow/MODFLOW/AquaCrop adapters" | Hard to trace to upstream matrix | Use project IDs from upstream matrix | No |
| L3 | Phase numbers in module catalog not fully aligned with Master §15 roadmap | `ECO-NOJIN-MODULE-CATALOG.csv` vs Master §15.1 | e.g., GIS-GLOBE3D phase 2 vs Master phase 7 for 3D | Minor planning confusion | Align phases | No |

---

## 7. VERDICT & RECOMMENDATIONS

**Final Verdict:** `ACCEPTED_WITH_CORRECTIONS`

The consolidated-v1 architecture **post RC1–RC8** is **structurally validated** (18/18 tests pass) and **fundamentally sound**. The scientific, financial, identity, and marketplace architectures are coherent and well-bounded. The HyDroMA 4-state model and per-domain contracts are correctly implemented.

**However, three categories of corrections are required before this set can be the authoritative reference:**

### 7.1 Mandatory Corrections (No Owner Decision)

| # | Correction | Files Affected | Effort |
|---|---|---|---|
| MC1 | Fix Master §4.5 and §10 to reference HyDroMA 4-state model | `ECO-NOJIN-MASTER-ARCHITECTURE.md` | Low |
| MC2 | Add synchronous call prevention rule for L3→L10→L5→L11→L3 cycle | `ECO-NOJIN-MASTER-ARCHITECTURE.md` §2.2 | Low |
| MC3 | Merge AI-INJECTION-GUARD, AI-COMMS, AI-COST, AI-SOD into AI-POLICY; remove from module catalog | `ECO-NOJIN-MODULE-CATALOG.csv`, `ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md` | Medium |
| MC4 | Move ACC-IDEMP to L7 as INT-IDEMP; specify idempotency key format, TTL, outbox integration | `ECO-NOJIN-MODULE-CATALOG.csv`, add spec | Medium |
| MC5 | Remove 12 AI-AGENT-* modules from catalog; store as manifests in AI-REGISTRY | `ECO-NOJIN-MODULE-CATALOG.csv` | Low |
| MC6 | Remove DEC-TOKEN from module catalog; reference in D-15 only | `ECO-NOJIN-MODULE-CATALOG.csv` | Low |
| MC7 | Add model adapter deprecation policy to SCI-REG/SCI-ADP | `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` | Medium |
| MC8 | Specify financial idempotency key format and deduplication semantics | New: INT-IDEMP spec | Medium |

### 7.2 Owner Decisions Required

| # | Decision | Status | Blocking |
|---|---|---|---|
| OD1 | D-18: Process RothC archive; add to upstream matrix | `PENDING_OWNER_APPROVAL` | MRV-SOC, HyDroMA carbon |
| OD2 | D-23: Jurisdiction/hosting model (data routing rules) | `PENDING_OWNER_APPROVAL` | Multi-country, PLT-TEN |
| OD3 | WPS license legal review | `PENDING_OWNER_APPROVAL` | Meteorology preprocessing |
| OD4 | FloPy stable version pin | `PENDING_OWNER_APPROVAL` | Groundwater model |
| OD5 | Audit/remove 4 unidentified Set 2 modules | `PENDING_OWNER_APPROVAL` | Module catalog integrity |

### 7.3 Items Not Verifiable (Remain UNKNOWN)

| # | Item | Reason |
|---|---|---|
| UV1 | Actual scientific model execution cost/performance (U-04, U-11) | No pilot run |
| UV2 | Host country legal requirements (U-05) | No legal review |
| UV3 | Satellite data licensing terms (U-06) | Provider-dependent |
| UV4 | Final data retention policy (U-07) | Owner decision D-20 |
| UV5 | EcoCoin/HIC definition (U-08) | Owner decision D-15 |
| UV6 | 3D globe/OGC actual need (U-09, U-13) | Owner decision |
| UV7 | Security risk appetite (U-10) | Owner decision D-21 |

---

## 8. CONCLUSION

The architecture is **accepted with corrections**. The RC1–RC8 corrections resolved the previous review's critical gaps (HyDroMA 4-state model, per-domain contracts, AI security controls, financial periods/idempotency, sitemap mapping, RothC/WPS/FloPy documentation) **but introduced new architectural noise** (over-granular modules) and **left one critical correction incomplete** (Master vocabulary in §4.5/§10).

**Next steps:**
1. Apply mandatory corrections MC1–MC8 (no owner decision needed).
2. Resolve owner decisions OD1–OD5.
3. Re-validate (18 tests + module count rationalization).
4. Final independent review → `INDEPENDENT_REVIEW_ACCEPTED` if all cleared.

**No project is approved for production, legal, security, scientific, or economic use.** All owner decisions remain open.

---

**END OF REVIEW.**