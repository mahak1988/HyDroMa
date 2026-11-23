"""Scientific data ingestion & quality-aware acceptance pipeline (Phase 3.10).

Pipeline:
    SOURCE -> INGEST -> RAW DATASET -> NORMALIZE -> CONTRACT VALIDATION
           -> QC ASSESSMENT -> ACCEPTANCE -> MODEL_READY | REJECTED | PENDING_REVIEW

Reuses existing components (no duplication):
  * ``climate_import`` (CSV/JSON/in-memory -> ClimateSeries) for ingestion/normalization
  * ``climate.validate_series`` for structural dataset validation
  * ``quality.assess_climate_quality`` for QC
  * ``units`` for unit-policy checks
  * ``provenance.sha256_json`` for deterministic hashes

A dataset is NOT MODEL_READY because it parsed or passed contract validation; only
an ACCEPTED / ACCEPTED_WITH_WARNINGS decision yields MODEL_READY. QC is NOT wired
into the generic workflow path (that remains out of scope); this pipeline enforces
its own acceptance gate. Not scientifically validated.
"""
from __future__ import annotations

import hashlib
import json as _json
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

from .climate import ClimateSeries, series_hash, validate_series
from .climate_import import ImportConfig, import_climate_data, import_file
from .provenance import sha256_json
from .quality import QualityControlPolicy, QualityReport, assess_climate_quality
from .units import is_known_unit, validate_unit

# Canonical public ingestion entry point is :mod:`hydroma.ingest`
# (``ingest_climate`` / ``to_climate_series``). Re-exported here so consumers have a
# single import surface; this module additionally provides the Phase 3.10 acceptance
# utilities (``decide_acceptance``, ``et0_from_model_ready``, ``run_ingestion_pipeline``).
from .ingest import (  # noqa: F401
    ClimateIngestionConfig,
    IngestionResult,
    ScientificDataset,
    ingest_climate,
    to_climate_series,
)

__all__ = [
    "DatasetStatus",
    "AcceptanceStatus",
    "AcceptanceDecision",
    "ModelReadyDataset",
    "decide_acceptance",
    "validate_dataset",
    "build_model_ready_dataset",
    "run_ingestion_pipeline",
    "et0_from_model_ready",
]


class DatasetStatus(str, Enum):
    RAW = "RAW"
    NORMALIZED = "NORMALIZED"
    CONTRACT_VALIDATED = "CONTRACT_VALIDATED"
    QC_ASSESSED = "QC_ASSESSED"
    ACCEPTED = "ACCEPTED"
    ACCEPTED_WITH_WARNINGS = "ACCEPTED_WITH_WARNINGS"
    REJECTED = "REJECTED"
    PENDING_REVIEW = "PENDING_REVIEW"
    MODEL_READY = "MODEL_READY"


class AcceptanceStatus(str, Enum):
    ACCEPTED = "ACCEPTED"
    ACCEPTED_WITH_WARNINGS = "ACCEPTED_WITH_WARNINGS"
    REJECTED = "REJECTED"
    PENDING_REVIEW = "PENDING_REVIEW"


@dataclass
class AcceptanceDecision:
    status: AcceptanceStatus
    reason_code: str
    unit_policy: str
    qc_policy: Dict[str, Any]
    domain_qc_available: bool
    review_required: bool
    blocking_findings: List[Dict[str, Any]] = field(default_factory=list)
    warning_count: int = 0
    explanation: str = ""

    @property
    def accepted(self) -> bool:
        return self.status in (AcceptanceStatus.ACCEPTED, AcceptanceStatus.ACCEPTED_WITH_WARNINGS)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "reason_code": self.reason_code,
            "unit_policy": self.unit_policy,
            "qc_policy": self.qc_policy,
            "domain_qc_available": self.domain_qc_available,
            "review_required": self.review_required,
            "blocking_findings": self.blocking_findings,
            "warning_count": self.warning_count,
            "explanation": self.explanation,
        }


