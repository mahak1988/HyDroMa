# Module Registry Schema

**Document ID:** `ECO-NOJIN-FE-REG-005`
**Status:** Contract + current registry
**Verified:** 2026-11-23 · HEAD `3dbd465`

This document defines the frontend module registry contract and documents the current 18-module registry. The registry is **descriptive**: it is the source for documentation, navigation design and tests. It is not yet enforced by a runtime module loader.

---

## 1. Files

| File | Role |
|---|---|
| [module-registry.json](./module-registry.json) | 18 module definitions. |
| [route-registry.json](./route-registry.json) | Route inventory (EXISTING / PARTIALLY_EXISTING / DEPRECATED_CANDIDATE / PROPOSED). |
| `apps/platform/src/sections/manifest.ts` | Runtime section manifest (internal/external, lazy loader). |
| `packages/configuration/apps.json` | App registry (`platform`, `brand`). |

---

## 2. TypeScript contract

```ts
export type ModuleStatus =
  | "IMPLEMENTED"
  | "PARTIALLY_EXISTING"
  | "PROPOSED"
  | "BACKEND_ONLY";

export type ModuleLayer =
  | "public"
  | "platform"
  | "domain"
  | "science"
  | "integration";

export interface ModuleDefinition {
  /** Stable module id, M01…M18. */
  moduleId: string;
  /** Stable key used by navigation and tests. */
  key: string;
  nameEn: string;
  nameFa: string;
  layer: ModuleLayer;
  status: ModuleStatus;
  /** Public route prefixes owned by the module. */
  entryRoutes: string[];
  /** Package/app that owns the implementation. */
  ownerPackage: string | null;
  /** Permissions required to enter the module. */
  permissions: string[];
  /** Module ids this module may depend on. */
  dependencies: string[];
  notes: string;
}

export interface ModuleRegistry {
  schemaVersion: string;
  generatedAt: string;
  description: string;
  statusVocabulary: ModuleStatus[];
  modules: ModuleDefinition[];
}

export interface RouteEntry {
  path: string;
  moduleId: string;
  kind: "page" | "section" | "api" | "redirect" | "fallback";
  status: "EXISTING" | "PARTIALLY_EXISTING" | "PROPOSED" | "DEPRECATED_CANDIDATE";
  auth: "public" | "session" | "session+permission" | "session+host" | "session+seller";
  /** Module-level grants required to enter the route. The server is the authority. */
  permissions: string[];
  source: string | null;
  notes?: string;
}
```

### 2.1 Example

```json
{
  "moduleId": "M10",
  "key": "field-collection",
  "nameEn": "Field Collection",
  "nameFa": "جمع‌آوری میدانی",
  "layer": "domain",
  "status": "IMPLEMENTED",
  "entryRoutes": ["/landscape/field", "/landscape/field/survey"],
  "ownerPackage": "apps/platform/src/sections/landscape/field",
  "permissions": ["landscape.write", "reports.read"],
  "dependencies": ["M14", "M15"],
  "notes": "Offline-first queue; real API sync."
}
```

---

