"""Climate ingestion & QC acceptance gate (Phase 3.19).

Connects the existing climate ingestion + QC acceptance chain to the multi-period
simulation. No new ingestion/QC framework - reuses:

* ``ingest.ingest_climate``            (source -> ClimateSeries + acceptance)
* ``climate.validate_series``          (structural contract, via ingest_climate)
* ``quality.assess_climate_quality``   (QC, via ingest_climate)
* ``multi_period_sim.simulate_multi_period`` (gated simulation)

Acceptance is delegated to the canonical Phase 3.10 implementation in
:func:`hydroma.ingest.ingest_climate` so that ``LEGACY``/``STRICT`` unit policy,
structural contract enforcement and QC precedence are identical across every
public climate entry point. Only ``ACCEPTED`` / ``ACCEPTED_WITH_WARNINGS`` become
MODEL_READY and may enter the simulation. Rejected / pending-review data never
reaches the model. Direct scalar input (farm_water_workflow) remains a separate,
non-QC mode.

The binding layer (``build_sim_input_from_climate``) extracts precipitation 1:1
from the accepted series and requires an exact accumulation interval; it never
aggregates, interpolates, imputes or normalizes timezones.

Software-tested; NOT scientifically validated.
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from .climate import ClimateObservation, ClimateSeries
from .climate_import import ImportConfig
from .ingest import ClimateIngestionConfig, ingest_climate
from .multi_period_sim import simulate_multi_period
from .provenance import sha256_json
from .quality import QualityControlPolicy

__all__ = [
    "CLIMATE_QC_GATE_MODEL",
    "CLIMATE_QC_GATE_DEFINITION",
    "CLIMATE_SIM_BINDING_DEFINITION",
    "CLIMATE_PROVENANCE_VERSION",
    "MAPPING_VERSION",
    "ingest_and_accept_climate",
    "run_gated_simulation",
    "build_sim_input_from_climate",
    "run_gated_simulation_from_climate",
    "climate_qc_gate_adapter",
    "climate_sim_binding_adapter",
    "verify_climate_provenance",
]

CLIMATE_QC_GATE_MODEL = {
    "id": "eco-nojin.hydroma.climate-qc-gate",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
}

# Provenance/mapping schema versions (bumped when the hashed payload meaning changes).
CLIMATE_PROVENANCE_VERSION = "1.0.0"
MAPPING_VERSION = "1.0.0"

# QC rule codes that represent a unit-policy finding (mirrors ingest.py).
_UNIT_RULE_CODES = {"RULE-UNIT-MISSING", "RULE-UNIT-UNKNOWN", "RULE-UNIT-INCOMPATIBLE"}

ASSUMPTIONS = [
    "reuses_existing_ingestion_qc",
    "acceptance_precedence_per_phase_3_10",
    "only_accepted_reaches_model",
    "direct_input_mode_separate",
]
LIMITATIONS = [
    "notValidated",
    "single_source_slice",
    "no_gap_filling",
    "no_retry_policy",
]
REFERENCES = [
    "Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998). FAO Irrigation and Drainage Paper 56.",
]


# --- canonical acceptance (delegates to ingest_climate) ---------------------

def _effective_config(config, unit_policy: str, qc_policy) -> ClimateIngestionConfig:
    """Return a config with the effective unit/qc policy, without mutating the caller's."""
    if config is None:
        config = ClimateIngestionConfig()
    if not isinstance(config, ClimateIngestionConfig):
        raise TypeError("config must be a ClimateIngestionConfig")
    return ClimateIngestionConfig(
        format=config.format,
        import_config=config.import_config,
        unit_policy=unit_policy,
        qc_policy=qc_policy if qc_policy is not None else config.qc_policy,
        domain=config.domain,
        dataset_id=config.dataset_id,
        dataset_version=config.dataset_version,
        source_name=config.source_name,
    )


