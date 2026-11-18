# TRANSLATION-GATEWAY-ARCHITECTURE
## معماری درگاه ترجمه پویا

**Date:** 2026-11-18
**Status:** ARCHITECTURE PROPOSAL — no provider account, no API key, no call made, no service deployed.
**Scope:** dynamic content translation only. Static UI catalogs are specified in
`INTERNATIONALIZATION-ARCHITECTURE.md` and never depend on this gateway.

---

## 0. خلاصه تصمیم

| Question | Answer |
|---|---|
| Is a separate service justified? | **Yes as a module**, not as a deployable service: it owns providers, cache, memory, glossary, review states and cost metering — none of which belong in an app or in `packages/i18n` |
| Can apps call providers directly? | **No.** `api-gateway` → `translation` only. Keys never leave the backend |
| What if all providers are unavailable? | Return the source text + `UNAVAILABLE` state; UI stays functional; queue the request |
| Is MT output ever "approved" automatically? | **No.** `MACHINE_TRANSLATED` is terminal until a human acts |
| Which provider first? | Depends on a paid/verified decision (I18N-02); default routing is configurable, not hardcoded |

---

## 1. Position in the architecture

```
apps (portal, console, marketplace, tourism, scientific-workspace)
   │  only via contracts/api
services/api-gateway
   │
services/translation  (modular monolith module, extraction-ready)
   ├── domain/          TranslationRequest, Translation, MemoryEntry, GlossaryTerm, ReviewTask
   ├── application/     TranslateContent, ReviewTranslation, SyncGlossary, MeterUsage
   ├── providers/       azure | google | deepl | libretranslate  (adapters)
   ├── cache/           content-addressed store
   ├── memory/          approved-pair store
   ├── glossary/        domain terminology enforcement
   ├── quality/         state machine + validators
   ├── policies/        routing, budget, PII, kill-switch
   └── api/             internal HTTP contract (contracts/api/translation.yaml)
```

Boundaries:
- Owns translation artefacts + usage records. **Does not** own the content itself (content stays with
  `services/content`, `services/marketplace`, `services/tourism`, `services/landscape`).
- Never translates legal/financial documents without an explicit policy decision (see §7).
- Never writes back to source content; it returns a localized variant that the owning service stores.

## 2. Provider adapter contract

```ts
interface TranslationProvider {
  id: 'azure' | 'google' | 'deepl' | 'libretranslate';
  capabilities(): Promise<{
    languages: string[];            // BCP-47
    features: { glossary: boolean; formality: boolean; html: boolean; detect: boolean };
    maxBatchChars: number; maxRequestsPerMinute: number;
  }>;
  translate(req: {
    texts: string[]; source: string; target: string;
    contentType: 'plain' | 'html' | 'markdown';
    glossaryId?: string; formality?: 'default' | 'formal' | 'informal';
    requestId: string;               // idempotency
  }): Promise<{
    translations: string[];
    detectedSource?: string;
    provider: string; model: string; modelVersion?: string;
    billableChars: number; latencyMs: number; raw?: unknown;
  }>;
  health(): Promise<'ok' | 'degraded' | 'down'>;
}
```

Rules: no provider-specific type may appear outside `providers/<id>/`. Switching a provider is a
configuration change; the consumer contract does not change.

## 3. Provider evaluation (evidence-based, 2026-11-18)

| Criterion | Azure AI Translator | Google Cloud Translation | DeepL API | LibreTranslate |
|---|---|---|---|---|
| All 15 languages | **Yes — verified** (official language-support table, doc updated 2026-08-23; `fa`, `ur`, `bn`, `hi`, `sw`, `id`, `zh-Hans` all ✔) | Yes per product docs; language page not fetched in this mission | **Partial — unverified**: UI locales include `ar, de, es, fr, id, pt-BR, ru, tr, zh`; `fa, ur, bn, hi, sw` not evidenced; confirm via `GET /v3/languages` | **Yes — verified** (`/languages` returned 51 codes including all 15) |
| Free tier | **F0: 2M chars/month** of standard translation (verified on pricing page) | Not verified — pricing page returned **HTTP 403** to this environment | Free plan exists (`api-free.deepl.com`); page shows a *translator* free tier of 50,000 chars/month — API quota must be confirmed at signup | Free when self-hosted (compute cost only); public instance rate-limited |
| Paid rate | Page renders rates client-side (`$-`); read from the Azure pricing calculator before budgeting | **UNVERIFIED** | Individual **€7.49/mo billed annually, 300,000 chars/month** (verified page); Team €24.99/user/mo, 1M chars | Compute + ops (self-hosted); no per-character fee |
| Rate limits | Per-key; S1 tiers | Per-project quotas | Per-plan | Public instance ~limited; self-hosted = own limits |
| Max text size | Batch API limits per request (verify per endpoint) | Per-request limit | 128 KiB per request (verify) | Configurable |
| Data retention | Microsoft states customer data is not stored for Translator; **confirm in the DPA before go-live** | Not verified | "No data training"; Pro text deleted after processing (verified FAQ) | Self-hosted → no third-party transfer |
| Commercial terms | Azure MCA/DPA | Google Cloud terms | DeepL Pro terms | **AGPL-3.0** — copyleft obligations if modified and offered over network; legal review required |
| Geography / availability | Regional Azure availability; sovereign regions | Global | Global | Fully on-prem possible |
| Production suitability | High | High | High quality for European languages; coverage gap for 5 target languages | Medium (quality varies; best as **sovereign fallback**) |

