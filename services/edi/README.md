# EDI

Eco Nojin Environmental Data Infrastructure.

## Phase 3.44.0

This package contains:

- EDI-1.0 implementation foundation.
- EDI-1.1 canonical storage core (SQLite + Parquet adapter).
- Security foundation.
- Tests.

## Offline by default

Live acquisition is disabled by default. `EDI_LIVE_ACQUISITION=1` alone is not sufficient; the security gate, provider authorization, and owner approval are required.

## Test

```powershell
pytest
```

Parquet tests are skipped when `pyarrow` is not installed. The Parquet adapter raises `PARQUET_UNAVAILABLE` in that case.

## Layout

```text
edi/
  config.py
  errors.py
  validation.py
  registry.py
  contracts/
  storage/
  provenance/
  security/
tests/
```