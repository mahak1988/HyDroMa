# FRONTEND ARCHITECTURE DECISION REGISTER

**Deliverable:** DEL-04 (per `37-FRONTEND-STANDARDS-INTEGRATION-IMPLEMENTATION-READINESS-AND-GOVERNANCE.md` §16); fulfils the central register required by `37` §7.1
**Audit date:** 2026-11-18
**Scope:** Every unresolved decision recorded in documents 02–36
**Total recorded decision entries:** 480
**Approved decisions:** 0
**Decisions resolved by this audit:** 0

---

## 1. Register Rules

1. Every identifier below is reproduced **verbatim** from its source document. No identifier has been created, renamed, or reused.
2. Status for every entry is `OPEN` because every source table records `OPEN`. No entry is promoted to `UNDER_REVIEW`, `PROPOSED` or `APPROVED` by this audit.
3. The domain grouping is an auditor's classification for navigation only. It does not change ownership. Where one identifier is relevant to two domains, it appears once and the cross-domain effect is noted.
4. Decision statuses are the vocabulary defined in `37` §7.2: `OPEN`, `UNDER_REVIEW`, `PROPOSED`, `APPROVED`, `REJECTED`, `DEFERRED`, `SUPERSEDED`.
5. **Required decision owner** is `Project Owner` for any decision that changes architecture, security, financial behavior, scientific computation, design identity, or production infrastructure (`37` §7.3). Domain-technical decisions may be delegated by the owner, but no delegation is recorded in any document, so this register states `Project Owner` unless a document names another authority.

---

## 2. Register Overview

| # | Domain | Entries | Entries flagged as blocking |
|---|---|---|---|
| 1 | Architecture | 59 | 14 |
| 2 | Framework and libraries | 18 | 10 |
| 3 | Design system | 67 | 22 |
| 4 | API | 45 | 19 |
| 5 | Authentication and security | 59 | 19 |
| 6 | State management | 29 | 5 |
| 7 | Scientific visualization | 16 | 0 |
| 8 | Financial workflows | 3 | 2 |
| 9 | Accessibility | 28 | 7 |
| 10 | Localization | 25 | 6 |
| 11 | Performance | 16 | 0 |
| 12 | Deployment, observability and release | 38 | 3 |
| 13 | Governance | 77 | 6 |
| — | **Total** | **480** | **113** |

The blocking count of 113 counts decision entries, not distinct underlying choices. Several entries express the same choice in different documents: font selection appears as `TYPO-01/02/03`, `ML-03/04` and `I18N-D11/D12`; response envelope appears as `API-D05` and `D-034-03`; session model appears as `SEC-D01/SEC-D02` in documents 22, 24 and 31. After de-duplication the number of distinct blocking choices is materially lower, but the exact figure depends on which document the owner designates as authoritative for each domain (see `FRONTEND-STANDARDS-CONFLICT-REGISTER.md`).

---

## 3. MISSING DECISION — Highest-Priority Absence

| Field | Value |
|---|---|
| Provisional ID | **AUDIT-MISS-01** (assigned by this audit; not present in any standard) |
| Decision | Application framework and rendering framework selection |
| Why it is listed | `37` §7.3 forbids agents from silently deciding the framework. Six documents nevertheless contain framework-specific provisions: `14` §4, `15` §26, `22` §20, `23` §8, `27` §6, `29` §14. No open-decision register in documents 02–36 contains a framework entry. |
| Available options documented | None. `23` §8 phrases its requirements conditionally ("if React is used"). `29` §14 lists React-based state tools but does not compare frameworks. |
| Dependencies | Blocks: `D-035-01` (routing library), `D-035-14` (rendering strategy), `STATE-D01..D04`, `D-015-01..D02`, `D-014-01` (component library), `PERF-D01`, `D-018`/`QA-D01..D04` tooling choices. |
| Consequence of postponement | Any component, route, API client or state layer built before this decision is made risks being discarded. Continues a live violation of `37` §7.3. |
| Can implementation proceed without it | **No.** Only documentation-level work and repository inventory can proceed. |
| Required decision owner | Project Owner |

---

## 4. Domain 1 — Architecture (59)

**Domain-level analysis**

- Dependencies: all architecture decisions depend on `AUDIT-MISS-01` (framework) at the technical level; `D-016-*` (page architecture) and `D-035-*` (routing) are mutually constraining because routes are derived from pages.
- Consequence of postponing the domain: no route table, no layout shell, and no module boundaries can be fixed; every subsequent layer inherits the churn.
- Can implementation safely proceed without resolving the domain: **partially** — the read-only repository audit of `37` §19 can proceed; construction cannot.

