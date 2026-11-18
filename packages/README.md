# packages/ — shared libraries

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Shared code must be product-agnostic. An app-specific component belongs in that app.

| Package | Responsibility | Notes |
|---|---|---|
| `design-system` | design tokens (colour, type, spacing, radius, motion) | final identity not approved; tokens must stay swappable (COLOR-01, TYPO-01..06) |
| `ui` | headless/accessible components composing tokens | RTL-aware props from day one |
| `icons` | icon set + naming | licence-checked source only |
| `i18n` | message catalogs, pluralization, RTL helpers, calendar labels | fa/ar/en; no hardcoded strings in apps |
| `auth-client` | session handling, token refresh, permission claims | never holds business rules |
| `api-client` | typed client generated from `contracts/api` | no hand-written endpoint strings |
| `domain-types` | shared types for domain entities | aligned with `contracts/schemas` |
| `validation` | schema validation shared by client and services | single source with `contracts/schemas` |
| `utilities` | pure helpers (dates, units, formatting) | no I/O, no framework imports |
| `configuration` | shared build/lint/ts config presets | no runtime code |

Status: skeleton. No package is published or consumed yet.
