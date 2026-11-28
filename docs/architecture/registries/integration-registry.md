# Integration Registry

**Status:** SCAFFOLDED. Foundational registry of external integrations. One adapter per external
system (`integrations/README.md`); vendor payloads never cross the boundary unwrapped. **No live
credential, endpoint or subscription exists.** Provider choices are owner decisions (D-INT-01,
D-INT-02).

## Integration records

| Integration ID | Provider (candidate) | Consumer | Adapter | Interface | Auth (future) | Data flow | Status |
|---|---|---|---|---|---|---|---|
| INT-SAT | Sentinel/Landsat via STAC | GIS-STAC, SCI-INPUT | `integrations/satellite` | STAC search → COG | token/OAuth (TBD) | provider → adapter → contracts → catalog | PLANNED |
| INT-WEATHER | ERA5/CHIRPS/GPM/national (D-INT-01) | climate engine, ET0 | `integrations/weather` | observations API | none/key (TBD) | provider → adapter → ClimateSeries | PLANNED |
| INT-GEOSPATIAL | MapServer/titiler/OTP | GIS-* | `integrations/geospatial` | OGC/tiles/route | none/key | provider → adapter → map layers | PLANNED |
| INT-PAYMENT | regional/global (D-INT-02) | ACC-PAYREC, MKT-ORDER | `integrations/payment` | intent/callback | merchant keys (TBD) | order → adapter → payment status | PLANNED (no live payments) |
| INT-MESSAGING | email/SMS/push (TBD) | PLT-NOTIF | `integrations/messaging` | send API | provider keys (TBD) | notification → adapter → delivery | PLANNED |
| INT-EXTDATA | reference datasets | data zones, analytics | `integrations/external-data` | file/API | licence-gated | source → adapter → data zone + metadata | PLANNED |
| INT-EXTREG | carbon registry (MRV) | MRV-REGISTRY | `integrations/registry` (planned) | submission API | credentials (TBD) | report package → adapter → status | PLANNED |
| INT-AI | AI model providers | AI-GATEWAY | `ai/gateways` + `ai/providers` | model API | provider keys (TBD) | agent request → gateway → provider | PLANNED (no agents active) |

## Rules

1. Core domain modules never depend directly on a provider; only the adapter does.
2. Every adapter maps vendor payloads to `contracts/*` and reports failures in a uniform error shape.
3. Every source records licence + attribution in `data/metadata` before use.
4. Rate limits, retry, provider-health and provenance are adapter responsibilities.
5. Activating an integration requires an owner decision and a credential-handling procedure; this
   registry never stores secrets.

## Related

- Components: [../component-registry.md](../component-registry.md)
- Contracts produced/consumed: [contract-registry.md](./contract-registry.md)
- Provider decisions: `ARCHITECTURE-DECISIONS-OPEN.md` (D-INT-01, D-INT-02, D-04, D-AI-01)