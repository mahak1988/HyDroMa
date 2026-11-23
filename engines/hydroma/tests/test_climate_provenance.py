"""FE-3.19.5 provenance dependency-chain tests (software only; NOT validation).

Verifies that the climate provenance hashes form a genuine, mutation-sensitive
dependency chain and that the relationships survive JSON serialization/replay.
"""

import json

import pytest

from hydroma.climate import ClimateObservation, ClimateSeries
from hydroma.climate_qc_integration import (
    ingest_and_accept_climate,
    run_gated_simulation_from_climate,
    verify_climate_provenance,
)
from hydroma.ingest import ClimateIngestionConfig
from hydroma.quality import QualityControlPolicy

PS = "2026-01-01T00:00:00Z"
PE = "2026-01-02T00:00:00Z"
PE2 = "2026-01-03T00:00:00Z"
_LAYERS = [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}]


def _obs(value=10.0, ts=PE, acc=(PS, PE), source=None, unit="mm"):
    return ClimateObservation("precipitation", value, unit, ts, "daily_sum",
                              accumulation_start=acc[0], accumulation_end=acc[1], source=source)


def _spec(steps=None):
    steps = steps or [{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}]
    return {"layers": _LAYERS, "initial_storage_mm": 60.0, "steps": steps}


def _prov(series, spec=None, qc_policy=None, unit_policy="LEGACY"):
    r = run_gated_simulation_from_climate(
        series, ClimateIngestionConfig(format="memory"), spec or _spec(), qc_policy=qc_policy, unit_policy=unit_policy
    )
    assert r["status"] == "COMPLETED", r
    return r["provenance"], r


# --- structure & verification ---------------------------------------------

def test_provenance_chain_fields_present_and_distinct():
    prov, _ = _prov(ClimateSeries([_obs()]))
    for key in ("raw_source_hash", "normalized_series_hash", "qc_policy_hash", "qc_report_hash",
                "acceptance_hash", "accepted_series_hash", "mapping_hash",
                "simulation_input_hash", "final_result_hash"):
        assert prov.get(key), key
    hashes = [prov[k] for k in ("raw_source_hash", "normalized_series_hash", "qc_policy_hash",
                                "qc_report_hash", "acceptance_hash", "mapping_hash",
                                "simulation_input_hash", "final_result_hash")]
    assert len(set(hashes)) >= 6


def test_provenance_verifies():
    prov, _ = _prov(ClimateSeries([_obs()]))
    assert verify_climate_provenance(prov) == {"valid": True, "errors": []}


def test_provenance_survives_json_roundtrip():
    prov, _ = _prov(ClimateSeries([_obs()]))
    reloaded = json.loads(json.dumps(prov))
    assert verify_climate_provenance(reloaded)["valid"] is True


# --- mutation matrix -------------------------------------------------------

def test_mutation_source_identity():
    a, _ = _prov(ClimateSeries([_obs(source={"id": "station-A"})]))
    b, _ = _prov(ClimateSeries([_obs(source={"id": "station-B"})]))
    assert a["raw_source_hash"] != b["raw_source_hash"]
    assert a["acceptance_hash"] != b["acceptance_hash"]


def test_mutation_precip_value():
    a, _ = _prov(ClimateSeries([_obs(value=10.0)]))
    b, _ = _prov(ClimateSeries([_obs(value=20.0)]))
    for key in ("raw_source_hash", "normalized_series_hash", "acceptance_hash",
                "mapping_hash", "simulation_input_hash", "final_result_hash"):
        assert a[key] != b[key], key


def test_mutation_accumulation_interval_changes_accepted_hash():
    a = ingest_and_accept_climate(ClimateSeries([_obs(acc=(PS, PE))]), ClimateIngestionConfig(format="memory"))
    b = ingest_and_accept_climate(ClimateSeries([_obs(acc=(PS, "2026-01-02T01:00:00Z"))]), ClimateIngestionConfig(format="memory"))
    assert a["provenance"]["normalized_dataset_hash"] != b["provenance"]["normalized_dataset_hash"]
    # the accepted-series hash feeds acceptance_hash in the binding provenance
    other_end = "2026-01-02T01:00:00Z"
    pa, _ = _prov(ClimateSeries([_obs(ts=PE, acc=(PS, PE))]),
                  _spec([{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}]))
    pb, _ = _prov(ClimateSeries([_obs(ts=other_end, acc=(PS, other_end))]),
                  _spec([{"period_start": PS, "period_end": other_end, "et_actual_mm": 5.0}]))
    assert pa["acceptance_hash"] != pb["acceptance_hash"]
    assert pa["mapping_hash"] != pb["mapping_hash"]


def test_mutation_qc_policy():
    p1 = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    p2 = QualityControlPolicy(thresholds={"air_temperature": {"min": -20, "max": 60}})
    a, _ = _prov(ClimateSeries([_obs()]), qc_policy=p1)
    b, _ = _prov(ClimateSeries([_obs()]), qc_policy=p2)
    assert a["qc_policy_hash"] != b["qc_policy_hash"]
    assert a["acceptance_hash"] != b["acceptance_hash"]


