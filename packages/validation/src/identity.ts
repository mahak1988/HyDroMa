import { z } from "zod";

const ROLE_KEYS = ["owner", "admin", "manager", "member", "viewer"] as const;
const ORG_KINDS = ["platform", "region", "community", "business", "research"] as const;
const USER_STATUSES = ["invited", "active", "suspended"] as const;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "email.too_short")
  .max(254, "email.too_long")
  .email("email.invalid");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "name.too_short")
  .max(80, "name.too_long");

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9 ()-]{7,20}$/, "phone.invalid")
  .optional()
  .or(z.literal("").transform(() => undefined));

export const roleSchema = z.enum(ROLE_KEYS);
export const orgKindSchema = z.enum(ORG_KINDS);
export const userStatusSchema = z.enum(USER_STATUSES);

export const localeSchema = z
  .string()
  .trim()
  .regex(/^[a-z]{2}(-[A-Za-z0-9]{2,8})?$/, "locale.invalid")
  .optional();

export const userCreateSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: roleSchema,
  locale: localeSchema,
});

export const userUpdateSchema = userCreateSchema.partial().extend({
  status: userStatusSchema.optional(),
});

export const organizationCreateSchema = z.object({
  name: nameSchema,
  slug: z
    .string()
    .trim()
    .min(2, "slug.too_short")
    .max(40, "slug.too_long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug.invalid"),
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "country.invalid"),
  kind: orgKindSchema.default("community"),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

export const invitationCreateSchema = z.object({
  email: emailSchema,
  role: roleSchema,
});

export const membershipRoleSchema = z.object({ role: roleSchema });

export const listQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  role: roleSchema.optional(),
  status: userStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(200).optional(),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type OrganizationCreateInput = z.input<typeof organizationCreateSchema>;
export type OrganizationUpdateInput = z.input<typeof organizationUpdateSchema>;
export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type MembershipRoleInput = z.infer<typeof membershipRoleSchema>;
export type ListQueryInput = z.infer<typeof listQuerySchema>;
export type OrganizationRole = z.infer<typeof roleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;