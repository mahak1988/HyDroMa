from edi.errors import (
    EDIError,
    IntegrityError,
    InvalidConfiguration,
    InvalidContract,
    SecurityPolicyViolation,
    StorageError,
    UnsupportedContractVersion,
)


def test_error_codes():
    assert InvalidConfiguration("x").code == "INVALID_CONFIGURATION"
    assert InvalidContract("x").code == "INVALID_CONTRACT"
    assert UnsupportedContractVersion("x").code == "UNSUPPORTED_CONTRACT_VERSION"
    assert StorageError("x").code == "STORAGE_ERROR"
    assert IntegrityError("x").code == "INTEGRITY_ERROR"
    assert SecurityPolicyViolation("x").code == "SECURITY_POLICY_VIOLATION"


def test_error_report():
    err = InvalidContract("bad", {"field": "x"})
    assert err.to_dict()["code"] == "INVALID_CONTRACT"
    assert err.to_dict()["details"] == {"field": "x"}