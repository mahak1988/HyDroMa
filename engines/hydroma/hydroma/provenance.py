"""Provenance for scientific runs.

A provenance record is the minimum chain that makes a result reproducible and
auditable. The engine computes real SHA-256 hashes of the canonical inputs,
parameters and outputs; it never invents them. A record with missing hashes is
rejected by ``is_complete``.

Canonicalization: ``sha256_json`` serializes with sorted keys, no insignificant
whitespace, and UTF-8. Two inputs that are equal as canonical JSON produce the
same hash; any material difference produces a different hash. A hash proves
integrity/reproducibility of the record, never scientific correctness.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Optional

__all__ = [
    "SCHEMA_VERSION",
    "ProvenanceRecord",
    "sha256_text",
    "sha256_json",
    "sha256_file",
    "utc_now_iso",
    "extract_model_parameters",
]

# Provenance record schema version (bumped when fields change meaning).
SCHEMA_VERSION = "1.0.0"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def canonical_json(obj) -> str:
    """Deterministic JSON: sorted keys, compact separators, UTF-8, allow_nan=False."""
    return json.dumps(
        obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False
    )


def sha256_json(obj) -> str:
    return hashlib.sha256(canonical_json(obj).encode("utf-8")).hexdigest()


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def extract_model_parameters(definition, input_data) -> dict:
    """Extract the model parameter object for a run (deterministic, no invention).

    A model declares its parameters via an optional top-level ``parameters`` list
    in its definition: the names of inputs that are intrinsic model parameters
    (soil hydraulic properties, crop coefficients, depletion fractions, ...), as
    opposed to forcing/state/observation data. Only declared names that are
    actually present in ``input_data`` are included; missing optional parameters
    are omitted (never invented, never defaulted). A model with no ``parameters``
    declaration exposes no independent parameter object and yields ``{}``.

    The result is a plain dict suitable for :func:`sha256_json`, so equivalent
    parameter objects hash identically and any material parameter change produces
    a different hash.
    """
    if not isinstance(definition, dict):
        return {}
    names = definition.get("parameters")
    if not names:
        return {}
    if not isinstance(input_data, dict):
        input_data = {}
    return {name: input_data[name] for name in names if name in input_data}


@dataclass
class ProvenanceRecord:
    run_id: str
    model_id: str
    model_version: str
    code_version: str
    input_hashes: list
    parameter_hash: str
    environment: str
    executed_at: str
    operator: str
    result_hashes: list
    validation_status: str
    schema_version: str = SCHEMA_VERSION
    scientific_status: str = "NOT_VALIDATED"
    input_units: Optional[dict] = None
    error: Optional[dict] = None
    seed: Optional[str] = None

    def to_dict(self) -> dict:
        return asdict(self)

    def is_complete(self) -> bool:
        """A record is complete only when every required field carries a value.

        A failed execution is still a valid provenance record provided it carries
        error information and the run/model identity.
        """
        base_ok = bool(
            self.run_id
            and self.model_id
            and self.model_version
            and self.code_version
            and self.schema_version
            and self.environment
            and self.executed_at
            and self.operator
            and self.validation_status
            and self.scientific_status
        )
        if self.error is not None:
            # failed execution: error must be present and no result hashes required
            return base_ok and bool(self.error.get("code"))
        return base_ok and isinstance(self.input_hashes, list) and len(self.input_hashes) > 0 \
            and bool(self.parameter_hash) and isinstance(self.result_hashes, list) \
            and len(self.result_hashes) > 0