# FRONTEND STANDARDS CONFLICT REGISTER

**Deliverable:** DEL-03 (per `37-FRONTEND-STANDARDS-INTEGRATION-IMPLEMENTATION-READINESS-AND-GOVERNANCE.md` §16)
**Audit date:** 2026-11-18
**Target directory:** `D:\Nojin\brand\eco-nojin-visual-identity-v3\`
**Scope:** All 36 present documents (01–03, 05–37)
**Status:** INCOMPLETE PENDING OWNER RESOLUTION — no conflict in this register has been resolved by this audit

---

## 1. How Conflicts Were Assessed

A conflict was recorded only when two documents make incompatible statements about the same concern, or when two documents claim authority over the same concern without a precedence rule. A shared **open** decision is not a conflict unless the two documents define the same identifier differently or prescribe different resolutions.

Procedure followed (per `37` §4.2):

1. Both requirements were located in the actual files.
2. Exact section references were recorded.
3. The conflict was classified as technical, semantic, organizational or metadata.
4. Affected modules were identified.
5. A resolution was **proposed, not applied**.
6. Decision ownership is stated; no approval is inferred.

---

## 2. Conflict Summary Table

| ID | Concern | Documents | Type | Severity | Priority | Owner approval required |
|---|---|---|---|---|---|---|
| CONF-001 | Normalized API error model | 30 vs 34 | Technical | Critical | P0 | Yes |
| CONF-002 | Security standards triplication and colliding decision IDs | 22 vs 24 vs 31 | Organizational + semantic | Critical | P0 | Yes |
| CONF-003 | Accessibility standards duplication and parallel acceptance criteria | 21 vs 32 | Organizational | High | P1 | Yes |
| CONF-004 | Component taxonomy divergence | 06 vs 14 | Semantic | High | P1 | Yes |
| CONF-005 | Two unreconciled breakpoint systems | 06 vs 20 | Technical | Medium | P2 | Yes |
| CONF-006 | Implicit application framework assumption with no framework decision | 14, 15, 22, 23, 27, 29 vs 37 | Technical + governance | Critical | P0 | Yes |
| CONF-007 | Document identifier namespace inconsistency and dangling parent references | 02, 14–20, 21–23, 24–29, 30–37, 18, 19, 20 | Metadata | Medium | P2 | Yes |
| CONF-008 | Document 04 cited as existing but absent | 05 vs filesystem, 37 | Evidence + dependency | Critical | P0 | Yes |
| CONF-009 | Version and status vocabulary divergence | 01–03, 05–13 vs 14–35 vs 36–37 | Metadata | Low | P3 | Yes |
| CONF-010 | Documentation language split across the set | 01–35 vs 36–37 | Organizational | Low | P3 | Yes |
| CONF-011 | Decimal/monetary rule stated at different normative strengths | 14, 30, 31, 34, 36 | Semantic | Medium | P2 | Yes |
| CONF-012 | Duplicate state-management scope ownership | 15 vs 29 | Organizational | Medium | P2 | Yes |
| CONF-013 | Duplicate API-integration scope ownership | 30 vs 34 | Organizational | Critical | P0 | Yes |

---

## 3. Conflict Records

### CONF-001 — Two incompatible normalized API error models

| Field | Value |
|---|---|
| Conflict ID | CONF-001 |
| Document A | `30-FRONTEND-API-INTEGRATION-CONTRACTS-AND-ERROR-HANDLING-STANDARDS.md` §12.2 "Normalized Error Model" |
| Document B | `34-FRONTEND-API-INTEGRATION-DATA-CONTRACTS-AND-ERROR-HANDLING-STANDARDS.md` §8.2 "Error Normalization" |
| Type | Technical |
| Severity / Priority | Critical / P0 |

**Requirement references**

- 30 §12.2 defines `type ApiError` with a `category` union of: `network`, `timeout`, `authentication`, `authorization`, `validation`, `business`, `conflict`, `rate_limit`, `server`, `contract`, `cancelled`, `unknown`. It also declares `fieldErrors?: Record<string, string[]>` and makes `message`, `retryable` required.
- 34 §8.2 defines a different `type ApiError` whose `category` union is: `network`, `timeout`, `authentication`, `authorization`, `validation`, `not_found`, `conflict`, `rate_limit`, `server`, `contract`, `business`, `unknown`. It has **no** `fieldErrors` property and additionally carries `status?`, `code?`, `message`, `requestId?`, `retryable`.
- 30 §12.1 lists a `Not Found Error` category that its own §12.2 union does not model.
- 34 §8.1 lists no `Cancellation` category, while 30 §12.1 does.

**Description**
The two documents define the same runtime type name (`ApiError`) with overlapping but non-identical discriminators. Mapping, type-narrowing and error rendering written against one will not type-check or behave correctly against the other. The absence of `fieldErrors` in 34 is material because 36 requires field-level validation feedback.

**Technical impact**
An API client, error boundary and form error surface cannot be implemented once. Every consumer must pick a document, silently invalidating the other. This directly threatens form validation display (36 §9), financial error handling (34 §15) and scientific job error reporting (34 §13).

**Proposed resolution (not applied)**
Owner designates one authoritative normalization contract. Recommended: adopt 30 §12.2 as the base (it is a superset except for `not_found`), then explicitly add `not_found` and retain `fieldErrors`. Requires a new decision ID because neither document's register covers cross-document error-contract reconciliation.

**Owner approval required:** Yes.

---

### CONF-002 — Three overlapping security standards with colliding decision identifiers

| Field | Value |
|---|---|
| Conflict ID | CONF-002 |
| Document A | `22-FRONTEND-SECURITY-AND-CLIENT-SIDE-DATA-PROTECTION-STANDARDS.md` |
| Document B | `24-FRONTEND-SECURITY-AND-PRIVACY-STANDARDS.md` |
| Document C | `31-FRONTEND-SECURITY-AND-DATA-PROTECTION-STANDARDS.md` |
| Type | Organizational + semantic |
| Severity / Priority | Critical / P0 |

**Requirement references**

- 22 §4–§6 (Authentication Security, Session Management, Authorization), §33 Open Decisions `SEC-D01…SEC-D12`.
- 24 §4–§6 (Authentication and Session Security, MFA and Passkeys, Authorization), §28 Open Decisions `SEC-D01…SEC-D20`.
- 31 §6–§8 (Authentication Security, Session and Token Security, Authorization), §32 Open Decisions `SEC-D01…SEC-D26`.
- The same identifier means different things in different documents:

| ID | Meaning in 22 §33 | Meaning in 24 §28 | Meaning in 31 §32 |
|---|---|---|---|
| SEC-D01 | Final session management architecture | Final session and authentication architecture | Final authentication model |
| SEC-D02 | Official token storage policy | Cookie-based vs token-based session | Session retention policy |
| SEC-D04 | Final CSP policy | MFA requirement level | MFA policy |
| SEC-D06 | Formal data classification | Final role and permission model | Authorization model |

**Description**
Three documents govern the same domain, each with its own numbering of `SEC-D*` decisions. Cross-references such as "see SEC-D06" are ambiguous and resolve to different decisions depending on which document is cited.

**Technical impact**
Authentication, session and authorization decisions cannot be tracked reliably. Requirement traceability (37 §6) breaks because identifiers are not unique across the set. Risk of implementing the CSP decision while believing the MFA decision was taken.

**Proposed resolution (not applied)**
Owner designates one security standard as authoritative (31 is the most complete, with 26 decisions and dedicated administrative-interface security in §23), and renumbers the retained decision set with a namespace prefix unique to the document. The other two become superseded or are reduced to domain references. This constitutes a material organizational decision and must be made by the owner, not an agent.

**Owner approval required:** Yes.

---

### CONF-003 — Two accessibility standards with parallel acceptance criteria

| Field | Value |
|---|---|
| Conflict ID | CONF-003 |
| Document A | `21-FRONTEND-ACCESSIBILITY-AND-INCLUSIVE-DESIGN-STANDARDS.md` |
| Document B | `32-FRONTEND-ACCESSIBILITY-AND-INCLUSIVE-UX-STANDARDS.md` |
| Type | Organizational |
| Severity / Priority | High / P1 |

**Requirement references**

- Conformance target: 21 §2 and §26 (WCAG 2.2 Level AA, internal checklist) vs 32 §5 (WCAG 2.2 Level AA — Proposed). **These agree.**
- Acceptance criteria: 21 §28 "Component Accessibility Acceptance Criteria" and §35 "Final Acceptance Criteria" vs 32 §30 "Accessibility Acceptance Criteria". Two separate criteria sets, neither referencing the other.
- Decision registers: 21 §34 `A11Y-01…A11Y-10` vs 32 §32 `A11Y-D01…A11Y-D15`.
- A11Y-01 ("final conformance level for all products") and A11Y-D01 ("ratify WCAG 2.2 AA as official target") are the same decision recorded twice under different IDs.
- Touch target: 21 §13 describes motor-accessibility requirements without a number; 32 §13 proposes 24×24 CSS px. Not contradictory, but only one document states the measurable value.

**Description**
Both documents are complete accessibility standards for the same three products. They do not contradict on targets or contrast ratios, but they duplicate scope, acceptance criteria and decision registers. A component can pass one document's acceptance table and fail the other's.

**Technical impact**
Release gating is ambiguous: 37 §14 QG-09 requires "applicable accessibility checks pass" but no document is designated as the source of those checks. Test coverage written for 21 will not satisfy 32 §30 and vice versa.

**Proposed resolution (not applied)**
Owner designates one document as the accessibility acceptance authority and reduces the other to a reference or merges unique sections. Unique content to preserve from 32: §13 touch-target value, §19 map accessibility, §21 financial/marketplace workflow accessibility, §22 scientific form accessibility. Unique content to preserve from 21: §17 HyDroMA scientific workflow, §19 tourism/rural, §24 low-bandwidth, §26 WCAG checklist, §29 accessibility debt management.

**Owner approval required:** Yes.

---

### CONF-004 — Two divergent component taxonomies

| Field | Value |
|---|---|
| Conflict ID | CONF-004 |
| Document A | `06-DESIGN-SYSTEM-ARCHITECTURE.md` §11 "معماری کامپوننت‌ها" |
| Document B | `14-DESIGN-SYSTEM-COMPONENT-AND-PATTERN-STANDARDS.md` §3 "معماری سلسله‌مراتبی کامپوننت‌ها" |
| Type | Semantic |
| Severity / Priority | High / P1 |

**Requirement references**

- 06 §11.1–§11.7 classifies components into seven domain categories: Foundations (§11.1), Form (§11.2), Navigation (§11.3), Feedback (§11.4), Data (§11.5), Business (§11.6), Scientific (§11.7).
- 14 §3.1–§3.4 classifies components into four structural levels: Primitive (`PR-###`), Composite (`CO-###`), and further domain/pattern levels, with explicit component ID tables.
- 06 §12 "قرارداد ساخت کامپوننت" and 14 §4 "قرارداد عمومی کامپوننت‌ها" both define a component contract.

