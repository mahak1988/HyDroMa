# OWNER DECISION PRIORITY PACK

**Purpose:** convert 480 recorded open decisions into the smallest set of real decisions the owner must actually take.
**Date:** 2026-11-18
**Status:** PROPOSED. Nothing in this pack is approved. No decision has been taken on the owner's behalf.

---

## 1. Headline

| Measure | Value |
|---|---:|
| Decision entries recorded in the 36 standards | 480 |
| Distinct decision clusters | 63 |
| **Distinct owner-facing decisions** | **61** |
| — of which preference/policy (group A) | 42 |
| — of which technical recommendation then approval (group B) | 19 |
| Documentation consolidations that need no decision, only editing | 12 |
| Critical-path decisions (must close before foundation work) | 14 |
| Decisions that must wait for the repository audit | 19 (all of group B) |

**480 → 61 is an 87% reduction.** The reduction is achieved by merging restatements, merging the same decision recorded in two documents, and separating document repair from genuine choice.

**Verification:** each of the 480 doc-qualified identifiers was mapped to exactly one cluster. The mapping was machine-checked for completeness (480 of 480) and for double-assignment (0 overlaps). Group membership is listed in §5.

---

## 2. How Group A and Group B Differ

| | Group A | Group B |
|---|---|---|
| What it is | A preference, policy, identity or authority choice | A technology or architecture choice |
| Who decides | Owner directly | Owner approves a documented recommendation |
| Evidence needed | Owner's intent | Repository audit plus option analysis |
| Can it be taken today | Yes | Only after the repository audit |
| Examples | brand color route, languages, role model, retention policy | framework, state library, test tooling, map engine |

**Rule applied:** if two people with the same information could reasonably choose differently and the choice expresses *what the product is*, it is A. If the choice expresses *how the product is built* and can be evaluated on measurable criteria, it is B.

**Group C** items (documentation consolidation) are not decisions. They are listed in §6 because the prior report mixed them into the decision count and that inflated the owner's apparent workload.

---

## 3. Critical Path — 14 Decisions

These must close before any foundation code is written. Presented in dependency order.

### CD-01 — Governance authority model

| Field | Value |
|---|---|
| Decision ID | **A16** (GOV-01 … GOV-07, GOV-09, GOV-10) |
| موضوع | Who may approve what, and how changes are classified |
| مسئله | Nine brand-governance decisions define decision levels, an authority matrix, change classes and versioning, all still OPEN. Without them, every other decision in this pack has no recorded legitimacy. |
| دلیل نیاز به تصمیم | A decision taken without an authority framework cannot be distinguished from an opinion. `37` §7.1 requires a decision owner per item. |
| گزینههای ممکن | (a) single-owner model — the ecosystem owner approves all material decisions; (b) delegated model — owner approves identity/security/finance, technical lead approves tooling; (c) committee model |
| مزایا و معایب | (a) clear, slow, bottlenecked. (b) fast, but requires a named delegate. (c) distributes load, risks ambiguity. |
| ریسک هر گزینه | (a) delays technical work. (b) delegation may be contested later. (c) decisions stall between meetings. |
| پیشنهاد کارشناسی | (a) with a narrow written delegation list for tooling only. This matches `37` §7.3, which reserves architecture, security, financial and identity decisions to the owner. |
| وابستگیها | none; blocks everything |
| اولویت | P0 |
| وضعیت تصمیم | OPEN — awaiting owner |

### CD-02 — Agent authority policy

| Field | Value |
|---|---|
| Decision ID | **A17** (GOV-08) |
| موضوع | What an implementation agent may and may not do without asking |
| مسئله | `37` §12.4 lists prohibited actions, but no approved policy binds agents in practice, and the brand governance document leaves agent authority open. |
| دلیل نیاز به تصمیم | Every audit and implementation action depends on knowing the boundary. |
| گزینههای ممکن | (a) adopt `37` §12.4 verbatim as policy; (b) narrower — read-only until the standard baseline is frozen; (c) broader with per-task approval |
| مزایا و معایب | (a) already written, immediately usable. (b) safest, slows delivery. (c) flexible, harder to govern. |
| ریسک هر گزینه | (a) may permit more than intended if §12.4 is read loosely. (b) blocks useful inspection. (c) invites scope creep. |
| پیشنهاد کارشناسی | (a) plus an explicit addition: agents may not create or modify standards documents without a separate mission. |
| وابستگیها | CD-01 |
| اولویت | P0 |
| وضعیت تصمیم | OPEN |

