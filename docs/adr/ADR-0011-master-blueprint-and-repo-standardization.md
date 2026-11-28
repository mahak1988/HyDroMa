# ADR-0011 — Master Blueprint adoption and repository standardization

- **Status:** ACCEPTED
- **Date:** 2026-11-28
- **Deciders:** project owner (explicit authorization given by the owner in this task: execute the plan, implement and record all changes/development/updates in the repository, and standardize the repository)
- **Related:** ADR-0001 (documentation single source), ADR-0010 (unified platform sections), owner master document "Eco Nojin Master Blueprint v1.0" (dated 2026-11-28), `docs/blueprint/`, `ROOT-STRUCTURE-MANIFEST.md`

## Context

The owner adopted the Eco Nojin Master Blueprint v1.0 — 35 sections covering
philosophy, vision/mission, strategic goals G01–G16, the layered ecosystem
model, core domains (Territories, Villages, Agriculture, Irrigation), the
HyDroMA scientific engine, EDI, GIS, MRV, marketplace/tourism, the community
and incentive economy, AI roles, technical architecture, governance, security,
UX, i18n, infrastructure, the 14-phase roadmap (0–14), the real project status,
the ten non-negotiable principles, the agent collaboration model, risks, ten
strategic priorities, six vertical slices, the economic model and the manifesto.
The owner requested that the plan be executed with all changes, development and
updates implemented and recorded in the repository, and that the repository be
standardized as well.

The repository already had strong CI (`.github/workflows/verify.yml`), a
documented ADR register (0001–0010) and boundary records, but lacked:
the master blueprint itself in-repo, a goals/status mapping, community health
files (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG), editor config,
GitHub issue/PR templates, standard package metadata, and a README fully
consistent with the implemented reality (the root README still described the
backend and HyDroMA engine as not implemented).

## Decision

1. **Adopt the Master Blueprint v1.0** as the strategy source of truth inside
   the repository, recorded under `docs/blueprint/`:
   - `docs/blueprint/README.md` — index, four-state capability model and the
     23 official documents plan mapped to their current temporary locations;
   - `docs/blueprint/ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` — structured rendition
     of the full master document (the owner's full Persian text remains the
     authoritative original);
   - `docs/blueprint/GOALS-STATUS-MATRIX.md` — G01–G16 mapped to
     VISION/DESIGNED/IMPLEMENTED/VERIFIED with repository evidence;
   - `docs/blueprint/ROADMAP-ALIGNMENT.md` — the 14 roadmap phases, ten
     strategic priorities and six vertical slices mapped to repository reality.
2. **Four-state capability model** (VISION / DESIGNED / IMPLEMENTED / VERIFIED)
   applies to product capabilities. It is distinct from the scientific model
   maturity ladder (STUB → IMPLEMENTED → TESTED → VERIFIED → VALIDATED →
   PRODUCTION_APPROVED) and from the scientific validation status
   (NOT_VALIDATED). Only the owner may raise a capability to VERIFIED; all
   HyDroMA models remain NOT_VALIDATED.
3. **Repository standardization** (community health and metadata), all committed
   on `standards/blueprint-v1` and merged to `main` via PR:
   - `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`,
     `.editorconfig`;
   - GitHub templates: `.github/PULL_REQUEST_TEMPLATE.md`,
     `.github/ISSUE_TEMPLATE/` (bug report, feature request, config);
   - refreshed `.github/README.md` and `docs/README.md` to reflect active CI
     and the real documentation map;
   - root `package.json` metadata: `name`, `license` (MIT), `repository`,
     `bugs`, `homepage`, `author` (dependencies untouched — lockfile unchanged);
   - refreshed root `README.md` to report the current implementation reality.
4. **Execution tracks recorded as GitHub issues** labeled `blueprint-track`,
   each referencing G-goals and the strategic priorities, so the plan is
   tracked in the repository itself.
5. **Branch hygiene:** `develop` is synchronized with `main` via a PR (merge,
   no history rewrite), keeping both branches current.
6. **No runtime code changes** are included in this decision. Root analysis
   reports stay at the root (per `ROOT-STRUCTURE-MANIFEST.md` and ADR-0001);
   `architecture/` and `docs/` division of authority is preserved.

## Consequences

**Positive**
- The strategy adopted by the owner is versioned in the repository; capability
  claims carry evidence pointers and follow the four-state model.
- GitHub Community Standards (CONTRIBUTING, CODE_OF_CONDUCT, SECURITY,
  templates) are satisfied; contributors get concrete, rule-aligned guidance.
- The gap between documentation and implemented reality is closed (README,
  docs map, ADR register index complete through ADR-0011).
- The development plan is executable and trackable through issues.

**Negative / accepted costs**
- The in-repo blueprint is a structured rendition; the owner's full Persian
  master text remains outside the repository and must be reconciled whenever
  the blueprint evolves.
- Root-level report files remain, so the root is denser than a typical OSS
  repository — a deliberate exception per `ROOT-STRUCTURE-MANIFEST.md`.
- Future changes touching capability status must update the matrix and cite
  reproducible evidence, adding process overhead by design.

**Enforcement**
- Any claim of VERIFIED status requires owner approval plus reproducible
  evidence; scientific status changes only through `docs/scientific-governance/`.
- Financial operations (payments, wallets, tokens, HIC activation) remain
  prohibited without an explicit separate owner decision (AGENTS.md).
