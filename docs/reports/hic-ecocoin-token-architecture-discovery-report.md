# HIC & EcoCoin — Token Architecture Discovery Report

**Classification:** READ-ONLY / HISTORICAL DISCOVERY / ARCHITECTURE REVIEW
**Final classification:** `HIC_ECOCOIN_ARCHITECTURE_DISCOVERY_COMPLETE`
**Date:** 2026-11-25
**Scope:** No code, configuration, documentation or Git state was modified. This report is the only file created.

---

## 1. Executive summary

- **HIC is not defined anywhere in the available project materials.** Across the whole repository the token `HIC` occurs only as the pair “EcoCoin/HIC” inside owner-gated open-decision and module-catalog entries. No full name, purpose, nature, users, functionality or issuance/governance mechanism for HIC is recorded. **The HIC definition remains unrecovered** (Section 4).
- The only recorded relationship is **negative and procedural**: EcoCoin and HIC are *not* assumed identical, and both are `OWNER_DECISION_REQUIRED` (decision `D-15`, unknown `U-08`). No issuance, token, chain or conversion is authorized.
- A **non-tradable internal EcoCoin accounting foundation was implemented in Phase 3.64** (append-only idempotent ledger, reward rules, challenges, server-verified participation). This is an *implementation* of an internal participation-credit concept; it is **not** a definition or activation of the historical “EcoCoin”, and it does **not** implement HIC.
- Recommended direction: keep HIC **dormant and undefined** until the owner defines it; keep EcoCoin internal and non-tradable; reuse the existing ledger/reward/challenge architecture; add separation-of-duties controls before any value-bearing or tokenized capability (Sections 7–9).

Confidence: **High** for the negative findings (HIC undefined; owner-gated; no token activation). **Medium** for any conceptual mapping between the Phase 3.64 code and the historical “EcoCoin” label.

---

## 2. Historical discovery

Searches performed (read-only) across the repository for: `HIC`, `EcoCoin`, `token`, `Token Registry`, `tokenomics`, `issuance`, `wallet`, `DEC-TOKEN`, `DEC-WALLET`, `D-TOK`, `DEC-LEDGER`, `DEC-REWARD`, plus incentive/reward/challenge/participation/MRV/governance terms.

Findings by theme:

- **HIC**: 44 matches for the whole-word token, **all** in the form “EcoCoin/HIC” within architecture decision ledgers, module catalogs and frontend status docs. No expansion, definition or standalone HIC entry exists.
- **EcoCoin**: appears as an owner-gated digital-economy instrument; never defined economically; explicitly “not assumed identical” to HIC.
- **Token / tokenization**: only `DEC-TOKEN` (“Tokenization Center”) — status `REJECT (activate)`, documentation-only, disabled. `openzeppelin-contracts` is recorded as a *library only*, `DEFER`, “only if blockchain/owner-gated”.
- **Wallet / internal economy**: `DEC-WALLET`, `DEC-LEDGER`, `DEC-REWARD`, `DEC-TXN` modules (all `proposed`, `DEFER`, owner-gated); `WAL-01..07` sitemap; `WALLET_ACCESS` capability; decision `D-16` (wallet/payment).
- **Rewards / challenges / participation**: `DEC-REWARD` module; workflow `WF-19` “Internal Reward Request”; cross-module flow `F2 Restoration → Challenges → Field → Evidence → EcoCoin → MRV`.
- **MRV**: `MRV-ESTIMATE` (never sellable), `MRV-CREDIT` (record only, no issuance), independent `MRV_VERIFIER` ≠ `MRV_SPECIALIST`.
- **Governance / identity**: `D-15`/`U-08` owner decisions; `RBAC+ABAC+SoD`; `WALLET_ACCESS` owner-gated capability.

No historical record establishes an approved HIC design. Presence of a concept in a document is **not** treated as approval.

---

## 3. Source evidence (classified)

Classification key: **A** confirmed historical decision · **B** proposal not confirmed approved · **C** architectural concept · **D** assumption/interpretation · **E** unresolved.

