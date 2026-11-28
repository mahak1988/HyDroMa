# Deployment Diagram (Conceptual)

**Status:** SCAFFOLDED. Conceptual deployment. **Current deployment is local single-origin only**
(unified host :5180 + local API :8000). Everything else is a future target and is drawn dashed. No
cloud resource, container, cluster or secret store is provisioned.

```mermaid
flowchart TB
  subgraph Local[[Current: developer machine]]
    HOST[[Unified host :5180]]
    APILOC[[Local API :8000]]
    ENGLOC[[HyDroMA local runner]]
    FILESYS[(Filesystem / data zones)]
    HOST --> APILOC
    HOST --> ENGLOC
    APILOC --> FILESYS
    ENGLOC --> FILESYS
  end

  subgraph Future[Target deployment - planned]
    CDN[CDN / edge]
    WEB[Web app tier]
    APITIER[API tier]
    WORKER[Worker tier]
    PG[(PostgreSQL + PostGIS)]
    TS[(Time-series store)]
    OS[(Object storage + STAC/COG)]
    OBS[Observability]
    SEC[Secrets manager]
  end

  HOST -.-> CDN
  CDN -.-> WEB
  WEB -.-> APITIER
  APITIER -.-> PG
  APITIER -.-> TS
  APITIER -.-> OS
  APITIER -.-> WORKER
  WORKER -.-> OS
  APITIER -.-> OBS
  APITIER -.-> SEC
```

## Current (verified)

- One origin, one port (:5180), local API (:8000), local engine runner, filesystem data zones.
- No managed infrastructure, no DB server, no object store, no CI deployment.

## Target (not provisioned)

- CDN → web tier → API tier → workers; PostgreSQL/PostGIS, time-series store, object storage with
  STAC/COG; observability and secrets management.
- Adoption of each is gated by an owner decision (D-DB-01/02, D-INT-*, D-AI-01) and a measured need.

## Rule

A box in the future subgraph is never described as existing. Deployment claims require evidence
(recorded provisioning + verification).