# SMART CONTRACT AGENT — TRAINING REPORT

**Agent designation:** Smart Contract Architect & Security Engineer
**Project:** Eco Nojin Ecosystem — Keshat va Sanat Dasht Omid Narvan (کشت و صنعت دشت امید نارون)
**Stage:** Stage 1 — Training, Knowledge Acquisition & Qualification
**Execution mode:** Research, learning, architectural understanding, security analysis, qualification
**Implementation authorization:** NOT GRANTED (no code, deploy, token, key, wallet or economic activation)
**Date:** 2026-11-27
**Classification:** `TECHNICAL_TRAINING_COMPLETED_AWAITING_EVALUATION`
**Repository state at start:** branch `main`, HEAD `a3103061f561eb4289137b5f3362785580dfe28b`

> This document is the **only** file created by this mission. No Eco Nojin source, configuration,
> application, engine, service, contract, dependency, wallet, key or Git state was created, modified,
> staged, committed, pushed or deployed. See §20 for preservation evidence. The 289 pre-existing
> working-tree entries observed at start are **not** the work of this agent and were left untouched.

---

## 0. Document control and deliverable crosswalk

This report is the "separate training dossier". It contains all eight required training deliverables
and all nineteen required report sections in one authoritative document (a second, competing document
would violate the repository's single-authority documentation principle, ADR-0001 / D-DOC-01).

| Required training deliverable | Where it lives in this report |
|---|---|
| Deliverable 1 — Technical Knowledge Map | §4 |
| Deliverable 2 — Architecture Comparison | §5 |
| Deliverable 3 — Security Threat Model | §9 |
| Deliverable 4 — Standards Matrix | §7 |
| Deliverable 5 — Toolchain Matrix | §8 |
| Deliverable 6 — Eco Nojin Use-Case Assessment | §10 |
| Deliverable 7 — Learning & Security Roadmap | §18 |
| Deliverable 8 — Qualification Assessment | §15 |

| Required report section | Section |
|---|---|
| 1 Executive summary | §1 |
| 2 Training coverage | §2 |
| 3 Sources | §3 |
| 4 Technical knowledge map | §4 |
| 5 Blockchain architecture comparison | §5 |
| 6 Smart contract security analysis | §6 |
| 7 Standards matrix | §7 |
| 8 Toolchain matrix | §8 |
| 9 Threat model | §9 |
| 10 Eco Nojin use-case assessment | §10 |
| 11 Token economics considerations | §11 |
| 12 Environmental applications | §12 |
| 13 Privacy and legal risks | §13 |
| 14 Technical challenge responses | §14 |
| 15 Competency assessment | §15 |
| 16 Uncertainties | §16 |
| 17 Knowledge gaps | §17 |
| 18 Recommended future learning | §18 |
| 19 Qualification status | §19 |
| (supporting) Preservation evidence | §20 |
| Appendix A — Glossary · B — Source register · C — Standards quick index | Appendices |

**Reading rule.** Every material technical claim carries a source and, where relevant, a version or
date and a confidence level. Claims about the *Eco Nojin repository* are marked **[REPO]** and cite
`file` or a prior report. Claims about the *external technical world* are marked **[EXT]** and cite
the source register in §3 / Appendix B. Where I am uncertain, I say so (§16).

---

## 1. Executive summary

- **Blockchain is not currently justified for Eco Nojin's core.** The only live economic primitive in
  the repository is an **internal, non-tradable, integer-denominated EcoCoin ledger** (append-only,
  idempotent, tenancy-filtered, read-only over the API, with compensating adjustments and a
  reconciliation endpoint) **[REPO: docs/reports/hic-ecocoin-token-architecture-discovery-report.md §7;
  docs/reports/phase-3.65-a-ecocoin-ledger-integrity-report.md]**. A conventional database with
  cryptographic audit trails delivers the same guarantees at a fraction of the cost and complexity.
- **HIC is undefined and must stay dormant.** No source in the repository defines HIC; the token
  appears only inside the fixed pair "EcoCoin/HIC" in owner-gated decision ledgers **[REPO:
  hic-ecocoin-token-architecture-discovery-report.md §4]**. Any expansion of the acronym would be
  fabrication. Tokenization is explicitly disabled (`DEC-TOKEN … REJECT (activate)`).
- **The hardest problem is not the ledger — it is the oracle.** Blockchain can make a record
  tamper-evident and timestamped; it **cannot** verify that an environmental measurement reflects
  physical reality. "Garbage in, immutable garbage out" is the governing constraint for any MRV or
  carbon application **[EXT: JASF-2026-005 dMRV review; Gate Learn 2026-10-26; Climate Ledger Initiative]**.
- **Security engineering does not end at deployment.** 2025–2026 losses show the dominant on-chain
  failure classes are **oracle/price manipulation** (OWASP SC02; 2026: ~$159M across thin-market
  incidents incl. Tectonic ~$120M), **reentrancy** (SC05; Solv 2026), **access control**, and
  **arithmetic/rounding** (Balancer v2 ~$121M, Nov 2025) **[EXT: OpenZeppelin 2025 rewind; Guardian
  oracle-exploits-2026; Guardix DeFi-hacks-2026]**. Passing tests ≠ secure.
- **Recommended posture for Stage 2+:** keep EcoCoin internal; harden with separation-of-duties and
  four-eyes approval; add scheduled reconciliation and anomaly alerting; treat any external
  anchoring as *hash/provenance only* with explicit uncertainty; escalate every token/legal question
  to the owner and to qualified legal review. Do **not** design a final EcoCoin/HIC economic model yet.
- **Qualification:** technical training is complete to the level expected of a design-stage specialist,
  with named gaps (no hands-on Foundry/Halmos/Certora execution in this environment, no formal
  verification, no legal qualification). Status: `TECHNICAL_TRAINING_COMPLETED_AWAITING_EVALUATION`.

---

## 2. Training coverage (Modules A–J)

Coverage is stated honestly: what was *studied from authoritative sources* vs. what was *only read
about* vs. what was *not executed* (this environment installs nothing).

| Module | Topic | Studied (source-backed) | Verified by execution? | Confidence |
|---|---|---|---|---|
| A | Blockchain architecture (L1/L2, rollups, EVM, gas, finality, RPC, wallets) | Yes — ethereum.org, EIP pages | No (no network interaction) | High (conceptual) |
| B | Solidity & contract engineering (storage/memory/calldata, ABI, proxies, upgradeability) | Yes — Solidity 0.8.39 docs, OZ 5.7 docs | No compiler run here | High (conceptual), Medium (version-specific) |
| C | Smart contract security (reentrancy, access control, oracle, MEV, signatures, proxies, governance) | Yes — OWASP SC Top-10 2025/2026, SWC, incident postmortems | No (no testbed) | High |
| D | Standards & protocols (ERC-20/721/1155/165/2612/4626/4337/2771/2981, EIP-712/1271/8004/7702) | Yes — eips.ethereum.org, ethereum.org | No | High |
| E | Toolchain (Foundry, Hardhat, OZ, Slither, Echidna, Medusa, Mythril, Solhint, Tenderly) | Yes — official docs + 2026 comparisons | No install (forbidden) | High (comparative), Medium (hands-on) |
| F | Testing (unit/integration/fuzz/invariant/differential/fork/simulation) | Yes — Foundry/Hardhat 3 docs, DeFiSec 2026 | No | High (conceptual) |
| G | Token economics & incentives (mint/burn/vesting/Sybil/farming/sustainability) | Yes — critical literature + ERC-8004 Sybil notes | No | Medium-High |
| H | Governance & decentralization (multisig, timelock, DAO, voting, emergency powers) | Yes — OZ Governor docs, incident patterns | No | High |
| I | Blockchain & environmental systems (MRV, remote sensing, provenance, oracle limits) | Yes — dMRV reviews, IETA buyer guide | No | High |
| J | Privacy & legal risk awareness (on-chain PII, pseudonymity, data minimization) | Yes — ethereum.org privacy, legal framing | No (not legal advice) | Medium (awareness only) |

**Explicit non-coverage (honest limits):** I did not compile a contract, run Foundry/Hardhat, execute
Slither/Echidna/Medusa/Halmos, deploy to a testnet, or read a live chain. All tool and version claims
are from documentation and reputable 2026 comparisons, not from local execution.

---

## 3. Sources (authoritative-first)

Full register with access dates is in **Appendix B**. Primary sources used, in priority order:

1. **Ethereum Foundation** — ethereum.org (account abstraction, ERC-4626, security-tools guide), eips.ethereum.org (EIP-712, ERC-20/721/1155/165/2612/4626/4337/2771/2981, EIP-7702, ERC-8004).
2. **Solidity** — 0.8.39 release announcement (2026-11-19), 0.9.0-pre.1 (2026-11-26), docs.soliditylang.org (0.8.40-develop), Changelog.
3. **OpenZeppelin** — Contracts v5.7.0 release (2026-07-29), 5.x changelog/docs, 2025 security rewind.
4. **Foundry / Hardhat** — getfoundry.sh, hardhat.org (Hardhat 3 migration + config), 2026 comparison articles (metlabs, rick.build, DeFiSec).
5. **Security tooling** — Crytic/Trail of Bits (Slither, Echidna, Medusa), Consensys Diligence (Mythril), OWASP Smart Contract Top 10 (2025/2026), SWC Registry.
6. **Incident evidence** — OpenZeppelin 2025 rewind, Guardian "Crypto Hacks Database" & "Oracle Exploits 2026", Guardix DeFi-hacks-2026, Rekt-referenced postmortems.
7. **Environmental / dMRV** — JASF-2026-005 dMRV review, IETA MRV Buyer's Guide, Climate Ledger Initiative, Frontiers 2026 blockchain-IoT carbon certification.
8. **Eco Nojin repository (REPO)** — `ARCHITECTURE-DECISIONS-OPEN.md`, `docs/reports/hic-ecocoin-token-architecture-discovery-report.md`, `docs/reports/phase-3.65-*`, `ROOT-STRUCTURE-MANIFEST.md`, `contracts/README.md`.

**Rejected source classes** (per mission): social-media posts, marketing pages, unverified tutorials,
AI summaries without primary backing. Vendor benchmark numbers (e.g., thirdweb adoption counts) are
treated as vendor-reported and flagged.

---

## 4. Technical Knowledge Map (Deliverable 1)

### 4.1 Core competencies (solid, source-backed)

- **EVM execution model:** accounts (EOA vs contract), transaction lifecycle, `msg.sender`/`tx.origin`,
  gas accounting, `memory`/`storage`/`calldata` separation, storage layout and slots, ABI encoding,
  events/logs, `require`/`revert`/custom errors, modifiers, libraries, interfaces, inheritance and C3
  linearization, `delegatecall`/`call`/`staticcall` semantics.
- **Solidity version discipline:** 0.8.x checked arithmetic by default; use the **latest released**
  compiler for production (docs.soliditylang.org); 0.8.39 (2026-11-19) fixed a *storage-corruption*
  bug in recursive-struct copies and is "likely the last 0.8"; 0.9.0 pre-release exists (2026-11-26)
  and will make the IR pipeline default later — so **pin the compiler version** and re-audit on upgrade.
- **Standards literacy:** ERC-20/721/1155/165, ERC-2612 permit, ERC-4626 vaults (+7540/7575), ERC-4337
  account abstraction + EIP-7702, ERC-2771 meta-tx, ERC-2981 royalties, EIP-712 typed signatures,
  ERC-1271 contract-wallet signatures, ERC-8004 trustless agents.
- **Security fundamentals:** checks-effects-interactions, reentrancy guards, access control
  (ownable/role-based/two-step), pull-over-push payments, safe ERC-20 handling, signature replay /
  nonce / domain separation, initialization & proxy safety.
- **Testing literacy:** unit/integration/fork, stateless fuzzing vs stateful invariant/property
  testing, negative testing, gas regression; the difference between coverage, correctness, security
  verification, formal verification and audit.

### 4.2 Advanced competencies (understood, not yet executed here)

- Upgradeability patterns (transparent proxy, UUPS, beacon, diamonds), storage-collision avoidance,
  initializer hygiene, ERC-1967 storage slots.
- Account abstraction (ERC-4337 EntryPoint, UserOperations, paymasters, factories) and EIP-7702
  delegation (`0xef0100 || address`), and the resulting change to trust assumptions (stop assuming
  `msg.sender` is an EOA; `tx.origin == msg.sender` is no longer a "not a contract" test).
- Oracle design: push vs pull, TWAP vs spot, multi-source median, staleness/heartbeat checks,
  L2 sequencer-uptime feeds, donation/NAV manipulation resistance.
- MEV/front-running/sandwich mechanics and commit-reveal / batch-auction mitigations.
- Economic/security reasoning: Sybil resistance, incentive compatibility, reward sustainability,
  flash-loan atomicity.

### 4.3 Security competencies (analysis-level)

- Vulnerability taxonomy mapped to OWASP SC Top-10 2025/2026 and SWC IDs (see §6).
- Incident-pattern recognition (oracle thin-market, cross-contract reentrancy, rounding/precision,
  signature-verifier failure, misconfigured feed, donation/NAV inflation).
- Threat modelling, trust-boundary analysis, residual-risk articulation (see §9).

### 4.4 Economic competencies (critical, non-prescriptive)

- Distinguishing utility / governance / reward / non-transferable / points / reputation designs.
- Sybil, farming, collusion, wash/reward-hinting, liquidity and market-manipulation failure modes.
- The "database vs token" decision heuristic (§5, §10).

### 4.5 Environmental-application competencies

- MRV pipeline (measurement → reporting → verification), dMRV building blocks (satellite/IoT/AI/ledger)
  and their *distinct* failure modes; the oracle problem; hash-anchoring vs on-chain data; conservative
  crediting and "machine stops"; additionality/permanence/leakage are *methodology* questions, not
  ledger questions.

### 4.6 Areas requiring further research (honest)

- Hands-on Foundry/Hardhat 3 + Slither/Echidna/Medusa/Halmos/Certora execution.
- Formal verification (Certora Prover, Halmos, Kontrol) semantics and limits.
- L2 sequencer/finality/data-availability specifics per candidate chain.
- Legal/regulatory determination for tokens, carbon credits, and cross-border data (must be escalated).
- Concrete Sybil-resistance and reward-sustainability modelling for Eco Nojin's specific participation model.

---

## 5. Blockchain vs non-blockchain Architecture Comparison (Deliverable 2)

Objective trade-offs for Eco Nojin. "Cost" is total cost of ownership (build + operate + audit + key
management + incident response), not just gas.

| Architecture | What it gives | What it costs / risks | When it is the right call for Eco Nojin |
|---|---|---|---|
| **A. Conventional backend + relational DB** (current) | Simple transactions, mature tooling, easy backup/DR, RBAC/tenancy, low ops | Central operator is trusted; no external verifiability; mutable unless designed otherwise | **Default for all internal accounting, rewards, inventory, marketplace state.** Lowest TCO. |
| **B. DB ledger + cryptographic audit trail** (hash-chaining, signed records, Merkle roots, WORM/append-only) | Tamper-evidence and verifiable history *without* a chain; works with existing SQLite/Postgres; cheap | Still operator-trusted for *truth*; needs disciplined key management and external timestamping for third-party trust | **Best fit for EcoCoin integrity and MRV provenance today.** Gives most of the "blockchain feel" at ~no infra cost. |
| **C. Permissioned blockchain** (e.g., a consortium chain among known orgs) | Shared write among known parties, no single operator, privacy via membership | New infra + ops skill; validator governance; still cannot verify physical truth; overkill for one operator | Only if multiple *independent* orgs must co-write a ledger and none will trust the others' DB. Not indicated now. |
| **D. Public blockchain (L1)** | Strongest external verifiability/censorship-resistance; public auditability | Gas volatility, privacy exposure (all data public), key custody, legal/regulatory surface, immutability of mistakes/PII | Only for *public verifiability of specific claims* (e.g., anchoring an MRV evidence hash). Not for internal balances. |
| **E. Layer 2 (rollup)** | Cheap, fast, inherits L1 security; good for higher-frequency public anchoring | Sequencer centralization/uptime risk, bridging complexity, still public data, younger tooling | A *possible* future option if public anchoring is required at volume; not a Stage-1 decision. |

**Decision heuristic (the five questions).** For any proposed use, require: (1) Is a *shared* write
among mutually distrusting parties actually needed? (2) Does a DB + audit trail fail to meet the
requirement? (3) Who controls the contract/keys and what if they are compromised? (4) What is the
privacy/legal exposure of putting this on a public ledger? (5) What is the 5-year TCO including audit
and key management? If (1) is "no" or (2) is "DB suffices", choose A or B.

**Conclusion.** For Eco Nojin *today*, **A/B dominate**. Blockchain (C/D/E) is justified only for a
narrow, explicitly owner-approved *public-verifiability* slice — and even then as hash/provenance
anchoring, never as the system of record for value or PII.

---

## 6. Smart Contract Security Analysis (Module C)

### 6.1 The vulnerability landscape (mapped to OWASP SC Top-10 2025/2026 + SWC)

| Class | What goes wrong | Real 2025–2026 evidence | Primary mitigation |
|---|---|---|---|
| **Access control** | Missing/incorrect role checks; unprotected privileged functions | Bybit (off-chain signing, $1.4B, Feb 2025 — *not* a contract bug but access-control class); many "5 access-control" of top-20 | Role-based auth, two-step ownership, least privilege, SoD |
| **Oracle / price manipulation** (SC02) | Contract trusts a manipulable or misconfigured price | 2026: ~$159M thin/spot-market (Tectonic ~$120M, Venus, YieldBlox, Moonwell MAMO, Nostra); Moonwell cbETH misconfig; Ostium signer compromise ($23.7M) | Multi-source median, TWAP, staleness/heartbeat, sequencer-uptime, deviation circuit breakers |
| **Reentrancy** (SC05, SWC-107) | External call re-enters before state settles | GMX V1 ~$40M cross-contract reentrancy (Jul 2025); Solv ~$2.73M self-reentrancy (Mar 2026) | Checks-effects-interactions, `nonReentrant`, pull payments, guard cross-contract callbacks |
| **Arithmetic / precision / rounding** | Wrong scale, rounding direction, unchecked casts | Balancer v2 ~$121M `_upscale` precision loss (Nov 2025) | Fixed-point discipline, round in protocol's favour, fuzz/invariant on invariants, Solidity 0.8 checked math |
| **Signature replay / nonce / domain** | Missing nonce, missing chainId/domain, no expiry | Bonzo zeroed BLS signature accepted ($9M, Jul 2026) | EIP-712 domain separation, per-signer nonces, deadlines, ERC-1271 for contract wallets, zero-signature rejection |
| **Flash-loan atomicity** (SC07) | Single-tx price/accounting manipulation | Makina ~$4.13M same-block Curve/NAV (Jan 2026) | Same-block manipulation resistance, NAV from robust sources, donation guards |
| **Initialization / proxy** | Uninitialized implementation, storage collision, malicious upgrade | Recurring postmortem class | Initializer locks, ERC-1967 slots, storage gaps, timelock + multisig on upgrades |
| **Upgradeability / admin abuse** | Compromised key can change logic/withdraw | Governance/admin key incidents | Timelock, multisig, `pause` with narrow scope, clear emergency powers |
| **DoS / gas griefing** | Unbounded loops, forced revert, block stuffing | Recurring | Bounded iteration, pull patterns, `try/catch` on external calls |
| **ERC-20 edge cases** | Fee-on-transfer, rebasing, non-standard returns, 2-tuple `transferFrom` | Repeated integration losses | SafeERC20, support non-standard tokens explicitly, don't assume `balanceOf` deltas |
| **Supply chain / compiler** | Malicious dependency, compiler bug | Solidity 0.8.39 storage-corruption bug (Nov 2026) | Pin versions, lockfiles, verify build reproducibility, audit dependencies |

### 6.2 Why "tests pass" ≠ "secure"

- A green fuzz/invariant run only proves the *properties you wrote* survived the *inputs the fuzzer
  reached*. With default `fail_on_revert = false`, a handler that reverts leaves state unchanged and
  the campaign "passes" while testing nothing **[EXT: metlabs 2026-10-12; DeFiSec 2026-07-11]**.
- Static analysis (Slither) is pattern matching: it flags "external call before state write" but
  cannot judge economic soundness. Symbolic execution (Mythril) explores paths within bounds; a clean
  run means "no counterexample within these bounds", not "proven safe". Fuzzers (Echidna/Medusa/Foundry)
  find what your properties describe. **None** reason about business intent, incentives, governance or
  cross-protocol composability — that is human/audit territory.
- **Audit ≠ formal verification.** An audit is expert human review producing findings and a report
  (probabilistic coverage, judgement-based). Formal verification is a *mathematical proof* that a
  property holds for all inputs within a model (Certora/Halmos/Kontrol) — sound only relative to the
  specification and model, and blind to anything unspecified. Both are needed; neither is sufficient alone.

### 6.3 Secure-development posture (for any future Eco Nojin contract)

1. Pin `solc` (latest release, e.g. 0.8.39) + optimizer settings; record them; re-audit on upgrade.
2. Prefer **no upgradeability**; if unavoidable, UUPS/transparent behind a **timelock + multisig**, with
   storage gaps and initialization locks.
3. Least-privilege roles + **separation of duties** (verifier ≠ adjuster ≠ admin) + **four-eyes** for
   value-bearing actions — this is already a known gap in the current EcoCoin design (verifier and
   adjuster are both owner/admin) **[REPO: hic-ecocoin…report §7, §9]**.
4. Checks-effects-interactions + reentrancy guards on every state-mutating external call.
5. No PII, no secrets, no large blobs on-chain; store **hashes/commitments** + off-chain data (§13).
6. Invariants written *before* code; stateful fuzzing with `fail_on_revert = true` and `bound()` handlers;
   fork tests against real integrations; negative tests; gas regression.
7. Independent review before any value-bearing use; monitoring + incident response after deployment.

---

## 7. Standards Matrix (Deliverable 4)

Applicability is judged for *Eco Nojin's stated needs*, not "because it exists". "Reject" means "do
not implement now / not applicable", not "never".

| Standard | Purpose | Applicability to Eco Nojin | Key risks / dependencies | Recommendation | Source |
|---|---|---|---|---|---|
| **ERC-20** | Fungible token | Only if a *transferable* on-chain unit is ever authorized (currently not) | Tradability ⇒ legal/financial surface; fee-on-transfer/rebasing edge cases | **Reject for now** (internal unit is a DB ledger, not ERC-20) | eips.ethereum.org/EIPS/eip-20 |
| **ERC-721** | Non-fungible tokens | Possible for digital certificates/traceability *if* public verifiability is approved | Public metadata, transferability, legal | **Defer** | eip-721 |
| **ERC-1155** | Multi-token (fungible+NFT) | Possible for batch certificates | Complexity; same legal surface | **Defer** | eip-1155 |
| **ERC-165** | Interface detection | Useful *inside* any future contract set | None material | **Adopt if/when contracts exist** | eip-165 |
| **ERC-2612** | Gasless `permit` approval | Only with ERC-20 | Signature replay if nonce/domain wrong | **Defer** (depends on ERC-20) | eip-2612 |
| **ERC-4626** | Tokenized yield vault | **Not applicable** (no yield-bearing product) | `preview`/convert manipulable — not an oracle | **Reject** | eip-4626; ethereum.org ERC-4626 |
| **ERC-4337** (+ EIP-7702) | Account abstraction / smart wallets | Possible UX improvement *if* a public chain is used | `msg.sender` no longer EOA; delegation revocation; phishing surface | **Defer**; not a Stage-1 need | eip-4337; eip-7702 |
| **ERC-2771** | Trusted forwarder (meta-tx) | Only with 4337/meta-tx | Trust in forwarder; replay | **Defer** | eip-2771 |
| **ERC-2981** | NFT royalties | Only with NFTs + a marketplace that honors royalties | Royalty enforcement is not guaranteed on-chain | **Defer** | eip-2981 |
| **EIP-712** | Typed structured signatures | Foundational *if* any signing/meta-tx/4337 is used | Domain separation, chainId, nonce, expiry | **Adopt only with a signing feature** | eip-712 |
| **ERC-1271** | Contract-wallet signature validation | Needed *iff* smart wallets are supported | Correct `isValidSignature` handling; replay | **Defer** with 4337 | eip-1271 |
| **ERC-8004** | Trustless agents (identity/reputation/validation registries) | Conceptually relevant to Eco Nojin's *AI-workforce* agents, but **draft**, public, and identity/reputation only | Sybil (explicitly acknowledged); Validation Registry not live; immutability of feedback | **Reject for now**; monitor | eips.ethereum.org/EIPS/eip-8004 |
| **EIP-7702** | EOA delegation | Only with 4337 on a public chain | Revocation, expanded phishing | **Defer** | eip-7702 |

**Rule applied:** no standard is adopted merely because it exists; each is gated on an approved use and
legal review. The current `DEC-TOKEN … REJECT (activate)` posture is consistent with this matrix.

---

## 8. Toolchain Matrix (Deliverable 5)

Nothing here was installed (forbidden in Stage 1). "Recommendation" is for a *future* authorized stage.

| Tool | Type / purpose | License / cost | Install reqs | Security value | Maintenance (2026) | Recommendation |
|---|---|---|---|---|---|---|
| **Foundry** (Forge/Cast/Anvil/Chisel) | Compile/test/script/query/local node/REPL; Solidity-native | MIT, free | Rust toolchain / `foundryup` | High: fast fuzz + invariant, fork tests | Active, v1.9.0 (2026-11-02) | **Adopt** for Solidity testing/forking |
| **Hardhat 3** | TS/JS + Solidity tests, Ignition deploys, plugins | MIT, free | Node.js | High; runs Foundry-compatible Solidity tests | Active, v3.21.2 (2026-10-29) | **Adopt** if TS integration/deployment is central |
| **OpenZeppelin Contracts** | Audited standard implementations (ERC/Access/Ownable/Governor) | MIT, free | npm | High: reduces bespoke bugs | Active, v5.7.0 (2026-07-29) | **Adopt** as library only (repo already records this) |
| **OpenZeppelin Wizard** | Contract scaffolding | Free (web) | none | Medium: correct defaults | Active | Optional aid |
| **Slither** | Static analysis (~100 detectors), Python API | AGPL/free (Crytic) | Python + solc | High (fast, every PR) but noisy; no intent | Active | **Adopt** in CI |
| **Echidna** | Property/stateful fuzzer | AGPL/free (Crytic) | Haskell/binary/Docker | High for stateful/accounting | Active, v2.3.3 (2026-07-27) | **Adopt** for invariants |
| **Medusa** | Parallel stateful fuzzer | AGPL/free (Crytic) | Go/binary/Docker | High throughput | Active, v1.5.1 (2026-03-11) | **Adopt** for long campaigns |
| **Mythril** | Symbolic execution (bytecode) | MIT/free (Consensys) | Python; bounded runs | Medium (path explosion; not a prover) | Active | **Selective** on critical contracts |
| **Solhint** | Solidity linter | MIT/free | npm | Medium (style + some security) | Active | **Adopt** in CI |
| **Certora Prover / Halmos / Kontrol** | Formal verification | Commercial / OSS mix | Heavy | Highest (proofs) but spec-bound | Active | **Future**, for critical invariants |
| **Tenderly** | Simulation, debugging, monitoring | Commercial (free tier) | SaaS | High (fork simulation, alerts) | Active | **Optional**, commercial |
| **Block explorers / testnets / local sim** | Verification, testnet, Anvil/Hardhat network | Free (explorers/testnets) | RPC | Medium | Active | **Adopt** when a chain is chosen |

**Selection note.** Foundry vs Hardhat 3 is decided by *where the rest of the repo lives*: Hardhat 3
when deployment/integration is TypeScript; Foundry when Solidity-native and terminal-driven. Keeping
both is legitimate only with a single authoritative compiler/optimizer config and a CI check that both
produce identical bytecode **[EXT: metlabs 2026-10-12]**. For Eco Nojin (TypeScript platform + Python
engine), a **Hardhat-3-centric** setup with Foundry-grade Solidity tests is the natural fit *if* a
future stage authorizes contracts.

---

## 9. Preliminary Threat Model (Deliverable 3)

**Not a final security assessment.** Scope: a *hypothetical* future Eco Nojin contract environment
(e.g., an MRV-anchoring contract and/or a tokenized incentive). Assets, actors, surfaces, scenarios,
mitigations, residual risks.

### 9.1 Assets
- Environmental MRV evidence and its integrity/reputation.
- Any future token/credit balance or certificate (currently none).
- Reward/participation records (currently the internal EcoCoin ledger).
- Governance/administrative control (keys, roles).
- User privacy (identity, location, farm data).

### 9.2 Threat actors
- **External attacker** (profit-motivated): oracle/price manipulation, reentrancy, flash loans.
- **Malicious participant**: Sybil, reward farming, false MRV claims, collusion.
- **Compromised insider / admin key**: privileged mint/upgrade/withdraw abuse.
- **Oracle / data provider**: false or biased environmental data; compromised reporting infra (Ostium pattern).
- **Supply-chain attacker**: malicious dependency or compiler/toolchain compromise.
- **Network / L2 operator**: sequencer downtime, censorship, reorg.
- **Regulator / legal**: non-compliance of a token or environmental claim.

### 9.3 Attack surfaces & trust boundaries
- Contract↔oracle boundary (the *weakest* trust boundary for environmental truth).
- Contract↔admin boundary (upgrade/mint/pause privileges).
- Contract↔token boundary (ERC-20 edge cases, 4626-style accounting).
- Off-chain↔on-chain boundary (what the hash commits to; is the off-chain data available?).
- Cross-contract/composability boundary (GMX-style reentrancy).

### 9.4 Attack scenarios (representative)
1. **Thin-market oracle** — attacker moves a low-liquidity pool that feeds a price/valuation → inflated
   collateral (Tectonic/Venus/Nostra pattern) → drain. *Mitigation:* multi-source median, TWAP,
   deviation caps, don't use manipulable `preview`/spot as oracle.
2. **Cross-contract reentrancy** — a token callback re-enters mid-mint/redeem (GMX/Solv pattern) →
   over-withdraw. *Mitigation:* CEI + guards + callback-aware accounting.
3. **Admin-key compromise** — stolen upgrade/mint key changes logic or mints (Bybit-class at the key
   layer) → total loss. *Mitigation:* multisig + timelock + SoD + monitoring.
4. **False environmental claim** — a real-looking but fabricated MRV record is anchored; ledger is
   "correct" but the claim is false → reputational/legal harm. *Mitigation:* independent verification,
   triangulation, conservative crediting, "machine stops"; the ledger cannot fix this.
5. **Signature replay** — missing nonce/domain/expiry lets a captured signature be reused (Bonzo-class
   zero-signature acceptance). *Mitigation:* EIP-712 domain+chainId+nonce+deadline; ERC-1271; reject zero sigs.
6. **Sybil reward farming** — one actor many identities farms participation rewards. *Mitigation:* identity
   weighting, proof-of-personhood where appropriate, anomaly detection, caps (see §11).

### 9.5 Residual risks (cannot be fully mitigated)
- **Oracle/physical-truth gap** — always present; only process + independent verification reduce it.
- **Key custody** — any privileged key is a single point of failure; multisig/timelock reduce but don't remove.
- **Immutability** — bugs/PII on public chains are permanent; "fix" = new deployment + migration.
- **Legal/regulatory** — unresolved; must be escalated, not assumed away.
- **Composability** — third-party protocols can change under you.

---

## 10. Eco Nojin Blockchain Use-Case Assessment (Deliverable 6)

Preliminary classifications (not approved decisions). Rationale references §5 heuristic and repo facts.

| Use case | Class | Rationale |
|---|---|---|
| **Internal reward accounting (EcoCoin ledger)** | `DATABASE_PREFERRED` | Already implemented as a tenancy-safe, idempotent, append-only DB ledger; blockchain adds cost/complexity with no shared-trust need **[REPO]**. |
| **EcoCoin (monetary/tokenized)** | `REQUIRES_LEGAL_REVIEW` + `NOT_RECOMMENDED` (now) | No economic definition; tokenization disabled (`DEC-TOKEN REJECT`); monetary activation is owner-gated and legally loaded. |
| **HIC** | `REQUIRES_LEGAL_REVIEW` (definition first) | Undefined in repo; cannot classify a thing that has no definition; must not be fabricated **[REPO]**. |
| **Community participation records** | `DATABASE_PREFERRED` | Internal, single-operator; DB + audit trail suffices. |
| **Project accountability / audit trail** | `DATABASE_PREFERRED` (B: DB + crypto audit) | Hash-chained DB gives tamper-evidence without a chain. |
| **Environmental MRV (estimates/credits)** | `DATABASE_PREFERRED` (record-only) + `REQUIRES_LEGAL_REVIEW` for any credit | MRV is record-only, never auto-issued **[REPO]**; carbon-credit issuance is legally governed. |
| **Data provenance (anchoring hashes)** | `BLOCKCHAIN_POSSIBLE` | *If* public verifiability is required, anchoring **hashes** (not data) is the one defensible chain use; still optional vs a signed transparency log. |
| **Marketplace** | `DATABASE_PREFERRED` | Commerce state is internal; payments out of scope (D-INT-02). |
| **Supply-chain traceability** | `BLOCKCHAIN_POSSIBLE` | Possible *if* multi-party, mutually-distrusting traceability is required; otherwise DB + signed events. |
| **Governance (roles/multisig/timelock)** | `DATABASE_PREFERRED` (policy) / `BLOCKCHAIN_POSSIBLE` (if on-chain) | Current RBAC+ABAC+SoD is DB-side; on-chain governance only if a chain exists. |
| **Digital certificates** | `BLOCKCHAIN_POSSIBLE` | NFT/VC anchoring possible for public verifiability; legal status of the certificate must be settled first. |
| **Environmental incentives** | `REQUIRES_LEGAL_REVIEW` | Incentive design + potential value ⇒ legal + economic review before any tokenization. |

**Net:** one `BLOCKCHAIN_POSSIBLE` cluster (public verifiability of *provenance/certificates*) and the
rest `DATABASE_PREFERRED` or `REQUIRES_LEGAL_REVIEW`. **No `BLOCKCHAIN_JUSTIFIED` use exists today.**

---

## 11. Token Economics Considerations (Module G)

No final EcoCoin/HIC model is designed here (forbidden). Critical considerations only:

- **Transferable vs non-transferable.** Transferability is the single biggest jump in legal/regulatory
  and security surface. The current internal unit is deliberately **non-tradable**; keep it so until the
  owner decides otherwise with legal review.
- **Mint/burn authority = attack surface.** Admin-controlled minting is a privileged operation; whoever
  holds it can inflate supply. Mitigate with SoD, four-eyes, rate limits, and auditable policy versioning.
- **Sybil & farming.** Open participation invites identity farming and reward-hinting. Mitigations: identity
  weighting / proof-of-personhood, per-identity caps, anomaly detection, and *not* making rewards
  proportional to easily-faked signals. ERC-8004 explicitly notes Sybil is unsolved and delegates
  filtering to implementers **[EXT: eip-8004 Security Considerations]**.
- **Reward sustainability.** Any reward must be funded by a durable source; otherwise it is a
  Ponzi-like treadmill. Model the funding source before the token.
- **Liquidity/market risk.** A liquid token imports market manipulation, MEV and price-oracle risk — a
  large, mostly *unwanted* attack surface for an agricultural MRV platform.
- **When a DB beats a token.** Whenever the participant set is known/permissioned, the operator is
  trusted, and external verifiability is not required → DB + audit trail wins on every axis (§5).

---

## 12. Environmental Applications (Module I)

- **The oracle problem is the core limit.** A ledger can guarantee *origin and non-tampering of
  recorded data*; it **cannot** guarantee the data is *true*. "Blockchains can guarantee the origin and
  non-tampering of data, they do not protect against false declarations" **[EXT: Climate Ledger
  Initiative]**; "blockchain cannot validate off-chain environmental claims" **[EXT: Digital Climate
  Infrastructure, 2026]**.