## 3. JSON Schema (draft 2020-12)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ecojin.local/schemas/module-registry-v1.json",
  "title": "Eco Nojin Frontend Module Registry",
  "type": "object",
  "required": ["schemaVersion", "generatedAt", "modules"],
  "properties": {
    "schemaVersion": { "type": "string" },
    "generatedAt": { "type": "string" },
    "description": { "type": "string" },
    "statusVocabulary": {
      "type": "array",
      "items": { "enum": ["IMPLEMENTED", "PARTIALLY_EXISTING", "PROPOSED", "BACKEND_ONLY"] }
    },
    "modules": {
      "type": "array",
      "minItems": 18,
      "maxItems": 18,
      "items": {
        "type": "object",
        "required": ["moduleId", "key", "nameEn", "nameFa", "layer", "status", "entryRoutes", "permissions", "dependencies"],
        "properties": {
          "moduleId": { "type": "string", "pattern": "^M(0[1-9]|1[0-8])$" },
          "key": { "type": "string" },
          "nameEn": { "type": "string" },
          "nameFa": { "type": "string" },
          "layer": { "enum": ["public", "platform", "domain", "science", "integration"] },
          "status": { "enum": ["IMPLEMENTED", "PARTIALLY_EXISTING", "PROPOSED", "BACKEND_ONLY"] },
          "entryRoutes": { "type": "array", "items": { "type": "string" } },
          "ownerPackage": { "type": ["string", "null"] },
          "permissions": { "type": "array", "items": { "type": "string" } },
          "dependencies": { "type": "array", "items": { "type": "string" } },
          "notes": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  }
}
```

Validation rules not expressible in JSON Schema:

1. `moduleId` values are unique.
2. `dependencies` refer to existing `moduleId` values.
3. No self-dependency.
4. `PROPOSED` and `BACKEND_ONLY` modules have an empty `entryRoutes` (or only proposed routes).
5. Every non-PROPOSED route in `route-registry.json` references an existing module.
6. Every route has a `permissions` array; `[]` means public or role-gated.
7. `PARTIALLY_EXISTING` and `DEPRECATED_CANDIDATE` are subsets of declared routes, not extra routes.
8. No route path appears twice at the same level with a different module.

### 3.1 Route registry JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://ecojin.local/schemas/route-registry-v1.json",
  "title": "Eco Nojin Route Registry",
  "type": "object",
  "required": ["schemaVersion", "generatedAt", "counts", "routes"],
  "properties": {
    "schemaVersion": { "type": "string" },
    "generatedAt": { "type": "string" },
    "description": { "type": "string" },
    "counts": {
      "type": "object",
      "required": ["total"],
      "properties": {
        "existing": { "type": "number" },
        "partiallyExisting": { "type": "number" },
        "deprecatedCandidate": { "type": "number" },
        "proposed": { "type": "number" },
        "total": { "type": "number" }
      }
    },
    "routes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["path", "moduleId", "kind", "status", "auth", "permissions"],
        "properties": {
          "path": { "type": "string" },
          "moduleId": { "type": "string", "pattern": "^M(0[1-9]|1[0-8])$" },
          "kind": { "enum": ["page", "section", "api", "redirect", "fallback"] },
          "status": { "enum": ["EXISTING", "PARTIALLY_EXISTING", "PROPOSED", "DEPRECATED_CANDIDATE"] },
          "auth": { "enum": ["public", "session", "session+permission", "session+host", "session+seller"] },
          "permissions": { "type": "array", "items": { "type": "string" } },
          "source": { "type": ["string", "null"] },
          "notes": { "type": "string" }
        },
        "additionalProperties": false
      }
    }
  }
}
```

Example route entry:

```json
{
  "status": "EXISTING",
  "auth": "session+permission",
  "kind": "section",
  "path": "/landscape/admin/organizations",
  "moduleId": "M02",
  "permissions": ["org.read"],
  "source": "apps/platform/src/sections/landscape/admin/router.tsx",
  "notes": "API-backed organization list"
}
```

---

## 4. The 18 modules

| ID | Key | Layer | Status |
|---|---|---|---|
| M01 | public-experience | public | PARTIALLY_EXISTING |
| M02 | identity-access | platform | IMPLEMENTED |
| M03 | landscape-management | domain | IMPLEMENTED |
| M04 | agriculture | domain | PARTIALLY_EXISTING |
| M05 | inventory | domain | PROPOSED |
| M06 | marketplace | domain | PARTIALLY_EXISTING |
| M07 | finance-revenue | domain | PARTIALLY_EXISTING |
| M08 | restoration | domain | PARTIALLY_EXISTING |
| M09 | challenges | domain | PROPOSED |
| M10 | field-collection | domain | IMPLEMENTED |
| M11 | evidence | domain | PARTIALLY_EXISTING |
| M12 | eco-coin | domain | PROPOSED |
| M13 | mrv | domain | PARTIALLY_EXISTING |
| M14 | edi | integration | BACKEND_ONLY |
| M15 | canonical-data | integration | BACKEND_ONLY |
| M16 | hydroma | science | IMPLEMENTED |
| M17 | tourism | domain | PARTIALLY_EXISTING |
| M18 | booking | domain | PARTIALLY_EXISTING |

### 4.1 Why these 18

The mission's cross-module flows name: Agriculture, Inventory, Marketplace, Finance, Restoration, Challenges, Field, Evidence, EcoCoin, MRV, EDI, Canonical Data, HyDroMA, Tourism, Booking, Revenue. The registry adds the two shared product surfaces (Public Experience, Identity & Access) and Landscape Management, and folds Revenue into Finance & Revenue (M07). This yields exactly 18 frontend modules.

This is a **frontend decomposition**, not a replacement for `architecture/ECO-NOJIN-MODULE-CATALOG.csv` (178 backend modules).

---

## 5. Navigation rules

1. **Module entry** — a module exposes one or more `entryRoutes`; navigation must use the module's canonical entry, not a deep link.
2. **Lazy boundary** — a module is a lazy chunk. Navigation may cross modules only through a link/route, never through an internal import.
3. **No dead links** — a PROPOSED route must not appear in production navigation.
4. **Section prefix** — internal links use the module's `*/lib/paths.ts` helper.
5. **Public vs workspace** — public modules link to workspace modules only through `/login` or an explicit CTA; they must not assume a session.
6. **Unknown route** — every module declares a fallback; the root declares the public 404.

---

## 6. Permission rules

1. `permissions` lists the permissions required to enter the module's workspace routes.
2. Route-level `handle.permissions` is the finest granularity; the module entry may be coarser.
3. A route with `auth: "session+permission"` must declare a `handle` in the router.
4. A missing grant is fail-closed: show 403/request access, never the page.
5. The server re-checks every request; the registry is not an authorization source.
6. Public modules have `permissions: []` and `auth: "public"`.

Current gap: only admin routes (`organizations`, `users`, `settings`) declare `handle.permissions`. Agriculture, finance, MRV, projects and landscape workspace routes have no permission handles (C-06).

---

## 7. Lazy-loading rules

1. Every section is imported with `React.lazy` in the central router.
2. A section with heavy pages (market, science) lazy-loads its pages.
3. Vendor libraries (MapLibre, deck.gl) must be imported only from the page that renders them.
4. A lazy section must have a `Suspense` fallback with `role="status"`.
5. A section chunk must stay under 700 KB; the initial entry under 900 KB.
6. `pnpm run check:bundle` is the gate; raising a budget requires owner approval.

---

## 8. Validation performed for this document

| Check | Result |
|---|---|
| `module-registry.json` parses | PASS |
| 18 modules present | PASS |
| Unique module ids | PASS |
| Dependency references exist | PASS |
| `route-registry.json` parses | PASS |
| Declared routes reference valid modules | PASS |
| Every route has a `permissions` array | PASS |
| PROPOSED routes are marked PROPOSED | PASS |
| 181 declared + 28 proposed = 209 entries | PASS |
| No source code changed | PASS (documentation only) |

### 8.1 How to re-validate

```powershell
node -e "const r=require('./docs/architecture/frontend/module-registry.json'); if(r.modules.length!==18) throw new Error('module count'); const ids=new Set(r.modules.map(m=>m.moduleId)); for(const m of r.modules) for(const d of m.dependencies) if(!ids.has(d)) throw new Error('bad dep '+d); console.log('module registry OK', r.modules.length)"
node -e "const r=require('./docs/architecture/frontend/route-registry.json'); console.log('routes', r.counts)"
```

These commands were executed on 2026-11-23 and returned `module registry OK 18` and the route counts in [MODULES_AND_ROUTES.md](./MODULES_AND_ROUTES.md).