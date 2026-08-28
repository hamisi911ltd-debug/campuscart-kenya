// Single-vendor store: every product/order attaches to this one fixed
// "owner" user row instead of a real signed-up seller. Keeps the existing
// NOT NULL seller_id FKs on products/orders satisfied without a schema change.
interface Env {
  DB: D1Database;
}

export const OWNER_ID = "store-owner";

const OWNER_NAME = "CampusMart";
const OWNER_EMAIL = "store-owner@campusmart.local";
const OWNER_PHONE = "254108254465";

export async function ensureOwnerUser(env: Env): Promise<void> {
  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, password_hash, full_name, phone_number, is_admin)
     VALUES (?, ?, '', ?, ?, 1)`
  ).bind(OWNER_ID, OWNER_EMAIL, OWNER_NAME, OWNER_PHONE).run();
}
