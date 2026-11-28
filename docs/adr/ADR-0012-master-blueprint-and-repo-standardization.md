# ADR-0012 — Master Blueprint adoption and repository standardization

- **Status:** ACCEPTED
- **Date:** 2026-11-28
- **Deciders:** project owner (کشت و صنعت دشت امید نارون) via the 2026-11-28 directive to
  execute the development/standardization program on this repository; executed by the
  development agent on branch `standards/blueprint-v1-r2` over main `01782c1f`.
- **Related:** ADR-0001 (documentation single source), ADR-0010 (unified platform sections,
  recorded in `docs/architecture/`), ADR-0011 (optional environmental connectors),
  `AGENTS.md` honesty rules, `docs/blueprint/README.md`.

## Context

The Eco Nojin Master Blueprint v1.0 (owner document, dated 2026-11-28, ~4,000 lines)
defines the philosophy, G01–G16 goals, 14-phase roadmap, ten strategic priorities and six
vertical slices of the ecosystem. Until now the repository had no committed copy of this
strategic source and no systematic mapping between its goals and the implemented reality,
which made status claims unverifiable and let documentation drift from the code.

At the same time the repository lacked standard community and collaboration files
(CHANGELOG, CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, .editorconfig, issue/PR templates),
root `package.json` had incomplete metadata, and one accidental root artifact (`tatus`,
a captured terminal log from commit `01782c1f`) was committed.

Numbering note: a blueprint adoption decision was transiently drafted as 0011, but
ADR-0011 (optional environmental connectors) was concurrently adopted on main, so this
ADR takes the next free number 0012. ADR-0010 lives in `docs/architecture/` per its
scope; the process register here records it by pointer, per ADR-0001 (a second copy of an
existing standard is a defect).

## Options considered

| Option | Pros | Cons | Risk |
|---|---|---|---|
| Keep the blueprint uncommitted (local/owner copy only) | No drift risk in repo | No shared source of truth; goal status claims unverifiable | Documentation keeps drifting from implementation |
| Commit the blueprint + status mapping under `docs/blueprint/` (adopted) | Single strategic source; four-state capability model; evidence-based mapping; consistent with ADR-0001 indexing | Owner-authored document can drift from reality | Mitigated: owner-only status changes with reproducible evidence |
| Duplicate blueprint content into root reports and READMEs | Visibility | Violates ADR-0001; two sources diverge | Contradictory claims about capabilities |

## Decision

1. **Adopt the Master Blueprint v1.0** as the strategic source of the ecosystem, committed
   in structured form at `docs/blueprint/ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md`, with
   `docs/blueprint/README.md` (four-state capability model `VISION / DESIGNED /
   IMPLEMENTED / VERIFIED`), `GOALS-STATUS-MATRIX.md` (G01–G16 with evidence) and
   `ROADMAP-ALIGNMENT.md` (phases, priorities, slices mapped to repository reality).
2. **Standardize the repository surface**: community health files (`CONTRIBUTING.md`,
   `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `.editorconfig`), GitHub templates
   (`.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`), root `package.json`
   metadata, and honest `README.md` / `docs/README.md` aligned with the implemented
   reality on main `01782c1f`.
3. **Remove the accidental root artifact** `tatus` (a truncated `git status` terminal log);
   no project content is lost — the history it captured is in git itself.
4. **Record execution tracks as GitHub issues** with the `blueprint-track` label, each
   referencing the G-goals and priorities it serves; status transitions in
   `docs/blueprint/` are owner-only and require reproducible evidence.

## Consequences

- Positive: one strategic source with an evidence-based status model; honest README and
  changelog; standard collaboration surface; ADR-0001 respected (blueprint indexes other
  standards instead of duplicating them).
- Negative: the blueprint is a large owner document — keeping the structured rendition in
  sync with future owner revisions is an ongoing duty.
- Follow-up work (tracked with `blueprint-track`): wire the local-only architecture gates
  (`check:arch`, `test:arch`) into `.github/workflows/verify.yml`; keep the structured
  rendition aligned when the owner revises the master blueprint; long-term split into the
  23 official versioned documents proposed by the blueprint.
