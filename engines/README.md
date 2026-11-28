# engines/ — scientific and agent engines

**Status:** `hydroma` — implemented and tested (software maturity; every scientific model
`NOT_VALIDATED`). `ai-workforce` — governance layer implemented and tested (ADR-0013);
the agent **execution plane is NOT_ACTIVE**: no agent is connected to a tool or an LLM
provider, and payment, wallet, token or financial-execution tooling is forbidden.

**Authority:** root `README.md`, `ECONOJJIN-ARCHITECTURE-BASELINE.md`,
`ARCHITECTURE-DECISIONS-OPEN.md`, `docs/adr/ADR-0013-ai-workforce-governance-layer.md`.

Engines are independent of business services: no engine imports `services/*`, and no
service imports engine internals. Communication happens through `contracts/*`.

- `hydroma` — the scientific engine (water, hydrology, soil, climate, agriculture, MRV,
  scenarios). Implemented and tested: see `engines/hydroma/README.md` (models, registry,
  runtime, workflows, evaluation, optional `connect` package per ADR-0011).
- `ai-workforce` — the agent runtime and registry. The governance layer (six-role
  permission table, immutable `id@version` agent registry, SHA-256 hash-chained audit
  trail, policy limits with a permanent financial-tooling ban, model-gateway contract) is
  implemented and tested with an empty dependency set; the execution plane is NOT_ACTIVE
  and activating it requires an owner decision recorded in a new ADR. See
  `engines/ai-workforce/README.md`.
