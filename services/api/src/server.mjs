/**
 * Eco Nojin API — HTTP server.
 *
 * Real persistence (SQLite), real password auth with sessions, per-organization
 * tenancy, role-based writes and an audit row for every mutation. No mock data:
 * lists return what is in the database, and an empty database returns empty lists.
 *
 * Run: node services/api/src/server.mjs   (PORT=8000, NOJIN_DB=…)
 */
import { createServer as createHttpServer } from "node:http";
import { randomBytes } from "node:crypto";
import { database, newId, now, audit, openDatabase } from "./db.mjs";
import {
  clearedCookie,
  createSession,
  destroySession,
  hashPassword,
  hashToken,
  parseCookies,
  readSession,
  sessionCookie,
  verifyPassword,
  SESSION_COOKIE,
} from "./auth.mjs";

const PORT = Number(process.env.PORT ?? 8000);
const VERSION = "0.1.0";

const ROLE_RANK = { viewer: 1, member: 2, manager: 3, admin: 4, owner: 5 };
const WRITE_ROLES = new Set(["owner", "admin", "manager"]);

const MODEL_REGISTRY = [
  {
    id: "eco-nojin.hydroma.water-balance",
    version: "1.1.0",
    domain: "water",
    title: "Root-zone water balance",
    maturity: "implemented",
    scientific_status: "not_validated",
    units: ["mm", "ha", "m3"],
    inputs: ["precipitation", "irrigation", "runoff", "evapotranspiration", "deepPercolation", "capillaryRise"],
    outputs: ["storageChangeMm", "status", "warnings"],
  },
];

/* ------------------------------- utilities ------------------------------- */

const json = (res, status, body, headers = {}) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store",
    ...headers,
  });
  res.end(payload);
};

const fail = (res, status, code, message, details) =>
  json(res, status, {
    error: {
      code,
      message,
      message_key: `errors.${code}`,
      status,
      retryable: status === 429 || status >= 500,
      correlation_id: null,
      ...(details ? { details } : {}),
    },
  });

async function readJson(req, limit = 1_000_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error("payload_too_large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("invalid_json");
  }
}

const str = (value, max = 300) => (typeof value === "string" ? value.trim().slice(0, max) : "");
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value);

function cors(req, res) {
  const origin = req.headers.origin;
  if (!origin) return;
  const allowed = (process.env.NOJIN_ORIGINS ?? "http://localhost:5180,http://localhost:5175,http://localhost:5176,http://localhost:5177,http://localhost:5178,http://localhost:5179,http://127.0.0.1:5180")
    .split(",")
    .map((item) => item.trim());
  if (allowed.includes("*") || allowed.includes(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("access-control-allow-credentials", "true");
    res.setHeader("vary", "Origin");
  }
}

const userView = (row) => ({
  id: row.id,
  email: row.email,
  name: row.name,
  phone: null,
  status: row.status,
  locale: row.locale ?? null,
  createdAt: row.created_at,
  lastActiveAt: row.last_active_at ?? null,
});

const orgView = (row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  country: row.country,
  kind: row.kind,
  status: row.status,
  createdAt: row.created_at,
});

const membershipView = (row) => ({
  id: row.id,
  organizationId: row.org_id,
  userId: row.user_id,
  role: row.role,
  status: row.status,
  joinedAt: row.joined_at,
});

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 60) || newId("org");

/* --------------------------------- app ---------------------------------- */

