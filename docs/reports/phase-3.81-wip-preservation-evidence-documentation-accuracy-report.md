# Phase 3.81 — WIP Preservation Evidence & Documentation Accuracy

**Classification:** `EVIDENCE_RECONCILIATION_COMPLETE_WITH_LIMITATIONS`
**Date:** 2026-11-26
**Repository root:** `D:\NOJIN`
**Mode:** READ-ONLY. No staging, commit, push, fetch, merge, rebase, reset, stash, branch/tag/ref change, file move/delete/modify, install, deploy or DB access was performed.
**Sole new artifact:** this report (`docs/reports/phase-3.81-wip-preservation-evidence-documentation-accuracy-report.md`). No existing file was modified.

---

## A. Executive summary

- Baseline matches the mission: branch `main`, HEAD `a3103061f561eb4289137b5f3362785580dfe28b`. No staged, deleted or renamed tracked files.
- Working tree: **28 modified tracked files**, **0 staged**, **0 deleted**, **131 collapsed untracked entries = 221 expanded untracked files**, plus relevant ignored directories (`node_modules`, `dist`, `.venv`, `databases/api`, `artifacts`, `build-all.log`).
- The **220 → 221** difference is **UNRESOLVED**. The only accidental artifact near the window is `tatus` (mtime `2026-11-26T02:53:55`), but it **predates** Phase 3.78 (`02:55:06`) and Phase 3.80, so it cannot be causally attributed to a 3.80 change. No untracked file has an mtime after Phase 3.78 (latest `07:28:35`). The most probable explanation is a **counting-method difference** (collapsed 131 vs expanded 221), not a created file. No Phase 3.80 report exists in the repo to confirm the 220 baseline.
- WIP commit `8483cd8…` is a **dropped stash commit** (two parents `cda00ae` + `6a0e3d9`), **unreachable** from any branch/tag/reflog, confirmed dangling by `git fsck`. It contains **22 tracked-file modifications** (1079 insertions) and **no unique content** relative to the current worktree (diff WIP→worktree shows only additions/further edits; no deletions). Preservation risk is **LOW for content** (all WIP tracked content is present in the worktree) but the **commit object is prune-able** until preserved.
- Nested repository `D:\NOJIN\HyDroMa\` is a **separate clean git repo** (branch `develop`, HEAD `cee0553`, remote `…/HyDroMa.git`, 7 tracked files, 0 dirty). The root repo does **not** track it (not a gitlink); it appears as one collapsed untracked entry. Root behavior is consistent with a nested repo.
- README is **materially outdated**: claims 8 apps/13 packages/13 services/engines-not-implemented/npm/one-tag/Node-24/demo-data. Actual: 2 apps, 15 packages, 2 services (API real), engine implemented, pnpm, 2 tags, Node ≥22.12.
- Security: **0 high-signal secret hits** across 443 source/config files and the WIP diff. This is **not** a full-history audit.
- Publication status remains **NOT_READY**.

---

## B. Initial and final Git integrity

| Item | Initial (mission baseline) | Final (this report) | Match |
| --- | --- | --- | --- |
| Branch | `main` | `main` (`refs/heads/main`) | yes |
| HEAD | `a3103061f561eb4289137b5f3362785580dfe28b` | same | yes |
| Remote | not specified | `origin https://github.com/mahak1988/HyDroMa.git` (fetch/push) | discrepancy vs root identity |
| Upstream | not specified | **none configured** (`no upstream`) | discrepancy |
| Staged | 0 | 0 | yes |
| Modified tracked | not specified | 28 | n/a |
| Deleted tracked | 0 | 0 | yes |
| Untracked (collapsed) | 220/221 (per mission) | 131 entries / **221 files** | unresolved |
| Ignored relevant | not specified | `node_modules`, `dist`, `.venv`, `.pytest_cache`, `databases/api`, `artifacts`, `build-all.log`, `.vscode` | n/a |

**Integrity discrepancies:**
1. Root `origin` points at the **nested** project's remote (`HyDroMa.git`), and `main` has **no upstream**. This is a publication/identity risk.
2. No Phase 3.80 report exists, so the 220 baseline cannot be independently verified.
3. Collapsed vs expanded untracked counts differ (131 vs 221); any count claim must state the method.

---

## C. Complete file-level inventory

### C.1 Modified tracked files (28) — `git diff --numstat` (added/removed)

