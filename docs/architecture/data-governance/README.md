# Data Governance Architecture

**Status:** SCAFFOLDED.

## Responsibility
Data ownership, classification, quality, provenance, validation, versioning, retention, access, privacy, lifecycle, metadata, dictionaries, standards.

## Boundaries
- Every scientific result carries units, model version, source, provenance, uncertainty.
- Real/synthetic/mock data never mixed; bulk/confidential data not in Git.

## Dependencies
All data-producing components; security; scientific.

## Maturity / Future
SCAFFOLDED → enforced via contracts + CI checks (Stage 1+).