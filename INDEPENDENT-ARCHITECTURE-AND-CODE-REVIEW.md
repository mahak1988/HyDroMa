# INDEPENDENT ARCHITECTURE AND CODE REVIEW
## Eco Nojin — verification of the primary development agent's deliverables

**Document ID:** INDEPENDENT-ARCHITECTURE-AND-CODE-REVIEW
**Version:** 1.0
**Date:** 2026-11-18
**Reviewer role:** Independent Principal Architecture Reviewer (not the implementation agent)
**Target:** `D:\Nojin`
**Mode:** READ-ONLY. No source code was modified. No defect was fixed. No Git operation performed. No owner decision approved.
**Method:** every claim reproduced by direct filesystem inspection and command execution; completion claims were not trusted a priori.

---

## 1. Verification Matrix (claimed vs independently observed)

| # | Claim by primary agent | Method used | Observed | Verdict |
|---|---|---|---|---|
| V1 | 5 deliverables at `D:\Nojin\` | `glob *.md/*.csv` | all 5 present | **TRUE** |
| V2 | geo-measure `23 tests / 23 pass / 0 fail` | `node --test` in slice dir | tests 23, pass 23, fail 0 | **TRUE** |
| V3 | CSV = 54 rows, 1:1 with registry | `Import-Csv` + `Compare-Object` | 54 rows, 13 cols, **0 name diff** | **TRUE** |
| V4 | License risk `40 LOW / 5 MED / 8 HIGH / 1 REVIEW` | CSV `Group-Object` | 40 / 5 / 8 / 1 | **TRUE (exact)** |
| V5 | Wave split `5 / 15 / 22 / 12` | CSV `Group-Object` | 5 / 15 / 22 / 12 | **TRUE (exact)** |
| V6 | Archives = 58; registry dirs = 54 | recursive file count | **58 files** (9 batch subdirs); 54 dirs | **TRUE** |
| V7 | Env: Node 26.13.0, npm 11.20, git 2.49 | `node -v`, `npm -v`, `git --version` | v26.13.0 / 11.20.0 / 2.49.0 | **TRUE** |
| V8 | `Python: not available` | `python --version`; `py -3 --version` | `python` alias broken, **`py -3` = Python 3.12.10 exists** | **FALSE** → F-01 |
| V9 | No Git repository | `git rev-parse --is-inside-work-tree` | `fatal: not a git repository` | **TRUE** |
| V10 | Protected dirs untouched (HyDroMA 11/15, eco_nojin 11/12) | `LastWriteTime` | 11/15/2026, 11/12/2026 (predate today) | **TRUE** |
| V11 | Archives/registry not modified | newest recursive mtime | archives 11/17 05:53, registry 11/17 18:52 (both pre-today) | **TRUE** |
| V12 | Module catalog `194 = 178 + 12 + 4` | `MODULE-EXECUTION-MAP.csv` group | 194 = MODULE 178 + AGENT_MANIFEST 12 + INTERNAL_CONTROL 4 | **TRUE** |
| V13 | 0 implemented modules (`194 DESIGN`) | `dev_status` group | DESIGN 194, others 0 | **TRUE** |
| V14 | No owner decision silently approved | grep every `APPROVED` line | all occurrences are `NOT APPROVED` / `OWNER_APPROVED` vocabulary / negation | **TRUE** |
| V15 | No secrets in new deliverables | regex scan (key/token/password/PEM) | 0 matches | **TRUE** |
| V16 | Upstream license/attribution preserved | per-dir LICENSE/COPYING check | 53/54 present; only `wps` missing (already documented NOT FOUND) | **TRUE** |

**16 of 17 claims reproduced exactly. One factual claim is false (V8).**

---

## 2. Findings

### F-01 — Python runtime misreported as unavailable
- **Severity:** HIGH
- **File:** `D:\NOJIN\DEVELOPMENT-FOUNDATION-REPORT.md`
- **Location:** §2 "Verified environment", row `Python | not available`
- **Reproduction:** `python --version` → MS-Store alias error; **`py -3 --version` → `Python 3.12.10`**
- **Expected:** environment table states Python 3.12.10 is available via the `py` launcher.
- **Actual:** report declares Python "not available", implying no scientific runtime exists.
- **Technical impact:** The entire HyDroMA engine stack (`xclim`, `aquacrop-ospy`, `landlab`, `flopy`, `invest`, `pygeoprocessing`, `titiler`, `pgstac`) is Python-based. Declaring Python absent distorts the framework and integration assessment, and it contradicts the same plan's Wave 1/2 which schedules Python services to "start here". An owner could ratify a Node-only runtime assuming the scientific layer cannot run locally.
- **Recommended correction:** Replace the row with the verified fact (`py -3 = 3.12.10`; `python` alias unconfigured) and note the implication: a Python toolchain exists but is un-provisioned for the engine.
- **Owner approval required:** No (factual correction). Owner decision needed later for `D-17` scientific runtime provisioning.

### F-02 — Design-system QA evidence understated / inconsistent with existing QA report
- **Severity:** MEDIUM
- **File:** `D:\NOJIN\ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md`
- **Location:** §3 "Maturity" — "not contrast/WCAG/keyboard/AT tested"
- **Reproduction:** open `D:\NOJIN\brand\eco-nojin-design-system-v2-qa\reports\final-qa-report.md` §Summary: `WCAG Contrast PASS (2 documented)`, `Keyboard PASS`, `Responsive PASS`, `RTL PASS`, `Screen Reader NOT_TESTED`.
- **Expected:** maturity statement reflects the newest QA evidence: contrast, keyboard, responsive, RTL tested and passing (2 residual contrast fails documented); only screen-reader untested.
- **Actual:** doc states contrast/WCAG/keyboard untested — matching the older `validation-report.md`, not the newer `final-qa-report.md`.
- **Technical impact:** Contradicts the deliverable's own "evidence-based, never overstate" standard (in the safe direction, but still inaccurate). Downstream planning may redo already-passed checks or misjudge the visual baseline.
- **Recommended correction:** Cite `final-qa-report.md` explicitly and restate: contrast/keyboard/responsive/RTL PASS; SR NOT_TESTED; owner approval absent.
- **Owner approval required:** No.

### F-03 — Upstream access path contradiction (Keycloak/Temporal)
- **Severity:** MEDIUM
- **File:** `D:\NOJIN\ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md`
- **Location:** §2.0 table Boundary 3 ("Primary upstream touchpoints: keycloak, temporal/kestra, erpnext/dolibarr, farmos") vs §10 Boundary 8 ("Identity upstream … OIDC adapter") and §12 rule 6 ("Upstream code never crosses the Integration Layer boundary un-wrapped").
- **Reproduction:** compare §2.0 row 3 with §10 bullet 3 and §12 rule 6.
- **Expected:** a single, unambiguous statement of whether identity/workflow upstreams are reached directly by Core or only via the Integration Layer.
- **Actual:** Keycloak and Temporal are listed as direct Core touchpoints and also as Integration Layer adapters; the two statements conflict.
- **Technical impact:** Dependency-direction ambiguity for two security-critical boundaries; violates the document's own anti-corruption rule; invites direct/unwrapped integration of an IdP.
- **Recommended correction:** Remove keycloak/temporal from Boundary 3 touchpoints; make them Integration Layer adapters only (consistent with rule 6).
- **Owner approval required:** No (architecture consistency). IdP choice remains `D-04` OPEN.

### F-04 — Framework evaluation omits Angular despite environment-provided Angular capability
- **Severity:** MEDIUM
- **File:** `D:\NOJIN\DEVELOPMENT-FOUNDATION-REPORT.md`
- **Location:** §4 "Framework candidates evaluated" (7 candidates; no Angular)
- **Reproduction:** the workspace ships an official Angular v20+ capability (skill `angular-http`, Angular `resource()`/`httpResource()`), and the architecture corpus contains React-specific provisions; Angular is absent from the scoring matrix.
- **Expected:** the stack with first-class support in the operating environment is at minimum scored and, if excluded, excluded with a stated reason.
- **Actual:** Angular never appears; the recommendation (Next.js/React) is therefore not tested against the environment's supported stack. §4.2 also leans on "GeoLibre is React 19" to disfavour Vue — an unverified premise.
- **Technical impact:** the "documented technical basis" for `B1` omits the one framework the environment is provisioned for; recommendation may conflict with available tooling and team capability.
- **Recommended correction:** Add Angular (and its SSR/i18n/RTL story) as an eighth candidate with the same weights, or record an explicit exclusion rationale.
- **Owner approval required:** Yes — this feeds `AUDIT-MISS-01` / `B1` (still OPEN; nothing approved).

### F-05 — Unsupported completeness claim ("every module maps to exactly one boundary")
- **Severity:** MEDIUM
- **File:** `D:\NOJIN\ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md`
- **Location:** §13 closing sentence: "Every one of the 178 catalogued modules maps into exactly one of Boundaries 1–8".
- **Reproduction:** §13 provides a boundary→BC/layer mapping only; no module-by-module table exists, and BC-PRES is split across Boundary 1 (UI-DESIGN) and Boundary 2 (UI-SHELL/UI-OFFLINE).
- **Expected:** either attach a 178-row module→boundary map, or state the mapping is at bounded-context granularity.
- **Actual:** an "exactly one" totality claim with no verifying artefact.
- **Technical impact:** an unverifiable completeness assertion weakens traceability; a module could be co-owned by two boundaries without detection.
- **Recommended correction:** downgrade the claim to BC-level, or generate the module→boundary map from `MODULE-EXECUTION-MAP.csv`.
- **Owner approval required:** No.

### F-06 — Wave 1 is not actually executable / not all low-risk
- **Severity:** MEDIUM
- **File:** `D:\NOJIN\NEXT-IMPLEMENTATION-PLAN.md`
- **Location:** §5.5 "Start-low-risk-high-value" (Wave 1: maplibre, giro3d, pystac, titiler, keycloak)
- **Reproduction:** Wave 1 includes `keycloak` (owner decision `D-04` OPEN → not low-risk) and `titiler`/`pgstac` (require a Python runtime the foundation report says is absent).
- **Expected:** Wave 1 contains only items that can be integrated now without an open owner decision and without an un-provisioned runtime.
- **Actual:** two of five "start here" items are gated (owner decision / missing runtime).
- **Technical impact:** following the plan literally stalls on Day 1; mislabels gated work as low-risk.
- **Recommended correction:** Move keycloak and titiler to Wave 2; Wave 1 = maplibre-gl-js, giro3d, pystac (client/contract libs only).
- **Owner approval required:** No for re-sequencing; `D-04` remains OPEN.

### F-07 — Integration-class vocabulary mismatch (6 defined, 4 used)
- **Severity:** LOW
- **File:** `D:\NOJIN\UPSTREAM-INTEGRATION-STATUS.csv` + `NEXT-IMPLEMENTATION-PLAN.md` §5.1
- **Location:** rubric defines `ADOPT/CUSTOMIZE/INTEGRATE/BUILD/DEFER/REJECT`; data uses `ADOPT 15 / INTEGRATE 6 / DEFER 29 / REJECT 4` = 54.
- **Reproduction:** `Group-Object integration_class`.
- **Expected:** each class either used or explicitly marked "no upstream applies".
- **Actual:** `CUSTOMIZE` and `BUILD` unused; the required internal **BUILD** set (accounting core, ledger, MRV issuance) has no row, so the CSV under-documents "build internally" work.
- **Technical impact:** the classification is complete for upstreams but silent on the largest custom-build domains.
- **Recommended correction:** add a companion "BUILD (no upstream)" list or a note that BUILD is out of the CSV's upstream scope.
- **Owner approval required:** No.

### F-08 — Deploy-unit names pre-empt an open decision
- **Severity:** LOW
- **File:** `D:\NOJIN\ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md`
- **Location:** `DU-CORE` / `DU-ENGINE` / `DU-GEO` used throughout; `D-01` (deployment topology) is OPEN.
- **Reproduction:** §15 lists `D-01` OPEN while §2.0 fixes deploy units.
- **Expected:** deploy units labelled `PROVISIONAL_PENDING_D-01`, or stated as "modular-monolith default per master §3.1".
- **Actual:** three deploy units are named as settled.
- **Technical impact:** low; could be read as topology approval.
- **Recommended correction:** tag with "provisional, subject to D-01".
- **Owner approval required:** `D-01` remains OPEN.

### F-09 — Unverified premise: "GeoLibre is React 19"
- **Severity:** LOW
- **File:** `D:\NOJIN\DEVELOPMENT-FOUNDATION-REPORT.md` §4.2
- **Reproduction:** `experiments/geospatial-poc/EVALUATION_REPORT.md` marks GeoLibre `PARTIALLY_VERIFIED` (build blocked); its React version was not independently confirmed in review scope.
- **Expected:** mark as `ASSUMPTION` or verify.
- **Actual:** asserted as fact and used to favour React.
- **Technical impact:** minor bias in the recommendation.
- **Recommended correction:** label as assumption or cite the package manifest.
- **Owner approval required:** No.

### F-10 — "No existing document overwritten" is unprovable without VCS
- **Severity:** LOW (limitation, not fault)
- **File:** `D:\NOJIN\FIRST-PRODUCT-SLICE-REPORT.md` §4
- **Reproduction:** no repository → no diff/commit history exists to prove non-overwrite.
- **Expected:** the claim should be marked "cannot be cryptographically verified; no VCS".
- **Actual:** stated as fact.
- **Technical impact:** honest but currently unverifiable; reinforces why `G0` matters.
- **Recommended correction:** annotate the limitation.
- **Owner approval required:** No.

---

## 3. Category Results (A–G)

| Dimension | Result | Basis |
|---|---|---|
| **A. Ecosystem architecture** | SOUND WITH DEFECTS | 9 boundaries coherent; F-03 (upstream path), F-05 (mapping claim), F-08 (deploy naming) |
| **B. Framework & toolchain** | PARTIAL | F-01 (Python), F-04 (Angular omitted), F-09; env/build claims otherwise true; no build exists |
| **C. Upstream integration** | PASS | 54=54, license 40/5/8/1, 53/54 LICENSE files, archives untouched, `wps` gap documented |
| **D. geo-measure** | PASS (unit only) | 23/23 reproduced; fail-closed verified; `validated:false` honest; projected CRS deliberately unimplemented (not a defect) |
| **E. Frontend implementation** | NOT APPLICABLE (none) | 0 app files; PUB-01 correctly `BLOCKED`; no fabricated data found |
| **F. Security** | PASS (for scope) | no secrets; no unsafe storage; no network deps added; no auth boundary claimed |
| **G. Owner governance** | PASS | 0 decisions approved; all `APPROVED` strings are negations; financial/token/ECO/HIC/chain untouched and OPEN |

---

## 4. Critical Blockers

1. **None introduced by this agent.** No code breach, no secret, no silent approval, no protected-path write.
2. **Pre-existing blockers that persist** (not caused by, and correctly not bypassed by, this agent):
   - `AUDIT-MISS-01` / `B1` framework — OPEN.
   - `A1` repository + Git authorization — OPEN (no repo exists).
   - `GOV-03` / `GOV-08` authority — OPEN.

---

## 5. High-Priority Corrections

1. **F-01** — correct the Python availability statement (HIGH).
2. **F-02** — align design-system maturity text with `final-qa-report.md` (MEDIUM, but affects the "evidence-based" claim).
3. **F-03** — remove keycloak/temporal from Core touchpoints; Integration Layer only.
4. **F-04** — add Angular to the framework matrix before the owner decides `B1`.
5. **F-06** — re-sequence Wave 1 to unblocked items only.

---

## 6. Verified Successful Capabilities

- `geo-measure` kernel: `IMPLEMENTED` + `UNIT_TESTED` (23/23, reproduced), fails closed on missing/projected/unknown CRS, reports `validated:false`. Correctly **not** claimed as VALIDATED.
- `UPSTREAM-INTEGRATION-STATUS.csv`: 54 rows, 0 name mismatch with registry, license/wave tallies exact.
- Archive custody intact: 58 archives, 54 registry dirs, both untouched today; 53/54 license files present.
- Protected directories (`D:\HyDroMA`, `D:\eco_nojin`) untouched.
- No Git/deploy/remote action; no secrets; no fabricated UI; honest `BLOCKED` status for PUB-01.

---

## 7. Unverified Claims

| Claim | Why unverified |
|---|---|
| "Python not available" | **Contradicted** — Python 3.12.10 present (`py -3`) |
| "not contrast/WCAG/keyboard tested" | **Contradicted** by `final-qa-report.md` |
| "Every module maps to exactly one boundary" | No module-level mapping artefact |
| "GeoLibre is React 19" | Assumption; GeoLibre only PARTIALLY_VERIFIED |
| "No existing document overwritten" | No VCS to prove it |

---

## 8. Owner Decisions Required (unchanged, all OPEN)

Framework/rendering (`AUDIT-MISS-01`/`B1`) · Repository+Git (`A1`) · Authority matrix (`GOV-03`) · Agent policy (`GOV-08`) · DB (`D-02`) · Tenancy (`D-03`) · IdP (`D-04`) · Accounting (`D-05`) · Marketplace (`D-06`) · Scientific models (`D-17`) · Soil carbon/RothC (`D-18`) · High-risk licenses (`D-19`) · Deployment topology (`D-01`) / scenario (`D-13`) · Jurisdiction (`D-14`) · EcoCoin/HIC (`D-15`) · Payments (`D-16`) · Identity/colour/type/logo (`ID-07`/`COLOR-01`/`TYPO-*`).

No decision was approved in this review.

---

## 9. Exact Next Implementation Steps (evidence-gated)

1. **Owner `G0`** — create repository at an owner-named path; authorize Git; first commit = design-system baseline.
2. **Owner `G0b`** — record `GOV-03` + `GOV-08` (authority + agent policy) with owner id and date.
3. **Agent (doc-only, no code)** — apply corrections F-01…F-06 to the five deliverables; add Angular to the framework matrix and re-issue the recommendation as non-binding.
4. **Owner `G1`** — ratify framework/rendering + monorepo layout as an ADR.
5. **Engineering `G2`** — single token source (remove `tokens.css`/`themes.css` duplication).
6. **Engineering `G3`** — one gate: typecheck + lint + unit (incl. geo-measure) + build; green on clean install.
7. **Engineering `G4`** — build `PUB-01` (4 states, 375/768/1440, fa-RTL/en-LTR, keyboard) only after G1–G3.

---

## 10. Final Verdict

**ACCEPTED_WITH_CORRECTIONS**

Rationale: all owner constraints were respected (no repo, no deploy, no protected-path writes, no silent approvals, archives/licenses intact). 16 of 17 factual claims reproduce exactly. One HIGH factual error (Python availability) and several MEDIUM consistency defects (F-02…F-06) must be corrected before the deliverables are used as a decision basis. No implementation was falsely claimed; `PUB-01` is honestly `BLOCKED`.

**END OF INDEPENDENT ARCHITECTURE AND CODE REVIEW.**
