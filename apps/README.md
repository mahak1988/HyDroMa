# apps/ — Deployable frontends

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Each directory is one deployable user-facing program. Apps compose `packages/*` and speak to
`services/*` only through `contracts/api`. No app owns domain state and no app imports
another app's source.

| App | Primary audience | Owns | Must not |
|---|---|---|---|
| `portal` | public visitors | marketing pages, SEO, public discovery | authenticated workflows, pricing logic |
| `console` | users, org admins, experts, staff | authenticated shell, org switching, settings | domain business rules |
| `marketplace` | buyers, sellers | commerce UX | payments, ledger |
| `tourism` | guests, hosts | booking UX | rates calculation, finance |
| `scientific-workspace` | HyDroMA scientists | scenario editor, run monitor, provenance viewer | scientific computation |

Open: whether `marketplace` and `tourism` ship as standalone apps or as console modules
(`ARCHITECTURE-DECISIONS-OPEN.md` → D-APP-01). Nothing here decides that.