def _unit_findings(ing) -> list:
    quality = ing.quality if isinstance(ing.quality, dict) else {}
    flags = quality.get("flags", []) if isinstance(quality, dict) else []
    return [
        {"code": f.get("code"), "severity": f.get("severity"), "field": f.get("field_path")}
        for f in flags
        if f.get("code") in _UNIT_RULE_CODES
    ]


def _gate_result_from_ingestion(ing) -> Dict[str, Any]:
    acceptance = dict(ing.acceptance) if isinstance(ing.acceptance, dict) else {}
    provenance = ing.provenance if isinstance(ing.provenance, dict) else {}
    return {
        "status": ing.status,
        "reason_code": acceptance.get("reason"),
        "model_ready": bool(ing.ok),
        "acceptance": acceptance,
        "qc": ing.quality if isinstance(ing.quality, dict) else {},
        "contract_valid": bool((ing.validation or {}).get("valid")),
        "unit_policy": provenance.get("unit_policy"),
        "unit_findings": _unit_findings(ing),
        "provenance": provenance,
        "series": ing.series if ing.ok else None,
        "errors": list(ing.errors) if not ing.ok else [],
    }


def ingest_and_accept_climate(source: Any, config=None, qc_policy: Optional[QualityControlPolicy] = None, unit_policy: str = "LEGACY") -> Dict[str, Any]:
    """Run INGEST -> CONTRACT -> QC -> ACCEPTANCE via the canonical pipeline.

    ``unit_policy`` (LEGACY|STRICT) and ``qc_policy`` are applied to the canonical
    :func:`hydroma.ingest.ingest_climate` pipeline, so structural contract errors
    always block, unit policy is enforced identically to every other climate entry
    point, and QC precedence matches Phase 3.10 exactly.
    """
    effective = _effective_config(config, unit_policy, qc_policy)
    ing = ingest_climate(source, effective)
    return _gate_result_from_ingestion(ing)


# --- provenance chain -------------------------------------------------------

def _accepted_series_hash(acc: Dict[str, Any]) -> Optional[str]:
    return (acc.get("provenance") or {}).get("normalized_dataset_hash")


def _acceptance_payload(acc: Dict[str, Any]) -> Dict[str, Any]:
    prov = acc.get("provenance") or {}
    return {
        "accepted_series_hash": prov.get("normalized_dataset_hash"),
        "unit_policy": prov.get("unit_policy"),
        "contract_valid": bool(acc.get("contract_valid")),
        "qc_policy_hash": sha256_json(prov.get("qc_config")),
        "qc_report_hash": prov.get("qc_hash"),
        "status": acc.get("status"),
        "reason": (acc.get("acceptance") or {}).get("reason"),
    }


def _mapping_payload(acc: Dict[str, Any], mapping) -> Dict[str, Any]:
    return {
        "mapping_version": MAPPING_VERSION,
        "accepted_series_hash": _accepted_series_hash(acc),
        "steps": [
            {
                "step": m.get("step"),
                "period_start": m.get("period_start"),
                "period_end": m.get("period_end"),
                "precip_source": m.get("precip_source"),
                "precip_unit": m.get("precip_unit"),
                "precip_observation": m.get("precip_observation"),
            }
            for m in (mapping or [])
        ],
    }


def _simulation_input_payload(acc: Dict[str, Any], sim_input, mapping) -> Dict[str, Any]:
    return {
        "sim_input": sim_input,
        "mapping_hash": sha256_json(_mapping_payload(acc, mapping)) if mapping is not None else None,
        "accepted_series_hash": _accepted_series_hash(acc),
        "flux_origins": {
            "precipitation": "accepted_climate_series",
            "et_actual": "sim_spec",
            "irrigation": "sim_spec",
            "runoff": "sim_spec",
            "deep_percolation": "sim_spec",
        },
    }


