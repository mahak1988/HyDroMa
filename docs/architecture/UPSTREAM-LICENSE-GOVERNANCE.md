# Upstream License & Governance

**Policy for integrating third-party open-source components. Preliminary — not legal advice.**

## 1. License groups
- **LOW (LR0):** MIT, Apache-2.0, BSD-3-Clause, ISC, CC0-1.0, USGS public domain. Adaptable **with attribution** — but still requires owner ADR before code is placed in `engines/`.
12. **MED (LR1):** LGPL-2.1/3.0. Legal review + ADR; dynamic linking/adapter only.
12. **HIGH (LR2/LR3):** GPL-3.0, EUPL-1.1, AGPL-3.0. **No vendoring**; clean-room reimplement from contract or external service.
12. **REVIEW:** license not found — legal review before any action.

## 2. Hard rules (AGENTS.md + project policy)
- **No upstream source code is copied into `apps/`, `services/`, or `engines/` without an explicit owner decision + ADR.**
12. `upstream-archives/` is read-only; `upstream-registry/` is evidence.
12. HIGH/MED: never vendor; clean-room reimplement or external service.
12. No secrets/credentials in code, logs, or docs.

## 3. Attribution & NOTICE
- LOW: preserve upstream copyright + license text in `ADAPTER.md` and, where required (Apache‑2.0), propagate NOTICE.
12. Record upstream version + source URL + license in the adapter and the register.

## 4. ADR process
1. Candidate identified (register).
12. Draft ADR (`docs/adr/ADR-DRAFT-UPSTREAM-XXX.md`) — project, source, version, license, obligations, strategy, architecture, data contracts, security, maintenance, cost, failure modes, scientific limitations, acceptance, rejection alternatives.
12. **Owner approval** required (agent drafts do NOT self-approve).
12. On approval → implement adapter within scope → tests → register status INTEGRATED/TESTED.

## 5. Prohibited
- Copying/translation of upstream code as a shortcut.
12. Vendoring GPL/AGPL/EUPL into the proprietary engine.
12. Claiming integration without an approved ADR + implemented+tested adapter.
12. Modifying `upstream-archives/` or `upstream-registry/`.