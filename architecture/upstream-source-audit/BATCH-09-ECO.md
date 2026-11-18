# BATCH 09 — ECO — SOURCE AUDIT
## Keycloak, Temporal, Kestra, Node-RED, LangGraph, Agno, Flowise, OpenZeppelin, farmOS, Arena, Collect Earth, SEPAL, QloApps, Spree

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level analysis. No build, no run.

---

## 1. Keycloak (`keycloak-main.zip`, 64 MB, Apache-2.0)
- **Architecture:** `authz/`, `core/`, `services/`, `quarkus/`, `js/`, `operator/`. IAM.
- **Core source:** 6,924 source files; 3,683 test files.
- **Main interfaces:** Admin REST API; OIDC/SAML endpoints.
- **Capabilities:** OAuth2/OIDC/SAML, user federation, RBAC, authorization services.
- **Proven:** source present; NOT built.
- **Runtime:** **Requires DB (Postgres/MySQL/MariaDB) + JVM.**
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `PLT-IAM`, `PLT-SESSION`, `PLT-RBAC`.
- **Mapping:** `INTEGRATION_REQUIRED`.
- **Risks:** heavy JVM; CVE patching.

## 2. Temporal (`temporal-main.zip`, 11 MB, MIT)
- **Architecture:** `service/`, `common/`, `client/`, `cmd/`. Go durable workflows.
- **Core source:** 1,974 source files; 1,248 test files.
- **Main interfaces:** gRPC API; SDKs (Go/Java/Python/TS/.NET).
- **Capabilities:** durable execution, signals, timers, retries, sagas.
- **Proven:** source present; NOT built.
- **Runtime:** **Persistence DB (SQLite/Cassandra/Postgres/MySQL).**
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `WF-ENGINE`, `SCI-QUEUE`.
- **Mapping:** `INTEGRATION_REQUIRED`.
- **Risks:** distributed system ops.

## 3. Kestra (`kestra-develop.zip`, 22 MB, Apache-2.0)
- **Architecture:** `core/`, `webserver/`, `worker/`, `executor/`, `scheduler/`, `jdbc/`, `ui/`. Java.
- **Core source:** 3,435 source files; 2,806 test files.
- **Main interfaces:** REST API; WebSocket; JDBC queue.
- **Capabilities:** declarative workflows (YAML), plugins, triggers, retries.
- **Proven:** source present; NOT built.
- **Runtime:** **Postgres/MySQL + JVM.**
- **License:** Apache-2.0. Permissive (EE excluded via `@EeOnly`).
- **Eco Nojin modules:** `WF-ENGINE`, `WF-DEF`, `WF-SCHED`.
- **Mapping:** `DEFER` (choose temporal OR kestra).
- **Risks:** heavy JVM; overlaps temporal.

## 4. Node-RED (`node-red-main.zip`, 10 MB, Apache-2.0)
- **Architecture:** `packages/` (JS). Flow-based low-code.
- **Core source:** 799 source files; 289 test files.
- **Main interfaces:** HTTP endpoints; WebSocket; Node-RED API.
- **Capabilities:** visual flow editor, 3000+ nodes.
- **Proven:** source present; NOT built.
- **Runtime:** Node.js. No DB required.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `WF-ENGINE`.
- **Mapping:** `REJECT` (insecure by default; arbitrary code exec).
- **Risks:** **no auth by default**; arbitrary JS execution.

## 5. LangGraph (`langgraph-main.zip`, 5 MB, MIT)
- **Architecture:** `libs/langgraph/`, `libs/checkpoint/`, `libs/sdk-py/`, `libs/sdk-js/`. Python.
- **Core source:** 233 source files; 272 test files.
- **Main interfaces:** `langgraph.graph.StateGraph`; checkpointers.
- **Capabilities:** graph-based agent orchestration, human-in-the-loop, state machines.
- **Proven:** source present; NOT executed.
- **Runtime:** Python; optional DB checkpointers.
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `AI-GATEWAY`, `AI-REGISTRY`.
- **Mapping:** `DIRECT_REUSE`.
- **Risks:** prompt injection; tool exec.

## 6. Agno (`agno-main.zip`, 26 MB, Apache-2.0)
- **Architecture:** `libs/agno/`, `libs/agnoctl/`, `libs/agno_infra/`. Python.
- **Core source:** 1,357 source files; 2,136 test files.
- **Main interfaces:** `agno.agent.Agent`; `Team`.
- **Capabilities:** multi-agent with tools, memory, knowledge.
- **Proven:** source present; NOT executed.
- **Runtime:** Python; optional vector DBs; LLM APIs.
- **License:** Apache-2.0. Permissive.
- **Eco Nojin modules:** `AI-GATEWAY`, `AI-REGISTRY`.
- **Mapping:** `DEFER` (overlaps langgraph).
- **Risks:** LLM APIs (paid).

## 7. Flowise (`Flowise-main.zip`, 25 MB, Apache-2.0 + EE)
- **Architecture:** `packages/` (TS). Low-code LLM builder.
- **Core source:** 1,699 source files; 160 test files.
- **Main interfaces:** REST API (`/api/v1/*`); SDK.
- **Capabilities:** visual AI agent builder, RAG, chatbots.
- **Proven:** source present; NOT executed.
- **Runtime:** Node.js; optional Postgres/Redis.
- **License:** Apache-2.0 + **Commercial EE** (`packages/server/src/enterprise/`).
- **Eco Nojin modules:** `AI-GATEWAY`.
- **Mapping:** `DEFER` (EE boundary + arbitrary code exec).
- **Risks:** EE license; arbitrary code.

