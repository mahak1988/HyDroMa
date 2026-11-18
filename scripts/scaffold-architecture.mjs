// Generates the Eco Nojin root architecture skeleton (directories + boundary READMEs).
// Idempotent: never overwrites an existing file. Run with: node scripts/scaffold-architecture.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const created = [];
const skipped = [];

const dirs = [
  'apps/portal', 'apps/console', 'apps/marketplace', 'apps/tourism', 'apps/scientific-workspace',
  'services/api-gateway', 'services/identity', 'services/organization', 'services/user-management',
  'services/marketplace', 'services/finance', 'services/inventory', 'services/tourism',
  'services/notification', 'services/content', 'services/workflow', 'services/ai-orchestration',
  'services/reporting',
  'engines/hydroma/water', 'engines/hydroma/hydrology', 'engines/hydroma/groundwater',
  'engines/hydroma/soil', 'engines/hydroma/erosion', 'engines/hydroma/climate',
  'engines/hydroma/meteorology', 'engines/hydroma/agriculture', 'engines/hydroma/vegetation',
  'engines/hydroma/remote-sensing', 'engines/hydroma/gis', 'engines/hydroma/simulation',
  'engines/hydroma/scenarios', 'engines/hydroma/mrv', 'engines/hydroma/model-registry',
  'engines/ai-workforce/analyst', 'engines/ai-workforce/administrator', 'engines/ai-workforce/manager',
  'engines/ai-workforce/employees', 'engines/ai-workforce/model-gateway', 'engines/ai-workforce/agent-registry',
  'packages/design-system', 'packages/ui', 'packages/icons', 'packages/i18n', 'packages/auth-client',
  'packages/api-client', 'packages/domain-types', 'packages/validation', 'packages/utilities',
  'packages/configuration',
  'contracts/api', 'contracts/events', 'contracts/schemas', 'contracts/scientific-models',
  'databases/relational', 'databases/geospatial', 'databases/time-series', 'databases/analytical',
  'databases/migrations', 'databases/seeds',
  'data/raw', 'data/processed', 'data/reference', 'data/geospatial', 'data/climate', 'data/hydrology',
  'data/soil', 'data/agriculture', 'data/remote-sensing', 'data/scientific-models', 'data/fixtures',
  'data/metadata',
  'infrastructure/environments', 'infrastructure/configuration', 'infrastructure/security',
  'infrastructure/monitoring', 'infrastructure/backup', 'infrastructure/deployment',
  'workflows/scientific', 'workflows/business', 'workflows/finance', 'workflows/marketplace',
  'workflows/tourism', 'workflows/ai',
  'integrations/satellite', 'integrations/weather', 'integrations/geospatial', 'integrations/payment',
  'integrations/messaging', 'integrations/external-data',
  'tests/unit', 'tests/integration', 'tests/contract', 'tests/e2e', 'tests/security',
  'tests/performance', 'tests/scientific-validation',
  'docs/architecture', 'docs/adr', 'docs/security', 'docs/data-governance',
  'docs/scientific-governance', 'docs/development',
  '.github',
];

function write(rel, content) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) { skipped.push(rel); return; }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/^\n/, ''), 'utf8');
  created.push(rel);
}

const HEAD = (title, status = 'SKELETON — boundaries defined, no implementation') => `# ${title}

**Status:** ${status}
**Authority:** root \`README.md\`, \`ECONOJJIN-ARCHITECTURE-BASELINE.md\`, \`ARCHITECTURE-DECISIONS-OPEN.md\`.
This file defines a boundary. It is not an approval to build.
`;

for (const d of dirs) fs.mkdirSync(path.join(ROOT, d), { recursive: true });

