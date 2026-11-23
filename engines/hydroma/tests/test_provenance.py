from hydroma.provenance import (
    SCHEMA_VERSION,
    ProvenanceRecord,
    canonical_json,
    extract_model_parameters,
    sha256_json,
    sha256_text,
)
from hydroma.runtime import build_provenance
from hydroma.water_balance import WATER_BALANCE_DEFINITION, compute_water_balance
from hydroma.soil_water import SOIL_WATER_DEFINITION, compute_soil_water_storage


def test_sha256_deterministic():
    assert sha256_text("abc") == sha256_text("abc")
    assert sha256_json({"b": 1, "a": 2}) == sha256_json({"a": 2, "b": 1})
    assert len(sha256_text("abc")) == 64


def test_canonical_json_stable():
    assert canonical_json({"b": 1, "a": 2}) == canonical_json({"a": 2, "b": 1})
    assert " " not in canonical_json({"a": 1, "b": 2})


def test_materially_different_input_changes_hash():
    h1 = sha256_json({"precipitation": 100.0})
    h2 = sha256_json({"precipitation": 101.0})
    assert h1 != h2


def test_build_provenance_complete_with_schema():
    result = compute_water_balance(
        {"periodDays": 30, "precipitation": 100.0, "irrigation": 0.0,
         "runoff": 20.0, "evapotranspiration": 60.0}
    )
    prov = build_provenance("run-1", WATER_BALANCE_DEFINITION, "alice", {"x": 1}, result)
    assert prov["run_id"] == "run-1"
    assert prov["schema_version"] == SCHEMA_VERSION
    assert prov["scientific_status"] == "NOT_VALIDATED"
    assert len(prov["input_hashes"]) == 1
    assert len(prov["result_hashes"]) == 1
    assert prov["validation_status"] == "tested"

    record = ProvenanceRecord(**prov)
    assert record.is_complete() is True


def test_failed_execution_record_is_complete():
    record = ProvenanceRecord(
        run_id="r", model_id="m", model_version="1.0.0", code_version="0.1.0",
        input_hashes=["abc"], parameter_hash="none", environment="local",
        executed_at="2026-01-01T00:00:00+00:00", operator="alice",
        result_hashes=[], validation_status="tested",
        error={"code": "NUMERICAL_FAILURE", "message": "boom"},
    )
    assert record.is_complete() is True


def test_incomplete_record_rejected():
    record = ProvenanceRecord(
        run_id="r", model_id="m", model_version="1.0.0", code_version="0.1.0",
        input_hashes=[], parameter_hash="", environment="", executed_at="",
        operator="", result_hashes=[], validation_status="stub",
    )
    assert record.is_complete() is False


def test_canonical_unicode_stable():
    a = canonical_json({"name": "کشاورزی", "emoji": "🌱"})
    b = canonical_json({"emoji": "🌱", "name": "کشاورزی"})
    assert a == b
    assert sha256_json({"name": "کشاورزی"}) == sha256_json({"name": "کشاورزی"})


def test_canonical_nested_and_arrays_stable():
    a = canonical_json({"x": [1, 2, {"b": 3, "a": 4}], "y": {"z": [5, 6]}})
    b = canonical_json({"y": {"z": [5, 6]}, "x": [1, 2, {"a": 4, "b": 3}]})
    assert a == b


def test_material_and_numeric_edge_differences():
    # array order matters; 1 vs 1.0 serialise differently
    assert sha256_json([1, 2]) != sha256_json([2, 1])
    assert sha256_json({"v": 1}) != sha256_json({"v": 1.0})


def test_canonical_json_is_not_rfc8785():
    # Documented limitation: this is Python-oriented canonical JSON, not RFC 8785
    # (no number/string normalisation beyond sorted keys + compact separators).
    # Cross-language byte-identical hashing is therefore NOT claimed.
    assert canonical_json({"b": 1, "a": 2}) == '{"a":2,"b":1}'


# --- parameter_hash integrity (Phase 2.6) ----------------------------------

_SOIL_INPUT = {
    "layers": [{"thickness_mm": 300, "theta_fc": 0.30, "theta_wp": 0.10}],
    "p": 0.5,
    "rootZoneDepth": 300,
}


def test_parameter_hash_is_not_placeholder():
    result = compute_soil_water_storage(_SOIL_INPUT)
    prov = build_provenance("run-1", SOIL_WATER_DEFINITION, "alice", _SOIL_INPUT, result)
    assert prov["parameter_hash"] != "none"
    assert prov["parameter_hash"] == sha256_json(
        extract_model_parameters(SOIL_WATER_DEFINITION, _SOIL_INPUT)
    )
    assert len(prov["parameter_hash"]) == 64


