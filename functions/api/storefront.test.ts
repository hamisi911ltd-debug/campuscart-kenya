import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// What the "original Kilimall listing" says in these tests (set per test).
const live = vi.hoisted(() => ({ inStock: null as boolean | null, throws: false }));
vi.mock("./_lib/kilimall", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./_lib/kilimall")>()),
  fetchKilimallHtml: async () => { if (live.throws) throw new Error("Kilimall unreachable"); return "<html></html>"; },
  parseProductPage: () => ({ inStock: live.inStock, stock: live.inStock ? 5 : 0 }),
}));
import { resetAvailabilityCache } from "./_lib/availability";
import { resetOrderSchemaCache } from "./_lib/orderSchema";
import { onRequestPost as availability } from "./availability";
import { DatabaseSync } from "node:sqlite";
import { onRequestGet as listReviews, onRequestPost as postReview, resetReviewColumnsCache } from "./reviews/[product_id]";
import { onRequestPost as uploadReviewPhoto } from "./reviews/upload";
import { onRequestPost as pay } from "./payhero/pay";
import { onRequestGet as orderStatus } from "./payhero/order-status";
import { onRequestPut as updateOrder } from "./admin/orders";
import { onRequestGet as adminReviews, onRequestDelete as deleteReview } from "./admin/reviews";
import { onRequestPost as checkout } from "./checkout";
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
  resetAvailabilityCache();
  resetOrderSchemaCache();
  live.inStock = null;
  live.throws = false;
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