**Cost is not a constant.** Free tiers change; prices are per million characters and differ by plan.
The architecture therefore treats provider selection as **configuration + metering**, not as code.

### Cost scenarios (formula, not a quote)

`monthly cost ≈ max(0, billableChars − freeQuota) × rate`

| Scenario | Chars/month | Azure F0 | Paid at an assumed $10 / 1M chars* |
|---|---|---|---|
| 2,000 village descriptions × 600 chars × 14 targets | 16.8 M | 2 M free | ≈ $148 |
| + 20,000 product descriptions × 300 chars × 14 | +84 M | 2 M free | ≈ $960 |
| Only on-demand (user clicks "translate") | 1–3 M | fully covered | $0 |

\* The $10 figure is an **assumption for planning**, not a verified quote; it must be replaced by the
calculator output when I18N-02 closes. DeepL's 300k chars/month would be exhausted by a single batch
scenario, so DeepL is a *quality* option, not a *volume* option.

## 4. Routing and policy

```
request → policy engine
   ├─ is content type allowed for MT? (no/finance, legal, PII → BLOCKED_BY_POLICY)
   ├─ does an APPROVED memory entry exist? → return (0 cost)
   ├─ does a fresh cache entry exist? → return (0 cost)
   ├─ pick provider by (contentType, targetLocale, tenantPolicy) + health + remaining budget
   └─ call with timeout → validate → store → return with quality state
```

- **Fallback chain per locale** is config: e.g. `de → deepl → azure → libretranslate`, `fa → azure →
  libretranslate`, `bn → azure → libretranslate` (DeepL excluded where coverage is unproven).
- **Circuit breaker**: 5 consecutive failures → provider marked `down` for 5 min; health re-probe.
- **Quota guard**: per-tenant and global monthly character budget; hard stop with a clear error, never
  a silent downgrade in quality without a state change.
- **Kill switch**: any provider can be disabled at runtime by configuration.

## 5. Cache and translation memory

### 5.1 Cache key (must include all of these)

```
hash(
  sourceLang, targetLang, sha256(normalizedSourceText), contentType,
  providerId, model, modelVersion, glossaryVersion, translationPipelineVersion
)
```

Normalization: NFC, collapsed whitespace, preserved markup placeholders. Any change to source text
produces a different hash → **no stale reuse**. Cache entries with `OUTDATED` source hash are purged
on read, not served.

### 5.2 Storage

| Artefact | Store | Reason |
|---|---|---|
| Cache entries | PostgreSQL (hash PK) + object storage for long texts | durable, queryable, no external dependency |
| Translation memory (approved) | PostgreSQL with locale pair index + trigram similarity | reuse + terminology consistency |
| Usage ledger | PostgreSQL (append-only), aggregated by tenant/day | cost metering and audits |
| Provider raw payloads | **not stored** (debug only, redacted, 72 h TTL in non-prod) | privacy |

### 5.3 Memory matching

1. Exact hash hit → reuse (state `APPROVED`).
2. High similarity (≥ 0.95, same domain + glossary version) → propose reuse, state
   `HUMAN_REVIEW_REQUIRED`, never auto-approve.
3. No match → provider call.

## 6. Glossary (separate from generic translation)

`glossary/terms.json` (versioned) with the schema required by the mission:

| Field | Example (water domain) |
|---|---|
| `term_id` | `HYD-EVAPOTRANSPIRATION` |
| `domain` | `hydrology` |
| `canonical` | `evapotranspiration` |
| `definition` | "Combined evaporation from soil and transpiration by vegetation, expressed in mm per period." |
| `unit` | `mm` |
| `equivalents` | `fa: تبخیر-تعرق`, `ar: التبخر-نتح`, `de: Evapotranspiration`, … |
| `sources` | FAO-56, WMO glossary |
| `status` | `approved` |
| `version` | `1.3.0` |

