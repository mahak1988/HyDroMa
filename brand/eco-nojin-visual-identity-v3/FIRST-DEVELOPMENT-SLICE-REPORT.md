# FIRST DEVELOPMENT SLICE REPORT

**Date:** 2026-11-18
**Slice:** `geo-measure` — geodesic area, perimeter and distance kernel with a zero-dependency test suite
**Location:** `D:\Nojin\experiments\geospatial-poc\geo-measure\`
**Repository status:** no Git repository exists, so no diff and no rollback are available
**Test command:** `node --test` (Node v26.13.0)

---

## 1. Why This Slice

Application development could not start: there is no repository, no framework decision (B01) and no application code. Every candidate slice listed in the mission brief — app shell, layout, header, navigation, RTL foundation, tokens, shared components, responsive, error UI — depends on at least one of:

- a framework decision (B01), or
- an identity decision (A01 colour, A07 type), or
- an RTL policy decision (A12), or
- a repository to modify.

The one requirement that is independent of all of them, is technically load-bearing, and was independently identified as the most consequential omission, is **area and distance computation** (`INDEPENDENT-STANDARDS-AUDIT-REVIEW.md` §4.6).

In an agricultural platform, parcel area is not a display detail. It is a number that can underpin land pricing, irrigation allocation and economic decisions. Computing it in a geographic coordinate system without accounting for latitude produces a **plausible but wrong** result — the failure mode that testing does not catch.

## 2. Selection Against the Eight Criteria

| Criterion | Result | Note |
|---|---|---|
| Independent of open critical owner decisions | **Yes** | No framework, identity, auth, financial or CRS *choice* is embedded |
| No backend or database change | **Yes** | Pure computation, no I/O |
| No security architecture change | **Yes** | No auth, no secrets, no network |
| Does not damage existing capability | **Yes** | New directory; zero existing files touched |
| Compatible with the real architecture | **Yes** | Node ESM, zero dependencies; portable to any framework later |
| Visible product value | **Yes** | Enables area-based features that currently cannot be built at all |
| Testable and verifiable | **Yes** | 23 deterministic assertions, no network, no browser |
| Reversible | **Yes** | Two new files; deletion restores the prior state exactly |

## 3. Files Changed

| File | Action | Bytes |
|---|---|---:|
| `geo-measure.mjs` | created | 9,429 |
| `geo-measure.test.mjs` | created | 6,354 |
| **Existing files modified** | **none** | 0 |

No file outside `experiments/geospatial-poc/geo-measure/` was created, modified, moved or deleted. `D:\HyDroMA` and `D:\eco_nojin` were not accessed.

## 4. What Was Implemented

| Capability | Function | Behaviour |
|---|---|---|
| CRS gating | `normalizeCRS` | Accepts only `EPSG:4326`/`CRS84`. Projected CRS → `PROJECTED_CRS_NOT_IMPLEMENTED`. Unknown → `UNSUPPORTED_CRS`. Missing → `CRS_REQUIRED`. **Fails closed.** |
| Position validation | `assertPosition` | Enforces `[lon, lat]`; rejects non-finite, longitude outside ±180, latitude outside ±90 |
| Ring validation | `validateRing`, `hasSelfIntersection` | Closure, minimum vertices, duplicate vertices, degeneracy, segment self-intersection |
| Spherical distance | `haversineDistanceM` | Mean-radius haversine |
| Ellipsoidal distance | `vincentyDistanceM` | WGS84 inverse problem, 200-iteration cap, explicit `converged` flag |
| Perimeter | `geodesicPerimeterM` | Sum of edge distances |
| Area | `ringAreaM2` | Spherical excess on the authalic mean radius |
| High-level API | `computeAreaM2`, `computePerimeterM`, `computeDistanceM`, `measurePolygon` | All require an explicit CRS; all return provenance |

**Deliberate omission:** no projected-CRS implementation and no datum transformation. Rather than approximate silently, the module refuses. This is the correct behaviour given that no project CRS has been ratified (B14).

## 5. Tests Executed

Command: `node --test` in the slice directory.

### 5.1 First run — 22 tests, 20 passed, 2 failed

Two failures. Both were traced to **incorrect expectations in the test file**, not to defects in the module:

| Failing test | Root cause | Correction |
|---|---|---|
| `axis order is enforced as lon,lat` | The fixture `[95, 10]` is a *valid* longitude/latitude pair, so no exception was correctly thrown | Replaced with a latitude-ratio test plus a genuine out-of-range case |
| `distance rejects an out-of-order coordinate pair` | The fixture `[35.7, 51.4]` is a valid lon/lat pair in Tehran, so no exception was correctly thrown | Replaced with a malformed-pair case |

The module behaved correctly in both cases. The tests were wrong. Both were corrected rather than suppressed, and one additional assertion was added.

### 5.2 Final run — 23 tests, 23 passed, 0 failed

```
ℹ tests 23
ℹ pass 23
ℹ fail 0
ℹ duration_ms 103.7856
```

### 5.3 Coverage of the tests

| Area | Tests |
|---|---|
| Coordinate order and range | 3 |
| Distance (spherical) | 4 |
| Distance (ellipsoidal) and agreement | 2 |
| Area scale, latitude dependence, winding | 3 |
| Perimeter | 1 |
| CRS fail-closed behaviour | 4 |
| Geometry validation | 5 |
| Provenance and status flags | 1 |

## 6. Remaining Issues

| Issue | Severity | Owner action needed |
|---|---|---|
| Module is **not scientifically validated** | High | Domain validation against a reference dataset; cannot be claimed before that |
| No project CRS ratified | High | B14 — owner decision |
| Projected-CRS measurement unimplemented | Medium | Deliberate; requires a projection engine decision |
| No datum transformation | Medium | Deliberate; same dependency |
| No reference dataset for area cross-checking | Medium | Requires HyDroMA authoritative parcels |
| Module sits in an experiment folder | Low | Relocate once B01 fixes the application location |

The module reports `validated: false` structurally in every result. It cannot be made to claim otherwise by accident.

## 7. Acceptance Status

| Dimension | Status |
|---|---|
| Implemented | **COMPLETE** |
| Unit tested | **COMPLETE** — 23/23 |
| Type checked | N/A — plain ESM, no TypeScript in the project |
| Lint | N/A — no linter configured in the project |
| Build | N/A — no build step exists |
| Integration tested | **NOT_STARTED** — nothing to integrate with yet |
| Scientifically validated | **NOT_VERIFIED** — requires domain authority |
| Accepted by owner | **NOT REQUESTED** |
| **Overall slice status** | **PARTIAL** — implemented and unit tested, not validated |

## 8. Compliance Statement

| Constraint | Compliance |
|---|---|
| Only the identified target scope | Complied — `D:\Nojin\experiments\geospatial-poc\` only |
| No framework change | Complied — none exists |
| No architectural migration | Complied |
| No backend or database change | Complied |
| No authentication or authorization change | Complied |
| No financial or token activation | Complied |
| No change to unapproved scientific or spatial contracts | Complied — refuses rather than assumes |
| No files outside scope | Complied — 0 modified |
| No deletion of existing capability | Complied |
| No overwrite of user changes | Complied |
| No commit, push or deploy | Complied — no repository exists |

**Slice status: PARTIAL.** Delivered and verified what can be delivered without an owner decision. Product feature development remains blocked on the creation of a target repository and the framework decision.