# DECISION CHANGELOG

**Document ID:** DECISION-CHANGELOG
**Formalization baseline:** eco-nojin-design-system-formalization-v1
**Created:** 2026-11-17T16:37:38Z

This file records every change to the Decision Register. Because no Owner decision has been captured yet, there are **no changes** to record — only the initial baseline.

---

## Change log

| # | Timestamp (UTC) | Decision | Previous value | New value | Source | Notes |
|---|---|---|---|---|---|---|
| — | 2026-11-17T16:37:38Z | (all) | — | — | Initial baseline | Register initialized with all 8 decisions **OPEN**. No Owner input captured. |

**Total changes recorded:** 0

---

## How future changes are appended

When the Owner makes an explicit decision, the executor appends a row here:
- Timestamp (UTC, ISO-8601)
- Decision ID (D-01..D-08)
- Previous value (e.g. OPEN)
- New value (the Owner's explicit choice)
- Source (e.g. "Owner statement, message dated YYYY-MM-DD")
- Notes (any ambiguity, conflict, or dependency)

Rules enforced:
- No silent overwrite: a conflicting new decision is recorded as a new row and the conflict is flagged in the register.
- No agent-initiated change: only explicit Owner decisions create rows.
- Ambiguous choices are not recorded (flagged instead).

---

## Integrity note

- No change has been made to any reference folder (design-system-v2, -qa, owner-review-v1) as part of this formalization.
- This changelog is append-only.