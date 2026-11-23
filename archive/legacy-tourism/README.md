# apps/tourism — Discover Living Landscapes

**Status:** IMPLEMENTED (frontend, demo data) — see
`experiments/frontend-phase-2-planning/execution-reports/STAGE-2.8-TOURISM-IMPLEMENTATION-REPORT.md`.

Responsibility: destination discovery, rural and nomadic tourism, stays, experiences, events,
host workspace and a demo booking-request flow.

Boundary:
- In: `services/tourism` (availability, rates reference), `services/finance` (payment state),
  `services/notification` (confirmations), `services/landscape` (landscape records).
- Out: payment capture, real availability, host confirmation, settlement, sensitive geometry.
- Landscape: destinations reference a landscape record through `landscapeRef`; villages,
  rangelands and nomadic communities are **not** duplicated here.
- Nomadic territories: zones, routes and camps carry validity windows, recurring months,
  access level and sensitivity. Sensitive geometry is never published without consent.
- Marketplace: host records reference marketplace product ids; no Product/Seller model is
  duplicated in this app.
- Booking: every request is a local, browser-only demo record. No payment, no host notice,
  no capacity is held.

Status: implemented for demonstration. No backend, no live inventory, no payment.