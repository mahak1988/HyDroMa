export type ListQuery = {
  search?: string;
  role?: string;
  status?: string;
  limit?: number;
  cursor?: string;
};

/** Query string builder shared by every list endpoint (no duplicated serialisation). */
export function toQuery(input: ListQuery): Record<string, string | number | undefined> {
  return {
    search: input.search?.trim() || undefined,
    role: input.role || undefined,
    status: input.status || undefined,
    limit: input.limit ?? undefined,
    cursor: input.cursor || undefined,
  };
}