def test_mutation_qc_report():
    clean = ClimateSeries([_obs(value=10.0)])
    warned = ClimateSeries([_obs(value=10.0),
                            ClimateObservation("air_temperature", 60.0, "degC", PE, "daily_mean")])
    policy = QualityControlPolicy(thresholds={"air_temperature": {"min": -10, "max": 50}})
    a, _ = _prov(clean, qc_policy=policy)
    b, _ = _prov(warned, qc_policy=policy)
    assert a["qc_report_hash"] != b["qc_report_hash"]
    assert a["acceptance_hash"] != b["acceptance_hash"]


def test_mutation_acceptance_outcome():
    missing = ClimateSeries([ClimateObservation("precipitation", 10.0, "", PE, "daily_sum",
                                                accumulation_start=PS, accumulation_end=PE)])
    legacy = ingest_and_accept_climate(missing, ClimateIngestionConfig(format="memory"), unit_policy="LEGACY")
    strict = ingest_and_accept_climate(missing, ClimateIngestionConfig(format="memory"), unit_policy="STRICT")
    assert (legacy["status"], legacy["reason_code"]) != (strict["status"], strict["reason_code"])
    assert legacy["provenance"]["result_hash"] != strict["provenance"]["result_hash"]


def test_mutation_mapping_version(monkeypatch):
    import hydroma.climate_qc_integration as cqi
    a, _ = _prov(ClimateSeries([_obs()]))
    monkeypatch.setattr(cqi, "MAPPING_VERSION", "2.0.0")
    b, _ = _prov(ClimateSeries([_obs()]))
    assert a["mapping_hash"] != b["mapping_hash"]
    assert a["simulation_input_hash"] != b["simulation_input_hash"]


@pytest.mark.parametrize("field,value", [("et_actual_mm", 7.0), ("irrigation_mm", 3.0), ("runoff_mm", 2.0)])
def test_mutation_flux(field, value):
    a, _ = _prov(ClimateSeries([_obs()]), _spec([{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}]))
    b, _ = _prov(ClimateSeries([_obs()]),
                 _spec([{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0, field: value}]))
    assert a["simulation_input_hash"] != b["simulation_input_hash"], field
    assert a["final_result_hash"] != b["final_result_hash"], field


def test_mutation_period_boundaries():
    one = _spec([{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}])
    two = _spec([
        {"period_start": PS, "period_end": PE, "et_actual_mm": 5.0},
        {"period_start": PE, "period_end": PE2, "et_actual_mm": 5.0},
    ])
    series = ClimateSeries([_obs(acc=(PS, PE)), _obs(ts=PE2, acc=(PE, PE2))])
    a, _ = _prov(series, one)
    b, _ = _prov(series, two)
    assert a["mapping_hash"] != b["mapping_hash"]
    assert a["simulation_input_hash"] != b["simulation_input_hash"]


def test_mutation_step_result():
    a, _ = _prov(ClimateSeries([_obs()]), _spec([{"period_start": PS, "period_end": PE, "et_actual_mm": 5.0}]))
    b, _ = _prov(ClimateSeries([_obs()]), _spec([{"period_start": PS, "period_end": PE, "et_actual_mm": 9.0}]))
    assert a["final_result_hash"] != b["final_result_hash"]


# --- tamper detection ------------------------------------------------------

def test_tamper_acceptance_payload_detected():
    prov, _ = _prov(ClimateSeries([_obs()]))
    tampered = json.loads(json.dumps(prov))
    tampered["payloads"]["acceptance"]["accepted_series_hash"] = "tampered"
    result = verify_climate_provenance(tampered)
    assert result["valid"] is False
    assert {"code": "ACCEPTANCE_HASH_MISMATCH"} in result["errors"]


def test_tamper_mapping_payload_detected():
    prov, _ = _prov(ClimateSeries([_obs()]))
    tampered = json.loads(json.dumps(prov))
    tampered["payloads"]["mapping"]["steps"][0]["precip_observation"]["value"] = 999.0
    result = verify_climate_provenance(tampered)
    assert result["valid"] is False
    assert {"code": "MAPPING_HASH_MISMATCH"} in result["errors"]


def test_tamper_simulation_input_payload_detected():
    prov, _ = _prov(ClimateSeries([_obs()]))
    tampered = json.loads(json.dumps(prov))
    tampered["payloads"]["simulation_input"]["sim_input"]["steps"][0]["precipitation_mm"] = 999.0
    result = verify_climate_provenance(tampered)
    assert result["valid"] is False
    assert {"code": "SIMULATION_INPUT_HASH_MISMATCH"} in result["errors"]


def test_step_result_hash_is_verified():
    prov, _ = _prov(ClimateSeries([_obs()]))
    # step hashes and final result hash must be present and verify on a fresh record
    assert prov["step_input_hashes"]
    assert verify_climate_provenance(prov)["valid"] is True


def test_tamper_step_result_detected():
    prov, _ = _prov(ClimateSeries([_obs()]))
    tampered = json.loads(json.dumps(prov))
    tampered["payloads"]["simulation_result"]["steps"][0]["final_storage_mm"] += 5.0
    result = verify_climate_provenance(tampered)
    assert result["valid"] is False
    assert {"code": "STEP_HASH_MISMATCH"} in result["errors"]
    assert {"code": "FINAL_RESULT_HASH_MISMATCH"} in result["errors"]