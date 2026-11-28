# Infrastructure Registry

**Status:** SCAFFOLDED. Foundational registry of infrastructure components. Definition-only: **no
cloud resource, container, cluster or secret store is provisioned** (`infrastructure/README.md`).
"Current" is the verified state; "Target" is the intended role, not an approval.

## Infrastructure records

| ID | Name | Responsibility | Current | Target | Dependencies | Deploy req | Cost note |
|---|---|---|---|---|---|---|---|
| INF-RUNTIME | Compute runtime | Host apps/services/engine | local Node + Python | containerised runtime | — | yes (future) | reuse local; low |
| INF-CONFIG | Configuration | Typed config load/validate | env + files | validated config service | INF-SECRETS | no | low |
| INF-SECRETS | Secrets management | Vault/rotation/access policy | none (no secrets in repo) | managed secret store | — | yes (future) | managed KMS; low-med |
| INF-OBS | Observability | Traces/metrics/logs/alerts | verify logs only | OpenTelemetry + dashboards | INF-RUNTIME | yes (future) | OTel OSS; low |
| INF-STORAGE | Object storage | Files/assets/rasters | filesystem | S3-compatible + STAC/COG | — | yes (future) | SeaweedFS/MinIO; low |
| INF-JOBS | Job workers | Async/background jobs | engine-local SQLite jobs | durable queue + workers | INF-STORAGE | yes (future) | internal light; low |
| INF-CACHE | Caching | Tile/query cache, CDN | none | bounded cache (Redis later) | — | optional | add only on measured need |
| INF-BACKUP | Backup & recovery | Snapshot/restore/drill | none | 3-2-1 backup | INF-STORAGE, INF-DATA | yes (future) | storage cost; low |
| INF-CICD | CI & delivery | Build/test/scan/release | `.github/workflows/verify.yml` | full CI/CD | — | yes | GitHub-hosted; low |
| INF-DB-REL | Relational store | System of record | none | PostgreSQL | — | yes (future) | managed/CE; low |
| INF-DB-GEO | Geospatial store | Spatial layers | none | PostGIS | INF-DB-REL | yes (future) | included in PG |
| INF-DB-TS | Time-series store | Sensor/climate series | none | TimescaleDB (or ClickHouse) | INF-DB-REL | yes (future) | low-med |
| INF-NET | Networking | Ingress/egress, isolation | local proxy (vite hosts) | managed ingress + private net | — | yes (future) | low |

## Rules

1. No secret in Git; no environment-specific value in code.
2. Every deployment reproducible from a commit.
3. Heavy stores (PostGIS/ClickHouse/Redis/Kafka) are adopted only on a measured need + owner decision.
4. Local-first: the whole stack must run on a developer machine without external services.

## Related

- Security architecture: `architecture/ECO-NOJIN-SECURITY-AND-INFRASTRUCTURE.md`, `docs/security/`
- Observability detail: [../observability/README.md](../observability/README.md)
- Resilience detail: [../resilience/README.md](../resilience/README.md)