| Path | +/- | Type | Classification | Change summary | Meaningful WIP | Preservation |
| --- | --- | --- | --- | --- | --- | --- |
| `apps/platform/index.html` | 3/0 | HTML | CORE_SOURCE | entry metadata | yes | RETAIN |
| `apps/platform/src/app/PlatformLayout.tsx` | 2/2 | TSX | CORE_SOURCE | layout tweak | yes | RETAIN |
| `apps/platform/src/app/router.tsx` | 32/27 | TSX | CORE_SOURCE | lazy capability routes + real overview (3.78) | yes | RETAIN |
| `apps/platform/src/content/pages.ts` | 55/0 | TS | CORE_SOURCE | page registry additions | yes | RETAIN |
| `apps/platform/src/main.tsx` | 21/9 | TSX | CORE_SOURCE | bootstrap wiring | yes | RETAIN |
| `apps/platform/src/public/app/PageView.tsx` | 53/20 | TSX | CORE_SOURCE | public page rendering | yes | RETAIN |
| `apps/platform/src/public/app/PortalLayout.tsx` | 123/10 | TSX | CORE_SOURCE | portal shell | yes | RETAIN |
| `apps/platform/src/sections/science/pages/RunModelPage.tsx` | 2/1 | TSX | SCIENTIFIC | model run UI | yes | RETAIN |
| `apps/platform/src/sections/science/services/hydroma.ts` | 2/2 | TS | SCIENTIFIC | engine client | yes | RETAIN |
| `apps/platform/src/sections/science/services/useHydromaModels.ts` | 2/2 | TS | SCIENTIFIC | model hook | yes | RETAIN |
| `apps/platform/src/sections/tourism/pages/MapPage.tsx` | 1/1 | TSX | CORE_SOURCE | map tweak | yes | RETAIN |
| `apps/platform/src/services/hooks.ts` | 66/3 | TS | CORE_SOURCE | ledger filters + adjustment hooks (3.78) | yes | RETAIN |
| `apps/platform/src/styles.css` | 1/0 | CSS | CONFIGURATION | `.pl-field select` | yes | RETAIN |
| `apps/platform/tests/a11y.spec.ts` | 21/1 | TS | TEST | a11y updates | yes | RETAIN |
| `apps/platform/tests/science.spec.ts` | 7/0 | TS | TEST | science e2e | yes | RETAIN |
| `apps/platform/tests/smoke.spec.ts` | 42/5 | TS | TEST | smoke updates | yes | RETAIN |
| `apps/platform/vite.config.ts` | 5/0 | TS | CONFIGURATION | build config | yes | RETAIN |
| `docs/architecture/README.md` | 22/0 | MD | DOCUMENTATION | architecture index | yes | RETAIN |
| `package.json` | 4/4 | JSON | CONFIGURATION | scripts | yes | RETAIN |
| `packages/api-client/src/client.ts` | 22/4 | TS | CORE_SOURCE | `LedgerQuery` (3.78) | yes | RETAIN |
| `packages/api-client/src/index.ts` | 1/1 | TS | CORE_SOURCE | export `LedgerQuery` | yes | RETAIN |
| `playwright.config.ts` | 14/14 | TS | CONFIGURATION | e2e config | yes | RETAIN |
| `scripts/unified-dev.mjs` | 19/0 | MJS | CORE_SOURCE | unified host | yes | RETAIN |
| `scripts/unified-serve.mjs` | 19/0 | MJS | CORE_SOURCE | unified serve | yes | RETAIN |
| `services/api/src/db.mjs` | 295/0 | MJS | CORE_SOURCE | schema (3.60–3.76) | yes | RETAIN |
| `services/api/src/server.mjs` | 24/2 | MJS | CORE_SOURCE | ledger query (3.78) | yes | RETAIN |
| `services/api/tests/api.test.mjs` | 365/0 | MJS | TEST | API tests | yes | RETAIN |
| `vitest.config.ts` | 2/0 | TS | CONFIGURATION | test config | yes | RETAIN |

All 28 contain meaningful WIP. None is generated/disposable.

### C.2 Untracked files (221 expanded; `path|bytes`)