## 8. OpenZeppelin Contracts (`openzeppelin-contracts-master.zip`, 7 MB, MIT)
- **Architecture:** `contracts/` (Solidity). Smart contract library.
- **Core source:** 483 source files; 249 test files.
- **Main interfaces:** ERC-20/721/1155; Governor; AccessControl.
- **Capabilities:** audited Solidity contracts.
- **Proven:** source present; NOT built.
- **Runtime:** EVM chain (if used).
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `DEC-TOKEN`, `DEC-LEDGER`.
- **Mapping:** `DEFER` (only if blockchain).
- **Risks:** blockchain activation is owner-gated.

## 9. farmOS (`farmOS-4.x.zip`, 1.5 MB, GPL-2.0-or-later)
- **Architecture:** `modules/` (PHP/Drupal). Farm management.
- **Core source:** 679 source files; 255 test files.
- **Main interfaces:** Drupal JSON:API; farmOS modules.
- **Capabilities:** crop/livestock/field tracking, inventory, planning.
- **Proven:** source present; NOT executed.
- **Runtime:** **MySQL/MariaDB + Drupal.**
- **License:** GPL-2.0-or-later. **Strong copyleft.**
- **Eco Nojin modules:** `TER-FRM`.
- **Mapping:** `DEFER` (legal).
- **Risks:** GPL-2.0-or-later; Drupal CVEs.

## 10. Open Foris Arena (`arena-master.zip`, 152 MB, MIT)
- **Architecture:** `webapp/`, `server/`, `core/`, `common/`, `infra/`. TS.
- **Core source:** 2,963 source files; 397 test files.
- **Main interfaces:** REST API; React webapp.
- **Capabilities:** geospatial survey, data collection, validation.
- **Proven:** source present; NOT executed.
- **Runtime:** **PostgreSQL + PostGIS.**
- **License:** MIT. Permissive.
- **Eco Nojin modules:** `GIS-FIELD`, `TER-PART`.
- **Mapping:** `DEFER` (heavy).
- **Risks:** heavy; optional AI SDKs (paid).

## 11. Collect Earth (`collect-earth-master.zip`, 151 MB, MIT)
- **Architecture:** `collect-earth/collect-earth-app/` (Java/JavaFX), `collect-earth-cloud/` (TS).
- **Core source:** 879 source files; 672 test files.
- **Main interfaces:** JavaFX app; GEE API; Bing Maps API.
- **Capabilities:** visual interpretation of Earth observation.
- **Proven:** source present; NOT executed.
- **Runtime:** Java + Google Earth; external GEE/Bing.
- **License:** MIT. Permissive (external service terms separate).
- **Eco Nojin modules:** `GIS-LULC`, `GIS-VEGIND`.
- **Mapping:** `DEFER` (desktop, external deps).
- **Risks:** external GEE/Bing.

## 12. SEPAL (`sepal-master.zip`, 18 MB, MIT/ISC)
- **Architecture:** `modules/` (30+ modules: gateway, user, task, sandbox, gee, recipe, etc.). Python/JS.
- **Core source:** 2,120 source files; 810 test files.
- **Main interfaces:** Django REST; module APIs; GEE.
- **Capabilities:** cloud raster analysis, BFAST, time-series.
- **Proven:** source present; NOT executed.
- **Runtime:** **PostgreSQL + PostGIS + RabbitMQ + Redis + GEE.**
- **License:** MIT (license.txt) / ISC (package.json) — inconsistency.
- **Eco Nojin modules:** `GIS-RASTER`, `GIS-VEGIND`.
- **Mapping:** `DEFER` (heavy cloud).
- **Risks:** very heavy; external GEE.

## 13. QloApps (`QloApps-develop.zip`, 46 MB, OSL-3.0)
- **Architecture:** PHP (PrestaShop fork). Hotel booking/PMS.
- **Core source:** 4,452 source files; 22 test files.
- **Main interfaces:** PrestaShop webservice API; modules.
- **Capabilities:** hotel booking, reservations, availability.
- **Proven:** source present; NOT executed.
- **Runtime:** **MySQL + PHP.**
- **License:** OSL-3.0. **Copyleft.**
- **Eco Nojin modules:** `TOU-DEST`, `TOU-STAY`, `TOU-RES`.
- **Mapping:** `REJECT` (copyleft + legacy CVEs).
- **Risks:** OSL-3.0; legacy PrestaShop CVEs.

## 14. Spree (`spree-main.zip`, 109 MB, BSD-3-Clause)
- **Architecture:** `spree/{api,core,dashboard,emails,mcp,opentelemetry,providers,lib}`, `packages/`. Ruby/Rails.
- **Core source:** 3,900 source files; 1,795 test files.
- **Main interfaces:** REST API; GraphQL (storefront); Admin SDK.
- **Capabilities:** headless commerce; **multi-vendor out-of-the-box** (sellers, order splitting, commission, settlement).
- **Proven:** source present; NOT executed.
- **Runtime:** **PostgreSQL/MySQL + Redis.**
- **License:** BSD-3-Clause. Permissive (EE = multi-tenant SaaS).
- **Eco Nojin modules:** `MKT-CATALOG`, `MKT-ORDER`, `MKT-SETTLE`, `MKT-COMM`.
- **Mapping:** `INTEGRATION_REQUIRED`.
- **Risks:** Rails ops; EE for multi-tenant SaaS.

---

## 15. BATCH SUMMARY
- 14 projects, all `EXTRACTED`.
- **License risk:** farmOS (GPL-2.0+), QloApps (OSL-3.0) = HIGH; Flowise/Medusa (EE) = MEDIUM.
- **Overlap:** temporal/kestra/node-red (workflow); langgraph/agno/flowise (AI); spree/medusa (commerce).
- **No project approved.**