// ---------------------------------------------------------------- apps
write('apps/README.md', HEAD('apps/ — Deployable frontends') + `
Each directory is one deployable user-facing program. Apps compose \`packages/*\` and speak to
\`services/*\` only through \`contracts/api\`. No app owns domain state and no app imports
another app's source.

| App | Primary audience | Owns | Must not |
|---|---|---|---|
| \`portal\` | public visitors | marketing pages, SEO, public discovery | authenticated workflows, pricing logic |
| \`console\` | users, org admins, experts, staff | authenticated shell, org switching, settings | domain business rules |
| \`marketplace\` | buyers, sellers | commerce UX | payments, ledger |
| \`tourism\` | guests, hosts | booking UX | rates calculation, finance |
| \`scientific-workspace\` | HyDroMA scientists | scenario editor, run monitor, provenance viewer | scientific computation |

Open: whether \`marketplace\` and \`tourism\` ship as standalone apps or as console modules
(\`ARCHITECTURE-DECISIONS-OPEN.md\` → D-APP-01). Nothing here decides that.
`);

write('apps/portal/README.md', HEAD('apps/portal — public site') + `
Responsibility: the public face of Eco Nojin — ecosystem overview, HyDroMA introduction,
public marketplace/tourism entry points, content pages, SEO/metadata, waitlist forms.

Boundary:
- In: static/ISR content, public catalog reads, localization (fa/ar/en) and RTL.
- Out: authenticated flows (→ \`console\`), checkout (→ \`marketplace\`), booking (→ \`tourism\`),
  any scientific result rendering beyond published summaries (→ \`scientific-workspace\`).
- Data: consumes \`contracts/api\` public read models only. No direct DB access.

Status: skeleton. No prototype code from \`upstream-registry\` is copied here.
`);

write('apps/console/README.md', HEAD('apps/console — authenticated workspace') + `
Responsibility: the shared shell for every authenticated actor (individual user, organization
member, org admin, expert, internal staff): navigation, organization/tenant switching,
role-aware menus, settings, notifications, audit-visible activity.

Boundary:
- In: session/identity via \`services/identity\`, membership and role claims via
  \`services/organization\`, personal preferences via \`services/user-management\`.
- Out: marketplace/tourism transactional UX (separate apps for now), scientific run UI.
- Rule: the console renders capabilities; it never decides permissions locally. Permission
  decisions come from the service layer and are re-checked server-side.

Status: skeleton.
`);

write('apps/marketplace/README.md', HEAD('apps/marketplace — commerce experience') + `
Responsibility: catalog browsing, seller storefronts, cart, checkout UX, order tracking.

Boundary:
- In: \`services/marketplace\`, \`services/inventory\`, \`services/finance\` (invoice/payment status only).
- Out: payment capture implementation, ledger ownership, price/tax computation.
- Open: standalone app vs \`console\` module (D-APP-01). Until decided, this directory is a
  boundary record, not an approved deliverable.

Status: skeleton.
`);

write('apps/tourism/README.md', HEAD('apps/tourism — stays and booking') + `
Responsibility: property discovery, availability presentation, reservation flow, guest/host UX.

Boundary:
- In: \`services/tourism\` (availability, rates reference), \`services/finance\` (payment state),
  \`services/notification\` (confirmations).
- Out: calendar math and rate rules (service-owned), payment capture.
- Calendar/timezone note: local calendars (Jalali/Hijri/Gregorian) and time zones are
  presentation concerns here, but the canonical timestamps stay UTC in the service layer.
- Open: standalone app vs \`console\` module (D-APP-01).

Status: skeleton.
`);

write('apps/scientific-workspace/README.md', HEAD('apps/scientific-workspace — HyDroMA UI') + `
Responsibility: the scientist-facing environment — data selection, scenario definition,
simulation monitoring, result inspection, provenance and uncertainty display, MRV evidence views.

Boundary:
- In: \`engines/hydroma\` contracts (\`contracts/scientific-models\`), \`services/ai-orchestration\`
  for agent-assisted analysis.
- Out: any numeric model execution, unit conversion authority, or provenance mutation.
- Rule: the UI must display units, model version, data source and uncertainty returned by the
  engine; it must never synthesize or hide them.

Status: skeleton.
`);