def _build_provenance(acc: Dict[str, Any], sim_input, mapping, sim: Dict[str, Any]) -> Dict[str, Any]:
    prov = acc.get("provenance") or {}
    acceptance_payload = _acceptance_payload(acc)
    mapping_payload = _mapping_payload(acc, mapping) if mapping is not None else None
    sim_input_payload = _simulation_input_payload(acc, sim_input, mapping)
    sim_prov = sim.get("provenance") or {}
    return {
        "climate_provenance_version": CLIMATE_PROVENANCE_VERSION,
        "source_identity": prov.get("source"),
        "raw_source_hash": (prov.get("source") or {}).get("content_hash"),
        "normalized_series_hash": prov.get("normalized_dataset_hash"),
        "qc_policy_hash": sha256_json(prov.get("qc_config")),
        "qc_report_hash": prov.get("qc_hash"),
        "acceptance_hash": sha256_json(acceptance_payload),
        "accepted_series_hash": prov.get("normalized_dataset_hash"),
        "mapping_hash": sha256_json(mapping_payload) if mapping_payload is not None else None,
        "simulation_input_hash": sha256_json(sim_input_payload),
        "step_input_hashes": sim_prov.get("step_hashes"),
        "final_result_hash": sim_prov.get("result_hash"),
        "payloads": {
            "acceptance": acceptance_payload,
            "mapping": mapping_payload,
            "simulation_input": sim_input_payload,
            "simulation_result": sim_prov.get("result_payload"),
        },
    }


def verify_climate_provenance(record: Optional[dict]) -> Dict[str, Any]:
    """Recompute the deterministic climate provenance hashes from the stored payloads.

    Returns ``{"valid", "errors"}``. A tampered payload or a broken cross-stage
    link is detected by recomputing each hash and comparing it to the stored value.
    This verifies integrity/reproducibility of the record, never scientific validity.
    """
    errors = []
    if not isinstance(record, dict):
        return {"valid": False, "errors": [{"code": "INVALID_PROVENANCE_RECORD"}]}
    payloads = record.get("payloads") or {}
    if "acceptance" in payloads and record.get("acceptance_hash") != sha256_json(payloads["acceptance"]):
        errors.append({"code": "ACCEPTANCE_HASH_MISMATCH"})
    if record.get("mapping_hash") is not None:
        if "mapping" not in payloads or record.get("mapping_hash") != sha256_json(payloads["mapping"]):
            errors.append({"code": "MAPPING_HASH_MISMATCH"})
    if "simulation_input" in payloads and record.get("simulation_input_hash") != sha256_json(payloads["simulation_input"]):
        errors.append({"code": "SIMULATION_INPUT_HASH_MISMATCH"})
    # Step/final result hashes: recompute from the stored simulation-result payload
    # so tampering with a step result (or the final result) is detected.
    sim_result = payloads.get("simulation_result")
    if isinstance(sim_result, dict):
        steps = sim_result.get("steps") or []
        recomputed_steps = [sha256_json(step) for step in steps]
        if record.get("step_input_hashes") != recomputed_steps:
            errors.append({"code": "STEP_HASH_MISMATCH"})
        if record.get("final_result_hash") != sha256_json(sim_result):
            errors.append({"code": "FINAL_RESULT_HASH_MISMATCH"})
    return {"valid": len(errors) == 0, "errors": errors}


# --- gated simulation -------------------------------------------------------

def run_gated_simulation(source: Any, config, sim_input: dict, qc_policy: Optional[QualityControlPolicy] = None, unit_policy: str = "LEGACY") -> Dict[str, Any]:
    """Gate the multi-period simulation on climate acceptance.

    If climate data is not MODEL_READY, the simulation is BLOCKED (never run on
    rejected/pending data). ``sim_input`` is the multi-period input built from the
    accepted climate series by the caller.
    """
    acc = ingest_and_accept_climate(source, config, qc_policy, unit_policy)
    if not acc["model_ready"]:
        return {"status": "BLOCKED", "reason_code": acc["reason_code"], "acceptance": acc, "simulation": None}
    sim = simulate_multi_period(sim_input)
    result = {"status": "COMPLETED" if sim.get("ok") else "FAILED", "acceptance": acc, "simulation": sim}
    if sim.get("ok"):
        result["provenance"] = _build_provenance(acc, sim_input, None, sim)
    return result


