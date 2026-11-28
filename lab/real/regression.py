"""Regression cases for confirmed defects/limitations (lab-only).

These are stored separately from engine tests. They document established
findings so a later change cannot silently reintroduce them.
"""

from __future__ import annotations

from typing import Any, Dict, List

__all__ = ["REGRESSION_CASES", "run_regression"]

REGRESSION_CASES: List[Dict[str, Any]] = [
    {"id": "spei_negative_balance", "model_id": "eco-nojin.hydroma.drought-wmo",
     "category": "STATISTICAL_METHOD_ERROR",
     "expectation": "SPEI must not be computed by gamma-fitting a series with negative values",
     "status": "DOCUMENTED"},
    {"id": "spi_one_year_baseline", "model_id": "eco-nojin.hydroma.drought-wmo",
     "category": "STATISTICAL_METHOD_ERROR",
     "expectation": "1-year record is INSUFFICIENT_CLIMATOLOGICAL_BASELINE for operational SPI",
     "status": "DOCUMENTED"},
    {"id": "wind_unit_kmh", "model_id": "eco-nojin.hydroma.fao56-et0",
     "category": "UNIT_ERROR",
     "expectation": "Open-Meteo wind (km/h, 10 m) must be converted to m/s at 2 m before FAO-56",
     "status": "DOCUMENTED"},
    {"id": "hargreaves_fao_disagreement", "model_id": "eco-nojin.hydroma.hargreaves-et0",
     "category": "SCIENTIFIC_VALIDATION_GAP",
     "expectation": "Hargreaves vs FAO-56 agreement is not validation",
     "status": "DOCUMENTED"},
]


def run_regression() -> List[Dict[str, Any]]:
    return [dict(c) for c in REGRESSION_CASES]