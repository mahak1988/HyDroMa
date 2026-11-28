"""Soil carbon & GHG accounting: RothC-lite, DNDC-lite, IPCC MRV, 4per1000.

Four bounded, deterministic, stdlib-only models (a single registered model that
dispatches on ``method``):

1. **RothC-lite** - first-order soil organic carbon turnover with a temperature
   and moisture rate modifier:

       C_t = C_{t-1} + input_t - k * f_t * C_{t-1}
       f_t = f_temp * f_moist,  f_temp = 2^((T-10)/10) (Q10=2),  f_moist in [0,1]

2. **DNDC-lite** - a simplified N2O emission from nitrogen input and a
   water-filled-pore-space / temperature response:

       N2O = EF * N_input * f_wfps * f_temp

3. **IPCC MRV (Tier 1)** - aggregate GHG: CO2 from SOC change (44/12),
   N2O from N (EF, 44/28), expressed as CO2-equivalent using GWP.

4. **4per1000** - the 0.4%/yr SOC stock-change target and the gap vs actual.

Software-tested; **NOT scientifically validated**.
"""

from __future__ import annotations

import math

__all__ = [
    "CARBON_MODEL",
    "CARBON_DEFINITION",
    "compute_rothc_lite",
    "compute_dndc_lite",
    "compute_ipcc_mrv",
    "compute_4per1000",
    "carbon_adapter",
    "validate_carbon_input",
]

ROUND_DECIMALS = 4
GWP_N2O = 273.0  # AR6 GWP100 for N2O
GWP_CH4 = 27.9

CARBON_MODEL = {
    "id": "eco-nojin.hydroma.carbon-mrv",
    "version": "1.0.0",
    "state": "NOT_VALIDATED",
    "scientific_status": "NOT_VALIDATED",
    "equation": "C_t=C+input-k*f*C; N2O=EF*N*f; CO2e via GWP",
    "units": {"soc": "t/ha", "n2o": "kg N2O/ha", "co2e": "t CO2e/ha"},
    "method": "RothC-lite + DNDC-lite + IPCC MRV + 4per1000",
}

ASSUMPTIONS = [
    "first_order_soc_decay",
    "q10_temperature_modifier",
    "dncdc_lite_emission_factor",
    "ipcc_tier1",
    "4per1000_target_0_4pct",
]
LIMITATIONS = [
    "notValidated",
    "rothc_lite_single_pool",
    "dndc_lite_no_soil_processes",
    "ipcc_tier1_default_ef",
]
REFERENCES = [
    "Jenkinson, D.S., Rayner, J.H. (1977). The turnover of organic matter in soil. J. Soil Science 28.",
    "Li, C.S., et al. (1992). A model of nitrous oxide evolution (DNDC). J. Geophys. Res. 97.",
    "IPCC (2006). Guidelines for National GHG Inventories (2019 refinement).",
    "4 per 1000 Initiative (2019). Science and action for soil carbon.",
]


def _round(value: float, decimals: int = ROUND_DECIMALS) -> float:
    factor = 10 ** decimals
    return math.floor(value * factor + 0.5) / factor


def _finite(value) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(float(value))


def validate_carbon_input(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "rothc")
    errors: list = []
    if method == "rothc":
        if not _finite(input.get("initial_soc_t_ha")) or float(input.get("initial_soc_t_ha", -1)) < 0:
            errors.append({"field": "initial_soc_t_ha", "code": "INVALID"})
        if not _finite(input.get("decay_k")) or float(input.get("decay_k", -1)) < 0:
            errors.append({"field": "decay_k", "code": "INVALID"})
        steps = input.get("steps")
        if not isinstance(steps, list) or len(steps) == 0:
            errors.append({"field": "steps", "code": "INVALID"})
    elif method == "dndc":
        if not _finite(input.get("n_input_kg_ha")) or float(input.get("n_input_kg_ha", -1)) < 0:
            errors.append({"field": "n_input_kg_ha", "code": "INVALID"})
        if not _finite(input.get("emission_factor")):
            errors.append({"field": "emission_factor", "code": "INVALID"})
    elif method == "ipcc":
        for key in ("soc_change_t_ha", "n_input_kg_ha"):
            if not _finite(input.get(key)):
                errors.append({"field": key, "code": "INVALID"})
    elif method == "4per1000":
        if not _finite(input.get("soc_stock_t_ha")) or float(input.get("soc_stock_t_ha", -1)) < 0:
            errors.append({"field": "soc_stock_t_ha", "code": "INVALID"})
    return {"valid": len(errors) == 0, "errors": errors}


