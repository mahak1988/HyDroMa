# FRONTEND-FOUNDATIONS-REPORT
## گزارش بنیان‌های فرانت‌اند — batch-16

**Date:** 2026-11-18
**Scope:** evaluate four candidate frontend foundations, preserve upstream evidence, and report the
real run/build state without merging any code or rebranding any product.
**Mode:** download → archive → extract → inspect → install → build → run → screenshot. No source
file of any upstream project was edited.

---

## 0. خلاصه اجرایی (Persian summary)

- سه مخزن **تأییدشده و دانلودشده**: `nellavio`, `Kiranism/next-shadcn-dashboard-starter`,
  `ColorlibHQ/velora-ui` — همه با مجوز **MIT**.
- یک مخزن (`masondevx/orbynadmin`) تنها نامزد موجود با آن نام بود: MIT، تک‌مالک، ۱۹ ستاره،
  دارای دموی عمومی. با اطمینان «تأییدشده با بلوغ پایین» ثبت شد.
- **Basalt UI دانلود نشد**: دو پروژه متفاوت با همین نام و دو دامنه رقیب وجود دارد
  (`nocoo/basalt` با MIT و `jkrumm/basalt-ui` با Apache-2.0). هویت رسمی قابل اثبات نیست.
- **هیچ‌کدام RTL ندارند** و **هیچ‌کدام i18n کامل فارسی/عربی ندارند**؛ تنها `nellavio` چندزبانه است (en/pl).
- نصب و اجرا: چهار پروژه نصب شدند؛ **dev server هر سه پروژه مستقل از سرویس خارجی با موفقیت صفحات را
  سرو کرد**؛ `kiranism` بدون کلید Clerk قابل اجرا نیست (وابستگی سخت به SaaS).
- **Build تولیدی فقط برای `velora-ui` موفق بود.** سه پروژه دیگر در مرحله prerender با خطای داخلی
  Next.js (`Invariant: Expected workStore to be initialized`) شکست خوردند — تحلیل علت در §5.
- هیچ کدی از این مخازن به `apps/`, `services/`, `packages/` منتقل نشد.

---

## 1. Provenance (reproducible evidence)

All archives are stored untouched in `upstream-archives/batch-16-frontend-foundations/`.

| Project | Repository | Ref | Commit | Archive | SHA256 | Downloaded (local) |
|---|---|---|---|---|---|---|
| nellavio | `nellavio/nellavio` | tag `2.0.1` | `522f2cfc78567c7b64f94e8c1f7da65ea4e02551` | `nellavio-522f2cf.zip` (2,814,505 B) | `0DEBE975061886E815B0B674D9FDD139295828B1851AF870AE01B62E3C474255` | 2026-11-18 07:12:17 +03:30 |
| kiranism-dashboard | `Kiranism/next-shadcn-dashboard-starter` | tag `v2.0.0` | `06e83c0b0e937f98184b343b92756ae0cadd7c92` | `kiranism-dashboard-06e83c0.zip` (3,246,912 B) | `496D7C78AD669BFFA917C687A1870AE8050ABE08501BA080B4D026B83AF0B710` | 2026-11-18 07:12:21 +03:30 |
| velora-ui | `ColorlibHQ/velora-ui` | tag `v0.11.0` | `27b75c8604ccfdcc47fb7f5dcb016b73bc11dca1` | `velora-ui-27b75c8.zip` (2,905,370 B) | `BA04E37A58B7CD6E9B2527F582FDFAEE71344CA7BE70A0FA5104B86689844DEE` | 2026-11-18 07:12:27 +03:30 |
| orbynadmin | `masondevx/orbynadmin` | branch `main` | `6c2796f7baf7330ca9f4e8260a92af59cb97070d` | `orbynadmin-6c2796f.zip` (4,145,424 B) | `BEDFB5CA8AEF9D64D99CCCB3392C060F4133AEF24E8BA6F51A23BE377EF8D483` | 2026-11-18 07:12:33 +03:30 |

