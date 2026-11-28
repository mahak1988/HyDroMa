"""Scientific dataset assembly & explicit model-input mapping (offline core).

Reuses ``hydroma.units`` and ``hydroma.climate``; no network, no optional deps.
Technical readiness is NOT scientific validation.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from .climate import parse_timestamp
from .units import UnitError, convert

__all__ = [
    "ParameterMapping",
    "MAPPINGS",
    "align_daily",
    "assemble_dataset",
    "map_to_model_input",
    "snapshot_fingerprint",
    "READINESS",
]

READINESS = ("INCOMPLETE", "READY_FOR_MAPPING", "READY_WITH_WARNINGS", "BLOCKED")


@dataclass(frozen=True)
class ParameterMapping:
    source_parameter: str
    target_parameter: str
    target_unit: str
    model_id: str
    model_version: str
    transform: str = "identity"
    transform_version: str = "1.0.0"
    temporal: str = "daily"
    spatial: str = "context"
    qc: str = "warning"
    missing_policy: str = "explicit"
    status: str = "active"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sourceParameter": self.source_parameter, "targetParameter": self.target_parameter,
            "targetUnit": self.target_unit, "modelId": self.model_id,
            "modelVersion": self.model_version, "transform": self.transform,
            "transformVersion": self.transform_version, "temporal": self.temporal,
            "spatial": self.spatial, "qc": self.qc, "missingPolicy": self.missing_policy,
            "status": self.status,
        }


MAPPINGS: Dict[str, List[ParameterMapping]] = {
    "fao56_et0": [
        ParameterMapping("air_temperature", "temperature", "degC", "fao56_et0", "1.0.0"),
        ParameterMapping("relative_humidity", "humidity", "percent", "fao56_et0", "1.0.0"),
        ParameterMapping("wind_speed", "wind", "m_per_s", "fao56_et0", "1.0.0"),
        ParameterMapping("solar_radiation", "radiation", "MJ_per_m2_day", "fao56_et0", "1.0.0"),
    ],
    "water_balance": [
        ParameterMapping("precipitation", "precipitation", "mm", "water_balance", "1.0.0"),
    ],
}


def _day(ts: str) -> str:
    return parse_timestamp(ts).date().isoformat()


def align_daily(observations: Iterable[Dict[str, Any]], start: str, end: str) -> Tuple[List[Dict[str, Any]], List[str]]:
    """Exact daily matching. No interpolation, no filling, no disaggregation."""
    by_key: Dict[str, Dict[str, Any]] = {}
    duplicates: List[str] = []
    for obs in observations:
        ts = obs.get("observed_at") or obs.get("timestamp")
        if not ts:
            continue
        day = _day(ts)
        if day < start or day > end:
            continue
        key = f"{day}|{obs.get('parameter')}"
        if key in by_key:
            duplicates.append(key)
            continue
        by_key[key] = obs
    days = []
    current = datetime.fromisoformat(start).date()
    last = datetime.fromisoformat(end).date()
    while current <= last:
        days.append(current.isoformat())
        current = current + timedelta(days=1)
    present_days = {key.split("|", 1)[0] for key in by_key}
    aligned = [obs for key, obs in by_key.items() if key.split("|", 1)[0] in present_days]
    missing = [d for d in days if d not in present_days]
    return aligned, missing


def assemble_dataset(*, dataset_id: str, organization_id: str, farm_id: Optional[str],
                     project_id: Optional[str], start: str, end: str,
                     parameters: List[str], observations: Iterable[Dict[str, Any]],
                     assembly_version: str = "1.0.0") -> Dict[str, Any]:
    selected = [o for o in observations if o.get("parameter") in parameters]
    aligned, missing = align_daily(selected, start, end)
    by_param: Dict[str, List[Dict[str, Any]]] = {p: [] for p in parameters}
    warnings: List[str] = []
    for obs in aligned:
        param = obs.get("parameter")
        unit = obs.get("unit")
        canonical = obs.get("canonical_unit")
        value = obs.get("canonical_value", obs.get("value"))
        if canonical is None:
            canonical = unit
            value = obs.get("value")
        if obs.get("quality") == "WARNING":
            warnings.append(f"quality warning for {param} on {obs.get('observed_at')}")
        by_param[param].append({
            "timestamp": obs.get("observed_at"), "value": value, "unit": canonical,
            "source": obs.get("source"), "quality": obs.get("quality", "UNREVIEWED"),
        })
    total_days = max((datetime.fromisoformat(end).date() - datetime.fromisoformat(start).date()).days + 1, 1)
    covered_days = len({_day(o.get("observed_at")) for o in aligned if o.get("observed_at")})
    coverage = round(covered_days / total_days, 4)
    missing_params = [p for p in parameters if not by_param[p]]
    if not aligned:
        readiness = "BLOCKED"
    elif missing_params or missing:
        readiness = "INCOMPLETE"
    elif warnings:
        readiness = "READY_WITH_WARNINGS"
    else:
        readiness = "READY_FOR_MAPPING"
    return {
        "datasetId": dataset_id, "organizationId": organization_id, "farmId": farm_id,
        "projectId": project_id, "modelVersion": assembly_version,
        "temporalRange": {"start": start, "end": end},
        "parameters": parameters, "observations": aligned, "byParameter": by_param,
        "missingDates": missing, "missingParameters": missing_params,
        "coverage": coverage, "warnings": warnings, "readiness": readiness,
        "qualityStatus": "UNREVIEWED",
        "provenance": {
            "assemblyVersion": assembly_version,
            "sources": sorted({o.get("source") for o in aligned if o.get("source")}),
            "transform": "exact-daily-match; no interpolation",
            "scientificStatus": "NOT_VALIDATED",
        },
        "assembledAt": datetime.now(timezone.utc).isoformat(),
    }


def map_to_model_input(dataset: Dict[str, Any], model_id: str, model_version: str) -> Dict[str, Any]:
    mappings = [m for m in MAPPINGS.get(model_id, []) if m.model_version == model_version]
    if not mappings:
        raise ValueError(f"no mapping for model {model_id}@{model_version}")
    inputs: Dict[str, Any] = {}
    missing: List[str] = []
    for mapping in mappings:
        series = dataset.get("byParameter", {}).get(mapping.source_parameter) or []
        if not series:
            missing.append(mapping.source_parameter)
            continue
        converted = []
        for point in series:
            try:
                value = point["value"] if point["unit"] == mapping.target_unit else convert(float(point["value"]), point["unit"], mapping.target_unit)
            except (UnitError, TypeError, ValueError) as exc:
                raise ValueError(f"unit conversion failed for {mapping.source_parameter}") from exc
            converted.append({"timestamp": point["timestamp"], "value": value, "unit": mapping.target_unit})
        inputs[mapping.target_parameter] = converted
    if missing:
        raise ValueError(f"missing model inputs: {', '.join(missing)}")
    return {
        "modelId": model_id, "modelVersion": model_version,
        "datasetId": dataset.get("datasetId"), "mappingVersion": "1.0.0",
        "inputs": inputs, "missing": missing,
        "provenance": {**dataset.get("provenance", {}), "mapping": [m.to_dict() for m in mappings]},
    }
def snapshot_fingerprint(snapshot: Dict[str, Any]) -> str:
    canonical = json.dumps(snapshot, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
    return hashlib.sha256(canonical.encode('utf-8')).hexdigest()
