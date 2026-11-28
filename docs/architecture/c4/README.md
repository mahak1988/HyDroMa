# C4 Architecture Diagrams

**Status:** SCAFFOLDED. Text-based (Mermaid) C4 diagrams. They depict the **target** architecture and
mark the current state honestly. A box existing here does not mean the component is implemented.

| Level | File | Shows |
|---|---|---|
| C1 System Context | [system-context.md](./system-context.md) | Eco Nojin + users + external systems |
| C2 Container | [container-diagram.md](./container-diagram.md) | Apps, backend, DB, engine, services, storage |
| C3 Component | [component-diagram.md](./component-diagram.md) | Backend / engine / AI / frontend internals |
| Deployment | [deployment-diagram.md](./deployment-diagram.md) | Conceptual deployment (future vs current) |

## Legend

- Solid arrow = data/control flow.
- `[[...]]` = existing (implemented) component; `[...]` = planned/scaffolded.
- Dashed arrow `-.->` = planned connection.
- No diagram asserts deployment, scale or production readiness.

## Maintenance

Update a diagram only when the component registry or boundaries change, and keep the "current vs
planned" distinction. Do not add code-level (C4 Code) diagrams unless they materially clarify a
boundary (mission §35).