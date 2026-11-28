import json

from edi.errors import InvalidConfiguration, InvalidContract
from edi.registry import load_source_registry


def source(source_id="NASA_POWER"):
    return {
        "source_id": source_id,
        "provider": "NASA",
        "product": "POWER",
        "access_status": "OPERATIONAL",
        "evidence_status": "ACQUIRED",
        "authorization_status": "AUTHORIZED",
        "allowed_domains": ["power.larc.nasa.gov"],
    }


def test_registry(tmp_path):
    path = tmp_path / "registry.json"
    path.write_text(json.dumps({"sources": [source()]}), encoding="utf-8")
    registry = load_source_registry(path)
    assert registry.is_authorized("NASA_POWER")
    assert registry.allowed_domains() == ("power.larc.nasa.gov",)


def test_duplicate_source(tmp_path):
    path = tmp_path / "registry.json"
    path.write_text(json.dumps({"sources": [source("X"), source("X")]}), encoding="utf-8")
    try:
        load_source_registry(path)
    except InvalidConfiguration:
        pass
    else:
        raise AssertionError("expected InvalidConfiguration")


def test_invalid_status(tmp_path):
    bad = source("X")
    bad["access_status"] = "OPERATIONALISH"
    path = tmp_path / "registry.json"
    path.write_text(json.dumps({"sources": [bad]}), encoding="utf-8")
    try:
        load_source_registry(path)
    except InvalidContract:
        pass
    else:
        raise AssertionError("expected InvalidContract")