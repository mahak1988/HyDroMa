# STAC Search Port Contract

Version: 0.1.0
Status: Proposed

## Interface

```ts
export interface StacSearchPort {
  search(query: unknown): Promise<unknown>;
  getCollection(id: string): Promise<unknown>;
}
```

## Notes
- Backend: pgSTAC.
- Tenant scoping required.