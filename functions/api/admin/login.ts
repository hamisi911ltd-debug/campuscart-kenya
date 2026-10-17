// Cloudflare Pages Function - owner (main admin) login / logout.
//
// The password is checked HERE, on the server, against the ADMIN_PASSWORD
// secret set in Cloudflare (never in the code or the browser). A successful
// login creates a random server-side session (see _lib/ownerAuth.ts).
import { enforceAdminDomain } from "../_lib/adminDomain";
import {
  sha256Hex,
  checkOwnerCredentials,
  clearFailures,
  createOwnerSession,
  endOwnerSession,
  isLockedOut,
  recordFailure,
  LEGACY_COOKIE_CLEAR,
  ownerAuthStatus,
} from "../_lib/ownerAuth";

interface Env {
  DB: D1Database;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}, cookies: string[] = []) => {
  const h = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store", ...headers });
  for (const c of cookies) h.append("Set-Cookie", c); // a response may set several cookies
  return new Response(JSON.stringify(body), { status, headers: h });
};

// "Why can't I sign in?" - reports only non-secret facts: is the password secret set, and is
// THIS address currently locked out after too many wrong attempts.
export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  let lockedOut = false;
  try { lockedOut = await isLockedOut(env, "owner", request); } catch { /* report what we can */ }
  return json({ ...ownerAuthStatus(env), lockedOut });
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  try {
    if (await isLockedOut(env, "owner", request)) {
      return json({ error: "Too many failed attempts. Try again in 15 minutes." }, 429, { "Retry-After": "900" });
    }

    let body: { email?: string; password?: string } = {};
    try { body = await request.json(); } catch { /* handled below */ }
    const password = typeof body.password === "string" ? body.password : "";
    if (!password) return json({ error: "Password is required" }, 400);

    const check = await checkOwnerCredentials(env, body.email, password);

    if (!check.ok && check.reason === "not_configured") {
      // Fail closed: with no secret set, nobody gets in.
      return json({
        error: "Admin sign-in isn't set up yet. In Cloudflare Pages, add the ADMIN_PASSWORD secret (10+ characters), then redeploy.",
        code: "not_configured",
      }, 503);
    }

    if (!check.ok) {
      await recordFailure(env, "owner", request);
      await new Promise((r) => setTimeout(r, 400)); // slows down guessing
      return json({ error: "Invalid password" }, 401);
    }

    await clearFailures(env, "owner", request);
    const cookie = await createOwnerSession(env, request);
    // Also remove the old site-wide "admin_session=true" cookie the previous login system left in browsers.
    return json({ success: true, message: "Login successful" }, 200, {}, [cookie, LEGACY_COOKIE_CLEAR]);
  } catch (error) {
    console.error("Login error:", error);
    return json({ error: "Login failed" }, 500);
  }
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const headers = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  headers.append("Set-Cookie", await endOwnerSession(env, request));

  // A signed-in team member logs out through here too: end their session and clear its cookie.
  const teamToken = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)product_admin_session=([0-9a-f]{64})/)?.[1];
  if (teamToken) {
    await env.DB.prepare("DELETE FROM admin_team_sessions WHERE token = ?").bind(await sha256Hex(teamToken)).run().catch(() => {});
  }
  headers.append("Set-Cookie", "product_admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0");

  return new Response(JSON.stringify({ success: true, message: "Logged out successfully" }), { headers });
}
