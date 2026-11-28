# Changelog

All notable changes to this repository are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) from v1.0.0 onward
(the project is in `0.x` while capabilities are unverified).
Dates are UTC.

## [Unreleased] — 2026-11-28 — repository standardization (prepared on `standards/blueprint-v1`; re-applied on `standards/blueprint-v1-r2` over main `01782c1f`)

### Added

- `docs/blueprint/` — Eco Nojin Master Blueprint v1.0 (structured rendition), blueprint
  index with the four-state capability model (VISION / DESIGNED / IMPLEMENTED / VERIFIED),
  `GOALS-STATUS-MATRIX.md` (G01–G16 with evidence, refreshed after the implementation wave)
  and `ROADMAP-ALIGNMENT.md` (14 phases, 10 priorities, 6 vertical slices).
- `docs/adr/ADR-0012-master-blueprint-and-repo-standardization.md` — adoption decision
  (owner-authorized; renumbered from a transient 0011 because ADR-0011 was concurrently
  adopted on main) and the completed ADR register (`docs/adr/README.md`, ADR-0001…0012).
- Community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `CHANGELOG.md` (this file), `.editorconfig`.
- GitHub templates: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`
  (bug report, feature request, config).
- Root `package.json` metadata: `name` (`@eco-nojin/monorepo`), `license` (MIT),
  `repository`, `bugs`, `homepage`, `author`.
- Execution tracks recorded as GitHub issues (label `blueprint-track`).
- `docs/reports/2026-11-28-repo-standardization-completion-report.md` — the standardization
  completion report with evidence and follow-up tracks.

### Changed

- Root `README.md` and `docs/README.md` rewritten to match the implemented reality
  (services/api real backend with engine gateway/execution/science/stac/transparency,
  engines/hydroma Python engine + optional connect package, services/edi service,
  unified platform SPA, 15 shipped locales, pnpm-based tooling).
- `.github/README.md` updated: CI is active (verify.yml), templates documented.

### Removed

- Root artifact `tatus` — an accidentally committed terminal log from commit 01782c1f
  (a truncated `git status` typo capturing stdout). Removed per ADR-0012; no project
  content lost (the history it captured is in git itself).

### Fixed

- Documentation/reality drift: README no longer claims the backend and scientific engine
  are "not implemented".
- ADR references inside `docs/blueprint/` point to ADR-0012.
- `test:api` now runs `node --test services/api/tests/*.test.mjs` — the bare-directory
  form stopped resolving on Node 24 (`MODULE_NOT_FOUND`), which broke API tests locally
  and in CI. Verified: 159 pass / 4 skipped / 0 fail.
- HyDroMA regression suite passes from the repo root: the architecture-boundary test in
  `engines/hydroma/tests/test_climate_crop_workflow.py` resolves the engine file via
  `__file__` instead of the process CWD (CI invokes pytest from the root).
- CI root-cause analysis recorded: `pnpm install --frozen-lockfile --no-audit --no-fund`
  in `verify.yml` fails on pnpm 12 (flags removed in pnpm 12 → `unexpected argument`) and
  the local-only architecture gates (`check:arch`, `test:arch`) are not yet wired into the
  workflow. Editing workflow files requires the `workflows` permission, so these two
  verify.yml corrections are recorded as owner follow-ups in the standardization
  completion report and the `blueprint-track` issue, not silently skipped.

## [2026-11-28] — ecosystem implementation wave (on `main`, commit `01782c1f`)

### Added

- Platform sections in `apps/platform`: agriculture (farms, crop cycles, task schedule &
  detail, irrigation, field observations, env data/sources, dataset builder, HyDroMA
  workspace, intelligence, readiness, overview), communities (villages, community
  workspace), projects, territory, rewards & challenges; API-backed pages (marketplace,
  models, notifications, resources); `DemoLayout`, `WorkspaceGate`, `ApiState`,
  `CapabilityBoundary`; PWA basics (manifest, service worker, icons).
- `services/api`: `engine-gateway.mjs`, `engine-execution.mjs`, `science.mjs`,
  `stac.mjs`, `stac-contract.mjs`, `transparency.mjs`; expanded persistence (`db.mjs`)
  and server; expanded test suite (security, rate-limit, tenant-isolation, cookie, cors,
  runs hardening/integrity, engine gateway/execution/real, rewards, EcoCoin ledger,
  challenge workflow, agri tasks, soil versioning/context, dataset API, env data/sources,
  STAC, science, intelligence, readiness, quality, transparency).
- `engines/hydroma`: ~30 new scientific modules (agroclimate, drought ×3, groundwater
  + spatial, surface hydrology, watershed, soil physics, rosetta, crop growth / DSSAT /
  dual / GDD, carbon, chilling, biodiversity stress, pest risk, plant strengthening,
  isotope, remote sensing, SDG indicators, water footprint, water productivity,
  calibration, execution manifest, exec worker, free sources) plus the optional
  `connect` package per ADR-0011 (CHIRPS, ERA5, Sentinel-2 reference connectors,
  acquisition with SSRF protection, SHA-256 verified cache, artifact manifest,
  STAC discovery) with an offline test suite.
- `services/edi` — a standalone Python EDI service: canonical data contracts v1
  (JSON schema), provenance metadata, quality validation, storage (SQLite/Parquet/
  atomic writes/manifest/recovery), security policy, registry, tests.
- `lab/` — scientific benchmark harness (`run_real.py`, pilots, real-data pipeline:
  acquire/normalize/provenance/quality/consistency/independence/benchmark, SPI/SPEI)
  with benchmark results, provenance-and-status reports and an independent scientific
  review package. Evidence-gathering pending owner-approved validation; models remain
  `NOT_VALIDATED`.
- `contracts/`: `hydro-model-port.md`, `map-adapter.md`, `stac-search-port.md`.
- `docs/architecture/`: architecture overview/principles/status/roadmap, guardrails,
  C4 diagrams, component & domain registries, a full frontend architecture set
  (modules/routes registries, auth & permissions, migration plan, current-vs-target),
  per-domain READMEs and the technology-selection ADR series under
  `docs/architecture/adr/` (0011 MapLibre, 0012 CesiumJS, 0013 pgSTAC, 0014 Hydromt-wflow,
  0015 connectors) with registries.
- `docs/adr/ADR-0011-optional-environmental-connectors.md` (ACCEPTED, 2026-11-27).
- `docs/reports/`: ~50 phase reports (phases 3.60–3.105, autonomous engineering phases,
  scientific-run persistence, EDI acquisition, dataset binding, reality audits) and the
  continuation prompt for the unified-platform agent.
- Root reports: `SMART_CONTRACT_ARCHITECTURE_DISCOVERY_AND_DESIGN.md`,
  `SMART_CONTRACT_AGENT_TRAINING_REPORT.md`.
- TS parity packages: scientific engine port, GDD model, Hargreaves ET0, hydro-model-port
  adapter, STAC search port, map adapter; i18n catalogs updated.

### Changed

- `package.json`: verify chain extended with `check:arch` and `test:arch`
  (architecture guardrails); `test:api` now runs the whole `services/api/tests/`
  directory.
- `scripts/`: `architecture-guardrails.mjs` (+ tests), extended `check-tokens.mjs`,
  unified dev/serve updates, Playwright config updated.

### Removed

- (handled on this branch) the accidental `tatus` terminal-log artifact.

## Historical (before this changelog existed)

### 2026-11-26

- Merged `mahak1988/HyDroMa` remote history into the Eco Nojin local history
  (unrelated-histories merge; local Eco Nojin content kept, original HyDroMa Persian
  content preserved as `LICENSE` and `src/README.md`).
- `feat(hic)`: controlled HIC foundation — `GET /v1/hic/status` returning `INACTIVE`,
  non-issuable, non-transferable, non-convertible, non-financial metadata; API client type,
  `useHicStatus` hook, `/platform/hic` module, read-only constraint tests
  (phase 3.78 integration report).

### 2026-11-23 — platform unification (phases 5b–8) and app archival

- Phase 5b: field collection nested under `/landscape/field` with **real** sync to
  `/v1/resources/surveys` (guest pending → authenticated POST → synced/failed states).
- Phase 5c: administration section at `/landscape/admin` (shell, identity, users,
  notifications, profile, security, settings on the real root session).
- Phase 5d: profile and security pages in the public core (`/profile`, `/security`).
- Phase 6: science section at `/science` (lazy, MapLibre/deck.gl excluded from entry)
  and `GET /v1/runs` listing recorded runs (organization-scoped).
- Phase 7: bundle budget gate (initial 900 KB / section entries 700 KB), marketplace page
  splitting, SPA-only host; legacy apps archived under `archive/legacy-*` (sources tracked,
  build output ignored) and removed from build/dev/serve (owner-approved).
- Phase 8: ADR-0010 (unified platform sections) recorded; routing guide rewritten for the
  section model; apps guide updated.
- Indonesian public-core content completed so all 15 shipped locales carry real copy.
- Repository scaffolding on `develop` (README, folder structure, `.gitignore`, MIT license).
