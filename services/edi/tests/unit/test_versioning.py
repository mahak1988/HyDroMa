import pytest

from edi.contracts.versioning import is_supported_contract_version, require_supported_contract_version
from edi.errors import UnsupportedContractVersion


def test_supported_version():
    assert is_supported_contract_version("1.0.0")
    require_supported_contract_version("1.0.0")


def test_unsupported_version():
    with pytest.raises(UnsupportedContractVersion):
        require_supported_contract_version("2.0.0")