Extraction targets: `upstream-registry/frontend-foundations/{nellavio,kiranism-dashboard,velora-ui,orbynadmin}`.
Total download volume: **13.1 MB** (four ZIPs). Registry source size (excluding `node_modules/.next`):
4.6 / 5.0 / 83.5 / 5.7 MB.

Verification notes:
- Commits were resolved with `git ls-remote` before download and archives were fetched from
  `codeload.github.com` at the **exact commit**, so an archive cannot drift from its recorded SHA.
- `kiranism-dashboard` was extracted with `git clone --depth 1 --branch v2.0.0` because its archive
  contains `.claude/skills/*` entries that `tar` on Windows cannot materialise; `HEAD` was verified
  equal to `06e83c0b0e937f98184b343b92756ae0cadd7c92`.
- The other three extracted cleanly from the ZIP.

## 2. Licence review

| Project | Licence | Copyright holder (LICENSE file) | Commercial use | Rebrand | Notice duty |
|---|---|---|---|---|---|
| nellavio | MIT | Copyright (c) 2023 Mateusz Wyrębek | permitted | permitted | retain licence + copyright |
| kiranism-dashboard | MIT | Copyright (c) 2023 Kiranism | permitted | permitted | retain licence + copyright |
| velora-ui | MIT | Copyright (c) 2026 Aigars Silkalns (Colorlib) | permitted | permitted | retain licence + copyright |
| orbynadmin | MIT | Copyright (c) 2026 OrbynAdmin | permitted | permitted | retain licence + copyright |

No `NOTICE` file exists in any of the four. MIT covers the **code**; it does not automatically cover
third-party assets bundled in `public/` (images, fonts, logos). Asset-level licensing was checked
only at the level of "is there a separate asset licence file" — none of the four ships one, which is
itself a compliance gap to close before adopting any asset.

### Velora Pro boundary (explicit)

- No `pro/` directory exists in the repository (the `pro:*` npm scripts reference a path that is not
  part of the public tree).
- `registry.json` contains **0** paid/pro-only entries.
- 101 components and the documented free blocks are present. Pro components, Pro templates and Pro
  assets are **not** in the archive and must not be assumed usable.
- Marketing pages reference Pro tiers; that is content, not shipped code.

## 3. Technology inventory (from lockfiles / package.json)

| Project | Framework / runtime | UI / styling | State / data | Auth | i18n | Build tool |
|---|---|---|---|---|---|---|
| nellavio | Next.js `16.1.6` (Turbopack), React `19.2.4`, TS `5.9.3` | Tailwind `4.2.1`, Radix primitives, shadcn-style components, `next-themes`, `tw-animate-css` | Apollo Client `4.1.6` (GraphQL), Zustand `5`, TanStack Table `8` | `better-auth` `1.5.5` (self-hosted server expected) | `next-intl` `4.8.3`, catalogs `en`, `pl` | `next build` |
| kiranism-dashboard | Next.js `16.2.6`, React `19.2.4`, TS `5.7.2` | Tailwind `4.2.2`, shadcn/ui on **Base UI** `1.6`, Tabler icons | TanStack Query `5`, `nuqs` URL state, TanStack Table/Form, Zod `4`, Zustand | **Clerk** `7.3.5` (SaaS, organizations + billing) | none | `next build`, oxlint/oxfmt |
| velora-ui | Next.js `16.3.7`, React `19.3.0`, TS 6/7 aliases | Tailwind `4.3.3`, Radix (`radix-ui` `1.6`), `motion` `13`, custom registry | none (static content + MDX) | none (login/signup are UI only) | none | `next build` |
| orbynadmin | Next.js `16.2.10`, React `19.2.4`, TS `5` | Tailwind `4`, shadcn/ui (`radix-ui` `1.6`), Tabler + Lucide | local mock modules, Recharts `3`, TanStack Table | **none** (auth screens are static) | none | `next build` |

