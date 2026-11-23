"""Scientific data ingestion & quality-aware pipeline (Phase 3.10).

A small, modular pipeline that moves climate data from a source (CSV text, JSON text,
or an existing in-memory ``ClimateSeries``) through explicit stages:

    SOURCE -> INGEST -> NORMALIZE -> VALIDATE -> QC -> ACCEPTANCE -> MODEL-READY

It **reuses** existing components rather than duplicating them:

* ingestion/normalization: :mod:`hydroma.climate_import` (CSV/JSON -> ``ClimateSeries``);
* structural validation: :func:`hydroma.climate.validate_series`;
* quality control: :mod:`hydroma.quality` (Phase 3.9), including LEGACY/STRICT unit policy;
* hashing: :func:`hydroma.provenance.sha256_json` / :func:`hydroma.climate.series_hash`.

The pipeline never mutates raw source data. It produces a structured
:class:`IngestionResult` with a :class:`ScientificDataset`, the QC report, provenance, and an
explicit acceptance decision. Rejected datasets cannot be passed to the model-ready interface
(:func:`to_climate_series`).

Data-quality assessment is not scientific validation; scientific maturity stays
``NOT_VALIDATED``.

Public API
----------
* :func:`ingest_climate` — run the pipeline.
* :func:`to_climate_series` — return the model-ready ``ClimateSeries`` or raise.
* :class:`ClimateIngestionConfig`, :class:`IngestionResult`, :class:`ScientificDataset`.
"""

from __future__ import annotations

import hashlib
import math
import uuid
from dataclasses import asdict, dataclass, field, is_dataclass
from typing import Any, Dict, List, Optional

from .climate import ClimateSeries, series_hash, validate_series
from .climate_import import ImportConfig, import_csv, import_json
from .provenance import sha256_json
from .quality import QualityControlPolicy, QualityReport, assess_climate_quality

__all__ = [
    "INGESTION_SCHEMA_VERSION",
    "INGESTION_ID",
    "INGESTION_VERSION",
    "ACCEPTANCE_OUTCOMES",
    "SUPPORTED_DOMAINS",
    "IngestionError",
    "ScientificDataset",
    "ClimateIngestionConfig",
    "IngestionResult",
    "ingest_climate",
    "to_climate_series",
]

INGESTION_SCHEMA_VERSION = "1.0.0"
INGESTION_ID = "eco-nojin.hydroma.ingest"
INGESTION_VERSION = "1.0.0"

# Acceptance outcomes (distinct from QC status).
ACCEPTANCE_OUTCOMES = ("ACCEPTED", "ACCEPTED_WITH_WARNINGS", "REJECTED", "PENDING_REVIEW")

# Domains with a dedicated QC implementation (Phase 3.9 covers climate).
SUPPORTED_DOMAINS = ("climate",)


class IngestionError(Exception):
    """Raised when a model-ready dataset is requested but the dataset is not accepted."""


def _json_safe(obj: Any) -> Any:
    if obj is None or isinstance(obj, (str, int, float, bool)):
        return obj
    if is_dataclass(obj):
        return _json_safe(asdict(obj))
    if isinstance(obj, dict):
        return {str(k): _json_safe(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [_json_safe(v) for v in obj]
    if hasattr(obj, "to_dict") and callable(getattr(obj, "to_dict")):
        return _json_safe(obj.to_dict())
    return repr(obj)


def _err(code: str, field_name: str, message: str, **extra) -> Dict[str, Any]:
    d = {"code": code, "field": field_name, "message": message}
    d.update(extra)
    return d


# --- canonical dataset -----------------------------------------------------

@dataclass
class ScientificDataset:
    """A normalized, QC-assessed, accepted (or rejected) scientific dataset."""

    dataset_id: str
    dataset_version: str
    domain: str
    source: Dict[str, Any]
    series: Optional[ClimateSeries]
    variables: List[str]
    temporal_metadata: Dict[str, Any]
    spatial_metadata: Dict[str, Any]
    units: Dict[str, Any]
    provenance: Dict[str, Any]
    validation: Dict[str, Any]
    quality: Dict[str, Any]
    acceptance: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "dataset_id": self.dataset_id,
            "dataset_version": self.dataset_version,
            "domain": self.domain,
            "source": self.source,
            "series": self.series.to_dict() if self.series is not None else None,
            "variables": self.variables,
            "temporal_metadata": self.temporal_metadata,
            "spatial_metadata": self.spatial_metadata,
            "units": self.units,
            "provenance": self.provenance,
            "validation": self.validation,
            "quality": self.quality,
            "acceptance": self.acceptance,
        }


@dataclass
class ClimateIngestionConfig:
    """Configuration for the climate ingestion pipeline."""

    format: str = "csv"                                   # "csv" | "json" | "memory"
    import_config: Optional[ImportConfig] = None          # reused climate_import config
    unit_policy: str = "LEGACY"                           # "LEGACY" | "STRICT"
    qc_policy: Optional[QualityControlPolicy] = None      # defaults to unit_policy
    domain: str = "climate"
    dataset_id: Optional[str] = None
    dataset_version: str = "1.0.0"
    source_name: Optional[str] = None


@dataclass
class IngestionResult:
    """Structured outcome of the ingestion pipeline."""

    ok: bool
    status: str
    dataset: Optional[ScientificDataset]
    series: Optional[ClimateSeries]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    provenance: Dict[str, Any]
    quality: Dict[str, Any]
    validation: Dict[str, Any]
    acceptance: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "status": self.status,
            "dataset": self.dataset.to_dict() if self.dataset is not None else None,
            "series": self.series.to_dict() if self.series is not None else None,
            "errors": self.errors,
            "warnings": self.warnings,
            "provenance": self.provenance,
            "quality": self.quality,
            "validation": self.validation,
            "acceptance": self.acceptance,
        }


