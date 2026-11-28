# Changelog

All notable changes to this repository are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/) from v1.0.0 onward
(the project is in `0.x` while capabilities are unverified).
Dates are UTC.

## [Unreleased] — 2026-11-28

### Added

- `docs/blueprint/` — Eco Nojin Master Blueprint v1.0 (structured rendition), blueprint
  index with the four-state capability model (VISION / DESIGNED / IMPLEMENTED / VERIFIED),
  `GOALS-STATUS-MATRIX.md` (G01–G16 with evidence) and `ROADMAP-ALIGNMENT.md`
  (14 phases, 10 priorities, 6 vertical slices mapped to the repository).
- `docs/adr/ADR-0011-master-blueprint-and-repo-standardization.md` — adoption decision
  (owner-authorized) and the completed ADR register (`docs/adr/README.md`, ADR-0001…0011).
- Community health files: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  `CHANGELOG.md` (this file), `.editorconfig`.
- GitHub templates: `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/`
  (bug report, feature request, config).
- Root `package.json` metadata: `name` (`@eco-nojin/monorepo`), `license` (MIT),
  `repository`, `bugs`, `homepage`, `author`.
- Execution tracks recorded as GitHub issues (label `blueprint-track`).

### Changed

- Root `README.md` and `docs/README.md` rewritten to match the implemented reality
  (services/api real backend, engines/hydroma Python engine, unified platform SPA,
  15 shipped locales, pnpm-based tooling).
- `.github/README.md` updated: CI is active (verify.yml), templates documented.

### Fixed

- Documentation/reality drift: README no longer claims the backend and scientific engine
  are "not implemented".

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
