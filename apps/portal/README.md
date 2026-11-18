# apps/portal — public site

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Responsibility: the public face of Eco Nojin — ecosystem overview, HyDroMA introduction,
public marketplace/tourism entry points, content pages, SEO/metadata, waitlist forms.

Boundary:
- In: static/ISR content, public catalog reads, localization (fa/ar/en) and RTL.
- Out: authenticated flows (→ `console`), checkout (→ `marketplace`), booking (→ `tourism`),
  any scientific result rendering beyond published summaries (→ `scientific-workspace`).
- Data: consumes `contracts/api` public read models only. No direct DB access.

Status: skeleton. No prototype code from `upstream-registry` is copied here.