// ------------------------------------------------------------ services
write('services/README.md', HEAD('services/ — business domains') + `
Start as a **modular monolith**: one deployable process, hard module boundaries, one schema
owner per module. Extraction into independent services is allowed later only for a module with
a proven scaling or isolation need (see \`ARCHITECTURE-DECISIONS-OPEN.md\` → D-ARC-01).

Cross-cutting rules for every service:
- Owns its data; no other service reads its tables. Cross-domain reads go through contracts.
- Emits domain events from \`contracts/events\`; consumers are idempotent.
- Every mutating command writes an audit record (actor, org, before/after, correlation id).
- Multi-tenant: every row is scoped by organization id; every query filters by it.
- Permissions are enforced server-side; the client's role claim is never trusted alone.

| Service | Responsibility | Owns | Explicitly not |
|---|---|---|---|
| \`api-gateway\` | single ingress, routing, token verification, rate limits, request validation | no domain data | business rules |
| \`identity\` | credentials, sessions, MFA, IdP federation (adapter, D-04) | identity records, sessions | org membership, roles |
| \`organization\` | legal entities, branches, memberships, org roles/scopes | org graph, membership, role assignments | user profile, credentials |
| \`user-management\` | profile, preferences (locale, timezone, calendar), consent, lifecycle | user profile | authentication, org roles |
| \`marketplace\` | listings, offers, marketplace orders | catalog/listing state | payments, ledger, stock counts |
| \`finance\` | invoices, payments, payouts, multi-currency, tax, ledger | financial documents, ledger entries | wallet/token features (not enabled) |
| \`inventory\` | stock, lots, units and conversions, reservations | stock ledger | pricing, invoicing |
| \`tourism\` | properties, availability calendars, bookings, rate rules, policies | booking state | payment capture |
| \`notification\` | templates, channel delivery, preferences, dedupe | delivery state | content authoring |
| \`content\` | pages, media metadata, localized content (adapter to Directus if adopted) | content records | site rendering |
| \`workflow\` | definitions, instances, approvals, human tasks (adapter to Temporal/Kestra, D-07) | workflow state | domain decisions |
| \`ai-orchestration\` | agent job queue, tool-permission enforcement, run logs, cost accounting hooks | run/trace records | financial execution |
| \`reporting\` | read models, exports, scheduled reports | derived read models | source-of-truth data |

Status: boundaries only. No service, database, migration or API is implemented in this phase.
`);

// -------------------------------------------------------------- engines
write('engines/README.md', HEAD('engines/ — scientific and agent engines') + `
Engines are independent of business services: no engine imports \`services/*\`, and no service
imports engine internals. Communication happens through \`contracts/*\`.

- \`hydroma\` — the scientific engine (water, hydrology, soil, climate, agriculture, MRV, scenarios).
- \`ai-workforce\` — the agent runtime and registry.

Status: skeleton.
`);

write('engines/hydroma/README.md', HEAD('engines/hydroma — scientific engine') + `
## Non-negotiable scientific contract

Every domain below must publish, before any implementation is accepted:

1. **Inputs** — variables, units, spatial/temporal resolution, required coverage.
2. **Outputs** — variables, units, aggregation level.
3. **Data sources** — provider, licence, version/date, retention.
4. **Model identity** — name, version, calibration dataset, code origin (upstream repo + commit).
5. **Provenance** — full run lineage (inputs → parameters → code version → outputs).
6. **Uncertainty** — method (ensemble, interval, RMSE…) and what is *not* quantified.
7. **Validation** — protocol, reference dataset, reported skill metrics, known failure modes.

Model files extracted into \`upstream-registry\` are **evidence, not executable code**. Nothing is
copied into this tree without a review record and an owner decision (D-17).

| Domain | Scope | Primary inputs | Required outputs |
|---|---|---|---|
| \`water\` | water balance, allocation, demand/supply accounting | precipitation, ET, withdrawals, storage | balance per basin/period, deficits |
| \`hydrology\` | rainfall–runoff, routing, flow regime | precipitation, DEM, land cover, gauges | discharge series, flow duration, extremes |
| \`groundwater\` | aquifer storage, recharge, drawdown | pumping, aquifer properties, recharge | head levels, recharge, safe yield |
| \`soil\` | soil water, properties, degradation indicators | texture, SOC, depth, land use | water content, property maps |
| \`erosion\` | soil loss and sediment | rainfall erosivity, slope, cover, management | soil loss rate, sediment yield |
| \`climate\` | climate indicators, projections, extremes | gridded climate, scenarios | indices, trends, projection bands |
| \`meteorology\` | weather series and downscaling | station/grid observations, reanalysis | bias-corrected series |
| \`agriculture\` | crop water requirement, yield response | weather, soil, crop parameters, management | ETc, irrigation need, yield estimates |
| \`vegetation\` | vegetation condition and productivity | remote sensing indices, climate | NDVI/LAI series, productivity |
| \`remote-sensing\` | ingestion, cloud masking, index derivation | imagery (Sentinel/Landsat), STAC | analysis-ready indices |
| \`gis\` | spatial reference, terrain, catchment delineation | DEM, boundaries, hydrography | catchments, slopes, spatial joins |
| \`simulation\` | model execution and calibration harness | model definitions, forcing data | run artefacts, calibration metrics |
| \`scenarios\` | scenario definition and comparison | baseline + interventions | scenario deltas, trade-off tables |
| \`mrv\` | measurement, reporting, verification evidence | interventions, measurements, models | verifiable claims with evidence chain |
| \`model-registry\` | model catalogue, versions, licences, status | model metadata | resolvable model references |

Status: skeleton. Subdirectories exist to hold the seven-part contract above per domain.
`);