- **Three levels must not be conflated** **[EXT: Gate Learn 2026-10-26]**: *data traceability* (source +
  history reviewable) ⊊ *verified data* (reviewed under a procedure) ⊊ *valid environmental outcomes*
  (methodology, boundaries, additionality, permanence all hold). A hash match proves only file↔hash
  consistency, not accuracy.
- **Correct architecture pattern** **[EXT: JASF-2026-005; IETA Buyer's Guide]:** raw/high-volume and
  personal/commercial data **off-chain**; anchor **hashes / signed evidence manifests** on a ledger or
  registry; keep registries authoritative for issuance/retirement; require **triangulation** (independent
  sources agree within uncertainty thresholds), **conservative crediting**, and **"machine stops"**
  (calibration overdue, cloud cover, missing coordinates, model confidence low, meter/report mismatch →
  no auto-quantification; manual review).
- **dMRV building blocks are not interchangeable:** satellites = broad coverage but indirect for carbon;
  IoT = high-frequency operational evidence but limited spatial reach; AI = fusion/prediction but imports
  model/training uncertainty; blockchain = tamper-evident provenance/serialization, **not** a measurement
  technology. Credibility rests on the *assurance loop*, not the ledger.
- **Eco Nojin implication:** HyDroMA model outputs and remote-sensing inputs carry **model and measurement
  uncertainty** and must be recorded with provenance + version + uncertainty **[REPO: D-HYDROMA-04,
  architecture principles]**. A smart contract must never imply that an on-chain record equals a
  *scientifically validated* environmental outcome (see §14 Q9).

---

## 13. Privacy and Legal Risks (Module J)

### 13.1 Privacy
- **Public blockchains are public forever.** Never place personal data (names, national IDs, precise
  farm locations, health, financial) on a public ledger — immutability makes deletion impossible and
  conflicts with data-protection/"right to erasure" regimes.
- **Pseudonymity ≠ anonymity.** Wallet addresses are linkable and clusterable; on-chain metadata +
  off-chain linkage can deanonymize.
- **Data minimization by design:** store **off-chain** the sensitive payload; put only **hashes /
  commitments / access-controlled pointers** on-chain; use access control and, where needed,
  privacy-preserving constructs (commitments, ZK) — but recognize these add complexity and are not a
  Stage-1 requirement.
- **Eco Nojin rule (already in repo):** multi-tenancy by default; every record org-scoped; no PII in
  code/logs/tests **[REPO: AGENTS.md §5]**.

### 13.2 Legal (awareness only — NOT legal advice; escalate)
- **Tokens/digital assets** may be regulated as financial instruments, payment systems, or securities
  depending on design and jurisdiction — tokenization is therefore **owner + qualified-counsel** territory.
- **Carbon/environmental credits** are governed by registries and methodologies; automatic issuance via
  a contract does **not** create a valid credit, and false claims carry liability.
- **Cross-border** operation (Eco Nojin is "internationally accessible") multiplies data-protection,
  sanctions, tax and consumer-protection exposure.
- **Consumer protection / environmental-claims** law: "greenwashing" risk if MRV claims are not
  substantiated.
- **Escalation rule:** every item above is flagged `REQUIRES_LEGAL_REVIEW`; this agent makes **no**
  legal determination.

---

## 14. Technical Challenge Responses (Section 8)

1. **Why might Eco Nojin not need a blockchain?** Because its only live economic primitive is an
   *internal, single-operator, non-tradable* ledger, and its hardest problem (environmental truth) is an
   *oracle* problem no ledger solves. A conventional DB + cryptographic audit trail delivers tamper-evidence,
   tenancy, RBAC and low TCO without shared-trust requirements. Blockchain earns its cost only when
   mutually distrusting parties must co-write a ledger or the public must verify a claim — neither is a
   current requirement.
2. **Architecture for internal reward tracking only?** A relational DB (SQLite now, PostgreSQL later)
   with an **append-only, idempotent, `UNIQUE(org,reference)` ledger**, compensating adjustments (no
   history rewrite), reconstruction-based balances, scheduled reconciliation with anomaly flags, RBAC +
   tenancy + audit rows, and (for future value-bearing use) **SoD + four-eyes**. This is essentially the
   existing Phase 3.64/3.65 design — keep and harden it; add no chain.
3. **Architecture for public verifiability of environmental contributions?** Off-chain data of record +
   **anchored hashes/signed evidence manifests** in a public (or consortium) ledger or a signed
   transparency log; the chain stores *commitments and verification results*, never raw/PII data; an
   independent verifier signs results; consumers verify the anchor + the off-chain payload. Use L2 only if
   volume/cost demands it. The ledger proves *provenance*, not *truth*.
4. **How to prevent reward-mechanism abuse?** Server-verified participation (not client claims);
   deterministic idempotency keys; per-identity caps; separation of duties (verifier ≠ adjuster);
   four-eyes on adjustments; anomaly detection on duplicate/credit spikes; versioned, approved policy;
   rate limits; and conservative, non-farmable signal design.
5. **How to address Sybil attacks?** Identity weighting / proof-of-personhood where appropriate; per-identity
   and per-device caps; graph/cluster analysis; anomaly detection; make rewards *not* proportional to
   easily-faked signals; combine with independent verification. Accept that Sybil resistance is
   probabilistic, not absolute (ERC-8004 concedes this).
6. **How to protect a contract from reentrancy?** Checks-Effects-Interactions ordering; `nonReentrant`
   mutex; pull-over-push payments; avoid unguarded external calls before state finalization; guard
   *cross-contract* callbacks (GMX pattern); fuzz with reentrancy-aware handlers; consider `guard` on
   every state-mutating external interaction.
7. **Audit vs formal verification?** An **audit** is expert human review → findings + judgement, probabilistic
   coverage. **Formal verification** is a machine-checked *proof* that a specified property holds for all
   inputs within a model — sound only relative to the spec/model, blind to the unspecified. Audits catch
   design/economic issues; proofs catch "property always holds" but not "property is the right one". Use both.
8. **What should never be stored on a public blockchain?** Personal data (PII), secrets/keys, health/financial
   data, precise locations, large blobs, and anything that must be erasable. Store only hashes/commitments
   and access-controlled pointers; keep the payload off-chain.
9. **How to link environmental data to a contract without implying scientific validation?** Anchor a
   **hash + provenance metadata** (source, model version, units, uncertainty, timestamp) and record
   *verification status* as a distinct field; never auto-emit "validated" or "credit" from a raw record;
   require independent verifier signatures and conservative "machine stops"; label on-chain records as
   *evidence provenance*, not *outcome*. The contract states "this evidence existed at time T", not "this
   environmental outcome is true".
10. **Risks of administrator-controlled minting?** Single point of inflation/trust; a compromised or coerced
    admin key can mint unlimited value; no external check. Mitigate with multisig + timelock, SoD, four-eyes,
    rate/supply caps, and public audit of every mint — but residual key-custody risk remains.
11. **Risks of upgradeable contracts?** The upgrade key can change logic arbitrarily (rug/bug); storage
    collisions corrupt state; initialization bugs; complexity expands the audit surface. Mitigate with
    UUPS/transparent + timelock + multisig, storage gaps, initializer locks, and minimal, well-audited
    upgrade paths — or prefer non-upgradeable + migration.
12. **Risks of external oracles?** They are the top on-chain loss class (2026: ~$159M thin-market alone):
    price/valuation manipulation, misconfiguration (Moonwell cbETH), signer/reporting compromise (Ostium),
    staleness, and the fundamental "false declaration" problem. Mitigate with multi-source median, TWAP,
    staleness/heartbeat + sequencer-uptime checks, deviation caps, and treating the oracle as a trust boundary.
13. **How to design a safe emergency mechanism?** A **narrowly scoped, high-privilege** pause/guardian behind a
    **multisig + timelock** that can only *stop* specific operations (not mint/withdraw arbitrarily), with
    clear activation criteria, automatic expiry/sunset, event emission, and post-incident review. Emergency
    power must be *least-privilege* and *auditable*, never a backdoor.
14. **Why is deployment not the end of security engineering?** Because the threat landscape is continuous:
    new composability, oracle/feed changes, governance/upgrade risk, key management, and undiscovered bugs.
    2025–2026 shows large losses *after* audits and deployment. Security is monitoring + incident response +
    dependency/compiler patching + re-audit on upgrade + key-custody hygiene, indefinitely.
15. **When would you reject blockchain entirely?** When (a) participants are known/permissioned and the
    operator is trusted; (b) a DB + audit trail meets the requirement; (c) the problem is physical-truth
    verification (oracle) rather than shared-record integrity; (d) privacy/legal exposure of a public ledger
    outweighs the benefit; or (e) TCO (build + audit + key management + incident response) exceeds the value.
    For Eco Nojin today, (a), (b), (c) and (e) all hold for the core → reject for core; allow only a narrow,
    owner-approved provenance-anchoring slice.

---

## 15. Competency Assessment (Deliverable 8)

Evidence-based self-assessment. "Evidence" = what I actually did (source study + reasoning), not claims.

| Competency | Level | Evidence / basis | Honest limitation |
|---|---|---|---|
| Technical knowledge (blockchain/EVM) | Strong (conceptual) | §2 Module A, §5; ethereum.org + EIP study | No live chain interaction |
| Solidity competence | Working (conceptual) | §4.1; Solidity 0.8.39 docs; version discipline understood | No contract compiled here |
| Security awareness | Strong (analysis) | §6, §9; OWASP SC Top-10 + 2025–26 incidents | No hands-on exploitation/testbed |
| Standards knowledge | Strong | §7; primary EIP pages | Applicability judgements are preliminary |
| Toolchain knowledge | Strong (comparative) | §8; official docs + 2026 comparisons | No install/execution (forbidden) |
| Testing competence | Strong (conceptual) | §6.2, §8; Foundry/Hardhat3/DeFiSec | No fuzz/invariant campaign run |
| Economic analysis | Medium-High | §11; critical framing, Sybil/farming/sustainability | No formal economic model (out of scope) |
| Environmental application | Strong | §12; dMRV reviews + IETA + repo MRV rules | Not a domain scientist; defer to HyDroMA |
| Privacy | Medium-High | §13.1 | Not a privacy-law specialist |
| Legal awareness | Awareness only | §13.2 | **Not qualified** to make legal determinations |

**Overall:** technically competent for **design-stage analysis and review**, not for implementation,
deployment, economic determination, or legal sign-off.

---

## 16. Uncertainties

- **HIC** is undefined in the repo; its nature/purpose cannot be stated without owner input (fabrication refused).
- **No local execution**: all tool/version/behavior claims are documentation-based, not reproduced here.
- **Version drift**: Solidity 0.9.0 (pre-release 2026-11-26) and OZ 5.7.0 are recent; behavior may shift; pin and re-verify.
- **ERC-8004** is Draft (Identity/Reputation live; Validation pending) — interfaces may change.
- **Legal/regulatory** status of any token/credit is unresolved and jurisdiction-dependent.
- **L2 specifics** (finality, sequencer, data availability) not evaluated per candidate chain.
- **Eco Nojin reward-sustainability** parameters are unknown (no economic model authorized).

## 17. Knowledge Gaps

- Hands-on Foundry/Hardhat 3, Slither/Echidna/Medusa, and formal verification (Certora/Halmos/Kontrol).
- Deep Solidity *gas optimization* and *storage-layout* engineering in practice.
- Per-chain L2 architecture (Arbitrum/Optimism/Base/OP-Stack, data availability, sequencer).
- Advanced cryptography (ZK, commitments, threshold signatures) beyond conceptual level.
- Legal/regulatory frameworks for tokens, carbon credits, and cross-border data.
- Domain science (hydrology/remote-sensing uncertainty) — owned by HyDroMA, not this agent.

## 18. Learning & Security Roadmap (Deliverable 7)

**Studied (this stage):** Modules A–J from primary sources; 2025–2026 incident corpus; dMRV literature;
Eco Nojin repo grounding.

**Verified (this stage):** repo facts (EcoCoin ledger shape, HIC undefined, token disabled) via read-only
inspection; version facts via official releases; the *logic* of each trade-off. **Not verified by execution:**
any tool run, compile, test, deploy.

**Remaining uncertain / to do (future, only if authorized):**
1. Build a throwaway **Foundry/Hardhat 3** learning repo (outside Eco Nojin) → compile, unit/fuzz/invariant, fork tests.
2. Run **Slither + Echidna + Medusa** on sample contracts; then **Halmos/Certora** on one invariant.
3. Study one **L2** deeply (finality, sequencer, DA) and one **oracle** design (multi-source + TWAP + heartbeat).
4. Produce a **design-stage** (not implementation) reference for an *optional* MRV hash-anchoring adapter behind `contracts/`, with legal review.
5. Security: build a **threat-model template** and **invariant catalogue** for any future value-bearing module; define SoD/four-eyes.
6. Escalate: token/legal/carbon questions to owner + qualified counsel; keep `DEC-TOKEN` disabled.

**Security roadmap principle:** invariants before code; fuzz with `fail_on_revert=true` + `bound()`; independent
review before value; monitoring + incident response after; re-audit on every upgrade; pin toolchain.

## 19. Qualification Status

**`TECHNICAL_TRAINING_COMPLETED_AWAITING_EVALUATION`**

Technical training across Modules A–J is complete to design-stage depth, with explicit, named gaps (§16–17)
and no execution-based verification. I am **not** self-authorizing implementation, deployment, tokenization,
economic design, or legal determination. Awaiting owner evaluation and the next authorization.

---

## 20. Preservation Evidence (no-modification proof)

- **Only file created:** `SMART_CONTRACT_AGENT_TRAINING_REPORT.md` (this document).
- **HEAD before and after:** `a3103061f561eb4289137b5f3362785580dfe28b` (branch `main`), unchanged.
- **Pre-existing working tree:** 289 changed/untracked entries existed at start (apps/services/engines/docs).
  These are **not** this agent's work and were not touched, staged, committed, or reverted.
- **Forbidden actions not performed:** no Solidity written for Eco Nojin; no dependency installed; no wallet/key
  created or accessed; no contract/token deployed or minted; no chain interaction; no commit/push/branch/tag/
  remote/deploy; no destructive Git; `upstream-archives/`, `D:\HyDroMA`, `D:\eco_nojin` untouched.
- **Method:** read-only search/read + read-only web research only.

---

## Appendix A — Glossary (selected)

- **CEI** Checks-Effects-Interactions. **ERC/EIP** Ethereum standard/improvement. **EVM** Ethereum Virtual Machine.
- **L2/rollup** scaling layer inheriting L1 security. **MEV** maximal extractable value. **MRV/dMRV** (digital) Measurement, Reporting, Verification.
- **Oracle** bridge delivering off-chain data to contracts (a trust boundary, not a truth source).
- **Provenance** tamper-evident origin/history of a record. **Sybil** many fake identities. **TWAP** time-weighted average price.
- **UUPS/Transparent proxy** upgradeability patterns. **ERC-1967** proxy storage slots. **SoD** separation of duties.

## Appendix B — Source register (access 2026-11-27)

| # | Source | Date/version | Used for |
|---|---|---|---|
| S1 | soliditylang.org — 0.8.39 release | 2026-11-19 | compiler version, storage-corruption bug, 0.9.0 note |
| S2 | github argotorg/solidity releases (0.9.0-pre.1) | 2026-11-26 | 0.9.0 pre-release, IR pipeline |
| S3 | docs.soliditylang.org (installing/versioning) | 0.8.40-develop | "use latest release", semver |
| S4 | OpenZeppelin Contracts v5.7.0 release | 2026-07-29 | library version, EIP712/ERC2771 changes |
| S5 | docs.openzeppelin.com 5.x changelog | 2026 | version history |
| S6 | ethereum.org — account abstraction | 2026-06-24 | ERC-4337 + EIP-7702, adoption |
| S7 | eips.ethereum.org — ERC-4337 / EIP-7702 | Final | AA mechanics, requires 712+7702 |
| S8 | ethereum.org / eip-4626 | Final (2021-12-22) | vault standard, preview-not-oracle |
| S9 | eips.ethereum.org — ERC-8004 Trustless Agents | Draft (2025-08-13) | identity/reputation/validation, Sybil note |
| S10 | 8004.org / Forbes / CoinDesk | 2026-01/02 | ERC-8004 mainnet status |
| S11 | metlabs.io — Hardhat vs Foundry 2026 | 2026-10-12 | Hardhat 3.21.2, Foundry 1.9.0, test parity |
| S12 | hardhat.org — migrate from Foundry / config | 2026 | Hardhat 3 Solidity tests |
| S13 | DeFiSec — smart contract fuzzing | 2026-07-11 (upd 09-02) | Echidna 2.3.3, Medusa 1.5.1, Foundry 1.8.1, defaults |
| S14 | Firepan — Slither/Mythril/Echidna workflow | 2026-10-29 | tool roles/limits |
| S15 | OpenZeppelin — Web3 Security Auditor's 2025 Rewind | 2026 | Balancer v2 ~$121M, GMX ~$40M |
| S16 | Guardian — Crypto Hacks Database / Oracle Exploits 2026 | 2026-11 | 2025–26 incident table, oracle patterns |
| S17 | Guardix — DeFi Hacks 2026 | 2026 | root-cause taxonomy, OWASP SC02/05/07 |
| S18 | JASF-2026-005 — dMRV review | 2026-08 | blockchain ≠ measurement, assurance loop, machine stops |
| S19 | IETA — MRV Buyer's Guide | 2026 | dMRV risks, data ownership, model drift |
| S20 | Gate Learn — blockchain & carbon data | 2026-10-26 | traceability vs verified vs valid outcomes |
| S21 | Climate Ledger Initiative | — | oracle problem, false declarations |
| S22 | Frontiers — blockchain-IoT carbon certification | 2026-10-23 | immutable provenance ≠ sound measurement |
| S23 | REPO: ARCHITECTURE-DECISIONS-OPEN.md | 2026-11-18 | D-15/D-16/D-INT-02, open decisions |
| S24 | REPO: hic-ecocoin-token-architecture-discovery-report.md | 2026-11-25 | EcoCoin ledger, HIC undefined, token disabled |
| S25 | REPO: phase-3.65-a-ecocoin-ledger-integrity-report.md | — | ledger integrity/concurrency evidence |
| S26 | REPO: ROOT-STRUCTURE-MANIFEST.md, contracts/README.md | 2026-11-18 | structure, contracts = ports not Solidity |

## Appendix C — Standards quick index

ERC-20 (fungible) · ERC-721 (NFT) · ERC-1155 (multi-token) · ERC-165 (interface detect) · ERC-2612 (permit) ·
ERC-4626 (vault) · ERC-4337 (AA) · ERC-2771 (forwarder) · ERC-2981 (royalty) · EIP-712 (typed sig) ·
ERC-1271 (contract-wallet sig) · EIP-7702 (EOA delegation) · ERC-8004 (trustless agents, draft) ·
ERC-7540/7575 (async / multi-asset vaults).

---

*End of report. No implementation, deployment, tokenization or legal/economic determination is authorized by this document.*