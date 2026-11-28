export interface HydroModelPort {
  run(input: unknown): Promise<unknown>;
  getProvenance(): unknown;
}

export class HydroModelAdapter implements HydroModelPort {
  async run(_input: unknown): Promise<unknown> {
    return null;
  }
  getProvenance(): unknown {
    return { version: "0.0.0", source: "stub", uncertainty: null };
  }
}