"""Model registry: id@version keyed, immutable once registered.

Registration validates the model definition against the minimal contract so a
malformed definition can never enter the registry and later fail as an opaque
execution error.
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

from .maturity import MODEL_MATURITY, SCIENTIFIC_STATUS

__all__ = [
    "ModelRegistry",
    "validate_definition",
    "contract_gaps",
    "MODEL_DOMAINS",
    "MODEL_CONTRACT_FIELDS",
    "MODEL_DEFINITION_SCHEMA",
]

MODEL_DOMAINS = [
    "water", "hydrology", "groundwater", "soil", "erosion", "climate",
    "meteorology", "agriculture", "crop", "vegetation", "remote-sensing",
    "gis", "drought", "irrigation", "simulation", "scenarios", "mrv",
    "landscape",
]

# Minimal JSON-Schema-like contract (documentation + future tooling). Not a full
# JSON Schema validator; ``validate_definition`` enforces the same constraints.
MODEL_DEFINITION_SCHEMA = {
    "type": "object",
    "required": ["id", "version", "domain", "title", "maturity", "units",
                 "inputs", "outputs"],
    "properties": {
        "id": {"type": "string", "minLength": 1},
        "version": {"type": "string", "pattern": r"^\d+\.\d+\.\d+$"},
        "domain": {"type": "string", "enum": MODEL_DOMAINS},
        "title": {"type": "string", "minLength": 1},
        "maturity": {"type": "string", "enum": MODEL_MATURITY},
        "scientific_status": {"type": "string", "enum": SCIENTIFIC_STATUS},
        "units": {"type": "array", "minItems": 1},
        "inputs": {"type": "array", "minItems": 1},
        "outputs": {"type": "array", "minItems": 1},
    },
}

_SPEC_KINDS = {"number", "quantity", "boolean", "string", "enum", "array", "object"}

# Fields a complete, reusable scientific-model execution contract should expose.
MODEL_CONTRACT_FIELDS = [
    "id", "version", "domain", "title", "executionMode", "maturity",
    "scientific_status", "units", "precision", "inputs", "outputs",
    "assumptions", "limitations", "references", "validation",
    "provenanceRequiredFields",
]


def contract_gaps(definition: dict) -> list:
    """Return contract fields missing from ``definition`` (empty list = complete)."""
    return [f for f in MODEL_CONTRACT_FIELDS if f not in definition]


def _is_semver(value) -> bool:
    import re
    return isinstance(value, str) and bool(re.match(r"^\d+\.\d+\.\d+$", value))


def validate_definition(definition: dict) -> None:
    """Raise ValueError if the definition violates the minimal contract."""
    if not isinstance(definition, dict):
        raise ValueError("model definition must be an object")
    for field in ("id", "version", "domain", "title", "maturity"):
        if not definition.get(field):
            raise ValueError(f"model definition missing '{field}'")
    if not _is_semver(definition["version"]):
        raise ValueError("version must be semver (x.y.z)")
    if definition["domain"] not in MODEL_DOMAINS:
        raise ValueError(f"domain must be one of {MODEL_DOMAINS}")
    if definition["maturity"] not in MODEL_MATURITY:
        raise ValueError("maturity is not recognised")
    ss = definition.get("scientific_status", "NOT_VALIDATED")
    if ss not in SCIENTIFIC_STATUS:
        raise ValueError("scientific_status is not recognised")
    for key in ("units", "inputs", "outputs"):
        if not isinstance(definition.get(key), list) or len(definition[key]) == 0:
            raise ValueError(f"{key} must be a non-empty array")
    for key in ("inputs", "outputs"):
        names = set()
        for spec in definition[key]:
            if not isinstance(spec, dict) or not spec.get("name"):
                raise ValueError(f"each {key} entry needs a name")
            if spec["name"] in names:
                raise ValueError(f"duplicate {key} name: {spec['name']}")
            names.add(spec["name"])
    for key in ("inputs", "outputs"):
        for spec in definition[key]:
            kind = spec.get("kind", "number")
            if kind not in _SPEC_KINDS:
                raise ValueError(f"unsupported kind: {kind!r}")


class ModelRegistry:
    def __init__(self) -> None:
        self._models: Dict[Tuple[str, str], dict] = {}

    def register(self, definition: dict, executor) -> None:
        validate_definition(definition)
        key = (definition["id"], definition["version"])
        if key in self._models:
            raise ValueError(f"model already registered: {key[0]}@{key[1]}")
        self._models[key] = {"definition": definition, "executor": executor}

    def get(self, model_id: str, version: Optional[str] = None):
        if version is not None:
            return self._models.get((model_id, version))
        matches = [v for (mid, _), v in self._models.items() if mid == model_id]
        return matches[0] if matches else None

    def list(self) -> List[dict]:
        return [m["definition"] for m in self._models.values()]

    def __contains__(self, key) -> bool:
        return key in self._models