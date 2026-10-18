import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { onRequestGet as listReviews, onRequestPost as postReview, resetReviewColumnsCache } from "./reviews/[product_id]";
import { onRequestPost as uploadReviewPhoto } from "./reviews/upload";
import { onRequestPost as pay } from "./payhero/pay";
import { onRequestGet as orderStatus } from "./payhero/order-status";
import { onRequestPut as updateOrder } from "./admin/orders";
import { onRequestGet as adminReviews, onRequestDelete as deleteReview } from "./admin/reviews";
import { resetAuthTablesCache } from "./_lib/ownerAuth";
import { descriptionBullets } from "../../src/components/ShareProduct";

function makeDb() {
  const db = new DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE products (id TEXT PRIMARY KEY, title TEXT);
    CREATE TABLE users (id TEXT PRIMARY KEY, full_name TEXT, email TEXT);
    CREATE TABLE orders (id TEXT PRIMARY KEY, buyer_id TEXT, total_amount REAL, delivery_fee REAL, buyer_phone TEXT,
      payment_status TEXT DEFAULT 'unpaid', status TEXT, payhero_reference TEXT, updated_at TEXT, delivered_at TEXT);
    CREATE TABLE order_items (id TEXT, order_id TEXT, product_id TEXT);
    CREATE TABLE order_status_history (id TEXT, order_id TEXT, status TEXT, note TEXT, created_at TEXT DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE product_reviews (id TEXT PRIMARY KEY, product_id TEXT, buyer_id TEXT, rating INT, comment TEXT,
      is_verified_purchase INT DEFAULT 0, created_at TEXT, updated_at TEXT);
  `);
  const stmt = (sql: string, args: unknown[] = []) => ({
    bind: (...a: unknown[]) => stmt(sql, a),
    run: async () => { db.prepare(sql).run(...(args as any[])); return {}; },
    first: async () => (db.prepare(sql).get(...(args as any[])) as any) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...(args as any[])) as any[] }),
    _run: () => db.prepare(sql).run(...(args as any[])),
  });
  return { raw: db, prepare: (sql: string) => stmt(sql), batch: async (list: any[]) => { for (const x of list) x._run(); return []; } } as any;
}

const ORDER = "11111111-1111-4111-8111-111111111111";
let DB: any;
let env: any;
const json = (path: string, method: string, body?: unknown, headers: Record<string, string> = {}) =>
  new Request("https://campusmart.co.ke" + path, {
    method,
    headers: { "Content-Type": "application/json", "CF-Connecting-IP": "9.9.9.9", ...headers },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

beforeEach(() => {
  resetAuthTablesCache();
  resetReviewColumnsCache();
  DB = makeDb();
  env = { DB, PAYHERO_AUTH_TOKEN: "t", PAYHERO_CHANNEL_ID: "1", STORAGE: { put: vi.fn(async () => {}) } };
  DB.raw.exec("INSERT INTO products (id,title) VALUES ('p1','Phone')");
  DB.raw.exec("INSERT INTO users (id,full_name,email) VALUES ('u1','Wanjiru Mwangi Kamau','w@x.com')");
});
afterEach(() => vi.unstubAllGlobals());

const ctx = (request: Request, params: Record<string, string> = {}) => ({ env, request, params }) as any;

describe("reviews", () => {
  const post = (body: unknown, ip = "9.9.9.9") =>
    postReview(ctx(json("/api/reviews/p1", "POST", body, { "CF-Connecting-IP": ip }), { product_id: "p1" }));

  it("an empty product has no reviews, and a customer can add one with a photo", async () => {
    expect(await (await listReviews(ctx(json("/api/reviews/p1", "GET"), { product_id: "p1" }))).json()).toEqual([]);
    const res = await post({ user_id: "u1", rating: 5, comment: "Great phone", image_url: "/api/images/reviews/abc-123.webp" });
    expect(res.status).toBe(201);
    const list = (await (await listReviews(ctx(json("/api/reviews/p1", "GET"), { product_id: "p1" }))).json()) as any[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ userName: "Wanjiru K.", rating: 5, image: "/api/images/reviews/abc-123.webp", verified: false });
  });

  it("rejects bad ratings, tiny comments, foreign image links, unknown users and duplicates", async () => {
    expect((await post({ user_id: "u1", rating: 9, comment: "Great phone" })).status).toBe(400);
    expect((await post({ user_id: "u1", rating: 4, comment: "x" })).status).toBe(400);
    expect((await post({ user_id: "u1", rating: 4, comment: "Nice one", image_url: "https://evil.example/x.png" })).status).toBe(400);
    expect((await post({ user_id: "nobody", rating: 4, comment: "Nice one" })).status).toBeGreaterThanOrEqual(400);
    expect((await post({ user_id: "u1", rating: 4, comment: "Nice one" })).status).toBe(201);
    expect((await post({ user_id: "u1", rating: 4, comment: "Again please" })).status).toBe(409);
  });

  it("marks a review verified only when a PAID order has the product", async () => {
    DB.raw.exec("INSERT INTO orders (id,buyer_id,total_amount,payment_status,status) VALUES ('o9','u1',100,'paid','processing')");
    DB.raw.exec("INSERT INTO order_items (id,order_id,product_id) VALUES ('i1','o9','p1')");
    await post({ user_id: "u1", rating: 5, comment: "Bought it, love it" });
    const list = (await (await listReviews(ctx(json("/api/reviews/p1", "GET"), { product_id: "p1" }))).json()) as any[];
    expect(list[0].verified).toBe(true);
  });

  it("limits how many reviews one address can post per hour", async () => {
    for (let i = 0; i < 6; i++) {
      DB.raw.prepare("INSERT OR IGNORE INTO users (id,full_name) VALUES (?,?)").run(`x${i}`, "A B");
      await post({ user_id: `x${i}`, rating: 3, comment: "ok product" }, "5.5.5.5");
    }
    DB.raw.prepare("INSERT INTO users (id,full_name) VALUES ('x9','A B')").run();
    expect((await post({ user_id: "x9", rating: 3, comment: "ok product" }, "5.5.5.5")).status).toBe(429);
  });
});

describe("review photo upload", () => {
  const upload = (bytes: number[], size?: number) => {
    const data = new Uint8Array(size ? new Array(size).fill(0) : bytes);
    // the jsdom test environment cannot build real multipart requests or Files, so hand the handler look-alikes
    const file = { size: data.length, arrayBuffer: async () => data.buffer };
    const request = { headers: new Headers({ "CF-Connecting-IP": "8.8.8.8" }), url: "https://campusmart.co.ke/api/reviews/upload", formData: async () => ({ get: () => file }) };
    return uploadReviewPhoto(ctx(request as any));
  };
  const webp = [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0, 0, 0, 0];

  it("stores a real image and returns a safe link", async () => {
    const res = await upload(webp);
    expect(res.status).toBe(201);
    expect(((await res.json()) as any).url).toMatch(/^\/api\/images\/reviews\/[0-9a-f-]+\.webp$/);
    expect(env.STORAGE.put).toHaveBeenCalledOnce();
  });
  it("refuses a non-image and an oversize file", async () => {
    expect((await upload([0x3c, 0x73, 0x63, 0x72, 0x69, 0x70, 0x74, 0x3e, 0, 0, 0, 0, 0, 0, 0, 0])).status).toBe(400);
    expect((await upload([], 3_000_000)).status).toBe(413);
    expect(env.STORAGE.put).not.toHaveBeenCalled();
  });
});

describe("paying right after Place Order", () => {
  beforeEach(() => {
    DB.raw.prepare("INSERT INTO orders (id,buyer_id,total_amount,buyer_phone,payment_status,status) VALUES (?,?,?,?,?,?)")
      .run(ORDER, "u1", 1129, "0712345678", "unpaid", "pending_confirmation");
  });
  const order = () => DB.raw.prepare("SELECT payment_status, payhero_reference, status FROM orders WHERE id=?").get(ORDER) as any;
  const payheroSays = (status: string, amount: number) =>
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      new Response(JSON.stringify(String(url).includes("transaction-status")
        ? { status, amount, external_reference: ORDER, mpesa_receipt_number: "RCP1" }
        : { reference: "REF-9", status: "QUEUED" }), { status: 200 })));

  it("sends the M-Pesa prompt for the order total to the order's phone", async () => {
    payheroSays("PENDING", 0);
    const res = await pay(ctx(json("/api/payhero/pay", "POST", { order_id: ORDER })));
    expect(res.status).toBe(200);
    expect(order()).toMatchObject({ payment_status: "requested", payhero_reference: "REF-9" });
    const sent = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as any).body);
    expect(sent).toMatchObject({ amount: 1129, phone_number: "254712345678", external_reference: ORDER });
  });

  it("caps repeated prompts and rejects junk ids", async () => {
    payheroSays("PENDING", 0);
    for (let i = 0; i < 6; i++) await pay(ctx(json("/api/payhero/pay", "POST", { order_id: ORDER })));
    expect((await pay(ctx(json("/api/payhero/pay", "POST", { order_id: ORDER })))).status).toBe(429);
    expect((await pay(ctx(json("/api/payhero/pay", "POST", { order_id: "1 OR 1=1" })))).status).toBe(400);
  });

  it("marks the order paid only when PayHero confirms it and the amount covers the total", async () => {
    payheroSays("PENDING", 0);
    await pay(ctx(json("/api/payhero/pay", "POST", { order_id: ORDER })));
    const poll = () => orderStatus(ctx(json(`/api/payhero/order-status?order_id=${ORDER}`, "GET")));

    payheroSays("SUCCESS", 10); // too small
    expect(((await (await poll()).json()) as any).payment_status).toBe("requested");

    payheroSays("SUCCESS", 1129);
    expect(((await (await poll()).json()) as any).payment_status).toBe("paid");
    expect(order().status).toBe("processing");
  });
});

describe("admin order tracking", () => {
  it("rejects anyone who is not signed in", async () => {
    const res = await updateOrder(ctx(json("/api/admin/orders", "PUT", { id: ORDER, status: "shipped" })));
    expect(res.status).toBe(401);
  });
  it("review moderation is admin-only", async () => {
    const admin = (path: string, method: string, body?: unknown) =>
      ctx(new Request("https://admin.campusmart.co.ke" + path, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) }));
    expect((await adminReviews(admin("/api/admin/reviews", "GET"))).status).toBe(401);
    expect((await deleteReview(admin("/api/admin/reviews", "DELETE", { id: "x" }))).status).toBe(401);
  });
});

describe("share message bullets", () => {
  it("prefers specification bullets, trimmed and capped", () => {
    const d = "A phone.\n\nSpecifications\n• Display: 6.5 inch HD\n• RAM: 4GB\n• Storage: 128GB\n• Battery: 5000mAh\n• Camera: 50MP\n\nIn the box\n• Charger";
    expect(descriptionBullets(d)).toEqual(["Display: 6.5 inch HD", "RAM: 4GB", "Storage: 128GB", "Battery: 5000mAh"]);
  });
  it("falls back to the opening sentences and returns nothing for an empty description", () => {
    expect(descriptionBullets("Lightweight and durable. Fits all laptops up to 15 inches.")).toHaveLength(2);
    expect(descriptionBullets("")).toEqual([]);
  });
});
