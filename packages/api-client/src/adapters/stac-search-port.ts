export interface StacSearchPort {
  search(query: unknown): Promise<unknown>;
  getCollection(id: string): Promise<unknown>;
}

export class HttpStacSearchPort implements StacSearchPort {
  async search(_query: unknown): Promise<unknown> {
    return { items: [] };
  }
  async getCollection(_id: string): Promise<unknown> {
    return null;
  }
}