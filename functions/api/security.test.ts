import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { onRequestPost as login, onRequestDelete as logout, onRequestGet as loginStatus } from "./admin/login";
import { onRequestGet as sessionInfo } from "./admin/session";
import { onRequestPost as bulkUpdate } from "./admin/bulk-update";
import { onRequestPost as teamLogin } from "./admin/team-login";
import { onRequestPost as sqlConsole } from "./admin/database-viewer";
import { onRequestPost as webhook } from "./payhero/callback";
import { hashPassword, verifyPassword, ensureTeamTables } from "./_lib/teamAuth";
import { sha256Hex, resetAuthTablesCache } from "./_lib/ownerAuth";

// A D1 look-alike on node:sqlite
function makeDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE products (id TEXT PRIMARY KEY, title TEXT, category TEXT, is_available INT DEFAULT 1, updated_at TEXT);
    CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, password_hash TEXT);
    CREATE TABLE orders (id TEXT PRIMARY KEY, total_amount REAL, delivery_fee REAL, buyer_phone TEXT, payment_status TEXT DEFAULT 'unpaid', status TEXT, payhero_reference TEXT, updated_at TEXT);
    CREATE TABLE order_status_history (id TEXT, order_id TEXT, status TEXT, note TEXT);
    CREATE TABLE payhero_callback_logs (id TEXT, order_id TEXT, raw_payload TEXT);
  `);
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    run: async () => { db.prepare(sql).run(...(args as any[])); return {}; },
    first: async () => (db.prepare(sql).get(...(args as any[])) as any) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...(args as any[])) as any[] }),
    _run: () => db.prepare(sql).run(...(args as any[])),
  });
  return { raw: db, prepare: (sql: string) => stmt(sql), batch: async (s: any[]) => { for (const x of s) x._run(); return []; } } as any;
}

const ORIGIN = "https://admin.campusmart.co.ke";
const req = (path: string, method: string, opts: { body?: unknown; cookie?: string; headers?: Record<string, string> } = {}) =>
  new Request(ORIGIN + path, {
    method,
    headers: { "Content-Type": "application/json", ...(opts.cookie ? { Cookie: opts.cookie } : {}), ...opts.headers },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
const cookieFrom = (res: Response) => (res.headers.get("Set-Cookie") || "").split(";")[0];

let DB: any;
let env: any;
beforeEach(() => {
  resetAuthTablesCache();
  DB = makeDb();
  env = { DB, ADMIN_PASSWORD: "a-long-secret-password-123", PAYHERO_AUTH_TOKEN: "t", PAYHERO_CHANNEL_ID: "1" };
  DB.raw.exec("INSERT INTO products (id,title,category) VALUES ('p1','A','home')");
});
afterEach(() => vi.unstubAllGlobals());

const signIn = async () => {
  const res = await login({ env, request: req("/api/admin/login", "POST", { body: { password: env.ADMIN_PASSWORD } }) });
  expect(res.status).toBe(200);
  return cookieFrom(res);
};

describe("owner session", () => {
  it("rejects every old forged credential", async () => {
    const forged = [
      { cookie: "admin_session=true" },
      { headers: { Authorization: "Bearer admin_session_true" } },
      { headers: { "X-Admin-Session": "true" } },
      { cookie: "admin_session=" + "a".repeat(64) }, // right shape, never issued
    ];
    for (const f of forged) {
      const res = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "reject" }, ...f }) });
      expect(res.status).toBe(401);
    }
    expect((DB.raw.prepare("SELECT is_available FROM products").get() as any).is_available).toBe(1); // untouched
  });

  it("fails closed when no ADMIN_PASSWORD secret is set", async () => {
    env.ADMIN_PASSWORD = undefined;
    const res = await login({ env, request: req("/api/admin/login", "POST", { body: { password: "anything" } }) });
    expect(res.status).toBe(503);
    expect(res.headers.get("Set-Cookie")).toBeNull();
  });

  it("ignores stray whitespace in the saved secret or the typed password", async () => {
    env.ADMIN_PASSWORD = "  a-long-secret-password-123\n"; // as often pasted into a dashboard
    for (const typed of ["a-long-secret-password-123", " a-long-secret-password-123 "]) {
      const res = await login({ env, request: req("/api/admin/login", "POST", { body: { password: typed } }) });
      expect(res.status).toBe(200);
    }
    const wrong = await login({ env, request: req("/api/admin/login", "POST", { body: { password: "a-long-secret-password-124" } }) });
    expect(wrong.status).toBe(401);
  });

  it("accepts the owner's email on the form when it matches, rejects another", async () => {
    env.ADMIN_EMAIL = "Boss@Shop.co";
    const ok = await login({ env, request: req("/api/admin/login", "POST", { body: { email: "boss@shop.co", password: env.ADMIN_PASSWORD } }) });
    expect(ok.status).toBe(200);
    const no = await login({ env, request: req("/api/admin/login", "POST", { body: { email: "someone@else.co", password: env.ADMIN_PASSWORD } }) });
    expect(no.status).toBe(401);
  });

  it("reports non-secret sign-in status for diagnosis", async () => {
    const s: any = await (await loginStatus({ env, request: req("/api/admin/login", "GET") })).json();
    expect(s.configured).toBe(true);
    expect(s.lockedOut).toBe(false);
    expect(JSON.stringify(s)).not.toContain(env.ADMIN_PASSWORD); // never the secret itself
    env.ADMIN_PASSWORD = undefined;
    expect(((await (await loginStatus({ env, request: req("/api/admin/login", "GET") })).json()) as any).configured).toBe(false);
  });

  it("rejects a wrong password and locks the address out after repeated failures", async () => {
    for (let i = 0; i < 8; i++) {
      const res = await login({ env, request: req("/api/admin/login", "POST", { body: { password: "wrong-" + i }, headers: { "CF-Connecting-IP": "9.9.9.9" } }) });
      expect(res.status).toBe(401);
    }
    // 9th attempt is blocked even with the RIGHT password
    const blocked = await login({ env, request: req("/api/admin/login", "POST", { body: { password: env.ADMIN_PASSWORD }, headers: { "CF-Connecting-IP": "9.9.9.9" } }) });
    expect(blocked.status).toBe(429);
    // another address is unaffected
    const other = await login({ env, request: req("/api/admin/login", "POST", { body: { password: env.ADMIN_PASSWORD }, headers: { "CF-Connecting-IP": "1.2.3.4" } }) });
    expect(other.status).toBe(200);
  }, 30000);

  it("a real login gives a hardened cookie that works, and logout kills it", async () => {
    const res = await login({ env, request: req("/api/admin/login", "POST", { body: { password: env.ADMIN_PASSWORD } }) });
    const setCookie = res.headers.get("Set-Cookie")!;
    expect(setCookie).toMatch(/HttpOnly/);
    expect(setCookie).toMatch(/Secure/);
    expect(setCookie).toMatch(/SameSite=Strict/);
    const cookie = cookieFrom(res);
    expect(cookie).toMatch(/^admin_session=[0-9a-f]{64}$/);

    // the token itself is never stored - only its hash
    const stored = DB.raw.prepare("SELECT token_hash FROM admin_sessions").all() as any[];
    expect(stored).toHaveLength(1);
    expect(stored[0].token_hash).not.toContain(cookie.split("=")[1]);
    expect(stored[0].token_hash).toBe(await sha256Hex(cookie.split("=")[1]));

    const ok = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "reject" }, cookie }) });
    expect(ok.status).toBe(200);
    expect(((await (await sessionInfo({ env, request: req("/api/admin/session", "GET", { cookie }) })).json()) as any).role).toBe("owner");

    await logout({ env, request: req("/api/admin/login", "DELETE", { cookie }) });
    const after = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "approve" }, cookie }) });
    expect(after.status).toBe(401);
  });

  it("still works when the browser also sends the OLD site-wide admin_session=true cookie", async () => {
    const cookie = await signIn();
    for (const header of [`admin_session=true; ${cookie}`, `${cookie}; admin_session=true`, `admin_session=true; admin_session=abc; ${cookie}`]) {
      const ok = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "approve" }, cookie: header }) });
      expect(ok.status).toBe(200);
    }
    // ...and the old cookie alone still gets nowhere
    const bad = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "approve" }, cookie: "admin_session=true" }) });
    expect(bad.status).toBe(401);
    // sign-in expires the old cookie in the browser
    const res = await login({ env, request: req("/api/admin/login", "POST", { body: { password: env.ADMIN_PASSWORD } }) });
    const all = (res.headers as any).getSetCookie ? (res.headers as any).getSetCookie() : [res.headers.get("Set-Cookie")];
    expect(all.some((c: string) => /Domain=\.campusmart\.co\.ke/.test(c) && /Max-Age=0/.test(c))).toBe(true);
  });

  it("rejects expired sessions and requests coming from another website", async () => {
    const cookie = await signIn();
    // from a different site (CSRF)
    const cross = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "reject" }, cookie, headers: { Origin: "https://evil.example" } }) });
    expect(cross.status).toBe(401);
    // same site is fine
    const same = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "reject" }, cookie, headers: { Origin: ORIGIN } }) });
    expect(same.status).toBe(200);
    // expire it
    DB.raw.exec("UPDATE admin_sessions SET expires_at = '2000-01-01T00:00:00.000Z'");
    const expired = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "approve" }, cookie }) });
    expect(expired.status).toBe(401);
  });
});

describe("team accounts", () => {
  it("uses salted PBKDF2, upgrades old unsalted hashes on login, and stores only a hash of the session token", async () => {
    await ensureTeamTables(env);
    const modern = await hashPassword("team-pass-1");
    expect(modern).toMatch(/^pbkdf2\$\d+\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    expect(await hashPassword("team-pass-1")).not.toBe(modern); // salted: same password, different hash
    expect((await verifyPassword("team-pass-1", modern)).ok).toBe(true);
    expect((await verifyPassword("nope", modern)).ok).toBe(false);

    // an old-style account (unsalted sha256)
    const legacy = await sha256Hex("old-pass-9");
    DB.raw.prepare("INSERT INTO admin_team (id,email,password_hash,full_name,permissions,is_active) VALUES ('t1','old@x.co',?, 'Old', '[\"products\"]', 1)").run(legacy);

    const bad = await teamLogin({ env, request: req("/api/admin/team-login", "POST", { body: { email: "old@x.co", password: "wrong" } }) });
    expect(bad.status).toBe(401);

    const res = await teamLogin({ env, request: req("/api/admin/team-login", "POST", { body: { email: "old@x.co", password: "old-pass-9" } }) });
    expect(res.status).toBe(200);
    const sc = res.headers.get("Set-Cookie")!;
    expect(sc).toMatch(/HttpOnly/); expect(sc).toMatch(/SameSite=Strict/);
    const token = cookieFrom(res).split("=")[1];
    const row = DB.raw.prepare("SELECT password_hash FROM admin_team WHERE id='t1'").get() as any;
    expect(row.password_hash).toMatch(/^pbkdf2\$/); // upgraded
    const sess = DB.raw.prepare("SELECT token FROM admin_team_sessions").all() as any[];
    expect(sess[0].token).toBe(await sha256Hex(token)); // hashed at rest

    // and that session grants exactly the granted area
    const ok = await bulkUpdate({ env, request: req("/api/admin/bulk-update", "POST", { body: { ids: ["p1"], action: "reject" }, cookie: `product_admin_session=${token}` }) });
    expect(ok.status).toBe(200);
  });
});

describe("SQL console", () => {
  it("is read-only and hides secrets", async () => {
    const cookie = await signIn();
    DB.raw.exec("INSERT INTO users (id,email,password_hash) VALUES ('u1','a@b.co','supersecrethash')");
    const q = (query: string) => sqlConsole({ env, request: req("/api/admin/database-viewer", "POST", { body: { query }, cookie }) });

    for (const bad of ["UPDATE users SET email='x'", "DROP TABLE users", "SELECT 1; DROP TABLE users", "DELETE FROM products", "WITH x AS (SELECT 1) DELETE FROM products", "INSERT INTO users VALUES ('a','b','c')"]) {
      expect((await q(bad)).status).toBe(403);
    }
    expect((DB.raw.prepare("SELECT COUNT(*) c FROM users").get() as any).c).toBe(1);

    const good = await q("SELECT id, email, password_hash FROM users");
    expect(good.status).toBe(200);
    const body: any = await good.json();
    expect(body.rows[0].email).toBe("a@b.co");
    expect(body.rows[0].password_hash).not.toContain("supersecret");
  });
});

describe("payment webhook", () => {
  const post = (payload: unknown) => webhook({ env, request: req("/api/payhero/callback", "POST", { body: payload }) });
  const order = () => DB.raw.prepare("SELECT payment_status FROM orders WHERE id='o1'").get() as any;

  beforeEach(() => {
    DB.raw.exec("INSERT INTO orders (id,total_amount,delivery_fee,buyer_phone,payment_status,status,payhero_reference) VALUES ('o1',1000,129,'0712345678','requested','confirmed','REF-1')");
  });

  const payheroSays = (status: string, amount: number) =>
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ status, amount, external_reference: "o1", mpesa_receipt_number: "ABC123" }), { status: 200 })));

  it("a FORGED 'success' message does not mark the order paid when PayHero says it isn't", async () => {
    payheroSays("PENDING", 0);
    await post({ external_reference: "o1", status: "SUCCESS", amount: 1000 });
    expect(order().payment_status).toBe("requested");
  });

  it("a forged message for an order with no payment started is ignored", async () => {
    DB.raw.exec("UPDATE orders SET payhero_reference = NULL");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await post({ external_reference: "o1", status: "SUCCESS" });
    expect(order().payment_status).toBe("requested");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("settles only when PayHero itself confirms the payment and the amount covers it", async () => {
    payheroSays("SUCCESS", 1000);
    await post({ external_reference: "o1", status: "FAILED" }); // even a lying body can't stop/force it - PayHero decides
    expect(order().payment_status).toBe("paid");
  });

  it("does not release an order when the amount paid is too small", async () => {
    payheroSays("SUCCESS", 10);
    await post({ external_reference: "o1", status: "SUCCESS", amount: 1000 });
    expect(order().payment_status).toBe("requested");
  });

  it("forged wallet top-ups are ignored too", async () => {
    DB.raw.exec(`CREATE TABLE wallet_topups (id TEXT PRIMARY KEY, user_id TEXT, amount REAL, phone_number TEXT, status TEXT, payhero_reference TEXT, updated_at TEXT);
                 CREATE TABLE user_wallets (id TEXT, user_id TEXT UNIQUE, balance REAL DEFAULT 0, total_earned REAL DEFAULT 0, total_spent REAL DEFAULT 0, created_at TEXT, updated_at TEXT);`);
    DB.raw.exec("INSERT INTO wallet_topups (id,user_id,amount,phone_number,status,payhero_reference) VALUES ('w1','u1',150000,'0712','pending','REF-W')");
    payheroSays("PENDING", 0);
    await post({ external_reference: "WALLET-w1", status: "SUCCESS", amount: 150000 });
    expect((DB.raw.prepare("SELECT status FROM wallet_topups WHERE id='w1'").get() as any).status).toBe("pending");
    expect(DB.raw.prepare("SELECT * FROM user_wallets").all()).toHaveLength(0);
  });
});