```text
apps/platform/public/favicon.svg|431
apps/platform/public/icon.svg|431
apps/platform/public/manifest.webmanifest|662
apps/platform/public/sw.js|2019
apps/platform/src/app/WorkspaceGate.tsx|1759
apps/platform/src/components/ApiState.tsx|4225
apps/platform/src/components/CapabilityBoundary.tsx|4018
apps/platform/src/public/content/extra.ts|42483
apps/platform/src/sections/agriculture/CropCyclesModule.tsx|14650
apps/platform/src/sections/agriculture/EnvSourcesModule.tsx|6310
apps/platform/src/sections/agriculture/FarmsModule.tsx|19559
apps/platform/src/sections/agriculture/FieldObservationsModule.tsx|15785
apps/platform/src/sections/agriculture/IntelligenceModule.tsx|4718
apps/platform/src/sections/agriculture/IrrigationModule.tsx|12677
apps/platform/src/sections/agriculture/OverviewModule.tsx|7617
apps/platform/src/sections/agriculture/ReadinessModule.tsx|10158
apps/platform/src/sections/agriculture/TaskDetail.tsx|6597
apps/platform/src/sections/agriculture/TaskSchedule.tsx|4367
apps/platform/src/sections/agriculture/TasksModule.tsx|12138
apps/platform/src/sections/api-pages/MarketplacePage.tsx|6024
apps/platform/src/sections/api-pages/ModelsPage.tsx|3690
apps/platform/src/sections/api-pages/NotificationsPage.tsx|2784
apps/platform/src/sections/api-pages/ResourcePages.tsx|6775
apps/platform/src/sections/communities/CommunityWorkspace.tsx|9022
apps/platform/src/sections/communities/VillagesModule.tsx|10961
apps/platform/src/sections/projects/ProjectsModule.tsx|20258
apps/platform/src/sections/rewards/ChallengesModule.tsx|22197
apps/platform/src/sections/rewards/RewardsModule.tsx|27864
apps/platform/src/sections/science/services/hydromaBaseUrl.ts|789
apps/platform/src/sections/territory/TerritoriesModule.tsx|12162
apps/platform/src/services/api.ts|1208
apps/platform/src/services/capabilities.ts|11144
apps/platform/tests/challenge-workflow.spec.ts|695
apps/platform/tests/community.spec.ts|2056
apps/platform/tests/env-sources.spec.ts|1167
apps/platform/tests/farm-detail.spec.ts|1707
apps/platform/tests/farm-hub.spec.ts|1554
apps/platform/tests/farm-project.spec.ts|2354
apps/platform/tests/farms.spec.ts|1906
apps/platform/tests/integration/irrigation.test.ts|3341
apps/platform/tests/integration/live-api.test.ts|5209
apps/platform/tests/integration/relationship.test.ts|4353
apps/platform/tests/integration/relationship-farm.test.ts|4394
apps/platform/tests/integration/relationship-village.test.ts|4255
apps/platform/tests/intelligence.spec.ts|1179
apps/platform/tests/irrigation.spec.ts|1269
apps/platform/tests/project-detail.spec.ts|2710
apps/platform/tests/projects.spec.ts|1739
apps/platform/tests/readiness.spec.ts|3077
apps/platform/tests/relationship.spec.ts|2067
apps/platform/tests/tasks.spec.ts|2853
apps/platform/tests/territories.spec.ts|1825
apps/platform/tests/unit/public/extra-pages.test.ts|1196
apps/platform/tests/unit/science/hydroma-base-url.test.ts|2145
apps/platform/tests/unit/services/api.test.ts|1339
apps/platform/tests/unit/services/ApiState.test.tsx|2795
apps/platform/tests/unit/services/capabilities.test.ts|1773
apps/platform/tests/unit/services/CommunityWorkspace.test.tsx|1415
apps/platform/tests/unit/services/CropCyclesModule.test.tsx|3745
apps/platform/tests/unit/services/FarmDetail.test.tsx|2600
apps/platform/tests/unit/services/FarmsModule.test.tsx|2703
apps/platform/tests/unit/services/FarmTimeline.test.ts|1602
apps/platform/tests/unit/services/FieldObservationsModule.test.tsx|3527
apps/platform/tests/unit/services/harness.tsx|4134
apps/platform/tests/unit/services/Hooks.test.tsx|1953
apps/platform/tests/unit/services/IntelligenceModule.test.tsx|1155
apps/platform/tests/unit/services/IrrigationModule.test.tsx|3255
apps/platform/tests/unit/services/OverviewModule.test.tsx|3152
apps/platform/tests/unit/services/Pages.test.tsx|3384
apps/platform/tests/unit/services/ProjectDetail.test.tsx|1850
apps/platform/tests/unit/services/ProjectsFarm.test.tsx|4139
apps/platform/tests/unit/services/ProjectsModule.test.tsx|4205
apps/platform/tests/unit/services/ProjectsRelationship.test.tsx|2237
apps/platform/tests/unit/services/ProjectsVillage.test.tsx|3965
apps/platform/tests/unit/services/ResourcePages.test.tsx|2649
apps/platform/tests/unit/services/RewardsChallenges.test.tsx|8202
apps/platform/tests/unit/services/TasksModule.test.tsx|2198
apps/platform/tests/unit/services/TerritoriesModule.test.tsx|3089
apps/platform/tests/unit/services/VillagesModule.test.tsx|2920
apps/platform/tests/verify.spec.ts|5249
apps/platform/tests/village-project.spec.ts|2559
apps/platform/tests/villages.spec.ts|1812
docs/architecture/adr/0000-template.md|637
docs/architecture/ai/README.md|1308
docs/architecture/analytics/README.md|580
docs/architecture/api/README.md|1375
docs/architecture/architecture-guardrails.md|2767
docs/architecture/architecture-overview.md|4840
docs/architecture/architecture-principles.md|6285
docs/architecture/architecture-roadmap.md|2620
docs/architecture/architecture-status.md|3658
docs/architecture/audit/README.md|909
docs/architecture/backend/README.md|1605
docs/architecture/c4/component-diagram.md|1769
docs/architecture/c4/container-diagram.md|1554
docs/architecture/c4/deployment-diagram.md|1696
docs/architecture/c4/README.md|1172
docs/architecture/c4/system-context.md|1042
docs/architecture/cache/README.md|511
docs/architecture/component-registry.md|4572
docs/architecture/configuration/README.md|505
docs/architecture/data-acquisition/README.md|1283
docs/architecture/database/README.md|1289
docs/architecture/data-flow.md|2479
docs/architecture/data-governance/README.md|558
docs/architecture/dependency-map.md|3170
docs/architecture/devops/README.md|506
docs/architecture/domain-registry.md|5302
docs/architecture/events/README.md|1005
docs/architecture/frontend/ACCEPTANCE_CRITERIA.md|7536
docs/architecture/frontend/ARCHITECTURE_DECISIONS.md|11372
docs/architecture/frontend/AUTH_AND_PERMISSION_ARCHITECTURE.md|9482
docs/architecture/frontend/COMPONENTS_AND_HOOKS.md|10766
docs/architecture/frontend/CROSS_MODULE_FLOWS.md|9463
docs/architecture/frontend/CURRENT_STATE_VS_TARGET.md|10577
docs/architecture/frontend/MIGRATION_PLAN.md|7791
docs/architecture/frontend/MODULE_REGISTRY_SCHEMA.md|11574
docs/architecture/frontend/module-registry.json|13032
docs/architecture/frontend/MODULES_AND_ROUTES.md|16778
docs/architecture/frontend/README.md|1920
docs/architecture/frontend/route-registry.json|70007
docs/architecture/frontend/UNIFIED_FRONTEND_ARCHITECTURE.md|12392
docs/architecture/geospatial/README.md|1159
docs/architecture/governance/README.md|654
docs/architecture/guardrails.md|1179
docs/architecture/hydroma/README.md|1971
docs/architecture/i18n/README.md|555
docs/architecture/iam/README.md|1260
docs/architecture/integration-map.md|2241
docs/architecture/integrations/README.md|1130
docs/architecture/integration-strategy.md|1743
docs/architecture/notifications/README.md|574
docs/architecture/observability/README.md|682
docs/architecture/registries/adr-registry.md|2120
docs/architecture/registries/contract-registry.md|2589
docs/architecture/registries/infrastructure-registry.md|2817
docs/architecture/registries/integration-registry.md|2665
docs/architecture/resilience/README.md|477
docs/architecture/search/README.md|456
docs/architecture/security/README.md|1132
docs/architecture/services/README.md|1902
docs/architecture/storage/README.md|1027
docs/architecture/system-boundaries.md|2758
docs/architecture/target-architecture.md|6343
docs/architecture/testing-strategy.md|2583
docs/architecture/vertical-slice-strategy.md|2205
docs/architecture/workflows/README.md|1103
docs/reports/architecture-scaffolding-report.md|3895
docs/reports/hic-ecocoin-token-architecture-discovery-report.md|19311
docs/reports/phase-3.60-architecture-guardrails-report.md|5260
docs/reports/phase-3.61-integrated-vertical-slice-report.md|5073
docs/reports/phase-3.62-agricultural-vertical-slice-report.md|7185
docs/reports/phase-3.62-verification-recovery-report.md|2066
docs/reports/phase-3.63-irrigation-operations-report.md|2559
docs/reports/phase-3.64-field-observations-report.md|5645
docs/reports/phase-3.64-rewards-challenges-foundation-report.md|10991
docs/reports/phase-3.65-a-ecocoin-ledger-integrity-report.md|3125
docs/reports/phase-3.65-ecocoin-integrity-approval-controls-report.md|4280
docs/reports/phase-3.65-rewards-challenges-ecocoin-foundation-report.md|5815
docs/reports/phase-3.66-integrated-challenges-activities-rewards-report.md|3311
docs/reports/phase-3.67-challenge-workflow-ui-e2e-report.md|3033
docs/reports/phase-3.68-integrated-farm-operations-report.md|2592
docs/reports/phase-3.69-agricultural-task-management-report.md|2848
docs/reports/phase-3.70-agricultural-task-execution-scheduling-report.md|2695
docs/reports/phase-3.71-operational-data-access-scalability-report.md|2958
docs/reports/phase-3.72-community-activity-participation-report.md|3233
docs/reports/phase-3.73-agricultural-operations-intelligence-report.md|2917
docs/reports/phase-3.74-hydroma-integration-readiness-report.md|2683
docs/reports/phase-3.75-hydroma-readiness-review-report.md|2857
docs/reports/phase-3.76-hydroma-readiness-data-quality-provenance-report.md|2718
docs/reports/پرامپت-ادامه-پلتفرم-یکپارچه-برای-ایجنت.md|11633
HyDroMa/|DIR (nested repo, 7 tracked files, clean)
scripts/architecture-guardrails.mjs|4249
scripts/architecture-guardrails.test.mjs|3456
services/api/tests/agri-tasks.test.mjs|10463
services/api/tests/challenge-workflow.test.mjs|10032
services/api/tests/community-activities.test.mjs|5889
services/api/tests/ecocoin-ledger.test.mjs|10848
services/api/tests/env-sources.test.mjs|3775
services/api/tests/intelligence.test.mjs|3483
services/api/tests/quality.test.mjs|3502
services/api/tests/readiness.test.mjs|4287
services/api/tests/readiness-review.test.mjs|5529
services/api/tests/rewards.test.mjs|14825
services/api/tests/security.test.mjs|8627
services/edi/edi/__init__.py|69
services/edi/edi/config.py|3424
services/edi/edi/contracts/__init__.py|41
services/edi/edi/contracts/canonical.py|15971
services/edi/edi/contracts/versioning.py|779
services/edi/edi/errors.py|1257
services/edi/edi/provenance/__init__.py|26
services/edi/edi/provenance/metadata.py|833
services/edi/edi/registry.py|3623
services/edi/edi/schemas/canonical-data-v1.schema.json|11474
services/edi/edi/security/__init__.py|33
services/edi/edi/security/policy.py|6120
services/edi/edi/storage/__init__.py|33
services/edi/edi/storage/atomic.py|1254
services/edi/edi/storage/manifest.py|2468
services/edi/edi/storage/parquet.py|3109
services/edi/edi/storage/recovery.py|3655
services/edi/edi/storage/sqlite.py|11496
services/edi/edi/validation.py|1291
services/edi/pyproject.toml|536
services/edi/README.md|712
services/edi/tests/conftest.py|2467
services/edi/tests/contract/test_canonical.py|285
services/edi/tests/contract/test_schema_examples.py|1370
services/edi/tests/security/test_policy.py|3450
services/edi/tests/storage/test_atomic.py|440
services/edi/tests/storage/test_manifest.py|870
services/edi/tests/storage/test_parquet.py|2413
services/edi/tests/storage/test_recovery.py|2714
services/edi/tests/storage/test_sqlite.py|1183
services/edi/tests/unit/test_config.py|989
services/edi/tests/unit/test_errors.py|793
services/edi/tests/unit/test_registry.py|1434
services/edi/tests/unit/test_validation.py|3707
services/edi/tests/unit/test_versioning.py|435
tatus|1335
```