**Description**
Two classification models coexist. A "Table" component is "Data" under 06 and a Composite under 14; the schemes are orthogonal and unreconciled. Component IDs exist only in 14.

**Technical impact**
Component registry structure (D-014-12, DS-10) cannot be finalized. Design-system documentation tooling will need one taxonomy. Import boundaries and package layout depend on the chosen scheme.

**Proposed resolution (not applied)**
Assign ownership by concern: 06 owns token and layer architecture; 14 owns component classification, IDs and contracts. Then add a cross-reference block in each document stating the precedence. No content rewrite is required; only an authority statement.

**Owner approval required:** Yes (scope ownership).

---

### CONF-005 — Two unreconciled breakpoint systems

| Field | Value |
|---|---|
| Conflict ID | CONF-005 |
| Document A | `06-DESIGN-SYSTEM-ARCHITECTURE.md` §9.3 "Breakpoints" |
| Document B | `20-RESPONSIVE-DESIGN-AND-CROSS-DEVICE-STANDARDS.md` §4 "Breakpoint Architecture" |
| Type | Technical |
| Severity / Priority | Medium / P2 |

**Requirement references**

- 06 §9.3 proposes design tokens: `bp.sm = 640px`, `bp.md = 768px`, `bp.lg = 1024px`, `bp.xl = 1280px`, `bp.2xl = 1536px`.
- 20 §4 proposes ranges: `BP-01 < 360px`, `BP-02 360–479px`, `BP-03 480–767px`, `BP-04 768–1023px`, `BP-05 1024–1279px`, `BP-06 1280–1535px`, `BP-07 ≥ 1536px`.
- 06 §9.1 grid columns are Mobile 4 / Tablet 8 / Desktop 12 / Wide 12.