def _find_precip(series, period_start: str, period_end: str):
    matches = [o for o in series.observations if o.variable == "precipitation" and o.timestamp == period_end]
    if len(matches) == 0:
        return None, "MISSING_PRECIP"
    exact = [
        o for o in matches
        if getattr(o, "accumulation_start", None) == period_start and getattr(o, "accumulation_end", None) == period_end
    ]
    if len(exact) == 1:
        return exact[0], None
    if len(exact) > 1:
        return None, "AMBIGUOUS_PRECIP"
    if all(getattr(o, "accumulation_start", None) is None and getattr(o, "accumulation_end", None) is None for o in matches):
        return None, "MISSING_ACCUMULATION_INTERVAL"
    return None, "ACCUMULATION_INTERVAL_MISMATCH"


def build_sim_input_from_climate(accepted: dict, sim_spec: dict) -> Dict[str, Any]:
    """Build the multi-period ``sim_input`` from the ACCEPTED ClimateSeries.

    Precipitation is extracted 1:1 from the accepted series (observation at each
    step's ``period_end``, unit ``mm``); ET/irrigation/runoff come from ``sim_spec``
    (explicit, not from climate). No aggregation/interpolation. Rejects any step
    whose precipitation is missing/ambiguous or whose unit is not ``mm``.
    """
    if not accepted.get("model_ready"):
        return {"ok": False, "errors": [{"code": "NOT_MODEL_READY"}]}
    series = accepted.get("series")
    steps = sim_spec.get("steps")
    if not isinstance(steps, list) or len(steps) == 0:
        return {"ok": False, "errors": [{"code": "EMPTY_STEPS"}]}

    out_steps = []
    mapping = []
    for i, spec in enumerate(steps):
        pe = spec.get("period_end")
        obs, err = _find_precip(series, spec.get("period_start"), pe)
        if err:
            return {"ok": False, "errors": [{"step": i, "code": err}]}
        if obs.unit != "mm":
            return {"ok": False, "errors": [{"step": i, "code": "INVALID_UNIT", "unit": obs.unit}]}
        if spec.get("et_actual_mm") is None:
            return {"ok": False, "errors": [{"step": i, "code": "MISSING_ET"}]}
        out_steps.append({
            "period_start": spec.get("period_start"), "period_end": pe,
            "precipitation_mm": float(obs.value),
            "irrigation_mm": float(spec.get("irrigation_mm", 0.0)),
            "et_actual_mm": float(spec["et_actual_mm"]),
            "runoff_mm": float(spec.get("runoff_mm", 0.0)),
            "deep_percolation_mm": spec.get("deep_percolation_mm"),
        })
        mapping.append({
            "step": i,
            "period_start": spec.get("period_start"),
            "period_end": pe,
            "precip_source": f"climate://precipitation@{pe}",
            "precip_unit": obs.unit,
            "precip_observation": {
                "timestamp": obs.timestamp,
                "accumulation_start": obs.accumulation_start,
                "accumulation_end": obs.accumulation_end,
                "value": obs.value,
                "quality": obs.quality,
            },
        })

    sim_input = {
        "period_start": steps[0].get("period_start"), "period_end": steps[-1].get("period_end"),
        "layers": sim_spec.get("layers"), "initial_storage_mm": sim_spec.get("initial_storage_mm"),
        "steps": out_steps,
    }
    return {"ok": True, "sim_input": sim_input, "mapping": mapping}


