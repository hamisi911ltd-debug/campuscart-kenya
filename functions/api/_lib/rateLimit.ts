// Small per-address rate limiter for public endpoints (review uploads, review posts, payment
// prompts). Uses the same auth_failures table as sign-in lockout; "scope" keeps counters apart.
import { ensureAuthTables, clientIp } from "./ownerAuth";

/** True if this address has already hit `max` events for `scope` in the last `windowMinutes`. */
export async function overLimit(
  env: { DB: D1Database },
  scope: string,
  request: Request,
  max: number,
  windowMinutes: number
): Promise<boolean> {
  await ensureAuthTables(env);
  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM auth_failures WHERE scope = ? AND ip = ? AND at > ?")
    .bind(scope, clientIp(request), since)
    .first<{ n: number }>();
  return (row?.n || 0) >= max;
}

/** Records one event for this address under `scope`. */
export async function recordHit(env: { DB: D1Database }, scope: string, request: Request): Promise<void> {
  await ensureAuthTables(env);
  await env.DB.prepare("INSERT INTO auth_failures (scope, ip, at) VALUES (?, ?, ?)")
    .bind(scope, clientIp(request), new Date().toISOString())
    .run();
}
