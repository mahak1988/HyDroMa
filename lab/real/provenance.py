"""Data provenance & uncertainty registry (lab-only, stdlib).

Single source of truth for the provenance of every data source the lab actually
uses, plus an uncertainty taxonomy and the canonical scientific-status token.

Design rules (REAL.4 / REAL-F05, REAL-F07):
- Fabricates NO numeric uncertainty: where the source provides no numeric
  uncertainty, the value is ``None`` / ``"UNKNOWN"`` (never an invented number).
- Never labels reanalysis/model-based data as observational ground truth.
- Distinguishes data / parameter / model-structure / climatic-sampling uncertainty.
- Exposes the canonical scientific status ``NOT_VALIDATED`` for every model.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

__all__ = [
    "SCIENTIFIC_STATUS",
    "DATA_SOURCES",
    "UNCERTAINTY_TAXONOMY",
    "STATUS_LEGEND",
    "build_provenance",
]

# Canonical scientific-status token. No HyDroMA model has independent, fit-for-use
# scientific/field validation evidence, so every model stays NOT_VALIDATED.
SCIENTIFIC_STATUS = "NOT_VALIDATED"

# Static, evidence-based description of the actually-used source.
# Open-Meteo Historical Weather API is a REANALYSIS / model-based product
# (ERA5-based downscaled reanalysis), NOT in-situ observational ground truth.
DATA_SOURCES: Dict[str, Dict[str, Any]] = {
    "open-meteo-archive": {
        "provider": "Open-Meteo",
        "product": "Historical Weather API (archive-api.open-meteo.com/v1/archive)",
        "data_type": "reanalysis_model_based",
        "is_observational_ground_truth": False,
        "variables": [
            {"id": "temperature_2m_max", "unit": "degC", "aggregation": "daily_max"},
            {"id": "temperature_2m_min", "unit": "degC", "aggregation": "daily_min"},
            {"id": "precipitation_sum", "unit": "mm", "aggregation": "daily_sum"},
            {"id": "shortwave_radiation_sum", "unit": "MJ_m2_day", "aggregation": "daily_sum"},
            {"id": "wind_speed_10m_mean", "unit": "kmh", "height_m": 10.0, "aggregation": "daily_mean"},
            {"id": "wind_speed_10m_max", "unit": "kmh", "height_m": 10.0, "aggregation": "daily_max"},
        ],
        "spatial_resolution": "UNKNOWN (gridded reanalysis; exact grid not stated by the lab)",
        "temporal_resolution": "daily",
        "license": "CC BY 4.0",
        "citation": "Open-Meteo (CC BY 4.0), https://open-meteo.com/",
        "known_limitations": [
            "Reanalysis/model-based, not in-situ observations; not ground truth.",
            "Point extraction from a grid; sub-grid and terrain effects unresolved.",
            "Wind is at 10 m; FAO-56 requires 2 m (converted in normalize.py).",
            "1-year record is INSUFFICIENT_CLIMATOLOGICAL_BASELINE for SPI/anomaly indices.",
        ],
        # Source provides no numeric uncertainty -> UNKNOWN, not fabricated.
        "numeric_uncertainty": None,
    }
}

# Uncertainty taxonomy: values are UNKNOWN or qualitative, never invented numerics.
UNCERTAINTY_TAXONOMY: List[Dict[str, str]] = [
    {"kind": "data_uncertainty",
     "definition": "measurement/reanalysis error of the input data",
     "value": "UNKNOWN"},
    {"kind": "parameter_uncertainty",
     "definition": "uncertainty in model parameters/coefficients",
     "value": "UNKNOWN"},
    {"kind": "model_structure_uncertainty",
     "definition": "uncertainty from model structure/equations",
     "value": "UNKNOWN"},
    {"kind": "climatic_sampling_uncertainty",
     "definition": "uncertainty from a short (1-year) record; not climatologically representative",
     "value": "HIGH (1-year record; INSUFFICIENT_CLIMATOLOGICAL_BASELINE)"},
]

# Clarifies that software/numerical/independence tokens are NOT scientific validation.
STATUS_LEGEND: Dict[str, str] = {
    "SOFTWARE_VERIFIED": "software behaves per spec; NOT scientific validation",
    "NUMERICALLY_REPRODUCED": "two code paths agree numerically; NOT predictive accuracy",
    "COMPUTATIONALLY_INDEPENDENT": "reference imports no engine code; NOT third-party review",
    "STRESS_VIOLATIONS_0": "no stress expectation broken; NOT model correctness",
    "NSE_1_0": "code-agreement in the cross-check; NOT forecast skill",
    SCIENTIFIC_STATUS: "no independent, fit-for-use scientific/field validation evidence",
}


def build_provenance(meta: Optional[Dict[str, Any]], kind: str) -> Dict[str, Any]:
    """Return a traceable provenance record for the actually-used data.

    ``kind`` is ``"real"`` (Open-Meteo cache) or ``"synthetic"`` (offline fallback).
    Merges the static source description with the cache metadata (fetched_at,
    fingerprint, location, period). Missing metadata is recorded as ``UNKNOWN``.
    """
    src = DATA_SOURCES["open-meteo-archive"]
    meta = meta or {}
    is_synthetic = kind == "synthetic"
    data_type = "synthetic_offline_fallback" if is_synthetic else src["data_type"]
    rec: Dict[str, Any] = {
        "source_key": "open-meteo-archive",
        "provider": src["provider"],
        "product": src["product"],
        "data_type": data_type,
        "is_observational_ground_truth": False,
        "variables": src["variables"],
        "spatial_resolution": src["spatial_resolution"],
        "temporal_resolution": src["temporal_resolution"],
        "location": meta.get("location", "UNKNOWN"),
        "period": meta.get("period", "UNKNOWN"),
        "fetched_at": meta.get("fetched_at", "UNKNOWN"),
        "cache_fingerprint": meta.get("fingerprint", "UNKNOWN"),
        "license": src["license"],
        "citation": src["citation"],
        "known_limitations": src["known_limitations"],
        "numeric_uncertainty": src["numeric_uncertainty"],
        "uncertainty": UNCERTAINTY_TAXONOMY,
        "scientific_status": SCIENTIFIC_STATUS,
    }
    if is_synthetic:
        rec["known_limitations"] = list(src["known_limitations"]) + [
            "SYNTHETIC offline fallback in use; not real data and not observations.",
        ]
    # Integrity guard: never present reanalysis/synthetic as ground truth.
    assert rec["is_observational_ground_truth"] is False
    assert rec["data_type"] != "observational"
    return rec