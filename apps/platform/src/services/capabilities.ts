/**
 * Module capability registry — the single source of truth for what the unified
 * frontend can genuinely do against the *existing* backend (`services/api`).
 *
 * It classifies every product module by the real API capability available today
 * so the UI can (a) wire real endpoints where they exist and (b) disclose the
 * exact missing capability where they do not — never faking success.
 *
 * Status vocabulary mirrors the mission's completion statuses:
 *  - `IMPLEMENTED`            backed by a real, exercised endpoint
 *  - `IMPLEMENTED_WITH_LIMITATIONS` backed, but with a documented boundary
 *  - `BLOCKED_BY_BACKEND`     no endpoint exists; frontend boundary only
 *  - `BLOCKED_BY_OWNER_DECISION` requires an owner/legal decision first
 *  - `BLOCKED_BY_EXTERNAL_DEPENDENCY` needs an external system
 */
export type CapabilityStatus =
  | "IMPLEMENTED"
  | "IMPLEMENTED_WITH_LIMITATIONS"
  | "BLOCKED_BY_BACKEND"
  | "BLOCKED_BY_OWNER_DECISION"
  | "BLOCKED_BY_EXTERNAL_DEPENDENCY";

/** Resource types the generic `/v1/resources/:type` endpoint accepts. */
export type ResourceType =
  | "landscapes"
  | "villages"
  | "projects"
  | "farms"
  | "sites"
  | "reports"
  | "courses"
  | "articles"
  | "surveys"
  | "runs"
  | "cropCycles"
  | "irrigationEvents"
  | "fieldObservations";

export const RESOURCE_TYPES: readonly ResourceType[] = [
  "landscapes",
  "villages",
  "projects",
  "farms",
  "sites",
  "reports",
  "courses",
  "articles",
  "surveys",
  "runs",
  "cropCycles",
  "irrigationEvents",
  "fieldObservations",
] as const;

export function isResourceType(value: string): value is ResourceType {
  return (RESOURCE_TYPES as readonly string[]).includes(value);
}

export type ModuleCapability = {
  id: string;
  /** Canonical product code (M01…M18) where one exists. */
  code: string;
  title: { fa: string; en: string; ar: string };
  /** Workspace route base under /platform. */
  route: string;
  status: CapabilityStatus;
  /** Real API surface this module can use today (empty when blocked). */
  api: string[];
  /** Precise missing capability, shown to the user when blocked. */
  missing?: string;
  /** If set, the module renders a real API-backed resource list of this type. */
  resourceType?: ResourceType;
};

