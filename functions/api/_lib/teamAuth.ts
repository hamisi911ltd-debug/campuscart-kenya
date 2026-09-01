// Restricted "team member" admin accounts - separate from the single
// hardcoded owner password (AdminLogin.tsx / adminAuth.ts's admin_session
// cookie), which is left completely untouched so the owner's existing
// access never depends on this newer system working correctly.
//
// A team member gets their own email/password (created by the owner in
// Admin -> Team) and, once logged in, a session token stored in a
// `product_admin_session` cookie - checked only by the product-related
// endpoints (see isProductAuthorized below). Every other admin endpoint
// still checks solely for the owner's admin_session cookie, so a team
// member's token means nothing there and access is denied automatically -
// no need to touch those files at all.
export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  is_active: number;
}

export async function ensureTeamTables(env: { DB: D1Database }): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_team (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      role TEXT NOT NULL DEFAULT 'product_manager',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_team_sessions (
      token TEXT PRIMARY KEY,
      admin_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(password));
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getTeamSession(request: Request, env: { DB: D1Database }): Promise<TeamMember | null> {
  const token = getCookie(request, "product_admin_session");
  if (!token) return null;

  const row = await env.DB.prepare(`
    SELECT t.id, t.email, t.full_name, t.role, t.is_active, s.expires_at
    FROM admin_team_sessions s
    JOIN admin_team t ON t.id = s.admin_id
    WHERE s.token = ?
  `).bind(token).first<TeamMember & { expires_at: string }>();

  if (!row || !row.is_active) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  return { id: row.id, email: row.email, full_name: row.full_name, role: row.role, is_active: row.is_active };
}

function isOwnerSession(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
}

// Used by product-related endpoints only (products, bulk import, photo/CSV
// import, CJ dropship import, image upload): the owner always passes, and
// so does any active team member - every team account today is
// role 'product_manager', which is exactly this access level.
export async function isProductAuthorized(request: Request, env: { DB: D1Database }): Promise<boolean> {
  if (isOwnerSession(request)) return true;
  const team = await getTeamSession(request, env);
  return !!team;
}