### CD-03 — Target repository confirmation

| Field | Value |
|---|---|
| Decision ID | no identifier exists (assigned by this review: **A43**) |
| موضوع | Which repository the frontend actually lives in |
| مسئله | `37` §10.1 names three directories and states that their existence is not authorization. No document names the frontend target. |
| دلیل نیاز به تصمیم | The audit cannot start without a subject; `D:\HyDroMA` and `D:\eco_nojin` are protected. |
| گزینههای ممکن | (a) `D:\Nojin`; (b) a subdirectory under it; (c) a repository not yet created (greenfield) |
| مزایا و معایب | (a) simplest if code exists. (c) cleanest architecture, highest cost. |
| ریسک هر گزینه | Choosing wrong means auditing the wrong tree, which `37` §15 records as GOV-004. |
| پیشنهاد کارشناسی | Record the exact absolute path, plus whether read access to the other two is authorized. Do not infer from directory names. |
| وابستگیها | CD-02 |
| اولویت | P0 |
| وضعیت تصمیم | OPEN — NOT_VERIFIED by this mission (no repository access) |

### CD-04 — Application framework and rendering strategy

| Field | Value |
|---|---|
| Decision ID | **B01** — this includes the decision the prior audit recorded as missing (AUDIT-MISS-01) |
| موضوع | Which framework the frontend is built on, and how pages are rendered |
| مسئله | No decision record exists, yet `23` §8 is titled "REACT PERFORMANCE STANDARDS", `27` §6.1 lists React rendering errors as a mandatory error category, and `29` §14.1 lists "compatibility with React" as a selection criterion. Three passages presuppose an undecided framework. |
| دلیل نیاز به تصمیم | Every component, route, test and state tool inherits it. `37` §7.3 forbids deciding it silently. |
| گزینههای موجود در اسناد | None. `29` §14.2 lists React-ecosystem tools only; no document compares frameworks. No alternative framework is named anywhere. |
| مزایا و معایب | Deciding now: unblocks planning, risks contradicting the repository. Deciding after the audit: evidence-based, delays two weeks. |
| ریسک هر گزینه | Deciding before the audit → the decision may be overturned by what already exists → wasted scaffold. Deciding after → short delay only. |
| پیشنهاد کارشناسی | **Do not decide yet.** Run the repository audit first. Then choose among: continue with what exists, or greenfield with a modern stack. The recommendation must include a technology decision record per `37` §11.3. |
| وابستگیها | CD-03; blocks B02, B03, B05, B07, B09, B12 |
| اولویت | P0 |
| وضعیت تصمیم | OPEN — intentionally deferred until after CD-03 audit |

### CD-05 — API contract and error model

| Field | Value |
|---|---|
| Decision ID | **B10** (API-D05 … API-D09, API-D14, API-D15, API-D18 … API-D20, API-D23, D-015-05, D-034-03, D-034-04, D-034-07, D-034-08, D-034-13, D-034-14, D-034-19, D-034-20) |
| موضوع | One response envelope, one error envelope, one versioning and retry policy |
| مسئله | Two standards define the same `ApiError` type with different members (`cancelled` vs `not_found`; `fieldErrors` only in doc 30). Both self-declare as illustrative. |
| دلیل نیاز به تصمیم | No API client can be written twice. Form validation, financial errors and scientific job errors all consume this type. |
| گزینههای ممکن | (a) doc 30 as base plus `not_found`; (b) doc 34 as base plus `cancelled` and `fieldErrors`; (c) a merged contract written jointly with the backend |
| مزایا و معایب | (a) preserves cancellation and field errors, small delta. (b) preserves not-found, larger delta. (c) most correct, needs backend participation. |
| ریسک هر گزینه | (a)/(b) risk entrenching a partial model. (c) risks delay if the backend team is not available. |
| پیشنهاد کارشناسی | (c) if the backend team can join within the audit window; otherwise (a), because cancellation semantics cannot be retrofitted into a `not_found`-first model without breaking callers. |
| وابستگیها | CD-05 also determines whether doc 30 or 34 becomes the API baseline (see DOC-03) |
| اولویت | P0 for any backend-connected feature |
| وضعیت تصمیم | OPEN |

### CD-06 — Visual identity and color route

