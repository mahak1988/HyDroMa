# INDEPENDENT ARCHITECTURE REVIEW
## Eco Nojin & HyDroMA — consolidated-v1

**Reviewer:** Independent critical review (READ-ONLY)
**Date:** 2026-11-17
**Reference set:** `D:\Nojin\architecture\consolidated-v1\` (12 files)
**Mode:** Read-only. No file was modified. No code was written. No project was run. No decision was finalized.

**Verdict:** `ACCEPTED_WITH_CORRECTIONS`

---

## 1. EXECUTIVE SUMMARY

The consolidated-v1 set is **structurally consistent** (all 13 validation tests pass: 5 CSVs parse, 0 duplicate IDs, 0 broken role references, 54 upstream projects all with proposed decisions, 25 unique open-decision IDs). The 14-layer architecture, 188-module catalog, 40-row role matrix, 227-page sitemap, 21 workflows, and 54-project upstream matrix form a coherent skeleton.

However, the review found **two critical gaps** and **several major inconsistencies** that must be corrected before this set can be treated as a coherent architecture reference:

1. **CRITICAL — HyDroMA validation-state model is incomplete.** The mission requires four states (`UNCALIBRATED`, `CALIBRATED`, `VALIDATED`, `NOT_VALIDATED`). The consolidated HyDroMA doc uses a different vocabulary (`UNCALIBRATED`/`EXPERIMENTAL`, `PROVISIONAL`, `VALIDATED`, `REJECTED`) — `CALIBRATED` and `NOT_VALIDATED` are **absent**. This is a direct scientific-integrity requirement gap.
2. **CRITICAL — The master is not fully integrated.** It is V2 + an appended amendments section. The V2 body still contains stale statements (e.g., §16 uses the V2 decision vocabulary `UPSTREAM_CUSTOMIZE`/`BUILD` while the consolidated matrix uses `ADOPT_CANDIDATE`/`INTEGRATE_CANDIDATE`/`LEGAL_REVIEW_REQUIRED`; §6 says "34 roles" while the matrix has 40 rows). The master body contradicts the consolidated artifacts.

The architecture is **fundamentally sound** — the issues are targeted and fixable, not a redesign. Hence `ACCEPTED_WITH_CORRECTIONS`.

---

## 2. ARCHITECTURE STRENGTHS

| # | Strength | Evidence |
|---|---|---|
| S1 | 14-layer separation with explicit allowed/forbidden dependencies | Master §2; module catalog `layer_code` |
| S2 | 188 modules, 0 missing fields, 0 duplicate IDs, all with owner/deployment/phase | Module catalog validation |
| S3 | Role model reconciled: 0 broken refs across sitemap + workflows | Validation tests 10–11 |
| S4 | Sensitive-item coverage: double-entry, inventory separation, multi-tenancy, MRV separation, AI approval, secrets, backup | Module catalog L9/L12/L10/L14 |
| S5 | Upstream posture is conservative and evidence-based (30 DEFER, 3 REJECT) | Consolidated matrix |
| S6 | Open decisions: 25 unique IDs, all `OWNER_DECISION_REQUIRED`, none approved | Open decisions validation |
| S7 | HyDroMA independence: 14 SCI modules match the HyDroMA doc's 14 components | Module catalog L5 vs HyDroMA doc |
| S8 | Data domain: 11 sections, 4 mermaid diagrams, ownership/RLS/UTC/provenance rules | Data domain doc |

---

## 3. CRITICAL FINDINGS

### C1 — HyDroMA validation-state model incomplete
- **ID:** C1
- **File/location:** `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` — §1.1 S5 (L21), §5 state flow (L95), §7 validation (L186–195).
- **Problem:** The mission requires four result states: `UNCALIBRATED`, `CALIBRATED`, `VALIDATED`, `NOT_VALIDATED`. The doc defines `UNCALIBRATED`/`EXPERIMENTAL`, `PROVISIONAL`, `VALIDATED`, `REJECTED` — **`CALIBRATED` and `NOT_VALIDATED` are absent**; `validation_state` is not a named field.
- **Evidence:** `Select-String` found `UNCALIBRATED`=True, `CALIBRATED`=True (only as substring of UNCALIBRATED), `VALIDATED`=True, `NOT_VALIDATED`=False, `validation_state`=False. The doc's own S5 uses `UNCALIBRATED`/`EXPERIMENTAL`.
- **Impact:** Without an explicit `CALIBRATED` and `NOT_VALIDATED` state, the scientific result lifecycle cannot be enforced consistently; MRV cannot reliably distinguish calibrated-but-not-validated results.
- **Correction:** Add a normative 4-state enum (`UNCALIBRATED`, `CALIBRATED`, `VALIDATED`, `NOT_VALIDATED`) with transition rules, and a `validation_state` field on every `ScientificResult`.
- **Priority:** CRITICAL
- **Owner decision needed:** No (technical correction).

### C2 — Master is V2 + appendix, not fully integrated; body contradicts consolidated artifacts
- **ID:** C2
- **File/location:** `ECO-NOJIN-MASTER-ARCHITECTURE.md` — §6 (L423), §16 (L663), vs consolidated matrix + role matrix.
- **Problem:** The master body still uses V2 vocabulary and counts that contradict the consolidated artifacts:
  - §16 (L663) lists decisions `UPSTREAM_ADOPT, UPSTREAM_CUSTOMIZE, INTEGRATE, BUILD, DEFER, REJECT` — the consolidated matrix uses `ADOPT_CANDIDATE, INTEGRATE_CANDIDATE, DEFER, REJECT, LEGAL_REVIEW_REQUIRED, UPSTREAM_ADOPT, INTEGRATE`. `UPSTREAM_CUSTOMIZE` and `BUILD` no longer exist in the consolidated matrix.
  - §6 (L423) says "34 roles" — the consolidated role matrix has 40 rows (34 domain + 1 system + 2 states + 3 capabilities).
- **Evidence:** Direct line references above; amendments at L764–770 explain the changes but the body was not updated.
- **Impact:** A reader of the master alone would use the wrong decision vocabulary and the wrong role count; the master is not a self-consistent reference.
- **Correction:** Update the master body §6 and §16 to match the consolidated matrix and role matrix, or add explicit "superseded by amendments" markers at those sections.
- **Priority:** CRITICAL
- **Owner decision needed:** No (documentation correction).

---

## 4. MAJOR FINDINGS

### H1 — RothC absent from the upstream matrix
- **ID:** H1
- **File/location:** `ECO-NOJIN-UPSTREAM-DECISION-MATRIX.csv` — 54 rows; no `rothc` entry.
- **Problem:** The mission explicitly lists RothC as a project to re-check. RothC was never extracted/registered (`RothC_Py-1.0.0.zip` exists in `batch-10-eco` but was out of scope and not processed). It is absent from the 54-project matrix.
- **Evidence:** `rothc_present=0`.
- **Impact:** RothC (soil organic carbon model) is relevant to HyDroMA's soil-carbon capability but has no recorded decision.
- **Correction:** Add RothC as a 55th entry with status `INSUFFICIENT_EVIDENCE` (not extracted) and a note that extraction is required before any decision.
- **Priority:** HIGH
- **Owner decision needed:** Yes (whether to add RothC to scope).

### H2 — AI security modules incomplete
- **ID:** H2
- **File/location:** `ECO-NOJIN-MODULE-CATALOG.csv` — L10 (18 AI modules).
- **Problem:** The AI layer has `AI-GATEWAY`, `AI-REGISTRY`, `AI-TOOLS`, `AI-POLICY`, `AI-APPROVAL`, `AI-AUDIT`, but **no explicit modules** for: prompt-injection defense, agent-to-agent permissions, and AI cost control. `AI-POLICY` covers guardrails generically; the specific controls are not named.
- **Evidence:** keyword search: `prompt injection`→0 modules, `agent-to-agent`→0, AI `cost`→only `ACC-COST` (cost accounting, not AI).
- **Impact:** The mission requires prompt-injection protection, agent-to-agent permissions, and cost control. Without explicit modules, these controls are not traceable.
- **Correction:** Add submodules under `AI-POLICY`: `AI-INJECTION-GUARD`, `AI-AGENT-COMMS` (agent-to-agent permissions), `AI-COST-CONTROL`; or extend `AI-POLICY` responsibility text to name them.
- **Priority:** HIGH
- **Owner decision needed:** No (technical correction).

### H3 — Security doc omits agent-to-agent and human-approval controls
- **ID:** H3
- **File/location:** `ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md` — AI/security sections.
- **Problem:** The security doc mentions prompt injection, secret, cost, tool, but **not** agent-to-agent permissions or human approval.
- **Evidence:** keyword search: `agent-to-agent`→False, `human approval`→False.
- **Impact:** Inconsistent with the module catalog (which has `AI-APPROVAL`) and the mission's AI requirements.
- **Correction:** Add agent-to-agent permission and human-approval controls to the security doc.
- **Priority:** HIGH
- **Owner decision needed:** No.

### H4 — Master role count stale (34 vs 40)
- **ID:** H4
- **File/location:** `ECO-NOJIN-MASTER-ARCHITECTURE.md` §6 (L423) vs `ECO-NOJIN-USER-ROLE-MATRIX.csv`.
- **Problem:** Body says 34 roles; matrix has 40 rows.
- **Evidence:** L423 vs matrix count.
- **Impact:** Minor but contributes to C2.
- **Correction:** Update §6 to state "34 domain roles + 1 system role + 2 identity states + 3 capabilities = 40 entries".
- **Priority:** HIGH (part of C2).

---

## 5. CROSS-DOCUMENT INCONSISTENCIES

| # | Inconsistency | Files | Severity |
|---|---|---|---|
| X1 | Master §16 decision vocabulary ≠ consolidated matrix vocabulary | Master vs Upstream matrix | HIGH |
| X2 | Master §6 role count (34) ≠ role matrix (40 rows) | Master vs Role matrix | HIGH |
| X3 | HyDroMA state vocabulary ≠ mission-required 4 states | HyDroMA doc vs mission | CRITICAL |
| X4 | Sitemap `states` column uses cryptic codes (`L;EM;ER;S`) without a legend | Sitemap | MEDIUM |
| X5 | Sitemap pages not explicitly linked to module IDs (only `nav_group`) | Sitemap vs Module catalog | MEDIUM |
| X6 | RothC absent from upstream matrix | Upstream matrix | HIGH |
| X7 | AI security modules incomplete | Module catalog vs mission | HIGH |

---

## 6. SCIENTIFIC ARCHITECTURE REVIEW

| Requirement | Status | Finding |
|---|---|---|
| Model Registry | PASS | `SCI-REG` present |
| Model Adapter | PASS | `SCI-ADP` present |
| Input/Output Contracts | PARTIAL | Generic contract defined; **per-domain contracts (water/soil/climate/crop/RS/vegetation) not explicit** |
| Unit Validation | PASS | `SCI-UNIT` + UCUM rule |
| Data Provenance | PASS | `SCI-PROV` + hash-chained rule |
| Model Versioning | PASS | Immutable versions rule |
| Calibration | PASS | `SCI-CAL` |
| Independent Validation | PARTIAL | `SCI-VAL` present; **4-state model incomplete (C1)** |
| Uncertainty Quantification | PASS | `SCI-UNC` |
| Scenario Management | PASS | `SCI-SCEN` |
| Reproducibility | PASS | Stored inputs + code hash + seed rule |
| Scientific Job Management | PASS | `SCI-EXEC` + `SCI-QUEUE` |
| 4-state result model | **FAIL** | `CALIBRATED` and `NOT_VALIDATED` absent (C1) |
| Internal ≠ official carbon credit | PASS | `MRV-ESTIMATE` vs `MRV-CREDIT` separated |

**Finding S-1 (HIGH):** Per-domain scientific contracts are not defined. The HyDroMA doc has one generic model contract; water, soil, climate, crop, remote-sensing, and vegetation model families each need their own input/output/unit contract. Without these, adapters cannot be validated per domain.

---

## 7. FINANCIAL AND MARKETPLACE REVIEW

| Requirement | Status | Finding |
|---|---|---|
| Double-entry accounting | PASS | `ACC-JOURNAL` (General Ledger and Journal) |
| Decimal accuracy | PASS | Data domain D7 "money/unit/time" rules; module catalog forbids float |
| Multi-currency | PASS | `ACC-FX` |
| Financial periods | PARTIAL | `ACC-JOURNAL` period handling; no explicit `ACC-PERIOD` module |
| Journal entries | PASS | `ACC-JOURNAL` |
| Order/payment/settlement/refund | PASS | `MKT-ORDER`, `ACC-PAYREC`, `MKT-SETTLE` |
| Vendor commission | PASS | `MKT-COMM` (Commission Engine) |
| Inventory/reservation/returns | PASS | `INV-STOCK`, `MKT-RETURN` |
| Financial reconciliation | PASS | `ACC-BANK`, `ACC-PAYREC`, `INV-RECON` |
| Duplicate-transaction prevention | PARTIAL | Idempotency mentioned in workflow catalog; no explicit financial idempotency module |
| Wallet vs GL separation | PASS | `DEC-LEDGER` (L9 Digital Economy) vs `ACC-JOURNAL` (L9 Finance) — separate modules |

**Finding F-1 (MEDIUM):** No explicit `ACC-PERIOD` (financial period) module. Period close/open is implied in `ACC-JOURNAL` but not a named capability.
**Finding F-2 (MEDIUM):** Financial idempotency (duplicate-transaction prevention) is only implied via workflow idempotency; no explicit accounting-level control module.

---

## 8. SECURITY AND IDENTITY REVIEW

| Requirement | Status | Finding |
|---|---|---|
| Authentication (OIDC/MFA) | PASS | Master §12; `PLT-IAM` |
| RBAC + ABAC | PASS | 34 domain roles + 3 capabilities |
| Multi-tenant isolation | PASS | `PLT-TEN` + RLS rule |
| Secrets management | PASS | `INF-SECRETS` |
| Audit trail | PASS | `PLT-AUDIT` + hash-chain |
| Backup/DR | PASS | `INF-BACKUP` |
| AI prompt-injection defense | PARTIAL | Mentioned in security doc; no explicit module (H2) |
| AI human approval | PARTIAL | `AI-APPROVAL` module; security doc omits (H3) |
| Agent-to-agent permissions | **FAIL** | No module, no security-doc coverage (H2/H3) |
| AI cost control | **FAIL** | No module (H2) |

**Finding SEC-1 (HIGH):** AI security controls are incomplete (H2/H3).

---

## 9. UPSTREAM REVIEW (54 projects + RothC)

All 54 projects have a proposed decision and `PENDING_OWNER_APPROVAL`. Key re-checks:

| Project | Version | License | Proposed | Concern |
|---|---|---|---|---|
| Giro3D | 2.0.7 | MIT | ADOPT_CANDIDATE | Clean, 939 tests passed |
| Cesium | 1.147.0 | Apache-2.0 | ADOPT_CANDIDATE | Ion is separate paid service |
| deck.gl | 9.4.0 | MIT | ADOPT_CANDIDATE | GPU required |
| LangGraph | 1.2.22 | MIT | ADOPT_CANDIDATE | Prompt-injection risk |
| Wflow.jl | 1.0.4 | MIT | INTEGRATE_CANDIDATE | Julia runtime |
| MODFLOW 6 | 6.8.1 | CC0-1.0 | INTEGRATE_CANDIDATE | Pair with FloPy |
| TiTiler | 2.4.1 | MIT | INTEGRATE_CANDIDATE | GDAL libs |
| Spree | 6.0.5 | BSD-3-Clause | INTEGRATE_CANDIDATE | Rails stack; multi-vendor out-of-box |
| Novu | UNKNOWN | MIT + Proprietary EE | LEGAL_REVIEW_REQUIRED | EE approval required |
| Temporal | UNKNOWN | MIT | DEFER | Heavy; start internal |
| Keycloak | 999.0.0-SNAPSHOT | Apache-2.0 | UPSTREAM_ADOPT | Heavy JVM |
| Directus | 12.6.1 | MSCL-1.0-GPL | REJECT | Source-available, not open source |
| ERPNext | 16.35.0 | GPL-3.0 | DEFER | Strong copyleft |
| Dolibarr | 24.0.3 | GPL-3.0 | DEFER | Strong copyleft |
| Grafana | 13.4.0-pre | AGPL-3.0-only | DEFER | AGPL network disclosure |
| PCSE | 6.0.13 | EUPL-1.1 | DEFER | Copyleft |
| WPS | 4.7.0 | **NOT FOUND in archive** | DEFER | License unconfirmed |
| FloPy | 3.13.0.dev0 | USGS public domain | UPSTREAM_ADOPT | Dev version, not stable |
| RothC | — | — | **MISSING** | Not in matrix (H1) |

**Finding U-1 (MEDIUM):** FloPy is a dev version (3.13.0.dev0), not a stable release; the matrix notes this but the owner should decide whether to pin a stable release.
**Finding U-2 (HIGH):** WPS license not found in archive; upstream WRF is Apache-2.0 but unverified from the archive. Legal review required before any use.
**Finding U-3 (HIGH):** RothC missing (H1).

---

## 10. OWNER DECISIONS

| # | Decision | Status | Finding |
|---|---|---|---|
| D-01..D-22 | V2 open decisions | `OWNER_DECISION_REQUIRED` | 22 items, all pending |
| D-23 | Jurisdiction | `OWNER_DECISION_REQUIRED` | Restored; scope/options documented |
| D-24 | Commercial Approval | `OWNER_DECISION_REQUIRED` | Restored; copyleft/EE boundary documented |
| D-25 | Budget | `OWNER_DECISION_REQUIRED` | Restored; cost envelope documented |

- **No decision is marked approved.** The only "APPROVED" string is in "DESIGN — NOT APPROVED" (false positive).
- **Dependencies:** Budget → Jurisdiction + Commercial Approval → Deployment + Upstream Matrix. Documented in `OWNER-DECISION-RESTORATION.md`.
- **Finding OD-1 (OBSERVATION):** D-23/D-24/D-25 are restored but the V2 body's §16 does not reference them; the master's open-decisions section should be the single source of truth.

---

## 11. RECOMMENDED CORRECTIONS

| # | Correction | Priority | Owner decision? |
|---|---|---|---|
| RC1 | Add 4-state HyDroMA result model (`UNCALIBRATED`/`CALIBRATED`/`VALIDATED`/`NOT_VALIDATED`) + `validation_state` field (C1) | CRITICAL | No |
| RC2 | Update master §6 and §16 to match consolidated matrix + role matrix (C2/H4) | CRITICAL | No |
| RC3 | Add RothC as 55th entry with `INSUFFICIENT_EVIDENCE` (H1) | HIGH | Yes |
| RC4 | Add AI security submodules: injection guard, agent-to-agent, cost control (H2) | HIGH | No |
| RC5 | Add agent-to-agent + human-approval to security doc (H3) | HIGH | No |
| RC6 | Add per-domain HyDroMA contracts (water/soil/climate/crop/RS/vegetation) (S-1) | HIGH | No |
| RC7 | Add sitemap `states` legend; map pages to module IDs (X4/X5) | MEDIUM | No |
| RC8 | Add `ACC-PERIOD` module and financial idempotency control (F-1/F-2) | MEDIUM | No |
| RC9 | Clarify WPS license; decide on FloPy stable pin (U-1/U-2) | MEDIUM | Yes |

**No correction was applied by this review (read-only).**

---

## 12. FINAL VERDICT

**`ACCEPTED_WITH_CORRECTIONS`**

The consolidated-v1 set is **structurally consistent and fundamentally sound** (14 layers, 188 modules, 40 role entries, 227 pages, 21 workflows, 54 upstream projects, 25 open decisions — all validated). However, it requires the corrections in §11 before it can be treated as a coherent architecture reference:

- **CRITICAL:** HyDroMA 4-state model (C1) and master body integration (C2).
- **HIGH:** RothC gap (H1), AI security modules (H2/H3), per-domain HyDroMA contracts (S-1).
- **MEDIUM:** sitemap legend/module mapping, financial period/idempotency, WPS license, FloPy pin.

**No project is approved for production, legal, security, scientific, or economic use.** All owner decisions remain open. Awaiting owner review.

**END OF REVIEW.**