"""Execution environment manifest & determinism contract (offline)."""

from hydroma.execution_manifest import (
    MANIFEST_SCHEMA_VERSION,
    assess_repeatability,
    build_manifest,
    manifest_fingerprint,
    validate_manifest,
)


def test_manifest_schema_and_identity():
    m = build_manifest("fao56_et0", "1.0.0")
    assert m["schemaVersion"] == MANIFEST_SCHEMA_VERSION
    assert m["engine"]["modelId"] == "fao56_et0"
    assert m["engine"]["modelVersion"] == "1.0.0"
    assert validate_manifest(m) == []
    assert m["runtime"]["pythonVersion"].startswith("3.")
    assert m["dependencies"]["resolved"]["hydroma"] != "unavailable"


def test_unknown_values_are_explicit():
    m = build_manifest("unknown_model", "9.9.9")
    assert "model_source_fingerprint" in m["unavailable"]
    assert "source_revision" in m["unavailable"]
    assert m["engine"]["modelSourceFingerprint"] is None


def test_fingerprint_deterministic_and_sensitive():
    a = build_manifest("fao56_et0", "1.0.0")
    b = build_manifest("fao56_et0", "1.0.0")
    assert manifest_fingerprint(a) == manifest_fingerprint(b)
    c = build_manifest("fao56_et0", "1.0.1")
    assert manifest_fingerprint(a) != manifest_fingerprint(c)


def test_invalid_manifest_rejected():
    m = build_manifest("fao56_et0", "1.0.0")
    m["schemaVersion"] = "0.0.1"
    assert any("schemaVersion" in e for e in validate_manifest(m))
    m2 = build_manifest("fao56_et0", "1.0.0")
    m2["engine"] = {}
    assert any("modelId" in e for e in validate_manifest(m2))


def test_repeatability_is_exact():
    r = assess_repeatability(lambda inp: {"x": inp["x"] * 2}, {"x": 3}, runs=3)
    assert r["deterministic"] is True
    assert r["comparison"] == "exact-canonical"