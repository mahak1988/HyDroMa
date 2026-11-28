"""Runtime: ties registry + job store + provenance together.

``execute_run`` claims a queued run, executes the registered model executor,
computes real SHA-256 provenance, and records the outcome. It never silently
invents hashes; a completed run always carries a complete provenance record.
"""

from __future__ import annotations

from typing import Optional

from . import __version__
from .jobs import JobStore
from .provenance import (
    ProvenanceRecord,
    extract_model_parameters,
    sha256_json,
    utc_now_iso,
    SCHEMA_VERSION,
)
from .registry import ModelRegistry
from .water_balance import WATER_BALANCE_DEFINITION, compute_water_balance
from .fao56_et0 import FAO56_ET0_DEFINITION, compute_fao56_et0
from .soil_water import SOIL_WATER_DEFINITION, compute_soil_water_storage
from .daily_soil_water import DAILY_SOIL_WATER_DEFINITION, simulate_daily_soil_water
from .crop_water import (
    FAO56_CROP_CHAIN_DEFINITION,
    FAO56_CROP_WATER_DEFINITION,
    compute_crop_water,
    simulate_crop_water_chain,
)
from .irrigation import IRRIGATION_DEFINITION, compute_irrigation_schedule
from .crop_etc import FAO56_CROP_ETC_DEFINITION, compute_crop_etc
from .effective_precip import (
    EFFECTIVE_PRECIP_DEFINITION,
    WATER_BALANCE_PRELIM_DEFINITION,
    compute_effective_precipitation,
    compute_preliminary_water_balance,
)
from .root_zone_balance import ROOT_ZONE_BALANCE_DEFINITION, compute_root_zone_balance
from .irrigation_plan import IRRIGATION_PLAN_DEFINITION, compute_irrigation_plan
from .farm_water_workflow import FARM_WATER_WORKFLOW_DEFINITION, run_farm_water_workflow
from .multi_period_sim import MULTI_PERIOD_SIM_DEFINITION, simulate_multi_period
from .climate_qc_integration import (
    CLIMATE_QC_GATE_DEFINITION,
    CLIMATE_SIM_BINDING_DEFINITION,
    climate_qc_gate_adapter,
    climate_sim_binding_adapter,
)
from .climate_crop_workflow import (
    CLIMATE_CROP_WORKFLOW_DEFINITION,
    climate_crop_workflow_adapter,
)
from .water_stress import WATER_STRESS_DEFINITION, compute_water_stress
from .irrigation_demand import IRRIGATION_DEMAND_DEFINITION, compute_irrigation_demand
from .evaluation import (
    EVALUATION_DEFINITION,
    EVALUATION_PROTOCOL_DEFINITION,
    build_evaluation_protocol_adapter,
    evaluate_model_outputs_adapter,
)
from .root_zone import (
    ROOT_ZONE_DEFINITION,
    compute_root_zone_water_balance,
)
from .drought import DROUGHT_DEFINITION, compute_drought_index
from .chilling import CHILLING_DEFINITION, chilling_adapter
from .crop_growth import CROP_GROWTH_DEFINITION, compute_crop_growth
from .pest_risk import PEST_RISK_DEFINITION, compute_pest_risk
from .plant_strengthening import (
    PLANT_STRENGTHENING_DEFINITION,
    compute_plant_strengthening,
)
from .groundwater import GROUNDWATER_DEFINITION, compute_groundwater_balance
from .drought_wmo import DROUGHT_WMO_DEFINITION, drought_wmo_adapter
from .crop_dual import (
    CROP_DUAL_DEFINITION,
    AQUACROP_LITE_DEFINITION,
    compute_dual_crop_etc,
    compute_aquacrop_lite,
)
from .soil_physics import SOIL_PHYSICS_DEFINITION, soil_physics_adapter
from .water_footprint import (
    WATER_FOOTPRINT_DEFINITION,
    SDG_WATER_STRESS_DEFINITION,
    compute_water_footprint,
    compute_sdg_water_stress,
)
from .groundwater_spatial import (
    GROUNDWATER_SPATIAL_DEFINITION,
    groundwater_spatial_adapter,
)
from .agroclimate import AGROCLIMATE_DEFINITION, agroclimate_adapter
from .surface_hydrology import (
    SURFACE_HYDROLOGY_DEFINITION,
    surface_hydrology_adapter,
)
from .carbon import CARBON_DEFINITION, carbon_adapter
from .water_productivity import (
    WATER_PRODUCTIVITY_DEFINITION,
    water_productivity_adapter,
)
from .biodiversity_stress import (
    BIODIVERSITY_DEFINITION,
    biodiversity_adapter,
)
from .drought_composite import DROUGHT_COMPOSITE_DEFINITION, drought_composite_adapter
from .isotope import ISOTOPE_DEFINITION, isotope_adapter
from .remote_sensing import GRACE_DEFINITION, compute_grace_anomaly
from .crop_dssat import CROP_DSSAT_DEFINITION, compute_dssat_lite
from .watershed import WATERSHED_DEFINITION, watershed_adapter
from .sdg_indicators import SDG_DEFINITION, sdg_adapter
from .rosetta import ROSETTA_DEFINITION, compute_rosetta
from .calibration import CALIBRATION_DEFINITION, compute_calibration