**Description**
The two systems agree at 768, 1024, 1280 and 1536, but 06 has no equivalent of 20's `BP-01`, `BP-02` and `BP-03` boundaries (360 and 480). A layout targeting `bp.sm = 640px` has no counterpart in 20's range list, and `BP-03` at 480 has no token.

**Technical impact**
Design tokens and responsive CSS may intersect inconsistently in the 360–640 range, which is the range most relevant to the rural and low-end-device users the standards explicitly target. Grid column counts cannot be derived unambiguously at those widths.

**Proposed resolution (not applied)**
Adopt a single token set that is a superset: keep 06's named tokens, add `bp.xs = 360px` and `bp.xxs = 480px` if 20's ranges are retained, and regenerate 20's table from the token list. This is a design-system decision (DS-06 and D-020-01 are both OPEN).

**Owner approval required:** Yes.

---

### CONF-006 — Application framework assumed but never decided

| Field | Value |
|---|---|
| Conflict ID | CONF-006 |
| Document A | `14`, `15`, `22`, `23`, `27`, `29` (technical provisions) |
| Document B | `37-FRONTEND-STANDARDS-INTEGRATION-IMPLEMENTATION-READINESS-AND-GOVERNANCE.md` §7.3 "No Silent Decisions" |
| Type | Technical + governance |
| Severity / Priority | Critical / P0 |

