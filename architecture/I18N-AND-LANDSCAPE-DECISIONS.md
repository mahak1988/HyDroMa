# I18N-AND-LANDSCAPE-DECISIONS
## تصمیمات باز معماری چندزبانگی و مدیریت منظر

**Date:** 2026-11-18
**Status:** proposals only. **No decision here is approved.**
**Relationship:** these are domain-specific decisions that extend `ARCHITECTURE-DECISIONS-OPEN.md`
(root) and `architecture/ECO-NOJIN-ARCHITECTURE-OPEN-DECISIONS.md`. Global decisions
(D-FE-01 framework, D-04 identity, D-ARC-01 style, D-17 scientific models) remain in force and are
referenced, not re-opened.

Groups: **A** low-risk default (agent may apply, owner may veto) · **B** needs a spike/evidence ·
**C** owner approval required · **D** intentionally deferred.

---

## 1. Summary

| ID | Decision | Group | Authority | Recommendation | Depends on |
|---|---|---|---|---|---|
| I18N-01 | i18n runtime: i18next vs framework-native vs ICU-only | **B** | joint | ICU MessageFormat as the format; runtime chosen only after D-FE-01 (catalogs stay framework-agnostic) | D-FE-01 |
| I18N-02 | Primary MT provider per language | **C** | owner | Azure primary (15/15 verified), LibreTranslate as sovereign fallback; DeepL only where coverage is proven | I18N-03, I18N-04 |
| I18N-03 | May third-party MT process public community content? | **C** | owner | Yes for public non-personal content, with disclosure; no for household/legal/financial | — |
| I18N-04 | Build vs adopt LibreTranslate | **B** | joint | Adopt unmodified as fallback after legal review of AGPL-3.0 obligations | I18N-03 |
| I18N-05 | Retention of source text, cache and TM | **C** | owner | TM kept; cache TTL 180 days; no personal text; purge on tenant request | I18N-03 |
| I18N-06 | Chart axis direction in RTL | **A** | agent | numeric/time axes stay LTR; labels localize | — |
| I18N-07 | Locale URL strategy | **B** | joint | prefix all locales (`/fa`, `/de`), `x-default` → `/en` | D-FE-01 |
| I18N-08 | Who approves scientific terminology translations | **C** | owner | per-domain named expert; agent may not approve | — |
| LND-01 | One `services/landscape` module vs several services | **A** | agent | one module with internal submodules | D-ARC-01 |
| LND-02 | Shared projects: new `services/projects` vs workflow submodule | **C** | owner | new shared module `services/projects` | D-PROD-01 |
| LND-03 | Landscape registry scope: global vs per-country | **C** | owner | one global registry with country-governed visibility | I18N-03 |
| LND-04 | Recording customary rights vs adjudicating them | **C** | owner | **record only**, never adjudicate; explicit disclaimer | LND-03 |
| LND-05 | Geospatial data residency and hosting region | **C** | owner | per-tenant region; artefacts in object storage of that region | D-DB-02 |
| LND-06 | Household/person data policy and retention | **C** | owner | aggregate by default; PII on explicit grant; 24-month retention review | LND-04 |
| LND-07 | What the public observatory may expose | **B** | joint | landscape-level aggregates only; no village-level household/finance data | LND-06 |
| LND-08 | Phase-1 scope freeze | **C** | owner | P1 as defined in the landscape architecture | D-PROD-01 |

Counts: **A = 2**, **B = 4**, **C = 10**, **D = 0**. Total 16.

## 2. Detail

### I18N-01 — i18n runtime choice · B

- **Options:** (a) `next-intl` (Next-native, ICU, proven in evaluated Nellavio); (b) `i18next` +
  `react-i18next` (framework-agnostic, larger ecosystem, heavier); (c) ICU core + thin custom loader
  (maximum portability, highest maintenance).
- **Dependencies:** D-FE-01 (Next vs Angular) decides which is natural. Catalogs and the registry are
  framework-agnostic regardless, so this choice must not leak into content structure.
- **Risk:** choosing (b) on a Next codebase adds ~20–40 KB and a second config system; choosing (a)
  then moving to Angular means rewriting the loader only (catalogs unchanged).
- **Recommendation:** ICU MessageFormat is mandatory (already in master v2 §5.2). Pick the runtime only
  after D-FE-01; keep `packages/i18n` API surface (`t`, `formatNumber`, `formatDate`, `dir`) identical
  across runtimes.

### I18N-02 — MT provider routing · C

- **Evidence:** Azure covers all 15 languages (official language table, updated 2026-08-23; free tier
  2M chars/month verified). LibreTranslate public list contains all 15 (verified). DeepL UI locales
  omit `fa, ur, bn, hi, sw`; API coverage unverified without a key. Google pricing page returned 403
  to this environment → cost unverified.
- **Options:** (a) Azure primary + LibreTranslate fallback; (b) Google primary; (c) DeepL primary for
  European languages + Azure for the rest; (d) self-hosted only.
- **Risk:** single-vendor dependency; quota/free-tier changes; residency requirements for community
  data; AGPL obligations if LibreTranslate is modified.
- **Recommendation:** (a) with per-language overrides; DeepL only as an optional *quality* upgrade for
  `de/fr/es/pt-BR` where coverage is proven. Re-verify pricing at contract time — **do not budget from
  assumption**.

### I18N-03 — third-party MT for public community content · C

- **Options:** allow for all public non-personal content (a); allow only for non-community content (b);
  never send community content externally (c).
