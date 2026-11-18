# FRONTEND STANDARDS GAP REPORT

**Audit date:** 2026-11-18
**Target directory:** `D:\Nojin\brand\eco-nojin-visual-identity-v3\`
**Basis:** 36 inspected documents (01–03, 05–37); 203 requirement rows in `FRONTEND-STANDARDS-COVERAGE-MATRIX.csv`; 13 conflicts; 480 recorded decisions
**Status:** REPORT ONLY — no gap has been closed, no document has been created or modified

---

## 1. Gap Identifier Convention

Each gap is identified as `GAP-nnn`, where `nnn` matches the corresponding requirement row `FE-COV-nnn` in the coverage matrix. This creates a direct, verifiable link between a coverage finding and its remediation item. Gaps that are not tied to a single requirement use `GAP-R##` (redundancy) or `GAP-X##` (cross-cutting).

---

## 2. Priority Definition (as applied)

| Priority | Meaning in this report |
|---|---|
| P0 | The affected implementation cannot safely begin until this is resolved |
| P1 | The affected product workflow cannot be accepted until this is resolved |
| P2 | Can be addressed during planned implementation |
| P3 | Improvement or optimization |

A gap is P0 only when a concrete implementation task would be unsafe, non-deterministic, or would have to be discarded after resolution. Documentation tidiness alone never justifies P0.

---

## 3. P0 Gaps — Blocking

### GAP-003 — Logotype architecture standard does not exist

| Field | Value |
|---|---|
| Category | Missing coverage |
| Evidence | `05-BRAND-APPLICATION-AND-ART-DIRECTION.md` §1 lists "سند ۰۴: معماری لوگوتایپ سه برند" among four preceding standards. No `04-*.md` exists. |
| Impact | No authoritative rule for logo construction, clear space, minimum size, lockups, or three-brand co-branding. Any logo work would invent its own rules. |
| Recommendation | **Owner decision required.** Three options: (a) locate an existing Document 04 outside this directory and inventory it; (b) author the logotype standard; (c) formally fold logotype architecture into `05` §8 (graphic architecture) and `09` §4 (logotype asset management) and record the waiver. |
| Separate document needed | Only under option (b). This audit does not create it. |

### GAP-042 — No application framework decision exists, while six standards assume React

| Field | Value |
|---|---|
| Category | Unverified assumption |
| Evidence | `14` §4 (`React.ReactNode`), `15` §26, `22` §20, `23` §8 (titled "REACT PERFORMANCE STANDARDS"), `27` §6, `29` §14 (React primitives). No decision register in 02–36 contains a framework entry. `37` §7.3 forbids silent framework decisions. |
| Impact | Every technical provision has an unrecorded precondition. Building on React without a record violates `37` §7.3; building on anything else invalidates six sections. |
| Recommendation | Record an explicit framework and rendering-strategy decision in the central register (`AUDIT-MISS-01`), and add a decision ID for it. Also amend `23` §8 so its heading is conditional rather than framework-specific. **Incorporate into `37` §7 as a mandatory decision record.** |
| Separate document needed | No — a decision record, not a standard. |

### GAP-013 — No dedicated authentication/authorization standard; three documents disagree on decision IDs

| Field | Value |
|---|---|
| Category | Incomplete standards + redundancy |
| Evidence | Authentication appears inside `22` §4–§6, `24` §4–§6 and `31` §6–§8. `SEC-D01` means "final session management architecture" in 22 §33, "final session and authentication architecture" in 24 §28, and "final authentication model" in 31 §32. |
| Impact | Login, session, refresh, MFA, passkeys, role model and tenant isolation have no single owner document. All authenticated work is blocked. |
| Recommendation | Designate one security document as authoritative (see CONF-002) and ensure it contains a consolidated authentication and authorization section. **Incorporate into the designated existing document.** |
| Separate document needed | Not recommended — it would add a fourth overlapping security document. |

### GAP-081 — Two incompatible normalized API error models

| Field | Value |
|---|---|
| Category | Conflict (documented as CONF-001) |
| Evidence | `30` §12.2 includes `cancelled` and `fieldErrors`, omits `not_found`; `34` §8.2 includes `not_found`, omits `cancelled` and `fieldErrors`. `30` §12.1 also declares a "Not Found Error" its own type does not model. |
| Impact | The API client, form error display and financial error surface cannot be implemented once. |
| Recommendation | Reconcile into one normative error contract inside the authoritative API document (CONF-013). **Incorporate into the designated existing document.** |
| Separate document needed | No. |

### GAP-X01 — Two complete API standards claim the same scope (CONF-013)

