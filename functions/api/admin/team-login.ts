// Cloudflare Pages Function - login for restricted "team member" admin
// accounts (product-posting access only). The main admin still logs in
// the existing way via the hardcoded password in AdminLogin.tsx - this is
// a separate, additional path for accounts created in Admin -> Team.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { ensureTeamTables, hashPassword } from "../_lib/teamAuth";

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

    const passwordHash = await hashPassword(body.password);
    const member = await env.DB.prepare(
      "SELECT id, email, full_name, role, is_active FROM admin_team WHERE email = ? AND password_hash = ?"
    ).bind(body.email.toLowerCase().trim(), passwordHash).first<{ id: string; email: string; full_name: string; role: string; is_active: number }>();

    if (!member) {
      return new Response(JSON.stringify({ error: "Invalid email or password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!member.is_active) {
      return new Response(JSON.stringify({ error: "This account has been deactivated" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const token = crypto.randomUUID() + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await env.DB.prepare(
      "INSERT INTO admin_team_sessions (token, admin_id, expires_at) VALUES (?, ?, ?)"
    ).bind(token, member.id, expiresAt).run();

    const cookie = `product_admin_session=${token}; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=None; Secure`;

    return new Response(JSON.stringify({
      success: true,
      admin: { id: member.id, email: member.email, full_name: member.full_name, role: member.role },
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
