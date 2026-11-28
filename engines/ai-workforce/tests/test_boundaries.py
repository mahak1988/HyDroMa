"""Boundary tests: stdlib-only imports, engine independence, hard rules.

Mirrors engines/hydroma/tests/test_boundaries.py:
- the package imports no third-party module (empty dependency set);
- the engine never references `apps/` or `services/`;
- financial tooling is rejected at every layer;
- the capability banner is honest.
"""

import ast
import os
import sys

import pytest

import ai_workforce
from ai_workforce import CAPABILITY_STATUS
from ai_workforce.permissions import PermissionScope
from ai_workforce.registry import (
    AgentDefinition,
    AgentRegistry,
    FORBIDDEN_TOOL_PATTERNS,
    InvalidAgentDefinition,
)
from ai_workforce.runtime import AgentRuntime

PACKAGE_DIR = os.path.join(os.path.dirname(ai_workforce.__file__))


def _iter_module_sources():
    for name in sorted(os.listdir(PACKAGE_DIR)):
        if name.endswith(".py"):
            path = os.path.join(PACKAGE_DIR, name)
            with open(path, "r", encoding="utf-8") as handle:
                yield name, handle.read()


def _top_level_imports(source: str):
    tree = ast.parse(source)
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                yield alias.name.split(".")[0]
        elif isinstance(node, ast.ImportFrom):
            if node.level == 0 and node.module:
                yield node.module.split(".")[0]


def test_package_imports_stdlib_only():
    stdlib = set(getattr(sys, "stdlib_module_names", ()))
    stdlib |= {"__future__", "ai_workforce"}
    offenders = {}
    for name, source in _iter_module_sources():
        for root in _top_level_imports(source):
            if root not in stdlib:
                offenders.setdefault(name, set()).add(root)
    assert offenders == {}, f"non-stdlib imports found: {offenders}"


def test_no_import_of_apps_or_services():
    """Engine independence: no module imports anything named apps/services."""
    offenders = {}
    for name, source in _iter_module_sources():
        tree = ast.parse(source)
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root = alias.name.split(".")[0]
                    if root in {"apps", "services"}:
                        offenders.setdefault(name, set()).add(root)
            elif isinstance(node, ast.ImportFrom):
                if node.level == 0 and node.module:
                    root = node.module.split(".")[0]
                    if root in {"apps", "services"}:
                        offenders.setdefault(name, set()).add(root)
    assert offenders == {}, f"engine imports business code: {offenders}"


def test_dependency_set_is_empty():
    pyproject = os.path.join(os.path.dirname(PACKAGE_DIR), "pyproject.toml")
    with open(pyproject, "r", encoding="utf-8") as handle:
        content = handle.read()
    assert 'dependencies = []' in content


@pytest.mark.parametrize("pattern", list(FORBIDDEN_TOOL_PATTERNS))
def test_financial_tools_rejected_by_registry(pattern):
    definition = AgentDefinition(
        agent_id="rogue.agent",
        version="1.0.0",
        role="employees",
        purpose="Attempt to declare financial tooling.",
        permitted_tools=(f"x.{pattern}",),
        permission_scope=PermissionScope(org_ids=frozenset({"org-1"})),
    )
    with pytest.raises(InvalidAgentDefinition):
        AgentRegistry().register(definition)


def test_capability_banner_is_honest():
    assert CAPABILITY_STATUS["execution_plane"] == "NOT_ACTIVE"
    assert CAPABILITY_STATUS["payment_tooling"] == "FORBIDDEN"
    assert CAPABILITY_STATUS["llm_connectivity"] == "NOT_CONNECTED"
    assert AgentRuntime().capability_status()["execution_plane"] == "NOT_ACTIVE"


def test_package_version_and_exports():
    assert ai_workforce.__version__ == "0.1.0"
    for name in (
        "AgentRuntime",
        "AgentRegistry",
        "AgentDefinition",
        "AuditLog",
        "check_permission",
        "evaluate_action",
        "redact",
        "call_provider",
    ):
        assert hasattr(ai_workforce, name), name
