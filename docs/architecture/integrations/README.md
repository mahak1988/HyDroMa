# Integrations Architecture (branch index)

**Status:** SCAFFOLDED. No integration active, no credentials. Authoritative depth:
`integrations/README.md`, `architecture/UPSTREAM-*` (in docs/architecture), integration registry.

## Target

Integration boundaries · external provider registry · provider adapters · API connectors ·
authentication · credentials (never in repo) · contracts · data transformation · rate limiting ·
retry · failure handling · provider health · monitoring · provenance.

## Future integrations

Satellite · environmental · weather · AI providers · payment · notification · mapping · commerce ·
tourism · external research.

## Rule

Adapter-based: core domain modules never couple to a provider. Every adapter maps to `contracts/`,
reports uniform errors, records licence + provenance. Activation needs an owner decision + credential
procedure.

## Current state

6 adapter directories documented; none implemented; no provider connected.

## Related

- [../registries/integration-registry.md](../registries/integration-registry.md) · [../integration-map.md](../integration-map.md)