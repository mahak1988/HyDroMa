"""Scientific model-evaluation framework & reference dataset contract (Phase 3.26).

Lightweight, deterministic infrastructure for comparing model outputs with
reference/observational data. It does **not** scientifically validate any model:
computing metrics never changes model maturity or scientific status.

Components
----------
* Dataset contract (``validate_dataset`` / ``dataset_hash``): explicit
  ``dataset_id``, ``version``, ``role`` (REFERENCE|CALIBRATION|VALIDATION|EVALUATION),
  ``variable``, ``unit``, and observations with ``value``, ``unit``, ``timestamp``,
  optional ``spatial_id``/``quality_flag``/``uncertainty``/``source``/``method``.
  Missing values are represented explicitly (``value=None`` / ``quality_flag="missing"``);
  nothing is inferred.
* Matching (``match_model_outputs``): deterministic match by variable, unit, time
  (exact, or within an explicit tolerance) and optional spatial id. No implicit
  interpolation, resampling or timezone normalization.
* Metrics (``compute_metrics``): MAE, RMSE, Bias, NSE, KGE with structured statuses
  (OK / NO_DATA / UNDEFINED_ZERO_VARIANCE / UNDEFINED_INSUFFICIENT_SAMPLE / UNDEFINED).
* Evaluation report (``evaluate_model_output``): model/dataset identity + hashes,
  matching results, metric values/statuses, sample/missing/excluded counts,
  limitations, and a deterministic ``result_hash`` verified by
  ``verify_evaluation_report``.

Software-tested; scientific status **NOT_VALIDATED**.
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

from .provenance import sha256_json

__all__ = [
    "EVALUATION_MODEL",
    "EVALUATION_DEFINITION",
    "ROLES",
    "QUALITY_FLAGS",
    "validate_dataset",
    "dataset_hash",
    "assess_dataset_independence",
    "build_evaluation_protocol",
    "verify_evaluation_protocol",
    "build_evaluation_protocol_adapter",
    "EVALUATION_PROTOCOL_DEFINITION",
    "match_model_outputs",
    "extract_model_outputs",
    "compute_metrics",
    "evaluate_model_output",
    "evaluate_run",
    "verify_evaluation_report",
    "evaluate_model_outputs_adapter",
]

ROLES = ("REFERENCE", "CALIBRATION", "VALIDATION", "EVALUATION")
QUALITY_FLAGS = ("valid", "suspect", "unchecked", "invalid", "missing")
USABLE_QUALITY = {"valid", "suspect", "unchecked"}
EXCLUDED_QUALITY = {"invalid", "missing"}

EVALUATION_MODEL = {
    "id": "eco-nojin.hydroma.model-evaluation",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
}

ASSUMPTIONS = [
    "explicit_dataset_contract",
    "no_inferred_values_units_or_locations",
    "deterministic_matching",
    "no_implicit_interpolation_or_resampling",
    "metrics_do_not_validate",
]
LIMITATIONS = [
    "notValidated",
    "does_not_change_model_maturity",
    "no_calibration_optimizer",
    "no_automatic_validation",
    "calibration_and_validation_must_be_distinct",
    "metric_appropriateness_is_dataset_specific",
]
REFERENCES = [
    "Nash, J.E., Sutcliffe, J.V. (1970). River flow forecasting through conceptual models. Journal of Hydrology.",
    "Gupta, H.V., Kling, H., Yilmaz, K.K., Martinez, G.F. (2012). Decomposition of the mean squared error and NSE performance criteria. Journal of Hydrology.",
]


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def _parse_ts(value) -> Optional[datetime]:
    if value is None:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def _round(value, decimals: int = 6):
    if value is None:
        return None
    factor = 10 ** decimals
    return math.floor(float(value) * factor + 0.5) / factor


def _json_safe(obj):
    import json
    return json.loads(json.dumps(obj, default=str))


# --- dataset contract ------------------------------------------------------

def _canonical_dataset(dataset: dict) -> Dict[str, Any]:
    observations = []
    for o in dataset.get("observations", []) or []:
        observations.append({
            "variable": o.get("variable"),
            "value": o.get("value"),
            "unit": o.get("unit"),
            "timestamp": o.get("timestamp"),
            "spatial_id": o.get("spatial_id"),
            "quality_flag": o.get("quality_flag", "unchecked"),
            "uncertainty": o.get("uncertainty"),
            "source": o.get("source"),
            "method": o.get("method"),
        })
    return {
        "dataset_id": dataset.get("dataset_id"),
        "version": dataset.get("version"),
        "role": dataset.get("role"),
        "variable": dataset.get("variable"),
        "unit": dataset.get("unit"),
        "spatial_id": dataset.get("spatial_id"),
        "timezone": dataset.get("timezone"),
        "source": dataset.get("source"),
        "method": dataset.get("method"),
        "observations": observations,
    }


def validate_dataset(dataset: Any) -> Dict[str, Any]:
    """Validate a dataset contract. Returns ``{"valid", "errors", "warnings"}``."""
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []
    if not isinstance(dataset, dict):
        return {"valid": False, "errors": [{"code": "INVALID_DATASET", "message": "dataset must be an object"}], "warnings": []}
    if not dataset.get("dataset_id"):
        errors.append({"code": "MISSING_DATASET_ID", "field": "dataset_id"})
    if not dataset.get("version"):
        errors.append({"code": "MISSING_VERSION", "field": "version"})
    if dataset.get("role") not in ROLES:
        errors.append({"code": "INVALID_ROLE", "field": "role", "allowed": list(ROLES)})
    variable = dataset.get("variable")
    if not variable:
        errors.append({"code": "MISSING_VARIABLE", "field": "variable"})
    unit = dataset.get("unit")
    if not unit:
        errors.append({"code": "MISSING_UNIT", "field": "unit"})

    observations = dataset.get("observations")
    if not isinstance(observations, list):
        errors.append({"code": "INVALID_OBSERVATIONS", "field": "observations"})
        return {"valid": False, "errors": errors, "warnings": warnings}

    seen: Dict[tuple, int] = {}
    for i, o in enumerate(observations):
        if not isinstance(o, dict):
            errors.append({"code": "INVALID_OBSERVATION", "index": i})
            continue
        if o.get("variable") != variable:
            errors.append({"code": "VARIABLE_MISMATCH", "index": i, "expected": variable, "got": o.get("variable")})
        if o.get("unit") != unit:
            errors.append({"code": "UNIT_MISMATCH", "index": i, "expected": unit, "got": o.get("unit")})
        if _parse_ts(o.get("timestamp")) is None:
            errors.append({"code": "INVALID_TIMESTAMP", "index": i, "timestamp": o.get("timestamp")})
        val = o.get("value")
        if val is not None and not _finite(val):
            errors.append({"code": "NON_FINITE_VALUE", "index": i})
        q = o.get("quality_flag", "unchecked")
        if q not in QUALITY_FLAGS:
            errors.append({"code": "INVALID_QUALITY_FLAG", "index": i, "quality_flag": q})
        unc = o.get("uncertainty")
        if unc is not None and not _finite(unc):
            errors.append({"code": "NON_FINITE_UNCERTAINTY", "index": i})
        key = (o.get("variable"), o.get("unit"), o.get("timestamp"), o.get("spatial_id"))
        if key in seen:
            warnings.append({"code": "DUPLICATE_OBSERVATION", "index": i, "first_index": seen[key]})
        else:
            seen[key] = i
    return {"valid": len(errors) == 0, "errors": errors, "warnings": warnings}


def dataset_hash(dataset: dict) -> str:
    return sha256_json(_json_safe(_canonical_dataset(dataset)))


# --- dataset independence controls -----------------------------------------

def _obs_identity(o: dict):
    oid = o.get("observation_id")
    if oid is not None:
        return ("id", str(oid))
    return ("tuple", o.get("variable"), o.get("unit"), o.get("timestamp"), o.get("spatial_id"))


def assess_dataset_independence(dataset_a: dict, dataset_b: dict) -> Dict[str, Any]:
    """Conservatively assess potential independence conflicts between two datasets.

    Status precedence: ``OVERLAP_DETECTED`` > ``POTENTIAL_OVERLAP`` >
    ``INDETERMINATE`` > ``INDEPENDENT``. A lack of matching identifiers never
    proves scientific independence; insufficient metadata yields ``INDETERMINATE``.
    """
    conflicts: List[Dict[str, Any]] = []
    indicators: List[Dict[str, Any]] = []
    indeterminate: List[str] = []

    for label, ds in (("a", dataset_a), ("b", dataset_b)):
        if not ds.get("dataset_id"):
            indeterminate.append(f"{label}:missing_dataset_id")
        if not ds.get("version"):
            indeterminate.append(f"{label}:missing_version")

    role_a, role_b = dataset_a.get("role"), dataset_b.get("role")
    if role_a and role_b and role_a == role_b:
        indicators.append({"type": "SAME_ROLE", "role": role_a})

    obs_a = dataset_a.get("observations") or []
    obs_b = dataset_b.get("observations") or []

    keys_a: Dict[tuple, list] = {}
    for o in obs_a:
        keys_a.setdefault(_obs_identity(o), []).append(o)
    identity_overlap = []
    for o in obs_b:
        k = _obs_identity(o)
        if k in keys_a:
            identity_overlap.append({"key": k, "a": keys_a[k][0], "b": o})
    if identity_overlap:
        conflicts.append({"type": "OBSERVATION_IDENTITY_OVERLAP",
                          "count": len(identity_overlap), "examples": identity_overlap[:3]})

    oid_a = [o.get("observation_id") for o in obs_a]
    oid_b = [o.get("observation_id") for o in obs_b]
    if (any(x is None for x in oid_a) or any(x is None for x in oid_b)) and \
       (any(x is not None for x in oid_a) or any(x is not None for x in oid_b)):
        indeterminate.append("partial_observation_id")

    ts_a = [o.get("timestamp") for o in obs_a]
    ts_b = [o.get("timestamp") for o in obs_b]
    if any(t is None for t in ts_a) or any(t is None for t in ts_b):
        indeterminate.append("missing_timestamp")
    ts_overlap = set(t for t in ts_a if t) & set(t for t in ts_b if t)
    if ts_overlap:
        indicators.append({"type": "TIMESTAMP_OVERLAP", "count": len(ts_overlap)})

    sp_a = [o.get("spatial_id") for o in obs_a]
    sp_b = [o.get("spatial_id") for o in obs_b]
    has_sp_a = any(x is not None for x in sp_a)
    has_sp_b = any(x is not None for x in sp_b)
    if has_sp_a != has_sp_b:
        indeterminate.append("spatial_metadata_mismatch")
    elif has_sp_a and has_sp_b:
        if any(x is None for x in sp_a) or any(x is None for x in sp_b):
            indeterminate.append("partial_spatial_id")
        sp_overlap = set(x for x in sp_a if x) & set(x for x in sp_b if x)
        if sp_overlap:
            indicators.append({"type": "SPATIAL_OVERLAP", "count": len(sp_overlap)})

    if conflicts:
        status = "OVERLAP_DETECTED"
    elif indicators:
        status = "POTENTIAL_OVERLAP"
    elif indeterminate:
        status = "INDETERMINATE"
    else:
        status = "INDEPENDENT"

    return {
        "status": status,
        "conflicts": conflicts,
        "indicators": indicators,
        "indeterminate_reasons": indeterminate,
        "limitations": [
            "assessment uses only supplied metadata",
            "no evidence of overlap is NOT proof of scientific independence",
        ],
    }


# --- evaluation protocol ---------------------------------------------------

def build_evaluation_protocol(model: Optional[dict], dataset: dict,
                              reference_dataset: Optional[dict] = None,
                              variable: Optional[str] = None, unit: Optional[str] = None,
                              matching: Optional[dict] = None,
                              expected_role: Optional[str] = None) -> Dict[str, Any]:
    """Prepare a deterministic evaluation protocol (no scientific validation)."""
    model = model or {}
    protocol: Dict[str, Any] = {
        "protocol_id": "eco-nojin.hydroma.evaluation-protocol",
        "version": "1.0.0",
        "model": {"id": model.get("id"), "version": model.get("version"),
                  "scientific_status": model.get("scientific_status", "NOT_VALIDATED")},
        "datasets": [
            {"dataset_id": dataset.get("dataset_id"), "version": dataset.get("version"),
             "role": dataset.get("role"), "hash": dataset_hash(dataset)},
        ],
        "variable": variable or dataset.get("variable"),
        "unit": unit or dataset.get("unit"),
        "matching": matching or {},
        "expected_role": expected_role,
        "scientific_status": "NOT_VALIDATED",
    }
    if reference_dataset is not None:
        protocol["datasets"].append({
            "dataset_id": reference_dataset.get("dataset_id"),
            "version": reference_dataset.get("version"),
            "role": reference_dataset.get("role"),
            "hash": dataset_hash(reference_dataset),
        })
        protocol["independence"] = assess_dataset_independence(dataset, reference_dataset)

    indep = protocol.get("independence")
    if indep is None or indep["status"] == "INDEPENDENT":
        protocol["status"] = "READY"
    elif indep["status"] == "OVERLAP_DETECTED":
        protocol["status"] = "CONFLICT"
    else:
        protocol["status"] = "INDETERMINATE"

    protocol["limitations"] = [
        "protocol preparation does not scientifically validate any model",
        "independence assessment uses only supplied metadata",
        "no evidence of overlap is not proof of scientific independence",
    ]
    protocol["protocol_hash"] = sha256_json(_json_safe({k: v for k, v in protocol.items() if k != "protocol_hash"}))
    return protocol


def verify_evaluation_protocol(protocol: Optional[dict]) -> Dict[str, Any]:
    if not isinstance(protocol, dict):
        return {"valid": False, "errors": [{"code": "INVALID_PROTOCOL"}]}
    core = {k: v for k, v in protocol.items() if k != "protocol_hash"}
    if protocol.get("protocol_hash") != sha256_json(_json_safe(core)):
        return {"valid": False, "errors": [{"code": "PROTOCOL_HASH_MISMATCH"}]}
    return {"valid": True, "errors": []}


def build_evaluation_protocol_adapter(input_data: dict) -> dict:
    input_data = input_data or {}
    return _json_safe(build_evaluation_protocol(
        input_data.get("model"),
        input_data.get("dataset"),
        input_data.get("reference_dataset"),
        input_data.get("variable"),
        input_data.get("unit"),
        input_data.get("matching"),
        input_data.get("expected_role"),
    ))


EVALUATION_PROTOCOL_DEFINITION = {
    "id": "eco-nojin.hydroma.evaluation-protocol",
    "version": "1.0.0",
    "domain": "simulation",
    "title": "Scientific evaluation protocol & dataset-independence controls",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "inputs": [
        {"name": "model", "kind": "object", "required": False, "description": "{id, version}"},
        {"name": "dataset", "kind": "object", "required": True, "description": "primary dataset contract"},
        {"name": "reference_dataset", "kind": "object", "required": False, "description": "second dataset for independence assessment"},
        {"name": "variable", "kind": "string", "required": False},
        {"name": "unit", "kind": "string", "required": False},
        {"name": "matching", "kind": "object", "required": False},
        {"name": "expected_role", "kind": "string", "required": False},
    ],
    "outputs": [
        {"name": "status", "kind": "string", "description": "READY | INDETERMINATE | CONFLICT"},
        {"name": "independence", "kind": "object", "description": "INDEPENDENT | POTENTIAL_OVERLAP | OVERLAP_DETECTED | INDETERMINATE"},
        {"name": "protocol_hash", "kind": "string"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS + ["independence_not_scientifically_proven"],
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_evaluation_protocol.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}


# --- matching --------------------------------------------------------------

def match_model_outputs(model_outputs: Any, dataset: dict, config: Optional[dict] = None) -> Dict[str, Any]:
    """Deterministically match model outputs to dataset observations."""
    config = config or {}
    variable = config.get("variable", dataset.get("variable"))
    unit = config.get("unit", dataset.get("unit"))
    time_tol = float(config.get("time_tolerance_seconds", 0.0) or 0.0)
    require_spatial = bool(config.get("require_spatial", False))
    spatial_id = config.get("spatial_id", dataset.get("spatial_id"))

    observations = dataset.get("observations", []) or []
    matched: List[dict] = []
    unmatched_model: List[dict] = []
    exclusions: List[dict] = []
    used = set()

    for mo in model_outputs or []:
        if not isinstance(mo, dict):
            unmatched_model.append({"output": mo, "reason": "INVALID_OUTPUT"})
            continue
        if mo.get("variable") != variable:
            unmatched_model.append({**mo, "reason": "VARIABLE_MISMATCH"})
            continue
        if mo.get("unit") != unit:
            unmatched_model.append({**mo, "reason": "UNIT_MISMATCH"})
            continue
        if spatial_id is not None:
            if mo.get("spatial_id") != spatial_id:
                unmatched_model.append({**mo, "reason": "SPATIAL_MISMATCH"})
                continue
        elif require_spatial:
            unmatched_model.append({**mo, "reason": "SPATIAL_REQUIRED"})
            continue
        mt = _parse_ts(mo.get("timestamp"))
        if mt is None:
            unmatched_model.append({**mo, "reason": "INVALID_TIMESTAMP"})
            continue

        candidates = []
        for idx, o in enumerate(observations):
            if idx in used:
                continue
            if o.get("variable") != variable or o.get("unit") != unit:
                continue
            ot = _parse_ts(o.get("timestamp"))
            if ot is None:
                continue
            if (mt.tzinfo is None) != (ot.tzinfo is None):
                continue  # no implicit timezone normalization
            delta = abs((mt - ot).total_seconds())
            if delta <= time_tol + 1e-9:
                candidates.append((idx, o, delta))

        exact = [c for c in candidates if c[2] <= 1e-9]
        if len(exact) == 1:
            chosen = exact[0]
        elif len(exact) > 1:
            unmatched_model.append({**mo, "reason": "AMBIGUOUS_MATCH"})
            continue
        elif len(candidates) == 1:
            chosen = candidates[0]
        elif len(candidates) > 1:
            unmatched_model.append({**mo, "reason": "AMBIGUOUS_MATCH"})
            continue
        else:
            unmatched_model.append({**mo, "reason": "NO_MATCHING_OBSERVATION"})
            continue

        idx, o, delta = chosen
        used.add(idx)
        if o.get("quality_flag", "unchecked") in EXCLUDED_QUALITY or o.get("value") is None:
            exclusions.append({"model": mo, "observation": o, "reason": "MISSING_OR_INVALID_OBSERVATION"})
            continue
        if not _finite(mo.get("value")) or not _finite(o.get("value")):
            exclusions.append({"model": mo, "observation": o, "reason": "NON_FINITE_VALUE"})
            continue
        matched.append({"model": mo, "observation": o, "delta_seconds": delta})

    unmatched_obs = [o for idx, o in enumerate(observations) if idx not in used]
    return {
        "matched": matched,
        "unmatched_model": unmatched_model,
        "unmatched_observations": unmatched_obs,
        "exclusions": exclusions,
    }


# --- model-output adapter --------------------------------------------------

def _get_path(obj, path):
    cur = obj
    for key in path or []:
        if isinstance(cur, dict):
            cur = cur.get(key)
        elif isinstance(cur, list) and isinstance(key, int):
            cur = cur[key] if 0 <= key < len(cur) else None
        else:
            return None
        if cur is None:
            return None
    return cur


def extract_model_outputs(result: Any, mapping: Optional[dict]) -> List[Dict[str, Any]]:
    """Extract evaluator-ready model outputs from a run result using an explicit mapping.

    ``mapping`` fields: ``items_path`` (list of keys to the item list; default the
    result itself), ``value_field`` (default ``value``), ``timestamp_field``
    (default ``timestamp``), ``spatial_field`` (optional), ``variable``, ``unit``.
    No values/timestamps/spatial ids are inferred.
    """
    mapping = mapping or {}
    items_path = mapping.get("items_path") or []
    items = _get_path(result, items_path) if items_path else result
    if items is None:
        return []
    if not isinstance(items, list):
        items = [items]
    value_field = mapping.get("value_field", "value")
    ts_field = mapping.get("timestamp_field", "timestamp")
    spatial_field = mapping.get("spatial_field")
    outputs: List[Dict[str, Any]] = []
    for it in items:
        if not isinstance(it, dict):
            continue
        outputs.append({
            "variable": mapping.get("variable"),
            "value": it.get(value_field),
            "unit": mapping.get("unit"),
            "timestamp": it.get(ts_field),
            "spatial_id": it.get(spatial_field) if spatial_field else None,
        })
    return outputs


# --- metrics ---------------------------------------------------------------

def compute_metrics(pairs: List[Tuple[float, float]]) -> Dict[str, Dict[str, Any]]:
    """MAE, RMSE, Bias, NSE, KGE with structured statuses."""
    pairs = [(float(m), float(o)) for m, o in pairs if _finite(m) and _finite(o)]
    n = len(pairs)
    if n == 0:
        return {k: {"value": None, "status": "NO_DATA"} for k in ("mae", "rmse", "bias", "nse", "kge")}

    diffs = [m - o for m, o in pairs]
    mae = sum(abs(d) for d in diffs) / n
    rmse = math.sqrt(sum(d * d for d in diffs) / n)
    bias = sum(diffs) / n
    metrics = {
        "mae": {"value": mae, "status": "OK"},
        "rmse": {"value": rmse, "status": "OK"},
        "bias": {"value": bias, "status": "OK"},
    }

    if n < 2:
        metrics["nse"] = {"value": None, "status": "UNDEFINED_INSUFFICIENT_SAMPLE"}
        metrics["kge"] = {"value": None, "status": "UNDEFINED_INSUFFICIENT_SAMPLE"}
        return metrics

    mean_obs = sum(o for _, o in pairs) / n
    ss_res = sum((o - m) ** 2 for m, o in pairs)
    ss_tot = sum((o - mean_obs) ** 2 for _, o in pairs)
    if ss_tot <= 0.0:
        metrics["nse"] = {"value": None, "status": "UNDEFINED_ZERO_VARIANCE"}
        metrics["kge"] = {"value": None, "status": "UNDEFINED_ZERO_VARIANCE"}
        return metrics

    metrics["nse"] = {"value": 1.0 - ss_res / ss_tot, "status": "OK"}

    mean_model = sum(m for m, _ in pairs) / n
    var_model = sum((m - mean_model) ** 2 for m, _ in pairs) / n
    var_obs = ss_tot / n
    std_model = math.sqrt(var_model)
    std_obs = math.sqrt(var_obs)
    if std_model <= 0.0 or std_obs <= 0.0 or abs(mean_obs) <= 0.0:
        metrics["kge"] = {"value": None, "status": "UNDEFINED"}
        return metrics
    cov = sum((m - mean_model) * (o - mean_obs) for m, o in pairs) / n
    r = cov / (std_model * std_obs)
    alpha = std_model / std_obs
    beta = mean_model / mean_obs
    kge = 1.0 - math.sqrt((r - 1.0) ** 2 + (alpha - 1.0) ** 2 + (beta - 1.0) ** 2)
    metrics["kge"] = {"value": kge, "status": "OK"}
    return metrics


# --- evaluation report -----------------------------------------------------

def evaluate_model_output(model: Optional[dict], dataset: dict, model_outputs: Any,
                          matching_config: Optional[dict] = None,
                          expected_role: Optional[str] = None,
                          run: Optional[dict] = None) -> Dict[str, Any]:
    """Produce a deterministic evaluation report. Never changes model maturity."""
    model = model or {}
    if not model and run:
        model = {"id": run.get("model_id"), "version": run.get("model_version"),
                 "scientific_status": "NOT_VALIDATED"}
    validation = validate_dataset(dataset)
    if not validation["valid"]:
        return {"ok": False, "status": "INVALID_DATASET", "errors": validation["errors"]}
    if expected_role is not None and dataset.get("role") != expected_role:
        return {"ok": False, "status": "ROLE_MISMATCH",
                "errors": [{"code": "ROLE_MISMATCH", "expected": expected_role, "got": dataset.get("role")}]}

    match = match_model_outputs(model_outputs, dataset, matching_config)
    pairs = [(m["model"]["value"], m["observation"]["value"]) for m in match["matched"]]
    metrics = compute_metrics(pairs)
    n = len(pairs)
    excluded = len(match["exclusions"])

    times = sorted(_parse_ts(m["observation"]["timestamp"]) for m in match["matched"])
    period = {"start": times[0].isoformat(), "end": times[-1].isoformat()} if times else None

    core = {
        "model": {
            "id": model.get("id"),
            "version": model.get("version"),
            "maturity": model.get("maturity"),
            "scientific_status": model.get("scientific_status", "NOT_VALIDATED"),
        },
        "run": {
            "run_id": run.get("run_id"),
            "model_id": run.get("model_id"),
            "model_version": run.get("model_version"),
            "status": run.get("status"),
            "created_at": run.get("created_at"),
        } if run else None,
        "dataset": {
            "dataset_id": dataset.get("dataset_id"),
            "version": dataset.get("version"),
            "role": dataset.get("role"),
            "variable": dataset.get("variable"),
            "unit": dataset.get("unit"),
            "hash": dataset_hash(dataset),
            "payload": _json_safe(_canonical_dataset(dataset)),
        },
        "matching": {
            "config": _json_safe(matching_config or {}),
            "matched_count": len(match["matched"]),
            "unmatched_model_count": len(match["unmatched_model"]),
            "unmatched_observation_count": len(match["unmatched_observations"]),
            "excluded_count": excluded,
        },
        "metrics": {k: {"value": _round(v["value"]), "status": v["status"]} for k, v in metrics.items()},
        "sample_count": n,
        "missing_count": excluded,
        "unit": dataset.get("unit"),
        "evaluation_period": period,
        "limitations": [
            "metrics describe agreement with the supplied dataset only",
            "computing metrics does NOT scientifically validate the model",
            "no interpolation, resampling or timezone normalization is performed",
            "calibration and validation datasets must be kept distinct",
        ],
        "scientific_status": "NOT_VALIDATED",
    }
    result_hash = sha256_json(_json_safe(core))
    report = dict(core)
    report["provenance"] = {
        "input_hash": sha256_json(_json_safe({"model": model, "matching": matching_config or {}})),
        "result_hash": result_hash,
        "scientific_status": "NOT_VALIDATED",
    }
    report["ok"] = True
    report["status"] = "COMPLETED"
    return report


def evaluate_run(run: Optional[dict], dataset: dict, output_mapping: Optional[dict] = None,
                 matching_config: Optional[dict] = None, expected_role: Optional[str] = None,
                 model: Optional[dict] = None) -> Dict[str, Any]:
    """Evaluate a model run's result against a reference dataset.

    Extracts model outputs from ``run["result_json"]`` using the explicit
    ``output_mapping`` and delegates to :func:`evaluate_model_output`, preserving
    run identity in the report. Never changes model maturity or scientific status.
    """
    if not isinstance(run, dict):
        return {"ok": False, "status": "INVALID_RUN", "errors": [{"code": "INVALID_RUN"}]}
    result = run.get("result_json")
    if result is None:
        return {"ok": False, "status": "NO_RUN_RESULT",
                "errors": [{"code": "NO_RUN_RESULT", "run_id": run.get("run_id")}]}
    model_outputs = extract_model_outputs(result, output_mapping)
    if not model_outputs:
        return {"ok": False, "status": "NO_MODEL_OUTPUTS",
                "errors": [{"code": "NO_MODEL_OUTPUTS", "run_id": run.get("run_id")}]}
    return evaluate_model_output(model, dataset, model_outputs, matching_config, expected_role, run=run)


def verify_evaluation_report(report: Optional[dict]) -> Dict[str, Any]:
    """Recompute dataset and result hashes; detect tampering."""
    errors: List[Dict[str, Any]] = []
    if not isinstance(report, dict):
        return {"valid": False, "errors": [{"code": "INVALID_REPORT"}]}
    ds = report.get("dataset") or {}
    if "payload" in ds and ds.get("hash") != sha256_json(_json_safe(ds["payload"])):
        errors.append({"code": "DATASET_HASH_MISMATCH"})
    core = {k: v for k, v in report.items() if k not in ("provenance", "ok", "status")}
    if (report.get("provenance") or {}).get("result_hash") != sha256_json(_json_safe(core)):
        errors.append({"code": "RESULT_HASH_MISMATCH"})
    return {"valid": len(errors) == 0, "errors": errors}


# --- runtime adapter -------------------------------------------------------

def evaluate_model_outputs_adapter(input_data: dict) -> dict:
    input_data = input_data or {}
    if input_data.get("run") is not None:
        return _json_safe(evaluate_run(
            input_data.get("run"),
            input_data.get("dataset"),
            input_data.get("output_mapping"),
            input_data.get("matching"),
            input_data.get("expected_role"),
            input_data.get("model"),
        ))
    return _json_safe(evaluate_model_output(
        input_data.get("model"),
        input_data.get("dataset"),
        input_data.get("model_outputs"),
        input_data.get("matching"),
        input_data.get("expected_role"),
    ))


EVALUATION_DEFINITION = {
    "id": EVALUATION_MODEL["id"],
    "version": EVALUATION_MODEL["version"],
    "domain": "simulation",
    "title": "Scientific model-evaluation framework (dataset contract + metrics)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": 6, "rounding": "half_up"},
    "inputs": [
        {"name": "model", "kind": "object", "required": False, "description": "{id, version, maturity?, scientific_status?}"},
        {"name": "dataset", "kind": "object", "required": True, "description": "dataset contract {dataset_id, version, role, variable, unit, observations[]}"},
        {"name": "model_outputs", "kind": "array", "required": False, "description": "[{variable, value, unit, timestamp, spatial_id?}] (used when run is not supplied)"},
        {"name": "run", "kind": "object", "required": False, "description": "run record {run_id, model_id, model_version, status, created_at, result_json}; when supplied, outputs are extracted via output_mapping"},
        {"name": "output_mapping", "kind": "object", "required": False, "description": "{items_path[], value_field, timestamp_field, spatial_field?, variable, unit}"},
        {"name": "matching", "kind": "object", "required": False, "description": "{variable?, unit?, time_tolerance_seconds?, spatial_id?, require_spatial?}"},
        {"name": "expected_role", "kind": "string", "required": False, "description": "REFERENCE|CALIBRATION|VALIDATION|EVALUATION; rejects a dataset with a different role"},
    ],
    "outputs": [
        {"name": "status", "kind": "string"},
        {"name": "metrics", "kind": "object", "description": "mae/rmse/bias/nse/kge with value+status"},
        {"name": "sample_count", "kind": "number"},
        {"name": "run", "kind": "object", "description": "run identity when a run was evaluated"},
        {"name": "provenance", "kind": "object"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_evaluation.py", "notes": "software only; not scientific validation"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}