def run_gated_simulation_from_climate(source, config, sim_spec: dict, qc_policy=None, unit_policy: str = "LEGACY") -> Dict[str, Any]:
    """Gate -> BIND (precip from accepted climate) -> simulate. Caller cannot inject precip."""
    acc = ingest_and_accept_climate(source, config, qc_policy, unit_policy)
    if not acc["model_ready"]:
        return {"status": "BLOCKED", "reason_code": acc["reason_code"], "acceptance": acc, "simulation": None}
    built = build_sim_input_from_climate(acc, sim_spec)
    if not built["ok"]:
        return {"status": "FAILED", "reason_code": "BINDING_ERROR", "errors": built["errors"], "acceptance": acc}
    sim = simulate_multi_period(built["sim_input"])
    result = {"status": "COMPLETED" if sim.get("ok") else "FAILED", "acceptance": acc, "mapping": built["mapping"], "simulation": sim}
    if sim.get("ok"):
        result["provenance"] = _build_provenance(acc, built["sim_input"], built["mapping"], sim)
    return result


# --- Runtime/API adapter contract ------------------------------------------
# The Runtime calls ``executor(input_data)`` with a single dict. These adapters
# translate the structured request into the multi-argument climate executors,
# validate required fields, and return structured errors instead of raw TypeError.

