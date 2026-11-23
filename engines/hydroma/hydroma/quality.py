"""Scientific data-quality & quality-control foundation (Phase 3.9).

A bounded, dependency-free QC layer that inspects climate observations and series
**before** they enter scientific computations. It detects and reports quality issues
without ever modifying original values (no imputation, smoothing, correction, or
timestamp repair).

It reuses the Phase 3.8 unit infrastructure (``hydroma.units``) and integrates with
the contract unit policy (``LEGACY``/``STRICT``). It does not duplicate the contract
validation framework; it is a complementary, observation-level QC pass.

Distinctions (kept explicit): data-quality assessment ≠ scientific model validation ≠
sensor calibration ≠ statistical uncertainty assessment.

Public API
----------
* :func:`assess_climate_quality` — QC a ``ClimateSeries``/observations.
* :class:`QualityControlPolicy` — enabled rules, thresholds, unit policy, blocking.
* :class:`QualityFlag`, :class:`QualityReport` — structured, serializable results.

Software-tested; **not** scientifically validated.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Sequence

from .climate import ClimateObservation, ClimateSeries, is_geographic_crs
from .provenance import sha256_json
from .units import get_unit, is_known_unit, validate_unit

__all__ = [
    "QUALITY_SCHEMA_VERSION",
    "SEVERITIES",
    "QUALITY_STATES",
    "QC_OUTCOMES",
    "UNIT_POLICIES",
    "QualityFlag",
    "QualityControlPolicy",
    "QualityReport",
    "assess_climate_quality",
    "qc_blocks_execution",
]

QUALITY_SCHEMA_VERSION = "1.0.0"
SEVERITIES = ("INFO", "WARNING", "ERROR")
QUALITY_STATES = ("GOOD", "SUSPECT", "BAD", "MISSING", "NOT_EVALUATED")
QC_OUTCOMES = ("PASS", "PASS_WITH_WARNINGS", "REJECTED", "NOT_EVALUATED")
UNIT_POLICIES = ("LEGACY", "STRICT")

# Rule identifiers (stable, versioned via the report schema).
RULE_MISSING_VALUE = "RULE-MISSING-VALUE"
RULE_NON_FINITE = "RULE-NON-FINITE"
RULE_UNKNOWN_VARIABLE = "RULE-UNKNOWN-VARIABLE"
RULE_UNIT_MISSING = "RULE-UNIT-MISSING"
RULE_UNIT_UNKNOWN = "RULE-UNIT-UNKNOWN"
RULE_UNIT_INCOMPATIBLE = "RULE-UNIT-INCOMPATIBLE"
RULE_PRECIP_NEGATIVE = "RULE-PRECIP-NEGATIVE"
RULE_RH_RANGE = "RULE-RH-RANGE"
RULE_WIND_NEGATIVE = "RULE-WIND-NEGATIVE"
RULE_RADIATION_NEGATIVE = "RULE-RADIATION-NEGATIVE"
RULE_TEMP_PLAUSIBILITY = "RULE-TEMP-PLAUSIBILITY"
RULE_DUPLICATE_TIMESTAMP = "RULE-DUPLICATE-TIMESTAMP"
RULE_NON_MONOTONIC = "RULE-NON-MONOTONIC"
RULE_MISSING_PERIODS = "RULE-MISSING-PERIODS"
RULE_INVALID_TIMESTAMP = "RULE-INVALID-TIMESTAMP"
RULE_LAT_RANGE = "RULE-LAT-RANGE"
RULE_LON_RANGE = "RULE-LON-RANGE"
RULE_SPATIAL_BOUNDS_NOT_EVALUATED = "RULE-SPATIAL-BOUNDS-NOT-EVALUATED"

# Variables with a physically meaningful range (hard bounds, not arbitrary thresholds).
_NON_NEGATIVE_VARIABLES = {"precipitation", "wind_speed", "solar_radiation", "evaporation"}


def _is_number(v: Any) -> bool:
    return isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(float(v))


def _flag(code, severity, message, field_path="", observation_id=None, rule_id="", metadata=None):
    return QualityFlag(code=code, severity=severity, message=message, field_path=field_path,
                       observation_id=observation_id, rule_id=rule_id or code,
                       metadata=metadata or {})


@dataclass
class QualityFlag:
    """A structured quality flag."""

    code: str
    severity: str
    message: str
    field_path: str = ""
    observation_id: Optional[str] = None
    rule_id: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "code": self.code,
            "severity": self.severity,
            "message": self.message,
            "field_path": self.field_path,
            "observation_id": self.observation_id,
            "rule_id": self.rule_id,
            "metadata": self.metadata,
        }


@dataclass
class QualityControlPolicy:
    """Configuration for the QC pass.

    ``unit_policy`` is the contract unit-enforcement mode (``LEGACY`` default).
    ``thresholds`` maps a variable to ``{"min", "max"}`` plausibility bounds (only
    applied when configured — no arbitrary defaults). ``warn_blocks_execution`` /
    ``error_blocks_execution`` control whether warnings/errors block a workflow.
    """

    unit_policy: str = "LEGACY"
    warn_blocks_execution: bool = False
    error_blocks_execution: bool = True
    thresholds: Dict[str, Dict[str, float]] = field(default_factory=dict)
    enabled_rules: Optional[Sequence[str]] = None

    def rule_enabled(self, rule_id: str) -> bool:
        return self.enabled_rules is None or rule_id in self.enabled_rules

    def to_dict(self) -> Dict[str, Any]:
        return {
            "unit_policy": self.unit_policy,
            "warn_blocks_execution": self.warn_blocks_execution,
            "error_blocks_execution": self.error_blocks_execution,
            "thresholds": self.thresholds,
            "enabled_rules": list(self.enabled_rules) if self.enabled_rules is not None else None,
        }


@dataclass
class QualityReport:
    """Structured, serializable QC report."""

    schema_version: str
    identity: Dict[str, Any]
    status: str
    record_count: int
    evaluated_count: int
    counts_by_severity: Dict[str, int]
    counts_by_state: Dict[str, int]
    flags: List[Dict[str, Any]]
    rules_applied: List[str]
    unit_policy: str
    policy: Dict[str, Any]
    warnings: List[str] = field(default_factory=list)
    limitations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "schema_version": self.schema_version,
            "identity": self.identity,
            "status": self.status,
            "record_count": self.record_count,
            "evaluated_count": self.evaluated_count,
            "counts_by_severity": self.counts_by_severity,
            "counts_by_state": self.counts_by_state,
            "flags": self.flags,
            "rules_applied": self.rules_applied,
            "unit_policy": self.unit_policy,
            "policy": self.policy,
            "warnings": self.warnings,
            "limitations": self.limitations,
        }

    def canonical_hash(self) -> str:
        """Deterministic SHA-256 of the report (no volatile timestamps)."""
        return sha256_json(self.to_dict())


def _record_state(flags: List[QualityFlag]) -> str:
    if any(f.severity == "ERROR" for f in flags):
        return "BAD"
    if any(f.severity == "WARNING" for f in flags):
        return "SUSPECT"
    return "GOOD"


def _evaluate_observation(obs: ClimateObservation, policy: QualityControlPolicy,
                          obs_id: str) -> List[QualityFlag]:
    flags: List[QualityFlag] = []
    var = obs.variable

    if obs.value is None:
        flags.append(_flag(RULE_MISSING_VALUE, "WARNING", "observation value is missing",
                           field_path=f"{obs_id}.value", observation_id=obs_id,
                           rule_id=RULE_MISSING_VALUE))
        return flags

    if not _is_number(obs.value):
        flags.append(_flag(RULE_NON_FINITE, "ERROR", f"value is not finite: {obs.value!r}",
                           field_path=f"{obs_id}.value", observation_id=obs_id,
                           rule_id=RULE_NON_FINITE))
        return flags

    # variable known?
    if var not in _KNOWN_VARIABLES:
        flags.append(_flag(RULE_UNKNOWN_VARIABLE, "ERROR", f"unknown climate variable {var!r}",
                           field_path=f"{obs_id}.variable", observation_id=obs_id,
                           rule_id=RULE_UNKNOWN_VARIABLE))

    # unit checks
    if obs.unit is None or (isinstance(obs.unit, str) and obs.unit.strip() == ""):
        if policy.unit_policy == "STRICT":
            flags.append(_flag(RULE_UNIT_MISSING, "ERROR", "observation has no unit metadata",
                               field_path=f"{obs_id}.unit", observation_id=obs_id,
                               rule_id=RULE_UNIT_MISSING))
        else:
            flags.append(_flag(RULE_UNIT_MISSING, "WARNING", "observation has no unit metadata",
                               field_path=f"{obs_id}.unit", observation_id=obs_id,
                               rule_id=RULE_UNIT_MISSING))
    elif not is_known_unit(obs.unit):
        flags.append(_flag(RULE_UNIT_UNKNOWN, "ERROR", f"unknown unit {obs.unit!r}",
                           field_path=f"{obs_id}.unit", observation_id=obs_id,
                           rule_id=RULE_UNIT_UNKNOWN))
    else:
        expected = _CANONICAL_UNIT.get(var)
        if expected is not None:
            status = validate_unit(obs.unit, expected)
            if status["status"] == "UNIT_INCOMPATIBLE":
                flags.append(_flag(RULE_UNIT_INCOMPATIBLE, "ERROR",
                                   f"unit {obs.unit!r} incompatible with expected {expected!r} for {var}",
                                   field_path=f"{obs_id}.unit", observation_id=obs_id,
                                   rule_id=RULE_UNIT_INCOMPATIBLE))

    # climate-specific physical/plausibility checks (explicit, variable-bound)
    if var in _NON_NEGATIVE_VARIABLES and float(obs.value) < 0 and policy.rule_enabled(_NON_NEG_RULE[var]):
        flags.append(_flag(_NON_NEG_RULE[var], "ERROR", f"{var} cannot be negative ({obs.value})",
                           field_path=f"{obs_id}.value", observation_id=obs_id,
                           rule_id=_NON_NEG_RULE[var]))
    if var == "relative_humidity" and obs.unit == "%" and policy.rule_enabled(RULE_RH_RANGE):
        v = float(obs.value)
        if v < 0.0 or v > 100.0:
            flags.append(_flag(RULE_RH_RANGE, "ERROR", f"relative humidity {v} outside [0, 100]",
                               field_path=f"{obs_id}.value", observation_id=obs_id,
                               rule_id=RULE_RH_RANGE))

    # configurable plausibility thresholds (warning only, no arbitrary defaults)
    bounds = policy.thresholds.get(var)
    if bounds and policy.rule_enabled(RULE_TEMP_PLAUSIBILITY):
        v = float(obs.value)
        lo, hi = bounds.get("min"), bounds.get("max")
        if (lo is not None and v < lo) or (hi is not None and v > hi):
            flags.append(_flag(RULE_TEMP_PLAUSIBILITY, "WARNING",
                               f"{var}={v} outside configured plausibility [{lo}, {hi}]",
                               field_path=f"{obs_id}.value", observation_id=obs_id,
                               rule_id=RULE_TEMP_PLAUSIBILITY))

    return flags


def _series_checks(series: ClimateSeries, policy: QualityControlPolicy,
                   errors: List[QualityFlag], warnings: List[QualityFlag]) -> None:
    obs = series.observations
    if not obs:
        return

    # duplicate / non-monotonic timestamps, evaluated per variable (a multi-variable
    # series legitimately carries several variables at the same timestamp).
    seen: Dict[Any, int] = {}
    prev: Dict[str, Any] = {}
    for i, o in enumerate(obs):
        try:
            ts = _ts_key(o.timestamp)
        except (ValueError, TypeError):
            continue
        key = (o.variable, ts)
        if key in seen and policy.rule_enabled(RULE_DUPLICATE_TIMESTAMP):
            warnings.append(_flag(RULE_DUPLICATE_TIMESTAMP, "WARNING",
                                  f"duplicate timestamp {o.timestamp!r} for {o.variable}",
                                  field_path=f"observations[{i}].timestamp", rule_id=RULE_DUPLICATE_TIMESTAMP))
        else:
            seen[key] = i
        p = prev.get(o.variable)
        if p is not None and ts < p:
            warnings.append(_flag(RULE_NON_MONOTONIC, "WARNING",
                                  f"observations for {o.variable} not in ascending time order",
                                  field_path=f"observations[{i}].timestamp", rule_id=RULE_NON_MONOTONIC))
        prev[o.variable] = ts if p is None else max(p, ts)

    # missing periods (only when a resolution is defined), evaluated per variable
    if series.temporal_resolution and policy.rule_enabled(RULE_MISSING_PERIODS):
        try:
            from .climate import parse_resolution
            res = parse_resolution(series.temporal_resolution)
            by_var: Dict[str, List] = {}
            for o in obs:
                by_var.setdefault(o.variable, []).append(o)
            for var, group in by_var.items():
                ordered = sorted(group, key=lambda o: _ts_key(o.timestamp))
                for a, b in zip(ordered, ordered[1:]):
                    gap = (_ts_key(b.timestamp) - _ts_key(a.timestamp)).total_seconds()
                    if gap > res.total_seconds():
                        warnings.append(_flag(RULE_MISSING_PERIODS, "WARNING",
                                              f"gap between {a.timestamp!r} and {b.timestamp!r} "
                                              f"for {var}",
                                              rule_id=RULE_MISSING_PERIODS))
        except (ValueError, TypeError):
            pass

    # spatial checks (CRS-aware: geographic bounds ONLY for a supported geographic CRS)
    sp = series.spatial
    if sp is not None:
        geo = is_geographic_crs(getattr(sp, "crs", None))
        if (sp.latitude is not None or sp.longitude is not None) and not geo:
            errors.append(_flag(RULE_SPATIAL_BOUNDS_NOT_EVALUATED, "INFO",
                                "geographic lat/lon bounds not evaluated (CRS not a supported geographic CRS)",
                                field_path="spatial.crs", rule_id=RULE_SPATIAL_BOUNDS_NOT_EVALUATED))
        if geo:
            if sp.latitude is not None and not (-90.0 <= float(sp.latitude) <= 90.0):
                errors.append(_flag(RULE_LAT_RANGE, "ERROR", f"latitude {sp.latitude} out of range",
                                    field_path="spatial.latitude", rule_id=RULE_LAT_RANGE))
            if sp.longitude is not None and not (-180.0 <= float(sp.longitude) <= 180.0):
                errors.append(_flag(RULE_LON_RANGE, "ERROR", f"longitude {sp.longitude} out of range",
                                    field_path="spatial.longitude", rule_id=RULE_LON_RANGE))


def _ts_key(value: str):
    from datetime import datetime, timezone
    text = str(value).strip()
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    dt = datetime.fromisoformat(text)
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def _known_variables():
    from .climate import CLIMATE_VARIABLES
    return set(CLIMATE_VARIABLES.keys())


_KNOWN_VARIABLES = _known_variables()

_CANONICAL_UNIT = {
    "air_temperature": "degC",
    "min_air_temperature": "degC",
    "max_air_temperature": "degC",
    "precipitation": "mm",
    "relative_humidity": "%",
    "wind_speed": "m/s",
    "solar_radiation": "MJ/m2/day",
    "evaporation": "mm",
}

_NON_NEG_RULE = {
    "precipitation": RULE_PRECIP_NEGATIVE,
    "wind_speed": RULE_WIND_NEGATIVE,
    "solar_radiation": RULE_RADIATION_NEGATIVE,
    "evaporation": RULE_RADIATION_NEGATIVE,
}


def assess_climate_quality(series: Any, policy: Optional[QualityControlPolicy] = None) -> QualityReport:
    """Assess a ``ClimateSeries`` (or observation list) and return a :class:`QualityReport`.

    Detects and reports quality issues; never modifies original observations.
    """
    policy = policy or QualityControlPolicy()

    if isinstance(series, ClimateSeries):
        observations = series.observations
        identity = {
            "kind": "climate_series",
            "variable": series.variable,
            "temporal_resolution": series.temporal_resolution,
        }
        spatial = series.spatial
        series_obj = series
    elif isinstance(series, (list, tuple)):
        observations = list(series)
        identity = {"kind": "observation_list"}
        spatial = None
        series_obj = None
    else:
        return QualityReport(
            schema_version=QUALITY_SCHEMA_VERSION, identity={"kind": "invalid"},
            status="NOT_EVALUATED", record_count=0, evaluated_count=0,
            counts_by_severity={s: 0 for s in SEVERITIES},
            counts_by_state={s: 0 for s in QUALITY_STATES},
            flags=[], rules_applied=[], unit_policy=policy.unit_policy,
            policy=policy.to_dict(),
            warnings=["input is not a ClimateSeries or observation list"],
            limitations=_LIMITATIONS,
        )

    all_flags: List[QualityFlag] = []
    states: Dict[str, int] = {s: 0 for s in QUALITY_STATES}
    evaluated = 0

    for i, obs in enumerate(observations):
        if not isinstance(obs, ClimateObservation):
            all_flags.append(_flag("RULE-STRUCTURE", "ERROR",
                                   "record is not a ClimateObservation",
                                   field_path=f"observations[{i}]", rule_id="RULE-STRUCTURE"))
            states["BAD"] += 1
            continue
        obs_id = f"observations[{i}]"
        flags = _evaluate_observation(obs, policy, obs_id)
        all_flags.extend(flags)
        state = "MISSING" if obs.value is None else _record_state(flags)
        states[state] += 1
        evaluated += 1

    # series-level checks
    if series_obj is not None:
        series_errors: List[QualityFlag] = []
        series_warnings: List[QualityFlag] = []
        _series_checks(series_obj, policy, series_errors, series_warnings)
        all_flags.extend(series_errors)
        all_flags.extend(series_warnings)

    # aggregate
    counts_by_severity = {s: 0 for s in SEVERITIES}
    for f in all_flags:
        counts_by_severity[f.severity] = counts_by_severity.get(f.severity, 0) + 1

    if any(f.severity == "ERROR" for f in all_flags):
        status = "REJECTED"
    elif any(f.severity == "WARNING" for f in all_flags):
        status = "PASS_WITH_WARNINGS"
    elif not observations:
        status = "NOT_EVALUATED"
    else:
        status = "PASS"

    rules_applied = sorted({f.rule_id for f in all_flags if f.rule_id})

    return QualityReport(
        schema_version=QUALITY_SCHEMA_VERSION,
        identity=identity,
        status=status,
        record_count=len(observations),
        evaluated_count=evaluated,
        counts_by_severity=counts_by_severity,
        counts_by_state=states,
        flags=[f.to_dict() for f in all_flags],
        rules_applied=rules_applied,
        unit_policy=policy.unit_policy,
        policy=policy.to_dict(),
        warnings=[],
        limitations=_LIMITATIONS,
    )


_LIMITATIONS = [
    "Data-quality assessment only; not scientific model validation, calibration, or uncertainty analysis.",
    "Detects and reports; never modifies, imputes, smooths, or corrects original observations.",
    "Plausibility thresholds are only applied when explicitly configured (no arbitrary defaults).",
    "ET0 is not treated as a direct observation; no provenance inference is performed.",
]


def qc_blocks_execution(report: QualityReport, policy: Optional[QualityControlPolicy] = None) -> bool:
    """Return True if the report should block workflow execution under the policy."""
    policy = policy or QualityControlPolicy()
    has_error = any(f["severity"] == "ERROR" for f in report.flags)
    has_warning = any(f["severity"] == "WARNING" for f in report.flags)
    if has_error and policy.error_blocks_execution:
        return True
    if has_warning and policy.warn_blocks_execution:
        return True
    return False