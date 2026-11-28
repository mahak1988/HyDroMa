"""Tests for REAL.4 provenance & scientific-status integrity (offline, no pytest)."""

import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
sys.path.insert(0, LAB)
sys.path.insert(0, os.path.join(os.path.dirname(LAB), "..", "engines", "hydroma"))

from provenance import (  # noqa: E402
    build_provenance, DATA_SOURCES, UNCERTAINTY_TAXONOMY, SCIENTIFIC_STATUS, STATUS_LEGEND,
)
from spi_spei import spei  # noqa: E402

REAL_META = {
    "fetched_at": "2026-11-27T22:32:13.756943+00:00",
    "fingerprint": "6d5fc9db636f3b10",
    "location": {"latitude": 35.7, "longitude": 51.4},
    "period": {"start": "2023-01-01", "end": "2023-12-31"},
}

RESULTS_JSON = os.path.join(LAB, "reports", "phase-real-2-results.json")


def test_provenance_present_for_used_source():
    rec = build_provenance(REAL_META, "real")
    for field in ("provider", "product", "variables", "license", "citation",
                  "location", "period", "fetched_at", "cache_fingerprint"):
        assert rec[field] not in (None, "", "UNKNOWN"), field
    assert rec["data_type"] == "reanalysis_model_based"


def test_no_fabricated_uncertainty_number():
    rec = build_provenance(REAL_META, "real")
    # Source provides no numeric uncertainty -> must stay None (UNKNOWN), not invented.
    assert rec["numeric_uncertainty"] is None
    for u in rec["uncertainty"]:
        assert not isinstance(u["value"], (int, float)), u
    # Taxonomy must distinguish the four uncertainty kinds.
    kinds = {u["kind"] for u in UNCERTAINTY_TAXONOMY}
    assert kinds == {"data_uncertainty", "parameter_uncertainty",
                     "model_structure_uncertainty", "climatic_sampling_uncertainty"}


def test_reanalysis_and_synthetic_are_not_ground_truth():
    for kind in ("real", "synthetic"):
        rec = build_provenance(REAL_META if kind == "real" else {}, kind)
        assert rec["is_observational_ground_truth"] is False
        assert rec["data_type"] != "observational"
    assert build_provenance({}, "synthetic")["data_type"] == "synthetic_offline_fallback"


def test_scientific_status_is_not_validated():
    assert SCIENTIFIC_STATUS == "NOT_VALIDATED"
    # Software/numerical/independence tokens must be documented as NOT validation.
    for token in ("SOFTWARE_VERIFIED", "NUMERICALLY_REPRODUCED", "COMPUTATIONALLY_INDEPENDENT"):
        assert token in STATUS_LEGEND


def test_anomaly_name_preserved_not_spei():
    r = spei([1, 2, 3, 4, 5])
    assert "anomaly" in r["method"].lower()
    assert "NOT conventional SPEI" in r["method"]


def test_results_json_carries_provenance_and_not_validated():
    if not os.path.exists(RESULTS_JSON):
        return  # not generated yet in this environment
    d = json.load(open(RESULTS_JSON, encoding="utf-8"))
    assert d["scientific_status"] == "NOT_VALIDATED"
    prov = d["data_provenance"]
    assert prov["is_observational_ground_truth"] is False
    assert prov["numeric_uncertainty"] is None
    # Software/numerical evidence must not be reported as scientific validation.
    assert d["evidence"]["scientific_validation"] == "NOT_VALIDATED"
    assert d["evidence"]["field_validation"] == "NOT_VALIDATED"
    # F5 retraction must be preserved.
    assert any(x["id"] == "F5" for x in d.get("retractions", []))


def test_data_sources_registry_is_non_observational():
    for src in DATA_SOURCES.values():
        assert src["is_observational_ground_truth"] is False
        assert src["numeric_uncertainty"] is None