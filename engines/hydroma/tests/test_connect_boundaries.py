"""Boundary tests: the scientific core must not depend on hydroma.connect.

Also verifies optional deps stay optional (core import works, pyproject core
dependencies empty, connect does not import optional libs at import time).
"""

import ast
import os

ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CORE_MODULES = [
    "hydroma.water_balance", "hydroma.fao56_et0", "hydroma.runtime",
    "hydroma.registry", "hydroma.jobs", "hydroma.evaluation", "hydroma.calibration",
    "hydroma.catalogue", "hydroma.climate", "hydroma.ingest", "hydroma.quality",
    "hydroma.free_sources", "hydroma.crop_dssat", "hydroma.soil_physics",
]


def test_core_does_not_import_connect():
    offenders = []
    for name in CORE_MODULES:
        path = os.path.join(ENGINE_ROOT, *name.split(".")[1:]) + ".py"
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as fh:
            tree = ast.parse(fh.read(), filename=path)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for a in node.names:
                    if a.name.split(".")[0] == "connect" or a.name.startswith("hydroma.connect"):
                        offenders.append((name, a.name))
            elif isinstance(node, ast.ImportFrom) and node.module:
                if node.module.split(".")[0] == "connect" or node.module.startswith("hydroma.connect"):
                    offenders.append((name, node.module))
    assert offenders == [], f"core imports connect: {offenders}"


def test_pyproject_core_dependencies_empty():
    path = os.path.join(ENGINE_ROOT, "pyproject.toml")
    with open(path, "r", encoding="utf-8") as fh:
        content = fh.read()
    assert "dependencies = []" in content
    assert "connect = [" in content  # optional group present


def test_connect_imports_without_optional_libs():
    import importlib
    import sys
    # Fresh import of the connect package must not require httpx/pystac.
    for mod in list(sys.modules):
        if mod.startswith("hydroma.connect"):
            del sys.modules[mod]
    importlib.import_module("hydroma.connect")
    import hydroma.connect.acquisition as acq
    src = open(acq.__file__, encoding="utf-8").read()
    # httpx import must be lazy (inside a function), never top-level.
    for line in src.splitlines():
        stripped = line.strip()
        if stripped.startswith("import httpx") or stripped.startswith("from httpx"):
            assert line.startswith(" "), "httpx must be imported lazily, not at top level"


def test_core_runs_without_connect_installed():
    # Importing a core model must not pull in connect.
    import importlib
    import sys
    for mod in list(sys.modules):
        if mod.startswith("hydroma.connect"):
            del sys.modules[mod]
    importlib.import_module("hydroma.fao56_et0")
    assert not any(m.startswith("hydroma.connect") for m in sys.modules)