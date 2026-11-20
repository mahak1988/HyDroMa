# docs/architecture — index

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

This directory is an **index only**; it does not restate architecture content.

Read, in this order:
1. `../../ECONOJJIN-ARCHITECTURE-BASELINE.md` — proposed baseline and open boundaries.
2. `../../architecture/ECO-NOJIN-MASTER-ARCHITECTURE-V2.md` — consolidated master architecture.
3. `../../ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md` — boundary model (with corrections noted in
   `../../ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS.md`).
4. `../../ROOT-STRUCTURE-MANIFEST.md` — what each root folder is for and its status.

## Domain architecture added 2026-11-18 (in `../../architecture/`)

| Document | Covers |
|---|---|
| `INTERNATIONALIZATION-ARCHITECTURE.md` | 15-locale registry, catalogs, direction, formatting, validation gates |
| `TRANSLATION-GATEWAY-ARCHITECTURE.md` | dynamic MT service, provider adapters, cache, TM, glossary, privacy |
| `LANDSCAPE-MANAGEMENT-ARCHITECTURE.md` | Landscape Intelligence & Management domain, governance, tenancy |
| `LANDSCAPE-DOMAIN-MODEL.md` | conceptual entities, spatial/temporal rules, merge decisions |
| `LANDSCAPE-AND-HYDROMA-INTEGRATION.md` | analysis request/result contract, provenance, quality gating |
| `LANDSCAPE-API-CONTRACTS.md` | proposed i18n/landscape/village/nomadic endpoints and authz |
| `I18N-AND-LANDSCAPE-DECISIONS.md` | 16 open decisions (A/B/C/D) for these two domains |
| `HYDROMA-SCIENTIFIC-ENGINE-PHASE1-IMPL-CONTRACT.md` | Phase 1 implementation contract: model interface, registry, data/spatial/simulation contracts, API/DB/worker/visualization architecture, risks and open decisions |