**Requirement references**

- 14 §4 component contract code sample uses `children: React.ReactNode`.
- 15 §26 states that in a React architecture an Error Boundary is recommended to prevent whole-UI collapse.
- 22 §20 references React Error Boundary behavior.
- 23 §8 is titled "REACT PERFORMANCE STANDARDS" and §8.1–§8.6 specify `React.memo` and React Strict Mode.
- 27 §6 lists "React Rendering Errors" as an error class and requires Error Boundaries in React interfaces.
- 29 §14 maps state categories directly to React primitives: `useState`, `Context`, `Zustand`, `Redux Toolkit`, `TanStack Query`, `RTK Query`, `React Hook Form`, `React Router Search Params`.
- 37 §7.3 requires that implementation agents MUST NOT silently decide "framework migration" or "application architecture".
- **No document contains a framework decision ID.** Scanning every `Open Decisions`/`تصمیمات باز` table (02–36) yields no entry for application framework or rendering framework.

**Description**
Six documents write framework-specific requirements as though React were settled, yet the decision is absent from every register. 23 §8 partially hedges ("در صورت استفاده از React" — if React is used), which confirms the choice is not settled even in the document that assumes it most heavily.

**Technical impact**
If a non-React framework is chosen, 23 §8, 29 §14, 14 §4, 15 §26, 22 §20 and 27 §6 all become partially inapplicable. If React is chosen, the decision has no recorded authority, violating 37 §7.3. Either path leaves the set internally inconsistent.

**Proposed resolution (not applied)**
Record an explicit framework decision with a new decision ID in the central register, and record the rendering-strategy decision (currently D-035-14) as dependent on it. Until then, treat all framework-specific provisions as conditional guidance, not requirements. This is explicitly an owner decision under 37 §7.3.

**Owner approval required:** Yes.

---

### CONF-007 — Identifier namespace inconsistency and dangling parent references

| Field | Value |
|---|---|
| Conflict ID | CONF-007 |
| Document A | Identifier scheme across 02, 14–20, 21–23, 24–29, 30–35, 36–37 |
| Document B | Parent-document declarations in 18 §1, 19 §1, 20 §1 |
| Type | Metadata |
| Severity / Priority | Medium / P2 |

**Requirement references**

