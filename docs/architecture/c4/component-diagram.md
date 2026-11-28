# C3 — Component Diagram

**Status:** SCAFFOLDED. Component organization inside the backend, engine, AI and frontend. `[ ]` =
planned; `[[ ]]` = exists. This is a boundary view, not a code map.

```mermaid
flowchart TB
  subgraph Backend[Backend modular monolith]
    API_L[API layer]
    APP_L[Application layer]
    DOM_L[Domain layer]
    INF_L[Infrastructure layer]
    MODS[Domain modules: IAM, ORG, MKT, INV, FIN, TOU, TER, SCI-gateway, MRV, AI-orch, NOTIF, WF, RPT]
    API_L --> APP_L --> DOM_L
    APP_L --> MODS
    DOM_L --> INF_L
  end

  subgraph Engine[HyDroMA]
    REG[Model registry]
    EXE[Execution + jobs]
    PROV[Provenance]
    CLIM[Climate/ET0/soil/crop/irrigation]
    SCN[Scenario + workflow]
    QC[Quality + contracts + units]
  end

  subgraph AI[AI workforce]
    GATE[AI gateway]
    REGA[Agent registry]
    TOOLS[Tool registry]
    POL[Policy/guardrails]
    AUD[Agent audit]
  end

  subgraph FE[Frontend]
    SHELL[App shell]
    SECT[Sections]
    SHARED[Shared packages]
  end

  MODS -->|engine contract| REG
  EXE --> PROV
  CLIM --> QC
  SCN --> EXE
  GATE --> REGA --> TOOLS
  GATE --> POL
  GATE --> AUD
  SECT --> SHELL --> SHARED
```

## Layer responsibilities (backend)

- **API layer:** transport, request validation, auth, rate limit, request id. No business rules.
- **Application layer:** use-case orchestration, transactions, audit emission.
- **Domain layer:** business rules and invariants; the home of truth.
- **Infrastructure layer:** persistence, engine gateway client, adapters, messaging.
- **Modules:** one owner per schema; cross-module only via contracts/events.

## Rule

Business rules live in the domain layer, never in the API or the frontend. Modules do not reach into
another module's internals (F4).