def _json_safe(obj):
    if isinstance(obj, ClimateSeries):
        return obj.to_dict()
    if isinstance(obj, ClimateObservation):
        return obj.to_dict()
    if isinstance(obj, dict):
        return {k: _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    return obj


def _coerce_config(config) -> ClimateIngestionConfig:
    if config is None:
        return ClimateIngestionConfig()
    if isinstance(config, ClimateIngestionConfig):
        return config
    if isinstance(config, dict):
        data = dict(config)
        imp = data.get("import_config")
        if isinstance(imp, dict):
            data["import_config"] = ImportConfig(**imp)
        qc = data.get("qc_policy")
        if isinstance(qc, dict):
            data["qc_policy"] = _coerce_qc_policy(qc)
        allowed = {"format", "import_config", "unit_policy", "qc_policy", "domain",
                   "dataset_id", "dataset_version", "source_name"}
        return ClimateIngestionConfig(**{k: v for k, v in data.items() if k in allowed})
    raise ValueError("config must be a ClimateIngestionConfig or an object")


def _coerce_qc_policy(qc_policy):
    if qc_policy is None or isinstance(qc_policy, QualityControlPolicy):
        return qc_policy
    if isinstance(qc_policy, dict):
        allowed = {"unit_policy", "warn_blocks_execution", "error_blocks_execution",
                   "thresholds", "enabled_rules"}
        return QualityControlPolicy(**{k: v for k, v in qc_policy.items() if k in allowed})
    raise ValueError("qc_policy must be a QualityControlPolicy or an object")


def _coerce_source(source):
    if isinstance(source, (ClimateSeries, str)):
        return source
    if isinstance(source, dict) and "observations" in source:
        return ClimateSeries.from_dict(source)
    raise ValueError("source must be a ClimateSeries, a serialized series object, or CSV/JSON text")


def _require(data: dict, fields: list):
    if not isinstance(data, dict):
        return {"status": "FAILED", "errors": [{"code": "INVALID_INPUT", "message": "input must be an object"}]}
    missing = [f for f in fields if data.get(f) is None]
    if missing:
        return {"status": "FAILED", "errors": [{"code": "MISSING_INPUT", "fields": missing}]}
    return None


def climate_qc_gate_adapter(input_data: dict) -> dict:
    """Runtime adapter for ``eco-nojin.hydroma.climate-qc-gate``.

    Input: ``{source, sim_input, config?, qc_policy?, unit_policy?}``.
    """
    err = _require(input_data, ["source", "sim_input"])
    if err:
        return err
    try:
        config = _coerce_config(input_data.get("config"))
        qc_policy = _coerce_qc_policy(input_data.get("qc_policy"))
        source = _coerce_source(input_data["source"])
        unit_policy = input_data.get("unit_policy", "LEGACY")
    except (ValueError, TypeError) as exc:
        return {"status": "FAILED", "errors": [{"code": "INVALID_INPUT", "message": str(exc)}]}
    return _json_safe(run_gated_simulation(source, config, input_data["sim_input"], qc_policy, unit_policy))


def climate_sim_binding_adapter(input_data: dict) -> dict:
    """Runtime adapter for ``eco-nojin.hydroma.climate-sim-binding``.

    Input: ``{source, sim_spec, config?, qc_policy?, unit_policy?}``. Precipitation
    is always taken from the accepted climate series; the caller cannot inject it.
    """
    err = _require(input_data, ["source", "sim_spec"])
    if err:
        return err
    try:
        config = _coerce_config(input_data.get("config"))
        qc_policy = _coerce_qc_policy(input_data.get("qc_policy"))
        source = _coerce_source(input_data["source"])
        unit_policy = input_data.get("unit_policy", "LEGACY")
    except (ValueError, TypeError) as exc:
        return {"status": "FAILED", "errors": [{"code": "INVALID_INPUT", "message": str(exc)}]}
    return _json_safe(run_gated_simulation_from_climate(source, config, input_data["sim_spec"], qc_policy, unit_policy))


CLIMATE_SIM_BINDING_DEFINITION = {
    "id": "eco-nojin.hydroma.climate-sim-binding",
    "version": "1.0.0",
    "domain": "climate",
    "title": "Accepted climate -> multi-period simulation binding",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": 4, "rounding": "half_up"},
    "inputs": [
        {"name": "source", "kind": "object", "required": True, "description": "climate source: a ClimateSeries, a serialized series object, or CSV/JSON text"},
        {"name": "sim_spec", "kind": "object", "required": True, "description": "{layers, initial_storage_mm, steps:[{period_start, period_end, et_actual_mm, irrigation_mm?, runoff_mm?, deep_percolation_mm?}]}"},
        {"name": "config", "kind": "object", "required": False, "description": "ClimateIngestionConfig fields (format, unit_policy, domain, import_config, ...)"},
        {"name": "qc_policy", "kind": "object", "required": False, "description": "QualityControlPolicy fields (warn_blocks_execution, error_blocks_execution, thresholds, ...)"},
        {"name": "unit_policy", "kind": "string", "required": False, "description": "LEGACY (default) | STRICT"},
    ],
    "outputs": [{"name": "status", "kind": "string"}, {"name": "simulation", "kind": "object"}, {"name": "provenance", "kind": "object"}],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_climate_binding.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}
CLIMATE_QC_GATE_DEFINITION = {
    "id": CLIMATE_QC_GATE_MODEL["id"],
    "version": CLIMATE_QC_GATE_MODEL["version"],
    "domain": "climate",
    "title": "Climate ingestion & QC acceptance gate",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["mm"],
    "precision": {"decimals": 4, "rounding": "half_up"},
    "inputs": [
        {"name": "source", "kind": "object", "required": True, "description": "climate source: a ClimateSeries, a serialized series object, or CSV/JSON text"},
        {"name": "sim_input", "kind": "object", "required": True, "description": "multi-period input built from accepted climate"},
        {"name": "config", "kind": "object", "required": False, "description": "ClimateIngestionConfig fields (format, unit_policy, domain, import_config, ...)"},
        {"name": "qc_policy", "kind": "object", "required": False, "description": "QualityControlPolicy fields (warn_blocks_execution, error_blocks_execution, thresholds, ...)"},
        {"name": "unit_policy", "kind": "string", "required": False, "description": "LEGACY (default) | STRICT"},
    ],
    "outputs": [
        {"name": "status", "kind": "string"},
        {"name": "reason_code", "kind": "string"},
        {"name": "model_ready", "kind": "boolean"},
        {"name": "simulation", "kind": "object"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_climate_qc_integration.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}