# docs/data-governance — data policy

**Status:** SKELETON — boundaries defined, no implementation
**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`, `ARCHITECTURE-DECISIONS-OPEN.md`.
This file defines a boundary. It is not an approval to build.

Scope: data classification, retention, licensing of ingested datasets, provenance requirements,
personal-data handling, and the raw/processed/reference separation.

Rules: every dataset needs a licence and a checksum record in `data/metadata`; real and synthetic
data are never mixed; large or confidential data never enters Git.