export const MODULE_CAPABILITIES: ModuleCapability[] = [
  {
    id: "territories",
    code: "M01",
    title: { fa: "قلمرو و منظر", en: "Territories & Landscape", ar: "الأقاليم والمنظر" },
    route: "/platform/territories",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/landscapes", "GET /v1/resources/villages", "POST/PATCH/DELETE /v1/resources/:type"],
    missing: "Territory CRUD is complete and E2E-verified; geometry/GIS boundaries and cross-entity relations have no backend contract.",
    resourceType: "landscapes",
  },
  {
    id: "communities",
    code: "M02",
    title: { fa: "روستاها و جوامع", en: "Villages & Communities", ar: "القرى والمجتمعات" },
    route: "/platform/communities",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/villages", "GET /v1/organizations", "GET /v1/organizations/:id/members"],
    missing: "Village record CRUD is complete and E2E-verified; governance, membership, participation and consent workflows are not implemented. No demographic/personal data is collected.",
    resourceType: "villages",
  },
  {
    id: "natural-resources",
    code: "M03",
    title: { fa: "منابع طبیعی", en: "Natural Resources", ar: "الموارد الطبيعية" },
    route: "/platform/natural-resources",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/sites", "GET /v1/resources/landscapes"],
    missing: "A dedicated natural-resource registry (water/soil/habitat) is not modelled; sites and landscapes are the closest real records.",
    resourceType: "sites",
  },
  {
    id: "hydroma",
    code: "M04",
    title: { fa: "هایدراما", en: "HyDroMA", ar: "هايدروما" },
    route: "/platform/hydroma",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /health", "GET /v1/models", "GET /v1/runs"],
    missing: "Model execution runs through the external Python engine; the API exposes the registry and run history only. No scientific validation is claimed.",
  },
  {
    id: "agriculture",
    code: "M05",
    title: { fa: "کشاورزی و تولید", en: "Agriculture & Production", ar: "الزراعة والإنتاج" },
    route: "/platform/agriculture",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/farms", "POST/PATCH/DELETE /v1/resources/farms"],
    missing: "Farms CRUD is complete and E2E-verified; crop cycles, planning, calendar and operations have no backend contract yet.",
    resourceType: "farms",
  },
  {
    id: "tourism",
    code: "M06",
    title: { fa: "گردشگری", en: "Tourism", ar: "السياحة" },
    route: "/platform/tourism",
    status: "BLOCKED_BY_BACKEND",
    api: [],
    missing: "No destinations/experiences/availability endpoints exist. Booking and payment are not implemented and must not be faked.",
  },
  {
    id: "marketplace",
    code: "M07",
    title: { fa: "بازارگاه", en: "Marketplace", ar: "السوق" },
    route: "/platform/marketplace",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/catalog/products", "GET /v1/catalog/sellers", "GET /v1/catalog/categories", "POST /v1/catalog/products"],
    missing: "Catalog is real; orders, payments and settlement have no endpoint and are not faked.",
  },
  {
    id: "inventory",
    code: "M08",
    title: { fa: "موجودی و انبار", en: "Inventory", ar: "المخزون" },
    route: "/platform/inventory",
    status: "BLOCKED_BY_BACKEND",
    api: [],
    missing: "No stock, warehouse, movement, ledger or FEFO endpoints exist. Stock persistence cannot be faked.",
  },
  {
    id: "finance",
    code: "M09",
    title: { fa: "مالی و حسابداری", en: "Finance & Accounting", ar: "المالية والمحاسبة" },
    route: "/platform/finance",
    status: "BLOCKED_BY_BACKEND",
    api: [],
    missing: "No ledger, journal or double-entry endpoints exist. No financial operation is performed.",
  },
  {
    id: "ecocoin",
    code: "M10",
    title: { fa: "اکوکوین", en: "EcoCoin", ar: "إيكو كوين" },
    route: "/platform/ecocoin",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: [
      "GET /v1/ecocoin/summary",
      "GET /v1/ecocoin/ledger",
      "GET /v1/ecocoin/balance",
      "POST /v1/ecocoin/adjustments",
      "GET /v1/ecocoin/reconcile",
      "GET/POST/PATCH /v1/rewards/rules",
    ],
    missing:
      "Internal, non-tradable EcoCoin accounting with an immutable, idempotent ledger and reconstructible balances is implemented. Issuance, transfer, blockchain, exchange and redemption are intentionally NOT implemented and require an owner/legal decision.",
  },
  {
    id: "challenges",
    code: "M11",
    title: { fa: "چالش‌ها و پاداش‌ها", en: "Challenges & Rewards", ar: "التحديات والمكافآت" },
    route: "/platform/challenges",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: [
      "GET/POST/PATCH /v1/challenges",
      "POST /v1/challenges/:id/transition",
      "POST /v1/challenges/:id/participate",
      "GET /v1/challenges/:id/participations",
      "POST /v1/challenges/:id/participations/:pid/verify",
    ],
    missing:
      "Challenge catalogue, lifecycle and server-verified participation with idempotent, rule-based EcoCoin rewards are implemented. Automated reward issuance for unverified activity is not performed; verification is an explicit owner/admin attestation.",
  },
  {
    id: "community",
    code: "M12",
    title: { fa: "اجتماعی و مشارکت", en: "Community & Participation", ar: "المجتمع والمشاركة" },
    route: "/platform/community",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/notifications", "POST /v1/notifications/seen", "GET /v1/organizations/:id/members"],
    missing: "Notifications and membership are real; discussions/events have no endpoint.",
  },
  {
    id: "projects",
    code: "M13",
    title: { fa: "پروژه‌ها", en: "Projects", ar: "المشاريع" },
    route: "/platform/projects",
    status: "IMPLEMENTED",
    api: ["GET /v1/resources/projects", "POST/PATCH/DELETE /v1/resources/projects"],
    resourceType: "projects",
  },
  {
    id: "field",
    code: "M14",
    title: { fa: "عملیات میدانی", en: "Field Operations", ar: "العمليات الميدانية" },
    route: "/platform/field",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/surveys", "POST /v1/resources/surveys"],
    missing: "Survey capture is real; offline synchronization is not implemented and is not claimed.",
    resourceType: "surveys",
  },
  {
    id: "mrv",
    code: "M15",
    title: { fa: "پایش و راستی‌آزمایی", en: "MRV", ar: "الرصد والتحقق" },
    route: "/platform/mrv",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/sites", "GET /v1/resources/reports"],
    missing: "Monitoring records are real; carbon-credit issuance and independent verification are not implemented and are not faked.",
    resourceType: "sites",
  },
  {
    id: "knowledge",
    code: "M16",
    title: { fa: "دانش و اسناد", en: "Knowledge & Documents", ar: "المعرفة والمستندات" },
    route: "/platform/knowledge",
    status: "IMPLEMENTED",
    api: ["GET /v1/resources/articles", "GET /v1/resources/courses", "POST/PATCH/DELETE /v1/resources/:type"],
    resourceType: "articles",
  },
  {
    id: "reports",
    code: "M17",
    title: { fa: "گزارش‌ها و تحلیل", en: "Reports & Analytics", ar: "التقارير والتحليل" },
    route: "/platform/reports",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET /v1/resources/reports"],
    missing: "Stored reports are real; a live analytics/report-run engine does not exist and results are not fabricated.",
    resourceType: "reports",
  },
  {
    id: "administration",
    code: "M18",
    title: { fa: "مدیریت پلتفرم", en: "Platform Administration", ar: "إدارة المنصة" },
    route: "/platform/administration",
    status: "IMPLEMENTED_WITH_LIMITATIONS",
    api: ["GET/POST/PATCH /v1/users", "GET/POST/PATCH /v1/organizations", "GET /v1/organizations/:id/members"],
    missing: "Users, organizations and membership are real; audit-log and platform-settings endpoints are not exposed.",
  },
];

export function moduleById(id: string): ModuleCapability | undefined {
  return MODULE_CAPABILITIES.find((module) => module.id === id);
}

/** Modules that render a real API-backed resource list. */
export function resourceBackedModules(): ModuleCapability[] {
  return MODULE_CAPABILITIES.filter((module) => module.resourceType);
}

export function blockedModules(): ModuleCapability[] {
  return MODULE_CAPABILITIES.filter((module) => module.status.startsWith("BLOCKED"));
}