| Field | Value |
|---|---|
| Category | Redundancy + governance |
| Evidence | `30` and `34` have near-identical titles and cover the same concern; decision registers `API-D01..D24` and `D-034-01..D20` are disjoint but describe the same choices (for example `API-D05` vs `D-034-03`, `API-D06` vs `D-034-04`, `API-D09` vs `D-034-08`). |
| Impact | 44 API decisions stand where about 20 are needed; no document can be cited as the API baseline. |
| Recommendation | Owner designates the authoritative API document or commissions a merge. **Recorded as a governance action, not a new standard.** |
| Separate document needed | No — merging two existing documents is not creating a document. |

### GAP-221 — No approved browser and version support matrix

| Field | Value |
|---|---|
| Category | Missing coverage |
| Evidence | `20` §24 describes compatibility expectations without values; `20` §32 `D-020-07`, `21` §34 `A11Y-03` and `25` §29 `QA-D16` all record the matrix as OPEN; `37` §5.2 states "Actual browser support targets MUST be approved before release requirements are finalized." |
| Impact | No feature can be declared supported. Accessibility and performance test planning cannot be scoped. Every progressive-enhancement decision is arbitrary. |
| Recommendation | Ratify a matrix in `20` (the natural owner of cross-device concerns) and reference it from `21`, `25` and `37`. **Incorporate into `20`.** |
| Separate document needed | No. |

### GAP-254 — No coordinate reference system or projection standard

| Field | Value |
|---|---|
| Category | Missing coverage / research required |
| Evidence | `37` §5.5 requires CRS verification; `12` §9 and `14` §10 govern map presentation; no document defines approved CRS, axis order, reprojection rules or storage format. |
| Impact | Geospatial output can be silently wrong — the most damaging class of scientific error because it renders plausibly. |
| Impact detail | Cannot be mitigated by testing alone; requires an approved rule. |
| Recommendation | Add a CRS section to `12` (scientific data) with display rules, and a storage/transport rule to the designated API document. **Incorporate into `12` and the authoritative API document.** |
| Separate document needed | Not required, but a dedicated geospatial standard would be the cleaner long-term home. Owner decision. |

### GAP-284 — No transaction state machine or audit field standard

| Field | Value |
|---|---|
| Category | Missing coverage |
| Evidence | `37` §5.6 lists "transaction-state representation, order consistency, auditability" as verification areas. `34` §15 covers decimal and idempotency but not state transitions. `15` §16 covers financial interaction states generally. |
| Impact | A financial interface can present an order in a state the backend does not recognise. |
| Recommendation | Add a transaction-state and audit section to `34` §15 and cross-reference from `15` §16. **Incorporate into `34`.** |
| Separate document needed | No. |

---

## 4. P1 Gaps — Workflow Acceptance Blocking