- 02 declares `EN-VI-02` (two digits); 21, 22, 23 declare `EN-VI-021`, `EN-VI-022`, `EN-VI-023` (three digits) — same prefix, two formats.
- 14–20 and 24–29 declare `EN-VIS-0NN`.
- 30–35 declare `EN-FE-STD-0NN`.
- 36 and 37 declare `EN-FE-0NN`.
- 01, 03, 05, 06, 07, 08, 09, 10, 11, 12, 13 declare **no** Document ID.
- 18 §1 declares parents "EN-VIS-001 تا EN-VIS-017". Documents 01–13 declare no `EN-VIS` identifiers, so `EN-VIS-001` through `EN-VIS-013` refer to nothing.
- 19 §1 declares "EN-VIS-001 تا EN-VIS-018"; 20 §1 declares "EN-VIS-001 تا EN-VIS-019". Both inherit the same dangling range, and 19 additionally cites `EN-VIS-018`, which is document 18 under a different prefix than 21's `EN-VI-021` convention.

**Description**
The set uses four identifier namespaces with no registry, and three documents declare parent ranges that include identifiers that do not exist.

**Technical impact**
Automated traceability (37 §6) cannot resolve parent links. Cross-document citations by ID are unreliable. Any requirement-tracking tool would need a manual mapping table.

**Proposed resolution (not applied)**
Define one canonical identifier namespace and a mapping table from document number to ID in the master index. Do not renumber existing documents without owner approval (renumbering would invalidate references held elsewhere).

**Owner approval required:** Yes (renumbering), No (mapping table only).

---

### CONF-008 — Document 04 is cited as existing but is absent

| Field | Value |
|---|---|
| Conflict ID | CONF-008 |
| Document A | `05-BRAND-APPLICATION-AND-ART-DIRECTION.md` §1 |
| Document B | Filesystem inventory; `37-FRONTEND-STANDARDS-INTEGRATION-IMPLEMENTATION-READINESS-AND-GOVERNANCE.md` §2 |
| Type | Evidence + dependency |
| Severity / Priority | Critical / P0 |

**Requirement references**

- 05 §1 states: "چهار سند قبلی به موضوعات زیر پرداخته‌اند" (the four preceding documents covered the following), and lists "سند ۰۴: معماری لوگوتایپ سه برند" — "Document 04: Logotype Architecture of the Three Brands".
- The directory contains no `04-*.md`. Enumerated numbers are 01, 02, 03, 05 … 37.
- 37 §2 states "Documents 01–35 represent the original planned documentation scope" and never records a missing document.
- 37 §17 checklist item "Missing files identified" is unchecked.
- 37 §3.2 requires "No missing files represented as completed."

**Description**
A document that 05 treats as a completed predecessor does not exist. The set therefore contains at least one false completeness claim, and the logotype standard that brand application depends on has no recorded content.

**Technical impact**
Any logo, wordmark, lockup, clear-space or co-branding implementation lacks a governing standard. Brand application decisions (05 §1, §8) rest on a missing foundation. This blocks brand-layer implementation and any asset production that depends on logotype geometry.

**Proposed resolution (not applied)**
Owner confirms whether Document 04 was ever produced. If it exists outside this directory it must be located and inventoried before brand implementation. If it does not exist, it must be recorded as a missing document with a decision on whether to produce it or to fold logotype architecture into 05 or 09. This audit does not create the document.

**Owner approval required:** Yes.

---

### CONF-009 — Version and status vocabulary divergence

| Field | Value |
|---|---|
| Conflict ID | CONF-009 |
| Document A | 01–03, 05–13 (version `1.0`, status `EXPLORATION`/`RESEARCH & EXPLORATION`/`PROPOSED`) |
| Document B | 14–35 (version `1.0.0`, status `DRAFT — PROPOSED — NOT APPROVED`) and 36–37 (version `0.1.0`, same status plus status fields) |
| Type | Metadata |
| Severity / Priority | Low / P3 |

**Requirement references**

- 01 §header: `Version: 1.0`, `Status: EXPLORATION — NOT APPROVED`.
- 02 §header: `Version: 1.0`, `Status: RESEARCH & EXPLORATION — NOT APPROVED`.
- 03 and 05 §header: `Version: 1.0`, `Status: EXPLORATION — NOT APPROVED`.
- 06–13 §header: `Version: 1.0`, `Status: PROPOSED — NOT APPROVED`.
- 14–29 §metadata table: `Version 1.0.0`, `Status DRAFT — PROPOSED — NOT APPROVED`.
- 30–35 §Document Control: `Version 1.0.0`, `Status DRAFT — PROPOSED — NOT APPROVED`.
- 36 §header table: `Version 0.1.0`, `Implementation Status NOT VERIFIED`, `Architecture Decision Status OPEN`.
- 37 §header table: `Version 0.1.0`, `Implementation Status NOT STARTED`, `Standards Verification PENDING`.