| ID | Decision | Source | Options documented | Blocking |
|---|---|---|---|---|
| UX-01 | Approve three-brand experience architecture | 07 §21 | No | N |
| UX-02 | Approve home page structure | 07 §21 | No | N |
| UX-03 | Approve HyDroMA page architecture | 07 §21 | No | N |
| UX-04 | Approve scientific dashboard structure | 07 §21 | No | Y |
| UX-05 | Approve marketplace structure | 07 §21 | No | N |
| UX-06 | Approve tourism page architecture | 07 §21 | No | N |
| UX-07 | Approve imagery rules | 07 §21 | No | N |
| UX-08 | Approve motion rules | 07 §21 | No | N |
| UX-09 | Approve responsive requirements | 07 §21 | No | N |
| UX-10 | Approve frontend implementation contract | 07 §21 | No | Y |
| UX-11 | Approve quality-control criteria | 07 §21 | No | N |
| WEB-01 | Approve three-brand experience architecture | 11 §22 | No | N |
| WEB-02 | Approve home page structure | 11 §22 | No | N |
| WEB-03 | Approve public page standards | 11 §22 | No | N |
| WEB-04 | Approve scientific dashboard standard | 11 §22 | No | N |
| WEB-05 | Approve marketplace standard | 11 §22 | No | N |
| WEB-06 | Approve rural and nomadic experience standard | 11 §22 | No | N |
| WEB-07 | Approve imagery and motion rules | 11 §22 | No | N |
| WEB-08 | Approve responsive standard | 11 §22 | No | N |
| WEB-10 | Approve page design and release process | 11 §22 | No | N |
| D-014-07 | Abstract map-engine contract | 14 §30 | No | N |
| D-014-10 | Final responsive policy | 14 §30 | No | Y |
| D-015-12 | Map and simulation interaction contract | 15 §27 | No | N |
| D-016-01 | Final Sitemap approval | 16 §28 | No | Y |
| D-016-02 | Final routes for the three brands | 16 §28 | No | Y |
| D-016-03 | Navigation architecture | 16 §28 | No | Y |
| D-016-04 | Final user groups | 16 §28 | No | N |
| D-016-05 | Priority pages | 16 §28 | No | N |
| D-016-06 | Final dashboard pattern | 16 §28 | No | N |
| D-016-07 | Scientific page pattern | 16 §28 | No | N |
| D-016-08 | Marketplace page pattern | 16 §28 | No | N |
| D-016-09 | Tourism page pattern | 16 §28 | No | N |
| D-016-10 | Administrative page architecture | 16 §28 | No | N |
| D-016-11 | SEO policy | 16 §28 | No | N |
| D-020-02 | Target device matrix | 20 §32 | No | N |
| D-020-03 | Mobile-first priority per brand | 20 §32 | No | N |
| D-020-07 | Supported browser matrix | 20 §32 | No | Y |
| D-020-08 | Cross-device continuity policy | 20 §32 | No | N |
| D-020-11 | Large-display priority | 20 §32 | No | N |
| D-020-12 | Kiosk and touch-display policy | 20 §32 | No | N |
| QA-D16 | Official supported browsers and devices | 25 §29 | No | Y |
| STATE-D18 | Shared architecture across three products | 29 §21 | No | Y |
| D-035-02 | Final Route Registry structure | 35 §27 | No | Y |
| D-035-03 | Product URL prefix policy | 35 §27 | No | N |
| D-035-05 | Protected route structure | 35 §27 | No | Y |
| D-035-06 | Route metadata policy | 35 §27 | No | N |
| D-035-07 | Shared vs independent navigation structure | 35 §27 | No | Y |
| D-035-08 | Breadcrumb policy | 35 §27 | No | N |
| D-035-09 | Query parameter policy | 35 §27 | No | N |
| D-035-10 | Deep linking policy | 35 §27 | No | N |
| D-035-11 | Redirect and legacy route policy | 35 §27 | No | N |
| D-035-12 | Scroll restoration policy | 35 §27 | No | N |
| D-035-13 | Route-level code splitting policy | 35 §27 | No | N |
| D-035-14 | Rendering strategy selection | 35 §27 | No | Y |
| D-035-15 | SEO policy for public pages | 35 §27 | No | N |
| D-035-16 | Route access telemetry policy | 35 §27 | No | N |
| D-035-17 | Mobile navigation structure | 35 §27 | No | N |
| D-035-18 | Permission-based route display policy | 35 §27 | No | Y |
| FR-D08 | File upload architecture | 36 §28 | No | N |

**Required owner:** Project Owner. **Note:** `D-016-01..03` and `D-035-02..07` are the same structural decision expressed in two documents (page architecture and routing). Reconciling them is a governance action (see `FRONTEND-STANDARDS-CONFLICT-REGISTER.md` CONF-007 domain precedent).

---

## 5. Domain 2 — Framework and Libraries (18)

**Domain-level analysis**

- Dependencies: every tool decision here is downstream of `AUDIT-MISS-01`. Choosing a routing library requires the framework; choosing a component library requires a styling and accessibility strategy.
- Consequence of postponement: no repository scaffold, no test harness, no build pipeline can be created reproducibly.
- Can implementation proceed: **No** for any code-producing task.

| ID | Decision | Source | Options documented | Blocking |
|---|---|---|---|---|
| D-014-01 | Base component library selection | 14 §30 | No (criteria only in §2) | Y |
| D-014-02 | Component documentation tooling | 14 §30 | No | N |
| D-014-03 | Visual regression tooling | 14 §30 | No | N |
| D-015-01 | State management library | 15 §27 | No | Y |
| D-015-02 | Server state management tool | 15 §27 | No | Y |
| D-017-01 | Icon library selection | 17 §27 | Partially (§7 comparison criteria) | N |
| D-020-09 | Visual regression tooling | 20 §32 | No | N |
| QA-D01 | Unit testing tool | 25 §29 | No | Y |
| QA-D02 | Component testing tool | 25 §29 | No | Y |
| QA-D03 | E2E testing tool | 25 §29 | No | Y |
| QA-D04 | Visual regression tool | 25 §29 | No | N |
| QA-D05 | Accessibility testing tool | 25 §29 | No | N |
| QA-D06 | Performance testing tool | 25 §29 | No | N |
| QA-D07 | SAST and SCA tooling | 25 §29 | No | N |
| I18N-D07 | i18n library | 28 §20 | No | Y |
| D-035-01 | Routing library | 35 §27 | No | Y |
| FR-D01 | Shared form library | 36 §28 | No | Y |
| FR-D02 | Validation library | 36 §28 | No | Y |

**Required owner:** Project Owner (framework-adjacent), with technical evaluation permitted but not approval.

---

## 6. Domain 3 — Design System (67)

**Domain-level analysis**

- Dependencies: `COLOR-01` (color route) gates all color tokens; `TYPO-01..04` gate all typography and font loading; `DS-01..03` gate the token and theme architecture; `D-014-04/05` gate component APIs.
- Consequence of postponement: no visual implementation can begin because no color, font, spacing or theme is authoritative. Every component built beforehand must be re-skinned.
- Can implementation proceed: **No** for any visual layer. Yes for non-visual infrastructure (repository, build).