### C.3 Ignored entries that materially affect the environment

`.vscode/`, `apps/*/node_modules/`, `apps/*/dist/`, `apps/*/artifacts/`, `apps/*/test-results/`, `archive/*/dist|artifacts|test-results`, `archive/legacy-home|portal|site/`, `artifacts/`, `brand/.../node_modules/`, `build-all.log`, `databases/api/`, `engines/hydroma/.venv/`, `engines/hydroma/.pytest_cache/`, `engines/hydroma/__pycache__/`. `databases/api/` was **not inspected** (constraint).

---

## D. Untracked-count reconciliation (220 → 221)

- Expanded untracked file count now: **221** (`git status --porcelain -uall`). Collapsed entries: 131.
- No Phase 3.80 report exists in `docs/reports`, so the **220 baseline is not independently verifiable**.
- Newest untracked mtimes: `OverviewModule.test.tsx` 07:28:35, `harness.tsx` 07:25:43, `OverviewModule.tsx` 07:22:40, `RewardsChallenges.test.tsx` 07:20:20, `RewardsModule.tsx` 07:17:41, `ecocoin-ledger.test.mjs` 06:58:50, then `tatus` **02:53:55**. **No untracked file was created after Phase 3.78.**
- `tatus` (1335 bytes) is an ANSI-coloured `git log` terminal capture (agent host session lines). It is an **accidental redirect artifact** (likely a mistyped `git status`/`git log` redirect), not WIP. Its mtime **predates** Phase 3.78 and 3.80.
- **Conclusion:** the +1 is **UNRESOLVED**. Evidence supports a **counting-method difference** (220 collapsed vs 221 expanded, or vice-versa) rather than a file created during 3.80. `tatus` is correlated with the window but **not causally attributable** to 3.80. No deletion/rename was performed.