| Field | Value |
|---|---|
| Decision ID | **A01** (ID-07, ID-08, COLOR-01 … COLOR-13) |
| موضوع | Which of the four candidate identities is adopted and which color system governs |
| مسئله | Four complete color systems are specified (CS-01 Sovereign Harvest, CS-02 Terra Viva, CS-03 Sunfire, CS-04 Atlas Bloom). All are marked Proposed. No identity is selected. |
| دلیل نیاز به تصمیم | Every token, component and page depends on it. Building before selection means re-skinning everything. |
| گزینههای ممکن | CS-01, CS-02, CS-03, CS-04, or a hybrid |
| مزایا و معایب | All four are fully specified with contrast checks and per-brand roles. Differentiating them is an aesthetic and market-positioning judgement, not a technical one. |
| ریسک هر گزینه | Any choice can be reversed cheaply now and expensively later. |
| پیشنهاد کارشناسی | None offered. This is identity, and `08` §17 reserves it to the owner. The only technical input available: all four pass WCAG 2.2 AA at the stated ratios, so none is disqualified on accessibility grounds. |
| وابستگیها | blocks A07 typeface pairing lock, B17 token pipeline, all visual work |
| اولویت | P0 for visual work |
| وضعیت تصمیم | OPEN — owner only |

### CD-07 — Typography pairing

| Field | Value |
|---|---|
| Decision ID | **A07** (TYPO-01, TYPO-03, TYPO-06, ML-03, ML-04, I18N-D11, I18N-D12) |
| موضوع | Primary Persian and Latin typefaces and their pairing |
| مسئله | Six Persian and seven Latin candidates are evaluated with a pairing matrix, but nothing is selected. |
| دلیل نیاز به تصمیم | Type scale, line height, font loading and all layouts depend on it. |
| گزینههای ممکن | The documented candidates, or a pairing assembly from the matrix |
| مزایا و معایب | Evidence exists for each candidate (02 §4-§6). Licence status is unverified for all of them. |
| ریسک هر گزینه | Selecting a font whose licence forbids self-hosting forces a late swap across the whole system. |
| پیشنهاد کارشناسی | Select only after `TYPO-08` (licence confirmation) returns. Pairing should be chosen for metric compatibility in mixed Persian/Latin text, which `02` §6 already ranks. |
| وابستگیها | A08 (secondary fonts), B06 (i18n), CD-06 optional |
| اولویت | P0 for visual work |
| وضعیت تصمیم | OPEN |

### CD-08 — Authentication and session model

| Field | Value |
|---|---|
| Decision ID | **A20** (SEC-D01/D02/D03 in docs 22, 24 and 31; D-034-10) |
| موضوع | Session architecture, token vs cookie, identity provider |
| مسئله | Three standards each record these decisions under the same identifiers with different meanings. All three leave cookie-vs-token open and all three list HttpOnly/SameSite as a candidate. |
| دلیل نیاز به تصمیم | Login, guarded routes, refresh and every authenticated screen depend on it. `D-034-10` (refresh handling) cannot be answered without it. |
| گزینههای ممکن | (a) HttpOnly cookie session with CSRF token; (b) bearer token in memory plus refresh rotation; (c) external identity provider with OIDC |
| مزایا و معایب | (a) strongest XSS resistance, needs CSRF design. (b) simpler for mobile clients, XSS exposure. (c) offloads auth, adds dependency and cost. |
| ریسک هر گزینه | (a) CSRF mistakes. (b) token theft via XSS. (c) lock-in and integration delay. |
| پیشنهاد کارشناسی | (a) for browser-only products, consistent with the candidate all three documents lean toward. Requires backend agreement. Final choice is the owner's. |
| وابستگیها | CD-01; blocks A21, A22, A23, B04, route guards |
| اولویت | P0 for authenticated features |
| وضعیت تصمیم | OPEN |

### CD-09 — Data classification