| ID | Decision | Source | Options documented | Blocking |
|---|---|---|---|---|
| TYPO-01 | Primary Persian font | 02 §12 | Yes — 6 candidates evaluated §3 | Y |
| TYPO-02 | Display Persian font | 02 §12 | Yes | Y |
| TYPO-03 | Primary Latin font | 02 §12 | Yes — 7 candidates evaluated §5 | Y |
| TYPO-04 | Display Latin font | 02 §12 | Yes | N |
| TYPO-05 | Data and code font | 02 §12 | Yes | N |
| TYPO-06 | Persian/Latin pairing | 02 §12 | Yes — matrix §6 | Y |
| TYPO-07 | Persian vs Latin numeral policy | 02 §12 | No | N |
| TYPO-08 | Font license confirmation | 02 §12 | No | Y |
| TYPO-09 | Logotype-suitable font confirmation | 02 §12 | No | N |
| COLOR-01 | Select one of four color systems | 03 §19 | Yes — 4 systems fully specified §4-§7 | Y |
| COLOR-02 | Mother-brand primary color | 03 §19 | Yes | Y |
| COLOR-03 | Mother-brand secondary color | 03 §19 | Yes | Y |
| COLOR-04 | Gold signature color | 03 §19 | Yes | N |
| COLOR-05 | HyDroMA independent colors | 03 §19 | Yes | N |
| COLOR-06 | Marketplace independent colors | 03 §19 | Yes | N |
| COLOR-07 | Neutral color system | 03 §19 | Yes | Y |
| COLOR-08 | Status color system | 03 §19 | Yes | N |
| COLOR-09 | Scientific and chart color system | 03 §19 | Yes | N |
| COLOR-10 | Warm color usage level | 03 §19 | Yes | N |
| COLOR-11 | Blue usage level | 03 §19 | Yes | N |
| COLOR-12 | Page background rules | 03 §19 | Yes | N |
| COLOR-13 | Contrast and WCAG confirmation | 03 §19 | No | Y |
| ART-01 | Mother-brand art style | 05 §18 | No | N |
| ART-02 | Intensity of photographic imagery | 05 §18 | No | N |
| ART-03 | HyDroMA visual language | 05 §18 | No | N |
| ART-04 | Marketplace visual language | 05 §18 | No | N |
| ART-05 | Photography style | 05 §18 | No | N |
| ART-06 | Proprietary graphic patterns | 05 §18 | No | N |
| ART-07 | Icon architecture | 05 §18 | No | N |
| ART-08 | Animation intensity | 05 §18 | No | N |
| ART-09 | Card and surface style | 05 §18 | No | N |
| ART-10 | Public page architecture | 05 §18 | No | N |
| ART-11 | Scientific dashboard architecture | 05 §18 | No | N |
| ART-12 | Marketplace page architecture | 05 §18 | No | N |
| ART-13 | Official document templates | 05 §18 | No | N |
| ART-14 | Social media templates | 05 §18 | No | N |
| DS-01 | Approve seven-layer architecture | 06 §19 | Yes — §3 | Y |
| DS-02 | Approve three-tier token structure | 06 §19 | Yes — §4 | Y |
| DS-03 | Approve three-theme architecture | 06 §19 | Yes — §5 | Y |
| DS-04 | Approve spacing scale | 06 §19 | Yes — §8 | N |
| DS-05 | Approve grid | 06 §19 | Yes — §9 | N |
| DS-06 | Approve breakpoints | 06 §19 | Yes — §9.3 | Y |
| DS-07 | Approve border radius | 06 §19 | Yes — §10 | N |
| DS-08 | Approve component architecture | 06 §19 | Yes — §11 | Y |
| DS-09 | Approve component construction contract | 06 §19 | Yes — §12 | N |
| DS-10 | Approve folder structure | 06 §19 | Yes — §16 | N |
| DS-11 | Approve versioning | 06 §19 | Yes — §17 | N |
| ML-03 | Persian font selection | 13 §30 | Yes — §6 | Y |
| ML-04 | Latin font selection | 13 §30 | Yes — §7 | Y |
| ML-05 | Typography role architecture | 13 §30 | Yes — §5 | N |
| ML-11 | Font loading policy | 13 §30 | Yes — §26 | N |
| D-014-04 | Final component API policy | 14 §30 | No | Y |
| D-014-05 | Final three-brand theme architecture | 14 §30 | No | Y |
| D-014-12 | Final Component Registry structure | 14 §30 | No | N |
| D-017-02 | Final icon style | 17 §27 | No | N |
| D-017-03 | Proprietary icon family design | 17 §27 | No | N |
| D-017-04 | Eco Nojin illustration style | 17 §27 | No | N |
| D-017-05 | HyDroMA illustration style | 17 §27 | No | N |
| D-017-06 | Marketplace illustration style | 17 §27 | No | N |
| D-017-08 | Final photography standard | 17 §27 | No | N |
| D-017-09 | 3D model policy | 17 §27 | No | N |
| D-017-10 | Motion graphics standard | 17 §27 | No | N |
| D-017-11 | Final Asset Registry structure | 17 §27 | No | N |
| D-020-01 | Final breakpoints | 20 §32 | Yes — §4 | Y |
| D-020-04 | Final grid structure | 20 §32 | Yes — §5 | N |
| I18N-D11 | Final Persian font | 28 §20 | No | Y |
| I18N-D12 | Final Latin font | 28 §20 | No | Y |

**Required owner:** Project Owner. `COLOR-13` and `DS-06` also affect accessibility and responsive work.

---

## 7. Domain 4 — API (45)

**Domain-level analysis**

- Dependencies: `D-034-01` (API client architecture) gates every request path. `API-D05`/`D-034-03` (response envelope) and `API-D06`/`D-034-04` (error envelope) gate every consumer. The error envelope decision is blocked by `CONF-001`.
- Consequence of postponement: no data-fetching layer, no error surface, no contract test.
- Can implementation proceed: **No** for any backend-connected feature.