def _qc_counts(qc_report: Optional[QualityReport]) -> Dict[str, int]:
    if qc_report is None:
        return {"ERROR": 0, "WARNING": 0, "INFO": 0}
    return qc_report.counts_by_severity


# Unit-finding statuses that STRICT treats as blocking (Phase 3.10 canonical:
# a required unit that is missing, unknown, or incompatible is not downgradeable).
_UNIT_FINDING_STATUSES = {"UNIT_MISSING", "UNIT_UNKNOWN", "UNIT_INCOMPATIBLE"}


def decide_acceptance(
    contract_valid: bool,
    unit_policy: str,
    unit_findings: List[Dict[str, Any]],
    qc_report: Optional[QualityReport],
    qc_policy: Optional[QualityControlPolicy] = None,
    domain_qc_available: bool = True,
    review_required: bool = False,
) -> AcceptanceDecision:
    """Pure, deterministic acceptance decision (does not mutate inputs).

    Mirrors the canonical Phase 3.10 precedence implemented by
    :func:`hydroma.ingest.ingest_climate` so that every public climate entry
    point reaches the same decision for the same input and policy:

    1. contract invalid -> ``CONTRACT_INVALID``
    2. STRICT unit requirement -> ``STRICT_UNIT_MISSING``
    3. blocking QC error -> ``QC_ERROR``
    4. domain QC unavailable -> ``QC_UNAVAILABLE`` (PENDING_REVIEW)
    5. explicit review -> ``REVIEW_REQUIRED`` (PENDING_REVIEW)
    6. non-blocking QC error -> ``QC_ERRORS_NONBLOCKING`` (ACCEPTED_WITH_WARNINGS)
    7. blocking QC warning -> ``QC_WARNING_BLOCKING``
    8. non-blocking QC warning -> ``QC_WARNINGS`` (ACCEPTED_WITH_WARNINGS)
    9. clean -> ``PASSED`` (ACCEPTED)
    """
    qc_policy = qc_policy or QualityControlPolicy()
    counts = _qc_counts(qc_report)
    errors = [f for f in (qc_report.flags if qc_report else []) if f.get("severity") == "ERROR"]
    warnings = [f for f in (qc_report.flags if qc_report else []) if f.get("severity") == "WARNING"]
    unit_findings = unit_findings or []

    def dec(status: AcceptanceStatus, reason: str, explanation: str) -> AcceptanceDecision:
        return AcceptanceDecision(
            status=status, reason_code=reason, unit_policy=unit_policy,
            qc_policy=qc_policy.to_dict(), domain_qc_available=domain_qc_available,
            review_required=review_required, blocking_findings=errors if not accepted_status(status) else [],
            warning_count=counts.get("WARNING", 0), explanation=explanation,
        )

    def accepted_status(s: AcceptanceStatus) -> bool:
        return s in (AcceptanceStatus.ACCEPTED, AcceptanceStatus.ACCEPTED_WITH_WARNINGS)

    # Rule 1 — contract failure (structural defects always block, never downgraded)
    if not contract_valid:
        return dec(AcceptanceStatus.REJECTED, "CONTRACT_INVALID", "dataset violates its structural contract")
    # Rule 2 — STRICT unit requirements (missing/unknown/incompatible, not downgradeable)
    if unit_policy == "STRICT" and any(f.get("status") in _UNIT_FINDING_STATUSES for f in unit_findings):
        return dec(AcceptanceStatus.REJECTED, "STRICT_UNIT_MISSING", "STRICT policy: required unit metadata missing or incompatible")
    # Rule 3 — blocking QC errors
    if errors and qc_policy.error_blocks_execution:
        return dec(AcceptanceStatus.REJECTED, "QC_ERROR", f"{len(errors)} blocking QC error(s)")
    # Rule 4 — domain QC unavailable
    if not domain_qc_available:
        return dec(AcceptanceStatus.PENDING_REVIEW, "QC_UNAVAILABLE", "no domain-appropriate QC available")
    # Rule 5 — explicit review
    if review_required:
        return dec(AcceptanceStatus.PENDING_REVIEW, "REVIEW_REQUIRED", "dataset flagged for manual review")
    # Rule 6 — non-blocking QC errors (canonical QC_ERRORS_NONBLOCKING)
    if errors and not qc_policy.error_blocks_execution:
        d = dec(AcceptanceStatus.ACCEPTED_WITH_WARNINGS, "QC_ERRORS_NONBLOCKING",
                f"{len(errors)} non-blocking QC error(s)")
        d.warning_count = counts.get("WARNING", 0)
        return d
    # Rule 7 — blocking warnings
    if warnings and qc_policy.warn_blocks_execution:
        return dec(AcceptanceStatus.REJECTED, "QC_WARNING_BLOCKING", "QC warnings configured to block")
    # Rule 8 — non-blocking warnings
    if warnings:
        d = dec(AcceptanceStatus.ACCEPTED_WITH_WARNINGS, "QC_WARNINGS", f"{len(warnings)} non-blocking warning(s)")
        d.warning_count = len(warnings)
        return d
    # Rule 9 — clean
    return dec(AcceptanceStatus.ACCEPTED, "PASSED", "all checks passed")


