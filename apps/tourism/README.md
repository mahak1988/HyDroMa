# apps/tourism — stays and booking

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Responsibility: property discovery, availability presentation, reservation flow, guest/host UX.

Boundary:
- In: `services/tourism` (availability, rates reference), `services/finance` (payment state),
  `services/notification` (confirmations).
- Out: calendar math and rate rules (service-owned), payment capture.
- Calendar/timezone note: local calendars (Jalali/Hijri/Gregorian) and time zones are
  presentation concerns here, but the canonical timestamps stay UTC in the service layer.
- Open: standalone app vs `console` module (D-APP-01).

Status: skeleton.
