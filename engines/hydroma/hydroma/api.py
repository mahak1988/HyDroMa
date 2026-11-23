"""FastAPI application for the HyDroMA runtime (Phase 2.1 slice).

Local-first by design. The default binding is loopback (see ``run_local.py``).
Authentication and multi-tenancy are reserved but not enforced in this MVP:
tenant_id is recorded, not authorised. No business or financial capability is
exposed. This is not a public API.
"""

from __future__ import annotations

from typing import Optional

from fastapi import BackgroundTasks, FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .jobs import JobStore
from .registry import ModelRegistry
from .runtime import build_registry, execute_run

__all__ = ["create_app", "RunRequest"]


class RunRequest(BaseModel):
    model_id: str = Field(min_length=1)
    model_version: Optional[str] = None
    input: dict = Field(default_factory=dict)
    requested_by: str = "anonymous"
    tenant_id: Optional[str] = None


def create_app(store: Optional[JobStore] = None, registry: Optional[ModelRegistry] = None) -> FastAPI:
    app = FastAPI(title="HyDroMA Runtime", version="0.1.0")
    store = store or JobStore(":memory:")
    registry = registry or build_registry()
    app.state.store = store
    app.state.registry = registry

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(status_code=422, content={"detail": exc.errors()})

    @app.get("/health")
    def health():
        return {"status": "ok", "service": "hydroma", "version": "0.1.0"}

    @app.get("/v1/models")
    def list_models():
        return {
            "models": [
                {
                    "id": m["id"],
                    "version": m["version"],
                    "domain": m.get("domain"),
                    "title": m.get("title"),
                    "maturity": m.get("maturity"),
                    "scientific_status": m.get("scientific_status", "NOT_VALIDATED"),
                    "units": m.get("units", []),
                    "inputs": m.get("inputs", []),
                    "outputs": m.get("outputs", []),
                }
                for m in registry.list()
            ]
        }

    @app.post("/v1/runs", status_code=202)
    def create_run(payload: RunRequest, background: BackgroundTasks):
        model = registry.get(payload.model_id, payload.model_version)
        if model is None:
            raise HTTPException(status_code=404, detail=f"unknown model: {payload.model_id}")
        run_id = store.create_run(
            model_id=model["definition"]["id"],
            model_version=model["definition"]["version"],
            requested_by=payload.requested_by,
            input_data=payload.input,
            tenant_id=payload.tenant_id,
        )
        background.add_task(execute_run, store, run_id, registry)
        return {"run_id": run_id, "status": "queued",
                "model_id": model["definition"]["id"],
                "model_version": model["definition"]["version"]}

    @app.get("/v1/runs/{run_id}")
    def get_run(run_id: str):
        run = store.get_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="unknown run")
        return run

    @app.get("/v1/runs/{run_id}/provenance")
    def get_provenance(run_id: str):
        run = store.get_run(run_id)
        if run is None:
            raise HTTPException(status_code=404, detail="unknown run")
        prov = run.get("provenance_json")
        if prov is None:
            raise HTTPException(status_code=409, detail="provenance not yet available")
        return prov

    return app