__all__ = ["build_registry", "execute_run", "build_provenance"]


def build_registry() -> ModelRegistry:
    registry = ModelRegistry()
    registry.register(WATER_BALANCE_DEFINITION, compute_water_balance)
    registry.register(FAO56_ET0_DEFINITION, compute_fao56_et0)
    registry.register(SOIL_WATER_DEFINITION, compute_soil_water_storage)
    registry.register(DAILY_SOIL_WATER_DEFINITION, simulate_daily_soil_water)
    registry.register(FAO56_CROP_WATER_DEFINITION, compute_crop_water)
    registry.register(FAO56_CROP_CHAIN_DEFINITION, simulate_crop_water_chain)
    registry.register(IRRIGATION_DEFINITION, compute_irrigation_schedule)
    registry.register(FAO56_CROP_ETC_DEFINITION, compute_crop_etc)
    registry.register(EFFECTIVE_PRECIP_DEFINITION, compute_effective_precipitation)
    registry.register(WATER_BALANCE_PRELIM_DEFINITION, compute_preliminary_water_balance)
    registry.register(ROOT_ZONE_BALANCE_DEFINITION, compute_root_zone_balance)
    registry.register(IRRIGATION_PLAN_DEFINITION, compute_irrigation_plan)
    registry.register(FARM_WATER_WORKFLOW_DEFINITION, run_farm_water_workflow)
    registry.register(MULTI_PERIOD_SIM_DEFINITION, simulate_multi_period)
    registry.register(CLIMATE_QC_GATE_DEFINITION, climate_qc_gate_adapter)
    registry.register(CLIMATE_SIM_BINDING_DEFINITION, climate_sim_binding_adapter)
    registry.register(CLIMATE_CROP_WORKFLOW_DEFINITION, climate_crop_workflow_adapter)
    registry.register(WATER_STRESS_DEFINITION, compute_water_stress)
    registry.register(IRRIGATION_DEMAND_DEFINITION, compute_irrigation_demand)
    registry.register(EVALUATION_DEFINITION, evaluate_model_outputs_adapter)
    registry.register(EVALUATION_PROTOCOL_DEFINITION, build_evaluation_protocol_adapter)
    registry.register(ROOT_ZONE_DEFINITION, compute_root_zone_water_balance)
    registry.register(DROUGHT_DEFINITION, compute_drought_index)
    registry.register(CHILLING_DEFINITION, chilling_adapter)
    registry.register(CROP_GROWTH_DEFINITION, compute_crop_growth)
    registry.register(PEST_RISK_DEFINITION, compute_pest_risk)
    registry.register(PLANT_STRENGTHENING_DEFINITION, compute_plant_strengthening)
    registry.register(GROUNDWATER_DEFINITION, compute_groundwater_balance)
    registry.register(DROUGHT_WMO_DEFINITION, drought_wmo_adapter)
    registry.register(CROP_DUAL_DEFINITION, compute_dual_crop_etc)
    registry.register(AQUACROP_LITE_DEFINITION, compute_aquacrop_lite)
    registry.register(SOIL_PHYSICS_DEFINITION, soil_physics_adapter)
    registry.register(WATER_FOOTPRINT_DEFINITION, compute_water_footprint)
    registry.register(SDG_WATER_STRESS_DEFINITION, compute_sdg_water_stress)
    registry.register(GROUNDWATER_SPATIAL_DEFINITION, groundwater_spatial_adapter)
    registry.register(AGROCLIMATE_DEFINITION, agroclimate_adapter)
    registry.register(SURFACE_HYDROLOGY_DEFINITION, surface_hydrology_adapter)
    registry.register(CARBON_DEFINITION, carbon_adapter)
    registry.register(WATER_PRODUCTIVITY_DEFINITION, water_productivity_adapter)
    registry.register(BIODIVERSITY_DEFINITION, biodiversity_adapter)
    registry.register(DROUGHT_COMPOSITE_DEFINITION, drought_composite_adapter)
    registry.register(ISOTOPE_DEFINITION, isotope_adapter)
    registry.register(GRACE_DEFINITION, compute_grace_anomaly)
    registry.register(CROP_DSSAT_DEFINITION, compute_dssat_lite)
    registry.register(WATERSHED_DEFINITION, watershed_adapter)
    registry.register(SDG_DEFINITION, sdg_adapter)
    registry.register(ROSETTA_DEFINITION, compute_rosetta)
    registry.register(CALIBRATION_DEFINITION, compute_calibration)
    return registry


