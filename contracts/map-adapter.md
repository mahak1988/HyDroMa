# Map Adapter Contract

Version: 0.1.0
Status: Proposed

## Interface

```ts
export interface MapAdapter {
  init(container: HTMLElement, options?: unknown): Promise<void>;
  setCenter(lng: number, lat: number, zoom?: number): void;
  addLayer(layer: unknown): void;
  destroy(): void;
}
```

## Notes
- Implementations: MapLibre (2D), Cesium (3D).
- No API keys required for base usage.