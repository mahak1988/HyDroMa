# integrations/ — outbound adapters

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

One adapter per external system. Upstream products and third-party APIs never cross this
boundary unwrapped; every adapter maps vendor payloads to `contracts/*` and reports failures in a
uniform error shape.

| Directory | Purpose | Examples (candidates, not decisions) |
|---|---|---|
| `satellite` | imagery and STAC search | Sentinel/Landsat via STAC |
| `weather` | forecasts and observations | provider TBD (D-INT-01) |
| `geospatial` | tiles, geocoding, routing | MapServer/titiler/OpenTripPlanner |
| `payment` | checkout and payouts | provider TBD (D-INT-02) |
| `messaging` | email/SMS/push | provider TBD |
| `external-data` | reference datasets and statistics | per-source licence check |

No live credential, endpoint or subscription is configured here.
