# Phase 3.103 — Frontend Source-Code Reality Audit

**Classification:** `FRONTEND_AUDIT_COMPLETED_WITH_EVIDENCE`
**Mode:** READ-ONLY. No source/config/test/DB/git changes. Sole artifact: this report.

## 1. Executive summary
The frontend is **partially real**. A substantial capability layer (~38 routes) is genuinely API-backed and tested; the remaining ~50 pages are demo/mock or placeholder rendered by `PageRenderer` from `src/data/entities.ts`. The shell, design system, i18n (15 locales), RTL, lazy loading and tests are real. The main product risk is that demo pages are not clearly gated, and one demo form path POSTs to the API while its list stays demo (inconsistent persistence).

## 2. Actual frontend architecture
- Apps: `apps/platform` (workspace + public), `apps/brand`; 8 archived legacy apps under `archive/` (not active).
- Routing: `router.tsx` capability routes + `content/pages.ts` (87 page defs; kinds list 49, dashboard 10, report 9, wizard 5, detail 3, map 1).
- Data: TanStack Query hooks (`services/hooks.ts`) → `services/api.ts` → `/api` proxy → `services/api`.
- UI: `@eco-nojin/ui` tokens/components; i18n 15 locales; PWA (`sw.js`, manifest).
- Tests: 80 Vitest files / 560 tests; 30 Playwright specs; build/bundle gates.

## 3. Route inventory (summary)
Full per-route detail is derived from `router.tsx` + `pages.ts`; classifications:
- **REAL_IMPLEMENTED (~38):** capability routes (farms, farm detail, crop cycles, irrigation, observations, tasks/schedule/detail, projects/detail, communities/villages, territories, natural resources, hydroma models/sources/readiness/irrigation/environment/datasets, HIC, challenges, ecocoin, intelligence, marketplace, notifications, resources, overview).
- **PARTIALLY_IMPLEMENTED (~20):** demo list pages whose `ResourceForm` POSTs (`PageRenderer.tsx:260`) but whose list/search remains demo (`entities.ts`).
- **MOCK_DATA (~25):** dashboard/report/detail/wizard/map demo pages (`PageRenderer.tsx` uses `list()/findAny()` + `UI.demo`).
- **PLACEHOLDER/UNVERIFIED (~4):** remaining static pages.
Counts are approximate; no inflation.

## 4. Fake/incomplete functionality
- `PageRenderer` renders demo entities for non-capability routes (`pages/PageRenderer.tsx:99-101,200,348,443,509,647`).
- Demo KPIs/charts/trends are static (`PageRenderer.tsx:103-128`), labeled `UI.demo`.
- `ResourceForm` persists to API (`PageRenderer.tsx:260-261`) but the page list does not refetch real data → **partial persistence**.
- No fake pagination in capability modules (real `limit/cursor`); demo lists have no pagination.
- No localStorage auth; real cookie sessions.

## 5. API integration
`API_ENDPOINT_EXISTS` + `API_CLIENT_EXISTS` + `FRONTEND_CALLS_API` + `API_RESPONSE_USED_BY_UI` + `USER_ACTION_PERSISTED` verified for capability routes; `END_TO_END_FUNCTIONALITY_VERIFIED` only for tested workflows (farms, challenges, readiness, irrigation, datasets, execution). Demo routes do not call APIs for display.

## 6. HyDroMA scientific UI
- Real: `ModelsPage` (`useModels`), `HydromaWorkspace` (farms/soil/observations/irrigation runs), `EnvDataModule`, `DatasetBuilderModule` (assemble/revisions/model-input/execute), `ReadinessModule`, `HICModule`.
- Distinguishes snapshot fingerprint (DatasetBuilder) and output fingerprint (execute result), attempt status, `NOT_VALIDATED` badges.
- **Gap:** executed **input** fingerprint (Phase 3.102) is not displayed in the UI; only snapshot/output fingerprints. P2.
- No fabricated scientific results; no charts without data.

## 7. Design/UX
Consistent tokens/typography/RTL/responsive; duplicate `irrigation` key fixed. Issues: ~50 demo pages visually indistinguishable from real (P1); one hardcoded `modelInput JSON` label (P3); bundle near cap (P2).

## 8. Architecture/maintainability
Monolith `server.mjs` large but tested; api-client typed; lazy sections; no circular deps detected by `check:arch`. Debt: demo/real duality, large server file, unpinned Python deps, untracked WIP.

## 9. Tests/build (actual)
typecheck PASS; lint PASS; Vitest **560 pass**; build platform+brand OK; bundle OK. E2E not run this mission (requires servers); prior targeted E2E passed.

## 10. P0–P4 register
- **P1** Demo pages presented as product (~50) — `pages/PageRenderer.tsx`, `content/pages.ts`.
- **P1** Demo list + real form POST inconsistency — `PageRenderer.tsx:260`.
- **P2** Executed input fingerprint not surfaced — `DatasetBuilderModule.tsx`.
- **P2** Bundle near 900 KB cap.
- **P2** No rate limiting (backend, affects frontend abuse).
- **P3** Hardcoded `modelInput JSON` label.
- **P4** Legacy archived apps remain.

## 11. Remediation sequence (not executed)
Gate demo pages behind capability boundaries/badges → make demo forms fully real or remove → surface executed input fingerprint → bundle split → rate limiting → README/UI cleanup.

## 12. Limitations
E2E not run this mission; counts approximate; no runtime tenant audit; DB not inspected; demo/real classification based on source, not pixel review.

## 13. Independent review (Nemotron 3 Ultra)
Sampled capability routes (farms, datasets, execution) confirmed real API/hooks; verified demo rendering in `PageRenderer`; confirmed P1 demo/real duality and P2 input-fingerprint gap; no P0 found; no unsupported completion claims.

**Final:** `FRONTEND_AUDIT_COMPLETED_WITH_EVIDENCE`.