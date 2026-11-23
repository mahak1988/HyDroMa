import pytest

from hydroma.registry import (
    MODEL_CONTRACT_FIELDS,
    ModelRegistry,
    contract_gaps,
    validate_definition,
)
from hydroma.water_balance import WATER_BALANCE_DEFINITION, compute_water_balance


def test_contract_completeness():
    # The water balance definition must cover the full reusable execution contract.
    assert contract_gaps(WATER_BALANCE_DEFINITION) == []
    for field in MODEL_CONTRACT_FIELDS:
        assert field in WATER_BALANCE_DEFINITION


def test_valid_definition_accepted():
    validate_definition(WATER_BALANCE_DEFINITION)  # must not raise


def test_register_and_get():
    reg = ModelRegistry()
    reg.register(WATER_BALANCE_DEFINITION, compute_water_balance)
    model = reg.get("eco-nojin.hydroma.water-balance")
    assert model is not None
    assert model["definition"]["version"] == "1.1.0"
    assert len(reg.list()) == 1


def test_duplicate_registration_rejected():
    reg = ModelRegistry()
    reg.register(WATER_BALANCE_DEFINITION, compute_water_balance)
    with pytest.raises(ValueError):
        reg.register(WATER_BALANCE_DEFINITION, compute_water_balance)


def test_invalid_definition_rejected():
    bad = dict(WATER_BALANCE_DEFINITION)
    bad["version"] = "not-semver"
    with pytest.raises(ValueError):
        validate_definition(bad)


def test_missing_inputs_rejected():
    bad = dict(WATER_BALANCE_DEFINITION)
    bad["inputs"] = []
    with pytest.raises(ValueError):
        validate_definition(bad)


def test_unknown_domain_rejected():
    bad = dict(WATER_BALANCE_DEFINITION)
    bad["domain"] = "astrology"
    with pytest.raises(ValueError):
        validate_definition(bad)