def _config_hash(config: ClimateIngestionConfig) -> str:
    return sha256_json(_json_safe({
        "format": config.format,
        "import_config": asdict(config.import_config) if config.import_config else None,
        "unit_policy": config.unit_policy,
        "qc_policy": config.qc_policy.to_dict() if config.qc_policy else None,
        "domain": config.domain,
        "dataset_id": config.dataset_id,
        "dataset_version": config.dataset_version,
    }))


def _ingest_source(source: Any, config: ClimateIngestionConfig):
    """Return (series, raw_meta, errors). Reuses climate_import for CSV/JSON."""
    fmt = config.format
    if fmt == "memory" or isinstance(source, ClimateSeries):
        if not isinstance(source, ClimateSeries):
            return None, None, [_err("INVALID_SOURCE", "source", "memory source must be a ClimateSeries")]
        return source, {"format": "memory", "content_hash": series_hash(source)}, []

    if not isinstance(source, str):
        return None, None, [_err("INVALID_SOURCE", "source", "source must be CSV/JSON text or a ClimateSeries")]

    import_config = config.import_config or ImportConfig(format=fmt)
    if fmt == "csv":
        imported = import_csv(source, import_config)
    elif fmt == "json":
        imported = import_json(source, import_config)
    else:
        return None, None, [_err("UNSUPPORTED_FORMAT", "format", f"unsupported format {fmt!r}")]

    content_hash = hashlib.sha256(source.encode("utf-8")).hexdigest()
    raw_meta = {"format": fmt, "content_hash": content_hash,
                "records_processed": imported.records_processed,
                "records_accepted": imported.records_accepted,
                "records_rejected": imported.records_rejected}
    if not imported.ok or imported.series is None:
        return None, raw_meta, list(imported.errors)
    return imported.series, raw_meta, list(imported.errors)


