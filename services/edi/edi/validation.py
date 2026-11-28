"""Validation utilities."""

import json
from pathlib import Path

from edi.contracts.canonical import (
    CONTRACT_VERSION,
    VARIABLE_SPECS,
    parse_timestamp,
    validate_record,
)
from edi.errors import InvalidContract

SCHEMA_PATH = Path(__file__).resolve().parent / "schemas" / "canonical-data-v1.schema.json"
_SCHEMA = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))

try:
    from jsonschema import Draft202012Validator

    _VALIDATOR = Draft202012Validator(_SCHEMA)
except ImportError:
    _VALIDATOR = None


def validate_against_schema(record: dict) -> None:
    if _VALIDATOR is None:
        raise InvalidContract("jsonschema is not installed")
    errors = sorted(_VALIDATOR.iter_errors(record), key=lambda e: list(e.path))
    if errors:
        first = errors[0]
        path = ".".join(str(p) for p in first.path) or "$"
        raise InvalidContract(
            "schema validation failed",
            {"path": path, "message": first.message},
        )


def validate_canonical_record(record: dict) -> None:
    validate_against_schema(record)
    validate_record(record)


def is_supported_contract_version(version: str) -> bool:
    return version == CONTRACT_VERSION


def is_supported_variable(variable: str) -> bool:
    return variable in VARIABLE_SPECS