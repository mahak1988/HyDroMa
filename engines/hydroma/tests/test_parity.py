"""Cross-language parity: Python vs the actual TypeScript water-balance model.

Expected values in the shared vectors are independently derived (hand), not
produced by either implementation. This proves parity, not scientific validity.
"""

import json
import math
import pathlib
import shutil
import subprocess

import pytest

from hydroma.water_balance import compute_water_balance

_HERE = pathlib.Path(__file__).resolve().parent
_VECTORS = _HERE / "vectors" / "water_balance_vectors.json"
_HARNESS = _HERE / "parity_ts.mjs"
_DATA = json.loads(_VECTORS.read_text(encoding="utf-8"))
_TOL = _DATA["tolerance"]["float"]
_KEYS = _DATA["projection_keys"]


def _project(r: dict) -> dict:
    if not r.get("ok"):
        return {
            "ok": False, "status": None, "storageChangeMm": None, "storageChangeM3": None,
            "inflowMm": None, "outflowMm": None, "residualMm": None, "balanceCloses": None,
            "finalStorageMm": None, "outOfDomain": None, "warnings": [],
            "errors": sorted({e["code"] for e in r.get("errors", [])}),
        }
    x = r["result"]
    return {
        "ok": True, "status": x["status"], "storageChangeMm": x["storageChangeMm"],
        "storageChangeM3": x["storageChangeM3"], "inflowMm": x["inflowMm"],
        "outflowMm": x["outflowMm"], "residualMm": x["residualMm"],
        "balanceCloses": x["balanceCloses"], "finalStorageMm": x["finalStorageMm"],
        "outOfDomain": x["outOfDomain"],
        "warnings": sorted({w["code"] for w in r.get("warnings", [])}),
        "errors": [],
    }


def _assert_match(got: dict, exp: dict, ctx: str):
    for key in _KEYS:
        g, e = got[key], exp[key]
        if isinstance(e, float) or isinstance(g, float):
            assert math.isclose(g, e, abs_tol=_TOL), f"{ctx}: {key} got={g} exp={e}"
        else:
            assert g == e, f"{ctx}: {key} got={g!r} exp={e!r}"


@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_python_matches_expected(vec):
    _assert_match(_project(compute_water_balance(vec["input"])), vec["expected"], f"py:{vec['id']}")


@pytest.fixture(scope="module")
def ts_results():
    if shutil.which("node") is None:
        pytest.skip("node not available")
    proc = subprocess.run(
        ["node", str(_HARNESS), str(_VECTORS)],
        capture_output=True, text=True, timeout=120,
    )
    assert proc.returncode == 0, f"node harness failed: {proc.stderr}"
    return {r["id"]: r for r in json.loads(proc.stdout)}


@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_typescript_matches_expected(vec, ts_results):
    ts = ts_results[vec["id"]]
    _assert_match(ts, vec["expected"], f"ts:{vec['id']}")


@pytest.mark.parametrize("vec", _DATA["vectors"], ids=[v["id"] for v in _DATA["vectors"]])
def test_typescript_python_parity(vec, ts_results):
    py = _project(compute_water_balance(vec["input"]))
    ts = ts_results[vec["id"]]
    _assert_match(ts, py, f"parity:{vec['id']}")