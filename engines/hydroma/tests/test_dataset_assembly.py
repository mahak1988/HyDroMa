"""Scientific dataset assembly & model-input mapping (offline)."""

from hydroma.dataset_assembly import assemble_dataset, align_daily, map_to_model_input


def _obs(param, value, unit, day="2026-11-01", quality="VALID"):
    return {"parameter": param, "value": value, "unit": unit, "canonical_value": value,
            "canonical_unit": unit, "observed_at": f"{day}T00:00:00Z", "quality": quality,
            "source": "imported"}


def test_align_daily_is_exact_and_reports_missing():
    obs = [_obs("precipitation", 1, "mm", "2026-11-01"), _obs("precipitation", 2, "mm", "2026-11-03")]
    aligned, missing = align_daily(obs, "2026-11-01", "2026-11-03")
    assert len(aligned) == 2
    assert missing == ["2026-11-02"]


def test_assembly_readiness_and_model_mapping():
    obs = [
        _obs("air_temperature", 20, "degC"),
        _obs("relative_humidity", 50, "percent"),
        _obs("wind_speed", 2, "m_per_s"),
        _obs("solar_radiation", 20, "MJ_per_m2_day"),
    ]
    ds = assemble_dataset(dataset_id="d1", organization_id="o", farm_id="f", project_id=None,
                          start="2026-11-01", end="2026-11-01",
                          parameters=["air_temperature", "relative_humidity", "wind_speed", "solar_radiation"],
                          observations=obs)
    assert ds["readiness"] == "READY_FOR_MAPPING"
    assert ds["coverage"] == 1.0
    mapped = map_to_model_input(ds, "fao56_et0", "1.0.0")
    assert set(mapped["inputs"]) == {"temperature", "humidity", "wind", "radiation"}
    assert mapped["provenance"]["scientificStatus"] == "NOT_VALIDATED"


def test_missing_parameter_blocks_mapping():
    ds = assemble_dataset(dataset_id="d2", organization_id="o", farm_id=None, project_id=None,
                          start="2026-11-01", end="2026-11-01",
                          parameters=["air_temperature", "relative_humidity", "wind_speed", "solar_radiation"],
                          observations=[_obs("air_temperature", 20, "degC")])
    assert ds["readiness"] == "INCOMPLETE"
    try:
        map_to_model_input(ds, "fao56_et0", "1.0.0")
        assert False, "expected missing-input error"
    except ValueError:
        pass

def test_snapshot_fingerprint_deterministic_and_sensitive():
    from hydroma.dataset_assembly import snapshot_fingerprint
    a = {"modelId": "fao56_et0", "inputs": {"temperature": [{"timestamp": "2026-11-01", "value": 20}]}}
    b = {"inputs": {"temperature": [{"timestamp": "2026-11-01", "value": 20}]}, "modelId": "fao56_et0"}
    c = {"modelId": "fao56_et0", "inputs": {"temperature": [{"timestamp": "2026-11-01", "value": 21}]}}
    assert snapshot_fingerprint(a) == snapshot_fingerprint(b)
    assert snapshot_fingerprint(a) != snapshot_fingerprint(c)


def test_snapshot_fingerprint_known_vector():
    from hydroma.dataset_assembly import snapshot_fingerprint
    assert snapshot_fingerprint({"a": 1, "b": [2, 3]}) == "efbd0040190fb0871831e606c581f8a66db79d8e2bb836745a70051306956070"
