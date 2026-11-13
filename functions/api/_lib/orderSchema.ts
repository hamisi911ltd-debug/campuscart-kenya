// Makes sure the order tables have every column the shop writes to.
//
// The production database was created before several features existed, and the SQL migrations in
// /migrations were never all run against it - so placing an order failed with
// "table order_items has no column named product_title". Instead of depending on someone running
// migrations by hand, checkout adds any missing column itself, once per server instance.
interface Env {
  DB: D1Database;
}

const REQUIRED: Record<string, Array<[string, string]>> = {
  orders: [
    ["delivery_fee", "REAL DEFAULT 0"],
    ["payment_status", "TEXT DEFAULT 'unpaid'"],
    ["payhero_reference", "TEXT"],
    ["confirmed_at", "TEXT"],
    ["confirmed_by", "TEXT"],
    ["delivery_latitude", "REAL"],
    ["delivery_longitude", "REAL"],
    ["buyer_phone", "TEXT"],
    ["notes", "TEXT"],
    ["delivered_at", "TEXT"],
  ],
  order_items: [
    ["product_title", "TEXT"],
    ["product_image", "TEXT"],
  ],
};

let ready = false;
export const resetOrderSchemaCache = () => { ready = false; };

export async function ensureOrderColumns(env: Env): Promise<void> {
  if (ready) return;
  try {
    for (const [table, columns] of Object.entries(REQUIRED)) {
      const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
      const have = new Set((results || []).map((r) => r.name));
      if (have.size === 0) continue; // table missing entirely - the insert will report that clearly
      for (const [name, type] of columns) {
        if (!have.has(name)) {
          try { await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${name} ${type}`).run(); }
          catch (err) { console.error(`Could not add ${table}.${name}:`, err); }
        }
      }
    }
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS order_status_history (
      id TEXT PRIMARY KEY, order_id TEXT NOT NULL, status TEXT NOT NULL, note TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP)`).run();
    ready = true;
  } catch (err) {
    console.error("ensureOrderColumns failed:", err);
  }
}
