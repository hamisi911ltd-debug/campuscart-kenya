// Cloudflare Pages Function - "who am I?" for the admin screens.
// The session cookie is HttpOnly, so the page can't look at it; it asks here
// instead (this is how a new browser tab knows you're still signed in).
import { isOwner } from "../_lib/ownerAuth";
import { getTeamSession } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

  if (await isOwner(request, env)) {
    return new Response(JSON.stringify({ authenticated: true, role: "owner" }), { headers });
  }

  const team = await getTeamSession(request, env).catch(() => null);
  if (team) {
    return new Response(JSON.stringify({
      authenticated: true,
      role: "team",
      admin: { id: team.id, email: team.email, full_name: team.full_name, permissions: team.permissions },
    }), { headers });
  }

  return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers });
}
