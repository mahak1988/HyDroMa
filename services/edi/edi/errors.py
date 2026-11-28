"""EDI error hierarchy."""

from dataclasses import dataclass, field
from typing import Any


class EDIError(Exception):
    code = "EDI_ERROR"

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message)
        self.message = message
        self.details = details or {}

    def to_dict(self) -> dict[str, Any]:
        return {"code": self.code, "message": self.message, "details": self.details}


class InvalidConfiguration(EDIError):
    code = "INVALID_CONFIGURATION"


class InvalidContract(EDIError):
    code = "INVALID_CONTRACT"


class UnsupportedContractVersion(EDIError):
    code = "UNSUPPORTED_CONTRACT_VERSION"


class InvalidData(EDIError):
    code = "INVALID_DATA"


class UnitMismatch(EDIError):
    code = "UNIT_MISMATCH"


class StorageError(EDIError):
    code = "STORAGE_ERROR"


class IntegrityError(EDIError):
    code = "INTEGRITY_ERROR"


class RecoveryRequired(EDIError):
    code = "RECOVERY_REQUIRED"


class SecurityPolicyViolation(EDIError):
    code = "SECURITY_POLICY_VIOLATION"


class ParquetUnavailable(EDIError):
    code = "PARQUET_UNAVAILABLE"


@dataclass
class ErrorReport:
    code: str
    message: str
    details: dict[str, Any] = field(default_factory=dict)