export function createApp(options = {}) {
  const db = options.db ?? database();

  const membershipOf = (userId, orgId) =>
    db.prepare("SELECT * FROM memberships WHERE user_id = ? AND org_id = ? AND status = 'active'").get(userId, orgId);

  const membershipsOf = (userId) =>
    db
      .prepare(
        "SELECT m.*, o.name AS org_name, o.slug AS org_slug FROM memberships m JOIN organizations o ON o.id = m.org_id WHERE m.user_id = ? AND m.status = 'active' ORDER BY m.joined_at",
      )
      .all(userId);

  const requireWrite = (membership) => WRITE_ROLES.has(membership.role);

  const routes = [];
  const route = (method, pattern, handler, opts = {}) => routes.push({ method, pattern, handler, opts });

  /* ------------------------------- auth -------------------------------- */

  route("POST", /^\/v1\/auth\/register$/u, async (req, res) => {
    const body = await readJson(req);
    const email = str(body.email).toLowerCase();
    const name = str(body.name, 120);
    const password = str(body.password, 200);
    const orgName = str(body.organizationName, 160);
    if (!isEmail(email)) return fail(res, 422, "invalid_email", "A valid email is required.");
    if (name.length < 2) return fail(res, 422, "invalid_name", "A name is required.");
    if (password.length < 10) return fail(res, 422, "weak_password", "Use at least 10 characters.");
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
      return fail(res, 409, "email_taken", "An account with this email already exists.");
    }

    const userId = newId("usr");
    const at = now();
    db.prepare("INSERT INTO users (id, email, name, password_hash, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)").run(
      userId,
      email,
      name,
      hashPassword(password),
      at,
    );
    // Registration optionally creates a new organization owned by this user.
    const organizations = [];
    if (orgName) {
      const orgId = newId("org");
      db.prepare("INSERT INTO organizations (id, name, slug, country, kind, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)").run(
        orgId,
        orgName,
        slugify(orgName),
        str(body.country) || "IR",
        "community",
        at,
      );
      db.prepare("INSERT INTO memberships (id, org_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'owner', 'active', ?)").run(
        newId("mem"),
        orgId,
        userId,
        at,
      );
      organizations.push(orgView(db.prepare("SELECT * FROM organizations WHERE id = ?").get(orgId)));
    }
    audit(db, { actorId: userId, action: "auth.register", entity: "user", entityId: userId });

    const session = createSession(db, userId);
    return json(res, 201, { user: userView(db.prepare("SELECT * FROM users WHERE id = ?").get(userId)), organizations }, {
      "set-cookie": sessionCookie(session.token, session.expires),
    });
  });

  route("POST", /^\/v1\/auth\/login$/u, async (req, res) => {
    const body = await readJson(req);
    const email = str(body.email).toLowerCase();
    const password = str(body.password, 200);
    const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!row || row.status !== "active" || !verifyPassword(password, row.password_hash)) {
      return fail(res, 401, "invalid_credentials", "Email or password is incorrect.");
    }
    db.prepare("UPDATE users SET last_active_at = ? WHERE id = ?").run(now(), row.id);
    const session = createSession(db, row.id);
    audit(db, { actorId: row.id, action: "auth.login", entity: "user", entityId: row.id });
    return json(res, 200, { user: userView(row) }, { "set-cookie": sessionCookie(session.token, session.expires) });
  });

  route("POST", /^\/v1\/auth\/logout$/u, async (req, res) => {
    const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    destroySession(db, token);
    return json(res, 200, { ok: true }, { "set-cookie": clearedCookie });
  });

  route("GET", /^\/v1\/auth\/me$/u, async (req, res, ctx) => {
    const memberships = membershipsOf(ctx.user.id);
    return json(res, 200, {
      user: userView(ctx.user),
      memberships: memberships.map((row) => ({
        ...membershipView(row),
        organization: { id: row.org_id, name: row.org_name, slug: row.org_slug },
      })),
      activeOrganizationId: memberships[0]?.org_id ?? null,
    });
  }, { auth: true });

  /* --------------------------- organizations ---------------------------- */

  route("GET", /^\/v1\/organizations$/u, async (req, res, ctx) => {
    const rows = membershipsOf(ctx.user.id).map((row) => db.prepare("SELECT * FROM organizations WHERE id = ?").get(row.org_id));
    return json(res, 200, { items: rows.map(orgView), nextCursor: null, total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/organizations$/u, async (req, res, ctx) => {
    const body = await readJson(req);
    const name = str(body.name, 160);
    if (name.length < 2) return fail(res, 422, "invalid_name", "An organization name is required.");
    const id = newId("org");
    const at = now();
    db.prepare("INSERT INTO organizations (id, name, slug, country, kind, status, created_at) VALUES (?, ?, ?, ?, ?, 'active', ?)").run(
      id,
      name,
      slugify(name),
      str(body.country) || "IR",
      str(body.kind) || "community",
      at,
    );
    db.prepare("INSERT INTO memberships (id, org_id, user_id, role, status, joined_at) VALUES (?, ?, ?, 'owner', 'active', ?)").run(newId("mem"), id, ctx.user.id, at);
    audit(db, { orgId: id, actorId: ctx.user.id, action: "organization.create", entity: "organization", entityId: id });
    return json(res, 201, orgView(db.prepare("SELECT * FROM organizations WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/organizations\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    return json(res, 200, orgView(db.prepare("SELECT * FROM organizations WHERE id = ?").get(ctx.params.id)));
  }, { auth: true });

  route("PATCH", /^\/v1\/organizations\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot update this organization.");
    const body = await readJson(req);
    const name = str(body.name, 160);
    if (name) db.prepare("UPDATE organizations SET name = ? WHERE id = ?").run(name, ctx.params.id);
    audit(db, { orgId: ctx.params.id, actorId: ctx.user.id, action: "organization.update", entity: "organization", entityId: ctx.params.id });
    return json(res, 200, orgView(db.prepare("SELECT * FROM organizations WHERE id = ?").get(ctx.params.id)));
  }, { auth: true });

  route("GET", /^\/v1\/organizations\/(?<id>[\w-]+)\/members$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    const rows = db
      .prepare("SELECT m.*, u.name, u.email FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.org_id = ? ORDER BY m.joined_at")
      .all(ctx.params.id);
    return json(res, 200, {
      items: rows.map((row) => ({ ...membershipView(row), user: { id: row.user_id, name: row.name, email: row.email } })),
      nextCursor: null,
      total: rows.length,
    });
  }, { auth: true });

  route("POST", /^\/v1\/organizations\/(?<id>[\w-]+)\/members$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot invite members.");

    const body = await readJson(req);
    const email = str(body.email).toLowerCase();
    const role = str(body.role) || "member";
    if (!isEmail(email)) return fail(res, 422, "invalid_email", "A valid email is required.");
    if (!ROLE_RANK[role]) return fail(res, 422, "invalid_role", "Unknown role.");

    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      const id = newId("usr");
      db.prepare("INSERT INTO users (id, email, name, password_hash, status, created_at) VALUES (?, ?, ?, ?, 'invited', ?)").run(
        id,
        email,
        email.split("@")[0],
        hashPassword(newId("tmp")),
        now(),
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    }
    const existing = membershipOf(user.id, ctx.params.id);
    if (existing) return fail(res, 409, "already_member", "This user is already a member.");

    const id = newId("mem");
    db.prepare("INSERT INTO memberships (id, org_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, 'invited', ?)").run(
      id,
      ctx.params.id,
      user.id,
      role,
      now(),
    );

    // One-time invite token. Without an email service in the core, the API
    // hands the token to the admin, who delivers it out of band.
    const inviteToken = randomBytes(32).toString("base64url");
    db.prepare("INSERT INTO invites (token_hash, membership_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
      hashToken(inviteToken),
      id,
      now(),
      new Date(Date.now() + 7 * 86_400_000).toISOString(),
    );
    audit(db, { orgId: ctx.params.id, actorId: ctx.user.id, action: "member.invite", entity: "membership", entityId: id, detail: { role } });
    return json(res, 201, { ...membershipView(db.prepare("SELECT * FROM memberships WHERE id = ?").get(id)), user: userView(user), inviteToken });
  }, { auth: true });

  route("POST", /^\/v1\/auth\/accept-invite$/u, async (req, res) => {
    const body = await readJson(req);
    const token = str(body.token, 200);
    const password = str(body.password, 200);
    if (!token) return fail(res, 422, "invalid_token", "An invite token is required.");
    if (password.length < 10) return fail(res, 422, "weak_password", "Use at least 10 characters.");

    const invite = db.prepare("SELECT * FROM invites WHERE token_hash = ?").get(hashToken(token));
    if (!invite || invite.accepted_at) return fail(res, 404, "invalid_token", "This invite is unknown or already used.");
    if (new Date(invite.expires_at).getTime() < Date.now()) return fail(res, 410, "expired_token", "This invite has expired.");

    const membership = db.prepare("SELECT * FROM memberships WHERE id = ?").get(invite.membership_id);
    if (!membership) return fail(res, 404, "invalid_token", "This invite no longer exists.");

    db.prepare("UPDATE users SET password_hash = ?, status = 'active' WHERE id = ?").run(hashPassword(password), membership.user_id);
    db.prepare("UPDATE memberships SET status = 'active' WHERE id = ?").run(membership.id);
    db.prepare("UPDATE invites SET accepted_at = ? WHERE token_hash = ?").run(now(), invite.token_hash);
    audit(db, { orgId: membership.org_id, actorId: membership.user_id, action: "member.accept", entity: "membership", entityId: membership.id });

    const session = createSession(db, membership.user_id);
    return json(res, 200, { user: userView(db.prepare("SELECT * FROM users WHERE id = ?").get(membership.user_id)) }, {
      "set-cookie": sessionCookie(session.token, session.expires),
    });
  });

  route("PATCH", /^\/v1\/organizations\/(?<id>[\w-]+)\/members\/(?<mid>[\w-]+)$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!["owner", "admin"].includes(membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can change roles.");
    const body = await readJson(req);
    const role = str(body.role);
    if (!ROLE_RANK[role]) return fail(res, 422, "invalid_role", "Unknown role.");
    const target = db.prepare("SELECT * FROM memberships WHERE id = ? AND org_id = ?").get(ctx.params.mid, ctx.params.id);
    if (!target) return fail(res, 404, "not_found", "Membership not found.");
    db.prepare("UPDATE memberships SET role = ? WHERE id = ?").run(role, ctx.params.mid);
    audit(db, { orgId: ctx.params.id, actorId: ctx.user.id, action: "member.role", entity: "membership", entityId: ctx.params.mid, detail: { from: target.role, to: role } });
    return json(res, 200, membershipView(db.prepare("SELECT * FROM memberships WHERE id = ?").get(ctx.params.mid)));
  }, { auth: true });

  /* ------------------------------- users -------------------------------- */

  route("POST", /^\/v1\/users$/u, async (req, res, ctx) => {
    const orgId = membershipsOf(ctx.user.id)[0]?.org_id;
    const membership = orgId ? membershipOf(ctx.user.id, orgId) : null;
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot create users.");

    const body = await readJson(req);
    const email = str(body.email).toLowerCase();
    const name = str(body.name, 80);
    const role = str(body.role) || "member";
    if (!isEmail(email)) return fail(res, 422, "invalid_email", "A valid email is required.");
    if (name.length < 2) return fail(res, 422, "invalid_name", "A name is required.");
    if (!ROLE_RANK[role]) return fail(res, 422, "invalid_role", "Unknown role.");
    if (db.prepare("SELECT id FROM users WHERE email = ?").get(email)) {
      return fail(res, 409, "email_taken", "An account with this email already exists.");
    }

    const userId = newId("usr");
    db.prepare("INSERT INTO users (id, email, name, password_hash, status, locale, created_at) VALUES (?, ?, ?, ?, 'invited', ?, ?)").run(
      userId, email, name, hashPassword(newId("tmp")), str(body.locale) || null, now(),
    );
    db.prepare("INSERT INTO memberships (id, org_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, 'invited', ?)").run(
      newId("mem"), orgId, userId, role, now(),
    );
    const memRow = db.prepare("SELECT id FROM memberships WHERE org_id = ? AND user_id = ?").get(orgId, userId);
    const inviteToken = randomBytes(32).toString("base64url");
    db.prepare("INSERT INTO invites (token_hash, membership_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
      hashToken(inviteToken), memRow.id, now(), new Date(Date.now() + 7 * 86_400_000).toISOString(),
    );
    audit(db, { orgId, actorId: ctx.user.id, action: "user.create", entity: "user", entityId: userId, detail: { role } });
    return json(res, 201, { ...userView(db.prepare("SELECT * FROM users WHERE id = ?").get(userId)), inviteToken });
  }, { auth: true });

  route("GET", /^\/v1\/users$/u, async (req, res, ctx, url) => {
    const orgId = url.searchParams.get("organizationId") ?? membershipsOf(ctx.user.id)[0]?.org_id;
    if (!orgId || !membershipOf(ctx.user.id, orgId)) return fail(res, 404, "not_found", "Organization not found.");
    const search = str(url.searchParams.get("search") ?? "", 80).toLowerCase();
    const rows = db
      .prepare("SELECT u.*, m.role, m.status AS membership_status FROM users u JOIN memberships m ON m.user_id = u.id WHERE m.org_id = ? ORDER BY u.name")
      .all(orgId);
    const items = rows
      .filter((row) => (search ? `${row.name} ${row.email}`.toLowerCase().includes(search) : true))
      .map((row) => ({ ...userView(row), role: row.role, membershipStatus: row.membership_status }));
    return json(res, 200, { items, nextCursor: null, total: items.length });
  }, { auth: true });

  route("GET", /^\/v1\/users\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const orgs = membershipsOf(ctx.user.id).map((row) => row.org_id);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(ctx.params.id);
    if (!row) return fail(res, 404, "not_found", "User not found.");
    const shared = db.prepare("SELECT org_id FROM memberships WHERE user_id = ?").all(row.id).some((item) => orgs.includes(item.org_id));
    if (!shared) return fail(res, 404, "not_found", "User not found.");
    return json(res, 200, userView(row));
  }, { auth: true });

  route("PATCH", /^\/v1\/users\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(ctx.params.id);
    if (!row) return fail(res, 404, "not_found", "User not found.");
    const orgId = membershipsOf(ctx.user.id)[0]?.org_id;
    const membership = orgId ? membershipOf(ctx.user.id, orgId) : null;
    if (!membership || !requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot update users.");
    const body = await readJson(req);
    const name = str(body.name, 80);
    const status = str(body.status);
    const locale = str(body.locale, 12);
    const role = str(body.role);
    if (name) db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, ctx.params.id);
    if (locale) db.prepare("UPDATE users SET locale = ? WHERE id = ?").run(locale, ctx.params.id);
    if (status && ["invited", "active", "suspended"].includes(status)) db.prepare("UPDATE users SET status = ? WHERE id = ?").run(status, ctx.params.id);
    if (role) {
      if (!ROLE_RANK[role]) return fail(res, 422, "invalid_role", "Unknown role.");
      const targetMembership = db.prepare("SELECT * FROM memberships WHERE user_id = ? AND org_id = ?").get(ctx.params.id, orgId);
      if (targetMembership) db.prepare("UPDATE memberships SET role = ? WHERE id = ?").run(role, targetMembership.id);
    }
    audit(db, { orgId, actorId: ctx.user.id, action: "user.update", entity: "user", entityId: ctx.params.id });
    return json(res, 200, userView(db.prepare("SELECT * FROM users WHERE id = ?").get(ctx.params.id)));
  }, { auth: true });

  /* ---------------------------- invitations ----------------------------- */

  route("POST", /^\/v1\/organizations\/(?<id>[\w-]+)\/invitations$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot invite members.");

    const body = await readJson(req);
    const email = str(body.email).toLowerCase();
    const role = str(body.role) || "member";
    if (!isEmail(email)) return fail(res, 422, "invalid_email", "A valid email is required.");
    if (!ROLE_RANK[role]) return fail(res, 422, "invalid_role", "Unknown role.");

    let user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!user) {
      const userId = newId("usr");
      db.prepare("INSERT INTO users (id, email, name, password_hash, status, created_at) VALUES (?, ?, ?, ?, 'invited', ?)").run(
        userId,
        email,
        email.split("@")[0],
        hashPassword(newId("tmp")),
        now(),
      );
      user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
    }
    const existing = membershipOf(user.id, ctx.params.id);
    if (existing) return fail(res, 409, "already_member", "This user is already an active member.");

    const memId = newId("mem");
    db.prepare("INSERT INTO memberships (id, org_id, user_id, role, status, joined_at) VALUES (?, ?, ?, ?, 'invited', ?)").run(
      memId, ctx.params.id, user.id, role, now(),
    );
    const inviteToken = randomBytes(32).toString("base64url");
    const createdAt = now();
    const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
    db.prepare("INSERT INTO invites (token_hash, membership_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
      hashToken(inviteToken), memId, createdAt, expiresAt,
    );
    audit(db, { orgId: ctx.params.id, actorId: ctx.user.id, action: "member.invite", entity: "invitation", entityId: memId, detail: { role } });
    return json(res, 201, {
      id: memId,
      organizationId: ctx.params.id,
      email: user.email,
      role,
      status: "pending",
      createdAt,
      expiresAt,
      inviteToken,
    });
  }, { auth: true });

  route("GET", /^\/v1\/organizations\/(?<id>[\w-]+)\/invitations$/u, async (req, res, ctx) => {
    const membership = membershipOf(ctx.user.id, ctx.params.id);
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    const rows = db
      .prepare(
        `SELECT i.*, m.role, u.email FROM invites i
         JOIN memberships m ON m.id = i.membership_id
         JOIN users u ON u.id = m.user_id
         WHERE m.org_id = ? ORDER BY i.created_at DESC`,
      )
      .all(ctx.params.id);
    const items = rows.map((row) => ({
      id: row.membership_id,
      organizationId: ctx.params.id,
      email: row.email,
      role: row.role,
      status: row.accepted_at ? "accepted" : new Date(row.expires_at).getTime() < Date.now() ? "expired" : "pending",
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }));
    return json(res, 200, { items, nextCursor: null, total: items.length });
  }, { auth: true });
  /* ------------------------------ catalog ------------------------------- */

  route("GET", /^\/v1\/catalog\/categories$/u, async (req, res) => {
    const rows = db.prepare("SELECT * FROM categories ORDER BY COALESCE(parent_id, ''), label_key").all();
    return json(res, 200, {
      items: rows.map((row) => ({ id: row.id, parentId: row.parent_id, labelKey: row.label_key })),
      nextCursor: null,
      total: rows.length,
    });
  }, { auth: true });

  const orgFrom = (ctx, url) => {
    const orgId = url.searchParams.get("organizationId") ?? membershipsOf(ctx.user.id)[0]?.org_id;
    if (!orgId) return { error: [404, "not_found", "No organization is available for this account."] };
    const membership = membershipOf(ctx.user.id, orgId);
    if (!membership) return { error: [404, "not_found", "Organization not found."] };
    return { orgId, membership };
  };

  route("GET", /^\/v1\/catalog\/sellers$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM sellers WHERE org_id = ? ORDER BY name").all(scope.orgId);
    return json(res, 200, {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        kind: row.kind,
        country: row.country,
        region: row.region,
        verification: row.verification,
        summary: row.summary,
      })),
      nextCursor: null,
      total: rows.length,
    });
  }, { auth: true });

  route("GET", /^\/v1\/catalog\/products$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM products WHERE org_id = ? ORDER BY created_at DESC").all(scope.orgId);
    return json(res, 200, {
      items: rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        sellerId: row.seller_id,
        categoryId: row.category_id,
        name: row.name,
        price: { amountMinor: row.price_minor, currency: row.currency },
        unit: row.unit,
        stock: row.stock,
      })),
      nextCursor: null,
      total: rows.length,
    });
  }, { auth: true });

  route("POST", /^\/v1\/catalog\/products$/u, async (req, res, ctx) => {
    const body = await readJson(req);
    const orgId = str(body.organizationId) || membershipsOf(ctx.user.id)[0]?.org_id;
    const membership = orgId ? membershipOf(ctx.user.id, orgId) : null;
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot create products.");

    const name = str(body.name, 160);
    const priceMinor = Number(body.priceMinor);
    if (name.length < 2) return fail(res, 422, "invalid_name", "A product name is required.");
    if (!Number.isSafeInteger(priceMinor) || priceMinor < 0) return fail(res, 422, "invalid_price", "priceMinor must be an integer.");

    const id = newId("prd");
    db.prepare(
      "INSERT INTO products (id, org_id, seller_id, category_id, slug, name, price_minor, currency, unit, stock, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run(
      id,
      orgId,
      str(body.sellerId) || null,
      str(body.categoryId) || null,
      slugify(name),
      name,
      priceMinor,
      str(body.currency) || "IRR",
      str(body.unit) || "kg",
      Number.isSafeInteger(body.stock) ? body.stock : 0,
      now(),
    );
    audit(db, { orgId, actorId: ctx.user.id, action: "product.create", entity: "product", entityId: id });
    return json(res, 201, { id, name, price: { amountMinor: priceMinor, currency: str(body.currency) || "IRR" } });
  }, { auth: true });

  /* ----------------------------- resources ------------------------------ */

  const RESOURCE_TYPES = new Set(["landscapes", "villages", "projects", "farms", "sites", "reports", "courses", "articles", "surveys"]);

  route("GET", /^\/v1\/resources\/(?<type>[a-z-]+)$/u, async (req, res, ctx, url) => {
    const type = ctx.params.type;
    if (!RESOURCE_TYPES.has(type)) return fail(res, 404, "not_found", "Unknown resource type.");
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM resources WHERE org_id = ? AND type = ? ORDER BY updated_at DESC").all(scope.orgId, type);
    return json(res, 200, { items: rows.map((row) => ({ id: row.id, type: row.type, ...JSON.parse(row.data) })), nextCursor: null, total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/resources\/(?<type>[a-z-]+)$/u, async (req, res, ctx) => {
    const type = ctx.params.type;
    if (!RESOURCE_TYPES.has(type)) return fail(res, 404, "not_found", "Unknown resource type.");
    const body = await readJson(req);
    const orgId = str(body.organizationId) || membershipsOf(ctx.user.id)[0]?.org_id;
    const membership = orgId ? membershipOf(ctx.user.id, orgId) : null;
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot create records.");
    const id = newId("res");
    const at = now();
    const { organizationId: _ignored, ...data } = body;
    db.prepare("INSERT INTO resources (id, org_id, type, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id,
      orgId,
      type,
      JSON.stringify(data),
      at,
      at,
    );
    audit(db, { orgId, actorId: ctx.user.id, action: `${type}.create`, entity: type, entityId: id });
    return json(res, 201, { id, type, ...data });
  }, { auth: true });

  route("GET", /^\/v1\/resources\/(?<type>[a-z-]+)\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = ?").get(ctx.params.id, scope.orgId, ctx.params.type);
    if (!row) return fail(res, 404, "not_found", "Record not found.");
    return json(res, 200, { id: row.id, type: row.type, ...JSON.parse(row.data) });
  }, { auth: true });

  route("PATCH", /^\/v1\/resources\/(?<type>[a-z-]+)\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot update records.");
    const row = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = ?").get(ctx.params.id, scope.orgId, ctx.params.type);
    if (!row) return fail(res, 404, "not_found", "Record not found.");
    const body = await readJson(req);
    const { organizationId: _ignored, ...patch } = body;
    const merged = { ...JSON.parse(row.data), ...patch };
    db.prepare("UPDATE resources SET data = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(merged), now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: `${ctx.params.type}.update`, entity: ctx.params.type, entityId: row.id });
    return json(res, 200, { id: row.id, type: row.type, ...merged });
  }, { auth: true });

  route("DELETE", /^\/v1\/resources\/(?<type>[a-z-]+)\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can delete records.");
    const info = db.prepare("DELETE FROM resources WHERE id = ? AND org_id = ? AND type = ?").run(ctx.params.id, scope.orgId, ctx.params.type);
    if (info.changes === 0) return fail(res, 404, "not_found", "Record not found.");
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: `${ctx.params.type}.delete`, entity: ctx.params.type, entityId: ctx.params.id });
    return json(res, 200, { ok: true });
  }, { auth: true });

  /* --------------------------- notifications ---------------------------- */

  route("GET", /^\/v1\/notifications$/u, async (req, res, ctx) => {
    const orgIds = membershipsOf(ctx.user.id).map((row) => row.org_id);
    if (orgIds.length === 0) return json(res, 200, { items: [], unread: 0 });
    const placeholders = orgIds.map(() => "?").join(",");
    const rows = db
      .prepare(
        `SELECT id, org_id, actor_id, action, entity, entity_id, at FROM audit
         WHERE org_id IN (${placeholders}) ORDER BY id DESC LIMIT 50`,
      )
      .all(...orgIds);
    const seen = db.prepare("SELECT last_seen_id FROM notification_state WHERE user_id = ?").get(ctx.user.id);
    const lastSeen = seen?.last_seen_id ?? 0;
    const items = rows.map((row) => ({
      id: row.id,
      organizationId: row.org_id,
      actorId: row.actor_id,
      action: row.action,
      entity: row.entity,
      entityId: row.entity_id,
      at: row.at,
      unread: row.id > lastSeen,
    }));
    return json(res, 200, { items, unread: items.filter((item) => item.unread).length });
  }, { auth: true });

  route("POST", /^\/v1\/notifications\/seen$/u, async (req, res, ctx) => {
    const orgIds = membershipsOf(ctx.user.id).map((row) => row.org_id);
    if (orgIds.length === 0) return json(res, 200, { ok: true, unread: 0 });
    const placeholders = orgIds.map(() => "?").join(",");
    const max = db.prepare(`SELECT COALESCE(MAX(id), 0) AS n FROM audit WHERE org_id IN (${placeholders})`).get(...orgIds);
    db.prepare(
      "INSERT INTO notification_state (user_id, last_seen_id, updated_at) VALUES (?, ?, ?)\n" +
        "ON CONFLICT(user_id) DO UPDATE SET last_seen_id = excluded.last_seen_id, updated_at = excluded.updated_at",
    ).run(ctx.user.id, max.n, now());
    return json(res, 200, { ok: true, unread: 0 });
  }, { auth: true });

  /* ------------------------------- meta --------------------------------- */

  route("GET", /^\/health$/u, async (req, res) => json(res, 200, { status: "ok", service: "eco-nojin-api", version: VERSION }));

  route("GET", /^\/v1\/models$/u, async (req, res) => json(res, 200, { models: MODEL_REGISTRY, source: "eco-nojin-api" }));

  /* ------------------------------ dispatch ------------------------------ */

  return async function handler(req, res) {
    cors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type",
        "access-control-max-age": "600",
      });
      return res.end();
    }

    const url = new URL(req.url ?? "/", "http://localhost");
    const path = url.pathname;

    for (const entry of routes) {
      if (entry.method !== req.method) continue;
      const match = entry.pattern.exec(path);
      if (!match) continue;

      const ctx = { params: match.groups ?? {}, user: null, body: undefined };
      if (entry.opts.auth) {
        const token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
        const session = readSession(db, token);
        if (!session) return fail(res, 401, "unauthenticated", "Sign in to continue.");
        ctx.user = db.prepare("SELECT * FROM users WHERE id = ?").get(session.userId);
        if (!ctx.user || ctx.user.status !== "active") return fail(res, 401, "unauthenticated", "Account is not active.");
      }

      try {
        return await entry.handler(req, res, ctx, url);
      } catch (error) {
        if (String(error?.message) === "invalid_json") return fail(res, 400, "invalid_json", "Request body is not valid JSON.");
        if (String(error?.message) === "payload_too_large") return fail(res, 413, "payload_too_large", "Request body is too large.");
        console.error("api error", error);
        return fail(res, 500, "internal_error", "Unexpected server error.");
      }
    }

    return fail(res, 404, "not_found", `No route for ${req.method} ${path}`);
  };
}

export function startServer(options = {}) {
  const db = options.db ?? (options.dbFile ? openDatabase(options.dbFile) : database());
  const server = createHttpServer(createApp({ db }));
  const port = options.port ?? PORT;
  const host = options.host ?? "127.0.0.1";
  return new Promise((resolve) => {
    server.listen(port, host, () => resolve({ server, port: server.address().port, db }));
  });
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/").split("/").pop());
if (isMain) {
  const { port } = await startServer();
  console.log(`Eco Nojin API listening on http://127.0.0.1:${port}`);
}