def compute_rothc_lite(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_carbon_input(input)
    if not validation["valid"]:
        return {"ok": False, "model": CARBON_MODEL, "errors": validation["errors"]}
    c = float(input["initial_soc_t_ha"])
    k = float(input["decay_k"])
    steps = input["steps"]
    track = []
    c0 = c
    for i, st in enumerate(steps):
        t = float(st.get("temp_c", 10.0))
        moist = float(st.get("moisture_scalar", 1.0))
        inp = float(st.get("input_t_ha", 0.0))
        f_temp = 2.0 ** ((t - 10.0) / 10.0)
        f = f_temp * max(0.0, min(1.0, moist))
        decay = k * f * c
        c = c + inp - decay
        track.append({"step": st.get("date", i), "f": _round(f),
                      "input_t_ha": _round(inp), "decay_t_ha": _round(decay),
                      "soc_t_ha": _round(c)})
    return {
        "ok": True, "model": CARBON_MODEL,
        "result": {"method": "RothC-lite", "initial_soc_t_ha": _round(c0),
                   "final_soc_t_ha": _round(c), "delta_soc_t_ha": _round(c - c0),
                   "steps": len(steps), "track": track},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_dndc_lite(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_carbon_input({**input, "method": "dndc"})
    if not validation["valid"]:
        return {"ok": False, "model": CARBON_MODEL, "errors": validation["errors"]}
    n = float(input["n_input_kg_ha"])
    ef = float(input["emission_factor"])  # kg N2O-N / kg N
    wfps = float(input.get("wfps", 0.6))
    t = float(input.get("temp_c", 15.0))
    f_wfps = math.exp(-((wfps - 0.65) ** 2) / (2 * 0.15 ** 2))  # peak near 0.65
    f_temp = 2.0 ** ((t - 15.0) / 10.0)
    n2o_n = ef * n * f_wfps * f_temp          # kg N2O-N/ha
    n2o = n2o_n * 44.0 / 28.0                  # kg N2O/ha
    return {
        "ok": True, "model": CARBON_MODEL,
        "result": {"method": "DNDC-lite", "n_input_kg_ha": _round(n),
                   "f_wfps": _round(f_wfps), "f_temp": _round(f_temp),
                   "n2o_n_kg_ha": _round(n2o_n), "n2o_kg_ha": _round(n2o)},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_ipcc_mrv(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_carbon_input({**input, "method": "ipcc"})
    if not validation["valid"]:
        return {"ok": False, "model": CARBON_MODEL, "errors": validation["errors"]}
    dsoc = float(input["soc_change_t_ha"])   # t C/ha/yr (negative = loss)
    n_in = float(input["n_input_kg_ha"])
    ef = float(input.get("emission_factor", 0.01))
    co2 = -dsoc * 44.0 / 12.0                 # t CO2/ha (loss positive)
    n2o_n = ef * n_in                          # kg N2O-N/ha
    n2o = n2o_n * 44.0 / 28.0 / 1000.0         # t N2O/ha
    co2e = co2 + n2o * GWP_N2O
    return {
        "ok": True, "model": CARBON_MODEL,
        "result": {"method": "IPCC Tier 1 MRV", "soc_change_t_ha": _round(dsoc),
                   "co2_t_ha": _round(co2), "n2o_t_ha": _round(n2o),
                   "co2e_t_ha": _round(co2e), "gwp_n2o": GWP_N2O},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def compute_4per1000(input: dict | None = None) -> dict:
    input = input or {}
    validation = validate_carbon_input({**input, "method": "4per1000"})
    if not validation["valid"]:
        return {"ok": False, "model": CARBON_MODEL, "errors": validation["errors"]}
    stock = float(input["soc_stock_t_ha"])
    actual_rate = float(input.get("actual_rate_pct", 0.0))
    target_rate = 0.4
    target_delta = stock * target_rate / 100.0
    actual_delta = stock * actual_rate / 100.0
    gap = target_delta - actual_delta
    return {
        "ok": True, "model": CARBON_MODEL,
        "result": {"method": "4per1000", "soc_stock_t_ha": _round(stock),
                   "target_rate_pct": target_rate, "target_delta_t_ha_yr": _round(target_delta),
                   "actual_rate_pct": _round(actual_rate), "actual_delta_t_ha_yr": _round(actual_delta),
                   "gap_t_ha_yr": _round(gap), "target_met": gap <= 0.0},
        "assumptions": ASSUMPTIONS, "limitations": LIMITATIONS, "references": REFERENCES,
    }


def carbon_adapter(input: dict | None = None) -> dict:
    input = input or {}
    method = input.get("method", "rothc")
    if method == "dndc":
        return compute_dndc_lite(input)
    if method == "ipcc":
        return compute_ipcc_mrv(input)
    if method == "4per1000":
        return compute_4per1000(input)
    return compute_rothc_lite(input)


CARBON_DEFINITION = {
    "id": CARBON_MODEL["id"],
    "version": CARBON_MODEL["version"],
    "domain": "soil",
    "title": "Carbon & GHG (RothC-lite, DNDC-lite, IPCC MRV, 4per1000)",
    "executionMode": "local",
    "maturity": "tested",
    "scientific_status": "NOT_VALIDATED",
    "units": ["t/ha", "kg/ha", "t CO2e/ha"],
    "precision": {"decimals": ROUND_DECIMALS, "rounding": "half_up"},
    "inputs": [
        {"name": "method", "kind": "string", "required": False,
         "description": "rothc (default) | dndc | ipcc | 4per1000"},
        {"name": "initial_soc_t_ha", "kind": "number", "required": False},
        {"name": "decay_k", "kind": "number", "required": False},
        {"name": "steps", "kind": "array", "required": False},
        {"name": "n_input_kg_ha", "kind": "number", "required": False},
        {"name": "emission_factor", "kind": "number", "required": False},
        {"name": "soc_change_t_ha", "kind": "number", "required": False},
        {"name": "soc_stock_t_ha", "kind": "number", "required": False},
        {"name": "actual_rate_pct", "kind": "number", "required": False},
    ],
    "outputs": [
        {"name": "delta_soc_t_ha", "kind": "number"},
        {"name": "co2e_t_ha", "kind": "number"},
        {"name": "gap_t_ha_yr", "kind": "number"},
    ],
    "assumptions": ASSUMPTIONS,
    "limitations": LIMITATIONS,
    "references": REFERENCES,
    "validation": {
        "maturity": "tested",
        "evidence": [{"kind": "unit_test", "status": "pass",
                      "reference": "tests/test_carbon.py", "notes": "software only"}],
        "notes": "Software-tested only. Not validated.",
    },
    "provenanceRequiredFields": [
        "run_id", "model_id", "model_version", "code_version", "input_hashes",
        "parameter_hash", "environment", "executed_at", "operator",
        "result_hashes", "validation_status",
    ],
}