**Description**
Three version schemes and four status vocabularies coexist. `1.0` and `1.0.0` are semantically identical but lexically different; `EXPLORATION`, `RESEARCH & EXPLORATION`, `PROPOSED` and `DRAFT — PROPOSED` are not formally related. 36 and 37 use `0.1.0`, which under common conventions denotes a pre-release document, while 14–35 use `1.0.0` for documents in the same unapproved state.

**Technical impact**
Version comparison and status filtering break in any documentation pipeline. Readers cannot infer relative maturity from the version number.

**Proposed resolution (not applied)**
Define a single metadata schema (already requested by 37 §3.1) and apply it in a controlled documentation pass. No document content needs revision.

**Owner approval required:** Yes (schema adoption).

---

### CONF-010 — Documentation language split

| Field | Value |
|---|---|
| Conflict ID | CONF-010 |
| Document A | 01–35 (Persian-primary, English headings in 21–35) |
| Document B | 36–37 (English-primary) |
| Type | Organizational |
| Severity / Priority | Low / P3 |

**Requirement references**

- 01–20: Persian body text with Persian or bilingual headings.
- 21–23, 30–35: English headings, Persian body, Persian decision tables.
- 36 §header declares `Language | English` and is written in English.
- 37 is written in English throughout.
- 19 §18–§19 give writing rules for Persian and English content, and 28 §17 governs translation, but neither governs the language of the standards documents themselves.

**Description**
The standards set has no declared authoring language. Two documents are English-only; the remainder are Persian-primary with mixed headings. Terminology therefore differs between the English and Persian portions for the same concepts.

**Technical impact**
Requirement wording cannot be compared mechanically across languages. A Persian-only reviewer cannot verify 36 and 37; an English-only reviewer cannot verify 01–35.

**Proposed resolution (not applied)**
Record an authoring-language policy and a bilingual glossary of normative terms (MUST/SHOULD/MAY already appear in both). This is a governance decision under 10 and 37.

**Owner approval required:** Yes.

---

### CONF-011 — Decimal/monetary rule stated at different normative strengths

| Field | Value |
|---|---|
| Conflict ID | CONF-011 |
| Document A | `14` §14 (financial components), `34` §15.2, `31` §14 |
| Document B | `36` §5.3 Decimal Integrity, `30` §8 |
| Type | Semantic |
| Severity / Priority | Medium / P2 |

**Requirement references**

- 14 §14: "مقادیر مالی در لایه داده باید با Decimal یا معادل دقیق آن مدیریت شوند" — must be managed with Decimal or its exact equivalent.
- 34 §15.2: "استفاده از Decimal در مدل‌سازی مالی الزامی پیشنهادی است" — recommended-mandatory (normative level ambiguous by construction).
- 31 §14: prohibits unintended Decimal-to-float conversion.
- 36 §5.3: "The frontend SHOULD preserve decimal input as a string or use a suitable decimal representation" — SHOULD.
- 30 §8 §"Decimal Integrity": prohibits unintended float conversion (also a MUST-level prohibition).

**Description**
All five documents agree in direction (no floating point for money); they disagree on normative strength. 14 uses a MUST formulation, 36 uses SHOULD, and 34 uses a hybrid "recommended mandatory". Under RFC-2119-style interpretation these are three different obligation levels for the same rule.

**Technical impact**
A reviewer cannot decide whether a float conversion is a defect or an acceptable deviation. Financial acceptance criteria (37 §14 QG-10) depend on this.

**Proposed resolution (not applied)**
Restate the rule once at MUST level in the authoritative financial/API standard and have other documents reference it rather than restate it. This is a normative-editing decision, not a new requirement.

**Owner approval required:** Yes.

---

### CONF-012 — Duplicate state-management scope ownership