## 4. Per-project assessment

### 4.1 nellavio — `2.0.1`

- **Shape:** 19 routes under `[locale]`, split into `(auth)` and `(protected)` route groups; 456
  TS/TSX files, ~76.8k LOC; Storybook present; Vitest configured.
- **Strengths:** real locale routing (`/en`, `/pl`) with `next-intl` and catalog files; role model
  `admin | editor | viewer` in `src/config/access.ts` (explicitly a demo, with instructions for wiring
  a real backend); clean `services/` + `queries/` split for a GraphQL backend; a *presentation mode*
  that reads `public/backendBackup.json` when no backend URL is configured — meaning the UI renders
  fully without a backend.
- **Backend dependency:** expects `GRAPHQL_URL` + `NEXT_PUBLIC_AUTH_URL` (`http://localhost:4000`),
  i.e. an external GraphQL + better-auth server that is **not** included. Data rendered in this
  evaluation came from the bundled backup JSON, not from a live API.
- **Weaknesses:** no RTL; no Persian/Arabic; locale list is `en/pl`; auth/RBAC are demo-grade; the
  production build fails (see §5).
- **40% of the value, 10% of the risk:** best candidate for *console shell patterns* (locale routing,
  RBAC shape, service/query separation) — as a reference, not as a base to fork wholesale.

### 4.2 kiranism-dashboard — `v2.0.0`

- **Shape:** 32 routes, 11 `src/features/*` domains, 653 files, ~79.9k LOC; feature-based with a
  per-feature API layer; server prefetch + `HydrationBoundary` + `useSuspenseQuery`; URL-synced table
  state via `nuqs`; Zod-validated forms; dnd-kit Kanban; docs + cleanup script + Dockerfiles.
- **Strengths:** the most production-shaped data layer of the four; explicit feature isolation that
  maps well onto a modular-monolith boundary; documented cleanup tooling; strong table/form patterns.
- **Blocking dependency:** Clerk is mandatory. With no keys, the middleware throws
  (`@clerk/nextjs: Clerk keys are missing`) and **every route returns HTTP 500**; with a
  syntactically valid but non-existent instance it fails on `Missing secretKey`. It also wires Sentry.
  Running it therefore requires creating an external SaaS application — outside this mission's scope.
- **Assessment:** highest engineering quality, lowest independence. Only usable if the owner accepts
  a SaaS identity provider or the Clerk layer is replaced (a non-trivial rewrite of proxy + layouts).

### 4.3 velora-ui — `v0.11.0`

- **Shape:** 22 route patterns, 101 registry components, 31 free blocks, MDX docs pipeline
  (`scripts/build-docs.mjs`), shadcn registry (`registry.json`), Cloudflare Pages functions
  (`functions/api/waitlist.js`, `_middleware.js`) as the only server code.
- **Strengths:** the only project that **builds and prerenders successfully** here (121+ static
  paths); shadcn-compatible registry means components are copy-in portable, not framework-locked;
  `motion` animations, theme toggle works, no backend requirement for any public page.
- **Weaknesses:** it is a *marketing/component* product, not an application shell — no dashboard, no
  tables-as-app, no auth, no i18n, no RTL. One showcase image is hotlinked from Unsplash and failed to
  load under a restricted network (a real external dependency for visuals).
- **Assessment:** best fit for `apps/portal` public pages and animation/background vocabulary;
  not a foundation for `console`.

### 4.4 orbynadmin — `main`

- **Shape:** 79 pages, 10 dashboards (overview, analytics, e-commerce, CRM, crypto, healthcare,
  logistics, HR, real estate, reports), project workspace with Kanban/list/Gantt, chat/mail/notes
  apps, 6 auth screens, error pages; 181 files, ~75.9k LOC; all data is local mock modules.