def validate_dataset(series: ClimateSeries, unit_policy: str = "LEGACY") -> Dict[str, Any]:
    """Structural validation (climate.validate_series) + unit-policy findings."""
    structural = validate_series(series)
    unit_findings: List[Dict[str, Any]] = []
    for i, obs in enumerate(series.observations):
        unit = obs.unit
        if unit is None or (isinstance(unit, str) and unit.strip() == ""):
            unit_findings.append({"path": f"observations[{i}].unit", "status": "UNIT_MISSING"})
        elif not is_known_unit(unit):
            unit_findings.append({"path": f"observations[{i}].unit", "status": "UNIT_UNKNOWN", "unit": unit})
        else:
            status = validate_unit(unit, unit)
            if status.get("status") == "UNIT_UNKNOWN":
                unit_findings.append({"path": f"observations[{i}].unit", "status": "UNIT_UNKNOWN", "unit": unit})
    errors = list(structural.get("errors", []))
    if unit_policy == "STRICT":
        for f in unit_findings:
            if f["status"] == "UNIT_MISSING":
                errors.append({"code": "UNIT_MISSING", "field": f["path"], "message": "missing unit metadata (STRICT)"})
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": structural.get("warnings", []),
        "units": unit_findings,
    }


@dataclass
class ModelReadyDataset:
    series: ClimateSeries
    acceptance: AcceptanceDecision
    provenance: Dict[str, Any]
    status: DatasetStatus = DatasetStatus.MODEL_READY

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "acceptance": self.acceptance.to_dict(),
            "provenance": self.provenance,
            "series_hash": self.provenance.get("normalized_hash"),
        }


def build_model_ready_dataset(
    series: ClimateSeries, acceptance: AcceptanceDecision, provenance: Dict[str, Any]
) -> ModelReadyDataset:
    """Enforce the model-ready gate: only accepted datasets may proceed."""
    if not acceptance.accepted:
        raise ValueError(f"dataset is {acceptance.status.value} ({acceptance.reason_code}); not model-ready")
    return ModelReadyDataset(series=series, acceptance=acceptance, provenance=provenance)


def _source_hash(source: Any, config: ImportConfig) -> str:
    if isinstance(source, str):
        try:
            with open(source, "rb") as fh:
                return hashlib.sha256(fh.read()).hexdigest()
        except OSError:
            return sha256_json({"source": source})
    return sha256_json({"source": config.source})