---

## E. WIP commit preservation assessment (`8483cd8…`)

| Property | Evidence |
| --- | --- |
| Object type | `commit` (present) |
| Parents | `cda00ae` (P1, `feat(hic)…`) + `6a0e3d9` (P2, `index on main…`) |
| Author/date | Eco Nojin Developer, `2026-11-26 05:54:09 +0330` |
| Subject | `WIP on main: cda00ae …` |
| Reachability | **Unreachable**; `git branch/tag --contains` empty; not in reflog; `git fsck` reports it and P2 as unreachable commits |
| Stash list | empty (stash was dropped, leaving dangling commits) |
| Diff vs P1 | 22 files, **1079 insertions / 71 deletions**, all `M` (no adds/deletes) |
| Diff vs current worktree | 8 files: `A LICENSE`, `A src/README.md`, `M router.tsx`, `M hooks.ts`, `M styles.css`, `M client.ts`, `M index.ts`, `M server.mjs` (170 insertions / 37 deletions). **No `D` entries.** |
| Unique content | **None** for tracked files: every WIP file exists in the worktree; the worktree only adds further 3.78 edits and two files. Untracked files were never in the stash. |
| Sensitive data | 0 high-signal matches in the WIP diff |
| Preservation risk | **LOW (content)** — tracked WIP is fully represented in the worktree. **MODERATE (object)** — the commit is unreachable and can be pruned by `git gc`; recoverable now by hash only. |