- **Strengths:** the broadest page inventory; a working theme customizer (accent/radius/font/sidebar)
  that writes CSS variables — directly relevant to token strategy; no auth dependency; no external
  service; builds confidence for UI vocabulary only.
- **Weaknesses:** young project (created 2026-07, 19 stars, single maintainer, no releases); no
  authentication or authorization at all (screens are static); production build fails (§5); MIT
  holder is the project name itself, unusual for corporate due diligence.
- **Assessment:** useful *pattern and screen inventory* for `console`, with the lowest provenance
  confidence of the four.

## 5. Build and run results (measured)

Environment: Windows, Node `26.13.0`, npm `11.20.0`, pnpm `12.18.0`. Each project installed in its
own directory; no dependency was added to the Nojin tree. Logs: `upstream-registry/frontend-foundations/_logs/`.

| Project | Install | Typecheck | Production build | Dev server | Pages served |
|---|---|---|---|---|---|
| nellavio | `npm ci` OK, 890 pkgs, 237.7 s | **PASS** (21.1 s) | **FAIL** — prerender `/pl/customers` | OK (Turbopack, ready <1 s) | `/en`, `/pl`, `/en/login`, `/en/customers`, `/en/user-management`, `/en/analytics` → **200** |
| kiranism-dashboard | `npm install` OK, 393 pkgs, 480.2 s (no npm lockfile; repo ships `bun.lock`) | TS compiled during build | **FAIL** — prerender `/dashboard/kanban` | starts, but **all routes 500** | none (Clerk keys missing) |
| velora-ui | `pnpm install --frozen-lockfile` OK, 356.1 s | TS compiled during build | **PASS** (78.9 s, 121+ prerendered paths) | OK | `/`, `/components`, `/components/aurora-background`, `/blocks`, `/pricing`, `/login`, `/templates/saas` → **200** |
| orbynadmin | `npm ci` OK, 703 pkgs, 231.7 s | **PASS** (20.1 s) | **FAIL** — prerender `/orders/[id]`, `/customers/[id]`, `/products/[id]`, `/support/[id]`, `/invoices/[id]` | OK | `/`, `/dashboard`, `/dashboard/analytics`, `/orders`, `/customers/CUS-1087`, `/login`, `/settings`, `/dashboard/settings` → **200** |

### 5.1 The shared build failure (diagnosis, not guesswork)

Three independent codebases fail with the same internal error at static generation:

```
Error [InvariantError]: Invariant: Expected workStore to be initialized / Expected workUnitAsyncStorage to have a store.
This is a bug in Next.js.
```

Evidence for the cause:
- Failures occur only in **Next.js 16.1.6 / 16.2.6 / 16.2.10**, on dynamic-route pages during
  "Generating static pages".
- The same machine, Node and package manager **build Next.js 16.3.7 successfully** (velora-ui,
  including `generateStaticParams` for 100+ paths).
- In every failing case the **dev server serves the same routes with HTTP 200** and no page errors.

Conclusion: this is an upstream Next.js defect in the 16.1–16.2 line during prerendering, not a
runtime defect in the starter's UI. It is recorded as a blocker for pristine production builds of
those three projects, and as a **dependency-pinning constraint** (build a Next 16.3+ host, or apply
the upstream fix) rather than "the template is broken". This remains a hypothesis about the upstream
fix lineage and was not verified by upgrading any extracted project (upgrades are out of scope).

### 5.2 Interaction evidence (Playwright + installed Chrome, headless)

Raw data: `experiments/frontend-foundations-run/interaction-results.json`; screenshots:
`experiments/frontend-foundations-run/screenshots/`.

