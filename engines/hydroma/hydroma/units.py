"""Minimal UCUM-style unit handling for the Phase 2.1 water-balance slice.

Design goals: explicit units, no silent conversion, no silent dimension mixing.
The registry is intentionally small (length, time, area, volume, temperature)
and designed so additional scientific domains can register more units later
without changing call sites.
"""

from __future__ import annotations

import math
from dataclasses import dataclass

__all__ = [
    "UnitError",
    "Quantity",
    "SUPPORTED_UNITS",
    "convert",
    "canonical_unit",
    "dimension",
    "is_known",
    "is_quantity",
    "quantity_value_unit",
    # dimensional system (Phase 3.8)
    "BaseDimension",
    "UnitDefinition",
    "UNIT_DEFINITIONS",
    "DIM_LENGTH",
    "DIM_AREA",
    "DIM_VOLUME",
    "DIM_TIME",
    "DIM_VELOCITY",
    "DIM_FLOW",
    "DIM_MASS",
    "DIM_TEMPERATURE",
    "DIM_PRESSURE",
    "DIM_ENERGY",
    "DIM_POWER",
    "DIM_ENERGY_FLUX_AREA",
    "DIM_DIMENSIONLESS",
    "get_unit",
    "list_units",
    "is_known_unit",
    "are_compatible",
    "convert_value",
    "convert_difference",
    "validate_unit",
]


class UnitError(ValueError):
    """Raised for unknown units, incompatible dimensions, or invalid values."""


# unit -> (dimension, factor to the dimension's canonical base unit)
SUPPORTED_UNITS = {
    "mm": ("length", 1.0),
    "cm": ("length", 10.0),
    "m": ("length", 1000.0),
    "day": ("time", 1.0),
    "hour": ("time", 1.0 / 24.0),
    "ha": ("area", 1.0),
    "m2": ("area", 1.0 / 10000.0),
    "m3": ("volume", 1.0),
    "degC": ("temperature", 1.0),
}

# canonical base unit per dimension
_BASE = {
    "length": "mm",
    "time": "day",
    "area": "ha",
    "volume": "m3",
    "temperature": "degC",
}


def _info(unit: str):
    if unit not in SUPPORTED_UNITS:
        raise UnitError(f"unsupported unit: {unit!r}")
    return SUPPORTED_UNITS[unit]


def is_known(unit: str) -> bool:
    return unit in SUPPORTED_UNITS


def dimension(unit: str) -> str:
    return _info(unit)[0]


def canonical_unit(unit: str) -> str:
    """Return the canonical base unit for the dimension of ``unit``."""
    return _BASE[_info(unit)[0]]


def convert(value: float, from_unit: str, to_unit: str) -> float:
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise UnitError(f"value must be a finite number, got {value!r}")
    if not math.isfinite(float(value)):
        raise UnitError(f"value must be finite, got {value!r}")
    f_dim, f_factor = _info(from_unit)
    t_dim, t_factor = _info(to_unit)
    if f_dim != t_dim:
        raise UnitError(
            f"dimension mismatch: {from_unit} ({f_dim}) -> {to_unit} ({t_dim})"
        )
    return float(value) * f_factor / t_factor


@dataclass(frozen=True)
class Quantity:
    value: float
    unit: str

    def __post_init__(self):
        if not isinstance(self.value, (int, float)) or isinstance(self.value, bool):
            raise UnitError(f"quantity value must be a number, got {self.value!r}")
        if not math.isfinite(float(self.value)):
            raise UnitError(f"quantity value must be finite, got {self.value!r}")
        if not is_known(self.unit):
            raise UnitError(f"unsupported unit: {self.unit!r}")


def is_quantity(value) -> bool:
    if isinstance(value, Quantity):
        return True
    if isinstance(value, dict) and "value" in value and "unit" in value:
        v, u = value["value"], value["unit"]
        return (
            isinstance(v, (int, float))
            and not isinstance(v, bool)
            and isinstance(u, str)
            and u != ""
        )
    return False


def quantity_value_unit(value):
    if isinstance(value, Quantity):
        return float(value.value), value.unit
    return float(value["value"]), value["unit"]


# ===========================================================================
# Dimensional system & unit registry (Phase 3.8)
# ---------------------------------------------------------------------------
# A richer, explicit dimensional layer that coexists with the minimal helpers
# above (which remain unchanged for backward compatibility). Base dimensions are
# exponent vectors over (length L, mass M, time T, temperature Θ).

