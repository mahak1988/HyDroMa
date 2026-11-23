import math

import pytest

from hydroma.units import (
    Quantity,
    SUPPORTED_UNITS,
    UnitError,
    canonical_unit,
    convert,
    dimension,
    is_known,
    is_quantity,
    quantity_value_unit,
)


def test_supported_units_registry():
    for unit in ("mm", "m", "day", "ha", "m3", "degC"):
        assert unit in SUPPORTED_UNITS
    assert canonical_unit("m") == "mm"
    assert canonical_unit("m2") == "ha"
    assert canonical_unit("hour") == "day"


def test_convert_same_dimension():
    assert convert(1000.0, "mm", "m") == 1.0
    assert abs(convert(1.0, "m", "mm") - 1000.0) < 1e-9
    assert convert(2.0, "ha", "m2") == 20000.0
    assert convert(1.0, "m3", "m3") == 1.0


def test_convert_dimension_mismatch_raises():
    with pytest.raises(UnitError):
        convert(1.0, "mm", "ha")


def test_convert_non_finite_rejected():
    with pytest.raises(UnitError):
        convert(float("inf"), "mm", "m")
    with pytest.raises(UnitError):
        convert(float("nan"), "mm", "m")


def test_unknown_unit_raises():
    assert is_known("mm") is True
    assert is_known("furlong") is False
    with pytest.raises(UnitError):
        dimension("furlong")


def test_quantity_validation():
    Quantity(1.0, "mm")
    with pytest.raises(UnitError):
        Quantity(float("nan"), "mm")
    with pytest.raises(UnitError):
        Quantity(1.0, "furlong")


def test_quantity_helpers():
    assert is_quantity(Quantity(1.0, "mm")) is True
    assert is_quantity({"value": 1.0, "unit": "mm"}) is True
    assert is_quantity({"value": 1.0}) is False
    assert quantity_value_unit({"value": 2.5, "unit": "mm"}) == (2.5, "mm")