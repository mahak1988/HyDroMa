"""Contract and dataset versioning."""

from dataclasses import dataclass

from edi.errors import UnsupportedContractVersion

SUPPORTED_CONTRACT_VERSIONS = ("1.0.0",)


@dataclass(frozen=True)
class VersionInfo:
    contract_version: str
    dataset_version: str
    processing_version: str


def is_supported_contract_version(version: str) -> bool:
    return version in SUPPORTED_CONTRACT_VERSIONS


def require_supported_contract_version(version: str) -> None:
    if not is_supported_contract_version(version):
        raise UnsupportedContractVersion(
            "unsupported contract version",
            {"contract_version": version, "supported": SUPPORTED_CONTRACT_VERSIONS},
        )


def same_dataset_version(left: str, right: str) -> bool:
    return left == right