def build_provenance(
    run_id: str,
    definition: dict,
    requested_by: str,
    input_data: dict,
    result: dict,
    environment: str = "local",
    input_units: Optional[dict] = None,
    parameters: Optional[dict] = None,
) -> dict:
    """Build a complete provenance record for a run.

    ``parameter_hash`` is the SHA-256 of the run's model parameter object (see
    :func:`hydroma.provenance.extract_model_parameters`), not a placeholder. When
    the model declares no independent parameters the parameter object is empty
    and its deterministic hash is recorded (documented, not a hardcoded string).
    ``parameters`` may be passed explicitly to override extraction (e.g. tests).
    """
    if parameters is None:
        parameters = extract_model_parameters(definition, input_data)
    record = ProvenanceRecord(
        run_id=run_id,
        model_id=definition["id"],
        model_version=definition["version"],
        code_version=__version__,
        input_hashes=[sha256_json(input_data)],
        parameter_hash=sha256_json(parameters),
        environment=environment,
        executed_at=utc_now_iso(),
        operator=requested_by,
        result_hashes=[sha256_json(result)],
        validation_status=definition.get("maturity", "stub"),
        schema_version=SCHEMA_VERSION,
        scientific_status=definition.get("scientific_status", "NOT_VALIDATED"),
        input_units=input_units if input_units is not None else {},
    )
    return record.to_dict()


def execute_run(
    store: JobStore,
    run_id: str,
    registry: ModelRegistry,
    environment: str = "local",
    worker_id: str = "worker-1",
) -> Optional[dict]:
    run = store.get_run(run_id)
    if run is None:
        return None
    if not store.claim(run_id, worker_id):
        return store.get_run(run_id)

    model = registry.get(run["model_id"], run["model_version"])
    if model is None:
        store.fail(run_id, {"code": "EXECUTION_NOT_AVAILABLE",
                            "message": f"model not registered: {run['model_id']}"})
        return store.get_run(run_id)

    input_data = run.get("input_json") or {}
    try:
        result = model["executor"](input_data)
    except Exception as exc:  # noqa: BLE001 - record, do not leak a stack trace
        store.fail(run_id, {"code": "NUMERICAL_FAILURE", "message": str(exc)})
        return store.get_run(run_id)

    # A model-level validation failure (ok=False) is still a completed run: the
    # executor ran and returned a structured result. The run status is completed;
    # the result carries ok/errors. The provenance records the executed result.
    provenance = build_provenance(
        run_id, model["definition"], run["requested_by"], input_data, result, environment
    )
    store.complete(run_id, result, provenance)
    return store.get_run(run_id)