@dataclass(frozen=True)
class BaseDimension:
    """A physical dimension as an exponent vector (L, M, T, Θ)."""

    length: int = 0
    mass: int = 0
    time: int = 0
    temperature: int = 0

    def as_tuple(self):
        return (self.length, self.mass, self.time, self.temperature)


DIM_LENGTH = BaseDimension(length=1)
DIM_AREA = BaseDimension(length=2)
DIM_VOLUME = BaseDimension(length=3)
DIM_TIME = BaseDimension(time=1)
DIM_VELOCITY = BaseDimension(length=1, time=-1)
DIM_FLOW = BaseDimension(length=3, time=-1)
DIM_MASS = BaseDimension(mass=1)
DIM_TEMPERATURE = BaseDimension(temperature=1)
DIM_PRESSURE = BaseDimension(length=-1, mass=1, time=-2)
DIM_ENERGY = BaseDimension(length=2, mass=1, time=-2)
DIM_POWER = BaseDimension(length=2, mass=1, time=-3)
DIM_ENERGY_FLUX_AREA = BaseDimension(mass=1, time=-3)   # W/m2
DIM_DIMENSIONLESS = BaseDimension()


@dataclass(frozen=True)
class UnitDefinition:
    """A unit: canonical symbol, dimension, scale+offset to the dimension's base unit.

    ``canonical_value = value * factor + offset``. For affine units (temperature)
    ``offset`` is non-zero; for all others ``offset == 0`` and ``affine`` is False.
    """

    symbol: str
    dimension: BaseDimension
    factor: float
    offset: float = 0.0
    affine: bool = False


def _u(symbol, dimension, factor, offset=0.0, affine=False):
    return UnitDefinition(symbol, dimension, factor, offset, affine)


UNIT_DEFINITIONS = {
    # length (base m)
    "m": _u("m", DIM_LENGTH, 1.0),
    "cm": _u("cm", DIM_LENGTH, 0.01),
    "mm": _u("mm", DIM_LENGTH, 0.001),
    "km": _u("km", DIM_LENGTH, 1000.0),
    # area (base m2)
    "m2": _u("m2", DIM_AREA, 1.0),
    "ha": _u("ha", DIM_AREA, 10000.0),
    "km2": _u("km2", DIM_AREA, 1e6),
    # volume (base m3)
    "m3": _u("m3", DIM_VOLUME, 1.0),
    "L": _u("L", DIM_VOLUME, 0.001),
    # time (base s)
    "s": _u("s", DIM_TIME, 1.0),
    "min": _u("min", DIM_TIME, 60.0),
    "h": _u("h", DIM_TIME, 3600.0),
    "day": _u("day", DIM_TIME, 86400.0),
    # velocity (base m/s)
    "m/s": _u("m/s", DIM_VELOCITY, 1.0),
    "km/h": _u("km/h", DIM_VELOCITY, 1.0 / 3.6),
    # volumetric flow (base m3/s)
    "m3/s": _u("m3/s", DIM_FLOW, 1.0),
    "m3/day": _u("m3/day", DIM_FLOW, 1.0 / 86400.0),
    # mass (base kg)
    "kg": _u("kg", DIM_MASS, 1.0),
    "g": _u("g", DIM_MASS, 0.001),
    # temperature (base K) — affine absolute units
    "K": _u("K", DIM_TEMPERATURE, 1.0, 0.0, affine=True),
    "degC": _u("degC", DIM_TEMPERATURE, 1.0, 273.15, affine=True),
    "degF": _u("degF", DIM_TEMPERATURE, 5.0 / 9.0, 273.15 - 32.0 * 5.0 / 9.0, affine=True),
    # temperature differences (no offset)
    "delta_degC": _u("delta_degC", DIM_TEMPERATURE, 1.0, 0.0, affine=False),
    "delta_K": _u("delta_K", DIM_TEMPERATURE, 1.0, 0.0, affine=False),
    # pressure (base Pa)
    "Pa": _u("Pa", DIM_PRESSURE, 1.0),
    "kPa": _u("kPa", DIM_PRESSURE, 1000.0),
    # dimensionless
    "1": _u("1", DIM_DIMENSIONLESS, 1.0),
    "%": _u("%", DIM_DIMENSIONLESS, 0.01),
    # energy (base J)
    "J": _u("J", DIM_ENERGY, 1.0),
    "MJ": _u("MJ", DIM_ENERGY, 1e6),
    # energy flux per area (base W/m2)
    "MJ/m2/day": _u("MJ/m2/day", DIM_ENERGY_FLUX_AREA, 1e6 / 86400.0),
    # water depth per time (dimension L T^-1; base m/s)
    "mm/day": _u("mm/day", DIM_VELOCITY, 0.001 / 86400.0),
    "mm/hour": _u("mm/hour", DIM_VELOCITY, 0.001 / 3600.0),
}