write('engines/ai-workforce/README.md', HEAD('engines/ai-workforce — agent runtime') + `
Every agent must declare: purpose, permitted tools, permission scope (org/records), data
classification it may read, spending/action limits, escalation path, and a full audit trail of
inputs, tool calls and outputs. Nothing here is active in this phase.

| Role | Allowed to | Not allowed to |
|---|---|---|
| \`analyst\` | query read models, run HyDroMA analyses, produce reports | mutate domain records |
| \`administrator\` | manage users/orgs *within* delegated scope | touch finance, change permissions it was not granted |
| \`manager\` | plan, summarize, route approvals | approve its own proposals, spend |
| \`employees\` | execute scoped tasks inside one domain | cross-domain access without an explicit grant |
| \`model-gateway\` | single egress to LLM providers, token/cost accounting, redaction | expose provider keys to agents |
| \`agent-registry\` | agent definitions, versions, tool allowlists | grant permissions beyond the registry policy |

Hard rule: no agent is connected to payment, wallet, token or financial execution tooling.
`);

// ------------------------------------------------------------- packages
write('packages/README.md', HEAD('packages/ — shared libraries') + `
Shared code must be product-agnostic. An app-specific component belongs in that app.

| Package | Responsibility | Notes |
|---|---|---|
| \`design-system\` | design tokens (colour, type, spacing, radius, motion) | final identity not approved; tokens must stay swappable (COLOR-01, TYPO-01..06) |
| \`ui\` | headless/accessible components composing tokens | RTL-aware props from day one |
| \`icons\` | icon set + naming | licence-checked source only |
| \`i18n\` | message catalogs, pluralization, RTL helpers, calendar labels | fa/ar/en; no hardcoded strings in apps |
| \`auth-client\` | session handling, token refresh, permission claims | never holds business rules |
| \`api-client\` | typed client generated from \`contracts/api\` | no hand-written endpoint strings |
| \`domain-types\` | shared types for domain entities | aligned with \`contracts/schemas\` |
| \`validation\` | schema validation shared by client and services | single source with \`contracts/schemas\` |
| \`utilities\` | pure helpers (dates, units, formatting) | no I/O, no framework imports |
| \`configuration\` | shared build/lint/ts config presets | no runtime code |

Status: skeleton. No package is published or consumed yet.
`);

// ------------------------------------------------------------ contracts
write('contracts/README.md', HEAD('contracts/ — shared contracts') + `
Contracts are the only legal coupling between apps, services and engines.

- \`api\` — HTTP/RPC surface definitions (OpenAPI/typed schemas). Speculative endpoints are
  forbidden; each operation must map to an implemented use case.
- \`events\` — domain event envelopes: name, version, producer, payload schema, idempotency key.
- \`schemas\` — canonical entity schemas shared by validation and domain types.
- \`scientific-models\` — model input/output contracts, units, provenance envelope, uncertainty
  descriptor, validation report shape.

Rules: version every contract; breaking changes require a new version; no contract may embed
credentials or environment secrets.

Status: skeleton. No operational API is declared yet.
`);