| Field | Value |
|---|---|
| Conflict ID | CONF-012 |
| Document A | `15-UI-INTERACTION-AND-STATE-MANAGEMENT-STANDARDS.md` §5 "تفکیک UI State از Server State", §27 "تصمیمات باز" `D-015-01…D-015-12` |
| Document B | `29-FRONTEND-STATE-MANAGEMENT-DATA-FLOW-AND-CACHING-ARCHITECTURE-STANDARDS.md` §3 "State Classification", §21 "Open Decisions" `STATE-D01…STATE-D18` |
| Type | Organizational |
| Severity / Priority | Medium / P2 |

**Requirement references**

- 15 §5 separates UI state from server state; 29 §3.1–§3.8 classifies local, shared UI, server, URL, form, authentication, application and domain state. **Content is consistent — no contradiction found.**
- 15 §27 `D-015-01` selects a state management library; 29 §21 `STATE-D01` decides final global state architecture, `STATE-D02` client state tool, `STATE-D03` server state tool. Overlapping decision scope under two ID families.
- 15 §27 `D-015-04` sets cache and invalidation policy; 29 §21 `STATE-D06`/`STATE-D07` set cache TTL and invalidation policy. Same decision, two IDs, two documents.
- 15 §27 `D-015-06` sets offline mode policy; 29 §21 `STATE-D10`/`STATE-D11` set offline data and offline queue policy.

**Description**
The models are compatible, but ownership of the decisions is duplicated. This is a conflict of authority rather than of content.

**Technical impact**
Decision tracking will show the same choice as pending twice. Implementation may be blocked on a decision that another register already records as open under a different ID, causing duplicate approval requests.

**Proposed resolution (not applied)**
Merge the overlapping decision IDs, or declare 29 authoritative for state/caching architecture and 15 authoritative for interaction and UI-state vocabulary.

**Owner approval required:** Yes (ownership).

---

### CONF-013 — Duplicate API-integration scope ownership

| Field | Value |
|---|---|
| Conflict ID | CONF-013 |
| Document A | `30-FRONTEND-API-INTEGRATION-CONTRACTS-AND-ERROR-HANDLING-STANDARDS.md` |
| Document B | `34-FRONTEND-API-INTEGRATION-DATA-CONTRACTS-AND-ERROR-HANDLING-STANDARDS.md` |
| Type | Organizational |
| Severity / Priority | Critical / P0 |

**Requirement references**

- Both titles claim "Frontend API Integration … Error Handling Standards".
- 30 §2–§33 covers integration architecture, contract standards, transport, request/response, auth integration, timeout/retry/cancellation, idempotency, error taxonomy, pagination, versioning, long-running operations, HyDroMA API, Marketplace API, upload/download, rate limiting, offline, correlation IDs, security, mocking, contract testing, observability, lifecycle.
- 34 §1–§28 covers architectural principles, API architecture, contract standards, request/response, error handling, retry/recovery, auth integration, pagination, upload, long-running, HyDroMA API, Marketplace financial API, marketplace/inventory, offline, versioning, rate limiting, privacy, testing, observability, documentation.
- Decision registers are disjoint: 30 §30 `API-D01…API-D24`; 34 §26 `D-034-01…D-034-20`. The same decision appears twice under different IDs, for example 30 `API-D05` (response envelope) and 34 `D-034-03` (standard response contract); 30 `API-D06` (error envelope) and 34 `D-034-04` (error response format); 30 `API-D09` (retry/backoff) and 34 `D-034-08` (retry and timeout).

**Description**
Two full standards cover the same concern with no precedence. Unlike CONF-001 (a concrete type divergence), this is the underlying ownership failure that permits such divergence.

**Technical impact**
44 API decisions exist where approximately 20 distinct decisions are needed. Approval workflow will duplicate. No document can be cited as the API baseline for implementation.

**Proposed resolution (not applied)**
Owner selects one document as authoritative (30 is broader in transport and testing; 34 is stronger on scientific and financial data contracts) or commissions a merged standard. Because this determines the implementation baseline, it requires explicit owner approval.

**Owner approval required:** Yes.

---

## 4. Domains Reviewed With No Conflict Identified

The following domains were examined and **no incompatible requirement was found**. Shared open decisions are noted but are not conflicts.