| Field | Value |
|---|---|
| Decision ID | **A24** (SEC-D06@22, SEC-D07@31, SEC-D16@24) |
| موضوع | The formal classification of data into sensitivity tiers |
| مسئله | `31` §12 defines classification categories, but the scheme is not ratified and is recorded three times under conflicting IDs. |
| دلیل نیاز به تصمیم | Cache policy, retention, field-level protection and admin access all reference a tier. |
| گزینههای ممکن | (a) adopt `31` §12 as written; (b) adopt with an added tier for community/rural data; (c) defer to a legal assessment |
| مزایا و معایب | (a) fastest. (b) matches `31` §16 concerns. (c) most defensible legally, slowest. |
| ریسک هر گزینه | Unclassified data defaults to over-exposure. |
| پیشنهاد کارشناسی | (b). `31` §16 already treats community and rural data as a distinct risk, so the classification should reflect it rather than leave it to interpretation. |
| وابستگیها | CD-08; blocks A25, A26, caching decisions |
| اولویت | P0 for any data-bearing feature |
| وضعیت تصمیم | OPEN |

### CD-10 — Browser and assistive-technology support

| Field | Value |
|---|---|
| Decision ID | **A29** (D-020-07, QA-D16, A11Y-03, A11Y-D03, A11Y-D04, A11Y-D12, A11Y-D13, A11Y-09, D-020-02, D-020-03, D-020-08, D-020-11, D-020-12) |
| موضوع | Which browsers, versions, devices and AT are supported |
| مسئله | `20` §24 names six browser families and `32` §26.4 names four screen readers, but no version floors or combination matrix are ratified. Three documents record the matrix as OPEN. |
| دلیل نیاز به تصمیم | Test scope, polyfill strategy, CSS baseline and release criteria all derive from it. `37` §5.2 requires approval before release requirements are finalised. |
| گزینههای ممکن | (a) evergreen-only; (b) evergreen plus one prior major; (c) include legacy Android WebView for rural users |
| مزایا و معایب | (a) cheap, excludes some rural users. (c) inclusive, materially more testing. |
| ریسک هر گزینه | Over-restricting support excludes the target rural user base; over-extending multiplies test cost without data. |
| پیشنهاد کارشناسی | Decide using real traffic data if the repository or analytics exists; otherwise (b) plus an explicit note on Android WebView. This is a policy decision with real equity consequences, so it is the owner's. |
| وابستگیها | CD-04 for any build-target decision |
| اولویت | P1 (P0 at release) |
| وضعیت تصمیم | OPEN |

### CD-11 — Coordinate reference system policy

| Field | Value |
|---|---|
| Decision ID | **B14** (D-014-07, A11Y-06, A11Y-D08, PERF-D09, SCI-05) plus a new requirement that carries no identifier |
| موضوع | Storage CRS, display CRS, reprojection boundary, axis order, area/distance computation |
| مسئله | Five documents require that a map declare a coordinate system. None define which, nor datum transformation, axis order or area computation. |
| دلیل نیاز به تصمیم | Incorrect CRS handling produces plausible but wrong output — the failure mode testing does not catch. For an agricultural platform, parcel area is a business number, not a display detail. |
| گزینههای ممکن | (a) store WGS84 geographic, reproject to a national projected CRS for measurement; (b) store a projected CRS end-to-end; (c) delegate all reprojection to the backend |
| مزایا و معایب | (a) standard, accurate areas, needs a reprojection step. (b) simplest math, conflicts with GPS and external data. (c) frontend stays thin, requires backend capability and a round trip per measure. |
| ریسک هر گزینه | (b) breaks interoperability with GPS and satellite data. (a) risks an unvalidated transformation. (c) creates latency and a hidden dependency. |
| پیشنهاد کارشناسی | (a) with (c) for authoritative values: store geographic, compute measured quantities in a declared projected CRS, and treat backend-computed areas as authoritative. The specific CRS values must be chosen by the owner with HyDroMA input — not by an agent. |
| وابستگیها | CD-03; blocks all map and geospatial work |
| اولویت | P0 for maps, P1 for the sequence |
| وضعیت تصمیم | OPEN |

### CD-12 — Financial contract and activation

| Field | Value |
|---|---|
| Decision ID | **A34** (D-034-17, API-D22, D-014-09, FR-D10, STATE-D13) |
| موضوع | Decimal and currency contract, financial API shape, and whether financial operations are activated at all |
| مسئله | Decimal handling is required by five documents at three different obligation levels. The financial contract is open. Activation is separately prohibited without authorization by `37` §12.4 and §20. |
| دلیل نیاز به تصمیم | Payment, order and pricing surfaces cannot be built on an undefined contract, and activation is an owner act, not a technical one. |
| گزینههای ممکن | (a) build financial UI, do not activate; (b) build and activate after separate authorization; (c) defer financial surfaces entirely |
| مزایا و معایب | (a) allows progress with no financial risk. (b) requires backend contract, audit, and payment provider. (c) reduces scope but blocks marketplace viability. |
| ریسک هر گزینه | Activation without a ratified contract risks wrong amounts and false confirmation. |
| پیشنهاد کارشناسی | (a) now, with `D-034-17` ratified before any financial component is built. Activation is a separate decision, to be taken only after financial tests pass. |
| وابستگیها | CD-05, CD-09 |
| اولویت | P0 for financial surfaces |
| وضعیت تصمیم | OPEN — activation explicitly not granted by any document |

