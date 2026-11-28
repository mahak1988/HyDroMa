# Hydrological Model Port Contract

Version: 0.1.0
Status: Proposed

## Interface

```ts
export interface HydroModelPort {
  run(input: unknown): Promise<unknown>;
  getProvenance(): unknown;
}
```

## Notes
- Implementations: Hydromt, Wflow.
- Must include units, model version, data source, uncertainty.