def run_ingestion_pipeline(
    source: Any,
    config: Optional[ImportConfig] = None,
    unit_policy: str = "LEGACY",
    qc_policy: Optional[QualityControlPolicy] = None,
    domain_qc_available: bool = True,
    review_required: bool = False,
) -> Dict[str, Any]:
    """Run the full ingestion + acceptance pipeline. Returns a structured result."""
    config = config or ImportConfig()
    qc_policy = qc_policy or QualityControlPolicy()

    # 1. INGEST (reuse climate_import)
    if isinstance(source, str):
        imported = import_file(source, config)
    else:
        # In-memory dataset: serialise to the climate JSON contract and import as JSON.
        config = ImportConfig(**{**config.__dict__, "format": "json"})
        imported = import_climate_data(_json.dumps(source), config)
    if imported.series is None:
        return {"status": DatasetStatus.REJECTED.value, "reason_code": "INGEST_ERROR",
                "errors": imported.errors, "warnings": imported.warnings}

    series = imported.series

    # 2. CONTRACT + UNIT VALIDATION
    contract = validate_dataset(series, unit_policy)
    # 3. QC (reuse quality)
    qc_report = assess_climate_quality(series, qc_policy)
    # 4. ACCEPTANCE
    decision = decide_acceptance(
        contract_valid=contract["valid"], unit_policy=unit_policy,
        unit_findings=contract["units"], qc_report=qc_report, qc_policy=qc_policy,
        domain_qc_available=domain_qc_available, review_required=review_required,
    )
    # 5. PROVENANCE (distinct hashes)
    provenance = {
        "source_hash": _source_hash(source, config),
        "normalized_hash": series_hash(series),
        "config_hash": sha256_json({"import_config": config.__dict__, "unit_policy": unit_policy}),
        "qc_config_hash": sha256_json(qc_policy.to_dict()),
        "result_hash": sha256_json({"normalized_hash": series_hash(series), "acceptance": decision.status.value}),
        "unit_policy": unit_policy,
        "qc_summary": {"counts_by_severity": _qc_counts(qc_report), "status": qc_report.status},
        "acceptance": decision.to_dict(),
        "records": imported.records_accepted,
    }
    # 6. MODEL-READY GATE
    if decision.accepted:
        model_ready = build_model_ready_dataset(series, decision, provenance)
        return {"status": DatasetStatus.MODEL_READY.value, "decision": decision.to_dict(),
                "provenance": provenance, "model_ready": model_ready.to_dict(),
                "model_ready_obj": model_ready,
                "qc_report": qc_report.to_dict(), "import_warnings": imported.warnings}
    return {"status": decision.status.value, "decision": decision.to_dict(),
            "provenance": provenance, "model_ready": None, "model_ready_obj": None,
            "qc_report": qc_report.to_dict(), "import_warnings": imported.warnings}


def et0_from_model_ready(model_ready, timestamp: str, rn_mm: float, ea_kpa: float) -> Dict[str, Any]:
    """Compute FAO-56 ET0 from an ACCEPTED model-ready climate dataset.

    Enforces the model-ready gate: a non-MODEL_READY dataset is refused (no
    scientific operation runs on rejected/pending data). Reuses the existing
    ``fao56_et0`` engine (no equation duplication).
    """
    if model_ready is None or getattr(model_ready, "status", None) != DatasetStatus.MODEL_READY:
        raise ValueError("dataset is not MODEL_READY; ET0 refused")
    from .fao56_et0 import compute_fao56_et0

    t = u2 = None
    for obs in model_ready.series.observations:
        if obs.timestamp != timestamp:
            continue
        if obs.variable == "air_temperature":
            t = obs.value
        elif obs.variable == "wind_speed":
            u2 = obs.value
    if t is None or u2 is None:
        raise ValueError(f"missing air_temperature/wind_speed at {timestamp!r}")
    result = compute_fao56_et0({"rn": rn_mm, "t": t, "u2": u2, "ea": ea_kpa, "g": 0.0})
    return {"et0": result, "source": "model_ready", "provenance": model_ready.provenance}