def get_unit(symbol: str) -> UnitDefinition:
    """Return the :class:`UnitDefinition` for ``symbol``; raise ``UnitError`` if unknown."""
    try:
        return UNIT_DEFINITIONS[symbol]
    except KeyError:
        raise UnitError(f"unknown unit: {symbol!r}") from None


def list_units():
    """Return a sorted list of registered unit symbols."""
    return sorted(UNIT_DEFINITIONS)


def is_known_unit(symbol: str) -> bool:
    return symbol in UNIT_DEFINITIONS


def are_compatible(unit_a: str, unit_b: str) -> bool:
    """True iff both units share the same physical dimension."""
    return get_unit(unit_a).dimension == get_unit(unit_b).dimension


def _to_canonical(value: float, unit: UnitDefinition) -> float:
    return value * unit.factor + unit.offset


def _from_canonical(canon: float, unit: UnitDefinition) -> float:
    return (canon - unit.offset) / unit.factor


def convert_value(value, from_unit: str, to_unit: str) -> float:
    """Explicit absolute conversion between compatible units.

    Affine units (absolute temperature) apply their offset; converting an absolute
    temperature to a temperature *difference* (or vice versa) raises ``UnitError``.
    """
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise UnitError(f"value must be a finite number, got {value!r}")
    if not math.isfinite(float(value)):
        raise UnitError(f"value must be finite, got {value!r}")
    fu, tu = get_unit(from_unit), get_unit(to_unit)
    if fu.dimension != tu.dimension:
        raise UnitError(f"incompatible dimensions: {from_unit} -> {to_unit}")
    if fu.affine != tu.affine:
        raise UnitError(
            f"cannot convert absolute unit {from_unit!r} to difference unit {to_unit!r} "
            f"(use convert_difference for temperature differences)"
        )
    return _from_canonical(_to_canonical(float(value), fu), tu)


def convert_difference(value, from_unit: str, to_unit: str) -> float:
    """Explicit conversion of a temperature *difference* (no offset applied)."""
    if not isinstance(value, (int, float)) or isinstance(value, bool):
        raise UnitError(f"value must be a finite number, got {value!r}")
    if not math.isfinite(float(value)):
        raise UnitError(f"value must be finite, got {value!r}")
    fu, tu = get_unit(from_unit), get_unit(to_unit)
    if fu.dimension != tu.dimension:
        raise UnitError(f"incompatible dimensions: {from_unit} -> {to_unit}")
    if fu.affine or tu.affine:
        raise UnitError(
            f"convert_difference requires difference units (non-affine), got "
            f"{from_unit!r}/{to_unit!r}; use convert_value for absolute temperatures"
        )
    return float(value) * fu.factor / tu.factor


def validate_unit(actual_unit: str, expected_unit: str) -> dict:
    """Classify ``actual_unit`` against ``expected_unit``.

    Returns ``{"status", "actual_unit", "expected_unit"}`` where status is one of
    ``UNIT_EXACT_MATCH``, ``UNIT_COMPATIBLE``, ``UNIT_INCOMPATIBLE``, ``UNIT_UNKNOWN``.
    """
    if not is_known_unit(actual_unit):
        return {"status": "UNIT_UNKNOWN", "actual_unit": actual_unit,
                "expected_unit": expected_unit}
    if not is_known_unit(expected_unit):
        return {"status": "UNIT_UNKNOWN", "actual_unit": actual_unit,
                "expected_unit": expected_unit}
    a, e = get_unit(actual_unit), get_unit(expected_unit)
    if a.dimension != e.dimension:
        return {"status": "UNIT_INCOMPATIBLE", "actual_unit": actual_unit,
                "expected_unit": expected_unit}
    if actual_unit == expected_unit:
        return {"status": "UNIT_EXACT_MATCH", "actual_unit": actual_unit,
                "expected_unit": expected_unit}
    return {"status": "UNIT_COMPATIBLE", "actual_unit": actual_unit,
            "expected_unit": expected_unit}