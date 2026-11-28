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

// Authoritative DDL for scientific runs (Phase 3.83). Used by both SCHEMA (new
// databases) and MIGRATIONS (existing databases) so the two cannot drift.
const HYDROMA_RUNS_SCHEMA = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS hydroma_runs (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  run_key TEXT NOT NULL,
  model_id TEXT NOT NULL,
  model_version TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','RUNNING','COMPLETED','FAILED','CANCELLED')),
  farm_id TEXT,
  crop_cycle_id TEXT,
  project_id TEXT,
  soil_profile_id TEXT,
  soil_profile_version INTEGER,
  dataset_id TEXT,
  dataset_revision INTEGER,
  snapshot_json TEXT,
  snapshot_fingerprint TEXT,
  input_json TEXT NOT NULL,
  input_hash TEXT NOT NULL,
  parameter_hash TEXT NOT NULL,
  output_json TEXT,
  result_summary TEXT,
  provenance_json TEXT,
  units_json TEXT,
  software_maturity TEXT,
  scientific_status TEXT,
  error TEXT,
  requested_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  correlation_id TEXT,
  engine_run_id TEXT,
  reconciliation_required INTEGER NOT NULL DEFAULT 0,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  started_at TEXT,
  completed_at TEXT,
  UNIQUE (org_id, run_key)
);

CREATE INDEX IF NOT EXISTS idx_hydroma_runs_org_status ON hydroma_runs(org_id, status);
CREATE INDEX IF NOT EXISTS idx_hydroma_runs_org_farm ON hydroma_runs(org_id, farm_id, created_at);
CREATE INDEX IF NOT EXISTS idx_hydroma_runs_org_model ON hydroma_runs(org_id, model_id, model_version);

