// Owner (main admin) authentication.
//
// Before: the browser checked a password that was written in the site's own
// code, then set a cookie `admin_session=true` that the server believed
// without proof - so anyone could send that cookie and be the admin.
//
// Now:
//  - The password lives ONLY in a Cloudflare secret (ADMIN_PASSWORD); nothing
//    secret is in the code or the browser.
//  - Logging in checks it on the server and creates a random 256-bit session
//    token. Only a SHA-256 of the token is stored (in D1), so even a leaked
//    database can't be used to sign in.
//  - The token travels in an HttpOnly, Secure, SameSite=Strict cookie that
//    JavaScript can't read and other sites can't send.
//  - Failed logins are rate-limited per IP.
//  - State-changing requests must come from this site (Origin check).

interface AuthEnv {
  DB: D1Database;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

export const OWNER_COOKIE = "admin_session";
const SESSION_HOURS = 12;
const MAX_FAILURES = 8;           // per IP...
const FAILURE_WINDOW_MIN = 15;    // ...within this many minutes

const encoder = new TextEncoder();

const toHex = (buf: ArrayBuffer | Uint8Array) =>
  Array.from(buf instanceof Uint8Array ? buf : new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

/** Compares two strings without leaking, through timing, how much of them matched. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([sha256Hex(a), sha256Hex(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha.charCodeAt(i) ^ hb.charCodeAt(i);
  return diff === 0;
}

let tablesReady = false;
/** For tests: each test gets a fresh database, so forget that the tables were created. */
export const resetAuthTablesCache = () => { tablesReady = false; };
export async function ensureAuthTables(env: { DB: D1Database }): Promise<void> {
  if (tablesReady) return;
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        token_hash TEXT PRIMARY KEY,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        ip TEXT
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS auth_failures (
        scope TEXT NOT NULL,
        ip TEXT NOT NULL,
        at TEXT NOT NULL
      )
    `),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_auth_failures ON auth_failures(scope, ip, at)`),
  ]);
  tablesReady = true;
}

export const clientIp = (request: Request) =>
  request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0].trim() || "unknown";

// ---------------------------------------------------------------------------
// Rate limiting

export async function isLockedOut(env: { DB: D1Database }, scope: string, request: Request): Promise<boolean> {
  await ensureAuthTables(env);
  const since = new Date(Date.now() - FAILURE_WINDOW_MIN * 60 * 1000).toISOString();
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM auth_failures WHERE scope = ? AND ip = ? AND at > ?")
    .bind(scope, clientIp(request), since)
    .first<{ n: number }>();
  return (row?.n || 0) >= MAX_FAILURES;
}

export async function recordFailure(env: { DB: D1Database }, scope: string, request: Request): Promise<void> {
  await ensureAuthTables(env);
  await env.DB.prepare("INSERT INTO auth_failures (scope, ip, at) VALUES (?, ?, ?)")
    .bind(scope, clientIp(request), new Date().toISOString())
    .run();
  // tidy old rows now and then
  if (Math.random() < 0.05) {
    await env.DB.prepare("DELETE FROM auth_failures WHERE at < ?")
      .bind(new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .run();
  }
}

export async function clearFailures(env: { DB: D1Database }, scope: string, request: Request): Promise<void> {
  await env.DB.prepare("DELETE FROM auth_failures WHERE scope = ? AND ip = ?").bind(scope, clientIp(request)).run();
}

// ---------------------------------------------------------------------------
// Sessions

/**
 * Every value sent under this cookie name. A browser can hold two cookies with the same
 * name (e.g. the old site-wide admin_session=true from the previous login system AND the
 * new host-only one) and sends both - so we must look at all of them, not just the first.
 */
function readCookies(request: Request, name: string): string[] {
  const header = request.headers.get("Cookie") || "";
  const values: string[] = [];
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) {
      try { values.push(decodeURIComponent(rest.join("="))); } catch { /* ignore a malformed value */ }
    }
  }
  return values;
}

/** Expires the old site-wide cookie the previous login system left in browsers. */
export const LEGACY_COOKIE_CLEAR = `${"admin_session"}=; Path=/; Domain=.campusmart.co.ke; Secure; SameSite=None; Max-Age=0`;

/** Cookie value is a 64-char hex token; anything else (e.g. the old "true") is rejected outright. */
const validToken = (t: string | null | undefined): t is string => !!t && /^[0-9a-f]{64}$/.test(t);

/** Starts a session; returns the Set-Cookie header value. */
export async function createOwnerSession(env: { DB: D1Database }, request: Request): Promise<string> {
  await ensureAuthTables(env);
  const token = toHex(crypto.getRandomValues(new Uint8Array(32)));
  const expires = new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString();
  await env.DB.prepare("INSERT INTO admin_sessions (token_hash, expires_at, ip) VALUES (?, ?, ?)")
    .bind(await sha256Hex(token), expires, clientIp(request))
    .run();
  await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").bind(new Date().toISOString()).run();
  return `${OWNER_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export async function endOwnerSession(env: { DB: D1Database }, request: Request): Promise<string> {
  for (const token of readCookies(request, OWNER_COOKIE)) {
    if (validToken(token)) {
      await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
    }
  }
  return `${OWNER_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

/**
 * True only for a real, unexpired owner session. State-changing requests must
 * also come from this same site, as a second line of defence against forged
 * cross-site requests.
 */
export async function isOwner(request: Request, env: { DB: D1Database }): Promise<boolean> {
  const candidates = readCookies(request, OWNER_COOKIE).filter(validToken);
  if (candidates.length === 0) return false;

  if (request.method !== "GET" && request.method !== "HEAD" && request.method !== "OPTIONS") {
    const origin = request.headers.get("Origin");
    if (origin && new URL(origin).host !== new URL(request.url).host) return false;
  }

  try {
    await ensureAuthTables(env);
    // any one genuine, unexpired session token is enough
    for (const token of candidates) {
      const row = await env.DB.prepare("SELECT expires_at FROM admin_sessions WHERE token_hash = ?")
        .bind(await sha256Hex(token))
        .first<{ expires_at: string }>();
      if (row && new Date(row.expires_at) > new Date()) return true;
    }
    return false;
  } catch {
    return false; // if in doubt, deny
  }
}

// ---------------------------------------------------------------------------
// Credentials

export type LoginCheck =
  | { ok: true }
  | { ok: false; reason: "not_configured" | "invalid" };

/** Checks the owner's email (optional) and password against the Cloudflare secrets. */
export async function checkOwnerCredentials(env: AuthEnv, email: string | undefined, password: string): Promise<LoginCheck> {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 10) return { ok: false, reason: "not_configured" };

  const passwordOk = await safeEqual(password, env.ADMIN_PASSWORD);
  // Email is optional on the form (blank = main admin); if given it must match.
  const emailOk = !email || !env.ADMIN_EMAIL || (await safeEqual(email.trim().toLowerCase(), env.ADMIN_EMAIL.trim().toLowerCase()));
  return passwordOk && emailOk ? { ok: true } : { ok: false, reason: "invalid" };
}