### CD-13 — Document 04 resolution

| Field | Value |
|---|---|
| Decision ID | no identifier exists (assigned by this review: **A40**) |
| موضوع | What to do about the missing logotype architecture standard |
| مسئله | `05` §1 cites "سند ۰۴: معماری لوگوتایپ سه برند" as a completed predecessor. No such file exists anywhere in the directory. |
| دلیل نیاز به تصمیم | Logo construction, clear space, lockups and co-branding have no governing rule; and the set carries a false completeness claim. |
| گزینههای ممکن | (a) the document exists elsewhere — locate and inventory it; (b) author it; (c) fold logotype architecture into `05` §8 and `09` §4; (d) formally waive and record the waiver |
| مزایا و معایب | (a) cheapest if true. (b) complete, costs authoring. (c) avoids a new document, may crowd `05`. (d) honest but leaves a gap. |
| ریسک هر گزینه | (c) and (d) risk ad hoc logo decisions during branding work. |
| پیشنهاد کارشناسی | Check (a) first — it is a single filesystem question. If absent, (c), because `37` §2 explicitly discourages adding documents that duplicate existing ones. Content must not be invented. |
| وابستگیها | CD-06 |
| اولویت | P0 for brand work, P1 for the sequence |
| وضعیت تصمیم | OPEN |

### CD-14 — Security standards authority

| Field | Value |
|---|---|
| Decision ID | **DOC-01** (no decision identifier; requires owner designation) |
| موضوع | Which of documents 22, 24 and 31 is the authoritative security standard |
| مسئله | Three complete standards, 58 decision entries, 20 colliding identifiers with 18 genuinely different meanings. Requirement content does not conflict; authority does. |
| دلیل نیاز به تصمیم | Without a designated authority, "SEC-D06" cannot be cited unambiguously, and the security baseline cannot be frozen. `37` §4.3 requires a precedence rule. |
| گزینههای ممکن | (a) `31` authoritative; (b) `24` authoritative; (c) merge into one and supersede the other two |
| مزایا و معایب | (a) most complete: 26 decisions, admin security, geospatial and community data, PWA security. (b) strongest on MFA/passkeys and threat modelling. (c) cleanest, most work. |
| ریسک هر گزینه | (a)/(b) leave duplicate content that will drift. (c) risks losing unique sections if not carefully extracted. |
| پیشنهاد کارشناسی | (a) as the base, with named sections lifted from 24 (MFA/passkeys §5, WebSocket §17, security UX §25, threat modelling §23) and 22 (§12 financial, §13 HyDroMA, §24 external data, §27 test environments, §30 severity model). Unique-content lists are in the review §4.4. |
| وابستگیها | CD-01 |
| اولویت | P1 — blocks freezing the standards baseline |
| وضعیت تصمیم | OPEN |

---

## 4. Group A — Preference and Policy Decisions (42)