| ID | Decision | Source | Options documented | Blocking |
|---|---|---|---|---|
| API-D01 | Final API client structure | 30 §30 | No | Y |
| API-D02 | API documentation standard | 30 §30 | No | N |
| API-D03 | Type generation from contract | 30 §30 | No | N |
| API-D04 | Runtime schema validator | 30 §30 | No | N |
| API-D05 | Response envelope structure | 30 §30 | No | Y |
| API-D06 | Error envelope standard | 30 §30 | No | Y |
| API-D07 | API versioning policy | 30 §30 | No | N |
| API-D08 | Timeout policy by operation type | 30 §30 | No | N |
| API-D09 | Retry and backoff policy | 30 §30 | No | Y |
| API-D10 | Idempotency policy | 30 §30 | No | Y |
| API-D11 | Long-running job policy | 30 §30 | No | N |
| API-D12 | Polling vs SSE vs WebSocket | 30 §30 | No | Y |
| API-D13 | Correlation ID standard | 30 §30 | No | N |
| API-D14 | Pagination policy | 30 §30 | No | N |
| API-D15 | Upload and download policy | 30 §30 | No | N |
| API-D16 | Contract testing tooling | 30 §30 | No | N |
| API-D17 | Mocking strategy | 30 §30 | No | N |
| API-D18 | API deprecation policy | 30 §30 | No | N |
| API-D19 | External API management policy | 30 §30 | No | N |
| API-D20 | Offline API integration policy | 30 §30 | No | N |
| API-D21 | HyDroMA scientific API structure | 30 §30 | No | N |
| API-D22 | Marketplace financial API structure | 30 §30 | No | Y |
| API-D23 | Frontend/backend compatibility policy | 30 §30 | No | Y |
| API-D24 | Contract ownership and maintenance responsibility | 30 §30 | No | N |
| D-015-07 | API idempotency standard | 15 §27 | No | Y |
| D-034-01 | Final API client architecture | 34 §26 | No | Y |
| D-034-02 | Data Access Layer structure | 34 §26 | No | Y |
| D-034-03 | Standard response contract | 34 §26 | No | Y |
| D-034-04 | Error response format | 34 §26 | No | Y |
| D-034-05 | Runtime schema validation method | 34 §26 | No | N |
| D-034-06 | Type generation tooling | 34 §26 | No | N |
| D-034-07 | API versioning policy | 34 §26 | No | N |
| D-034-08 | Retry and timeout policy | 34 §26 | No | Y |
| D-034-09 | Idempotency for sensitive operations | 34 §26 | No | Y |
| D-034-10 | Refresh token handling method | 34 §26 | No | Y |
| D-034-12 | Polling, SSE and WebSocket policy | 34 §26 | No | N |
| D-034-13 | Pagination standard | 34 §26 | No | N |
| D-034-14 | API rate limiting policy | 34 §26 | No | N |
| D-034-15 | Contract testing policy | 34 §26 | No | N |
| D-034-16 | Correlation ID standard | 34 §26 | No | N |
| D-034-19 | Offline mutation policy | 34 §26 | No | N |
| D-034-20 | Frontend/backend version compatibility policy | 34 §26 | No | Y |
| FR-D03 | Frontend/backend schema-sharing strategy | 36 §28 | No | Y |
| FR-D07 | Idempotency contract for critical submissions | 36 §28 | No | Y |
| FR-D13 | Form error-code contract | 36 §28 | No | N |

**Required owner:** Project Owner for envelope, idempotency and financial API decisions; backend architecture must co-sign (`30` §1.1 states final choice requires real Backend review).

---

## 8. Domain 5 — Authentication and Security (59)

**Domain-level analysis**

- Dependencies: `SEC-D01`/`SEC-D02` (authentication and session model) gate every authenticated surface, plus `D-034-10` and `FR-D06`.
- Critical structural problem: the three source documents number their decisions independently, so `SEC-D01` does not mean the same thing in `22`, `24` and `31` (see CONF-002). Any citation of a `SEC-D*` ID must name the document.
- Consequence of postponement: no login, no guarded route, no protected API call can be implemented.
- Can implementation proceed: **No** beyond public, unauthenticated surfaces.

**Document 22 (`EN-VI-022`) §33**

| ID | Decision | Blocking |
|---|---|---|
| SEC-D01 | Final session management architecture | Y |
| SEC-D02 | Official token storage policy | Y |
| SEC-D03 | Identity Provider architecture | Y |
| SEC-D04 | Final CSP policy | N |
| SEC-D05 | Final CORS policy | N |
| SEC-D06 | Official data classification | Y |
| SEC-D07 | Sensitive data cache policy | N |
| SEC-D08 | Primary SAST tool | N |
| SEC-D09 | Primary dependency scanning tool | N |
| SEC-D10 | SBOM policy | N |
| SEC-D11 | Security incident response policy | N |
| SEC-D12 | Official security review owner | N |

**Document 24 (`EN-VIS-024`) §28**

| ID | Decision | Blocking |
|---|---|---|
| SEC-D01 | Final session and authentication architecture | Y |
| SEC-D02 | Cookie-based vs token-based session | Y |
| SEC-D03 | Final access token and refresh token policy | Y |
| SEC-D04 | MFA selection and requirement level | N |
| SEC-D05 | Passkey support plan | N |
| SEC-D06 | Final role and permission model | Y |
| SEC-D07 | Tenant isolation model | Y |
| SEC-D08 | Final CSP policy | N |
| SEC-D09 | CSRF policy | N |
| SEC-D10 | CORS allowed origins | N |
| SEC-D11 | SAST and SCA tooling | N |
| SEC-D12 | SBOM generation and publication policy | N |
| SEC-D13 | Security incident management tooling | N |
| SEC-D14 | Log and telemetry retention policy | N |
| SEC-D15 | Cookie and consent policy | N |
| SEC-D16 | Official data classification | Y |
| SEC-D17 | Personal data retention and deletion policy | N |
| SEC-D18 | Sensitive data cache policy | N |
| SEC-D19 | Geospatial data protection policy | Y |
| SEC-D20 | Production environment security requirements | N |

**Document 31 (`EN-FE-STD-031`) §32**

| ID | Decision | Blocking |
|---|---|---|
| SEC-D01 | Final authentication model | Y |
| SEC-D02 | Session retention policy | Y |
| SEC-D03 | Credential management method | Y |
| SEC-D04 | MFA policy | N |
| SEC-D05 | Passkey policy | N |
| SEC-D06 | Authorization model | Y |
| SEC-D07 | Data classification policy | Y |
| SEC-D08 | Consent policy | N |
| SEC-D09 | Data retention policy | N |
| SEC-D10 | CSP policy | N |
| SEC-D11 | CSRF policy | N |
| SEC-D12 | Security headers policy | N |
| SEC-D13 | Dependency scanning tooling | N |
| SEC-D14 | Security testing tooling | N |
| SEC-D15 | Source map policy | N |
| SEC-D16 | Third-party script policy | N |
| SEC-D17 | Browser storage policy | N |
| SEC-D18 | Sensitive data cache policy | N |
| SEC-D19 | Security logging policy | N |
| SEC-D20 | Incident response policy | N |
| SEC-D21 | Geospatial privacy policy | Y |
| SEC-D22 | Local community data protection policy | N |
| SEC-D23 | File security policy | N |
| SEC-D24 | Administrative panel security policy | Y |
| SEC-D25 | Official security ownership | N |
| SEC-D26 | Production deployment security policy | N |

