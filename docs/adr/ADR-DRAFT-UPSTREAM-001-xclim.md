# ADR-DRAFT-UPSTREAM-001 — Adopt xclim (climate indices) via original adapter

**Status:** DRAFT — **PENDING OWNER APPROVAL** (agent-authored; not approved)
**Date:** 2026-11-21 · **Decider:** Owner

## Context
HyDroMA needs climate-index computation (ETCCDI, drought, etc.). `xclim` (Apache‑2.0, pure Python, xarray‑based) is a mature, permissive, widely used library. It is a candidate for Tier B integration.

## Options
1. **ADAPTER (recommended):** original wrapper under `engines/hydroma/upstream-adapters/xclim/` calling xclim's public API; no upstream code copied.
12. **REIMPLEMENT:** clean-room (costly, unnecessary given permissive license + adapter).
12. **DEFER:** postpone until climate analytics prioritized.

## Decision (proposed)
Adopt **Option 1 (ADAPTER)**, conditional on owner approval of this ADR.

## Consequences
- **License:** Apache‑2.0 (LR0) — attribution + NOTICE propagation.
12. **Boundary:** adapter interacts via xclim public API only; no upstream internals imported; no code copied.
12. **Maturity:** software `tested`; scientific `NOT_VALIDATED`.
12. **Dependencies:** xclim (Python, xarray) in an isolated venv; pinned; lockfile.
12. **Risk:** moderate (xarray/numpy stack); mitigated by adapter isolation.
12. **Acceptance:** adapter unit tests pass; registered in `runtime.build_registry()`; provenance deterministic; `check:tokens`/`check:boundaries` green.

## Rejection alternatives
- DEFER (no climate analytics now) or REIMPLEMENT (unnecessary cost).

**Owner action required:** approve/reject this ADR. No implementation until approved.