| Gap | Category | Finding | Evidence | Recommendation | Separate doc |
|---|---|---|---|---|---|
| GAP-014 | Incomplete standard | No token build, serialization or distribution pipeline; "single source of truth" is a principle without a mechanism | `06` §2.1 and §16 | Add a token pipeline subsection to `06` §16 with an accompanying decision record | No |
| GAP-031 / GAP-004 | Redundancy | Two unreconciled component taxonomies | `06` §11 (7 categories) vs `14` §3 (4 levels) | Declare `14` authoritative for component classification, `06` for tokens and layers | No |
| GAP-043 | Incomplete standard | No application-level module boundary, dependency-direction or shared-package rule | `06` §16 and `14` §24 cover design-system assets only | Add an application structure section; `37` §8 Layer 1–2 is the current best approximation | No |
| GAP-053 | Unverified assumption | Multi-product boundary strategy undecided: shared shell vs independent applications | `D-035-07`, `STATE-D18`, `D-016-03` all OPEN | Decide before Phase 4 shell work | No |
| GAP-106 | Incomplete standard | Data classification described but not ratified | `31` §12; `SEC-D06` (22), `SEC-D07` (31), `SEC-D16` (24) OPEN | Ratify the scheme inside the authoritative security document | No |
| GAP-157 | Redundancy | Two accessibility acceptance-criteria sets | `21` §28 and §35 vs `32` §30 | Designate one set as the release gate (CONF-003) | No |
| GAP-158 | Missing coverage | No assistive-technology matrix | `A11Y-03`, `A11Y-D03`, `A11Y-D04` OPEN | Ratify alongside the browser matrix in `20`/`21` | No |
| GAP-231 | Missing coverage | No canonicalization, Open Graph or structured-data specification | `37` §5.3 lists them as verification areas only | Add to `35` §18 (route metadata) | No |
| GAP-232 | Missing coverage | No sitemap generation or robots policy | `37` §5.3 | Add to `35` §18 and `19` §22 | No |
| GAP-242 | Incomplete standard | PWA architecture, manifest strategy, update UX and installability are absent; offline coverage is fragmented across 22, 26, 29, 31, 34, 36 | `37` §5.4 | Add a PWA section to `26` (deployment) with references from `29` §11 | Owner decision: a dedicated PWA standard would be justified but cannot be created in this mission |
| GAP-272 | Incomplete standard | Scientific provenance required but no field-level contract | `34` §14; `D-034-18` OPEN | Define in the authoritative API document | No |
| GAP-273 | Incomplete standard | Model and dataset version identification required but unspecified | `37` §5.5 | Add to `12` and the API contract | No |
| GAP-274 | Missing coverage | No reproducibility or determinism requirement for displayed scientific results | No document addresses it | Add to `12` §23 alongside the capability status model | No |
| GAP-280 | Conflict | Decimal rule stated at MUST / recommended-mandatory / SHOULD levels | `14` §14, `34` §15.2, `36` §5.3, `31` §14 | Restate once at MUST in the authoritative document (CONF-011) | No |
| GAP-312 | Missing coverage | No administrative bulk-operation, destructive-action or approval-workflow standard | `36` covers general forms; `31` §23 covers admin security only | Add to `16` §10 and `36` §10 | No |
| GAP-303 | Missing coverage | No booking, availability, cancellation or reservation-integrity standard for tourism | Tourism coverage is brand, IA, content and interaction only | Requires domain research; add to `16` §8 as a section, or accept the limitation explicitly | Owner decision — domain standard may be justified |
| GAP-343 | Incomplete standard | Requirement identifiers proposed (`FE-[DOMAIN]-[NNN]`) but never assigned | `37` §6.2 | Assign IDs in a documentation pass; this audit supplies provisional `FE-COV-*` IDs only | No |
| GAP-355 | Missing deliverable | `FRONTEND-IMPLEMENTATION-BASELINE.md` and `FRONTEND-IMPLEMENTATION-TRACEABILITY.csv` do not exist | `37` §16 DEL-06, DEL-07 | Produce during Phase 2 of the roadmap; outside this audit's scope | No |
| GAP-222 | Incomplete standard | WebGL/GPU fallback expected but has no acceptance criteria or test matrix | `23` §18; `37` §5.2 | Add fallback acceptance criteria to `23` §18 | No |
| GAP-255 | Missing coverage | No geospatial privacy policy | `SEC-D21` OPEN; `12` §22 general | Ratify in the authoritative security document | No |
| GAP-196 | Unverified assumption | Test tooling entirely undecided | `QA-D01..D07` OPEN | Decide with the framework decision | No |

---

## 5. P2 Gaps — Resolve During Implementation

| Gap | Category | Finding | Evidence | Recommendation |
|---|---|---|---|---|
| GAP-005 | Conflict | Two breakpoint systems (5 tokens vs 7 ranges; 360/480 have no token) | `06` §9.3 vs `20` §4 | Unify in `06` tokens and regenerate `20` §4 |
| GAP-011 | Conflict | Decimal normative strength varies | see GAP-280 | Same remediation; listed separately because the strength issue also affects non-monetary numeric rules |
| GAP-012 | Redundancy | State management decisions recorded twice under two ID families | `15` §27 vs `29` §21 | Declare `29` authoritative for state architecture |
| GAP-051 | Incomplete | Page Registry structure defined, never populated | `16` §25 | Populate during Phase 6 |
| GAP-052 | Incomplete | Route Registry structure defined, never populated | `35` §27 | Populate during Phase 4 |
| GAP-105 | Incomplete | Consent and retention described, not decided | `SEC-D15`, `SEC-D17` (24); `SEC-D08`, `SEC-D09` (31) | Ratify with the security decision set |
| GAP-132 | Incomplete | Offline queue and conflict policy undefined | `STATE-D10`, `STATE-D11` | Decide before Phase 10 offline work |
| GAP-145 | Incomplete | Draft persistence strategy and sensitive-form classification undecided | `FR-D05`, `FR-D06` | Decide before form infrastructure |
| GAP-166 | Incomplete | Translation governance roles undecided | `D-019-09` | Decide with content governance |
| GAP-184 | Incomplete | Low-end device threshold undefined | `PERF-D06`, `D-020-05` | Set with the performance budget |
| GAP-214 | Incomplete | Telemetry retention, consent and anonymization undecided | `OBS-D10`, `OBS-D12`, `OBS-D15`, `OBS-D16` | Set with observability tooling |
| GAP-223 | Incomplete | Device test matrix list undefined | `D-020-02` | Set with the browser matrix |
| GAP-264 | Incomplete | Chart component contract undefined | `D-014-06` | Decide before chart components |
| GAP-035 | Incomplete | Component documentation tooling undefined | `D-014-02` | Decide before component docs |
| GAP-155 | Incomplete | Touch target internal target stated in only one of two accessibility documents | `32` §13 (24×24) vs `21` §13 | Consolidate; record one internal target |
| GAP-165 | Verified, no gap | Date/calendar handling consistent across `13` §16–17 and `28` §8 | — | No action; recorded here to document that the domain was checked |

