# C2 — Container Diagram

**Status:** SCAFFOLDED. Containers are deployable/runnable units. `[[ ]]` = exists today; `[ ]` =
planned/scaffolded. Solid arrow = existing path; dashed = planned.

```mermaid
flowchart TB
  subgraph Client
    FE[[Platform SPA (apps/platform + packages)]]
    BRAND[[Brand app (apps/brand)]]
  end

  subgraph Server
    API[[Local API (services/api)]]
    GW[API gateway]
    DOM[Domain modules (services/*)]
    EDI[[EDI (services/edi)]]
  end

  subgraph Science
    HC[hydroma-client]
    EG[Engine gateway]
    ENG[[HyDroMA (engines/hydroma)]]
  end

  subgraph Data
    DB[(Database - planned)]
    OBJ[(Object storage - planned)]
    ZONES[(Data zones (data/*))]
  end

  subgraph Platform
    AIWF[AI workforce]
    INT[Integrations adapters]
    WF[Workflows]
  end

  FE -->|http /api| API
  FE -->|science| HC
  BRAND --> FE
  API --> DOM
  DOM --> GW
  GW --> EG
  EG --> ENG
  HC -.-> EG
  DOM --> DB
  DOM --> OBJ
  ENG --> ZONES
  DOM --> INT
  DOM --> WF
  DOM --> AIWF
  EDI --> OBJ
```

## Current vs planned

- **Existing:** Platform SPA, Brand app, Local API, EDI, HyDroMA engine, data-zone structure,
  hydroma-client.
- **Planned/scaffolded:** API gateway, domain modules, engine gateway (as the sole backend path),
  database, object storage, AI workforce, integrations, workflows.

## Rules

- Frontend never talks to the DB or the engine directly.
- Backend reaches the engine only through the engine gateway.
- Integrations are outbound adapters; no provider is a direct dependency of domain logic.