Enforcement:
- **Pre-translation**: glossary terms are replaced by placeholders (`⟦TERM:HYD-EVAPOTRANSPIRATION⟧`)
  so MT cannot paraphrase them, then restored from the approved equivalent.
- **Post-translation**: validator flags any target text where a glossary term appears translated
  differently than approved.
- Glossaries are **per domain**, versioned, and the version is part of the cache key.
- Domains required: hydrology, soil, climate, agriculture, rangeland, landscape restoration, remote
  sensing, carbon accounting, MRV, finance, accounting, marketplace, tourism, nomadic communities,
  governance.

## 7. Security, privacy, cost control

| Control | Rule |
|---|---|
| Key storage | backend secret store only; never in client bundles, logs or CI output |
| PII preflight | classifier + field rules; `personal_data`, `household`, `contract`, `financial`, `legal` are **never** sent to MT without an explicit per-tenant policy |
| Redaction | identifiers, phone/email, coordinates of households removed or masked before send; restored after |
| Tenant isolation | every request carries org + tenant scope; cache and memory are tenant-scoped unless explicitly global |
| Rate limiting | per tenant, per provider, per endpoint; queued jobs surface 429 semantics to callers |
| Budget | monthly character budget per tenant; alert at 80 %, hard stop at 100 % |
| Provider disable | runtime kill switch, no deploy required |
| Audit | every translate call logged: actor, tenant, source hash, target locale, provider, chars, state — never the full text unless the content policy allows |
| Offline resilience | UI catalogs are local; dynamic content falls back to source text with a visible badge and a retry action |
| Legal docs | invoices, contracts, terms of service: human translation only; MT is prohibited by policy, not just discouraged |

## 8. Quality states

```
MACHINE_TRANSLATED ──review──▶ HUMAN_REVIEWED ──approve──▶ APPROVED
        │                            │
        ├──▶ HUMAN_REVIEW_REQUIRED   └──▶ REJECTED
        └──▶ OUTDATED (source or glossary changed)
```

Rules: automatic transitions only to `MACHINE_TRANSLATED`, `OUTDATED`, `HUMAN_REVIEW_REQUIRED`.
`APPROVED` requires an authenticated human with the `translation.reviewer` permission in the tenant.

## 9. Failure modes

| Failure | Behaviour |
|---|---|
| Provider timeout | retry once with jitter, then next provider; state `PARTIAL` with reason |
| Quota exhausted | no silent fallback to a lower-quality provider unless policy allows; explicit `QUOTA_EXCEEDED` |
| Invalid target locale | 422 with the registry's supported list |
| Glossary version conflict | request rejected; caller must refresh glossary reference |
| Cache corruption | delete entry, re-translate, log integrity event |
| Provider returns HTML | rejected unless `contentType: html` requested |

## 10. Testability

| Test | Method |
|---|---|
| Adapter contract conformance | one shared test suite run against each adapter with recorded fixtures |
| Cache key completeness | property test: change each key component → cache miss |
| Glossary enforcement | fixture text with 20 domain terms → 0 mistranslated terms in output |
| Policy enforcement | attempt to translate an invoice → `BLOCKED_BY_POLICY` |
| Budget enforcement | simulated usage → hard stop at 100 % |
| Provider outage | all adapters down → source text + `UNAVAILABLE`, UI renders |
| No external call in static UI | network-blocked e2e on all 15 locales |
| Audit completeness | every call produces exactly one usage record |

## 11. Open decisions (see `I18N-AND-LANDSCAPE-DECISIONS.md`)

- **I18N-02** which provider is primary per language (volume vs quality).
- **I18N-03** whether any third-party MT is allowed for public community content at all (sovereignty).
- **I18N-04** build vs adopt LibreTranslate (AGPL obligations, ops cost).
- **I18N-05** retention policy for source/target pairs (legal review).

## 12. Acceptance criteria

1. Apps cannot reach any provider without the gateway (verified by network policy in tests).
2. Every translation returned carries provider, model, glossary version, state, and a cache key.
3. A source-text change invalidates the cached translation (proven by test).
4. `APPROVED` is unreachable without a human action (state-machine test).
5. With all providers disabled, all 15 locales still render static UI, and dynamic content shows the
   source with an explicit badge.
6. Per-tenant usage is metered and exposed; budget stop works.
7. No secret is present in any client artifact (secret scan).