**Document 36**

| ID | Decision | Blocking |
|---|---|---|
| FR-D06 | Sensitive form data classification | Y |

**Required owner:** Project Owner. `31` §1 records `Security Ownership: To Be Defined`; until `SEC-D25` is decided there is no security authority to approve the other 25 entries.

---

## 9. Domain 6 — State Management (29)

**Domain-level analysis**

- Dependencies: `STATE-D01..D04` depend on `AUDIT-MISS-01`; `STATE-D13` depends on the financial contract (`D-034-17`); `STATE-D14` duplicates `SEC-D07` tenant isolation.
- Consequence of postponement: no data layer, no cache policy, no offline behavior.
- Can implementation proceed: **No** for any data-driven surface.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-015-03 | Final state machine standard | 15 §27 | N |
| D-015-04 | Cache and invalidation policy | 15 §27 | N |
| D-015-05 | Retry and timeout policy | 15 §27 | N |
| D-015-06 | Offline mode policy | 15 §27 | N |
| D-015-08 | Persistence policy | 15 §27 | N |
| D-015-09 | Observability standard | 15 §27 | N |
| D-015-10 | Operational notification policy | 15 §27 | N |
| D-015-11 | Long-processing management standard | 15 §27 | N |
| STATE-D01 | Final global state architecture | 29 §21 | Y |
| STATE-D02 | Client state tool | 29 §21 | Y |
| STATE-D03 | Server state tool | 29 §21 | Y |
| STATE-D04 | Form state tool | 29 §21 | Y |
| STATE-D05 | Query key policy | 29 §21 | N |
| STATE-D06 | Cache TTL policy | 29 §21 | N |
| STATE-D07 | Cache invalidation policy | 29 §21 | N |
| STATE-D08 | Optimistic update policy | 29 §21 | N |
| STATE-D09 | Persistent state policy | 29 §21 | N |
| STATE-D10 | Offline data policy | 29 §21 | N |
| STATE-D11 | Offline queue policy | 29 §21 | N |
| STATE-D12 | Scientific result cache policy | 29 §21 | N |
| STATE-D13 | Financial state policy | 29 §21 | Y |
| STATE-D14 | Tenant isolation policy | 29 §21 | N |
| STATE-D15 | Data normalization policy | 29 §21 | N |
| STATE-D16 | State migration policy | 29 §21 | N |
| STATE-D17 | Cache size limit | 29 §21 | N |
| FR-D04 | Standard form lifecycle implementation | 36 §28 | N |
| FR-D05 | Draft persistence strategy | 36 §28 | N |
| FR-D12 | Multi-step form state architecture | 36 §28 | N |
| FR-D14 | Offline form synchronization policy | 36 §28 | N |

**Required owner:** Project Owner.

---

## 10. Domain 7 — Scientific Visualization (16)

**Domain-level analysis**

- Dependencies: requires HyDroMA backend contract availability; `D-034-18` depends on the scientific platform team, not the frontend.
- Consequence of postponement: scientific interfaces cannot claim correctness; but brand, shell and non-scientific products are unaffected.
- Can implementation proceed: **Yes for non-scientific products.** Scientific surfaces must wait.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| SCI-01 | Scientific visual language architecture | 12 §25 | N |
| SCI-02 | Scientific color system | 12 §25 | N |
| SCI-03 | KPI standard | 12 §25 | N |
| SCI-04 | Chart standard | 12 §25 | N |
| SCI-05 | Map standard | 12 §25 | N |
| SCI-06 | Remote sensing standard | 12 §25 | N |
| SCI-07 | Simulation standard | 12 §25 | N |
| SCI-08 | MRV standard | 12 §25 | N |
| SCI-09 | Uncertainty display standard | 12 §25 | N |
| SCI-10 | Data quality standard | 12 §25 | N |
| SCI-11 | Sensitive data access policy | 12 §25 | N |
| D-014-06 | Final chart component contract | 14 §30 | N |
| D-014-08 | Simulation component contract | 14 §30 | N |
| D-034-11 | Job lifecycle pattern for scientific computation | 34 §26 | N |
| D-034-18 | Scientific metadata and provenance contract | 34 §26 | N |
| FR-D09 | Scientific unit-input architecture | 36 §28 | N |

**Required owner:** Project Owner with HyDroMA scientific authority. No HyDroMA representative is named in any document (`31` §1 records `Security Ownership: To Be Defined`; no equivalent field exists for scientific ownership).

---

## 11. Domain 8 — Financial Workflows (3)

**Domain-level analysis**

- Dependencies: requires the marketplace backend contract; `D-034-17` is the single most load-bearing item in this domain, because every financial component, form and cache policy references it.
- Consequence of postponement: no financial interface may be exposed. `37` §12.4 prohibits activating real financial operations without approval.
- Can implementation proceed: **No** for any financial surface; yes for non-financial products.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-014-09 | Final financial form standard | 14 §30 | N |
| D-034-17 | Financial decimal and currency contract | 34 §26 | Y |
| FR-D10 | Decimal input and formatting implementation | 36 §28 | Y |

**Required owner:** Project Owner. Financial activation additionally requires explicit authorization under `37` §12.4 and §20.

---

## 12. Domain 9 — Accessibility (28)

**Domain-level analysis**