// ------------------------------------------------------------ databases
write('databases/README.md', HEAD('databases/ — storage options') + `
**Nothing is installed, provisioned or migrated in this phase.** The table records the intended
role of each store so that schema work has a target; it is not a technology approval.

| Directory | Intended role | Candidate (option, not decision) |
|---|---|---|
| \`relational\` | system of record: identity, org, marketplace, finance, tourism | PostgreSQL |
| \`geospatial\` | spatial layers, catchments, property geometry | PostGIS |
| \`time-series\` | weather, flow, soil moisture, sensor series | TimescaleDB or ClickHouse |
| \`analytical\` | read models, reporting, scenario comparisons | DuckDB / ClickHouse |
| \`migrations\` | ordered, reviewable schema migrations | tooling TBD (D-DB-01) |
| \`seeds\` | reference data and demo fixtures | separated from real data |

Open: which store owns scientific gridded data (files vs DB) — see D-DB-02.

Status: skeleton. No schema, migration or seed exists.
`);

// ----------------------------------------------------------------- data
write('data/README.md', HEAD('data/ — data zones') + `
Data is separated by **trust level and processing stage**. Mixing them is a defect.

| Zone | Content | Rule |
|---|---|---|
| \`raw\` | untouched downloads | immutable; checksum recorded in \`metadata\` |
| \`processed\` | derived, reproducible from raw + code | must cite the transform version |
| \`reference\` | boundaries, admin units, lookups | versioned, licensed |
| \`geospatial\` | vector/raster layers | CRS declared |
| \`climate\` | gridded climate, projections | scenario + model version declared |
| \`hydrology\` | gauges, flow, basin data | station metadata required |
| \`soil\` | soil properties and profiles | depth/reference declared |
| \`agriculture\` | crop, management, yield | season and unit declared |
| \`remote-sensing\` | imagery and indices | sensor, date, cloud cover |
| \`scientific-models\` | model parameter sets | model version + provenance |
| \`fixtures\` | synthetic test data | must be labeled synthetic, never mixed with real |
| \`metadata\` | checksums, licences, provenance | required for every dataset |

Large or confidential data is **not committed**: see \`.gitignore\`. Real, sample, synthetic and
simulated data must never be indistinguishable in a filename or path.
`);

write('data/.gitignore', `# Data payloads stay out of version control.
*
!.gitignore
!README.md
`);

// --------------------------------------------------------- infrastructure
write('infrastructure/README.md', HEAD('infrastructure/ — runtime and operations') + `
Definition-only in this phase. No cloud resource, container, cluster or secret store is created.

| Area | Intended content |
|---|---|
| \`environments\` | dev/staging/prod parameter sets (no secrets) |
| \`configuration\` | typed config loading and validation rules |
| \`security\` | authn/authz policy, secret handling, key rotation procedure |
| \`monitoring\` | metrics, logs, traces, SLO definitions, alert routing |
| \`backup\` | backup scope, retention, restore test procedure |
| \`deployment\` | build/release pipeline definitions (per app and service) |

Hard rules: no secret in Git; no environment-specific value in code; every deployment must be
reproducible from a commit.
`);

// ------------------------------------------------------------- workflows
write('workflows/README.md', HEAD('workflows/ — process definitions') + `
Workflow *definitions*, not a runtime. Execution belongs to \`services/workflow\` (which may adopt
Temporal/Kestra behind an adapter, D-07).

| Directory | Scope |
|---|---|
| \`scientific\` | data intake → validation → model run → review → publication |
| \`business\` | onboarding, approvals, organization lifecycle |
| \`finance\` | invoicing, payout approval, reconciliation checkpoints |
| \`marketplace\` | listing review, order fulfilment, dispute |
| \`tourism\` | reservation, modification, cancellation, no-show |
| \`ai\` | agent task intake, human-in-the-loop approval, escalation |

Every definition must name: trigger, steps, actors, approval gates, failure path, audit points.
`);

