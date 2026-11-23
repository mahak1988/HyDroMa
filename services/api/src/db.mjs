/**
 * Eco Nojin API — database.
 *
 * Uses the SQLite engine built into Node (`node:sqlite`), so the service has no
 * runtime dependency at all. Every table that holds tenant data carries
 * `org_id`; the API layer always filters by the caller's membership.
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_DB = resolve(process.cwd(), "databases", "api", "nojin.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  locale TEXT,
  created_at TEXT NOT NULL,
  last_active_at TEXT
);

CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  country TEXT NOT NULL DEFAULT 'IR',
  kind TEXT NOT NULL DEFAULT 'community',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TEXT NOT NULL,
  UNIQUE (org_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS invites (
  token_hash TEXT PRIMARY KEY,
  membership_id TEXT NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT
);

CREATE TABLE IF NOT EXISTS notification_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  last_seen_id INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id TEXT,
  actor_id TEXT,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  at TEXT NOT NULL,
  detail TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  parent_id TEXT,
  label_key TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sellers (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'IR',
  region TEXT NOT NULL DEFAULT '',
  verification TEXT NOT NULL DEFAULT 'pending',
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  seller_id TEXT REFERENCES sellers(id) ON DELETE SET NULL,
  category_id TEXT REFERENCES categories(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  price_minor INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'IRR',
  unit TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS resources (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_org_type ON resources(org_id, type);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);
`;

let instance = null;

export function openDatabase(file = process.env.NOJIN_DB ?? DEFAULT_DB) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  return db;
}

/** Process-wide connection (the server and the seed script share it). */
export function database() {
  if (!instance) instance = openDatabase();
  return instance;
}

export const now = () => new Date().toISOString();

export function newId(prefix) {
  return `${prefix}_${globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 20)}`;
}

export function audit(db, entry) {
  db.prepare("INSERT INTO audit (org_id, actor_id, action, entity, entity_id, at, detail) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    entry.orgId ?? null,
    entry.actorId ?? null,
    entry.action,
    entry.entity ?? null,
    entry.entityId ?? null,
    now(),
    entry.detail ? JSON.stringify(entry.detail) : null,
  );
}