- Dependencies: `A11Y-01`/`A11Y-D01` (ratify the target) gate all a11y acceptance; `A11Y-03`/`A11Y-D03`/`A11Y-D04` (AT and browser matrix) gate all a11y testing.
- Structural problem: two parallel registers (`A11Y-01..10` in 21, `A11Y-D01..D15` in 32) record the same decisions under different IDs (see CONF-003).
- Consequence of postponement: accessibility cannot be gated at release; `37` QG-09 cannot be evidenced.
- Can implementation proceed: **partially** — semantic HTML and keyboard rules can be followed, but conformance cannot be certified.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| DS-13 | Approve accessibility criteria | 06 §19 | N |
| WEB-09 | Approve WCAG 2.2 AA target | 11 §22 | Y |
| D-014-11 | Accessibility testing tooling and coverage | 14 §30 | N |
| A11Y-01 | Final conformance level for all products | 21 §34 | Y |
| A11Y-02 | Primary automated testing tool | 21 §34 | N |
| A11Y-03 | Browser and assistive technology matrix | 21 §34 | Y |
| A11Y-04 | Official accessibility review owner | 21 §34 | N |
| A11Y-05 | Evaluation process with users with disabilities | 21 §34 | N |
| A11Y-06 | Map data-alternative standard | 21 §34 | N |
| A11Y-07 | Chart data-alternative standard | 21 §34 | N |
| A11Y-08 | Internal touch-target size target | 21 §34 | N |
| A11Y-09 | Test report retention policy | 21 §34 | N |
| A11Y-10 | Release gate criteria | 21 §34 | Y |
| A11Y-D01 | Ratify WCAG 2.2 AA as official target | 32 §32 | Y |
| A11Y-D02 | Automated testing tool selection | 32 §32 | N |
| A11Y-D03 | Target browsers | 32 §32 | Y |
| A11Y-D04 | Target assistive technologies | 32 §32 | Y |
| A11Y-D05 | Component documentation standard | 32 §32 | N |
| A11Y-D06 | Official accessibility review owner | 32 §32 | N |
| A11Y-D07 | Periodic evaluation process | 32 §32 | N |
| A11Y-D08 | Map accessibility policy | 32 §32 | N |
| A11Y-D09 | Chart accessibility policy | 32 §32 | N |
| A11Y-D10 | Captioning and multimedia policy | 32 §32 | N |
| A11Y-D11 | Touch target size policy | 32 §32 | N |
| A11Y-D12 | Target languages and assistive technologies | 32 §32 | N |
| A11Y-D13 | Manual test level | 32 §32 | N |
| A11Y-D14 | Exception acceptance process | 32 §32 | N |
| A11Y-D15 | Real-user evaluation policy | 32 §32 | N |

**Required owner:** Project Owner. No accessibility owner is named in any document; `A11Y-04` and `A11Y-D06` both record the role as undecided.

---

## 13. Domain 10 — Localization (25)

**Domain-level analysis**

- Dependencies: `I18N-D01..D05` (languages) gate translation architecture, font selection and routing locale policy. `ML-06`/`I18N-D09` (numerals) and `ML-07`/`I18N-D10` (calendar) are the two decisions most likely to cause late rework because they affect every formatted value.
- Consequence of postponement: no content can be authored or displayed definitively; every applied formatting decision becomes provisional.
- Can implementation proceed: **partially** — a single default language can be implemented, but the multilingual architecture cannot.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| DS-12 | Approve RTL/LTR policy | 06 §19 | N |
| ML-01 | Approve base language strategy | 13 §30 | Y |
| ML-02 | Approve future expansion languages | 13 §30 | N |
| ML-06 | Approve numeral display policy | 13 §30 | Y |
| ML-07 | Approve calendar policy | 13 §30 | N |
| ML-08 | Approve units policy | 13 §30 | N |
| ML-09 | Approve RTL/LTR standard | 13 §30 | N |
| ML-10 | Approve technical glossary | 13 §30 | N |
| D-035-04 | Locale-in-URL policy | 35 §27 | Y |
| I18N-D01 | Default language for Eco Nojin | 28 §20 | Y |
| I18N-D02 | First-release languages | 28 §20 | Y |
| I18N-D03 | Official locales | 28 §20 | N |
| I18N-D04 | Default language for HyDroMA | 28 §20 | N |
| I18N-D05 | Marketplace languages | 28 §20 | N |
| I18N-D06 | Final Translation Registry structure | 28 §20 | N |
| I18N-D08 | Fallback policy | 28 §20 | N |
| I18N-D09 | Persian and Latin numeral policy | 28 §20 | Y |
| I18N-D10 | Solar and Gregorian calendar policy | 28 §20 | N |
| I18N-D13 | Official scientific glossary | 28 §20 | N |
| I18N-D14 | Dynamic content translation policy | 28 §20 | N |
| I18N-D15 | Multilingual content policy | 28 §20 | N |
| I18N-D16 | Multilingual search policy | 28 §20 | N |
| I18N-D17 | Localization testing policy | 28 §20 | N |
| I18N-D18 | New language release policy | 28 §20 | N |
| FR-D11 | Date and calendar handling strategy | 36 §28 | N |

**Required owner:** Project Owner.

---

## 14. Domain 11 — Performance (16)

**Domain-level analysis**

- Dependencies: `PERF-D01` (final budget) depends on the rendering strategy (`D-035-14`) and the framework (`AUDIT-MISS-01`).
- Consequence of postponement: performance work can reference the provisional Core Web Vitals targets in `23` §4, but cannot be gated.
- Can implementation proceed: **Yes**, using the provisional LCP/INP/CLS thresholds, provided the owner accepts them as provisional.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-016-12 | Performance criteria | 16 §28 | N |
| D-020-05 | Low-end mode policy | 20 §32 | N |
| D-020-06 | Network-aware experience policy | 20 §32 | N |
| D-020-10 | Final performance criteria | 20 §32 | N |
| PERF-D01 | Final performance budget | 23 §34 | N |
| PERF-D02 | RUM tooling | 23 §34 | N |
| PERF-D03 | Lighthouse CI tooling | 23 §34 | N |
| PERF-D04 | CDN policy | 23 §34 | N |
| PERF-D05 | Cache policy | 23 §34 | N |
| PERF-D06 | Low-end device criterion | 23 §34 | N |
| PERF-D07 | Bundle analysis tooling | 23 §34 | N |
| PERF-D08 | Performance regression policy | 23 §34 | N |
| PERF-D09 | Map monitoring method | 23 §34 | N |
| PERF-D10 | Simulation monitoring method | 23 §34 | N |
| PERF-D11 | Performance data collection policy | 23 §34 | N |
| PERF-D12 | Specialized page performance targets | 23 §34 | N |