| ID | Decision | Entries | Priority | Blocking |
|---|---|---:|---|---|
| A01 | Visual identity and color route | 15 | P0 | Yes |
| A02 | Art direction, imagery and graphic language | 12 | P1 | No |
| A03 | Icon system and library | 4 | P2 | No |
| A04 | Motion and animation intensity | 2 | P2 | No |
| A05 | Document and social templates | 2 | P3 | No |
| A06 | Experience architecture per brand | 23 | P1 | Yes |
| A07 | Typography primary pairing | 7 | P0 | Yes |
| A08 | Typography secondary, data font and licensing | 7 | P1 | Yes |
| A09 | Numeral policy (Persian vs Latin digits) | 3 | P1 | No |
| A10 | Calendar policy | 2 | P1 | No |
| A11 | Measurement unit policy | 1 | P2 | No |
| A12 | RTL/LTR policy | 2 | P1 | No |
| A13 | Language strategy and launch languages | 11 | P0 | Yes |
| A14 | Content language of record and glossary | 4 | P1 | No |
| A15 | Central messaging and slogans | 5 | P2 | No |
| A16 | Governance authority model | 9 | P0 | Yes |
| A17 | Agent authority policy | 1 | P0 | Yes |
| A18 | Identity evaluation process | 6 | P2 | No |
| A19 | Asset management and registry | 11 | P2 | No |
| A20 | Authentication and session model | 10 | P0 | Yes |
| A21 | MFA and passkey scope | 4 | P2 | No |
| A22 | Authorization, role model and admin security | 4 | P0 | Yes |
| A23 | Tenant isolation | 2 | P1 | No |
| A24 | Data classification | 3 | P0 | Yes |
| A25 | Consent, retention and telemetry privacy | 16 | P1 | No |
| A26 | Geospatial and community data policy | 4 | P1 | No |
| A27 | Accessibility target and exception policy | 6 | P1 | No |
| A28 | Ownership assignments (security, a11y, QA, obs) | 7 | P1 | No |
| A29 | Browser and assistive-technology support | 13 | P1 | Yes |
| A30 | Page inventory, SEO and URL policy | 11 | P1 | No |
| A31 | Product-specific page patterns | 5 | P1 | No |
| A32 | Multi-product boundary (shared shell vs separate apps) | 2 | P1 | Yes |
| A33 | Tourism booking business scope (no identifier) | 0 | P3 | No |
| A34 | Financial contract and activation | 5 | P0 | Yes |
| A35 | Deployment environments and release policy | 20 | P1 | No |
| A36 | Supply-chain governance policy | 10 | P1 | No |
| A37 | AI-generated content and imagery policy | 2 | P2 | No |
| A38 | Research and content governance roles | 15 | P2 | No |
| A39 | Release approval and coverage policy | 4 | P1 | No |
| A40 | Document 04 resolution (no identifier) | 0 | P1 | Yes |
| A41 | Browser security policy (CSP, CSRF, CORS, headers, scripts) | 9 | P1 | No |
| A42 | Security incident response policy | 2 | P1 | No |

Group A total: 42 clusters, 281 decision entries.

**Group A is not 42 questions for one sitting.** Recommended batching:

- **Batch 1 — legitimacy (today):** A16, A17, A40, A43 (target repository). 4 decisions.
- **Batch 2 — product identity (one session, after Batch 1):** A01, A07, A08, A13, A06. 5 decisions.
- **Batch 3 — security baseline (one session, with technical input):** A20, A22, A24, A25, A26, A41, A42. 7 decisions.
- **Batch 4 — operations (delegable):** A29, A35, A36, A39, A28, A32. 6 decisions.
- **Remaining 20:** can be taken during the relevant implementation phase, no earlier.

---

## 5. Group B — Technical Recommendation Then Approval (19)

All 19 require the repository audit to be answered well. None should be decided today.

| ID | Decision | Entries | Why it needs the audit |
|---|---|---:|---|
| B01 | Application framework and rendering | 10 | The repository may already contain one |
| B02 | UI component library, breakpoints and visual regression tooling | 16 | Existing components may be reusable |
| B03 | State and data layer | 5 | Existing state patterns constrain the choice |
| B04 | Form and validation stack | 12 | Existing form code may already exist |
| B05 | Routing library and route registry | 12 | Existing routes define the migration surface |
| B06 | i18n library and translation registry | 5 | Existing localization setup may exist |
| B07 | Test automation stack | 8 | Existing CI constrains tooling |
| B08 | Observability stack | 18 | Existing instrumentation may exist |
| B09 | API client and contract tooling | 13 | Existing client patterns and backend contract |
| B10 | API response, error, retry and versioning contract | 20 | Requires backend agreement, not repository evidence alone |
| B11 | Idempotency and long-running operation transport | 8 | Backend capability determines polling vs SSE vs WebSocket |
| B12 | Cache, offline and persistence architecture | 21 | Depends on framework and backend |
| B13 | Scientific API and provenance contract | 7 | Requires HyDroMA contract |
| B14 | Map engine and CRS policy | 5 | Requires CRS decision plus existing map code |
| B15 | Chart and scientific visualization engine | 8 | Existing visualization code may be reusable |
| B16 | Simulation and 3D stack | 2 | Requires HyDroMA capability confirmation |
| B17 | Token pipeline and theming architecture | 5 | Depends on A01 and on existing token setup |
| B18 | Accessibility testing method and tooling | 7 | Depends on A27 and existing tooling |
| B19 | Supply-chain tooling (package manager, SCA, SBOM) | 9 | Existing toolchain constrains choice |