def ingest_climate(source: Any, config: Optional[ClimateIngestionConfig] = None) -> IngestionResult:
    """Run the climate ingestion pipeline. Never raises on bad input."""
    config = config or ClimateIngestionConfig()
    warnings: List[Dict[str, Any]] = []

    series, raw_meta, errors = _ingest_source(source, config)
    if series is None:
        return _result(False, "REJECTED", None, None, errors, warnings, config, raw_meta,
                       validation={"valid": False, "errors": errors, "warnings": []},
                       quality={}, acceptance={"status": "REJECTED", "reason": "ingest_failed"})

    # --- contract validation (structural; units handled by acceptance) ---
    full_contract = validate_series(series)
    unit_error_codes = {"INCOMPATIBLE_UNIT"}
    structural_errors = [e for e in full_contract["errors"]
                         if e.get("code") not in unit_error_codes]
    unit_errors = [e for e in full_contract["errors"]
                   if e.get("code") in unit_error_codes]
    contract_valid = len(structural_errors) == 0
    contract = {"valid": contract_valid, "errors": structural_errors,
                "warnings": full_contract["warnings"]}
    errors = list(errors) + structural_errors
    warnings = list(warnings) + contract["warnings"]

    # --- QC (reuse Phase 3.9) ---
    qc_policy = config.qc_policy or QualityControlPolicy(unit_policy=config.unit_policy)
    if config.domain in SUPPORTED_DOMAINS:
        qc_report: Optional[QualityReport] = assess_climate_quality(series, qc_policy)
        qc_dict = qc_report.to_dict()
        qc_status = qc_report.status
    else:
        qc_report = None
        qc_dict = {"status": "QC_NOT_AVAILABLE",
                   "reason": f"no QC implementation for domain {config.domain!r}"}
        qc_status = "QC_NOT_AVAILABLE"

    # --- acceptance precedence (approved Phase 3.10 semantics) ---
    qc_flags = qc_report.flags if qc_report is not None else []
    unit_rule_codes = {"RULE-UNIT-MISSING", "RULE-UNIT-UNKNOWN", "RULE-UNIT-INCOMPATIBLE"}
    qc_error_flags = [f for f in qc_flags if f["severity"] == "ERROR"]
    qc_warning_flags = [f for f in qc_flags if f["severity"] == "WARNING"]
    qc_unit_flags = [f for f in qc_flags if f["code"] in unit_rule_codes]
    qc_nonunit_errors = [f for f in qc_error_flags if f["code"] not in unit_rule_codes]

    if not contract_valid:
        status, reason = "REJECTED", "CONTRACT_INVALID"
    elif config.unit_policy == "STRICT" and (unit_errors or qc_unit_flags):
        status, reason = "REJECTED", "STRICT_UNIT_MISSING"
    elif qc_nonunit_errors and qc_policy.error_blocks_execution:
        status, reason = "REJECTED", "QC_ERROR"
    elif config.domain not in SUPPORTED_DOMAINS:
        status, reason = "PENDING_REVIEW", "QC_UNAVAILABLE"
    elif qc_status == "NOT_EVALUATED":
        status, reason = "PENDING_REVIEW", "REVIEW_REQUIRED"
    elif qc_error_flags and not qc_policy.error_blocks_execution:
        status, reason = "ACCEPTED_WITH_WARNINGS", "QC_ERRORS_NONBLOCKING"
    elif qc_warning_flags and qc_policy.warn_blocks_execution:
        status, reason = "REJECTED", "QC_WARNING_BLOCKING"
    elif qc_warning_flags:
        status, reason = "ACCEPTED_WITH_WARNINGS", "QC_WARNINGS"
    else:
        status, reason = "ACCEPTED", "PASSED"

    ok = status in ("ACCEPTED", "ACCEPTED_WITH_WARNINGS")

    dataset_id = config.dataset_id or f"dataset-{raw_meta['content_hash'][:12]}"
    acceptance = {"status": status, "reason": reason, "model_ready": ok}

    dataset = ScientificDataset(
        dataset_id=dataset_id,
        dataset_version=config.dataset_version,
        domain=config.domain,
        source=raw_meta or {},
        series=series,
        variables=sorted({o.variable for o in series.observations}),
        temporal_metadata={"temporal_resolution": series.temporal_resolution},
        spatial_metadata=series.spatial.to_dict() if series.spatial is not None else {},
        units={},
        provenance={},
        validation=contract,
        quality=qc_dict,
        acceptance=acceptance,
    )

    provenance = {
        "ingestion_id": INGESTION_ID,
        "ingestion_version": INGESTION_VERSION,
        "dataset_id": dataset_id,
        "dataset_version": config.dataset_version,
        "source": raw_meta,
        "config_hash": _config_hash(config),
        "normalized_dataset_hash": series_hash(series),
        "unit_policy": config.unit_policy,
        "qc_config": qc_policy.to_dict(),
        "qc_status": qc_status,
        "qc_hash": qc_report.canonical_hash() if qc_report is not None else None,
        "acceptance": status,
        "acceptance_reason": reason,
    }
    result_hash = sha256_json(_json_safe({
        "dataset_id": dataset_id,
        "status": status,
        "config_hash": provenance["config_hash"],
        "normalized_dataset_hash": provenance["normalized_dataset_hash"],
        "qc_hash": provenance["qc_hash"],
        "source_hash": raw_meta.get("content_hash") if raw_meta else None,
    }))
    provenance["result_hash"] = result_hash
    dataset.provenance = provenance

    return _result(ok, status, dataset, series if ok else None, errors, warnings, config,
                   raw_meta, validation=contract, quality=qc_dict, acceptance=acceptance,
                   provenance=provenance, result_hash=result_hash)


def _result(ok, status, dataset, series, errors, warnings, config, raw_meta,
            validation, quality, acceptance, provenance=None, result_hash=None) -> IngestionResult:
    if provenance is None:
        provenance = {
            "ingestion_id": INGESTION_ID,
            "ingestion_version": INGESTION_VERSION,
            "source": raw_meta,
            "config_hash": _config_hash(config),
            "unit_policy": config.unit_policy,
            "acceptance": status,
            "result_hash": result_hash or sha256_json(_json_safe({"status": status})),
        }
    return IngestionResult(
        ok=ok, status=status, dataset=dataset, series=series,
        errors=errors, warnings=warnings, provenance=provenance,
        quality=quality, validation=validation, acceptance=acceptance,
    )


def to_climate_series(result: IngestionResult) -> ClimateSeries:
    """Return the model-ready ``ClimateSeries`` or raise :class:`IngestionError`.

    Rejected/pending datasets cannot enter the model-ready interface.
    """
    if not isinstance(result, IngestionResult) or not result.ok or result.series is None:
        status = getattr(result, "status", "UNKNOWN")
        raise IngestionError(f"dataset is not model-ready (status={status})")
    return result.series