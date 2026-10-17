// Cloudflare Pages Function - login for restricted "team member" admin
// accounts. The main admin still logs in the existing way via the
// owner login (see login.ts) - this is a separate path for accounts created
// in Admin -> Team.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { ensureTeamTables, hashPassword, sanitizePermissions, verifyPassword } from "../_lib/teamAuth";
import { clearFailures, isLockedOut, recordFailure, sha256Hex } from "../_lib/ownerAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  try {
    const body = await request.json() as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ensureTeamTables(env);

    if (await isLockedOut(env, "team", request)) {
      return new Response(JSON.stringify({ error: "Too many failed attempts. Try again in 15 minutes." }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "900" },
      });
    }

    // Look the person up by email, then check the password (never compare in SQL).
    const found = await env.DB.prepare(
      "SELECT id, email, full_name, permissions, is_active, password_hash FROM admin_team WHERE email = ?"
    ).bind(body.email.toLowerCase().trim()).first<{ id: string; email: string; full_name: string | null; permissions: string; is_active: number; password_hash: string }>();

    const check = found ? await verifyPassword(body.password, found.password_hash) : { ok: false, needsUpgrade: false };
    if (!found || !check.ok) {
      await recordFailure(env, "team", request);
      await new Promise((r) => setTimeout(r, 400));
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    await clearFailures(env, "team", request);
    const member = found;

    // First sign-in since the stronger hashing was added: upgrade this account's hash.
    if (check.needsUpgrade) {
      await env.DB.prepare("UPDATE admin_team SET password_hash = ? WHERE id = ?")
        .bind(await hashPassword(body.password), member.id).run();
    }
    if (!member.is_active) {
      return new Response(JSON.stringify({ error: "This account has been deactivated" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await env.DB.prepare(
      "INSERT INTO admin_team_sessions (token, admin_id, expires_at) VALUES (?, ?, ?)"
    ).bind(await sha256Hex(token), member.id, expiresAt).run(); // only a hash of the token is stored

    let permissions: string[] = [];
    try { permissions = sanitizePermissions(JSON.parse(member.permissions)); } catch { /* default empty */ }

    // HttpOnly (scripts can't read it), Secure, SameSite=Strict (other sites can't send it)
    const cookie = `product_admin_session=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; Secure; SameSite=Strict`;

    return new Response(JSON.stringify({
      success: true,
      admin: { id: member.id, email: member.email, full_name: member.full_name, permissions },
    }), {
      headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
    });
  } catch (error) {
    console.error("Error logging in team member:", error);
    return new Response(JSON.stringify({ error: "Login failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
