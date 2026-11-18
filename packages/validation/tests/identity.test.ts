import { describe, expect, it } from "vitest";
import {
  invitationCreateSchema,
  listQuerySchema,
  organizationCreateSchema,
  userCreateSchema,
  userUpdateSchema,
} from "../src/identity";

describe("user schemas", () => {
  it("normalises email and accepts a valid user", () => {
    const parsed = userCreateSchema.parse({
      name: "  Sara Ahmadi ",
      email: "  Sara@Example.COM ",
      phone: "+98 912 123 4567",
      role: "member",
    });
    expect(parsed.email).toBe("sara@example.com");
    expect(parsed.name).toBe("Sara Ahmadi");
  });

  it("rejects invalid email and short name", () => {
    const result = userCreateSchema.safeParse({ name: "A", email: "nope", role: "member" });
    expect(result.success).toBe(false);
    const codes = result.success ? [] : result.error.issues.map((issue) => issue.message);
    expect(codes).toContain("name.too_short");
    expect(codes).toContain("email.invalid");
  });

  it("allows partial updates including status", () => {
    expect(userUpdateSchema.parse({ status: "suspended" })).toEqual({ status: "suspended" });
  });

  it("rejects unknown roles", () => {
    expect(userCreateSchema.safeParse({ name: "Valid Name", email: "a@b.co", role: "superuser" }).success).toBe(false);
  });
});

describe("organization schemas", () => {
  it("accepts a valid organization and uppercases country", () => {
    const parsed = organizationCreateSchema.parse({
      name: "Karaj Watershed Council",
      slug: "karaj-watershed",
      country: "ir",
    });
    expect(parsed.country).toBe("IR");
    expect(parsed.kind).toBe("community");
  });

  it("rejects invalid slugs", () => {
    expect(
      organizationCreateSchema.safeParse({ name: "Bad Org", slug: "Bad Slug!", country: "IR" }).success,
    ).toBe(false);
  });
});

describe("invitation and query schemas", () => {
  it("validates invitations", () => {
    expect(invitationCreateSchema.parse({ email: "X@Y.ZZ", role: "manager" }).email).toBe("x@y.zz");
    expect(invitationCreateSchema.safeParse({ email: "bad", role: "manager" }).success).toBe(false);
  });

  it("coerces pagination limits and rejects out-of-range", () => {
    expect(listQuerySchema.parse({ limit: "25" }).limit).toBe(25);
    expect(listQuerySchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ limit: 101 }).success).toBe(false);
  });
});