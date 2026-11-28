export interface MapAdapter {
  init(container: HTMLElement, options?: unknown): Promise<void>;
  setCenter(lng: number, lat: number, zoom?: number): void;
  addLayer(layer: unknown): void;
  destroy(): void;
}

export class MapLibreAdapter implements MapAdapter {
  async init(_container: HTMLElement, _options?: unknown): Promise<void> {}
  setCenter(_lng: number, _lat: number, _zoom?: number): void {}
  addLayer(_layer: unknown): void {}
  destroy(): void {}
}

export class CesiumAdapter implements MapAdapter {
  async init(_container: HTMLElement, _options?: unknown): Promise<void> {}
  setCenter(_lng: number, _lat: number, _zoom?: number): void {}
  addLayer(_layer: unknown): void {}
  destroy(): void {}
}