| # | Class | Finding | Source (file:line) | Evidence (quote / note) | Confidence |
|---|---|---|---|---|---|
| 1 | A | No token/blockchain activation is authorized; token module is disabled | `architecture/ECO-NOJIN-MODULE-CATALOG.csv:147`; `architecture/consolidated-v1/ECO-NOJIN-MASTER-ARCHITECTURE.md:877-880` | `DEC-TOKEN … REJECT (activate) … documentation only; disabled`; “هیچ توکن/قرارداد هوشمندی ایجاد یا فعال نشد” (no token/smart-contract created or activated) | High |
| 2 | A | EcoCoin/HIC decision is still open (not decided) | `architecture/ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md:28` | `D-15 EcoCoin / HIC … OWNER_DECISION_REQUIRED` | High |
| 3 | A | Definition of EcoCoin and HIC is an owner responsibility | `architecture/ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md:91` | `U-08 تعریف EcoCoin و HIC — OWNER` | High |
| 4 | A | EcoCoin and HIC are not identically defined in existing docs | `architecture/consolidated-v1/ECO-NOJIN-MASTER-ARCHITECTURE.md:575`; `ECO-NOJIN-MASTER-ARCHITECTURE-V2.md:542` | “FACT EcoCoin و HIC در اسناد موجود یکسان تعریف نشده‌اند” | High |
| 5 | A | No upstream project defines EcoCoin/HIC (gap) | `architecture/upstream-source-audit/UPSTREAM-GAP-AND-OVERLAP-REPORT.md:40` | `G4 EcoCoin/HIC tokenomics — No project defines EcoCoin/HIC; openzeppelin is a library only — HIGH — owner-gated; custom` | High |
| 6 | B | Technical proposal: EcoCoin and HIC are two independent concepts, no issuance | `architecture/ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md:28` | “دو مفهوم مستقل؛ بدون انتشار” (two independent concepts; no issuance) — proposal column of a `DESIGN — NOT APPROVED` doc (`:4`) | Medium-High |
| 7 | B | Digital-economy modules are proposed/deferred, owner-gated | `architecture/ECO-NOJIN-MODULE-CATALOG.csv:145-149` | `DEC-LEDGER/DEC-WALLET/DEC-REWARD/DEC-TXN … proposed … DEFER … owner gated / internal only` | High |
| 8 | B | Internal reward request workflow (verify→approve→credit, four-eyes) | `architecture/ECO-NOJIN-WORKFLOW-CATALOG.csv:20` | `WF-19 Internal Reward Request … REQUESTED → VERIFIED → APPROVED → CREDITED … manager + compliance` | High |
| 9 | B | Cross-module flow linking challenges→evidence→EcoCoin→MRV is partial | `docs/architecture/frontend/CROSS_MODULE_FLOWS.md:16,99,111` | `F2 … PARTIAL`; “EcoCoin — ABSENT — definition is owner decision D-15”; “No EcoCoin or carbon-credit issuance may be inferred from a field observation” | High |
| 10 | C | Digital Economy is a bounded context (BC-DECO) with 7 modules | `architecture/executable-v1/ECO-NOJIN-EXECUTABLE-ARCHITECTURE.md:91` | `BC-DECO | Internal ledger, wallet, tokenization, rewards, transactions, compliance, risk | 7 | Digital Economy | Synchronous API (owner-gated)` | High |
| 11 | C | Wallet/ledger separation from finance GL | `architecture/independent-review-v2/INDEPENDENT-ARCHITECTURE-REVIEW-V2.md:161,232` | “Wallet vs GL separation — PASS — DEC-LEDGER (L9 Digital Economy) vs ACC-JOURNAL (L9 Finance) — separate modules” | High |
| 12 | C | MRV credits are record-only; no auto-issuance; estimate never sellable | `architecture/ECO-NOJIN-MODULE-CATALOG.csv:62-64,186`; review `:286` | `MRV-CREDIT … record only; no issuance`; `MRV-ESTIMATE … never sellable`; `RegistryCredit … issuance external` | High |
| 13 | C | Tokenomics folded into D-15; wallet/tokenization owner-gated | `architecture/RECONCILIATION-AUDIT-REPORT.md:84,152` | “Set 1 D10 Tokenomics → Set 2 D-15 EcoCoin/HIC”; “EcoCoin / HIC / wallet / tokenization … ✓ (owner-gated)” | High |
| 14 | C | Frontend module registry: EcoCoin/HIC owner decision, no flow | `docs/architecture/frontend/module-registry.json:161` | “EcoCoin/HIC definition and token economics are owner decisions (D-15). No frontend, ledger, or issuance flow.” | High |
| 15 | C | Phase 3.64 report itself records HIC as undefined/dormant | `docs/reports/phase-3.64-rewards-challenges-foundation-report.md:161-168` | “HIC is not defined, merged, issued or converted here … dormant for HIC/token/blockchain”; “Authoritative HIC definition … [pending]” | High |
| 16 | D | Any expansion of “HIC” (e.g., hydrology/habitat incentive credit) would be an unsupported inference | — | No source expands the acronym; not inferred | High (that it is unsupported) |
| 17 | D | Mapping the Phase 3.64 internal unit to the historical “EcoCoin” is interpretive | `services/api/src/db.mjs:180`; `capabilities.ts:162-176` | Code implements an internal non-tradable unit; historical “EcoCoin” was never economically defined | Medium |
| 18 | E | HIC full name, purpose, nature, users, functionality, EcoCoin relation, issuance/governance | — | Unrecovered (no evidence) | High (unrecovered) |
| 19 | E | Token economics, conversion, redemption, transferability, blockchain, external issuance | `ARCHITECTURE-DECISIONS-OPEN.md:153-164` (D-INT-02 out of scope); `D-15` | Owner decisions, unresolved | High |

