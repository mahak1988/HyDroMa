# OWNER DECISION REGISTER

**Document ID:** OWNER-DECISION-REGISTER
**Formalization baseline:** eco-nojin-design-system-formalization-v1
**Register generated:** 2026-11-17T16:37:38Z
**Source of truth for the 8 decisions:** the Owner (exclusive authority). The executor (agent) records only; it never chooses.

**Overall design-system status:** **DRAFT — NOT APPROVED**

---

## Decision capture rules applied

1. Only a decision the Owner has **explicitly** announced is recorded as chosen.
2. Each chosen decision must store: chosen value, capture date, decision source, Owner note.
3. If the Owner has not chosen, the status remains **OPEN**.
4. If a choice is ambiguous, it is **not** recorded; the ambiguity is flagged.
5. A new decision that conflicts with a prior one is **not** silently overwritten; the conflict is reported.
6. Logo choice for each of the three brands is independent.
7. Choosing a color path does **not** replace contrast/accessibility approval.
8. D-08 (brand family approval) is only possible when the related decisions are clear and consistent enough.

---

## Executive summary

| Metric | Count |
|---|---|
| Total decisions | 8 |
| Chosen (explicit Owner decision) | **0** |
| OPEN | **8** |
| Ambiguous / conflict | 0 (no owner input to conflict with) |
| Auto-selected by agent | 0 (forbidden) |

> **No explicit Owner decision was provided in the input for this mission.** Per the mission's final principle ("if no explicit Owner decisions exist, perform only preparation and status registration, and refrain from any self-driven visual-identity fixation"), all eight decisions are recorded as **OPEN**. No logo, color path, or font has been chosen, inferred, or suggested as final by the agent.

---

## Decision detail

### D-01 — Eco Nojin logo type
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options:** Eco Nojin option 01 (Fraunces Editorial) / option 02 (Manrope Modern) / option 03 (Fraunces Stacked) — plus any future option
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** 9 SVG wordmarks audited; all typographic (no symbol, no path); font-dependent (up to 16.5% reflow without webfonts). See `reports/logo-audit.md` (QA) and the Owner Visual Decision Studio.
- **Notes:** Independent of D-02 and D-03.

### D-02 — HyDroMA logo type
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options:** HyDroMA option 01 (Manrope Tight) / option 02 (DM Sans Clean) / option 03 (Manrope Weight Contrast) — plus any future option
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** same logo audit as D-01.
- **Notes:** Independent of D-01 and D-03.

### D-03 — Nojin Marketplace logo type
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options:** Marketplace option 01 (DM Sans Mixed) / option 02 (Manrope Friendly) / option 03 (Fraunces Mixed) — plus any future option
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** same logo audit as D-01.
- **Notes:** Independent of D-01 and D-02.

### D-04 — Primary color path
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options:** A: Territory Teal (primary #0B5563) / B: Warm · Royal Deep Blue (primary #173B63) / OPEN
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** both paths are independent and fully implemented in QA (themes.css); QA measured contrast on both. See `reports/accessibility-test.md`.
- **Constraint (rule 7):** this choice does **not** replace WCAG contrast / accessibility approval.

### D-05 — Persian (Farsi) font
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options (bundled families only):** Vazirmatn / Estedad — or OPEN
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** both are bundled, variable-weight, OFL-licensed (embedded URL). 6 families total in QA.
- **Constraint:** no font may be finalized as the choice unless the Owner explicitly picks it.

### D-06 — Latin font
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options (bundled families only):** Manrope / DM Sans — or OPEN
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** both bundled, variable, OFL. **Note:** Inter is referenced in CSS (`--font-en`) but is **NOT bundled** (`REFERENCED_NOT_BUNDLED`); it is not a valid "available" choice until the Owner decides to add it (see T-02).
- **Constraint:** no font finalized without explicit Owner choice.

### D-07 — Data & code font
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options (bundled families only):** IBM Plex Mono — or OPEN
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** IBM Plex Mono is bundled (static Regular/Medium/SemiBold, OFL). **Note:** JetBrains Mono is referenced in CSS (`--font-mono`) but is **NOT bundled** (`REFERENCED_NOT_BUNDLED`); not a valid "available" choice until the Owner decides to add it (see T-02).
- **Constraint:** no font finalized without explicit Owner choice.

### D-08 — Brand family approval
- **Status:** OPEN
- **Owner choice:** (none)
- **Available options:** APPROVED / OPEN
- **Capture date:** —
- **Decision source:** —
- **Owner note:** —
- **Evidence:** brand family (Eco Nojin = mother brand; HyDroMA = scientific engine; Nojin Marketplace = marketplace) documented in the Owner Visual Decision Studio and QA brand section.
- **Constraint (rule 8):** D-08 can only move to APPROVED once D-01, D-02, D-03, D-04, D-05, D-06, D-07 are sufficiently clear and consistent. As of this register, all are OPEN, so D-08 cannot be APPROVED.

---

## Ambiguities & conflicts

- **Ambiguities:** none recorded (no owner input to be ambiguous).
- **Conflicts:** none (no prior owner decision exists to conflict with).
- **Blocking dependencies:** D-08 is blocked by D-01..D-07 (all OPEN).

---

## How to record an Owner decision (procedure for the next capture)

When the Owner states a decision explicitly, the executor will:
1. Set the decision status from OPEN to a chosen value.
2. Record: chosen value, capture date (UTC), decision source (e.g. "Owner statement, message of YYYY-MM-DD"), Owner note.
3. Append an entry to `DECISION-CHANGELOG.md` (previous value, new value, source).
4. Re-run the consistency checks and update `DESIGN-SYSTEM-BASELINE.md` only if the decision is unambiguous.
5. Never auto-apply a choice to the Design System itself.

**End of register.**