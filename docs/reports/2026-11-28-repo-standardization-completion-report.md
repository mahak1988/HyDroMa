# Repository Standardization Completion Report — 2026-11-28

**Status:** ACTIVE — completion record of the standardization pass per ADR-0012
**Branch:** `standards/blueprint-v1-r2` (PR #1 → `main`), built over main `01782c1f`
**Authority:** owner directive of 2026-11-28 ("execute and fully implement the plan on this repository")
**Rule:** every claim below names a checkable witness. No capability status is upgraded here.

## 1. What was delivered

| Area | Files | Witness |
|---|---|---|
| Blueprint adoption | `docs/blueprint/ECO-NOJIN-MASTER-BLUEPRINT-v1.0.md` (structured rendition), `docs/blueprint/README.md` (four-state model), `GOALS-STATUS-MATRIX.md` (G01–G16 with evidence), `ROADMAP-ALIGNMENT.md` (phases/priorities/slices) | commits on this branch; ADR-0012 decision 1 |
| Governance | `docs/adr/ADR-0012-master-blueprint-and-repo-standardization.md`, completed `docs/adr/README.md` register (ADR-0001…0012, pointer for ADR-0010 in `docs/architecture/`) | ADR index table |
| Community health | `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CHANGELOG.md`, `.editorconfig` | root listing on the branch |
| GitHub templates | `.github/PULL_REQUEST_TEMPLATE.md` (honesty checklist), `.github/ISSUE_TEMPLATE/{config.yml,bug_report.md,feature_request.md}`, `.github/README.md` | templates directory |
| Metadata | root `package.json`: `name`, `license` (MIT), `author`, `repository`, `bugs`, `homepage`; scripts/engines/workspaces untouched from `01782c1f` | `package.json` diff (metadata-only) |
| Honesty | `README.md` + `docs/README.md` rewritten to the implemented reality; honest status banner retained (marketplace/tourism demo data, no payments, HIC INACTIVE) | README sections |
| Cleanup | root artifact `tatus` removed (accidental terminal-log capture) | ADR-0012 decision 3 |

## 2. CI root-cause analysis and fixes (evidence-backed)

CI on main `01782c1f` was red. The three root causes were reproduced locally
(pnpm 12.18.0 / Node 24) and two of the three are fixed on this branch:

1. **verify job — install step** (FIX DOCUMENTED, OWNER ACTION REQUIRED):
   `pnpm install --frozen-lockfile --no-audit --no-fund` fails immediately on pnpm 12:
   the `--no-audit`/`--no-fund` flags were removed in pnpm 12 (`error: unexpected argument
   '--no-audit' found`). Editing `.github/workflows/verify.yml` requires the `workflows`
   permission, which the automation integration does not hold — so this fix is recorded
   here and in the `blueprint-track` issue rather than silently skipped.
   **Owner patch (2 lines):** change the Install step to `pnpm install --frozen-lockfile`;
   optionally add `check:arch` / `test:arch` steps after "Architecture boundaries".
2. **verify job — API tests** (FIXED): `node --test services/api/tests/` no longer
   resolves a bare directory on Node 24 (`MODULE_NOT_FOUND`). `package.json` now runs
   `node --test services/api/tests/*.test.mjs`. Local evidence: 159 pass / 4 skipped /
   0 fail.
3. **hydroma-python job** (FIXED): `test_architecture_boundary_no_forbidden_imports`
   resolved the engine file relative to the process CWD and failed when pytest ran from
   the repo root (how CI invokes it). The test now resolves via `__file__`. Local evidence:
   full `pytest engines/hydroma/tests` green from the repo root.

Local verification matrix performed on the branch state (Node v24, pnpm 12.18.0,
Python 3.12): typecheck ✓, oxlint ✓ (439 files, 0 warnings), `check:boundaries` ✓,
`check:arch` ✓, `test:arch` ✓ (11 tests), `check:tokens` ✓, `check:apps` ✓, vitest ✓
(90 files / 581 tests), API tests ✓ (159/4skipped/0), `build:all` ✓ (platform + brand),
pytest `engines/hydroma/tests` ✓ (from root, after fix).

## 3. Compatibility with the implementation wave (01782c1f)

- No runtime code was touched except the two test fixes above (both restore intended
  behaviour; neither changes application behaviour).
- Root `package.json` scripts, engines and workspace globs are byte-identical to main's
  state; only metadata fields were added. The pnpm lockfile is untouched.
- The honest-status banner survives in the rewritten README: marketplace and tourism
  remain demo data; no payments; HIC remains `INACTIVE`; all scientific models remain
  `NOT_VALIDATED`.

## 4. Follow-up tracks (recorded as issues with `blueprint-track`)

- Owner: apply the two-line verify.yml patch (or grant the integration the `workflows`
  permission) so the `verify` job runs; then the full CI chain is green.
- Continue the roadmap per `docs/blueprint/ROADMAP-ALIGNMENT.md` §2 priorities 1–10.
- Status transitions (`IMPLEMENTED` → `VERIFIED`) are owner-only, evidence-gated.
