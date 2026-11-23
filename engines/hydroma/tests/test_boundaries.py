"""Architectural boundary tests (import isolation, no heavy dependencies).

These guard the rules from the requirements map:

* The scientific runtime must stay importable with an empty dependency set.
* STAC and tiling are optional/adapter layers: they must not import PySTAC,
  TiTiler, rio-tiler, rasterio, or any HTTP/geospatial framework.
* The engine never imports from apps/services.
"""

import ast
import importlib
import os
import sys

ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SCIENTIFIC_MODULES = [
    "hydroma.units",
    "hydroma.provenance",
    "hydroma.maturity",
    "hydroma.water_balance",
    "hydroma.fao56_et0",
    "hydroma.registry",
    "hydroma.jobs",
    "hydroma.runtime",
    "hydroma.verification",
    "hydroma.spatial",
    "hydroma.data",
    "hydroma.stac",
    "hydroma.tiling",
    "hydroma.catalogue",
    "hydroma.climate",
    "hydroma.climate_import",
    "hydroma.climate_et0",
    "hydroma.soil_water_series",
    "hydroma.root_zone",
    "hydroma.crop_water_series",
    "hydroma.irrigation_series",
    "hydroma.scenario",
    "hydroma.workflow",
    "hydroma.contracts",
    "hydroma.experiment",
    "hydroma.compare",
    "hydroma.quality",
    "hydroma.ingest",
    "hydroma.climate_qc_integration",
    "hydroma.climate_crop_workflow",
    "hydroma.water_stress",
    "hydroma.irrigation_demand",
    "hydroma.evaluation",
]

# Modules that must NOT import the catalogue (scientific execution stays independent).
EXECUTION_MODULES = [
    "hydroma.water_balance",
    "hydroma.fao56_et0",
    "hydroma.runtime",
    "hydroma.registry",
    "hydroma.jobs",
    "hydroma.verification",
    "hydroma.provenance",
]

FORBIDDEN_IMPORTS = {
    "pystac",
    "titiler",
    "rio_tiler",
    "rasterio",
    "geopandas",
    "xarray",
    "hydromt",
    "hydromt_wflow",
    "fastapi",
    "starlette",
    "httpx",
    "flask",
    "django",
}


def test_scientific_modules_import_without_third_party():
    for name in SCIENTIFIC_MODULES:
        importlib.import_module(name)


def test_no_forbidden_third_party_imports():
    offenders = []
    for name in SCIENTIFIC_MODULES:
        path = os.path.join(ENGINE_ROOT, *name.split(".")[1:]) + ".py"
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            tree = ast.parse(fh.read(), filename=path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root = alias.name.split(".")[0]
                    if root in FORBIDDEN_IMPORTS:
                        offenders.append((name, alias.name))
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root = node.module.split(".")[0]
                    if root in FORBIDDEN_IMPORTS:
                        offenders.append((name, node.module))
    assert offenders == [], f"forbidden third-party imports: {offenders}"


def test_engine_does_not_import_apps_or_services():
    offenders = []
    for name in SCIENTIFIC_MODULES:
        path = os.path.join(ENGINE_ROOT, *name.split(".")[1:]) + ".py"
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            tree = ast.parse(fh.read(), filename=path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.split(".")[0] in {"apps", "services"}:
                        offenders.append((name, alias.name))
            elif isinstance(node, ast.ImportFrom) and node.module:
                if node.module.split(".")[0] in {"apps", "services"}:
                    offenders.append((name, node.module))
    assert offenders == [], f"engine imports business layers: {offenders}"


def test_api_module_imports_fastapi_but_not_scientific_deps():
    # api.py is the only module allowed to import the HTTP framework; it must not
    # import the STAC/tiling adapters (those stay optional).
    path = os.path.join(ENGINE_ROOT, "hydroma", "api.py")
    with open(path, "r", encoding="utf-8") as fh:
        source = fh.read()
    assert "fastapi" in source
    assert "pystac" not in source
    assert "titiler" not in source


def test_pyproject_declares_no_runtime_dependencies():
    path = os.path.join(ENGINE_ROOT, "pyproject.toml")
    with open(path, "r", encoding="utf-8") as fh:
        content = fh.read()
    assert "dependencies = []" in content


def test_catalogue_imports_no_scientific_model():
    # The catalogue must not depend on model execution (no import of models/runtime).
    path = os.path.join(ENGINE_ROOT, "hydroma", "catalogue.py")
    with open(path, "r", encoding="utf-8") as fh:
        tree = ast.parse(fh.read(), filename=path)
    imported = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.ImportFrom) and node.module:
            imported.add(node.module.split(".")[0])
        elif isinstance(node, ast.Import):
            for alias in node.names:
                imported.add(alias.name.split(".")[0])
    for forbidden in ("hydroma.water_balance", "hydroma.fao56_et0", "hydroma.runtime",
                      "hydroma.registry", "hydroma.jobs"):
        assert forbidden not in imported, f"catalogue imports {forbidden}"


def test_execution_modules_do_not_import_catalogue():
    for name in EXECUTION_MODULES:
        path = os.path.join(ENGINE_ROOT, *name.split(".")[1:]) + ".py"
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            tree = ast.parse(fh.read(), filename=path)
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom) and node.module and node.module.endswith("catalogue"):
                raise AssertionError(f"{name} imports catalogue")
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.name.endswith("catalogue"):
                        raise AssertionError(f"{name} imports catalogue")