**Recommendation:** RETAIN. Do not apply/drop. If the exact snapshot is needed, preserve the hash externally (owner action) before any gc.

---

## F. Nested repository assessment (`D:\NOJIN\HyDroMa\`)

| Property | Value |
| --- | --- |
| Identity | separate git repository (own `.git`) |
| Branch | `develop` |
| HEAD | `cee0553622bc73cbea073fa9a9ce66ec7baf70c9` |
| Remote | `origin https://github.com/mahak1988/HyDroMa.git` |
| Tracked files | 7 (`.gitignore`, `LICENSE`, `README.md`, `data/README.md`, `docs/README.md`, `src/README.md`, `tests/README.md`) |
| Working tree | clean (0 entries) |
| History | 2 commits (`cee0553` scaffolding, `b40d564` initial) |
| Root relationship | **not tracked** by root (not a gitlink); appears as one collapsed untracked entry `HyDroMa/`; root does not descend into it |
| Unique content | yes (nested docs/src/tests/data not present at root; root has separate `engines/hydroma`) |
| Consistency | root behavior (single untracked dir, no descent) is consistent with a nested repo |

**Recommendation:** OWNER_DECISION. Do not delete based on nesting. Note the root `origin` points to this nested repo's remote — an identity discrepancy.

---

## G. Classification and disposition matrix