---

## 6. P3 Gaps — Improvement

| Gap | Category | Finding | Recommendation |
|---|---|---|---|
| GAP-007 | Metadata | Four ID namespaces (`EN-VI`, `EN-VIS`, `EN-FE-STD`, `EN-FE`) plus 11 documents with no ID; three documents declare dangling parent ranges | Adopt one schema and publish a number-to-ID mapping table (no renumbering without approval) |
| GAP-009 | Metadata | Three version schemes (`1.0`, `1.0.0`, `0.1.0`) and four status vocabularies | Adopt one metadata schema per `37` §3.1 |
| GAP-010 | Organizational | Two documents are English-only; 34 are Persian-primary with mixed headings | Record an authoring-language policy and a bilingual normative glossary |
| GAP-344 | Metadata | No mandatory metadata schema across the set | Same as GAP-007/GAP-009 |
| GAP-X02 | Consistency | Jaccard-style terminology drift between Persian and English sections for the same concepts | Publish a terminology table |

---

## 7. Redundancy Register

| ID | Redundancy | Documents | Scale | Recommendation |
|---|---|---|---|---|
| GAP-R01 | Security standards triplicated | `22` (35 sections), `24` (30 sections), `31` (36 sections) | ~101 sections, 58 `SEC-D*` entries over 26 distinct IDs | Designate one authoritative; demote the others to domain references after content extraction |
| GAP-R02 | Accessibility standards duplicated | `21` (36 sections), `32` (36 sections) | ~72 sections, 25 `A11Y*` entries | Designate one acceptance authority; merge unique sections |
| GAP-R03 | API standards duplicated | `30` (33 sections), `34` (28 sections) | ~61 sections, 44 decisions over ~20 choices | Merge or designate |
| GAP-R04 | State management ownership split | `15` (§5, §27), `29` (23 sections, §21) | Overlapping cache, offline and persistence decisions | Split by concern: interaction vocabulary vs state architecture |
| GAP-R05 | Component taxonomy duplicated | `06` §11, `14` §3 | Two classification schemes | Declare ownership by concern |
| GAP-R06 | Tourism/brand experience repeated across five documents | `05` §6.5, `07` §10, `11` §8, `15` §17, `16` §8 | Consistent but repeated | Acceptable as layered detail; ensure single normative source per rule |
| GAP-R07 | Design-system architecture described twice | `06` §11–§12, `14` §3–§4 | Contract and taxonomy overlap | Declare `06` for architecture, `14` for components |
| GAP-R08 | Frontend standards governance vs brand governance overlap | `10` §2–§10 (brand docs), `37` §4–§12 (frontend standards) | No contradiction found | Record precedence: `37` for frontend standards, `10` for brand assets |

---

## 8. Conflict Summary Reference

Thirteen conflicts are recorded in `FRONTEND-STANDARDS-CONFLICT-REGISTER.md`:

| Conflict | Priority | Gap cross-reference |
|---|---|---|
| CONF-001 error model | P0 | GAP-081 |
| CONF-002 security triplication | P0 | GAP-013, GAP-R01 |
| CONF-003 accessibility duplication | P1 | GAP-157, GAP-R02 |
| CONF-004 component taxonomy | P1 | GAP-031, GAP-R05 |
| CONF-005 breakpoints | P2 | GAP-005 |
| CONF-006 implicit framework | P0 | GAP-042 |
| CONF-007 ID namespaces | P2 | GAP-007 |
| CONF-008 missing document 04 | P0 | GAP-003 |
| CONF-009 version/status schemes | P3 | GAP-009 |
| CONF-010 language split | P3 | GAP-010 |
| CONF-011 decimal strength | P2 | GAP-280, GAP-011 |
| CONF-012 state ownership | P2 | GAP-012, GAP-R04 |
| CONF-013 API duplication | P0 | GAP-X01, GAP-R03 |

