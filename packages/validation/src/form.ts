import type { z } from "zod";

/**
 * Zod → form bridge.
 *
 * Eco Nojin keeps Zod as the single validation source (shared by client and,
 * later, server). Forms do not bind Zod directly to inputs; they call
 * `validateWithSchema` and render the returned field errors. That keeps the
 * schema authoritative and the UI dumb.
 */
export type SchemaErrors<T> = Partial<Record<keyof T, string>>;

export type SchemaValidation<T> = {
  ok: boolean;
  data?: T;
  errors: SchemaErrors<T>;
};

function messageOf(issue: { message?: string; path?: Array<PropertyKey> } | undefined, fallback: string): string {
  if (!issue) return fallback;
  return typeof issue.message === "string" && issue.message.length > 0 ? issue.message : fallback;
}

/**
 * Validate `value` against `schema`. Every issue is mapped to its first path
 * segment so a form can render one message per field.
 */
export function validateWithSchema<T>(schema: z.ZodType<T>, value: unknown, fallbackMessage = "Invalid value"): SchemaValidation<T> {
  const result = schema.safeParse(value);
  if (result.success) {
    return { ok: true, data: result.data, errors: {} };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const segment = issue.path?.[0];
    const key = typeof segment === "string" || typeof segment === "number" ? String(segment) : "_form";
    if (!errors[key]) errors[key] = messageOf(issue, fallbackMessage);
  }
  return { ok: false, errors: errors as SchemaErrors<T> };
}

/** Throw-free parse for API payloads and persisted state. */
export function parseOr<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const result = schema.safeParse(value);
  return result.success ? result.data : fallback;
}

/** Attach a Zod schema to a field descriptor (the "validation travels with the field" rule). */
export type FieldValidation<T> = {
  schema: z.ZodType<T>;
  labelKey?: string;
  hintKey?: string;
};