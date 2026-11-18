# apps/marketplace — commerce experience

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Responsibility: catalog browsing, seller storefronts, cart, checkout UX, order tracking.

Boundary:
- In: `services/marketplace`, `services/inventory`, `services/finance` (invoice/payment status only).
- Out: payment capture implementation, ledger ownership, price/tax computation.
- Open: standalone app vs `console` module (D-APP-01). Until decided, this directory is a
  boundary record, not an approved deliverable.

Status: skeleton.