| Domain | Documents examined | Outcome |
|---|---|---|
| Accessibility conformance target | 01 §9, 03 §14.1, 05 §15, 06 §14, 07 §18, 11 §18, 16 §23, 18 §15, 20 §28, 21 §2, 32 §5, 36 §18 | Consistent: WCAG 2.2 Level AA everywhere; no AAA or WCAG 2.1 deviation. Contrast values identical (4.5:1 normal, 3:1 large and UI). |
| Performance budgets | 23 §4, 25 §17, 27 §8 | Consistent: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile, stated identically in all three. |
| Authentication mechanism | 22 §4, 24 §4–§5, 30 §9, 31 §6–§7, 34 §10 | No conflict: all documents leave cookie-based vs token-based open and all describe HttpOnly/SameSite candidates without mandating either. Shared decision scope is recorded in CONF-002. |
| Date and calendar behavior | 13 §16–§17, 28 §8, 36 §11 | Consistent: storage/display separation, UTC storage, calendar independent of storage, conversion via validated library. Both keep the calendar policy open (ML-07, I18N-D10). |
| Currency representation | 28 §9, 30 §8, 34 §15, 36 §5.3 | Consistent: IRR as currency code; no locale-dependent currency guessing; decimal preservation. Only normative strength differs (CONF-011). |
| Error boundary concept | 15 §26, 22 §20, 27 §6, 34 §8.3 | Consistent: API errors must not be conflated with render errors; boundaries isolate render failures. |
| Idempotency for critical operations | 30 §11, 34 §15.3, 36 §10, 37 §5.6 | Consistent: idempotency required for duplicate-sensitive operations. Mechanism remains open in all. |
| RTL/LTR direction rules | 13 §4, §19, §20; 20 §18; 21 §10; 28 §5; 35 §16 | Consistent: direction independent of language; logical CSS properties; icon mirroring by class. |
| State classification model | 15 §4–§5, 29 §3 | Consistent: 15 supplies UI state vocabulary, 29 supplies state ownership classes; no contradictory classification. Authority duplication recorded in CONF-012. |
| Validation timing | 15 §7.4, 36 §7 | Consistent: change/blur/submit selection by field type; no premature error display except to prevent serious mistakes. |
| Form submission lifecycle | 15 §7.1, 36 §10 | Consistent: EMPTY → EDITING → VALIDATING → SUBMITTING → SUCCESS/ERROR, with duplicate prevention. |
| Deployment and release authority | 26 §10, 37 §14, §20 | Consistent: release requires separate authorization; no document authorizes deployment. |
| Documentation approval authority | 10 §5, 25 §28, 26 §19, 37 §7, §12 | Consistent: Project Owner is approval authority in every document that names one. |
| Scientific honesty requirements | 07 §17, 12 §3, §17, §23; 37 §5.5 | Consistent: UI presence never proves computation; capability status must be declared; misleading scaling prohibited. |

---

## 5. Conflict Counts

| Category | Count |
|---|---|
| Technical conflicts | 3 (CONF-001, CONF-005, CONF-006) |
| Semantic conflicts | 3 (CONF-002, CONF-004, CONF-011) |
| Organizational conflicts | 5 (CONF-002, CONF-003, CONF-010, CONF-012, CONF-013) |
| Metadata conflicts | 2 (CONF-007, CONF-009) |
| Evidence/dependency conflicts | 1 (CONF-008) |
| **Total distinct conflicts** | **13** |
| Critical (P0) | 5 (CONF-001, CONF-002, CONF-006, CONF-008, CONF-013) |
| High (P1) | 2 (CONF-003, CONF-004) |
| Medium (P2) | 4 (CONF-005, CONF-007, CONF-011, CONF-012) |
| Low (P3) | 2 (CONF-009, CONF-010) |
| Domains reviewed with no conflict | 14 |
| Conflicts resolved by this audit | **0** |

CONF-002 is counted under both semantic and organizational types; the total row counts distinct IDs only.

---

## 6. Explicit Non-Authorization Statement

No conflict in this register has been resolved. Each proposed resolution is a recommendation for owner review. Per `37` §4.2 and §7.3, an implementation agent MUST NOT resolve material architectural conflicts independently. This register does not authorize any change to any standards document.
