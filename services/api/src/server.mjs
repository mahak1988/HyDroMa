/**
}
  console.log(`Eco Nojin API listening on http://127.0.0.1:${port}`);
  // Phase 3.65 — four-eyes manual EcoCoin adjustment workflow.
  // REQUESTED -> APPROVED -> EXECUTED, or REQUESTED -> REJECTED.
  // The requester cannot approve their own request. Amount/user/org/entryType/reason
  // are frozen at request time and never mutated by approve/reject/execute.
  route("POST", /^\/v1\/ecocoin\/adjustment-requests$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot request manual corrections.");

    const body = await readJson(req);
    const targetUserId = str(body.targetUserId, 80);
    const target = db.prepare("SELECT id FROM users WHERE id = ?").get(targetUserId);
    if (!target) return fail(res, 404, "not_found", "Target user not found.");
    const amount = Number(body.amount);
    if (!isPosInt(amount)) return fail(res, 422, "invalid_amount", "amount must be a positive integer of EcoCoin units.");
    const entryType = str(body.entryType, 16);
    if (!["credit", "debit"].includes(entryType)) return fail(res, 422, "invalid_entry_type", "entryType must be 'credit' or 'debit'.");
    const reason = str(body.reason, 300);
    if (reason.length < 2) return fail(res, 422, "invalid_reason", "A reason is required for a correction request.");

    const id = newId("adjr");
    db.prepare(
      "INSERT INTO eco_coin_adjustment_requests (id, org_id, requested_by, target_user_id, entry_type, amount, reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'requested', ?)",
    ).run(id, scope.orgId, ctx.user.id, targetUserId, entryType, amount, reason, now());
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.adjustment_request.create", entity: "eco_coin_adjustment_requests", entityId: id, detail: { entryType, amount, targetUserId } });
    return json(res, 201, adjustmentRequestView(db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/ecocoin\/adjustment-requests$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot list correction requests.");
    const rows = db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE org_id = ? ORDER BY created_at DESC").all(scope.orgId);
    return json(res, 200, { items: rows.map(adjustmentRequestView), nextCursor: null, total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/ecocoin\/adjustment-requests\/(?<id>[\w-]+)\/approve$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can approve corrections.");
    const row = db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Correction request not found.");
    if (row.requested_by === ctx.user.id) return fail(res, 403, "self_approval_forbidden", "The requester cannot approve their own correction.");
    if (row.status !== "requested") return fail(res, 409, "not_pending", "Request is not pending (status: " + row.status + ").");

    const body = await readJson(req);
    const note = str(body.note, 300) || null;
    db.prepare("UPDATE eco_coin_adjustment_requests SET status = 'approved', approver_id = ?, decision_note = ?, decided_at = ? WHERE id = ?").run(ctx.user.id, note, now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.adjustment_request.approve", entity: "eco_coin_adjustment_requests", entityId: row.id });
    return json(res, 200, adjustmentRequestView(db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("POST", /^\/v1\/ecocoin\/adjustment-requests\/(?<id>[\w-]+)\/reject$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can reject corrections.");
    const row = db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Correction request not found.");
    if (row.requested_by === ctx.user.id) return fail(res, 403, "self_approval_forbidden", "The requester cannot reject their own correction.");
    if (row.status !== "requested") return fail(res, 409, "not_pending", "Request is not pending (status: " + row.status + ").");

    const body = await readJson(req);
    const note = str(body.note, 300) || null;
    db.prepare("UPDATE eco_coin_adjustment_requests SET status = 'rejected', approver_id = ?, decision_note = ?, decided_at = ? WHERE id = ?").run(ctx.user.id, note, now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.adjustment_request.reject", entity: "eco_coin_adjustment_requests", entityId: row.id });
    return json(res, 200, adjustmentRequestView(db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("POST", /^\/v1\/ecocoin\/adjustment-requests\/(?<id>[\w-]+)\/execute$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can execute corrections.");
    const row = db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Correction request not found.");
    if (row.status !== "approved") return fail(res, 409, "not_approved", "Only approved requests can be executed.");
    if (row.executed_at) return fail(res, 409, "already_executed", "This request has already been executed.");

    const executionReference = "adjustment-exec:" + row.id;
    if (row.entry_type === "credit") {
      const creditResult = creditEcoCoin({
        orgId: scope.orgId,
        userId: row.target_user_id,
        amount: row.amount,
        reason: "Approved correction: " + row.reason,
        source: "approved_adjustment",
        reference: executionReference,
        actorId: ctx.user.id,
      });
      db.prepare("UPDATE eco_coin_adjustment_requests SET status = 'executed', executed_at = ?, execution_reference = ? WHERE id = ?").run(now(), executionReference, row.id);
      audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.adjustment_request.execute", entity: "eco_coin_adjustment_requests", entityId: row.id, detail: { duplicate: creditResult.duplicate } });
      return json(res, 200, { request: adjustmentRequestView(db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ?").get(row.id)), entry: ledgerView(creditResult.entry), duplicate: creditResult.duplicate });
    }
    const id = newId("eco");
    const info = db
      .prepare("INSERT OR IGNORE INTO eco_coin_ledger (id, org_id, user_id, entry_type, amount, reason, source, reference, created_at) VALUES (?, ?, ?, 'debit', ?, ?, 'approved_adjustment', ?, ?)")
      .run(id, scope.orgId, row.target_user_id, row.amount, "Approved correction: " + row.reason, executionReference, now());
    if (info.changes > 0) audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.debit", entity: "eco_coin_ledger", entityId: id, detail: { source: "approved_adjustment", reference: executionReference } });
    const entry = db.prepare("SELECT * FROM eco_coin_ledger WHERE org_id = ? AND reference = ?").get(scope.orgId, executionReference);
    db.prepare("UPDATE eco_coin_adjustment_requests SET status = 'executed', executed_at = ?, execution_reference = ? WHERE id = ?").run(now(), executionReference, row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.adjustment_request.execute", entity: "eco_coin_adjustment_requests", entityId: row.id, detail: { duplicate: info.changes === 0 } });
    return json(res, 200, { request: adjustmentRequestView(db.prepare("SELECT * FROM eco_coin_adjustment_requests WHERE id = ?").get(row.id)), entry: ledgerView(entry), duplicate: info.changes === 0 });
  }, { auth: true });

}
/**
}
  console.log(`Eco Nojin API listening on http://127.0.0.1:${port}`);
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
import { randomBytes, createHash } from "node:crypto";
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
  /* ------------------------------- runs -------------------------------- */

  route("GET", /^\/v1\/runs$/u, async (req, res, ctx) => {
    const orgId = membershipsOf(ctx.user.id)[0]?.org_id;
    if (!orgId) return json(res, 200, { items: [], nextCursor: null, total: 0 });
    const rows = db
      .prepare("SELECT id, data, created_at FROM resources WHERE org_id = ? AND type = 'runs' ORDER BY created_at DESC LIMIT 200")
      .all(orgId);
    const items = rows.map((row) => ({ id: row.id, ...JSON.parse(row.data), createdAt: row.created_at }));
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

  const RESOURCE_TYPES = new Set(["landscapes", "villages", "projects", "farms", "sites", "reports", "courses", "articles", "surveys", "runs", "cropCycles", "irrigationEvents", "fieldObservations"]);

  // Project status workflow (state machine). Status is NOT a free string: it only
  // advances along the allowed edges below, through the transition endpoint.
  const PROJECT_STATUS = ["planned", "active", "on_hold", "completed"];
  const PROJECT_TRANSITIONS = {
    planned: ["active", "on_hold"],
    active: ["on_hold", "completed"],
    on_hold: ["planned", "active"],
    completed: [],
  };

  // Crop-cycle (agricultural season) workflow. A crop cycle is a real agronomic
  // record: it belongs to a farm, covers a season window and an area, and moves
  // through a planting→harvest lifecycle. Status is workflow-owned (transition
  // endpoint only); the create step validates the agronomy against the farm.
  const CROP_CYCLE_STATUS = ["planned", "approved", "planted", "growing", "harvested"];
  const CROP_CYCLE_TRANSITIONS = {
    planned: ["approved"],
    approved: ["planted", "planned"],
    planted: ["growing"],
    growing: ["harvested"],
    harvested: [],
  };

  const isoDate = (value) => /^\d{4}-\d{2}-\d{2}$/u.test(value) && !Number.isNaN(Date.parse(value));

  // Validate a crop cycle against agronomic rules. Returns an error tuple or null.
  // Rules: a farm must exist in the same org; area > 0 and ≤ the farm's areaHa
  // (when the farm declares one); a crop name is required; the season window must
  // be a valid date range with end strictly after start.
  const validateCropCycle = (orgId, data) => {
    const name = str(data.crop, 120);
    if (name.length < 2) return [422, "invalid_crop", "A crop name is required."];
    const farmId = str(data.farmId, 80);
    if (!farmId) return [422, "invalid_farm", "A farm is required for a crop cycle."];
    const farm = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'farms'").get(farmId, orgId);
    if (!farm) return [404, "not_found", "Farm not found."];
    const areaHa = Number(data.areaHa);
    if (!Number.isFinite(areaHa) || areaHa <= 0) return [422, "invalid_area", "Area must be a positive number of hectares."];
    const farmArea = Number(JSON.parse(farm.data).areaHa);
    if (Number.isFinite(farmArea) && farmArea > 0 && areaHa > farmArea) {
      return [422, "area_exceeds_farm", "The crop area cannot exceed the farm area."];
    }
    if (!isoDate(data.seasonStart) || !isoDate(data.seasonEnd)) {
      return [422, "invalid_season", "A valid season start and end date are required."];
    }
    if (Date.parse(data.seasonEnd) <= Date.parse(data.seasonStart)) {
      return [422, "invalid_season", "The season end must be after the start."];
    }
    return null;
  };

  // Derived, read-only agronomic indicator: yield attainment = actual / expected.
  // Computed on read (never stored), null until a harvest is recorded.
  const withYieldAttainment = (record) => {
    if (record.type !== "cropCycles") return record;
    const expected = Number(record.expectedYield);
    const actual = record.actualYield == null ? NaN : Number(record.actualYield);
    const attainment =
      Number.isFinite(expected) && expected > 0 && Number.isFinite(actual) && actual >= 0
        ? Math.round((actual / expected) * 1000) / 10
        : null;
    return { ...record, yieldAttainmentPct: attainment };
  };

  // Irrigation event (field observation). This is a RECORDED OBSERVATION, not a
  // modeled or scientifically validated result: no ET0, water balance or schedule
  // is computed here. Validation enforces agronomic/operational integrity only:
  // a known unit, a positive quantity, a valid date/time, a farm that exists in
  // the same org, and — when a crop cycle is referenced — that it belongs to the
  // same farm and org.
  const IRRIGATION_UNITS = ["mm", "m3", "L", "m3/ha"];
  const IRRIGATION_METHODS = ["surface", "sprinkler", "drip", "manual", "other"];
  const validateIrrigationEvent = (orgId, data) => {
    const farmId = str(data.farmId, 80);
    if (!farmId) return [422, "invalid_farm", "A farm is required for an irrigation record."];
    const farm = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'farms'").get(farmId, orgId);
    if (!farm) return [404, "not_found", "Farm not found."];
    const quantity = Number(data.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) return [422, "invalid_quantity", "Quantity must be a positive number."];
    const unit = str(data.unit, 16);
    if (!IRRIGATION_UNITS.includes(unit)) return [422, "invalid_unit", "Unknown irrigation unit."];
    const method = str(data.method, 24) || "other";
    if (!IRRIGATION_METHODS.includes(method)) return [422, "invalid_method", "Unknown irrigation method."];
    const occurredAt = str(data.occurredAt, 40);
    if (!occurredAt || Number.isNaN(Date.parse(occurredAt))) return [422, "invalid_datetime", "A valid irrigation date/time is required."];
    const cropCycleId = str(data.cropCycleId, 80);
    if (cropCycleId) {
      const cycle = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'cropCycles'").get(cropCycleId, orgId);
      if (!cycle) return [404, "not_found", "Crop cycle not found."];
      if (str(JSON.parse(cycle.data).farmId, 80) !== farmId) {
        return [422, "crop_cycle_farm_mismatch", "The crop cycle must belong to the same farm."];
      }
    }
    return null;
  };

  // Field observation (agronomic field condition record). A RECORDED OBSERVATION,
  // not a verified scientific conclusion: no diagnosis, no recommendation, no model.
  // Validation enforces operational integrity only: a farm that exists in the same
  // org, a known category and severity, an observer, a valid date/time and a
  // description; when a crop cycle is referenced it must belong to the same farm.
  const OBS_CATEGORIES = ["soil", "water", "crop_health", "pest", "weed", "disease", "growth", "other"];
  const OBS_SEVERITY = ["none", "low", "moderate", "high", "critical"];
  const validateFieldObservation = (orgId, data) => {
    const farmId = str(data.farmId, 80);
    if (!farmId) return [422, "invalid_farm", "A farm is required for a field observation."];
    const farm = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'farms'").get(farmId, orgId);
    if (!farm) return [404, "not_found", "Farm not found."];
    const category = str(data.category, 32);
    if (!OBS_CATEGORIES.includes(category)) return [422, "invalid_category", "Unknown observation category."];
    const severity = str(data.severity, 16) || "none";
    if (!OBS_SEVERITY.includes(severity)) return [422, "invalid_severity", "Unknown severity level."];
    const observer = str(data.observer, 120);
    if (observer.length < 2) return [422, "invalid_observer", "An observer is required."];
    const description = str(data.description, 2000);
    if (description.length < 2) return [422, "invalid_description", "A description is required."];
    const observedAt = str(data.observedAt, 40);
    if (!observedAt || Number.isNaN(Date.parse(observedAt))) return [422, "invalid_datetime", "A valid observation date/time is required."];
    const cropCycleId = str(data.cropCycleId, 80);
    if (cropCycleId) {
      const cycle = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'cropCycles'").get(cropCycleId, orgId);
      if (!cycle) return [404, "not_found", "Crop cycle not found."];
      if (str(JSON.parse(cycle.data).farmId, 80) !== farmId) {
        return [422, "crop_cycle_farm_mismatch", "The crop cycle must belong to the same farm."];
      }
    }
    return null;
  };

  route("GET", /^\/v1\/resources\/(?<type>[A-Za-z-]+)$/u, async (req, res, ctx, url) => {
    const type = ctx.params.type;
    if (!RESOURCE_TYPES.has(type)) return fail(res, 404, "not_found", "Unknown resource type.");
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM resources WHERE org_id = ? AND type = ? ORDER BY updated_at DESC").all(scope.orgId, type);
    return json(res, 200, { items: rows.map((row) => withYieldAttainment({ id: row.id, type: row.type, ...JSON.parse(row.data) })), nextCursor: null, total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/resources\/(?<type>[A-Za-z-]+)$/u, async (req, res, ctx) => {
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
    // A project's status is owned by the workflow, not the client: a new project
    // always starts `planned` and can only change via the transition endpoint.
    if (type === "projects") data.status = "planned";
    // A crop cycle is validated against the farm and starts its lifecycle `planned`.
    if (type === "cropCycles") {
      const invalid = validateCropCycle(orgId, data);
      if (invalid) return fail(res, ...invalid);
      data.status = "planned";
      data.expectedYield = Number(data.expectedYield) || null;
      data.actualYield = null;
      data.farmId = str(data.farmId, 80);
      data.crop = str(data.crop, 120);
      data.areaHa = Number(data.areaHa);
      data.seasonStart = str(data.seasonStart, 10);
      data.seasonEnd = str(data.seasonEnd, 10);
    }
    // An irrigation event is a validated field observation linked to a farm and
    // (optionally) a crop cycle. No science is performed; only integrity checks.
    if (type === "irrigationEvents") {
      const invalid = validateIrrigationEvent(orgId, data);
      if (invalid) return fail(res, ...invalid);
      data.farmId = str(data.farmId, 80);
      data.cropCycleId = str(data.cropCycleId, 80) || null;
      data.quantity = Number(data.quantity);
      data.unit = str(data.unit, 16);
      data.method = str(data.method, 24) || "other";
      data.occurredAt = str(data.occurredAt, 40);
      data.notes = str(data.notes, 500);
    }
    // A field observation is a validated record of field conditions linked to a
    // farm and (optionally) a crop cycle. No diagnosis/recommendation is produced.
    if (type === "fieldObservations") {
      const invalid = validateFieldObservation(orgId, data);
      if (invalid) return fail(res, ...invalid);
      data.farmId = str(data.farmId, 80);
      data.cropCycleId = str(data.cropCycleId, 80) || null;
      data.category = str(data.category, 32);
      data.severity = str(data.severity, 16) || "none";
      data.observer = str(data.observer, 120);
      data.description = str(data.description, 2000);
      data.observedAt = str(data.observedAt, 40);
      data.notes = str(data.notes, 500);
    }
    db.prepare("INSERT INTO resources (id, org_id, type, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(
      id,
      orgId,
      type,
      JSON.stringify(data),
      at,
      at,
    );
    audit(db, { orgId, actorId: ctx.user.id, action: `${type}.create`, entity: type, entityId: id });
    return json(res, 201, withYieldAttainment({ id, type, ...data }));
  }, { auth: true });

  route("GET", /^\/v1\/resources\/(?<type>[A-Za-z-]+)\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = ?").get(ctx.params.id, scope.orgId, ctx.params.type);
    if (!row) return fail(res, 404, "not_found", "Record not found.");
    return json(res, 200, withYieldAttainment({ id: row.id, type: row.type, ...JSON.parse(row.data) }));
  }, { auth: true });

  route("PATCH", /^\/v1\/resources\/(?<type>[A-Za-z-]+)\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot update records.");
    const row = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = ?").get(ctx.params.id, scope.orgId, ctx.params.type);
    if (!row) return fail(res, 404, "not_found", "Record not found.");
    const body = await readJson(req);
    const { organizationId: _ignored, ...patch } = body;
    // Project status is workflow-owned: reject a direct status write so the state
    // machine cannot be bypassed. Clients must POST …/projects/:id/transition.
    if (ctx.params.type === "projects" && Object.prototype.hasOwnProperty.call(patch, "status")) {
      return fail(res, 409, "status_is_workflow_owned", "Project status changes must use the transition endpoint.");
    }
    // Crop-cycle status is workflow-owned too. Agronomic fields may be edited only
    // while still `planned` (before approval locks the plan).
    if (ctx.params.type === "cropCycles") {
      if (Object.prototype.hasOwnProperty.call(patch, "status")) {
        return fail(res, 409, "status_is_workflow_owned", "Crop-cycle status changes must use the transition endpoint.");
      }
      const current = JSON.parse(row.data);
      if (String(current.status ?? "planned") !== "planned") {
        return fail(res, 409, "plan_locked", "A crop cycle can only be edited while it is planned.");
      }
      const candidate = { ...current, ...patch };
      const invalid = validateCropCycle(scope.orgId, candidate);
      if (invalid) return fail(res, ...invalid);
      patch.areaHa = Number(candidate.areaHa);
    }
    // Irrigation events are always editable (observations), but every edit is
    // re-validated for integrity (farm/crop-cycle/quantity/unit/datetime).
    if (ctx.params.type === "irrigationEvents") {
      const candidate = { ...JSON.parse(row.data), ...patch };
      const invalid = validateIrrigationEvent(scope.orgId, candidate);
      if (invalid) return fail(res, ...invalid);
      patch.quantity = Number(candidate.quantity);
    }
    // Field observations are editable but every edit is re-validated for integrity.
    if (ctx.params.type === "fieldObservations") {
      const candidate = { ...JSON.parse(row.data), ...patch };
      const invalid = validateFieldObservation(scope.orgId, candidate);
      if (invalid) return fail(res, ...invalid);
    }
    const merged = { ...JSON.parse(row.data), ...patch };
    db.prepare("UPDATE resources SET data = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(merged), now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: `${ctx.params.type}.update`, entity: ctx.params.type, entityId: row.id });
    return json(res, 200, { id: row.id, type: row.type, ...merged });
  }, { auth: true });

  // Project status transition (state machine). The only legal way to change a
  // project's status. Enforces the allowed edge, tenancy and write role, and
  // writes an audit row describing the from→to change.
  route("POST", /^\/v1\/resources\/projects\/(?<id>[\w-]+)\/transition$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot change project status.");
    const row = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'projects'").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Project not found.");
    const body = await readJson(req);
    const to = str(body.to, 40);
    const from = String(JSON.parse(row.data).status ?? "planned");
    if (!PROJECT_STATUS.includes(to)) return fail(res, 422, "invalid_status", "Unknown project status.");
    if (to === from) return json(res, 200, { id: row.id, type: "projects", ...JSON.parse(row.data) });
    if (!(PROJECT_TRANSITIONS[from] ?? []).includes(to)) {
      return fail(res, 409, "invalid_transition", `Cannot move a project from ${from} to ${to}.`, { from, to, allowed: PROJECT_TRANSITIONS[from] ?? [] });
    }
    const merged = { ...JSON.parse(row.data), status: to };
    db.prepare("UPDATE resources SET data = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(merged), now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "project.transition", entity: "projects", entityId: row.id, detail: { from, to } });
    return json(res, 200, { id: row.id, type: "projects", ...merged });
  }, { auth: true });

  // Crop-cycle status transition (agronomic lifecycle state machine). The only
  // legal way to advance a crop cycle. Recording a harvest captures actualYield.
  route("POST", /^\/v1\/resources\/cropCycles\/(?<id>[\w-]+)\/transition$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot change crop-cycle status.");
    const row = db.prepare("SELECT * FROM resources WHERE id = ? AND org_id = ? AND type = 'cropCycles'").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Crop cycle not found.");
    const body = await readJson(req);
    const to = str(body.to, 40);
    const data = JSON.parse(row.data);
    const from = String(data.status ?? "planned");
    if (!CROP_CYCLE_STATUS.includes(to)) return fail(res, 422, "invalid_status", "Unknown crop-cycle status.");
    if (to === from) return json(res, 200, withYieldAttainment({ id: row.id, type: "cropCycles", ...data }));
    if (!(CROP_CYCLE_TRANSITIONS[from] ?? []).includes(to)) {
      return fail(res, 409, "invalid_transition", `Cannot move a crop cycle from ${from} to ${to}.`, { from, to, allowed: CROP_CYCLE_TRANSITIONS[from] ?? [] });
    }
    const merged = { ...data, status: to };
    if (to === "harvested") {
      const actual = Number(body.actualYield);
      if (!Number.isFinite(actual) || actual < 0) {
        return fail(res, 422, "invalid_yield", "A non-negative actualYield is required to record a harvest.");
      }
      merged.actualYield = actual;
    }
    db.prepare("UPDATE resources SET data = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(merged), now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "cropCycle.transition", entity: "cropCycles", entityId: row.id, detail: { from, to } });
    return json(res, 200, withYieldAttainment({ id: row.id, type: "cropCycles", ...merged }));
  }, { auth: true });

  route("DELETE", /^\/v1\/resources\/(?<type>[A-Za-z-]+)\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
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

  /* ------------------- rewards, challenges & EcoCoin -------------------- */
  //
  // EcoCoin is an INTERNAL, non-tradable participation/reward accounting unit.
  // No crypto issuance, no blockchain, no external transfer, no redemption.
  // The ledger is append-only and idempotent; balances are always reconstruct-
  // ible by summing entries. Users can NEVER mint arbitrary credits: credits are
  // only produced by (a) server-verified challenge completion or (b) an
  // owner/admin compensating adjustment, both audited and idempotent.

  const CHALLENGE_STATUS = ["draft", "published", "closed", "archived"];
  const CHALLENGE_TRANSITIONS = {
    draft: ["published"],
    published: ["closed"],
    closed: ["archived"],
    archived: [],
  };
  const REWARD_RULE_STATUS = ["active", "inactive"];
  const KNOWN_ROLES = ["owner", "admin", "manager", "member", "viewer"];
  const isNonNegInt = (value) => Number.isSafeInteger(value) && value >= 0;
  const isPosInt = (value) => Number.isSafeInteger(value) && value > 0;
  const isDateTime = (value) => typeof value === "string" && !Number.isNaN(Date.parse(value));
  const parseRoles = (raw) => {
    if (!raw) return [];
    try {
      const value = JSON.parse(raw);
      return Array.isArray(value) ? value.filter((role) => KNOWN_ROLES.includes(role)) : [];
    } catch {
      return [];
    }
  };

  const rewardRuleView = (row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    ecoCoinAmount: row.eco_coin_amount,
    issuanceLimit: row.issuance_limit ?? null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });

  const participationView = (row) => ({
    id: row.id,
    challengeId: row.challenge_id,
    userId: row.user_id,
    status: row.status,
    verification: row.verification ?? null,
    rewardIssued: row.reward_issued === 1,
    joinedAt: row.joined_at,
    completedAt: row.completed_at ?? null,
    verifiedAt: row.verified_at ?? null,
  });

  const ledgerView = (row) => ({
    id: row.id,
    userId: row.user_id,
    entryType: row.entry_type,
    amount: row.amount,
    reason: row.reason,
    source: row.source,
    reference: row.reference,
    challengeId: row.challenge_id ?? null,
    participationId: row.participation_id ?? null,
    rewardRuleId: row.reward_rule_id ?? null,
    at: row.created_at,
  });

  const adjustmentRequestView = (row) => ({
    id: row.id,
    orgId: row.org_id,
    requestedBy: row.requested_by,
    targetUserId: row.target_user_id,
    entryType: row.entry_type,
    amount: row.amount,
    reason: row.reason,
    status: row.status,
    approverId: row.approver_id ?? null,
    decisionNote: row.decision_note ?? null,
    decidedAt: row.decided_at ?? null,
    executedAt: row.executed_at ?? null,
    executionReference: row.execution_reference ?? null,
    createdAt: row.created_at,
  });

  const challengeView = (row, extra = {}) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    status: row.status,
    eligibility: row.eligibility,
    eligibleRoles: parseRoles(row.eligible_roles),
    completionCriteria: row.completion_criteria,
    verificationMethod: row.verification_method,
    rewardRuleId: row.reward_rule_id ?? null,
    startAt: row.start_at ?? null,
    endAt: row.end_at ?? null,
    maxParticipants: row.max_participants ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ...extra,
  });

  // Idempotent credit. The UNIQUE(org_id, reference) constraint makes a repeated
  // call a no-op that returns the original entry (duplicate: true). Never trusts
  // a client-supplied amount for the balance: amount is validated by the caller.
  const creditEcoCoin = ({ orgId, userId, amount, reason, source, reference, actorId, challengeId, participationId, rewardRuleId }) => {
    const id = newId("eco");
    const info = db
      .prepare(
        `INSERT OR IGNORE INTO eco_coin_ledger
           (id, org_id, user_id, entry_type, amount, reason, source, reference, challenge_id, participation_id, reward_rule_id, created_at)
         VALUES (?, ?, ?, 'credit', ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(id, orgId, userId, amount, reason, source, reference, challengeId ?? null, participationId ?? null, rewardRuleId ?? null, now());
    if (info.changes > 0) {
      audit(db, { orgId, actorId: actorId ?? null, action: "ecocoin.credit", entity: "eco_coin_ledger", entityId: id, detail: { amount, source, reference } });
      return { entry: db.prepare("SELECT * FROM eco_coin_ledger WHERE id = ?").get(id), duplicate: false };
    }
    return { entry: db.prepare("SELECT * FROM eco_coin_ledger WHERE org_id = ? AND reference = ?").get(orgId, reference), duplicate: true };
  };

  // Owner/admin compensating adjustment (correction path). Debits are allowed so
  // a mistaken credit can be reversed without rewriting history.
  route("POST", /^\/v1\/ecocoin\/adjustments$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) {
      return fail(res, 403, "forbidden", "Only owner or admin can post EcoCoin adjustments.");
    }
    const body = await readJson(req);
    const userId = str(body.userId, 80);
    const target = db.prepare("SELECT id FROM users WHERE id = ?").get(userId);
    if (!target) return fail(res, 404, "not_found", "User not found.");
    const amount = Number(body.amount);
    if (!isPosInt(amount)) return fail(res, 422, "invalid_amount", "amount must be a positive integer of EcoCoin units.");
    const entryType = str(body.entryType, 16);
    if (!["credit", "debit"].includes(entryType)) return fail(res, 422, "invalid_entry_type", "entryType must be 'credit' or 'debit'.");
    const reason = str(body.reason, 300);
    if (reason.length < 2) return fail(res, 422, "invalid_reason", "A reason is required for an adjustment.");

    const reference = `adjustment:${newId("adj")}`;
    if (entryType === "credit") {
      const { entry, duplicate } = creditEcoCoin({ orgId: scope.orgId, userId, amount, reason, source: "admin_adjustment", reference, actorId: ctx.user.id });
      return json(res, duplicate ? 200 : 201, { entry: ledgerView(entry), duplicate });
    }
    const id = newId("eco");
    const info = db
      .prepare(
        `INSERT OR IGNORE INTO eco_coin_ledger
           (id, org_id, user_id, entry_type, amount, reason, source, reference, created_at)
         VALUES (?, ?, ?, 'debit', ?, ?, 'admin_adjustment', ?, ?)`,
      )
      .run(id, scope.orgId, userId, amount, reason, reference, now());
    if (info.changes > 0) audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.debit", entity: "eco_coin_ledger", entityId: id, detail: { amount, source: "admin_adjustment", reference } });
    const entry = db.prepare("SELECT * FROM eco_coin_ledger WHERE org_id = ? AND reference = ?").get(scope.orgId, reference);
    return json(res, info.changes > 0 ? 201 : 200, { entry: ledgerView(entry), duplicate: info.changes === 0 });
  }, { auth: true });

  // Reward-rule management (admin config). Amounts/limits are configuration, not
  // an economic decision: they are inert until a challenge references them.
  route("GET", /^\/v1\/rewards\/rules$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM reward_rules WHERE org_id = ? ORDER BY created_at DESC").all(scope.orgId);
    return json(res, 200, { items: rows.map(rewardRuleView), nextCursor: null, total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/rewards\/rules$/u, async (req, res, ctx) => {
    const body = await readJson(req);
    const orgId = str(body.organizationId) || membershipsOf(ctx.user.id)[0]?.org_id;
    const membership = orgId ? membershipOf(ctx.user.id, orgId) : null;
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot create reward rules.");

    const code = str(body.code, 80);
    const title = str(body.title, 160);
    if (code.length < 2) return fail(res, 422, "invalid_code", "A reward-rule code is required.");
    if (title.length < 2) return fail(res, 422, "invalid_title", "A reward-rule title is required.");
    const amount = body.ecoCoinAmount == null ? 0 : Number(body.ecoCoinAmount);
    if (!isNonNegInt(amount)) return fail(res, 422, "invalid_amount", "ecoCoinAmount must be a non-negative integer.");
    let limit = null;
    if (body.issuanceLimit != null && body.issuanceLimit !== "") {
      limit = Number(body.issuanceLimit);
      if (!isNonNegInt(limit)) return fail(res, 422, "invalid_limit", "issuanceLimit must be a non-negative integer.");
    }
    if (db.prepare("SELECT id FROM reward_rules WHERE org_id = ? AND code = ?").get(orgId, code)) {
      return fail(res, 409, "code_taken", "A reward rule with this code already exists.");
    }
    const id = newId("rule");
    const at = now();
    db.prepare(
      "INSERT INTO reward_rules (id, org_id, code, title, description, eco_coin_amount, issuance_limit, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)",
    ).run(id, orgId, code, title, str(body.description, 1000), amount, limit, at, at);
    audit(db, { orgId, actorId: ctx.user.id, action: "rewardRule.create", entity: "reward_rules", entityId: id });
    return json(res, 201, rewardRuleView(db.prepare("SELECT * FROM reward_rules WHERE id = ?").get(id)));
  }, { auth: true });

  route("PATCH", /^\/v1\/rewards\/rules\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot update reward rules.");
    const row = db.prepare("SELECT * FROM reward_rules WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Reward rule not found.");
    const body = await readJson(req);
    const patch = {};
    if (body.title != null) {
      const title = str(body.title, 160);
      if (title.length < 2) return fail(res, 422, "invalid_title", "A title is required.");
      patch.title = title;
    }
    if (body.description != null) patch.description = str(body.description, 1000);
    if (body.ecoCoinAmount != null) {
      const amount = Number(body.ecoCoinAmount);
      if (!isNonNegInt(amount)) return fail(res, 422, "invalid_amount", "ecoCoinAmount must be a non-negative integer.");
      patch.ecoCoinAmount = amount;
    }
    if (body.issuanceLimit !== undefined) {
      const limit = body.issuanceLimit == null || body.issuanceLimit === "" ? null : Number(body.issuanceLimit);
      if (limit !== null && !isNonNegInt(limit)) return fail(res, 422, "invalid_limit", "issuanceLimit must be a non-negative integer.");
      patch.issuanceLimit = limit;
    }
    if (body.status != null) {
      if (!REWARD_RULE_STATUS.includes(str(body.status, 16))) return fail(res, 422, "invalid_status", "Unknown reward-rule status.");
      patch.status = str(body.status, 16);
    }
    db.prepare("UPDATE reward_rules SET title = ?, description = ?, eco_coin_amount = ?, issuance_limit = ?, status = ?, updated_at = ? WHERE id = ?").run(
      patch.title ?? row.title,
      patch.description ?? row.description,
      patch.ecoCoinAmount ?? row.eco_coin_amount,
      patch.issuanceLimit !== undefined ? patch.issuanceLimit : row.issuance_limit,
      patch.status ?? row.status,
      now(),
      row.id,
    );
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "rewardRule.update", entity: "reward_rules", entityId: row.id });
    return json(res, 200, rewardRuleView(db.prepare("SELECT * FROM reward_rules WHERE id = ?").get(row.id)));
  }, { auth: true });

  // EcoCoin ledger + balances. The ledger is read-only over the API; corrections
  // go through POST /v1/ecocoin/adjustments (compensating entries).
  route("GET", /^\/v1\/ecocoin\/ledger$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot read the organization ledger.");
    const rows = db.prepare("SELECT * FROM eco_coin_ledger WHERE org_id = ? ORDER BY created_at DESC, id DESC LIMIT 500").all(scope.orgId);
    return json(res, 200, { items: rows.map(ledgerView), nextCursor: null, total: rows.length });
  }, { auth: true });

  route("GET", /^\/v1\/ecocoin\/summary$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT entry_type, amount, source FROM eco_coin_ledger WHERE org_id = ? AND user_id = ?").all(scope.orgId, ctx.user.id);
    let balance = 0;
    let credits = 0;
    let debits = 0;
    const bySource = {};
    for (const row of rows) {
      if (row.entry_type === "credit") {
        balance += row.amount;
        credits += row.amount;
      } else {
        balance -= row.amount;
        debits += row.amount;
      }
      bySource[row.source] = (bySource[row.source] ?? 0) + (row.entry_type === "credit" ? row.amount : -row.amount);
    }
    return json(res, 200, { balance, totalCredits: credits, totalDebits: debits, entryCount: rows.length, bySource });
  }, { auth: true });

  route("GET", /^\/v1\/ecocoin\/balance$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const requested = str(url.searchParams.get("userId") ?? "", 80) || ctx.user.id;
    if (requested !== ctx.user.id && !requireWrite(scope.membership)) {
      return fail(res, 403, "forbidden", "Your role cannot read another member's balance.");
    }
    const row = db
      .prepare("SELECT COALESCE(SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END), 0) AS balance FROM eco_coin_ledger WHERE org_id = ? AND user_id = ?")
      .get(scope.orgId, requested);
    return json(res, 200, { userId: requested, balance: row.balance });
  }, { auth: true });

  // Reconciliation: recompute every member's balance from the immutable ledger
  // and report totals + any anomaly (e.g. a negative balance). Read-only.
  route("GET", /^\/v1\/ecocoin\/reconcile$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can reconcile the ledger.");
    const rows = db
      .prepare("SELECT user_id, SUM(CASE WHEN entry_type = 'credit' THEN amount ELSE -amount END) AS balance, COUNT(*) AS entries FROM eco_coin_ledger WHERE org_id = ? GROUP BY user_id")
      .all(scope.orgId);
    const balances = rows.map((row) => ({ userId: row.user_id, balance: row.balance, entries: row.entries }));
    const anomalies = balances.filter((item) => item.balance < 0).map((item) => item.userId);
    const total = balances.reduce((sum, item) => sum + item.balance, 0);
    const entryCount = balances.reduce((sum, item) => sum + item.entries, 0);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "ecocoin.reconcile", entity: "eco_coin_ledger", entityId: scope.orgId, detail: { members: balances.length, entries: entryCount, anomalies: anomalies.length } });
    return json(res, 200, { totalBalance: total, entryCount, memberCount: balances.length, balances, anomalies });
  }, { auth: true });

  // Challenge catalogue + lifecycle + participation.
  route("GET", /^\/v1\/challenges$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM challenges WHERE org_id = ? ORDER BY created_at DESC").all(scope.orgId);
    const mine = db
      .prepare("SELECT challenge_id, status FROM challenge_participations WHERE org_id = ? AND user_id = ?")
      .all(scope.orgId, ctx.user.id);
    const mineByChallenge = new Map(mine.map((row) => [row.challenge_id, row.status]));
    const counts = db
      .prepare("SELECT challenge_id, COUNT(*) AS n FROM challenge_participations WHERE org_id = ? AND status != 'cancelled' GROUP BY challenge_id")
      .all(scope.orgId);
    const countByChallenge = new Map(counts.map((row) => [row.challenge_id, row.n]));
    const items = rows.map((row) =>
      challengeView(row, {
        participantCount: countByChallenge.get(row.id) ?? 0,
        myParticipation: mineByChallenge.get(row.id) ?? null,
      }),
    );
    return json(res, 200, { items, nextCursor: null, total: items.length });
  }, { auth: true });

  route("POST", /^\/v1\/challenges$/u, async (req, res, ctx) => {
    const body = await readJson(req);
    const orgId = str(body.organizationId) || membershipsOf(ctx.user.id)[0]?.org_id;
    const membership = orgId ? membershipOf(ctx.user.id, orgId) : null;
    if (!membership) return fail(res, 404, "not_found", "Organization not found.");
    if (!requireWrite(membership)) return fail(res, 403, "forbidden", "Your role cannot create challenges.");

    const code = str(body.code, 80);
    const title = str(body.title, 180);
    if (code.length < 2) return fail(res, 422, "invalid_code", "A challenge code is required.");
    if (title.length < 2) return fail(res, 422, "invalid_title", "A challenge title is required.");
    let rewardRuleId = str(body.rewardRuleId, 80) || null;
    if (rewardRuleId) {
      const rule = db.prepare("SELECT id FROM reward_rules WHERE id = ? AND org_id = ?").get(rewardRuleId, orgId);
      if (!rule) return fail(res, 404, "not_found", "Reward rule not found.");
    }
    const startAt = str(body.startAt, 40) || null;
    const endAt = str(body.endAt, 40) || null;
    if (startAt && !isDateTime(startAt)) return fail(res, 422, "invalid_start", "startAt must be a valid date/time.");
    if (endAt && !isDateTime(endAt)) return fail(res, 422, "invalid_end", "endAt must be a valid date/time.");
    if (startAt && endAt && Date.parse(endAt) <= Date.parse(startAt)) return fail(res, 422, "invalid_window", "endAt must be after startAt.");
    let maxParticipants = null;
    if (body.maxParticipants != null && body.maxParticipants !== "") {
      maxParticipants = Number(body.maxParticipants);
      if (!isPosInt(maxParticipants)) return fail(res, 422, "invalid_max", "maxParticipants must be a positive integer.");
    }
    if (db.prepare("SELECT id FROM challenges WHERE org_id = ? AND code = ?").get(orgId, code)) {
      return fail(res, 409, "code_taken", "A challenge with this code already exists.");
    }
    let eligibleRoles = [];
    if (body.eligibleRoles != null) {
      if (!Array.isArray(body.eligibleRoles)) return fail(res, 422, "invalid_eligible_roles", "eligibleRoles must be an array of roles.");
      eligibleRoles = body.eligibleRoles.map((role) => str(role, 16)).filter(Boolean);
      if (eligibleRoles.some((role) => !KNOWN_ROLES.includes(role))) {
        return fail(res, 422, "invalid_eligible_roles", "eligibleRoles contains an unknown role.");
      }
    }
    const id = newId("chl");
    const at = now();
    db.prepare(
      `INSERT INTO challenges
         (id, org_id, code, title, description, status, eligibility, eligible_roles, completion_criteria, verification_method, reward_rule_id, start_at, end_at, max_participants, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      orgId,
      code,
      title,
      str(body.description, 2000),
      str(body.eligibility, 500),
      eligibleRoles.length > 0 ? JSON.stringify(eligibleRoles) : null,
      str(body.completionCriteria, 1000),
      str(body.verificationMethod, 40) || "admin_attestation",
      rewardRuleId,
      startAt,
      endAt,
      maxParticipants,
      at,
      at,
    );
    audit(db, { orgId, actorId: ctx.user.id, action: "challenge.create", entity: "challenges", entityId: id });
    return json(res, 201, challengeView(db.prepare("SELECT * FROM challenges WHERE id = ?").get(id), { participantCount: 0, myParticipation: null }));
  }, { auth: true });

  route("GET", /^\/v1\/challenges\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Challenge not found.");
    const mine = db.prepare("SELECT status FROM challenge_participations WHERE org_id = ? AND challenge_id = ? AND user_id = ?").get(scope.orgId, row.id, ctx.user.id);
    const count = db.prepare("SELECT COUNT(*) AS n FROM challenge_participations WHERE org_id = ? AND challenge_id = ? AND status != 'cancelled'").get(scope.orgId, row.id);
    return json(res, 200, challengeView(row, { participantCount: count.n, myParticipation: mine?.status ?? null }));
  }, { auth: true });

  route("PATCH", /^\/v1\/challenges\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot update challenges.");
    const row = db.prepare("SELECT * FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Challenge not found.");
    const body = await readJson(req);
    if (Object.prototype.hasOwnProperty.call(body, "status")) {
      return fail(res, 409, "status_is_workflow_owned", "Challenge status changes must use the transition endpoint.");
    }
    const patch = {};
    if (body.title != null) {
      const title = str(body.title, 180);
      if (title.length < 2) return fail(res, 422, "invalid_title", "A title is required.");
      patch.title = title;
    }
    if (body.description != null) patch.description = str(body.description, 2000);
    if (body.eligibility != null) patch.eligibility = str(body.eligibility, 500);
    if (body.completionCriteria != null) patch.completionCriteria = str(body.completionCriteria, 1000);
    if (body.eligibleRoles !== undefined) {
      if (!Array.isArray(body.eligibleRoles)) return fail(res, 422, "invalid_eligible_roles", "eligibleRoles must be an array of roles.");
      const roles = body.eligibleRoles.map((role) => str(role, 16)).filter(Boolean);
      if (roles.some((role) => !KNOWN_ROLES.includes(role))) {
        return fail(res, 422, "invalid_eligible_roles", "eligibleRoles contains an unknown role.");
      }
      patch.eligibleRoles = roles.length > 0 ? JSON.stringify(roles) : null;
    }
    if (body.rewardRuleId !== undefined) {
      const rewardRuleId = str(body.rewardRuleId, 80) || null;
      if (rewardRuleId && !db.prepare("SELECT id FROM reward_rules WHERE id = ? AND org_id = ?").get(rewardRuleId, scope.orgId)) {
        return fail(res, 404, "not_found", "Reward rule not found.");
      }
      patch.rewardRuleId = rewardRuleId;
    }
    db.prepare("UPDATE challenges SET title = ?, description = ?, eligibility = ?, eligible_roles = ?, completion_criteria = ?, reward_rule_id = ?, updated_at = ? WHERE id = ?").run(
      patch.title ?? row.title,
      patch.description ?? row.description,
      patch.eligibility ?? row.eligibility,
      patch.eligibleRoles !== undefined ? patch.eligibleRoles : row.eligible_roles,
      patch.completionCriteria ?? row.completion_criteria,
      patch.rewardRuleId !== undefined ? patch.rewardRuleId : row.reward_rule_id,
      now(),
      row.id,
    );
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.update", entity: "challenges", entityId: row.id });
    return json(res, 200, challengeView(db.prepare("SELECT * FROM challenges WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("POST", /^\/v1\/challenges\/(?<id>[\w-]+)\/transition$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot change challenge status.");
    const row = db.prepare("SELECT * FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Challenge not found.");
    const body = await readJson(req);
    const to = str(body.to, 40);
    const from = String(row.status ?? "draft");
    if (!CHALLENGE_STATUS.includes(to)) return fail(res, 422, "invalid_status", "Unknown challenge status.");
    if (to === from) return json(res, 200, challengeView(row));
    if (!(CHALLENGE_TRANSITIONS[from] ?? []).includes(to)) {
      return fail(res, 409, "invalid_transition", `Cannot move a challenge from ${from} to ${to}.`, { from, to, allowed: CHALLENGE_TRANSITIONS[from] ?? [] });
    }
    // Publishing requires a positive reward rule only if one is attached; a
    // challenge may be published with no reward (participation-only).
    db.prepare("UPDATE challenges SET status = ?, updated_at = ? WHERE id = ?").run(to, now(), row.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.transition", entity: "challenges", entityId: row.id, detail: { from, to } });
    return json(res, 200, challengeView(db.prepare("SELECT * FROM challenges WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("GET", /^\/v1\/challenges\/(?<id>[\w-]+)\/participations$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const challenge = db.prepare("SELECT id FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!challenge) return fail(res, 404, "not_found", "Challenge not found.");
    const rows = db
      .prepare("SELECT * FROM challenge_participations WHERE org_id = ? AND challenge_id = ? ORDER BY joined_at DESC")
      .all(scope.orgId, ctx.params.id);
    return json(res, 200, { items: rows.map(participationView), nextCursor: null, total: rows.length });
  }, { auth: true });

  // Join a published challenge. Duplicate participation is refused; capacity and
  // the participation window are enforced server-side.
  route("POST", /^\/v1\/challenges\/(?<id>[\w-]+)\/participate$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Challenge not found.");
    if (row.status !== "published") return fail(res, 409, "not_open", "This challenge is not open for participation.");
    const eligibleRoles = parseRoles(row.eligible_roles);
    if (eligibleRoles.length > 0 && !eligibleRoles.includes(scope.membership.role)) {
      return fail(res, 403, "not_eligible", "Your role is not eligible for this challenge.");
    }
    const nowMs = Date.now();
    if (row.start_at && Date.parse(row.start_at) > nowMs) return fail(res, 409, "not_started", "This challenge has not started yet.");
    if (row.end_at && Date.parse(row.end_at) < nowMs) return fail(res, 409, "ended", "This challenge has ended.");
    const existing = db.prepare("SELECT id FROM challenge_participations WHERE org_id = ? AND challenge_id = ? AND user_id = ?").get(scope.orgId, row.id, ctx.user.id);
    if (existing) return fail(res, 409, "already_participating", "You are already participating in this challenge.");
    if (row.max_participants != null) {
      const active = db.prepare("SELECT COUNT(*) AS n FROM challenge_participations WHERE org_id = ? AND challenge_id = ? AND status != 'cancelled'").get(scope.orgId, row.id);
      if (active.n >= row.max_participants) return fail(res, 409, "at_capacity", "This challenge has reached its participant limit.");
    }
    const id = newId("ptp");
    db.prepare("INSERT INTO challenge_participations (id, org_id, challenge_id, user_id, status, joined_at) VALUES (?, ?, ?, ?, 'joined', ?)").run(
      id,
      scope.orgId,
      row.id,
      ctx.user.id,
      now(),
    );
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.participate", entity: "challenge_participations", entityId: id, detail: { challengeId: row.id } });
    return json(res, 201, participationView(db.prepare("SELECT * FROM challenge_participations WHERE id = ?").get(id)));
  }, { auth: true });

  // Verify a participation (server-enforced attestation by owner/admin). Only a
  // verified participation issues a reward, idempotently, and only within the
  // reward rule's issuance limit. Re-verifying is a safe no-op.
  route("POST", /^\/v1\/challenges\/(?<id>[\w-]+)\/participations\/(?<pid>[\w-]+)\/verify$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) {
      return fail(res, 403, "forbidden", "Only owner or admin can verify participation.");
    }
    const challenge = db.prepare("SELECT * FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!challenge) return fail(res, 404, "not_found", "Challenge not found.");
    const participation = db
      .prepare("SELECT * FROM challenge_participations WHERE id = ? AND challenge_id = ? AND org_id = ?")
      .get(ctx.params.pid, challenge.id, scope.orgId);
    if (!participation) return fail(res, 404, "not_found", "Participation not found.");
    if (participation.status === "verified") {
      return json(res, 200, { participation: participationView(participation), reward: null, duplicate: true });
    }
    if (participation.status === "cancelled") return fail(res, 409, "cancelled", "A cancelled participation cannot be verified.");

    const body = await readJson(req);
    const verification = str(body.verification, 300) || "admin_attestation";
    const at = now();
    db.prepare("UPDATE challenge_participations SET status = 'verified', verification = ?, completed_at = COALESCE(completed_at, ?), verified_at = ? WHERE id = ?").run(
      verification,
      at,
      at,
      participation.id,
    );

    let reward = null;
    if (challenge.reward_rule_id) {
      const rule = db.prepare("SELECT * FROM reward_rules WHERE id = ? AND org_id = ?").get(challenge.reward_rule_id, scope.orgId);
      if (rule && rule.status === "active" && rule.eco_coin_amount > 0) {
        let withinLimit = true;
        if (rule.issuance_limit != null) {
          const issued = db
            .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM eco_coin_ledger WHERE org_id = ? AND user_id = ? AND reward_rule_id = ? AND source = 'challenge_reward'")
            .get(scope.orgId, participation.user_id, rule.id);
          if (issued.total + rule.eco_coin_amount > rule.issuance_limit) withinLimit = false;
        }
        if (withinLimit) {
          const reference = `challenge-reward:${participation.id}`;
          const { entry, duplicate } = creditEcoCoin({
            orgId: scope.orgId,
            userId: participation.user_id,
            amount: rule.eco_coin_amount,
            reason: `Challenge reward: ${challenge.title}`,
            source: "challenge_reward",
            reference,
            actorId: ctx.user.id,
            challengeId: challenge.id,
            participationId: participation.id,
            rewardRuleId: rule.id,
          });
          if (!duplicate) {
            db.prepare("UPDATE challenge_participations SET reward_issued = 1 WHERE id = ?").run(participation.id);
          }
          reward = { entry: ledgerView(entry), duplicate };
        } else {
          reward = { entry: null, duplicate: false, limitReached: true };
        }
      }
    }
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.verify", entity: "challenge_participations", entityId: participation.id, detail: { challengeId: challenge.id, rewardIssued: reward?.entry ? true : false } });
    return json(res, 200, { participation: participationView(db.prepare("SELECT * FROM challenge_participations WHERE id = ?").get(participation.id)), reward });
  }, { auth: true });
  // Phase 3.66 — evidence submission + reviewer decision (approve/reject).
  // Approve issues the configured reward idempotently; reject issues nothing.
  const evidenceView = (row) => ({
    id: row.id,
    challengeId: row.challenge_id,
    participationId: row.participation_id,
    userId: row.user_id,
    evidenceType: row.evidence_type,
    sourceType: row.source_type,
    sourceId: row.source_id,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
  });

  route("POST", /^\/v1\/challenges\/(?<id>[\w-]+)\/participations\/(?<pid>[\w-]+)\/evidence$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const challenge = db.prepare("SELECT id FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!challenge) return fail(res, 404, "not_found", "Challenge not found.");
    const participation = db
      .prepare("SELECT * FROM challenge_participations WHERE id = ? AND challenge_id = ? AND org_id = ?")
      .get(ctx.params.pid, challenge.id, scope.orgId);
    if (!participation) return fail(res, 404, "not_found", "Participation not found.");
    if (participation.user_id !== ctx.user.id) return fail(res, 403, "forbidden", "You can only submit evidence for your own participation.");
    if (["approved", "rejected", "verified"].includes(participation.status)) return fail(res, 409, "already_reviewed", "This participation has already been reviewed.");
    const body = await readJson(req);
    const evidenceType = str(body.evidenceType, 40);
    if (evidenceType.length < 2) return fail(res, 422, "invalid_evidence_type", "evidenceType is required.");
    const description = str(body.description, 500);
    if (description.length < 2) return fail(res, 422, "invalid_description", "A description is required.");
    const sourceType = str(body.sourceType, 40) || null;
    const sourceId = str(body.sourceId, 80) || null;
    if (sourceType && !RESOURCE_TYPES.has(sourceType)) return fail(res, 422, "invalid_source_type", "Unknown source resource type.");
    if (sourceType && sourceId) {
      const src = db.prepare("SELECT id FROM resources WHERE org_id = ? AND type = ? AND id = ?").get(scope.orgId, sourceType, sourceId);
      if (!src) return fail(res, 404, "source_not_found", "Source resource not found in this organization.");
    }
    const id = newId("evd");
    const info = db
      .prepare(
        `INSERT OR IGNORE INTO challenge_evidence
           (id, org_id, challenge_id, participation_id, user_id, evidence_type, source_type, source_id, description, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
      )
      .run(id, scope.orgId, challenge.id, participation.id, ctx.user.id, evidenceType, sourceType, sourceId, description, now());
    if (info.changes === 0) return fail(res, 409, "already_submitted", "Evidence has already been submitted for this participation.");
    db.prepare("UPDATE challenge_participations SET status = 'submitted' WHERE id = ? AND status = 'joined'").run(participation.id);
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.evidence.submit", entity: "challenge_evidence", entityId: id, detail: { challengeId: challenge.id, participationId: participation.id, sourceType, sourceId } });
    return json(res, 201, evidenceView(db.prepare("SELECT * FROM challenge_evidence WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/challenges\/(?<id>[\w-]+)\/participations\/(?<pid>[\w-]+)\/evidence$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM challenge_evidence WHERE org_id = ? AND challenge_id = ? AND participation_id = ?").get(scope.orgId, ctx.params.id, ctx.params.pid);
    if (!row) return fail(res, 404, "not_found", "Evidence not found.");
    return json(res, 200, evidenceView(row));
  }, { auth: true });

  route("POST", /^\/v1\/challenges\/(?<id>[\w-]+)\/participations\/(?<pid>[\w-]+)\/review$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can review submissions.");
    const challenge = db.prepare("SELECT * FROM challenges WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!challenge) return fail(res, 404, "not_found", "Challenge not found.");
    const participation = db
      .prepare("SELECT * FROM challenge_participations WHERE id = ? AND challenge_id = ? AND org_id = ?")
      .get(ctx.params.pid, challenge.id, scope.orgId);
    if (!participation) return fail(res, 404, "not_found", "Participation not found.");
    const body = await readJson(req);
    const decision = str(body.decision, 16);
    if (!["approve", "reject"].includes(decision)) return fail(res, 422, "invalid_decision", "decision must be 'approve' or 'reject'.");
    // Idempotent: a reviewed participation returns its current state, no new reward.
    if (["approved", "rejected"].includes(participation.status)) {
      return json(res, 200, { participation: participationView(participation), reward: null, duplicate: true });
    }
    if (participation.status === "cancelled") return fail(res, 409, "cancelled", "A cancelled participation cannot be reviewed.");
    const at = now();
    if (decision === "reject") {
      db.prepare("UPDATE challenge_participations SET status = 'rejected', verification = ?, verified_at = ? WHERE id = ?").run("rejected", at, participation.id);
      audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.review.reject", entity: "challenge_participations", entityId: participation.id, detail: { challengeId: challenge.id } });
      return json(res, 200, { participation: participationView(db.prepare("SELECT * FROM challenge_participations WHERE id = ?").get(participation.id)), reward: null });
    }
    // Approve requires submitted evidence.
    const evidence = db.prepare("SELECT id FROM challenge_evidence WHERE org_id = ? AND participation_id = ?").get(scope.orgId, participation.id);
    if (!evidence) return fail(res, 409, "no_evidence", "Evidence must be submitted before approval.");
    db.prepare("UPDATE challenge_participations SET status = 'approved', verification = ?, completed_at = COALESCE(completed_at, ?), verified_at = ? WHERE id = ?").run("approved", at, at, participation.id);
    let reward = null;
    if (challenge.reward_rule_id) {
      const rule = db.prepare("SELECT * FROM reward_rules WHERE id = ? AND org_id = ?").get(challenge.reward_rule_id, scope.orgId);
      if (rule && rule.status === "active" && rule.eco_coin_amount > 0) {
        let withinLimit = true;
        if (rule.issuance_limit != null) {
          const issued = db
            .prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM eco_coin_ledger WHERE org_id = ? AND user_id = ? AND reward_rule_id = ? AND source = 'challenge_reward'")
            .get(scope.orgId, participation.user_id, rule.id);
          if (issued.total + rule.eco_coin_amount > rule.issuance_limit) withinLimit = false;
        }
        if (withinLimit) {
          const { entry, duplicate } = creditEcoCoin({
            orgId: scope.orgId,
            userId: participation.user_id,
            amount: rule.eco_coin_amount,
            reason: `Challenge reward: ${challenge.title}`,
            source: "challenge_reward",
            reference: `challenge-reward:${participation.id}`,
            actorId: ctx.user.id,
            challengeId: challenge.id,
            participationId: participation.id,
            rewardRuleId: rule.id,
          });
          if (!duplicate) db.prepare("UPDATE challenge_participations SET reward_issued = 1 WHERE id = ?").run(participation.id);
          reward = { entry: ledgerView(entry), duplicate };
        } else {
          reward = { entry: null, duplicate: false, limitReached: true };
        }
      }
    }
    audit(db, { orgId: scope.orgId, actorId: ctx.user.id, action: "challenge.review.approve", entity: "challenge_participations", entityId: participation.id, detail: { challengeId: challenge.id, rewardIssued: reward?.entry ? true : false } });
    return json(res, 200, { participation: participationView(db.prepare("SELECT * FROM challenge_participations WHERE id = ?").get(participation.id)), reward });
  }, { auth: true });

  // Phase 3.69 — agricultural tasks: plan → assign → schedule → execute → complete → verify.
  const AGRI_CATEGORIES = ["land_prep", "planting", "irrigation", "fertilization", "weed", "pest", "disease", "harvest", "maintenance", "inspection", "restoration", "livestock", "general"];
  const AGRI_PRIORITIES = ["low", "normal", "high", "urgent"];
  const TASK_TRANSITIONS = {
    draft: ["planned", "cancelled"],
    planned: ["assigned", "in_progress", "cancelled"],
    assigned: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: ["verified"],
    verified: [],
    cancelled: [],
  };
  const taskView = (r) => ({
    id: r.id, orgId: r.org_id, farmId: r.farm_id, cropCycleId: r.crop_cycle_id, projectId: r.project_id,
    title: r.title, description: r.description, category: r.category, priority: r.priority, status: r.status,
    assigneeId: r.assignee_id, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at,
    plannedStart: r.planned_start, dueAt: r.due_at, completedAt: r.completed_at, completedBy: r.completed_by,
    completionNote: r.completion_note, verifiedAt: r.verified_at, verifiedBy: r.verified_by, cancelledAt: r.cancelled_at,
  });
  const taskEvent = (orgId, taskId, type, actorId, detail) =>
    db.prepare("INSERT INTO agri_task_events (id, org_id, task_id, type, actor_id, at, detail) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(newId("tkev"), orgId, taskId, type, actorId ?? null, now(), detail ? JSON.stringify(detail) : null);

  const validateTaskRefs = (orgId, body) => {
    const farmId = str(body.farmId, 80);
    const farm = db.prepare("SELECT id FROM resources WHERE org_id = ? AND type = 'farms' AND id = ?").get(orgId, farmId);
    if (!farm) return { error: ["farm_not_found", "Farm not found in this organization."] };
    const cropCycleId = str(body.cropCycleId, 80) || null;
    if (cropCycleId) {
      const cc = db.prepare("SELECT data FROM resources WHERE org_id = ? AND type = 'cropCycles' AND id = ?").get(orgId, cropCycleId);
      if (!cc) return { error: ["crop_cycle_not_found", "Crop cycle not found."] };
      let data = {}; try { data = JSON.parse(cc.data); } catch { data = {}; }
      if (data.farmId && String(data.farmId) !== String(farmId)) return { error: ["crop_cycle_farm_mismatch", "Crop cycle belongs to a different farm."] };
    }
    const projectId = str(body.projectId, 80) || null;
    if (projectId) {
      const pj = db.prepare("SELECT data FROM resources WHERE org_id = ? AND type = 'projects' AND id = ?").get(orgId, projectId);
      if (!pj) return { error: ["project_not_found", "Project not found."] };
      let data = {}; try { data = JSON.parse(pj.data); } catch { data = {}; }
      if (data.farmId && String(data.farmId) !== String(farmId)) return { error: ["project_farm_mismatch", "Project belongs to a different farm."] };
    }
    const assigneeId = str(body.assigneeId, 80) || null;
    if (assigneeId && !membershipOf(assigneeId, orgId)) return { error: ["invalid_assignee", "Assignee is not a member of this organization."] };
    return { farmId, cropCycleId, projectId, assigneeId };
  };

  route("GET", /^\/v1\/agri\/tasks$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const where = ["org_id = ?"];
    const params = [scope.orgId];
    for (const [k, col] of [["farmId", "farm_id"], ["cropCycleId", "crop_cycle_id"], ["status", "status"], ["category", "category"], ["priority", "priority"], ["assigneeId", "assignee_id"]]) {
      const v = url.searchParams.get(k);
      if (v === "__none__" && col === "assignee_id") { where.push("assignee_id IS NULL"); continue; }
      if (v === "__me__" && col === "assignee_id") { where.push("assignee_id = ?"); params.push(ctx.user.id); continue; }
      if (v) { where.push(`${col} = ?`); params.push(v); }
    }
    const q = str(url.searchParams.get("q") ?? "", 120);
    if (q) { where.push("(title LIKE ? OR description LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    const dueFrom = str(url.searchParams.get("dueFrom") ?? "", 40);
    const dueTo = str(url.searchParams.get("dueTo") ?? "", 40);
    if (dueFrom) { where.push("due_at >= ?"); params.push(dueFrom); }
    if (dueTo) { where.push("due_at <= ?"); params.push(dueTo); }
    const startFrom = str(url.searchParams.get("startFrom") ?? "", 40);
    const startTo = str(url.searchParams.get("startTo") ?? "", 40);
    if (startFrom) { where.push("planned_start >= ?"); params.push(startFrom); }
    if (startTo) { where.push("planned_start <= ?"); params.push(startTo); }
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
    // Stable order with id tiebreak; offset cursor (base64 of offset) for simple bounded paging.
    const total = db.prepare(`SELECT COUNT(*) AS n FROM agri_tasks WHERE ${where.join(" AND ")}`).get(...params).n;
    let offset = 0;
    const cursor = url.searchParams.get("cursor");
    if (cursor) { try { offset = Math.max(0, Number(Buffer.from(cursor, "base64").toString("utf8")) || 0); } catch { offset = 0; } }
    const rows = db.prepare(`SELECT * FROM agri_tasks WHERE ${where.join(" AND ")} ORDER BY (due_at IS NULL), due_at ASC, created_at DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const nextOffset = offset + rows.length;
    const nextCursor = nextOffset < total ? Buffer.from(String(nextOffset)).toString("base64") : null;
    return json(res, 200, { items: rows.map(taskView), total, nextCursor, limit });
  }, { auth: true });

  route("POST", /^\/v1\/agri\/tasks$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot create tasks.");
    const body = await readJson(req);
    const title = str(body.title, 200);
    if (title.length < 2) return fail(res, 422, "invalid_title", "A title is required.");
    const category = str(body.category, 40);
    if (!AGRI_CATEGORIES.includes(category)) return fail(res, 422, "invalid_category", "Unknown task category.");
    const priority = str(body.priority, 16) || "normal";
    if (!AGRI_PRIORITIES.includes(priority)) return fail(res, 422, "invalid_priority", "Unknown priority.");
    const refs = validateTaskRefs(scope.orgId, body);
    if (refs.error) return fail(res, 422, refs.error[0], refs.error[1]);
    const plannedStart = str(body.plannedStart, 40) || null;
    const dueAt = str(body.dueAt, 40) || null;
    if (plannedStart && dueAt && Date.parse(plannedStart) > Date.parse(dueAt)) return fail(res, 422, "invalid_dates", "Planned start is after the due date.");
    const id = newId("task");
    const at = now();
    const status = refs.assigneeId ? "assigned" : "planned";
    db.prepare(
      `INSERT INTO agri_tasks (id, org_id, farm_id, crop_cycle_id, project_id, title, description, category, priority, status, assignee_id, created_by, created_at, updated_at, planned_start, due_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(id, scope.orgId, refs.farmId, refs.cropCycleId, refs.projectId, title, str(body.description, 500), category, priority, status, refs.assigneeId, ctx.user.id, at, at, plannedStart, dueAt);
    taskEvent(scope.orgId, id, "created", ctx.user.id, { status });
    if (refs.assigneeId) taskEvent(scope.orgId, id, "assigned", ctx.user.id, { assigneeId: refs.assigneeId });
    return json(res, 201, taskView(db.prepare("SELECT * FROM agri_tasks WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/agri\/tasks\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM agri_tasks WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Task not found.");
    return json(res, 200, taskView(row));
  }, { auth: true });

  route("GET", /^\/v1\/agri\/tasks\/(?<id>[\w-]+)\/events$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM agri_task_events WHERE org_id = ? AND task_id = ? ORDER BY at ASC").all(scope.orgId, ctx.params.id);
    return json(res, 200, { items: rows.map((e) => ({ id: e.id, type: e.type, actorId: e.actor_id, at: e.at, detail: e.detail ? JSON.parse(e.detail) : null })) });
  }, { auth: true });

  route("PATCH", /^\/v1\/agri\/tasks\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot edit tasks.");
    const row = db.prepare("SELECT * FROM agri_tasks WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Task not found.");
    if (!["draft", "planned", "assigned"].includes(row.status)) return fail(res, 409, "not_editable", "Only draft/planned/assigned tasks can be edited.");
    const body = await readJson(req);
    const patch = { title: row.title, description: row.description, category: row.category, priority: row.priority, planned_start: row.planned_start, due_at: row.due_at };
    if (body.title != null) { const t = str(body.title, 200); if (t.length < 2) return fail(res, 422, "invalid_title", "A title is required."); patch.title = t; }
    if (body.description != null) patch.description = str(body.description, 500);
    if (body.category != null) { if (!AGRI_CATEGORIES.includes(str(body.category, 40))) return fail(res, 422, "invalid_category", "Unknown category."); patch.category = str(body.category, 40); }
    if (body.priority != null) { if (!AGRI_PRIORITIES.includes(str(body.priority, 16))) return fail(res, 422, "invalid_priority", "Unknown priority."); patch.priority = str(body.priority, 16); }
    if (body.plannedStart != null) patch.planned_start = str(body.plannedStart, 40) || null;
    if (body.dueAt != null) patch.due_at = str(body.dueAt, 40) || null;
    if (patch.planned_start && patch.due_at && Date.parse(patch.planned_start) > Date.parse(patch.due_at)) return fail(res, 422, "invalid_dates", "Planned start is after the due date.");
    let assigneeId = row.assignee_id;
    let status = row.status;
    if (body.assigneeId !== undefined) {
      const next = str(body.assigneeId, 80) || null;
      if (next && !membershipOf(next, scope.orgId)) return fail(res, 422, "invalid_assignee", "Assignee is not a member of this organization.");
      assigneeId = next;
      if (next && ["draft", "planned"].includes(status)) status = "assigned";
      if (!next && status === "assigned") status = "planned";
    }
    db.prepare("UPDATE agri_tasks SET title = ?, description = ?, category = ?, priority = ?, planned_start = ?, due_at = ?, assignee_id = ?, status = ?, updated_at = ? WHERE id = ?")
      .run(patch.title, patch.description, patch.category, patch.priority, patch.planned_start, patch.due_at, assigneeId, status, now(), row.id);
    taskEvent(scope.orgId, row.id, "updated", ctx.user.id, null);
    if (assigneeId !== row.assignee_id) taskEvent(scope.orgId, row.id, assigneeId ? "assigned" : "unassigned", ctx.user.id, { assigneeId });
    return json(res, 200, taskView(db.prepare("SELECT * FROM agri_tasks WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("POST", /^\/v1\/agri\/tasks\/(?<id>[\w-]+)\/transition$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot change task status.");
    const row = db.prepare("SELECT * FROM agri_tasks WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Task not found.");
    const body = await readJson(req);
    const to = str(body.to, 24);
    if (to === row.status) return json(res, 200, taskView(row));
    if (!(TASK_TRANSITIONS[row.status] ?? []).includes(to)) return fail(res, 409, "invalid_transition", `Cannot move a task from ${row.status} to ${to}.`, { from: row.status, allowed: TASK_TRANSITIONS[row.status] ?? [] });
    const at = now();
    if (to === "assigned") {
      if (!row.assignee_id) return fail(res, 409, "no_assignee", "Assign the task before moving it to assigned.");
    }
    if (to === "completed") {
      const note = str(body.completionNote, 500);
      db.prepare("UPDATE agri_tasks SET status = 'completed', completed_at = ?, completed_by = ?, completion_note = ?, updated_at = ? WHERE id = ?").run(at, ctx.user.id, note || null, at, row.id);
    } else if (to === "verified") {
      if (!["owner", "admin"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Only owner or admin can verify a task.");
      if (row.completed_by && row.completed_by === ctx.user.id) return fail(res, 403, "separation_of_duties", "The executor cannot verify their own task.");
      db.prepare("UPDATE agri_tasks SET status = 'verified', verified_at = ?, verified_by = ?, updated_at = ? WHERE id = ?").run(at, ctx.user.id, at, row.id);
    } else if (to === "cancelled") {
      db.prepare("UPDATE agri_tasks SET status = 'cancelled', cancelled_at = ?, updated_at = ? WHERE id = ?").run(at, at, row.id);
    } else {
      db.prepare("UPDATE agri_tasks SET status = ?, updated_at = ? WHERE id = ?").run(to, at, row.id);
    }
    taskEvent(scope.orgId, row.id, to, ctx.user.id, { from: row.status });
    return json(res, 200, taskView(db.prepare("SELECT * FROM agri_tasks WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("GET", /^\/v1\/agri\/farms\/(?<id>[\w-]+)\/timeline$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const farmId = ctx.params.id;
    const farm = db.prepare("SELECT id FROM resources WHERE org_id = ? AND type = 'farms' AND id = ?").get(scope.orgId, farmId);
    if (!farm) return fail(res, 404, "not_found", "Farm not found.");
    const type = str(url.searchParams.get("type") ?? "", 24);
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
    let offset = 0;
    const cursor = url.searchParams.get("cursor");
    if (cursor) { try { offset = Math.max(0, Number(Buffer.from(cursor, "base64").toString("utf8")) || 0); } catch { offset = 0; } }
    const events = [];
    const own = (data, field) => { try { const d = JSON.parse(data); return d[field] != null && String(d[field]) === String(farmId); } catch { return false; } };
    const push = (date, t, label, to, recordCreated) => { if (!type || type === t) events.push({ date: date || "", type: t, label, to, recordCreated }); };
    for (const r of db.prepare("SELECT id, data, created_at FROM resources WHERE org_id = ? AND type = 'cropCycles'").all(scope.orgId)) if (own(r.data, "farmId")) push(JSON.parse(r.data).startDate, "cropCycle", JSON.parse(r.data).name ?? r.id, "/platform/agriculture/cycles", !JSON.parse(r.data).startDate);
    for (const r of db.prepare("SELECT id, data, created_at FROM resources WHERE org_id = ? AND type = 'irrigationEvents'").all(scope.orgId)) if (own(r.data, "farmId")) push(JSON.parse(r.data).occurredAt, "irrigation", JSON.parse(r.data).name ?? r.id, "/platform/irrigation", !JSON.parse(r.data).occurredAt);
    for (const r of db.prepare("SELECT id, data, created_at FROM resources WHERE org_id = ? AND type = 'fieldObservations'").all(scope.orgId)) if (own(r.data, "farmId")) push(JSON.parse(r.data).observedAt, "observation", JSON.parse(r.data).name ?? r.id, "/platform/field", !JSON.parse(r.data).observedAt);
    for (const r of db.prepare("SELECT id, data, created_at FROM resources WHERE org_id = ? AND type = 'projects'").all(scope.orgId)) if (own(r.data, "farmId")) push(JSON.parse(r.data).startDate, "project", JSON.parse(r.data).name ?? r.id, `/platform/projects/${r.id}`, !JSON.parse(r.data).startDate);
    for (const tk of db.prepare("SELECT * FROM agri_tasks WHERE org_id = ? AND farm_id = ?").all(scope.orgId, farmId)) push(tk.due_at, "task", tk.title, `/platform/tasks/${tk.id}`, !tk.due_at);
    events.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const total = events.length;
    const items = events.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    const nextCursor = nextOffset < total ? Buffer.from(String(nextOffset)).toString("base64") : null;
    return json(res, 200, { items, total, nextCursor, limit });
  }, { auth: true });

  // Phase 3.72 — community activities & participation.
  const ACT_CATEGORIES = ["restoration", "agriculture", "water", "rangeland", "community", "education", "ecotourism", "environment", "other"];
  const ACT_TRANSITIONS = { draft: ["published", "cancelled"], published: ["in_progress", "cancelled"], in_progress: ["completed", "cancelled"], completed: [], cancelled: [] };
  const PART_TRANSITIONS = { registered: ["confirmed", "cancelled"], confirmed: ["attended", "cancelled"], attended: [], cancelled: [] };
  const actView = (r) => ({
    id: r.id, orgId: r.org_id, communityId: r.community_id, title: r.title, description: r.description,
    category: r.category, status: r.status, priority: r.priority, plannedStart: r.planned_start, plannedEnd: r.planned_end,
    actualStart: r.actual_start, completedAt: r.completed_at, cancelledAt: r.cancelled_at, location: r.location,
    organizerId: r.organizer_id, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at, capacity: r.capacity,
  });
  const actEvent = (orgId, actId, type, actorId, detail) =>
    db.prepare("INSERT INTO activity_events (id, org_id, activity_id, type, actor_id, at, detail) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(newId("aev"), orgId, actId, type, actorId ?? null, now(), detail ? JSON.stringify(detail) : null);
  const partView = (r) => ({ id: r.id, activityId: r.activity_id, userId: r.user_id, status: r.status, registeredAt: r.registered_at, confirmedAt: r.confirmed_at, attendedAt: r.attended_at });

  route("GET", /^\/v1\/community\/activities$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const where = ["org_id = ?"]; const params = [scope.orgId];
    const communityId = url.searchParams.get("communityId"); if (communityId) { where.push("community_id = ?"); params.push(communityId); }
    const status = url.searchParams.get("status"); if (status) { where.push("status = ?"); params.push(status); }
    const category = url.searchParams.get("category"); if (category) { where.push("category = ?"); params.push(category); }
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
    const total = db.prepare(`SELECT COUNT(*) AS n FROM community_activities WHERE ${where.join(" AND ")}`).get(...params).n;
    let offset = 0; const cur = url.searchParams.get("cursor");
    if (cur) { try { offset = Math.max(0, Number(Buffer.from(cur, "base64").toString("utf8")) || 0); } catch { offset = 0; } }
    const rows = db.prepare(`SELECT * FROM community_activities WHERE ${where.join(" AND ")} ORDER BY (planned_start IS NULL), planned_start ASC, created_at DESC, id DESC LIMIT ? OFFSET ?`).all(...params, limit, offset);
    const next = offset + rows.length; const nextCursor = next < total ? Buffer.from(String(next)).toString("base64") : null;
    return json(res, 200, { items: rows.map(actView), total, nextCursor, limit });
  }, { auth: true });

  route("POST", /^\/v1\/community\/activities$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot create activities.");
    const body = await readJson(req);
    const title = str(body.title, 200); if (title.length < 2) return fail(res, 422, "invalid_title", "A title is required.");
    const communityId = str(body.communityId, 80);
    const comm = db.prepare("SELECT id FROM resources WHERE org_id = ? AND type = 'villages' AND id = ?").get(scope.orgId, communityId);
    if (!comm) return fail(res, 404, "community_not_found", "Community not found.");
    const category = str(body.category, 40) || "other"; if (!ACT_CATEGORIES.includes(category)) return fail(res, 422, "invalid_category", "Unknown category.");
    const priority = str(body.priority, 16) || "normal";
    const capacity = body.capacity == null ? null : Number(body.capacity); if (capacity != null && (!Number.isInteger(capacity) || capacity < 0)) return fail(res, 422, "invalid_capacity", "Capacity must be a non-negative integer.");
    const id = newId("act"); const at = now();
    db.prepare(`INSERT INTO community_activities (id, org_id, community_id, title, description, category, status, priority, planned_start, planned_end, location, organizer_id, created_by, created_at, updated_at, capacity)
      VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, scope.orgId, communityId, title, str(body.description, 500), category, priority, str(body.plannedStart, 40) || null, str(body.plannedEnd, 40) || null, str(body.location, 200) || null, str(body.organizerId, 80) || ctx.user.id, ctx.user.id, at, at, capacity);
    actEvent(scope.orgId, id, "created", ctx.user.id, null);
    return json(res, 201, actView(db.prepare("SELECT * FROM community_activities WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/community\/activities\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM community_activities WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Activity not found.");
    return json(res, 200, actView(row));
  }, { auth: true });

  route("PATCH", /^\/v1\/community\/activities\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot edit activities.");
    const row = db.prepare("SELECT * FROM community_activities WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Activity not found.");
    if (!["draft", "published"].includes(row.status)) return fail(res, 409, "not_editable", "Only draft/published activities can be edited.");
    const body = await readJson(req);
    const patch = { title: row.title, description: row.description, category: row.category, priority: row.priority, planned_start: row.planned_start, planned_end: row.planned_end, location: row.location, capacity: row.capacity };
    if (body.title != null) { const t = str(body.title, 200); if (t.length < 2) return fail(res, 422, "invalid_title", "A title is required."); patch.title = t; }
    if (body.description != null) patch.description = str(body.description, 500);
    if (body.category != null) { if (!ACT_CATEGORIES.includes(str(body.category, 40))) return fail(res, 422, "invalid_category", "Unknown category."); patch.category = str(body.category, 40); }
    if (body.priority != null) patch.priority = str(body.priority, 16);
    if (body.plannedStart != null) patch.planned_start = str(body.plannedStart, 40) || null;
    if (body.plannedEnd != null) patch.planned_end = str(body.plannedEnd, 40) || null;
    if (body.location != null) patch.location = str(body.location, 200) || null;
    if (body.capacity !== undefined) patch.capacity = body.capacity == null ? null : Number(body.capacity);
    if (patch.planned_start && patch.planned_end && Date.parse(patch.planned_start) > Date.parse(patch.planned_end)) return fail(res, 422, "invalid_dates", "Planned start is after planned end.");
    db.prepare("UPDATE community_activities SET title = ?, description = ?, category = ?, priority = ?, planned_start = ?, planned_end = ?, location = ?, capacity = ?, updated_at = ? WHERE id = ?")
      .run(patch.title, patch.description, patch.category, patch.priority, patch.planned_start, patch.planned_end, patch.location, patch.capacity, now(), row.id);
    actEvent(scope.orgId, row.id, "updated", ctx.user.id, null);
    return json(res, 200, actView(db.prepare("SELECT * FROM community_activities WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("POST", /^\/v1\/community\/activities\/(?<id>[\w-]+)\/transition$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot change activity status.");
    const row = db.prepare("SELECT * FROM community_activities WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Activity not found.");
    const body = await readJson(req); const to = str(body.to, 24);
    if (to === row.status) return json(res, 200, actView(row));
    if (!(ACT_TRANSITIONS[row.status] ?? []).includes(to)) return fail(res, 409, "invalid_transition", `Cannot move an activity from ${row.status} to ${to}.`);
    const at = now();
    if (to === "published") db.prepare("UPDATE community_activities SET status='published', updated_at=? WHERE id=?").run(at, row.id);
    else if (to === "in_progress") db.prepare("UPDATE community_activities SET status='in_progress', actual_start=?, updated_at=? WHERE id=?").run(at, at, row.id);
    else if (to === "completed") db.prepare("UPDATE community_activities SET status='completed', completed_at=?, updated_at=? WHERE id=?").run(at, at, row.id);
    else if (to === "cancelled") db.prepare("UPDATE community_activities SET status='cancelled', cancelled_at=?, updated_at=? WHERE id=?").run(at, at, row.id);
    actEvent(scope.orgId, row.id, to, ctx.user.id, { from: row.status });
    return json(res, 200, actView(db.prepare("SELECT * FROM community_activities WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("GET", /^\/v1\/community\/activities\/(?<id>[\w-]+)\/participants$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const act = db.prepare("SELECT id FROM community_activities WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!act) return fail(res, 404, "not_found", "Activity not found.");
    const rows = db.prepare("SELECT * FROM activity_participants WHERE org_id = ? AND activity_id = ? ORDER BY registered_at").all(scope.orgId, act.id);
    return json(res, 200, { items: rows.map(partView), total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/community\/activities\/(?<id>[\w-]+)\/participants$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const act = db.prepare("SELECT * FROM community_activities WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!act) return fail(res, 404, "not_found", "Activity not found.");
    if (!["published"].includes(act.status)) return fail(res, 409, "not_open", "Registration is only open for published activities.");
    const body = await readJson(req);
    const isSelf = !body.userId || str(body.userId, 80) === ctx.user.id;
    if (!isSelf && !requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot register others.");
    const userId = isSelf ? ctx.user.id : str(body.userId, 80);
    if (!membershipOf(userId, scope.orgId)) return fail(res, 422, "invalid_participant", "Participant is not a member of this organization.");
    const dup = db.prepare("SELECT id FROM activity_participants WHERE org_id = ? AND activity_id = ? AND user_id = ?").get(scope.orgId, act.id, userId);
    if (dup) return json(res, 200, { ...partView(dup), duplicate: true });
    if (act.capacity != null) {
      const active = db.prepare("SELECT COUNT(*) AS n FROM activity_participants WHERE org_id = ? AND activity_id = ? AND status != 'cancelled'").get(scope.orgId, act.id).n;
      if (active >= act.capacity) return fail(res, 409, "at_capacity", "This activity has reached its capacity.");
    }
    const id = newId("ptp"); const at = now();
    db.prepare("INSERT INTO activity_participants (id, org_id, activity_id, user_id, status, registered_at) VALUES (?, ?, ?, ?, 'registered', ?)").run(id, scope.orgId, act.id, userId, at);
    actEvent(scope.orgId, act.id, "participant.registered", ctx.user.id, { userId });
    return json(res, 201, partView(db.prepare("SELECT * FROM activity_participants WHERE id = ?").get(id)));
  }, { auth: true });

  route("POST", /^\/v1\/community\/activities\/(?<id>[\w-]+)\/participants\/(?<uid>[\w-]+)\/(?<op>confirm|attend|cancel)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot change participation.");
    const p = db.prepare("SELECT * FROM activity_participants WHERE org_id = ? AND activity_id = ? AND user_id = ?").get(scope.orgId, ctx.params.id, ctx.params.uid);
    if (!p) return fail(res, 404, "not_found", "Participation not found.");
    const op = ctx.params.op;
    const target = op === "confirm" ? "confirmed" : op === "attend" ? "attended" : "cancelled";
    if (p.status === target) return json(res, 200, partView(p));
    if (!(PART_TRANSITIONS[p.status] ?? []).includes(target)) return fail(res, 409, "invalid_transition", `Cannot move participation from ${p.status} to ${target}.`);
    const at = now();
    const col = op === "confirm" ? "confirmed_at" : op === "attend" ? "attended_at" : null;
    if (col) db.prepare(`UPDATE activity_participants SET status=?, ${col}=? WHERE id=?`).run(target, at, p.id);
    else db.prepare("UPDATE activity_participants SET status=? WHERE id=?").run(target, p.id);
    actEvent(scope.orgId, ctx.params.id, `participant.${target}`, ctx.user.id, { userId: p.user_id });
    return json(res, 200, partView(db.prepare("SELECT * FROM activity_participants WHERE id = ?").get(p.id)));
  }, { auth: true });

  route("GET", /^\/v1\/community\/activities\/(?<id>[\w-]+)\/events$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM activity_events WHERE org_id = ? AND activity_id = ? ORDER BY at ASC").all(scope.orgId, ctx.params.id);
    return json(res, 200, { items: rows.map((e) => ({ id: e.id, type: e.type, actorId: e.actor_id, at: e.at, detail: e.detail ? JSON.parse(e.detail) : null })) });
  }, { auth: true });

  // Phase 3.73 — agricultural operations intelligence (read-only aggregation).
  route("GET", /^\/v1\/agri\/intelligence$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const orgId = scope.orgId;
    const nowMs = Date.now();
    const day = 86400000;
    const parse = (v) => (v ? Date.parse(v) : NaN);
    const resByType = (type) => db.prepare("SELECT id, data, created_at FROM resources WHERE org_id = ? AND type = ?").all(orgId, type).map((r) => { let d = {}; try { d = JSON.parse(r.data); } catch { d = {}; } return { id: r.id, data: d, created_at: r.created_at }; });

    const farms = resByType("farms");
    const cycles = resByType("cropCycles");
    const irrigation = resByType("irrigationEvents");
    const observations = resByType("fieldObservations");
    const projects = resByType("projects");
    const tasks = db.prepare("SELECT * FROM agri_tasks WHERE org_id = ?").all(orgId);

    const openStatuses = ["draft", "planned", "assigned", "in_progress"];
    const isOpen = (t) => openStatuses.includes(t.status);
    const isOverdue = (t) => !!t.due_at && !["completed", "verified", "cancelled"].includes(t.status) && Date.parse(t.due_at) < nowMs;
    const isDueSoon = (t) => !!t.due_at && !["completed", "verified", "cancelled"].includes(t.status) && Date.parse(t.due_at) >= nowMs && Date.parse(t.due_at) <= nowMs + 7 * day;

    const metrics = {
      farms: farms.length,
      activeCropCycles: cycles.filter((c) => c.data.status === "active").length,
      plannedCropCycles: cycles.filter((c) => c.data.status === "planned").length,
      completedCropCycles: cycles.filter((c) => c.data.status === "completed").length,
      openTasks: tasks.filter(isOpen).length,
      inProgressTasks: tasks.filter((t) => t.status === "in_progress").length,
      overdueTasks: tasks.filter(isOverdue).length,
      dueSoonTasks: tasks.filter(isDueSoon).length,
      completedTasks: tasks.filter((t) => t.status === "completed" || t.status === "verified").length,
      unassignedTasks: tasks.filter((t) => isOpen(t) && !t.assignee_id).length,
      recentIrrigation: irrigation.filter((i) => parse(i.data.occurredAt) >= nowMs - 30 * day).length,
      recentObservations: observations.filter((o) => parse(o.data.observedAt) >= nowMs - 30 * day).length,
      activeProjects: projects.filter((p) => (p.data.status ?? "active") === "active").length,
    };

    const priorities = [];
    for (const t of tasks.filter(isOverdue).slice(0, 10)) priorities.push({ reason: "overdue", severity: "high", label: t.title, date: t.due_at, to: `/platform/tasks/${t.id}` });
    for (const t of tasks.filter(isDueSoon).slice(0, 10)) priorities.push({ reason: "due_soon", severity: "medium", label: t.title, date: t.due_at, to: `/platform/tasks/${t.id}` });
    for (const t of tasks.filter((t) => isOpen(t) && !t.assignee_id).slice(0, 10)) priorities.push({ reason: "unassigned", severity: "low", label: t.title, date: t.due_at, to: `/platform/tasks/${t.id}` });

    const recent = [];
    for (const t of tasks) recent.push({ date: t.updated_at || t.created_at, type: "task", label: t.title, to: `/platform/tasks/${t.id}`, recordCreated: false });
    for (const i of irrigation) if (i.data.occurredAt) recent.push({ date: i.data.occurredAt, type: "irrigation", label: i.data.name ?? i.id, to: "/platform/irrigation", recordCreated: false });
    for (const o of observations) if (o.data.observedAt) recent.push({ date: o.data.observedAt, type: "observation", label: o.data.name ?? o.id, to: "/platform/field", recordCreated: false });
    recent.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

    return json(res, 200, { metrics, priorities: priorities.slice(0, 25), recent: recent.slice(0, 20) });
  }, { auth: true });

  // Phase 3.74 — HyDroMA integration READINESS (no scientific execution).
  // Maps operational records to a declared input contract and reports readiness
  // for human review only. Never runs a model, never changes scientific status.
  const HYDROMA_READINESS_CONTRACT = {
    id: "eco-nojin.hydroma.water-balance.readiness",
    version: "1.0.0",
    model: "eco-nojin.hydroma.water-balance",
    required: ["farmId", "cropCycleId", "areaHa", "seasonStart", "seasonEnd", "irrigationRecords"],
    units: { areaHa: "ha", irrigationQuantity: "mm" },
  };
  const computeReadiness = (orgId, farmId, cropCycleId) => {
    const contract = HYDROMA_READINESS_CONTRACT;
    const out = { contractId: contract.id, contractVersion: contract.version, model: contract.model, state: "NOT_READY", required: contract.required, available: [], missing: [...contract.required], invalid: [], unitMismatches: [], temporalIssues: [], spatialIssues: [], provenanceDeficiencies: [], sources: [], assessedAt: now() };
    const farm = db.prepare("SELECT * FROM resources WHERE org_id = ? AND type = 'farms' AND id = ?").get(orgId, farmId);
    const fpParts = { farm: null, cycle: null, irrigation: [] };
    if (!farm) { out.missing.push("farm"); return { out, fingerprint: createHash("sha256").update(JSON.stringify({ farmId })).digest("hex") }; }
    let fdata = {}; try { fdata = JSON.parse(farm.data); } catch { fdata = {}; }
    out.sources.push({ type: "farms", id: farm.id, created_at: farm.created_at });
    out.available.push("farmId");
    fpParts.farm = { areaHa: fdata.areaHa ?? null };
    if (fdata.areaHa != null && Number.isFinite(Number(fdata.areaHa)) && Number(fdata.areaHa) > 0) out.available.push("areaHa"); else out.missing.push("areaHa");
    let cycle = null;
    if (cropCycleId) {
      cycle = db.prepare("SELECT * FROM resources WHERE org_id = ? AND type = 'cropCycles' AND id = ?").get(orgId, cropCycleId);
      if (!cycle) out.missing.push("cropCycle");
      else {
        let cdata = {}; try { cdata = JSON.parse(cycle.data); } catch { cdata = {}; }
        if (cdata.farmId && String(cdata.farmId) !== String(farmId)) out.invalid.push("cropCycle.farmMismatch"); else out.available.push("cropCycleId");
        out.sources.push({ type: "cropCycles", id: cycle.id, created_at: cycle.created_at });
        fpParts.cycle = { farmId: cdata.farmId ?? null, seasonStart: cdata.seasonStart ?? null, seasonEnd: cdata.seasonEnd ?? null };
        const s = cdata.seasonStart ? Date.parse(cdata.seasonStart) : NaN; const e = cdata.seasonEnd ? Date.parse(cdata.seasonEnd) : NaN;
        if (Number.isFinite(s) && Number.isFinite(e) && s <= e) out.available.push("seasonStart", "seasonEnd"); else out.temporalIssues.push("cropCycle.season");
        if (!cdata.seasonStart || !cdata.seasonEnd) out.missing.push("seasonStart", "seasonEnd");
      }
    } else out.missing.push("cropCycleId");
    const irr = db.prepare("SELECT * FROM resources WHERE org_id = ? AND type = 'irrigationEvents'").all(orgId).map((r) => { let d = {}; try { d = JSON.parse(r.data); } catch { d = {}; } return { id: r.id, data: d, created_at: r.created_at }; }).filter((i) => !farmId || i.data.farmId == null || String(i.data.farmId) === String(farmId));
    const withQty = irr.filter((i) => i.data.quantity != null && i.data.occurredAt);
    if (withQty.length === 0) out.missing.push("irrigationRecords"); else out.available.push("irrigationRecords");
    const seasonStart = cycle ? (() => { try { return Date.parse(JSON.parse(cycle.data).seasonStart); } catch { return NaN; } })() : NaN;
    const seasonEnd = cycle ? (() => { try { return Date.parse(JSON.parse(cycle.data).seasonEnd); } catch { return NaN; } })() : NaN;
    for (const i of withQty) {
      if (i.data.unit && i.data.unit !== contract.units.irrigationQuantity) out.unitMismatches.push({ id: i.id, unit: i.data.unit });
      const t = Date.parse(i.data.occurredAt);
      if (Number.isFinite(seasonStart) && Number.isFinite(seasonEnd) && (t < seasonStart || t > seasonEnd)) out.temporalIssues.push({ id: i.id, reason: "outside_season" });
      out.sources.push({ type: "irrigationEvents", id: i.id, created_at: i.created_at });
      fpParts.irrigation.push([i.id, i.data.quantity ?? null, i.data.unit ?? null, i.data.occurredAt ?? null]);
    }
    out.missing = [...new Set(out.missing)].filter((m) => !out.available.includes(m));
    // Phase 3.76 — deterministic data-quality & provenance findings (no scientific inference).
    const rulesVersion = "1.0.0";
    const findings = [];
    const addF = (category, severity, source, field, reason, expected, actual) => findings.push({ id: `f${findings.length + 1}`, category, severity, source, field, reason, expected, actual, rulesVersion });
    for (const u of out.unitMismatches) addF("unit", "high", u.id, "unit", "unit_conflict", contract.units.irrigationQuantity, u.unit);
    for (const t of out.temporalIssues) addF("temporal", "medium", t.id ?? "cropCycle", "occurredAt", t.reason ?? "temporal", "within_season", t.reason ?? "out_of_range");
    for (const iv of out.invalid) addF("relationship", "high", "cropCycle", "farmId", iv, "same_farm", "mismatch");
    // Duplicate irrigation (same farm + occurredAt + quantity) is a deterministic anomaly.
    const seen = new Map();
    for (const i of withQty) { const k = `${i.data.occurredAt}|${i.data.quantity}`; if (seen.has(k)) addF("consistency", "low", i.id, "irrigation", "duplicate_record", "unique", `duplicate_of:${seen.get(k)}`); else seen.set(k, i.id); }
    const missingEventDate = withQty.filter((i) => !i.data.occurredAt).length;
    out.provenance = out.sources.length === 0 ? "unavailable" : missingEventDate > 0 || out.missing.length > 0 ? "incomplete" : "available";
    out.spatial = fdata.geometry || fdata.coordinates ? "available" : "unavailable";
    out.findings = findings;
    const ready = out.missing.length === 0 && out.invalid.length === 0 && out.unitMismatches.length === 0 && out.temporalIssues.length === 0;
    out.state = ready ? "READY_FOR_REVIEW" : "NOT_READY";
    fpParts.irrigation.sort((a, b) => (a[0] < b[0] ? -1 : 1));
    const fingerprint = createHash("sha256").update(JSON.stringify(fpParts)).digest("hex");
    return { out, fingerprint };
  };
  const assessView = (r) => ({ id: r.id, orgId: r.org_id, farmId: r.farm_id, cropCycleId: r.crop_cycle_id, contractId: r.contract_id, contractVersion: r.contract_version, rulesVersion: r.rules_version, state: r.state, snapshot: JSON.parse(r.snapshot), sources: JSON.parse(r.sources), fingerprint: r.fingerprint, createdBy: r.created_by, createdAt: r.created_at, reviewState: r.review_state, reviewedBy: r.reviewed_by, reviewedAt: r.reviewed_at, reviewNote: r.review_note });

  route("GET", /^\/v1\/hydroma\/readiness$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const { out } = computeReadiness(scope.orgId, str(url.searchParams.get("farmId") ?? "", 80), str(url.searchParams.get("cropCycleId") ?? "", 80));
    return json(res, 200, out);
  }, { auth: true });

  route("POST", /^\/v1\/hydroma\/readiness\/assessments$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot create assessments.");
    const body = await readJson(req);
    const farmId = str(body.farmId, 80); const cropCycleId = str(body.cropCycleId, 80) || null;
    const { out, fingerprint } = computeReadiness(scope.orgId, farmId, cropCycleId);
    const id = newId("hra"); const at = now();
    db.prepare(`INSERT INTO hydroma_readiness_assessments (id, org_id, farm_id, crop_cycle_id, contract_id, contract_version, rules_version, state, snapshot, sources, fingerprint, created_by, created_at, review_state)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ASSESSMENT_CREATED')`)
      .run(id, scope.orgId, farmId, cropCycleId, out.contractId, out.contractVersion, "1.0.0", out.state, JSON.stringify(out), JSON.stringify(out.sources), fingerprint, ctx.user.id, at);
    return json(res, 201, assessView(db.prepare("SELECT * FROM hydroma_readiness_assessments WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/hydroma\/readiness\/assessments$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const where = ["org_id = ?"]; const params = [scope.orgId];
    const farmId = url.searchParams.get("farmId"); if (farmId) { where.push("farm_id = ?"); params.push(farmId); }
    const rows = db.prepare(`SELECT * FROM hydroma_readiness_assessments WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 100`).all(...params);
    return json(res, 200, { items: rows.map(assessView), total: rows.length });
  }, { auth: true });

  route("GET", /^\/v1\/hydroma\/readiness\/assessments\/(?<id>[\w-]+)$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM hydroma_readiness_assessments WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Assessment not found.");
    const { fingerprint } = computeReadiness(scope.orgId, row.farm_id, row.crop_cycle_id);
    const current = fingerprint === row.fingerprint ? "current" : "inputs_changed";
    return json(res, 200, { ...assessView(row), currentness: current });
  }, { auth: true });

  route("POST", /^\/v1\/hydroma\/readiness\/assessments\/(?<id>[\w-]+)\/review$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!["owner", "admin", "manager"].includes(scope.membership.role)) return fail(res, 403, "forbidden", "Your role cannot review assessments.");
    const row = db.prepare("SELECT * FROM hydroma_readiness_assessments WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Assessment not found.");
    if (row.review_state !== "ASSESSMENT_CREATED" && row.review_state !== "PENDING_REVIEW") return json(res, 200, assessView(row));
    const body = await readJson(req); const decision = str(body.decision, 24);
    if (!["acceptable", "findings"].includes(decision)) return fail(res, 422, "invalid_decision", "decision must be 'acceptable' or 'findings'.");
    const at = now(); const reviewState = decision === "acceptable" ? "REVIEWED_ACCEPTABLE" : "REVIEWED_WITH_FINDINGS";
    db.prepare("INSERT INTO hydroma_readiness_reviews (id, org_id, assessment_id, decision, note, actor_id, at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(newId("hrev"), scope.orgId, row.id, decision, str(body.note, 500) || null, ctx.user.id, at);
    db.prepare("UPDATE hydroma_readiness_assessments SET review_state = ?, reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ?").run(reviewState, ctx.user.id, at, str(body.note, 500) || null, row.id);
    return json(res, 200, assessView(db.prepare("SELECT * FROM hydroma_readiness_assessments WHERE id = ?").get(row.id)));
  }, { auth: true });

  route("GET", /^\/v1\/hydroma\/readiness\/assessments\/(?<id>[\w-]+)\/reviews$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const rows = db.prepare("SELECT * FROM hydroma_readiness_reviews WHERE org_id = ? AND assessment_id = ? ORDER BY at ASC").all(scope.orgId, ctx.params.id);
    return json(res, 200, { items: rows.map((e) => ({ id: e.id, decision: e.decision, note: e.note, actorId: e.actor_id, at: e.at })) });
  }, { auth: true });

  // Phase 3.77 — environmental data source registry (catalog only; NO live acquisition).
  const ENV_CATEGORIES = ["weather", "satellite", "soil", "terrain", "water", "landcover", "other"];
  const ENV_STATUSES = ["CATALOGUED", "DOCUMENTED", "CONTRACT_DEFINED", "ADAPTER_IMPLEMENTED", "TESTED"];
  const envView = (r) => ({ id: r.id, orgId: r.org_id, name: r.name, category: r.category, sourceType: r.source_type, provider: r.provider, description: r.description, url: r.url, status: r.status, integrationStatus: r.integration_status, dataAvailability: r.data_availability, spatialCoverage: r.spatial_coverage, temporalCoverage: r.temporal_coverage, updateFrequency: r.update_frequency, variables: r.variables ? JSON.parse(r.variables) : [], units: r.units ? JSON.parse(r.units) : [], dataFormat: r.data_format, accessMethod: r.access_method, license: r.license, licenseReview: r.license_review, provenanceReq: r.provenance_req, limitations: r.limitations, contractVersion: r.contract_version, createdAt: r.created_at, updatedAt: r.updated_at });

  route("GET", /^\/v1\/env\/sources$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const where = ["org_id = ?"]; const params = [scope.orgId];
    const category = url.searchParams.get("category"); if (category) { where.push("category = ?"); params.push(category); }
    const rows = db.prepare(`SELECT * FROM env_sources WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 200`).all(...params);
    return json(res, 200, { items: rows.map(envView), total: rows.length });
  }, { auth: true });

  route("POST", /^\/v1\/env\/sources$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot add sources.");
    const body = await readJson(req);
    const name = str(body.name, 200); if (name.length < 2) return fail(res, 422, "invalid_name", "A name is required.");
    const category = str(body.category, 24); if (!ENV_CATEGORIES.includes(category)) return fail(res, 422, "invalid_category", "Unknown category.");
    const sourceType = str(body.sourceType, 24); if (!sourceType) return fail(res, 422, "invalid_type", "sourceType is required.");
    const status = str(body.integrationStatus, 24) || "CATALOGUED";
    if (status === "INTEGRATION_APPROVED") return fail(res, 422, "approval_not_implemented", "Integration approval is not implemented; live acquisition is not authorized.");
    if (!ENV_STATUSES.includes(status)) return fail(res, 422, "invalid_status", "Unknown integration status.");
    const id = newId("env"); const at = now();
    db.prepare(`INSERT INTO env_sources (id, org_id, name, category, source_type, provider, description, url, status, integration_status, data_availability, spatial_coverage, temporal_coverage, update_frequency, variables, units, data_format, access_method, license, license_review, provenance_req, limitations, contract_version, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(id, scope.orgId, name, category, sourceType, str(body.provider, 120) || null, str(body.description, 500) || null, str(body.url, 300) || null, status, status, str(body.dataAvailability, 24) || "unknown", str(body.spatialCoverage, 120) || null, str(body.temporalCoverage, 120) || null, str(body.updateFrequency, 60) || null, JSON.stringify(body.variables ?? []), JSON.stringify(body.units ?? []), str(body.dataFormat, 40) || null, str(body.accessMethod, 40) || null, str(body.license, 120) || null, "unknown", str(body.provenanceReq, 300) || null, str(body.limitations, 500) || null, str(body.contractVersion, 40) || null, ctx.user.id, at, at);
    return json(res, 201, envView(db.prepare("SELECT * FROM env_sources WHERE id = ?").get(id)));
  }, { auth: true });

  route("GET", /^\/v1\/env\/sources\/(?<id>[\w-]+)$/u, async (req, res, ctx, url) => {
    const scope = orgFrom(ctx, url);
    if (scope.error) return fail(res, ...scope.error);
    const row = db.prepare("SELECT * FROM env_sources WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Source not found.");
    return json(res, 200, envView(row));
  }, { auth: true });

  route("PATCH", /^\/v1\/env\/sources\/(?<id>[\w-]+)$/u, async (req, res, ctx) => {
    const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
    if (scope.error) return fail(res, ...scope.error);
    if (!requireWrite(scope.membership)) return fail(res, 403, "forbidden", "Your role cannot update sources.");
    const row = db.prepare("SELECT * FROM env_sources WHERE id = ? AND org_id = ?").get(ctx.params.id, scope.orgId);
    if (!row) return fail(res, 404, "not_found", "Source not found.");
    const body = await readJson(req);
    const status = body.integrationStatus != null ? str(body.integrationStatus, 24) : row.integration_status;
    if (status === "INTEGRATION_APPROVED") return fail(res, 422, "approval_not_implemented", "Integration approval is not implemented.");
    if (!ENV_STATUSES.includes(status)) return fail(res, 422, "invalid_status", "Unknown integration status.");
    db.prepare("UPDATE env_sources SET name = ?, description = ?, integration_status = ?, status = ?, limitations = ?, updated_at = ? WHERE id = ?")
      .run(body.name != null ? str(body.name, 200) : row.name, body.description != null ? str(body.description, 500) : row.description, status, status, body.limitations != null ? str(body.limitations, 500) : row.limitations, now(), row.id);
    return json(res, 200, envView(db.prepare("SELECT * FROM env_sources WHERE id = ?").get(row.id)));
  }, { auth: true });

  /* ------------------------------- HIC ---------------------------------- */

  // HIC is a SEPARATE, controlled ecosystem concept associated with Eco Nojin
  // and HyDroMA. It is NOT EcoCoin, NOT a financial asset, NOT transferable,
  // NOT convertible, and NOT issuable. This endpoint is read-only and exists
  // solely to surface the controlled HIC foundation: its definition, current
  // status, governance status, restrictions and audit-relevant metadata.
  // No issuance, transfer, conversion or financial operation is possible.
  const HIC = {
    id: "eco-nojin.hic",
    version: "0.1.0",
    definition:
      "HIC is a controlled, non-financial ecosystem concept associated with " +
      "Eco Nojin and HyDroMA. It is a separate instrument from EcoCoin and has " +
      "no monetary value, no blockchain representation, no external transfer, " +
      "and no redeemability. Any future relationship with HyDroMA model outputs " +
      "or agricultural activity must be explicit, documented, governed, " +
      "authorized and independently reviewable.",
    status: "INACTIVE",
    issuable: false,
    transferable: false,
    convertible: false,
    financial: false,
    governanceStatus: "OWNER_DECISION_REQUIRED",
    eligibilityPolicy: null,
    approvedActivity: null,
    relatedEntities: ["eco-nojin", "hydroma"],
    futureActivationRequirements: [
      "Owner decision on HIC definition and semantics (D-15)",
      "Commercial model and budget approval (D-24, D-25)",
      "Legal/jurisdiction review (D-14)",
      "Explicit governance activation separate from this mission",
    ],
    auditNote:
      "HIC remains inactive. No issuance, transfer, conversion or financial " +
      "operation has occurred or is possible through this endpoint.",
  };

  route(
    "GET",
    /^\/v1\/hic\/status$/u,
    async (req, res, ctx) => {
      const scope = orgFrom(ctx, new URL(req.url, "http://localhost"));
      if (scope.error) return fail(res, ...scope.error);
      audit(db, {
        orgId: scope.orgId,
        actorId: ctx.user.id,
        action: "hic.status.read",
        entity: "hic",
        entityId: HIC.id,
        detail: { status: HIC.status },
      });
      return json(res, 200, {
        ...HIC,
        organizationId: scope.orgId,
        readAt: now(),
      });
    },
    { auth: true }
  );

  route("GET", /^\/v1\/models$/u, async (req, res) => json(res, 200, { models: MODEL_REGISTRY, source: "eco-nojin-api" }));
  route("GET", /^\/health$/u, async (req, res) => json(res, 200, { status: "ok", service: "eco-nojin-api", version: VERSION }));

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