- **Risk:** reputational and sovereignty risk; community text may contain implicit personal data.
- **Recommendation:** (a) with a visible "machine translated" label and an opt-out per community;
  household, legal and financial text is always excluded (policy-enforced, not prompt-enforced).

### I18N-04 — LibreTranslate build vs adopt · B

- **Constraint:** LibreTranslate is **AGPL-3.0**. Self-hosting unmodified is normally acceptable, but
  any modification offered over the network triggers source-disclosure obligations.
- **Recommendation:** adopt unmodified, isolate in its own container/process boundary, and require a
  legal review record before go-live. If modifications are ever needed, revisit this decision.

### I18N-05 — retention · C

- **Options:** keep everything forever (a); TM yes + cache 180 days + no personal text (b); discard all
  after N days (c).
- **Recommendation:** (b). TM is the asset; cache is disposable; personal text is never stored.

### I18N-06 — chart axes in RTL · A

- **Decision (proposed default):** keep numeric/time axes LTR, localize labels/tooltips. Rationale:
  reversed time axes are routinely misread; scientific convention favours LTR axes.
- Reversible by a per-chart flag; no structural impact.

### I18N-07 — URL strategy · B

- **Options:** prefix every locale (`/fa/…`, `/en/…`) (a); unprefixed default + prefixes (b);
  subdomain per locale (c).
- **Recommendation:** (a) for unambiguous caching/SEO and simpler `hreflang`; `x-default` points to
  `/en`. Requires D-FE-01 (routing model) and a redirect map for the existing `app/` prototype URLs.

### I18N-08 — scientific terminology approval · C

- **Rule:** glossary equivalents for hydrology/soil/climate/MRV terms require a named domain expert per
  language family. Agents and generic translators may propose, never approve.
- **Risk:** a wrong technical term silently corrupts scientific communication.

### LND-01 — one module vs many services · A

- **Recommendation:** one `services/landscape` module. Villages, nomads, rangelands and watersheds share
  geometry, tenancy, governance and documents; splitting now would duplicate all four.
- **Reversible:** extraction boundaries are already defined by submodules.

### LND-02 — projects capability · C

- **Options:** (a) new shared `services/projects`; (b) submodule of `services/workflow`; (c) private
  tables inside landscape.
- **Recommendation:** (a). Projects exist beyond landscape (restoration, tourism, marketplace
  initiatives) and must not be re-implemented. (c) is rejected outright — it duplicates a shared need.
- **Note:** budgets remain in `finance`; tasks/approvals in `workflow`; projects hold references.
- **Catalog impact:** `PRJ-REG`, `PRJ-PLAN`, `PRJ-MILE`, `PRJ-IMP` are **proposed additions** to the
  188-module catalog (no `PRJ-*` prefix exists today). `TER-OBS` is likewise proposed. Until merged by
  the catalog owner they are references in these documents, not registered modules.

### LND-03 — registry scope · C

- **Options:** single global registry (a); per-country registries federated (b); per-tenant registries (c).
- **Recommendation:** (a) with country-governed visibility (a landscape may be invisible outside its
  country until published). (c) would prevent cross-border landscapes that legitimately span borders.
- **Risk:** legal/political sensitivity of boundary data → visibility rules, not data duplication.

### LND-04 — customary rights · C

- **Recommendation:** the platform **records** claims, agreements and sources; it **never adjudicates**
  ownership or legal right. UI must display: "ثبت محدوده به‌معنای اثبات حق قانونی نیست."
- **Risk:** any appearance of adjudication creates legal exposure and social conflict.

### LND-05 — geospatial residency · C

- **Options:** single global store (a); per-tenant region (b); per-country (c).
- **Recommendation:** (b) if any tenant requires residency; otherwise (a) with an explicit owner
  acceptance. Interacts with D-DB-02 (object storage for rasters).

### LND-06 — household data · C

- **Recommendation:** aggregate by default; person-level access requires `village.households.pii`
  permission + a recorded data purpose + audit; retention reviewed every 24 months; no free-text fields
  that invite sensitive data.
- **Risk:** the single largest privacy exposure in the domain.

### LND-07 — public observatory · B

- **Recommendation:** landscape-level aggregates and published projects only. No village-level
  household counts, no financial data, no unreviewed scientific values.
- **Gate:** every published number must carry provenance and a quality flag (or be omitted).

### LND-08 — phase-1 scope · C

- **Recommendation:** freeze P1 = registry + boundaries + village profile + working group + project
  links + read-only indicators. Nomadic mobility (P2) is the differentiator but requires P1 geometry
  and governance to exist first.

## 3. Decisions this mission must not make

| Temptation | Why not |
|---|---|
| Approve Azure as the provider | commercial commitment, DPA, quota (I18N-02 is owner) |
| Add `fa, ar, ur` to the product's initial release | roadmap/GTM decision (D-PROD-01/02) |
| Declare carrying capacity "validated" | requires scientific validation record (D-17) |
| Expose village storefronts publicly | marketplace/commerce decision (D-APP-01) |
| Enable agent write access to landscape data | D-AI-01 |
| Choose PostGIS schema details | D-DB-01/D-DB-02 |

## 4. Agent-permitted work now (no approval needed)

- Keep catalogs, registry and glossary as **data files** with schemas and validators.
- Write contract specifications (request/result schemas) and test plans.
- Build the RTL/i18n *lint rules list* and snapshot matrix definition.
- Prepare the entity relationship model and tenancy test matrix.
- Draft provider evaluation updates when pricing pages change (evidence only).

Everything that creates a service, table, API, account, key or commit remains blocked.
