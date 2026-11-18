# tests/ — verification layers

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

| Layer | Proves |
|---|---|
| `unit` | pure logic and calculations |
| `integration` | service + storage behaviour |
| `contract` | producer/consumer compatibility, schema versions |
| `e2e` | critical user journeys across apps |
| `security` | authz bypass, tenancy leaks, injection, secret handling |
| `performance` | latency/throughput budgets |
| `scientific-validation` | model skill against reference datasets, with reported metrics |

Deterministic scientific acceptance requires the seven-part contract from
`engines/hydroma/README.md`; a test that cannot state units and tolerance is not a valid test.

Status: no runner is configured at root yet (D-QA-01).