**Required owner:** Project Owner (budget), technical team (tooling, subject to owner approval).

---

## 15. Domain 12 — Deployment, Observability and Release (38)

**Domain-level analysis**

- Dependencies: `DEP-D01` (environment architecture) and `DEP-D05` (deployment method) gate any non-local execution. `DEP-D11` (service worker) is also the practical gate for offline capability.
- Consequence of postponement: only local development is possible; no preview environment, no release candidate, no rollback path.
- Can implementation proceed: **Yes locally**, with no CDN, no staging and no release.

| ID | Decision | Source | Blocking |
|---|---|---|---|
| DEP-D01 | Final environment architecture | 26 §20 | Y |
| DEP-D02 | Repository and branch structure | 26 §20 | Y |
| DEP-D03 | Official build method | 26 §20 | N |
| DEP-D04 | Artifact retention method | 26 §20 | N |
| DEP-D05 | Frontend deployment method | 26 §20 | Y |
| DEP-D06 | CDN or reverse proxy usage | 26 §20 | N |
| DEP-D07 | Official versioning policy | 26 §20 | N |
| DEP-D08 | Release approval policy | 26 §20 | N |
| DEP-D09 | Rollback method | 26 §20 | N |
| DEP-D10 | Cache policy | 26 §20 | N |
| DEP-D11 | Service worker policy | 26 §20 | N |
| DEP-D12 | Feature flag architecture | 26 §20 | N |
| DEP-D13 | Monitoring tooling | 26 §20 | N |
| DEP-D14 | Build artifact retention policy | 26 §20 | N |
| DEP-D15 | Production access | 26 §20 | N |
| DEP-D16 | Frontend and backend release ordering | 26 §20 | N |
| DEP-D17 | Emergency release policy | 26 §20 | N |
| DEP-D18 | Release freeze policy | 26 §20 | N |
| QA-D08 | Test environment structure | 25 §29 | N |
| QA-D13 | Release candidate policy | 25 §29 | N |
| OBS-D01 | Final observability architecture | 27 §22 | N |
| OBS-D02 | Error tracking tool | 27 §22 | N |
| OBS-D03 | RUM tool | 27 §22 | N |
| OBS-D04 | Logging tool | 27 §22 | N |
| OBS-D05 | Metrics tool | 27 §22 | N |
| OBS-D06 | Tracing tool | 27 §22 | N |
| OBS-D07 | Product analytics tool | 27 §22 | N |
| OBS-D08 | Official Event Registry | 27 §22 | N |
| OBS-D09 | Sampling policy | 27 §22 | N |
| OBS-D10 | Consent policy | 27 §22 | N |
| OBS-D11 | Telemetry storage location | 27 §22 | N |
| OBS-D12 | Data retention period | 27 §22 | N |
| OBS-D13 | Roles and access | 27 §22 | N |
| OBS-D14 | Alert thresholds | 27 §22 | N |
| OBS-D15 | Anonymization policy | 27 §22 | N |
| OBS-D16 | Cross-border processing policy | 27 §22 | N |
| OBS-D17 | Incident accountability owner | 27 §22 | N |
| OBS-D18 | Official dashboards per product | 27 §22 | N |

**Required owner:** Project Owner. `37` §12.4 prohibits deployment without separate authorization regardless of these decisions.

---

## 16. Domain 13 — Governance (77)

**Domain-level analysis**

- Dependencies: `GOV-01..03` (governance principles, decision levels, authority matrix) gate the legitimacy of every other decision in this register. `ID-01..08` gate the visual identity decision itself.
- Consequence of postponement: decisions can be taken informally and later contested. This is the root governance risk in `37` §15 `GOV-003`.
- Can implementation proceed: **Yes**, provided the owner issues decisions directly rather than through an unapproved governance process.

### 16.1 Brand identity and asset governance (17)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| ID-01 | Approve evaluation criteria | 08 §18 | N |
| ID-02 | Approve criteria weights | 08 §18 | N |
| ID-03 | Approve required samples | 08 §18 | N |
| ID-04 | Approve user evaluation method | 08 §18 | N |
| ID-05 | Approve legal review process | 08 §18 | N |
| ID-06 | Approve final selection method | 08 §18 | N |
| ID-07 | Select the visual identity | 08 §18 | Y |
| ID-08 | Approve final identity version | 08 §18 | Y |
| BA-01 | Approve asset classification | 09 §21 | N |
| BA-02 | Approve naming standard | 09 §21 | N |
| BA-03 | Approve repository structure | 09 §21 | N |
| BA-04 | Approve Asset Registry | 09 §21 | N |
| BA-05 | Approve license workflow | 09 §21 | N |
| BA-06 | Approve archive policy | 09 §21 | N |
| BA-07 | Approve backup rules | 09 §21 | N |
| BA-08 | Approve release policy | 09 §21 | N |
| BA-09 | Approve information protection requirements | 09 §21 | N |

### 16.2 Brand governance (10)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| GOV-01 | Approve brand governance principles | 10 §18 | N |
| GOV-02 | Approve decision levels | 10 §18 | N |
| GOV-03 | Approve authority matrix | 10 §18 | Y |
| GOV-04 | Approve change classification | 10 §18 | N |
| GOV-05 | Approve change request workflow | 10 §18 | N |
| GOV-06 | Approve versioning policy | 10 §18 | N |
| GOV-07 | Approve document hierarchy | 10 §18 | N |
| GOV-08 | Approve agent authority policy | 10 §18 | Y |
| GOV-09 | Approve periodic audit | 10 §18 | N |
| GOV-10 | Approve emergency management | 10 §18 | N |

### 16.3 Visual asset governance (2)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-017-07 | AI-generated imagery policy | 17 §27 | N |
| D-017-12 | Asset approval process | 17 §27 | N |

