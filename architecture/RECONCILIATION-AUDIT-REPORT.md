# RECONCILIATION & EVIDENCE AUDIT REPORT
## Eco Nojin Architecture — Two-Source Reconciliation

**Date:** 2026-11-17
**Mode:** READ-ONLY audit. No file was modified, deleted, moved, or overwritten. Only this report was created.
**Scope:** `D:\Nojin\architecture\` (12 files produced by two independent agents).
**Verdict legend:** `CONSISTENT` · `INCONSISTENT` · `MISSING_EVIDENCE` · `OWNER_DECISION_REQUIRED` · `NOT_VERIFIABLE`.

---

## 1. FILE INVENTORY (12 files)

| # | File | Size (bytes) | Last modified | SHA-256 | Language | Version / ID | Role |
|---|---|---|---|---|---|---|---|
| 1 | `ECO-NOJIN-MASTER-ARCHITECTURE.md` | 30,619 | 2026-11-17 06:25:44 | `A1E8FFC193C564236BE2E8DEA8AE9B484C36B16B5378E3CAE08805711D659B53` | EN | v1.0 DRAFT + §14 QC review | **Set 1** master (superseded) |
| 2 | `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` | 58,490 | 2026-11-17 06:36:15 | `CC131B2A1FC7D653450F9DD40791E26B2B3BEE05EFE501EFD8B049E6388BBA9B` | FA | v2.0 (630 lines, 21 sections) | **Set 2** master (candidate reference) |
| 3 | `ECO-NOJIN-MODULE-CATALOG.csv` | 49,336 | 2026-11-17 06:37:24 | `9CF5EB3311D77CE938554733C82B7944E995E2C84C8619B2E96057E714FDC929` | EN headers (bilingual) | 188 rows × 20 cols | **Set 2** |
| 4 | `ECO-NOJIN-USER-ROLE-MATRIX.csv` | 9,510 | 2026-11-17 06:31:21 | `BAA3BA2F10CCF7117B2394A22AC60091F3EFFDF4BFEC5C3E61595122FB810A6B` | EN headers (bilingual) | 34 rows × 12 cols | **Set 2** |
| 5 | `ECO-NOJIN-FRONTEND-SITEMAP.csv` | 57,401 | 2026-11-17 06:35:38 | `2CC12C81078E6C255D4D59F47BDED7709179B8083246B3B10A88BB342D3CDD87` | EN headers (bilingual) | 227 rows × 14 cols | **Set 2** |
| 6 | `ECO-NOJIN-WORKFLOW-CATALOG.csv` | 10,821 | 2026-11-17 06:31:39 | `4E9364331F83C3D98B54ABCE763321BF25ADAE86462BED849F92CCA43CBD2DC6` | EN headers (bilingual) | 21 rows × 12 cols | **Set 2** |
| 7 | `ECO-NOJIN-DATA-DOMAIN-MODEL.md` | 21,513 | 2026-11-17 06:34:06 | `694CDDC3B1AD231590941566E42FADDE36D12C2D9557DBA670F281BA0AAC0DDC` | FA | 11 sections + erDiagram | **Set 2** |
| 8 | `HYDROMA-SCIENTIFIC-ENGINE-ARCHITECTURE.md` | 20,953 | 2026-11-17 06:33:44 | `43F9EBE5262F029587CD7D234FCC0A3DFEA5879EB12C2523B63B208997E3D01C` | FA | 14 components | **Set 2** |
| 9 | `ECO-NOJIN-UPSTREAM-DECISION-MATRIX.csv` | 10,458 | 2026-11-17 06:24:26 | `29255471373D024562C0077F2C63DFFB27A7ABA3BCB68B7623E9FEE58523BC21` | EN | 54 rows × 13 cols | **Set 1** upstream (survives) |
| 10 | `ECO-NOJIN-UPSTREAM-DECISION-MATRIX-V2.csv` | 15,741 | 2026-11-17 06:34:08 | `ABE3EFEB94091713D946B7B68BC0A470FAA7D9A5788DC3C9F71B8CC90BBCF851` | EN | 54 rows × 18 cols | **Set 2** upstream |
| 11 | `ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md` | 22,181 | 2026-11-17 06:33:05 | `28C0B4BC0D0889A8D31582D8FF6DD26ECB0FAF9E2D1258491D0B8D52FD0D35EC` | FA | 3 deployment scenarios | **Set 2** |
| 12 | `ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md` | 16,669 | 2026-11-17 06:36:50 | `75E9005578E4864869C6CBB7698E61E51B2E0ADF265F8D47B1E5BE4DCD2E726E` | FA | D-01..D-22 (22 items) | **Set 2** |

### 1.1 Set identification
- **Set 1** = the architecture produced earlier in this project (English v1 master + English upstream matrix). Its module/role/page CSVs and open-decisions doc were **overwritten** by Set 2.
- **Set 2** = the concurrent Nemotron 3 Ultra review output (Persian V2 master + bilingual CSVs + Persian companion docs). It is the **current on-disk state**.

### 1.2 Surviving Set 1 artifacts
Only two Set 1 files survive: `ECO-NOJIN-MASTER-ARCHITECTURE.md` (v1) and `ECO-NOJIN-UPSTREAM-DECISION-MATRIX.csv`. All other Set 1 files were overwritten → content-level diff for those is **MISSING_EVIDENCE**.

---

## 2. REPORTED DIFFERENCES — VERIFICATION

| Metric | Set 1 (reported) | Set 2 (reported) | On-disk (measured) | Match |
|---|---:|---:|---:|---|
| Modules | 182 | 188 | **188** | Set 2 ✓ |
| Roles | 33 | 34 | **34** | Set 2 ✓ |
| Pages | 219 | 227 | **227** | Set 2 ✓ |
| Workflows | 21 | 21 | **21** | both ✓ |
| Open decisions | 24 | 22 | **22** | Set 2 ✓ |

**Conclusion:** the on-disk CSVs are **Set 2**. Set 1 counts are not directly verifiable from files (overwritten) → `MISSING_EVIDENCE` for Set 1 content.

---

## 3. CONTENT-LEVEL DIFFERENCES (ID / ROW)

### 3.1 Modules 182 → 188 (+6)
| # | Added module | Evidence | Architecture logic |
|---|---|---|---|
| 1 | `MRV-ESTIMATE` — Internal Carbon Estimate | Present in catalog (layer L12 MRV) | **Sound.** Task requires separating internal HyDroMA results from official carbon credits. |
| 2 | `MRV-CREDIT` — Registry Credit Record | Present in catalog (layer L12 MRV) | **Sound.** Makes the internal-vs-official credit boundary explicit. |
| 3–6 | 4 further modules | **Not identifiable** — Set 1 module catalog was overwritten | `MISSING_EVIDENCE` |

- **Architecture logic:** the two identified additions are architecturally justified (they implement the task's MRV separation requirement). No evidence of an unjustified addition among the identified ones.
- **Consistency:** reflected in the V2 master (§4.12 MRV, §11 digital-economy boundaries) and the new MRV nav group. **CONSISTENT** for the 2 identified.

### 3.2 Roles 33 → 34 (+1)
| # | Added role | Evidence | Architecture logic |
|---|---|---|---|
| 1 | `MRV_VERIFIER` — MRV Verifier | V2 master L412: "شامل MRV_VERIFIER مستقل از MRV_SPECIALIST"; present in role matrix | **Sound.** Separates MRV preparation (specialist) from verification (4-eyes). |

- **Consistency:** MRV_VERIFIER is referenced by the new MRV pages (MRV-06 Verification). **CONSISTENT.**

### 3.3 Pages 219 → 227 (+8)
| # | Added pages | Evidence | Architecture logic |
|---|---|---|---|
| 1–8 | `MRV-01`..`MRV-08` (MRV Home, Monitoring, Baselines, Reports, Report Detail, Verification, Evidence, Carbon Credits) | Present in sitemap under new `MRV` nav group | **Sound.** Consistent with the new MRV modules and MRV_VERIFIER role. |

- **Consistency:** 8 new pages ↔ 2 new MRV modules + 1 new MRV role + new nav group. **CONSISTENT.**

### 3.4 Workflows 21 → 21 (0)
- Count unchanged. **But** workflow actor tokens reference generic roles not in the matrix (see §5.2). → **INCONSISTENT** (not a count issue).

### 3.5 Open decisions 24 → 22 (−2)
Content-level changes (Set 1 → Set 2):
| Change | Detail |
|---|---|
| **Merged** | Set 1 D10 Tokenomics → Set 2 D-15 EcoCoin/HIC (tokenomics folded in) |
| **Merged** | Set 1 D18 Time-series + D19 Analytical → Set 2 D-10 Object storage / D-12 BI |
| **Merged** | Set 1 D22 Testing thresholds + D23 Accessibility → Set 2 D-21 ASVS level |
| **Merged** | Set 1 D15 Container orchestration → Set 2 D-14 Hosting |
| **Dropped** | Set 1 D12 **Jurisdiction**, D21 **Commercial approval**, D24 **Budget** — **not present in Set 2** |
| **Added** | Set 2 D-09 AI model/provider, D-12 BI, D-14 Hosting, D-17 Scientific models, D-18 Soil carbon/RothC, D-19 Project accounting, D-21 ASVS, D-22 Content delivery |

- **Architecture logic:** the merges are reasonable. **However**, dropping **Jurisdiction**, **Commercial-use approval**, and **Budget** removes three owner-critical decisions. → **INCONSISTENT** (loss of coverage).
- **Consistency:** the V2 master's §16 references decisions but does not restore the dropped items. → `MISSING_EVIDENCE` for those three.

---

## 4. UPSTREAM MATRIX DIFF (both survive)

Both matrices cover the **same 54 projects** (no project added/removed). Columns differ (V1: 13, V2: 18).

### 4.1 Decision distribution
| Decision | V1 (Set 1) | V2 (Set 2) | Delta |
|---|---:|---:|---:|
| UPSTREAM_CUSTOMIZE | 2 | **0** | −2 |
| INTEGRATE | 9 | **19** | **+10** |
| UPSTREAM_ADOPT | 12 | 12 | 0 |
| DEFER | 28 | **20** | −8 |
| REJECT | 3 | 3 | 0 |

### 4.2 Projects whose decision changed (21)
`geolibre` (CUSTOMIZE→DEFER), `giro3d` (INTEGRATE→ADOPT), `wflow-jl` (ADOPT→INTEGRATE), `modflow6` (ADOPT→INTEGRATE), `landlab` (DEFER→INTEGRATE), `climate-indices` (DEFER→INTEGRATE), `cesium` (INTEGRATE→ADOPT), `deck-gl` (INTEGRATE→ADOPT), `titiler` (ADOPT→INTEGRATE), `pgstac` (ADOPT→INTEGRATE), `opentripplanner` (DEFER→INTEGRATE), `temporal` (INTEGRATE→DEFER), `langgraph` (INTEGRATE→ADOPT), `openforis-arena` (DEFER→INTEGRATE), `spree` (CUSTOMIZE→INTEGRATE), `novu` (DEFER→INTEGRATE), `collect-mobile` (DEFER→INTEGRATE), `mapserver` (DEFER→INTEGRATE), `opensearch` (DEFER→INTEGRATE), `seaweedfs` (DEFER→INTEGRATE), `invest` (DEFER→INTEGRATE).

### 4.3 Interpretation
- V1 is **conservative** (28 DEFER, 9 INTEGRATE).
- V2 is **aggressive** (20 DEFER, 19 INTEGRATE) — it more than doubles INTEGRATE and eliminates UPSTREAM_CUSTOMIZE.
- Both keep 12 UPSTREAM_ADOPT and the same 3 REJECT (`directus` MSCL, `node-red` insecure, `qloapps` OSL).
- **This is a material strategic difference** → `OWNER_DECISION_REQUIRED`. V2's additional 10 integrations (e.g., `novu`, `opensearch`, `seaweedfs`, `mapserver`, `invest`, `landlab`, `climate-indices`, `openforis-arena`, `collect-mobile`, `opentripplanner`) carry real ops/license weight (e.g., `novu` MIT+EE, `opensearch` heavy, `openforis-arena` heavy).

---

## 5. CROSS-DOCUMENT INTEGRITY

### 5.1 Module catalog integrity — `CONSISTENT`
- 188 modules, 14 layers (L1–L14), **0** missing `layer_code`, `deployment_unit`, `phase`, `owner_domain`; **0** duplicate `module_id`.
- Layer distribution: L1=3, L2=2, L3=18, L4=12, L5=14, L6=14, L7=9, L8=25, L9=35, L10=18, L11=5, L12=14, L13=11, L14=8 (sum=188).

### 5.2 Role references in Sitemap / Workflows — `INCONSISTENT`
- Sitemap references **38** role tokens not defined in the 34-role matrix (case-insensitive check): `AUTHENTICATED`, `GUEST`, `ANY REQUESTER`, `DOMAIN MANAGER`, `PROJECT OWNER`, `SCHEDULER`, etc.
- Workflows reference **11** actor tokens not in the matrix: `ANY REQUESTER`, `AUTHENTICATED USER`, `DOMAIN MANAGER`, `PROJECT OWNER`, `VILLAGE_MANAGER OR NOMAD_MANAGER`, `SCIENTIST THEN ENVIRONMENTAL_EXPERT`, `VENDOR OR MARKETPLACE_ADMIN`, etc.
- **Impact:** the RBAC model is not fully traceable; generic roles are undefined.
- **Evidence:** direct comparison of `allowed_roles` / `primary_actor` against `role_id`.

### 5.3 HyDroMA modules vs HyDroMA doc — `CONSISTENT`
- 14 SCI modules (`SCI-REG`, `SCI-ADP`, `SCI-INPUT`, `SCI-UNIT`, `SCI-SPATIAL`, `SCI-EXEC`, `SCI-QUEUE`, `SCI-SCEN`, `SCI-CAL`, `SCI-VAL`, `SCI-UNC`, `SCI-PROV`, `SCI-STORE`, `SCI-VIZAPI`) exactly match the HyDroMA doc's 14 components.

### 5.4 Data domain model — `CONSISTENT`
- 11 sections (principles, domain map, ownership/boundaries, entities/relationships, storage separation, standards, money/unit/time rules, domain events, read/report models, privacy/retention, open data decisions).
- Contains a mermaid `erDiagram`, 68 entity mentions, and explicit rules: UUIDv7, `tenant_id` + RLS, UTC, versioning, provenance.

### 5.5 Sensitive-item coverage — `CONSISTENT`
All 18 sensitive modules verified present:

| Sensitive area | Module(s) | Status |
|---|---|---|
| Double-entry accounting | `ACC-JOURNAL` | ✓ |
| Inventory separate from finance | `INV-STOCK`, `INV-WH` | ✓ |
| Orders | `MKT-ORDER` (L8) | ✓ |
| Multi-tenancy | `PLT-TEN` | ✓ |
| HyDroMA job control | `SCI-EXEC`, `SCI-QUEUE` | ✓ |
| HyDroMA provenance | `SCI-PROV` | ✓ |
| MRV internal estimate | `MRV-ESTIMATE` | ✓ |
| MRV official credit | `MRV-CREDIT` | ✓ |
| EcoCoin / HIC / wallet / tokenization | `DEC-LEDGER`, `DEC-WALLET`, `DEC-TOKEN` | ✓ (owner-gated) |
| AI guardrails / human approval | `AI-POLICY`, `AI-APPROVAL` | ✓ |
| i18n / multi-currency / UTC | `PLT-I18N`, `ACC-FX`, UTC rule | ✓ |
| Secrets / backup / DR | `INF-SECRETS`, `INF-BACKUP` | ✓ |

### 5.6 Master ↔ companion docs — `CONSISTENT` (structure)
- V2 master and v1 master agree on: 14 layers, P1–P15 principles, data stores, HyDroMA job contract, EcoCoin≠HIC, Decimal finance, MRV separation.

---

## 6. CONTRADICTIONS & PROVEN GAPS

| # | Finding | Type | Severity |
|---|---|---|---|
| C1 | **Upstream posture conflict**: V1 (28 DEFER / 9 INTEGRATE) vs V2 (20 DEFER / 19 INTEGRATE). Two different strategies coexist. | Contradiction | **High** |
| C2 | **Two upstream matrices coexist** (V1 13-col, V2 18-col). No document declares which is authoritative. | Ambiguity | **High** |
| C3 | **Generic roles undefined**: 38 sitemap refs + 11 workflow actor tokens reference roles absent from the 34-role matrix. | Inconsistency | **Medium** |
| C4 | **Dropped open decisions**: Jurisdiction, Commercial-use approval, Budget removed in Set 2. | Coverage gap | **High** |
| C5 | **Set 1 content overwritten**: 4 of 6 module additions and all Set 1 role/page content not verifiable. | Missing evidence | Medium |
| C6 | **Workflows count unchanged (21)** but actor tokens changed to undefined generic roles. | Inconsistency | Medium |

---

## 7. NOT VERIFIABLE / MISSING EVIDENCE

| # | Item | Reason |
|---|---|---|
| U1 | The 4 unidentified module additions (182→188) | Set 1 module catalog overwritten |
| U2 | Set 1 role/page content diff (33→34, 219→227) | Set 1 CSVs overwritten; only counts from mission brief |
| U3 | Whether V2's 19 INTEGRATE decisions were reviewed | No decision rationale per project in V2 (18 cols but rationale column exists — not audited) |
| U4 | Commit SHA / build status of any upstream | Out of scope (no build/test in this mission) |
| U5 | Legal validity of any license | No legal review performed |
| U6 | The 3 dropped open decisions' rationale | Not documented in Set 2 |

---

## 8. RECOMMENDED REFERENCE VERSION

**Recommended reference: Set 2 (V2 master + current CSVs)**, with conditions:
- **Master:** `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` (more complete: 630 lines, 21 sections, bilingual companion set).
- **CSVs:** current 188-module / 34-role / 227-page / 21-workflow set (structurally complete, 0 missing fields).
- **Upstream matrix:** **do not auto-adopt V2's 19 INTEGRATE.** Retain V1's conservative decisions (28 DEFER / 9 INTEGRATE) for HIGH-risk-license and heavy projects, and require owner approval for the 10 additional INTEGRATE decisions.

**Rationale:**
- Set 2 is the only complete on-disk set (Set 1 CSVs are gone).
- Set 2 fixes the MRV separation (ESTIMATE vs CREDIT) and adds MRV_VERIFIER — both required by the task.
- Set 2's upstream posture is materially riskier; the conservative V1 posture is safer for an early-stage product.
- **No single existing file is a complete, internally consistent reference** → a **consolidation pass is required** (owner-approved).

**Status:** `OWNER_DECISION_REQUIRED` — no reference is declared final.

---

## 9. OWNER DECISIONS REQUIRED

| # | Decision | Options | Recommendation |
|---|---|---|---|
| O1 | Which upstream matrix is authoritative? | V1 conservative / V2 aggressive / hybrid | Hybrid: V1 base + owner-approved additions |
| O2 | Restore the 3 dropped open decisions? | Restore / accept loss | **Restore** (Jurisdiction, Commercial approval, Budget) |
| O3 | Define generic roles (AUTHENTICATED, GUEST, DOMAIN MANAGER, PROJECT OWNER...) or replace with matrix roles | Define / replace | Replace with matrix roles; add GUEST if needed |
| O4 | Confirm MRV-ESTIMATE / MRV-CREDIT separation as final | Confirm / merge | Confirm (task requirement) |
| O5 | Which master is the reference? | v1 EN / V2 FA | V2 FA + English v1 as historical |
| 6 | Consolidate into a single consistent set? | Yes / no | **Yes** — a consolidation pass is needed |

---

## 12. FINAL RESULT

| Dimension | Verdict |
|---|---|
| File inventory | `CONSISTENT` (12 files, all hashed and classified) |
| Module catalog structure | `CONSISTENT` (188, 0 missing fields, 0 dupes) |
| Role matrix | `CONSISTENT` (34 roles) |
| Sitemap ↔ Role Matrix | `INCONSISTENT` (38 undefined role refs) |
| Workflow ↔ Role Matrix | `INCONSISTENT` (11 undefined actor tokens) |
| HyDroMA ↔ SCI modules | `CONSISTENT` (14 = 14) |
| Data domain model | `CONSISTENT` (11 sections, erDiagram, RLS/UTC/provenance) |
| Sensitive-item coverage | `CONSISTENT` (18/18 present) |
| Upstream matrices (V1 vs V2) | `INCONSISTENT` (21 decisions changed; strategic conflict) |
| Open decisions (Set 1 vs Set 2) | `INCONSISTENT` (3 owner-critical items dropped) |
| Set 1 content diff | `MISSING_EVIDENCE` (overwritten) |
| **Overall** | **`INCONSISTENT`** |

**Recommended reference:** **Set 2 (V2)** for master + CSVs, with the **V1 conservative upstream matrix** and **restored open decisions** — pending owner approval. A **consolidation pass** is required to produce a single, internally consistent, owner-approved architecture set.

**No project is approved. No technology is final. Awaiting owner decision.**