describe("checkout", () => {
  const place = (extra: Record<string, unknown> = {}) =>
    checkout({ env, request: json("/api/checkout", "POST", {
      buyer_id: "u1", items: [{ product_id: "p1", quantity: 2, price: 1 }], county: "Nairobi", town: "CBD",
      delivery_address: "Moi Ave", buyer_phone: "0712345678", ...extra,
    }) } as any);

  beforeEach(() => {
    DB.raw.exec("PRAGMA foreign_keys = ON");
    DB.raw.exec("ALTER TABLE products ADD COLUMN price REAL; ALTER TABLE products ADD COLUMN is_available INT DEFAULT 1; ALTER TABLE products ADD COLUMN image_url TEXT; ALTER TABLE products ADD COLUMN images TEXT; ALTER TABLE products ADD COLUMN category TEXT;");
    DB.raw.exec("UPDATE products SET price = 500");
    DB.raw.exec("ALTER TABLE users ADD COLUMN password_hash TEXT; ALTER TABLE users ADD COLUMN phone_number TEXT; ALTER TABLE users ADD COLUMN is_admin INT");
    DB.raw.exec("ALTER TABLE orders ADD COLUMN seller_id TEXT REFERENCES users(id); ALTER TABLE orders ADD COLUMN delivery_address TEXT; ALTER TABLE orders ADD COLUMN delivery_latitude REAL; ALTER TABLE orders ADD COLUMN delivery_longitude REAL; ALTER TABLE orders ADD COLUMN notes TEXT");
    DB.raw.exec("ALTER TABLE order_items ADD COLUMN product_title TEXT; ALTER TABLE order_items ADD COLUMN product_image TEXT; ALTER TABLE order_items ADD COLUMN quantity INT; ALTER TABLE order_items ADD COLUMN price_at_purchase REAL");
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
  });

  it("charges the catalogue price, not the price the browser sent", async () => {
    const res = await place();
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.subtotal).toBe(1000);
    expect(data.total_amount).toBe(1129);
    expect(data.order_number).toBe("CM" + data.order_id.slice(-8));
  });

  const linkProduct = () => {
    DB.raw.exec("CREATE TABLE IF NOT EXISTS product_sources (product_id TEXT PRIMARY KEY, source TEXT, listing_id TEXT, source_url TEXT, source_price REAL, source_list_price REAL, markup_percent REAL, source_stock INT, in_stock INT, checked_at TEXT, image_width INT)");
    DB.raw.exec("INSERT OR REPLACE INTO product_sources (product_id, source, listing_id, source_url) VALUES ('p1','kilimall','12345','https://www.kilimall.co.ke/listing/12345')");
  };

  it("refuses the order, with the item named, when the original listing is out of stock", async () => {
    linkProduct();
    live.inStock = false;
    const res = await place();
    expect(res.status).toBe(409);
    const data = (await res.json()) as any;
    expect(data.error).toMatch(/out of stock/);
    expect(data.unavailable).toEqual(["p1"]);
    expect(DB.raw.prepare("SELECT COUNT(*) AS n FROM orders").get().n).toBe(0);
  });

  it("places an automatically confirmed order when the listing is in stock", async () => {
    linkProduct();
    live.inStock = true;
    const res = await place();
    expect(res.status).toBe(200);
    expect(DB.raw.prepare("SELECT status FROM orders").get().status).toBe("confirmed");
  });

  it("places the order even when the live database predates the product_title column (the D1_ERROR customers hit)", async () => {
    DB.raw.exec("DROP TABLE order_items");
    DB.raw.exec("CREATE TABLE order_items (id TEXT, order_id TEXT, product_id TEXT, quantity INT, price_at_purchase REAL)");
    const res = await place();
    expect(res.status).toBe(200);
    const cols = DB.raw.prepare("PRAGMA table_info(order_items)").all().map((r: any) => r.name);
    expect(cols).toContain("product_title");
    expect(DB.raw.prepare("SELECT product_title FROM order_items").get().product_title).toBeTruthy();
  });

  it("does not block the order when the supplier page cannot be read", async () => {
    linkProduct();
    live.throws = true;
    expect((await place()).status).toBe(200);
  });

  it("tells the checkout page which items are out of stock", async () => {
    linkProduct();
    live.inStock = false;
    const res = await availability({ env, request: json("/api/availability", "POST", { product_ids: ["p1"] }) } as any);
    expect(((await res.json()) as any).items[0]).toMatchObject({ product_id: "p1", status: "unavailable" });
    expect((await availability({ env, request: json("/api/availability", "POST", { product_ids: [] }) } as any)).status).toBe(400);
  });

  it("still places the order when the account id is not in the database", async () => {
    const res = await place({ buyer_id: "google-12345" });
    expect(res.status).toBe(200);
  });

  it("rejects unavailable products with a clear message", async () => {
    DB.raw.exec("UPDATE products SET is_available = 0");
    const res = await place();
    expect(res.status).toBe(400);
    expect(((await res.json()) as any).error).toMatch(/no longer available/);
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

import { splitDescription, cleanIntro, onRequestPost as rewriteDescription } from "./admin/rewrite-description";

describe("original descriptions", () => {
  it("separates the free-text intro from the specification sections", () => {
    const { intro, rest } = splitDescription("Supplier blurb.\n\nSpecifications\n• RAM: 4GB\n\nIn the box\n• Charger");
    expect(intro).toBe("Supplier blurb.");
    expect(rest.startsWith("Specifications")).toBe(true);
    expect(rest).toContain("In the box");
    expect(splitDescription("Only text").rest).toBe("");
  });
  it("rejects text that is too short, links to other shops, or markdown-heavy", () => {
    const good = "A reliable everyday phone that handles WhatsApp, M-Pesa and video calls with ease. ".repeat(2);
    expect(cleanIntro(good)).not.toBeNull();
    expect(cleanIntro("Too short.")).toBeNull();
    expect(cleanIntro(good + " Buy at kilimall.co.ke")).toBeNull();
    expect(cleanIntro("**Bold** " + good)).not.toContain("*");
  });
  it("is admin-only", async () => {
    const res = await rewriteDescription({ env, request: new Request("https://admin.campusmart.co.ke/api/admin/rewrite-description", { method: "POST", body: JSON.stringify({ productId: "p1" }), headers: { "Content-Type": "application/json" } }) } as any);
    expect(res.status).toBe(401);
  });
});

import { sellPriceFor, effectiveMarkupPercent } from "./_lib/pricing";
import { sellPriceFor as clientSellPriceFor } from "../../src/data/pricing";

describe("pricing rule", () => {
  it("adds a flat KES 120 under KES 1,000 and 13% from KES 1,000", () => {
    expect(sellPriceFor(200)).toBe(320);
    expect(sellPriceFor(999)).toBe(1119);
    expect(sellPriceFor(1000)).toBe(1130);
    expect(sellPriceFor(3000)).toBe(3390);
    expect(effectiveMarkupPercent(200)).toBe(60);
  });
  it("the shop and the server agree", () => {
    for (const cost of [99, 500, 999, 1000, 1234, 25000]) expect(clientSellPriceFor(cost)).toBe(sellPriceFor(cost));
  });
});

describe("WhatsApp receipt after payment", () => {
  it("sends the customer a full receipt once PayHero confirms the payment", async () => {
    env.TWILIO_ACCOUNT_SID = "ACtest";
    env.TWILIO_AUTH_TOKEN = "token";
    env.TWILIO_WHATSAPP_FROM = "+14155238886";
    DB.raw.exec("ALTER TABLE order_items ADD COLUMN product_title TEXT; ALTER TABLE order_items ADD COLUMN quantity INT; ALTER TABLE order_items ADD COLUMN price_at_purchase REAL");
    DB.raw.prepare("INSERT INTO orders (id,buyer_id,total_amount,delivery_fee,buyer_phone,payment_status,status,payhero_reference) VALUES (?,?,?,?,?,?,?,?)")
      .run(ORDER, "u1", 1129, 129, "0712345678", "requested", "confirmed", "REF-1");
    DB.raw.prepare("INSERT INTO order_items (id,order_id,product_id,product_title,quantity,price_at_purchase) VALUES ('i1',?,'p1','Phone X 128GB',2,500)").run(ORDER);

    const fetchMock = vi.fn(async (url: string) =>
      new Response(JSON.stringify(String(url).includes("transaction-status")
        ? { status: "SUCCESS", amount: 1129, external_reference: ORDER, mpesa_receipt_number: "RCP99" }
        : {}), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await orderStatus(ctx(json(`/api/payhero/order-status?order_id=${ORDER}`, "GET")));
    expect(((await res.json()) as any).payment_status).toBe("paid");

    const twilio = fetchMock.mock.calls.find((c) => String(c[0]).includes("api.twilio.com"));
    expect(twilio).toBeTruthy();
    const sent = new URLSearchParams(String((twilio![1] as any).body));
    expect(sent.get("To")).toBe("whatsapp:+254712345678");
    const text = sent.get("Body") || "";
    expect(text).toContain("CM" + ORDER.slice(-8));
    expect(text).toContain("RCP99");
    expect(text).toContain("Phone X 128GB");
    expect(text).toContain("Total paid: KES 1,129");
  });
});