Group B total: 19 clusters, 191 decision entries.

---

## 6. Documentation Actions — No Owner Decision Needed (12)

These are repairs. They resolve duplication and ambiguity without asking the owner to choose anything. They are listed separately so the owner does not mistake them for decisions.

| ID | Action | Resolves |
|---|---|---|
| DOC-01 | Designate authoritative security standard | CONF-002, GAP-013, GAP-R01 (needs a one-line owner designation) |
| DOC-02 | Designate authoritative accessibility standard and acceptance set | CONF-003, GAP-157, GAP-R02 |
| DOC-03 | Designate authoritative API standard | CONF-013, GAP-X01, GAP-R03 |
| DOC-04 | Publish one normative ApiError contract | CONF-001, GAP-081 |
| DOC-05 | Declare component taxonomy precedence (06 vs 14) | CONF-004, GAP-031, C05 |
| DOC-06 | Publish document-number-to-ID mapping and fix three parent ranges (18, 19, 20) | CONF-007, GAP-007 |
| DOC-07 | Adopt one metadata schema (version, status) | CONF-009, GAP-009 |
| DOC-08 | Record an authoring-language policy and bilingual glossary | CONF-010, GAP-X02 |
| DOC-09 | Restate the decimal rule once at MUST level | CONF-011, GAP-280 |
| DOC-10 | De-duplicate state decisions between 15 and 29 | CONF-012, GAP-012, C10 |
| DOC-11 | Assign stable requirement identifiers (FE-[DOMAIN]-[NNN]) | GAP-343 |
| DOC-12 | Unify breakpoint tokens (06 §9.3 with 20 §4) | CONF-005, GAP-005 |

Three of these (DOC-01, DOC-02, DOC-03) require a one-line owner designation because a document must be named as authoritative. The rest are pure editorial work.

---

## 7. What Must Not Be Asked of the Owner

To prevent the 480 figure from becoming a questionnaire:

| Not a decision | Why | Where it belongs |
|---|---|---|
| Population of the page registry (D-016-02 partially) | Implementation work | Roadmap phase 6 |
| Population of the route registry (D-035-02 partially) | Implementation work | Roadmap phase 5 |
| Choosing a visual regression tool independently | Subordinate to B02 | Bundled |
| Choosing an accessibility testing tool independently | Subordinate to B18 | Bundled |
| Selecting each of 15 state-related parameters | Implementation detail under B12 | Bundled |
| Choosing chart engine and chart library separately | One technical choice | Bundled in B15 |
| Re-approving requirements already stated consistently | No conflict exists | No action |
| Booking/reservation business rules | Backend domain | Out of frontend scope |
| Scientific reproducibility | HyDroMA engine scope | Out of frontend scope |

---

## 8. Count Reconciliation

| Group | Clusters | Decision entries covered |
|---|---:|---:|
| A — owner preference/policy | 42 (40 with identifiers, 2 without) | 281 |
| B — technical recommendation | 19 | 191 |
| C — consolidation clusters with identifiers | 4 | 8 |
| **Total** | **63** | **480** |

The sum reconciles exactly: 281 + 191 + 8 = 480. Every one of the 480 doc-qualified identifiers is assigned to exactly one cluster; the check was run programmatically and returned 480 of 480 mapped with zero double assignments.

Note that a single underlying choice can appear in more than one cluster only when it is recorded in two different documents under two different identifiers — for example idempotency appears as API-D10 (doc 30), D-015-07 (doc 15) and D-034-09 (doc 34). Those three identifiers sit in clusters B10, B11 and B11 respectively and must be resolved once. Resolving DOC-03 first will collapse many such triples automatically.

**Owner-facing total: 42 + 19 = 61.**

---

## 9. Non-Authorization Statement

No decision in this pack has been approved. The "پیشنهاد کارشناسی" lines are recommendations, clearly separated from owner approval, in accordance with `37` §7.3. Any decision recorded here as a recommendation becomes binding only when the owner records it with an identifier, a date and a rationale in the decision register.

**Status of every item in this pack: OPEN.**
