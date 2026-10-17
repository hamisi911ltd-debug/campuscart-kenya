// Restricted "team member" admin accounts with configurable permissions -
// separate from the single hardcoded owner password (AdminLogin.tsx /
// adminAuth.ts's admin_session cookie), which is left completely untouched
// so the owner's existing access never depends on this newer system
// working correctly.
//
// A team member gets their own email/password (created by the owner in
// Admin -> Team) plus a set of permission areas the owner grants them
// (e.g. ["products", "orders"]). Once logged in they get a session token
// stored in a `product_admin_session` cookie, checked by hasPermission()
// below wherever an endpoint needs one of those areas. Owner-only areas
// (Team management, System Control, Dashboard, etc.) never check this at
// all, so no permission a team member holds can reach them.
import { isOwner, sha256Hex, safeEqual } from "./ownerAuth";

export const PERMISSION_AREAS = ["products", "orders", "users", "coupons"] as const;
export type PermissionArea = typeof PERMISSION_AREAS[number];

export interface TeamMember {
  id: string;
  email: string;
  full_name: string | null;
  permissions: PermissionArea[];
  is_active: number;
}

export async function ensureTeamTables(env: { DB: D1Database }): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_team (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      permissions TEXT NOT NULL DEFAULT '[]',
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

// Old accounts were stored as an unsalted SHA-256 hex digest (64 hex chars) - fast to
// crack and identical for identical passwords. New ones use salted PBKDF2:
// "pbkdf2$<iterations>$<salt hex>$<hash hex>". Old hashes still verify, and are
// upgraded to the new format the next time that person signs in.
const PBKDF2_ITERATIONS = 10000;

const hexOf = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

async function pbkdf2(password: string, saltHex: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const salt = new Uint8Array(saltHex.match(/../g)!.map((h) => parseInt(h, 16)));
  return hexOf(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations }, key, 256));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = hexOf(crypto.getRandomValues(new Uint8Array(16)));
  return `pbkdf2$${PBKDF2_ITERATIONS}$${salt}$${await pbkdf2(password, salt, PBKDF2_ITERATIONS)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<{ ok: boolean; needsUpgrade: boolean }> {
  if (stored.startsWith("pbkdf2$")) {
    const [, iters, salt, hash] = stored.split("$");
    const computed = await pbkdf2(password, salt, Number(iters));
    return { ok: await safeEqual(computed, hash), needsUpgrade: false };
  }
  // legacy unsalted SHA-256
  const legacy = await sha256Hex(password);
  return { ok: await safeEqual(legacy, stored), needsUpgrade: true };
}

export function sanitizePermissions(input: unknown): PermissionArea[] {
  if (!Array.isArray(input)) return [];
  return PERMISSION_AREAS.filter((area) => input.includes(area));
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
    SELECT t.id, t.email, t.full_name, t.permissions, t.is_active, s.expires_at
    FROM admin_team_sessions s
    JOIN admin_team t ON t.id = s.admin_id
    WHERE s.token = ?
  `).bind(await sha256Hex(token)).first<{ id: string; email: string; full_name: string | null; permissions: string; is_active: number; expires_at: string }>();

  if (!row || !row.is_active) return null;
  if (new Date(row.expires_at) < new Date()) return null;

  let permissions: PermissionArea[] = [];
  try {
    permissions = sanitizePermissions(JSON.parse(row.permissions));
  } catch {
    permissions = [];
  }

  return { id: row.id, email: row.email, full_name: row.full_name, permissions, is_active: row.is_active };
}

// The owner always has every permission. A team member needs the named
// area explicitly granted by the owner in Admin -> Team.
export async function hasPermission(request: Request, env: { DB: D1Database }, area: PermissionArea): Promise<boolean> {
  if (await isOwner(request, env)) return true;
  const team = await getTeamSession(request, env);
  return !!team && team.permissions.includes(area);
}
