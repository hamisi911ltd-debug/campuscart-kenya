// Cloudflare Pages Function - manage team member (product-only) admin
// accounts. Owner-only: uses the same isAdmin() check as every other
// non-product admin endpoint, so a team member's own session (which only
// product-related endpoints recognize) can't reach this at all.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { ensureTeamTables, hashPassword } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    await ensureTeamTables(env);
    const { results } = await env.DB.prepare(
      "SELECT id, email, full_name, role, is_active, created_at FROM admin_team ORDER BY created_at DESC"
    ).all();
    return new Response(JSON.stringify({ success: true, team: results || [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error listing team members:", error);
    return new Response(JSON.stringify({ error: "Failed to list team members" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    await ensureTeamTables(env);
    const body = await request.json() as { email?: string; password?: string; full_name?: string };
    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (body.password.length < 6) {
      return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = body.email.toLowerCase().trim();
    const existing = await env.DB.prepare("SELECT id FROM admin_team WHERE email = ?").bind(email).first();
    if (existing) {
      return new Response(JSON.stringify({ error: "An account with that email already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(body.password);
    await env.DB.prepare(
      "INSERT INTO admin_team (id, email, password_hash, full_name, role, is_active) VALUES (?, ?, ?, ?, 'product_manager', 1)"
    ).bind(id, email, passwordHash, body.full_name || null).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating team member:", error);
    return new Response(JSON.stringify({ error: "Failed to create team member" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const body = await request.json() as { id?: string; is_active?: boolean };
    if (!body.id || typeof body.is_active !== "boolean") {
      return new Response(JSON.stringify({ error: "id and is_active are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.DB.prepare("UPDATE admin_team SET is_active = ? WHERE id = ?").bind(body.is_active ? 1 : 0, body.id).run();
    // Revoking access should take effect immediately, not just on next
    // session expiry.
    if (!body.is_active) {
      await env.DB.prepare("DELETE FROM admin_team_sessions WHERE admin_id = ?").bind(body.id).run();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error updating team member:", error);
    return new Response(JSON.stringify({ error: "Failed to update team member" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "id is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.DB.prepare("DELETE FROM admin_team_sessions WHERE admin_id = ?").bind(id).run();
    await env.DB.prepare("DELETE FROM admin_team WHERE id = ?").bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return new Response(JSON.stringify({ error: "Failed to delete team member" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