---

## 9. Unverified Assumptions

| Assumption | Where it is assumed | Status |
|---|---|---|
| React is the application framework | `14` §4, `15` §26, `22` §20, `23` §8, `27` §6, `29` §14 | Unrecorded — no decision exists |
| A single frontend serves all three products | `37` §8 Layer 2, `06` §5, `29` §21 `STATE-D18` | OPEN |
| HyDroMA will expose the scientific API shapes the standards imply | `30` §16, `34` §14 | Cannot be verified — no backend contract in this audit |
| Nojin Marketplace will expose a financial contract compatible with `D-034-17` | `30` §17, `34` §15 | Cannot be verified |
| Fonts can be licensed for self-hosting | `02` §10, `13` §26 | Unverified — `TYPO-08` OPEN |
| Persian and Latin are the only launch languages | `28` §3, `13` §3 | OPEN — `I18N-D02` |
| WCAG 2.2 AA is acceptable as the legal conformance target | `21` §2, `32` §5 | Proposed, not ratified |
| The four color systems in `03` are the complete option space | `03` §19 | Assumed by the document; no external validation |
| A framework-native component library will exist that satisfies `14` | `14` §2 | Assumed; `D-014-01` OPEN |
| Document 04 existed and was accepted | `05` §1 | **False** — no file exists |
| Documents 01–35 form a complete planned scope | `37` §2 | Contradicted by the absence of 04 |

---

## 10. Requirements Requiring Additional Research

| Requirement | Why research is needed | Suggested owner |
|---|---|---|
| CRS and projection handling (`GAP-254`) | Domain knowledge; no frontend standard covers it | HyDroMA scientific authority + owner |
| Scientific provenance schema (`GAP-272`) | Must match backend metadata model | HyDroMA platform + backend |
| Reproducibility and run identity (`GAP-274`) | No existing standard in the set | HyDroMA scientific authority |
| Transaction state machine and audit (`GAP-284`) | Depends on payment provider and accounting requirements | Marketplace backend + owner |
| Tourism booking and availability (`GAP-303`) | New domain; nothing in the set | Product owner |
| PWA architecture and update UX (`GAP-242`) | Fragmented; requires a deliberate architecture | Owner + technical lead |
| Browser and assistive-technology matrix (`GAP-221`, `GAP-158`) | Requires field data on actual users in Iran and the region | Owner + UX research (`D-018-*`) |
| Font licensing (`TYPO-08`) | Legal review required | Owner + legal |
| Data classification ratification (`GAP-106`) | May depend on regulatory obligations | Owner + legal/security |

---

## 11. Gap Counts

| Priority | Count |
|---|---|
| P0 | 8 |
| P1 | 21 |
| P2 | 15 |
| P3 | 5 |
| **Total distinct gaps** | **49** |

P0 list: GAP-003, GAP-042, GAP-013, GAP-081, GAP-X01, GAP-221, GAP-254, GAP-284.
P1 list: GAP-014, GAP-031/GAP-004, GAP-043, GAP-053, GAP-106, GAP-157, GAP-158, GAP-231, GAP-232, GAP-242, GAP-272, GAP-273, GAP-274, GAP-280, GAP-312, GAP-303, GAP-343, GAP-355, GAP-222, GAP-255, GAP-196.

P1 is counted as 21 because GAP-031 and GAP-004 are one finding reported under two requirement rows.

---

## 12. Recommendation Summary for the Owner

| Question | Recommendation |
|---|---|
| Should new standards documents be created? | **Not yet.** Four of the eight P0 gaps are resolvable by designating an existing document as authoritative. Only GAP-003 (logotype) and possibly GAP-254 (CRS) and GAP-242 (PWA) genuinely justify new or extended documents — and that is the owner's call, not an agent's. |
| What should be fixed first? | The five P0 conflict/governance gaps (GAP-042, GAP-013, GAP-081, GAP-X01, GAP-003), because they are cheap to resolve on paper and expensive to resolve after code exists. |
| What can safely wait? | All P3 metadata gaps. They do not affect implementation correctness. |
| Where is the documentation weakest? | Not in breadth. Coverage is broad and unusually disciplined about non-approval. The weakness is **authority**: three domains have two or three complete standards each, with no precedence rule. |

---

## 13. Non-Authorization Statement

This report identifies gaps. It does not close them, does not create new standards documents, and does not authorize implementation of any gap remediation. Per `37` §19 and the mission constraints, remediation requires a separately authorized task.