// ---------------------------------------------------------- integrations
write('integrations/README.md', HEAD('integrations/ — outbound adapters') + `
One adapter per external system. Upstream products and third-party APIs never cross this
boundary unwrapped; every adapter maps vendor payloads to \`contracts/*\` and reports failures in a
uniform error shape.

| Directory | Purpose | Examples (candidates, not decisions) |
|---|---|---|
| \`satellite\` | imagery and STAC search | Sentinel/Landsat via STAC |
| \`weather\` | forecasts and observations | provider TBD (D-INT-01) |
| \`geospatial\` | tiles, geocoding, routing | MapServer/titiler/OpenTripPlanner |
| \`payment\` | checkout and payouts | provider TBD (D-INT-02) |
| \`messaging\` | email/SMS/push | provider TBD |
| \`external-data\` | reference datasets and statistics | per-source licence check |

No live credential, endpoint or subscription is configured here.
`);

// ----------------------------------------------------------------- tests
write('tests/README.md', HEAD('tests/ — verification layers') + `
| Layer | Proves |
|---|---|
| \`unit\` | pure logic and calculations |
| \`integration\` | service + storage behaviour |
| \`contract\` | producer/consumer compatibility, schema versions |
| \`e2e\` | critical user journeys across apps |
| \`security\` | authz bypass, tenancy leaks, injection, secret handling |
| \`performance\` | latency/throughput budgets |
| \`scientific-validation\` | model skill against reference datasets, with reported metrics |

Deterministic scientific acceptance requires the seven-part contract from
\`engines/hydroma/README.md\`; a test that cannot state units and tolerance is not a valid test.

Status: no runner is configured at root yet (D-QA-01).
`);

// ------------------------------------------------------------------ docs
write('docs/README.md', HEAD('docs/ — documentation map') + `
Existing documentation is **not duplicated here**. This tree adds process documents and points
at the authoritative material that already exists.

| Topic | Authoritative location |
|---|---|
| Architecture standards, decisions register, module catalog | \`architecture/\` |
| Ecosystem / boundary model | \`ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md\` |
| Brand, tokens, design system | \`brand/\` |
| Upstream repository evidence and licences | \`upstream-registry/\` |
| This mission's deliverables | repository root (\`*-REPORT.md\`, \`*-BASELINE.md\`, \`*-MANIFEST.*\`) |

New documents go in the narrowest correct place. A second copy of an existing standard is a defect.
`);

write('docs/architecture/README.md', HEAD('docs/architecture — index') + `
This directory is an **index only**; it does not restate architecture content.

Read, in this order:
1. \`../../ECONOJJIN-ARCHITECTURE-BASELINE.md\` — proposed baseline and open boundaries.
2. \`../../architecture/ECO-NOJIN-MASTER-ARCHITECTURE-V2.md\` — consolidated master architecture.
3. \`../../ECO-NOJIN-ECOSYSTEM-ARCHITECTURE.md\` — boundary model (with corrections noted in
   \`../../ECO-NOJIN-ARCHITECTURE-CORRECTION-AND-READINESS.md\`).
4. \`../../ROOT-STRUCTURE-MANIFEST.md\` — what each root folder is for and its status.
`);

write('docs/adr/README.md', HEAD('docs/adr/ — architecture decision records') + `
Process:
- One file per decision: \`ADR-####-short-title.md\`, sequential, never renumbered.
- Status is one of \`PROPOSED\`, \`ACCEPTED\`, \`REJECTED\`, \`SUPERSEDED\`.
- Only the project owner may move a decision to \`ACCEPTED\`.
- An ADR records the decision and its consequences; it does not contain implementation instructions.

Template: \`ADR-0000-template.md\`. Decisions still awaiting the owner are tracked in
\`../../ARCHITECTURE-DECISIONS-OPEN.md\`; when one is decided, it becomes an ADR and the open entry
is closed with a reference.
`);