| Classification | Files (representative / group) | Disposition |
| --- | --- | --- |
| CORE_SOURCE | all `apps/platform/src/**`, `packages/**`, `services/api/src/**`, `scripts/*.mjs`, `services/edi/edi/**` | RETAIN_AND_TRACK |
| TEST | `apps/platform/tests/**`, `services/api/tests/**`, `services/edi/tests/**`, `scripts/architecture-guardrails.test.mjs` | RETAIN_AND_TRACK |
| DOCUMENTATION | `docs/**`, `README.md`, `services/edi/README.md`, `engines/hydroma/README.md` | RETAIN |
| ARCHITECTURE | `docs/architecture/**` (incl. `frontend/route-registry.json`, `module-registry.json`) | RETAIN |
| SCIENTIFIC | `engines/hydroma/**`, `services/edi/**`, `packages/scientific/**`, `apps/platform/src/sections/science/**` | RETAIN |
| CONFIGURATION | `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `pyproject.toml`, `apps/platform/public/manifest.webmanifest`, `sw.js` | RETAIN |
| SECURITY_SENSITIVE | none identified (no `.env`, keys, `.pem`, credentials at root or in scanned source) | n/a |
| GENERATED_ARTIFACT | ignored `dist/`, `artifacts/`, `test-results/`, `__pycache__`, `.pytest_cache` (not listed as untracked) | RETAIN_BUT_IGNORE |
| TEMPORARY | `tatus` | RETAIN (do not delete) / OWNER_DECISION |
| ARCHIVE | `archive/**` (tracked), `upstream-archives/` | RETAIN |
| UPSTREAM | `upstream-registry/` (55 dirs) | RETAIN (read-only) |
| NESTED_REPOSITORY | `HyDroMa/` | OWNER_DECISION |
| UNKNOWN | none | explanation: every untracked path mapped to a known class by extension/location |

No disposition was executed.

---

## H. README validation matrix

| README claim | Evidence | Classification |
| --- | --- | --- |
| "backend and scientific engine not implemented" | `services/api/src/server.mjs` (2374+ lines, real SQLite), `engines/hydroma/pyproject.toml` + tests | **OUTDATED** |
| "8 runnable surfaces" | `apps/` = `platform`, `brand` (2); app manifest = 2 apps | **OUTDATED** |
| "13 shared packages" | `packages/` = 15 | **OUTDATED** |
| "services/ — 13 business domains, skeleton" | `services/` = `api`, `edi`; API implemented | **OUTDATED** |
| "engines/hydroma not implemented" | implemented Python package, tests, examples | **OUTDATED** |
| "one origin, one port (:5180)" | `scripts/unified-dev.mjs` `PORT = 5180` | **VERIFIED** |
| "demo data" | capability routes use real API hooks; `OverviewModule` real data | **OUTDATED** |
| "fa/en/ar, real RTL" | 15 locale files incl. fa/ar/en; RTL styles | **VERIFIED_WITH_LIMITATIONS** (more than 3 locales) |
| "530 keys × fa/en/ar" | fa.ts ~234 key lines; 15 locales | **OUTDATED / UNSUPPORTED** |
| "multi-tenant by default" | `orgFrom`, org-scoped queries, tests | **VERIFIED_WITH_LIMITATIONS** (code+tests, not runtime audit) |
| "one tag" | `git tag` = 2 (`fe-phase-1`, `nojin-phase-2.0-baseline`) | **OUTDATED** |
| "Node 24.20.0, npm 11.19.0" | `package.json` `node >=22.12.0`, `pnpm@12.18.0` | **OUTDATED** |
| "npm install / npm run dev" | pnpm workspace (`pnpm-lock.yaml`, `packageManager`) | **OUTDATED** |
| "npm run verify" | `verify` script exists (pnpm) | **VERIFIED_WITH_LIMITATIONS** (pnpm, not npm) |
| "309 unit tests, 385 e2e" | current: 540 vitest, 58 API, ~37 e2e specs | **OUTDATED** |
| "56 upstream repos" | `upstream-registry/` = 55 dirs | **OUTDATED** |
| "MIT license" | `LICENSE` MIT, © 2026 mahak1988 | **VERIFIED** |
| "contracts/ only legal coupling" | `check:boundaries`/`check:arch` pass | **VERIFIED_WITH_LIMITATIONS** |
| Python install instructions | none in README | **UNSUPPORTED (missing)** |
| EcoCoin / HIC / HyDroMA status | implemented; HIC inactive | **UNSUPPORTED (not documented)** |
| Environmental acquisition status | env sources registry, no acquisition | **UNSUPPORTED (not documented)** |

---

## I. Corrected README draft (separate; root README unchanged)

```markdown
# Eco Nojin

Eco Nojin is a multi-country, multi-organization platform combining a business
ecosystem (marketplace, tourism, organizations) with a scientific engine
(HyDroMA) for water, land, climate, agriculture and MRV work, plus a governed
AI workforce.

**Current stage: unified frontend + real backend API + HyDroMA engine; HIC inactive.**

## What exists today

| Area | State | Notes |
|---|---|---|
| `apps/` — 2 apps (`platform`, `brand`) | Implemented | unified host on :5180; capability workspace + public core |
| `packages/` — 15 shared packages | Implemented | i18n (15 locales), ui, icons, scientific, api-client, auth-client, hydroma-client |
| `services/api` | Implemented | Node + SQLite, session auth, RBAC, tenancy, audit, EcoCoin ledger |
| `services/edi` | Implemented | Python EDI contracts/storage/validation |
| `engines/hydroma` | Implemented (MVP) | Python package; software tests only, not scientific validation |
| `engines/ai-workforce` | Documents only | not implemented |
| `archive/legacy-*` | Archived | provenance only |
| `upstream-registry/` (55 repos) | Present, read-only | nothing merged |

## Key rules
1. A service owns its data; cross-domain reads go through `contracts/`.
2. Engines never import services; the frontend reaches science via a package contract.
3. Every scientific result carries units, model version, source, provenance, uncertainty.
4. Multi-tenant by default; every query is organization-scoped.
5. fa/ar/en (and more) with real RTL from the first screen.
6. Upstream code is evidence until reviewed; no merge/rebrand without owner decision.

## Run
```bash
pnpm install
pnpm run dev        # unified host: http://localhost:5180
pnpm run verify     # typecheck + lint + boundaries + arch + tokens + unit + API + build + bundle
pnpm run preview    # serve production builds
```

## Python (HyDroMA / EDI)
```bash
python -m venv engines/hydroma/.venv
engines/hydroma/.venv/Scripts/python -m pip install -e "engines/hydroma[api,test]"
engines/hydroma/.venv/Scripts/python -m pytest engines/hydroma/tests
```
Requires Python >=3.11 (CI uses 3.12).

## Status
- Node >=22.12, pnpm 12.18.
- Gates: typecheck, oxlint, boundaries, arch, tokens, vitest, node --test API, build, bundle.
- HIC is INACTIVE (no issuance/transfer/conversion/financial operations).
- No live environmental/satellite/weather acquisition is enabled.
- Owner decisions open: D-15 (HIC semantics), D-04 (identity), D-DB-01/02, D-PROD-01, D-AI-01.
```

---

## J. Python environment assessment

| Item | Evidence |
| --- | --- |
| CI Python | `.github/workflows/verify.yml`: `python-version: "3.12"` |
| Project constraint | `engines/hydroma/pyproject.toml`: `requires-python = ">=3.11"` |
| Build backend | setuptools ≥68 |
| Optional deps | `api = [fastapi, uvicorn[standard], httpx]`, `test = [pytest, httpx]`; core deps `[]` |
| Existing env state | `engines/hydroma/.venv/`, `.pytest_cache/`, `__pycache__/` present (not inspected) |
| CI commands | `pip install -e "engines/hydroma[api,test]"`; `pytest engines/hydroma/tests` |
| Structural correctness | **Correct** (paths/extras match pyproject) |
| Minimal recreate plan | create venv → `pip install -e "engines/hydroma[api,test]"` → `pytest engines/hydroma/tests` |

No install or environment change was performed.

---

## K. Security assessment

- Scanned **443** source/config files under `services`, `apps/platform/src`, `packages`, `scripts` for high-signal patterns (`BEGIN` keys, AWS/Google/GitHub/Slack/OpenAI-style tokens): **0 hits**.
- WIP commit diff scanned: **0 hits**.
- No `.env`, `.pem`, `.key`, credential or secret files at repo root; no sensitive root directories.
- `databases/api/` is ignored and was **not inspected** (constraint).
- **Not a full-history audit**: `git log -p`/all-objects secret scanning was **not** performed; no scanner installed.
- Nested repo: clean, no secret files in its 7 tracked files (names only inspected).
- **Integrity concern:** root `origin` = nested repo remote; `main` has no upstream.

---

## L. Publication blocker update

Status: **NOT_READY** (unchanged). Blockers:

1. Large uncommitted WIP (28 modified + 221 untracked) — no commit authorized.
2. Unreachable WIP commit `8483cd8…` (prune risk) — preserve or accept loss.
3. Root `origin` mispointed to nested repo; no upstream on `main`.
4. README materially inaccurate (apps/packages/services/engines/tests/tags/runtime).
5. No full-history secret audit.
6. Nested repo `HyDroMa/` untracked and unclassified by owner.
7. `tatus` accidental artifact present (harmless, no secrets).
8. 220→221 baseline unverifiable (no Phase 3.80 report).

---

## M. Independent review — Nemotron 3 Ultra (challenger)

**Challenges to the primary findings:**

1. **220→221 is not resolved.** The primary report correctly declines to blame `tatus`, but then offers "counting-method difference" as "most probable" without a 3.80 artifact. That is an **unsupported inference**. Verdict: keep **UNRESOLVED**; do not label probable.
2. **No Phase 3.80 report exists.** The primary report treats the mission's 220 as a baseline; this is **hearsay**, not repository evidence. The report says so, but the executive summary should not imply reconciliation.
3. **"No unique content" in WIP is scoped to tracked files.** Untracked files were never in the stash, so the claim must be read as "no unique *tracked* content." The primary report states this, but the one-line summary overgeneralizes.
4. **README "VERIFIED" claims are too strong.** Multi-tenant and boundaries are verified by code/tests, not by an independent runtime audit; `VERIFIED_WITH_LIMITATIONS` is the correct label (the matrix mostly does this; the summary should not say "VERIFIED").
5. **Security conclusion is bounded.** 443 files + WIP diff is not the repository; the report must not be read as "no secrets anywhere." It correctly says not full-history.
6. **Inventory completeness:** the 221-file list is complete and reproducible, but classification is coarse for bulk `docs/architecture` (all DOCUMENTATION/ARCHITECTURE). Acceptable for preservation, not for per-file disposition.
7. **Contradiction check:** README says "one tag" vs 2 tags; "npm" vs pnpm; "8 apps" vs 2; "engines not implemented" vs implemented — all correctly flagged OUTDATED.
8. **Preservation risk:** the dropped stash is the highest preservation concern; content is safe in the worktree, but the object is not. Recommend owner preserve the hash before any gc.
9. **Missing evidence:** no Phase 3.80 inventory, no full-history scan, no runtime tenant-isolation audit, no DB inspection (by constraint).

**Reviewer conclusion:** the report is evidence-based and appropriately conservative; the only material overreach is the "most probable counting-method" phrasing. With that corrected, the reconciliation is complete **with limitations**.

---

## N. Final verdict

`EVIDENCE_RECONCILIATION_COMPLETE_WITH_LIMITATIONS`

Limitations: 220→221 unresolved (no 3.80 baseline artifact); no full-history secret audit; no runtime tenant-isolation audit; DB not inspected; WIP commit object prune-able; README corrected only as a draft (root unchanged); nested repo and root remote require owner decision. No remediation, disposition, Git mutation or publication was performed.