### 16.4 UX research governance (12)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-018-01 | Official UX research method | 18 §29 | N |
| D-018-02 | Priority research groups | 18 §29 | N |
| D-018-03 | Participant recruitment policy | 18 §29 | N |
| D-018-04 | Interview and test recording method | 18 §29 | N |
| D-018-05 | Research tooling | 18 §29 | N |
| D-018-06 | Primary usability metrics | 18 §29 | N |
| D-018-07 | Research data retention policy | 18 §29 | N |
| D-018-08 | Design acceptance criteria | 18 §29 | N |
| D-018-09 | Public page validation method | 18 §29 | N |
| D-018-10 | Scientific dashboard validation method | 18 §29 | N |
| D-018-11 | Rural and nomadic user research method | 18 §29 | N |
| D-018-12 | A/B testing policy | 18 §29 | N |

### 16.5 Content governance (12)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-019-01 | Final central Eco Nojin message | 19 §28 | N |
| D-019-02 | Official Eco Nojin slogan | 19 §28 | N |
| D-019-03 | HyDroMA central message | 19 §28 | N |
| D-019-04 | Marketplace central message | 19 §28 | N |
| D-019-05 | Official Persian and English glossary | 19 §28 | N |
| D-019-06 | Official three-brand tone policy | 19 §28 | N |
| D-019-07 | Reference content language | 19 §28 | N |
| D-019-08 | Content Registry structure | 19 §28 | N |
| D-019-09 | Content approval roles | 19 §28 | N |
| D-019-10 | User-generated content policy | 19 §28 | N |
| D-019-11 | SEO policy | 19 §28 | N |
| D-019-12 | AI-generated content policy | 19 §28 | N |

### 16.6 Quality governance (7)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| QA-D09 | Test data management policy | 25 §29 | N |
| QA-D10 | Expected test coverage | 25 §29 | N |
| QA-D11 | Critical user journey definition | 25 §29 | N |
| QA-D12 | Regression suite policy | 25 §29 | N |
| QA-D14 | Test evidence retention policy | 25 §29 | N |
| QA-D15 | Official release approval criteria | 25 §29 | N |
| QA-D17 | Final quality approval responsibility | 25 §29 | N |

### 16.7 Dependency and supply-chain governance (15)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| D-033-01 | Package manager selection | 33 §25 | Y |
| D-033-02 | Exact version pinning policy | 33 §25 | N |
| D-033-03 | Permitted registry and usage policy | 33 §25 | Y |
| D-033-04 | SBOM format | 33 §25 | N |
| D-033-05 | Software composition analysis tool | 33 §25 | N |
| D-033-06 | License compliance tool | 33 §25 | N |
| D-033-07 | Install script execution policy | 33 §25 | N |
| D-033-08 | Dependency update automation tool | 33 §25 | N |
| D-033-09 | Dependency security review period | 33 §25 | N |
| D-033-10 | Vulnerability remediation SLA | 33 §25 | N |
| D-033-11 | SBOM requirement per release type | 33 §25 | N |
| D-033-12 | Provenance attestation level | 33 §25 | N |
| D-033-13 | External runtime script policy | 33 §25 | N |
| D-033-14 | Internal fork management policy | 33 §25 | N |
| D-033-15 | Official dependency governance responsibility | 33 §25 | N |

### 16.8 Form and content governance (2)

| ID | Decision | Source | Blocking |
|---|---|---|---|
| FR-D15 | Form analytics and privacy policy | 36 §28 | N |
| FR-D16 | Form specification and ownership registry | 36 §28 | N |

**Required owner:** Project Owner. `GOV-03` and `GOV-08` must be decided first because they define who may take every other decision in this register.

---

## 17. Critical-Path Decision Chains

The following chains show why certain decisions must precede all others. Each arrow means "blocks".

```text
AUDIT-MISS-01 (framework, MISSING)
  -> D-035-01 (routing library)
  -> D-035-14 (rendering strategy)
  -> PERF-D01 (performance budget)
  -> D-014-01 (component library)
  -> STATE-D01..D04 (state architecture)
  -> D-015-01..D02 (state tools)
  -> QA-D01..D03 (test tooling)

GOV-03 (authority matrix)
  -> every other decision's validity

ID-07 (select visual identity)
  -> COLOR-01..03
  -> TYPO-01..06
  -> DS-03 (three-theme architecture)
  -> D-014-04 (component API)
  -> all visual implementation

SEC-D01 / SEC-D02 (auth + session)
  -> D-034-10 (refresh token)
  -> D-035-05 / D-035-18 (protected routes)
  -> FR-D06 (sensitive form data)
  -> all authenticated surfaces

D-034-17 (financial decimal + currency)
  -> STATE-D13 (financial state)
  -> FR-D10 (decimal input)
  -> D-014-09 (financial forms)
  -> financial implementation (owner activation still required)

D-033-01 / D-033-03 (package manager + registry)
  -> reproducible install
  -> D-033-02 (pinning)
  -> any dependency installation
```

---

## 18. Register Totals

| Metric | Value |
|---|---|
| Total recorded decisions | 480 |
| Decisions recorded as OPEN | 480 |
| Decisions recorded as approved | 0 |
| Missing decisions identified by this audit | 1 (`AUDIT-MISS-01`) |
| Decision entries flagged as blocking a first controlled implementation phase | 113 |
| Decision entries not flagged as blocking | 367 |
| Source documents contributing decisions | 34 (02–36) |
| Documents with no decision register | 2 (01, 37) |

Blocking entries by domain: Architecture 14, Framework 10, Design system 22, API 19, Authentication and security 19, State 5, Scientific 0, Financial 2, Accessibility 7, Localization 6, Performance 0, Deployment/observability/release 3, Governance 6.

These 113 entries are not 113 independent choices. Repeated expressions of one choice are counted once per identifier, because each identifier must be resolved in its own document. The consolidated distinct-choice count can only be produced after the owner designates the authoritative document per domain, which is exactly what CONF-002, CONF-003, CONF-012 and CONF-013 require.

---

## 19. Non-Authorization Statement

This register consolidates and classifies decisions. It does not approve, resolve, or pre-select any of them. Per `37` §7.3, sending a decision from `OPEN` to any terminal state requires the recorded owner's explicit approval. No such approval exists as of the audit date.