| Project | Pages tested | HTTP | Console errors | Page errors | Broken images | Theme toggle | `html lang` | `dir` |
|---|---|---|---|---|---|---|---|---|
| nellavio | 5 | 200 | 0 | 0 | 0 | works (`dark` ↔ light on auth page) | `en`, `pl` | **absent → computed `ltr`** |
| orbynadmin | 5 | 200 | 0 | 0 | 0 | works on 4/5 pages (no toggle on auth) | `en` | **absent → computed `ltr`** |
| velora-ui | 5 | 200 | 2 (one Unsplash image timeout) | 0 | 1 (external Unsplash photo) | works on 4/5 pages | `en` | **absent → computed `ltr`** |
| kiranism-dashboard | 0 | 500 | n/a | n/a | n/a | n/a | n/a | n/a |

Mobile capture at 390×844 succeeded for nellavio, orbynadmin and velora-ui (no horizontal overflow
observed in the captured frames).

## 6. Adoptable capabilities (as patterns, not transferred code)

| Capability | Best source | Why |
|---|---|---|
| Locale-prefixed routing + message catalogs | nellavio | proven `next-intl` structure, `(auth)`/`(protected)` grouping |
| RBAC shape (`admin/editor/viewer` + permission map) | nellavio | already separated from auth lib for client safety |
| Backend-optional presentation mode | nellavio | UI renders from a data snapshot when no API exists |
| Feature-sliced module with per-feature API layer | kiranism | maps 1:1 to service boundaries; SSR-prefetch pattern |
| URL-synced table state (`nuqs`), Zod forms | kiranism | real, not mock, table behaviour |
| Theme customizer over CSS variables | orbynadmin | directly informs token architecture |
| Page/screen inventory (10 dashboards, apps, error states) | orbynadmin | breadth for `console` scaffolding |
| Registry-based portable components (`shadcn` registry) | velora-ui | copy-in components, no framework lock |
| Animation/background vocabulary with `motion` | velora-ui | portal hero/landing language |
| Marketing page composition (pricing, templates, showcase) | velora-ui | `apps/portal` patterns |

## 7. Limitations and risks (explicit)

1. **RTL is absent everywhere.** None of the four sets `dir` or ships RTL styles; `html[dir]` is not
   even declared. Adopting any of them means building bidi support, not enabling it.
2. **i18n is absent except nellavio**, and even there the catalogs are `en/pl` with no Arabic and no
   RTL-aware layout. Persian typography is untested in all four.
3. **kiranism cannot be evaluated at runtime** without creating an external Clerk application.
   Its UI claims are unverified here; only build-time compilation and source reading were possible.
4. **Production builds fail for three of four** (Next 16.1–16.2 prerender invariant). Dev-mode
   behaviour is verified; production readiness is not.
5. **Mock vs real:** nellavio renders from `backendBackup.json`; orbynadmin from local mock modules;
   velora from static content; kiranism is the only one wired to real mutations, but through Clerk +
   its own demo backend — which was not exercised.
6. **Asset licensing** inside `public/` is unverified for every project; MIT does not cover bundled
   photos/logos. A per-asset review is required before any asset is reused.
7. **No project was rebranded, merged, or copied.** Nothing from these trees exists under `apps/`.
8. `kiranism` install resolved versions with npm against `bun.lock` pinned ranges (no npm lockfile),
   so its installed tree may differ from the author's Bun resolution; this is recorded as drift risk.
9. A concurrent file `FRONTEND-UPSTREAM-CODE-ANALYSIS.md` appeared in the repository root during this
   mission (analysing the 54 earlier repositories). It was not produced by this mission and was left
   untouched.

## 8. Recommendation (input to the owner, not a decision)

- **Portal / public pages:** velora-ui patterns are the strongest, lowest-risk fit.
- **Console shell:** take nellavio's locale routing + RBAC shape and kiranism's feature/API split as
  *patterns*; do not fork kiranism unless Clerk is acceptable or replaceable.
- **Token strategy:** orbynadmin's CSS-variable customizer is the most direct evidence that the
  design system should be token-first and runtime-swappable.
- **Do not** adopt any of the four as a single base. Each is a source of patterns; the Nojin
  design system (`packages/design-system`) must own identity, RTL and i18n.