def test_equivalent_parameters_produce_identical_hash():
    a = {"layers": [{"theta_fc": 0.3, "theta_wp": 0.1, "thickness_mm": 300}], "p": 0.5}
    b = {"p": 0.5, "layers": [{"thickness_mm": 300, "theta_wp": 0.1, "theta_fc": 0.3}]}
    pa = extract_model_parameters(SOIL_WATER_DEFINITION, a)
    pb = extract_model_parameters(SOIL_WATER_DEFINITION, b)
    assert sha256_json(pa) == sha256_json(pb)


def test_parameter_change_produces_different_hash():
    base = dict(_SOIL_INPUT)
    changed = dict(_SOIL_INPUT)
    changed["p"] = 0.6
    h1 = sha256_json(extract_model_parameters(SOIL_WATER_DEFINITION, base))
    h2 = sha256_json(extract_model_parameters(SOIL_WATER_DEFINITION, changed))
    assert h1 != h2


def test_parameter_hash_is_deterministic():
    result = compute_soil_water_storage(_SOIL_INPUT)
    p1 = build_provenance("run-1", SOIL_WATER_DEFINITION, "alice", _SOIL_INPUT, result)
    p2 = build_provenance("run-2", SOIL_WATER_DEFINITION, "bob", _SOIL_INPUT, result)
    assert p1["parameter_hash"] == p2["parameter_hash"]


def test_parameter_hash_does_not_alter_input_or_result_hashes():
    result = compute_soil_water_storage(_SOIL_INPUT)
    prov = build_provenance("run-1", SOIL_WATER_DEFINITION, "alice", _SOIL_INPUT, result)
    assert prov["input_hashes"] == [sha256_json(_SOIL_INPUT)]
    assert prov["result_hashes"] == [sha256_json(result)]


def test_model_without_parameter_object_is_explicit():
    # water-balance declares no parameters -> empty parameter object, hashed explicitly
    assert extract_model_parameters(WATER_BALANCE_DEFINITION, {"periodDays": 30}) == {}
    result = compute_water_balance(
        {"periodDays": 30, "precipitation": 100.0, "irrigation": 0.0,
         "runoff": 20.0, "evapotranspiration": 60.0}
    )
    prov = build_provenance("run-1", WATER_BALANCE_DEFINITION, "alice", {"x": 1}, result)
    assert prov["parameter_hash"] == sha256_json({})
    assert prov["parameter_hash"] != "none"


def test_extract_only_declared_parameters():
    inp = dict(_SOIL_INPUT)
    inp["unrelated_runtime_field"] = "should-be-ignored"
    params = extract_model_parameters(SOIL_WATER_DEFINITION, inp)
    assert set(params) == {"layers", "rootZoneDepth", "p"}
    assert "unrelated_runtime_field" not in params


def test_explicit_parameters_override():
    result = compute_soil_water_storage(_SOIL_INPUT)
    prov = build_provenance("run-1", SOIL_WATER_DEFINITION, "alice", _SOIL_INPUT, result,
                            parameters={"p": 0.5})
    assert prov["parameter_hash"] == sha256_json({"p": 0.5})


def test_provenance_schema_still_complete_and_backwards_compatible():
    result = compute_soil_water_storage(_SOIL_INPUT)
    prov = build_provenance("run-1", SOIL_WATER_DEFINITION, "alice", _SOIL_INPUT, result)
    assert prov["schema_version"] == SCHEMA_VERSION
    record = ProvenanceRecord(**prov)
    assert record.is_complete() is True
    # no new required fields were introduced
    assert set(prov) == {
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator", "result_hashes",
        "validation_status", "schema_version", "scientific_status", "input_units", "error",
        "seed",
    }


def test_runtime_execution_parameter_hash_integrity():
    from hydroma.jobs import JobStore
    from hydroma.runtime import build_registry, execute_run

    reg = build_registry()
    store = JobStore(":memory:")
    # model WITH parameters
    run_id = store.create_run("eco-nojin.hydroma.soil-water-storage", "1.0.0", "alice", _SOIL_INPUT)
    run = execute_run(store, run_id, reg)
    assert run["status"] == "completed"
    prov = run["provenance_json"]
    assert prov["parameter_hash"] == sha256_json(extract_model_parameters(SOIL_WATER_DEFINITION, _SOIL_INPUT))
    assert prov["parameter_hash"] != "none"

    # model WITHOUT parameters
    wb_input = {"periodDays": 30, "precipitation": 100.0, "irrigation": 0.0,
                "runoff": 20.0, "evapotranspiration": 60.0}
    wb_version = reg.get("eco-nojin.hydroma.water-balance")["definition"]["version"]
    run_id2 = store.create_run("eco-nojin.hydroma.water-balance", wb_version, "bob", wb_input)
    run2 = execute_run(store, run_id2, reg)
    assert run2["status"] == "completed"
    assert run2["provenance_json"]["parameter_hash"] == sha256_json({})