CREATE TABLE IF NOT EXISTS soil_profiles (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT,
  project_id TEXT,
  name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  layers_json TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'user_entered'
    CHECK (source IN ('measured','user_entered','estimated','imported','derived')),
  notes TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_soil_profiles_org_farm ON soil_profiles(org_id, farm_id);

CREATE TABLE IF NOT EXISTS soil_profile_versions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES soil_profiles(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  layers_json TEXT NOT NULL,
  source TEXT NOT NULL,
  notes TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE (profile_id, version)
);

CREATE TABLE IF NOT EXISTS soil_observations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT,
  project_id TEXT,
  profile_id TEXT,
  observed_at TEXT NOT NULL,
  depth_mm REAL,
  parameter TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  source TEXT NOT NULL
    CHECK (source IN ('field_measurement','lab_measurement','user_entered','imported','estimated','derived')),
  method TEXT,
  instrument TEXT,
  quality TEXT,
  notes TEXT,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_soil_observations_org_farm ON soil_observations(org_id, farm_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_soil_observations_profile ON soil_observations(profile_id, parameter);

-- Phase 3.95 — environmental data foundation (parameter catalogue, observations, imports).
CREATE TABLE IF NOT EXISTS env_parameters (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  dimension TEXT NOT NULL,
  canonical_unit TEXT NOT NULL,
  data_type TEXT NOT NULL DEFAULT 'number',
  allowed_units_json TEXT NOT NULL DEFAULT '[]',
  min_value REAL,
  max_value REAL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS env_imports (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT,
  project_id TEXT,
  filename TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  total INTEGER NOT NULL,
  imported_count INTEGER NOT NULL,
  rejected_count INTEGER NOT NULL,
  duplicate_count INTEGER NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS env_observations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT,
  project_id TEXT,
  import_id TEXT REFERENCES env_imports(id) ON DELETE SET NULL,
  parameter TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT NOT NULL,
  canonical_value REAL NOT NULL,
  canonical_unit TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  depth_mm REAL,
  source TEXT NOT NULL,
  method TEXT,
  instrument TEXT,
  quality TEXT NOT NULL DEFAULT 'UNREVIEWED',
  quality_reasons_json TEXT NOT NULL DEFAULT '[]',
  dedupe_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (org_id, dedupe_key)
);

CREATE INDEX IF NOT EXISTS idx_env_observations_org_farm ON env_observations(org_id, farm_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_env_observations_param ON env_observations(org_id, parameter, observed_at);

CREATE TABLE IF NOT EXISTS scientific_datasets (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT,
  project_id TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  parameters_json TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  readiness TEXT NOT NULL,
  coverage REAL NOT NULL,
  current_revision INTEGER NOT NULL DEFAULT 1,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_scientific_datasets_org ON scientific_datasets(org_id, created_at);

CREATE TABLE IF NOT EXISTS dataset_revisions (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL REFERENCES scientific_datasets(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  revision INTEGER NOT NULL,
  payload_json TEXT NOT NULL,
  readiness TEXT NOT NULL,
  coverage REAL NOT NULL,
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE (dataset_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_dataset_revisions_dataset ON dataset_revisions(dataset_id, revision);

CREATE TRIGGER IF NOT EXISTS trg_dataset_revisions_no_update
BEFORE UPDATE ON dataset_revisions
BEGIN
  SELECT RAISE(ABORT, 'dataset_revisions are immutable');
END;

CREATE TRIGGER IF NOT EXISTS trg_dataset_revisions_no_delete
BEFORE DELETE ON dataset_revisions
BEGIN
  SELECT RAISE(ABORT, 'dataset_revisions cannot be deleted');
END;

CREATE TABLE IF NOT EXISTS hydroma_execution_attempts (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES hydroma_runs(id) ON DELETE CASCADE,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL,
  model_id TEXT,
  model_version TEXT,
  input_json TEXT,
  input_fingerprint TEXT,
  input_source TEXT,
  manifest_json TEXT,
  manifest_fingerprint TEXT,
  output_json TEXT,
  output_fingerprint TEXT,
  error TEXT,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  UNIQUE (run_id, attempt)
);

CREATE INDEX IF NOT EXISTS idx_hydroma_attempts_run ON hydroma_execution_attempts(run_id, attempt);

CREATE TRIGGER IF NOT EXISTS trg_hydroma_attempts_terminal_immutable
BEFORE UPDATE ON hydroma_execution_attempts
WHEN OLD.status IN ('SUCCEEDED','FAILED')
BEGIN
  SELECT RAISE(ABORT, 'terminal execution attempts are immutable');
END;

INSERT OR IGNORE INTO env_parameters (code, name, category, dimension, canonical_unit, allowed_units_json, min_value, max_value) VALUES
  ('soil_moisture', 'Soil moisture', 'soil', 'fraction', 'm3_per_m3', '["m3_per_m3","percent"]', 0, 1),
  ('soil_temperature', 'Soil temperature', 'soil', 'temperature', 'degC', '["degC","degF","K"]', -50, 80),
  ('precipitation', 'Precipitation', 'meteorology', 'length', 'mm', '["mm","in"]', 0, 500),
  ('air_temperature', 'Air temperature', 'meteorology', 'temperature', 'degC', '["degC","degF","K"]', -80, 60),
  ('relative_humidity', 'Relative humidity', 'meteorology', 'fraction', 'percent', '["percent","fraction"]', 0, 100),
  ('wind_speed', 'Wind speed', 'meteorology', 'speed', 'm_per_s', '["m_per_s","km_per_h"]', 0, 120),
  ('solar_radiation', 'Solar radiation', 'meteorology', 'energy_per_area', 'MJ_per_m2_day', '["MJ_per_m2_day"]', 0, 50);
`;

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

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

-- Phase 3.64 — Rewards & Challenges foundation.
-- EcoCoin is an INTERNAL, non-tradable participation/reward accounting unit.
-- No blockchain, no external transfer, no monetary redemption. Amounts are
-- non-negative integers of internal EcoCoin units.

CREATE TABLE IF NOT EXISTS reward_rules (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  eco_coin_amount INTEGER NOT NULL DEFAULT 0,
  issuance_limit INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (org_id, code)
);

CREATE TABLE IF NOT EXISTS challenges (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  eligibility TEXT NOT NULL DEFAULT '',
  eligible_roles TEXT,
  completion_criteria TEXT NOT NULL DEFAULT '',
  verification_method TEXT NOT NULL DEFAULT 'admin_attestation',
  reward_rule_id TEXT REFERENCES reward_rules(id) ON DELETE SET NULL,
  start_at TEXT,
  end_at TEXT,
  max_participants INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (org_id, code)
);

CREATE TABLE IF NOT EXISTS challenge_participations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'joined',
  verification TEXT,
  reward_issued INTEGER NOT NULL DEFAULT 0,
  joined_at TEXT NOT NULL,
  completed_at TEXT,
  verified_at TEXT,
  UNIQUE (org_id, challenge_id, user_id)
);

-- Immutable ledger. Rows are only ever INSERTed (credits, debits and
-- compensating corrections). There is no UPDATE/DELETE path: a mistake is
-- corrected with an opposite compensating entry, never by rewriting history.
-- UNIQUE (org_id, reference) guarantees idempotent, duplicate-free issuance.
CREATE TABLE IF NOT EXISTS eco_coin_ledger (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  reference TEXT NOT NULL,
  challenge_id TEXT REFERENCES challenges(id) ON DELETE SET NULL,
  participation_id TEXT REFERENCES challenge_participations(id) ON DELETE SET NULL,
  reward_rule_id TEXT REFERENCES reward_rules(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  UNIQUE (org_id, reference)
);

-- Phase 3.66 — challenge participation evidence (structured source references,
-- no file storage). One evidence record per participation; reviewer decision is
-- recorded on the participation (approved/rejected) and audited.
CREATE TABLE IF NOT EXISTS challenge_evidence (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  participation_id TEXT NOT NULL REFERENCES challenge_participations(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  source_type TEXT,
  source_id TEXT,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TEXT NOT NULL,
  UNIQUE (org_id, participation_id)
);

-- Phase 3.69 — agricultural tasks (operational work management). Server-enforced
-- lifecycle; org-scoped; farm/crop-cycle consistency validated in the API layer.
CREATE TABLE IF NOT EXISTS agri_tasks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT NOT NULL,
  crop_cycle_id TEXT,
  project_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'draft',
  assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  planned_start TEXT,
  due_at TEXT,
  completed_at TEXT,
  completed_by TEXT,
  completion_note TEXT,
  verified_at TEXT,
  verified_by TEXT,
  cancelled_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_agri_tasks_org_farm ON agri_tasks(org_id, farm_id, status);
CREATE INDEX IF NOT EXISTS idx_agri_tasks_org_status_due ON agri_tasks(org_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_agri_tasks_org_assignee ON agri_tasks(org_id, assignee_id);
CREATE INDEX IF NOT EXISTS idx_agri_tasks_org_farm_created ON agri_tasks(org_id, farm_id, created_at);

CREATE TABLE IF NOT EXISTS agri_task_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES agri_tasks(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  at TEXT NOT NULL,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_agri_task_events_task ON agri_task_events(org_id, task_id, at);

-- Phase 3.72 — community activities + participation (org-scoped). A community is
-- a villages resource; activities/events/participants are all tenant-isolated.
CREATE TABLE IF NOT EXISTS community_activities (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'other',
  status TEXT NOT NULL DEFAULT 'draft',
  priority TEXT NOT NULL DEFAULT 'normal',
  planned_start TEXT,
  planned_end TEXT,
  actual_start TEXT,
  completed_at TEXT,
  cancelled_at TEXT,
  location TEXT,
  organizer_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  capacity INTEGER
);
CREATE INDEX IF NOT EXISTS idx_comm_act_org_comm ON community_activities(org_id, community_id, status);
CREATE INDEX IF NOT EXISTS idx_comm_act_org_start ON community_activities(org_id, planned_start);

CREATE TABLE IF NOT EXISTS activity_participants (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'registered',
  registered_at TEXT NOT NULL,
  confirmed_at TEXT,
  attended_at TEXT,
  UNIQUE (org_id, activity_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_activity_participants_act ON activity_participants(org_id, activity_id);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  activity_id TEXT NOT NULL REFERENCES community_activities(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  at TEXT NOT NULL,
  detail TEXT
);
CREATE INDEX IF NOT EXISTS idx_activity_events_act ON activity_events(org_id, activity_id, at);

-- Phase 3.75 — persistent HyDroMA readiness assessments + append-only reviews.
CREATE TABLE IF NOT EXISTS hydroma_readiness_assessments (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  farm_id TEXT NOT NULL,
  crop_cycle_id TEXT,
  contract_id TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  state TEXT NOT NULL,
  snapshot TEXT NOT NULL,
  sources TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  review_state TEXT NOT NULL DEFAULT 'ASSESSMENT_CREATED',
  reviewed_by TEXT,
  reviewed_at TEXT,
  review_note TEXT
);
CREATE INDEX IF NOT EXISTS idx_hydroma_assess_org_farm ON hydroma_readiness_assessments(org_id, farm_id, created_at);

CREATE TABLE IF NOT EXISTS hydroma_readiness_reviews (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL REFERENCES hydroma_readiness_assessments(id) ON DELETE CASCADE,
  decision TEXT NOT NULL,
  note TEXT,
  actor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hydroma_reviews_assess ON hydroma_readiness_reviews(org_id, assessment_id, at);

-- Phase 3.77 — environmental data source registry (catalog only; NO live acquisition).
CREATE TABLE IF NOT EXISTS env_sources (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  source_type TEXT NOT NULL,
  provider TEXT,
  description TEXT,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'CATALOGUED',
  integration_status TEXT NOT NULL DEFAULT 'CATALOGUED',
  data_availability TEXT NOT NULL DEFAULT 'unknown',
  spatial_coverage TEXT,
  temporal_coverage TEXT,
  update_frequency TEXT,
  variables TEXT,
  units TEXT,
  data_format TEXT,
  access_method TEXT,
  license TEXT,
  license_review TEXT NOT NULL DEFAULT 'unknown',
  provenance_req TEXT,
  limitations TEXT,
  contract_version TEXT,
  created_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_env_sources_org_cat ON env_sources(org_id, category);

-- Phase 3.65 — four-eyes manual EcoCoin adjustments.
-- A sensitive manual correction is requested, then approved/rejected by a
-- DIFFERENT owner/admin, then executed exactly once. The amount, target user,
-- organization, entry type and reason are written at request time and are never
-- mutated by approve/reject/execute. Execution writes a deterministically
-- referenced ledger entry (adjustment-exec:<id>) so replay is a no-op.
CREATE TABLE IF NOT EXISTS eco_coin_adjustment_requests (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  approver_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  decision_note TEXT,
  decided_at TEXT,
  executed_at TEXT,
  execution_reference TEXT,
  created_at TEXT NOT NULL,
  UNIQUE (org_id, execution_reference)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_org_type ON resources(org_id, type);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_reward_rules_org ON reward_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_challenges_org_status ON challenges(org_id, status);
CREATE INDEX IF NOT EXISTS idx_participations_challenge ON challenge_participations(org_id, challenge_id);
CREATE INDEX IF NOT EXISTS idx_participations_user ON challenge_participations(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_org_user ON eco_coin_ledger(org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_reference ON eco_coin_ledger(org_id, reference);
CREATE INDEX IF NOT EXISTS idx_adjust_requests_org_status ON eco_coin_adjustment_requests(org_id, status);

${HYDROMA_RUNS_SCHEMA}
`;

// Versioned, additive, forward-only migrations. Each migration runs once inside a
// transaction and is recorded in `schema_migrations`; already-applied versions are
// never re-applied. Statements are idempotent (IF NOT EXISTS) so a partially
// upgraded database is safe to reopen.
export const MIGRATIONS = [
  {
    version: 1,
    name: "hydroma_runs",
    statements: [HYDROMA_RUNS_SCHEMA],
  },
  {
    version: 2,
    name: "hydroma_runs_execution_integrity",
    statements: [
      "ALTER TABLE hydroma_runs ADD COLUMN engine_run_id TEXT",
      "ALTER TABLE hydroma_runs ADD COLUMN reconciliation_required INTEGER NOT NULL DEFAULT 0",
      "ALTER TABLE hydroma_runs ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0",
    ],
  },
  {
    version: 3,
    name: "hydroma_runs_project_context",
    statements: [
      "ALTER TABLE hydroma_runs ADD COLUMN project_id TEXT",
      "CREATE INDEX IF NOT EXISTS idx_hydroma_runs_org_project ON hydroma_runs(org_id, project_id, created_at)",
    ],
  },
  {
    version: 4,
    name: "soil_profiles",
    statements: [
      `CREATE TABLE IF NOT EXISTS soil_profiles (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        farm_id TEXT,
        project_id TEXT,
        name TEXT NOT NULL,
        layers_json TEXT NOT NULL,
        source TEXT NOT NULL DEFAULT 'user_entered'
          CHECK (source IN ('measured','user_entered','estimated','imported','derived')),
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE (org_id, name)
      )`,
      "CREATE INDEX IF NOT EXISTS idx_soil_profiles_org_farm ON soil_profiles(org_id, farm_id)",
      "ALTER TABLE hydroma_runs ADD COLUMN soil_profile_id TEXT",
    ],
  },
  {
    version: 5,
    name: "soil_versioning_observations",
    statements: [
      "ALTER TABLE soil_profiles ADD COLUMN version INTEGER NOT NULL DEFAULT 1",
      `CREATE TABLE IF NOT EXISTS soil_profile_versions (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES soil_profiles(id) ON DELETE CASCADE,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        version INTEGER NOT NULL,
        layers_json TEXT NOT NULL,
        source TEXT NOT NULL,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        UNIQUE (profile_id, version)
      )`,
      `CREATE TABLE IF NOT EXISTS soil_observations (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        farm_id TEXT,
        project_id TEXT,
        profile_id TEXT,
        observed_at TEXT NOT NULL,
        depth_mm REAL,
        parameter TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        source TEXT NOT NULL
          CHECK (source IN ('field_measurement','lab_measurement','user_entered','imported','estimated','derived')),
        method TEXT,
        instrument TEXT,
        quality TEXT,
        notes TEXT,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS idx_soil_observations_org_farm ON soil_observations(org_id, farm_id, observed_at)",
      "CREATE INDEX IF NOT EXISTS idx_soil_observations_profile ON soil_observations(profile_id, parameter)",
      "ALTER TABLE hydroma_runs ADD COLUMN soil_profile_version INTEGER",
    ],
  },
  {
    version: 6,
    name: "environmental_data_foundation",
    statements: [
      `CREATE TABLE IF NOT EXISTS env_parameters (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        dimension TEXT NOT NULL,
        canonical_unit TEXT NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'number',
        allowed_units_json TEXT NOT NULL DEFAULT '[]',
        min_value REAL,
        max_value REAL,
        notes TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS env_imports (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        farm_id TEXT,
        project_id TEXT,
        filename TEXT NOT NULL,
        source TEXT NOT NULL,
        status TEXT NOT NULL,
        total INTEGER NOT NULL,
        imported_count INTEGER NOT NULL,
        rejected_count INTEGER NOT NULL,
        duplicate_count INTEGER NOT NULL,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS env_observations (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        farm_id TEXT,
        project_id TEXT,
        import_id TEXT REFERENCES env_imports(id) ON DELETE SET NULL,
        parameter TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        canonical_value REAL NOT NULL,
        canonical_unit TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        depth_mm REAL,
        source TEXT NOT NULL,
        method TEXT,
        instrument TEXT,
        quality TEXT NOT NULL DEFAULT 'UNREVIEWED',
        quality_reasons_json TEXT NOT NULL DEFAULT '[]',
        dedupe_key TEXT NOT NULL,
        created_at TEXT NOT NULL,
        UNIQUE (org_id, dedupe_key)
      )`,
      "CREATE INDEX IF NOT EXISTS idx_env_observations_org_farm ON env_observations(org_id, farm_id, observed_at)",
      "CREATE INDEX IF NOT EXISTS idx_env_observations_param ON env_observations(org_id, parameter, observed_at)",
      `INSERT OR IGNORE INTO env_parameters (code, name, category, dimension, canonical_unit, allowed_units_json, min_value, max_value) VALUES
        ('soil_moisture', 'Soil moisture', 'soil', 'fraction', 'm3_per_m3', '["m3_per_m3","percent"]', 0, 1),
        ('soil_temperature', 'Soil temperature', 'soil', 'temperature', 'degC', '["degC","degF","K"]', -50, 80),
        ('precipitation', 'Precipitation', 'meteorology', 'length', 'mm', '["mm","in"]', 0, 500),
        ('air_temperature', 'Air temperature', 'meteorology', 'temperature', 'degC', '["degC","degF","K"]', -80, 60),
        ('relative_humidity', 'Relative humidity', 'meteorology', 'fraction', 'percent', '["percent","fraction"]', 0, 100),
        ('wind_speed', 'Wind speed', 'meteorology', 'speed', 'm_per_s', '["m_per_s","km_per_h"]', 0, 120),
        ('solar_radiation', 'Solar radiation', 'meteorology', 'energy_per_area', 'MJ_per_m2_day', '["MJ_per_m2_day"]', 0, 50)`,
    ],
  },
  {
    version: 7,
    name: "scientific_datasets",
    statements: [
      `CREATE TABLE IF NOT EXISTS scientific_datasets (
        id TEXT PRIMARY KEY,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        farm_id TEXT,
        project_id TEXT,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        parameters_json TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        readiness TEXT NOT NULL,
        coverage REAL NOT NULL,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL
      )`,
      "CREATE INDEX IF NOT EXISTS idx_scientific_datasets_org ON scientific_datasets(org_id, created_at)",
      "ALTER TABLE hydroma_runs ADD COLUMN dataset_id TEXT",
    ],
  },
  {
    version: 8,
    name: "run_dataset_snapshot",
    statements: [
      "ALTER TABLE hydroma_runs ADD COLUMN snapshot_json TEXT",
      "ALTER TABLE hydroma_runs ADD COLUMN snapshot_fingerprint TEXT",
      "CREATE INDEX IF NOT EXISTS idx_hydroma_runs_dataset ON hydroma_runs(org_id, dataset_id)",
    ],
  },
  {
    version: 9,
    name: "dataset_revisions",
    statements: [
      "ALTER TABLE scientific_datasets ADD COLUMN current_revision INTEGER NOT NULL DEFAULT 1",
      "ALTER TABLE scientific_datasets ADD COLUMN updated_at TEXT",
      "ALTER TABLE hydroma_runs ADD COLUMN dataset_revision INTEGER",
      `CREATE TABLE IF NOT EXISTS dataset_revisions (
        id TEXT PRIMARY KEY,
        dataset_id TEXT NOT NULL REFERENCES scientific_datasets(id) ON DELETE CASCADE,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        revision INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        readiness TEXT NOT NULL,
        coverage REAL NOT NULL,
        created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
        created_at TEXT NOT NULL,
        UNIQUE (dataset_id, revision)
      )`,
      "CREATE INDEX IF NOT EXISTS idx_dataset_revisions_dataset ON dataset_revisions(dataset_id, revision)",
      `CREATE TRIGGER IF NOT EXISTS trg_dataset_revisions_no_update
       BEFORE UPDATE ON dataset_revisions
       BEGIN SELECT RAISE(ABORT, 'dataset_revisions are immutable'); END`,
      `CREATE TRIGGER IF NOT EXISTS trg_dataset_revisions_no_delete
       BEFORE DELETE ON dataset_revisions
       BEGIN SELECT RAISE(ABORT, 'dataset_revisions cannot be deleted'); END`,
      `INSERT OR IGNORE INTO dataset_revisions (id, dataset_id, org_id, revision, payload_json, readiness, coverage, created_by, created_at)
       SELECT id || ':r1', id, org_id, 1, payload_json, readiness, coverage, created_by, created_at FROM scientific_datasets`,
    ],
  },
  {
    version: 10,
    name: "hydroma_execution_attempts",
    statements: [
      `CREATE TABLE IF NOT EXISTS hydroma_execution_attempts (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL REFERENCES hydroma_runs(id) ON DELETE CASCADE,
        org_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        attempt INTEGER NOT NULL,
        status TEXT NOT NULL,
        manifest_json TEXT,
        manifest_fingerprint TEXT,
        output_json TEXT,
        output_fingerprint TEXT,
        error TEXT,
        started_at TEXT NOT NULL,
        finished_at TEXT,
        UNIQUE (run_id, attempt)
      )`,
      "CREATE INDEX IF NOT EXISTS idx_hydroma_attempts_run ON hydroma_execution_attempts(run_id, attempt)",
    ],
  },
  {
    version: 11,
    name: "execution_input_integrity",
    statements: [
      "ALTER TABLE hydroma_execution_attempts ADD COLUMN model_id TEXT",
      "ALTER TABLE hydroma_execution_attempts ADD COLUMN model_version TEXT",
      "ALTER TABLE hydroma_execution_attempts ADD COLUMN input_json TEXT",
      "ALTER TABLE hydroma_execution_attempts ADD COLUMN input_fingerprint TEXT",
      "ALTER TABLE hydroma_execution_attempts ADD COLUMN input_source TEXT",
      `CREATE TRIGGER IF NOT EXISTS trg_hydroma_attempts_terminal_immutable
       BEFORE UPDATE ON hydroma_execution_attempts
       WHEN OLD.status IN ('SUCCEEDED','FAILED')
       BEGIN SELECT RAISE(ABORT, 'terminal execution attempts are immutable'); END`,
    ],
  },
];

export function runMigrations(db, migrations = MIGRATIONS) {
  db.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL)");
  // Best-effort repair for databases created before the column existed. New
  // databases already declare it in SCHEMA, so the duplicate is ignored.
  try {
    db.exec("ALTER TABLE challenges ADD COLUMN eligible_roles TEXT");
  } catch (error) {
    // Ignore "already present" and "table not created yet" (fresh/minimal DBs).
    if (!/duplicate column|no such table/i.test(String(error?.message))) throw error;
  }
  const applied = new Set(db.prepare("SELECT version FROM schema_migrations").all().map((row) => row.version));
  for (const migration of migrations) {
    if (applied.has(migration.version)) continue;
    db.exec("BEGIN");
    try {
      for (const statement of migration.statements) {
        try {
          db.exec(statement);
        } catch (error) {
          // Additive migrations may already be present in a fresh SCHEMA database.
          if (!/duplicate column/i.test(String(error?.message))) throw error;
        }
      }
      db.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)").run(migration.version, now());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}

let instance = null;

export function openDatabase(file = process.env.NOJIN_DB ?? DEFAULT_DB) {
  if (file !== ":memory:") mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  runMigrations(db);
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
