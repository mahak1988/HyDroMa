"""Fixture-backed hydrological model adapter (no external deps).

Phase 3.80 — upstream Hydromt/Wflow integration seam.
Deterministic output for local development only. NOT_VALIDATED.
"""


class HydroFixtureAdapter:
    version = "0.0.0-fixture"

    def run(self, input_data):
        return {
            "status": "NOT_VALIDATED",
            "source": "fixture",
            "input": input_data,
            "output": None,
        }

    def get_provenance(self):
        return {
            "version": self.version,
            "source": "fixture",
            "uncertainty": None,
        }