write('docs/adr/ADR-0000-template.md', `# ADR-0000 — <title>

- **Status:** PROPOSED
- **Date:** YYYY-MM-DD
- **Deciders:** <owner / role>
- **Related:** <open-decision ID, prior ADRs>

## Context
<the forces at play, with evidence links>

## Options considered
| Option | Pros | Cons | Risk |
|---|---|---|---|

## Decision
<what is decided, in one paragraph>

## Consequences
- Positive:
- Negative:
- Follow-up work:
`);

write('docs/adr/ADR-0001-documentation-single-source.md', `# ADR-0001 — Single source of truth for documentation

- **Status:** PROPOSED (owner confirmation required)
- **Date:** 2026-11-18
- **Deciders:** project owner
- **Related:** ROOT-STRUCTURE-MANIFEST, ARCHITECTURE-DECISIONS-OPEN (D-DOC-01)

## Context
\`D:\\Nojin\` already contains architecture standards in \`architecture/\`, brand standards in
\`brand/\`, and upstream evidence in \`upstream-registry/\`. The requested root structure also
defines \`docs/{architecture,adr,security,data-governance,scientific-governance,development}\`.
Creating those folders as full document sets would duplicate existing standards and create two
competing authorities.

## Decision (proposed)
\`docs/\` holds **process and governance documents only** and indexes existing material; architecture
standards remain in \`architecture/\` until an explicit migration is approved. No document is copied.

## Consequences
- Positive: one authority per topic; no silent divergence between duplicates.
- Negative: two top-level doc locations during the transition.
- Follow-up: decide D-DOC-01 (consolidate into \`docs/\` or keep \`architecture/\` as authority).
`);

write('docs/security/README.md', HEAD('docs/security — security governance') + `
Scope: threat model, authn/authz policy, secret handling, tenancy isolation, audit requirements,
dependency and supply-chain review.

Existing inputs: \`../../architecture/ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md\`.

Current rules in force: no secret in Git; no credential in a client bundle; every mutation audited;
permission checks re-evaluated server-side; upstream code reviewed before adoption.
`);

write('docs/data-governance/README.md', HEAD('docs/data-governance — data policy') + `
Scope: data classification, retention, licensing of ingested datasets, provenance requirements,
personal-data handling, and the raw/processed/reference separation.

Rules: every dataset needs a licence and a checksum record in \`data/metadata\`; real and synthetic
data are never mixed; large or confidential data never enters Git.
`);

write('docs/scientific-governance/README.md', HEAD('docs/scientific-governance — scientific policy') + `
Scope: how a model becomes acceptable — input/output contract, units, versioning, provenance,
uncertainty reporting, validation protocol, and review record.

Rule: no model from \`upstream-registry\` becomes executable HyDroMA code without a review record and
an owner decision (D-17). Reported results must carry units, model version and uncertainty.
`);

write('docs/development/README.md', HEAD('docs/development — engineering practice') + `
Scope: local setup, branching and review rules, definition of done, dependency policy, testing
expectations, and how to run each app/service.

Existing inputs: \`../../DEVELOPMENT-FOUNDATION-REPORT.md\`, \`../../NEXT-IMPLEMENTATION-PLAN.md\`.

Current environment facts: Node.js 26.13.0, npm 11.20.0, pnpm 12.18.0, Python 3.12.10 via \`py -3\`
(no project venv), Git 2.49.0. \`D:\\Nojin\` is **not yet a Git repository** — see D-GIT-01.
`);

// ---------------------------------------------------------------- scripts
write('scripts/README.md', HEAD('scripts/ — project tooling') + `
| Script | Purpose | Safe to run repeatedly |
|---|---|---|
| \`scaffold-architecture.mjs\` | creates the root skeleton directories and boundary READMEs | yes — never overwrites existing files |

Rules: scripts must be read before execution, must not require network by default, must not touch
\`upstream-archives/\` or \`upstream-registry/<project>/\` sources, and must print what they change.
`);

write('.github/README.md', HEAD('.github — repository automation (intentionally empty)') + `
No workflow, action, secret or bot is configured in this phase. CI/CD design is blocked on
D-GIT-01 (repository initialisation) and D-QA-01 (test runner choice).
`);

console.log(JSON.stringify({ created: created.length, skipped: skipped.length, createdFiles: created, skippedFiles: skipped }, null, 2));
