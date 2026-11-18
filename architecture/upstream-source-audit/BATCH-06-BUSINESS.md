# BATCH 06 — BUSINESS — SOURCE AUDIT
## ERPNext, Dolibarr, Medusa

**Date:** 2026-11-17
**Mode:** READ-ONLY source-level analysis. No build, no run.

---

## 1. ERPNext (`erpnext-16.35.0.zip`, 29 MB, GPL-3.0)
- **Architecture:** `erpnext/` (Python/Frappe), `packages/` (JS/TS). Full ERP on Frappe.
- **Core source:** 3,158 source files; 413 test files.
- **Main interfaces:** Frappe REST API (`/api/resource/*`), desk UI.
- **Capabilities:** accounting, inventory, sales, purchase, HR, manufacturing, projects.
- **Proven:** source present; NOT executed.
- **Runtime:** **Requires MariaDB/Postgres + Redis + Python 3.14 + Node.**
- **License:** GPL-3.0. **Strong copyleft.**
- **Eco Nojin modules:** `ACC-JOURNAL`, `ACC-AP`, `ACC-AR`, `INV-STOCK`.
- **Mapping:** `DEFER` (legal review + heavy ops).
- **Risks:** GPL-3.0; heavy; Frappe framework dependency.

## 2. Dolibarr (`dolibarr-24.0.3.zip`, 94 MB, GPL-3.0)
- **Architecture:** `htdocs/` (PHP), `composer.json.disabled`. ERP/CRM web app.
- **Core source:** 5,493 source files; 35 test files.
- **Main interfaces:** REST API (`/api/index.php`), SOAP (legacy), web UI.
- **Capabilities:** accounting, CRM, inventory, sales, purchase, HR.
- **Proven:** source present; NOT executed.
- **Runtime:** **Requires MySQL/MariaDB + PHP.**
- **License:** GPL-3.0. **Strong copyleft.** Bundled libs have own licenses.
- **Eco Nojin modules:** `ACC-JOURNAL`, `ACC-AP`, `ACC-AR`.
- **Mapping:** `DEFER`.
- **Risks:** GPL-3.0; bundled lib licenses; PHP legacy.

## 3. Medusa (`medusa-2.22.6.zip`, 65 MB, MIT + Enterprise EE)
- **Architecture:** `packages/` (TS monorepo: core, framework, utils, medusa). Headless commerce.
- **Core source:** 9,312 source files; 1,556 test files.
- **Main interfaces:** Medusa JS SDK; REST + GraphQL Admin API.
- **Capabilities:** products, cart, orders, payments, inventory, multi-vendor (sellers), settlements.
- **Proven:** source present; NOT executed.
- **Runtime:** **Requires PostgreSQL + Redis.** Node.js.
- **License:** MIT core + **Enterprise Edition proprietary** (`ENTERPRISE-LICENSE.md`).
- **Eco Nojin modules:** `MKT-CATALOG`, `MKT-ORDER`, `MKT-SETTLE`.
- **Mapping:** `DEFER` (EE boundary).
- **Risks:** EE commercial license; overlaps spree.

---

## 4. BATCH SUMMARY
- 3 projects, all `EXTRACTED`.
- **License risk:** ERPNext + Dolibarr = GPL-3.0 (HIGH); Medusa = MIT + EE (MEDIUM).
- **Overlap:** ERPNext vs Dolibarr (both ERP, both GPL); Medusa vs Spree (both commerce).
- **No permissive ERP in this batch** — this is a **gap** (see gap report G1/G2).
- **No project approved.**