---

## 4. Confirmed HIC definition, if recoverable

**Not recoverable.** No source in the repository defines HIC’s full name, purpose, conceptual nature, intended users, functionality, or any issuance/circulation/reward/governance/accounting mechanism. HIC appears exclusively as the second element of the fixed pair “EcoCoin/HIC” in owner-gated decision and catalog entries (evidence #1–#5, #14). The architecture explicitly states the two are not identically defined (#4) and leaves the definition to the owner (#3, `U-08`).

Per the mission’s instruction not to invent missing information: **the HIC definition remains unrecovered.** Any specific expansion or role for HIC would be fabrication.

---

## 5. Historical relationship with EcoCoin

- The **only** recorded relationship is that they are **paired but distinct** and **both undefined/owner-gated**: `D-15` proposes “two independent concepts; no issuance” (proposal, not approved — #6), and `U-08` assigns their definition to the owner (#3).
- The architecture **does not assume they are identical** (#4) and records **no** issuance, conversion, transfer or governance link between them (#1, #13).
- The Phase 3.64 implementation introduces an internal non-tradable EcoCoin unit (#15, #17) but **does not** reference, define or connect HIC in any way (no HIC table, route, type or config exists in `services/api` or `apps/platform`).

Conclusion: historically, **no confirmed functional relationship between HIC and EcoCoin exists**; only a documented *open question* about whether they are one or two concepts.

---

## 6. Conceptual separation

The following are **distinct** concepts in the record and should not be assumed to share accounting, issuance, ownership or governance:

| Concept | Nature in record | Key evidence |
|---|---|---|
| **EcoCoin** | Undefined digital-economy instrument; owner-gated; not assumed = HIC | #2,#4,#6 |
| **HIC** | Undefined; unrecovered | #4,#18 |
| **Internal participation credits** | What Phase 3.64 actually implements (non-tradable, reconstructible) | #15,#17 |
| **Rewards / Challenges** | `DEC-REWARD`, `WF-19`, challenge catalogue | #7,#8 |
| **Verified activities** | Server-verified participation (Phase 3.64); `MRV_VERIFIER` independent | #12, `ECO-NOJIN-USER-ROLE-MATRIX.csv:35` |
| **Environmental impact / MRV evidence** | `MRV-ESTIMATE` (never sellable), `MRV-EVID`, `MRV-CREDIT` (record only) | #12 |
| **Governance** | RBAC+ABAC+SoD; owner decisions; `COMPLIANCE_OFFICER` | #3,#19 |
| **External digital assets / blockchain tokens** | `DEC-TOKEN` REJECT(activate); openzeppelin library-only | #1,#5 |
| **Marketplace incentives** | `D-INT-02` payments out of scope; marketplace separate | #19 |

Do **not** merge these. In particular, MRV carbon estimates/credits are **not** EcoCoin, and EcoCoin is **not** a blockchain token.

---

## 7. Current EcoCoin architecture assessment (Phase 3.64)

Evidence from source (read-only):

- **Ledger (immutable, append-only):** `eco_coin_ledger` table with `UNIQUE (org_id, reference)` — `services/api/src/db.mjs:180-204`. No UPDATE/DELETE route exists; `PATCH/DELETE /v1/ecocoin/ledger` → 404 (tests `services/api/tests/rewards.test.mjs:221-222`).
- **Idempotency / duplicate prevention:** `creditEcoCoin` uses `INSERT OR IGNORE` and returns the original row with `duplicate: true` on repeat — `services/api/src/server.mjs:1090-1104`.
- **Reward rules:** create/list/update with non-negative integer amount and optional per-user `issuance_limit` — `server.mjs` reward-rule routes; limit enforced at verification `server.mjs:1506-1512`.
- **Challenges:** lifecycle state machine `draft→published→closed→archived`, workflow-owned status — `server.mjs:1019-1022,1419-1422`; table `db.mjs:143`.
- **Participation & verification:** join published challenge (duplicate/capacity/window enforced); only owner/admin `verify` issues reward — `server.mjs` participate/verify routes; deterministic reference `challenge-reward:<participationId>` `server.mjs:1513-1514`.
- **Balance reconstruction:** sums of credits−debits — `server.mjs:1262`; summary `server.mjs:1236-1260`; reconciliation `server.mjs:1272-1281`.
- **Compensating entries:** owner/admin `POST /v1/ecocoin/adjustments` posts credit/debit with mandatory reason — `server.mjs:1125-1140`.
- **Ownership / tenancy:** every query filters `org_id` via `orgFrom`; cross-org → 404 (tests `rewards.test.mjs:256-264`).
- **RBAC:** write roles for rules/ledger; owner/admin for verify/adjust/reconcile; members may participate/read summary (tests `rewards.test.mjs`).
- **Auditability:** `audit()` rows for `ecocoin.credit/debit/reconcile` and `challenge.*`.
- **Frontend integration:** `apps/platform/src/sections/rewards/*`, hooks `services/hooks.ts`, api-client `packages/api-client/src/client.ts`, nav `content/pages.ts` (incentives), `capabilities.ts:162-192`.

**Implemented vs proposed:** implemented = internal non-tradable ledger + rewards + challenges + verified participation. **Not implemented / prohibited:** token issuance, blockchain, transfer, exchange, redemption, monetary value, HIC (all owner-gated).

**Assessment:** the foundation is coherent, idempotent, auditable and tenancy-safe for an *internal* unit. Gaps for future value-bearing use: no separation-of-duties between verifier and adjuster (both owner/admin), no four-eyes approval, no monetary/Decimal ledger (integer EcoCoin units only), no external-registry linkage.

---

## 8. Proposed architecture boundaries (evidence-based, reuse-first)

Reuse the existing modular monolith; add no new infrastructure. Recommended boundaries:

1. **Reward Engine** (exists): reward rules + challenge catalogue + lifecycle + participation + verification. Keep as the *only* producer of reward grants.
2. **EcoCoin Ledger** (exists): append-only, idempotent, reconstructible. Remains the single source of truth for internal balances; corrections only via compensating entries.
3. **Participation / Verified-activity records** (exists): the evidence that a reward is *earned*; verification is an explicit, audited human attestation.
4. **Environmental activity / MRV** (separate, existing pages): MRV estimates/credits stay **record-only**, never auto-converted to EcoCoin; any future link must be an explicit, owner-approved adapter with provenance + uncertainty.
5. **Future HIC subsystem**: **do not build** until the owner defines HIC. If later defined as distinct, model it as a separate bounded context with its own ledger/issuance rules — do not overload the EcoCoin ledger.
6. **Identity & authorization** (exists): reuse RBAC + tenancy + audit; add `SoD`/four-eyes before value-bearing operations.
7. **External integration**: only through `contracts/` adapters; blockchain/token registry remains disabled (`DEC-TOKEN` REJECT(activate)).

Principle: **do not merge** EcoCoin, HIC, MRV credits and external tokens; **do not** create a parallel subsystem; extend the existing one.

---

## 9. Risks & governance

| Risk | Current mitigation | Residual / future need |
|---|---|---|
| Issuance abuse | owner/admin only; no user mint path | SoD: verifier ≠ adjuster; four-eyes for adjustments |
| Duplicate credits | `UNIQUE(org_id,reference)` + `INSERT OR IGNORE` | add alerting on `duplicate:true` spikes |
| Concurrent issuance | SQLite WAL + unique constraint; single-writer | move to DB-level transaction/queue if scaled |
| Verification fraud | owner/admin attestation; audit | independent verifier role; evidence attachment |
| Tenant leakage | `org_id` filters; tested 404 | keep leak tests in CI |
| Administrative abuse | owner/admin gate; audit | dual approval, rate limits, anomaly review |
| Ledger inconsistency | `reconcile` endpoint | scheduled reconciliation + negative-balance guard |
| Reward-policy manipulation | owner-gated config; issuance limits | versioned policy + approval trail |
| Conflict of interest | — (verifier can also adjust) | enforce separation of duties |
| Future tokenization | `DEC-TOKEN` disabled | legal/owner review before any activation |
| Premature financial linkage | payments out of scope (D-INT-02) | keep money/chain isolated until authorized |

No legal conclusions are drawn; token economics are not determined here.

---

## 10. Owner decisions (must remain with the owner)

HIC definition · HIC purpose · HIC–EcoCoin relationship · token architecture · economic model · issuance policy · monetary value · conversion ratios · redemption · transferability · blockchain activation · external issuance · governance model · marketplace integration · jurisdiction/legal review (D-14/D-15/D-16/D-INT-02). None of these were decided in this mission.

---

## 11. Recommended development sequence

1. **Owner defines HIC** (or confirms it is dropped/merged) — closes `D-15`/`U-08`.
2. Keep EcoCoin **internal, non-tradable**; harden with **SoD + four-eyes** for adjustments/verification.
3. Add **scheduled reconciliation** and anomaly alerting.
4. Link **MRV evidence** to participation as *record-only* provenance (no auto-credit).
5. Only after explicit owner approval: design any **external adapter / tokenization** behind `contracts/`, with legal review — `DEC-TOKEN` stays disabled until then.
6. Do not build a separate HIC subsystem unless/until HIC is defined as distinct.

---

## 12. Unresolved questions

- What is HIC (full name, nature, users, function)? — **unrecovered**.
- Is HIC the same as, a parent of, or unrelated to EcoCoin? — **unresolved (D-15)**.
- What are EcoCoin’s economics, if any? — **owner**.
- Will any token/chain ever be activated? — **owner (currently rejected/disabled)**.
- Should MRV credits ever convert to internal credits? — **owner; currently prohibited**.

---

## 13. Read-only preservation evidence

- `git rev-parse HEAD` = `3dbd46532ba780eb1c8eff5ef8ad642853145ed0` (unchanged) on branch `main`.
- No source, config, documentation or Git state was modified; the only file created is this report.
- No dependency installed, no environment changed, no commit/push/branch/tag/remote/deploy performed, no concurrent agent interfered with.
- Investigation used read-only search/read only.

**Final classification:** `HIC_ECOCOIN_ARCHITECTURE_DISCOVERY_COMPLETE` — with the explicit limitation that **HIC’s definition is unrecovered**; no definition was forced.