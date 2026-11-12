#!/usr/bin/env node
// Re-prices EVERY imported product to the current pricing rule (supplier cost under KES 1,000:
// +KES 120; KES 1,000 and over: +13%), from a terminal. It does the same as Admin -> Products ->
// "Apply standard pricing", without needing a browser tab open. Each product's live supplier
// price is re-read from Kilimall, so prices also follow supplier changes. Safe to re-run.
//
// Usage (PowerShell):
//   $env:ADMIN_PASSWORD = "your-admin-password"
//   node scripts/reprice-all.mjs
//
// The password is read from the environment only - never written to a file or logged.
// Press Ctrl+C to stop.

const SITE = (process.env.SITE || "https://admin.campusmart.co.ke").replace(/\/$/, "");
const PASSWORD = process.env.ADMIN_PASSWORD;
const WORKERS = Math.max(1, Math.min(4, Number(process.env.WORKERS || 3)));

if (!PASSWORD) {
  console.error('Set your admin password first, e.g. in PowerShell:\n  $env:ADMIN_PASSWORD = "your-password"\n  node scripts/reprice-all.mjs');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let stopping = false;
process.on("SIGINT", () => {
  if (stopping) process.exit(130);
  stopping = true;
  console.log("\nStopping after the products in progress finish (Ctrl+C again to quit now)...");
});

let cookie = "";

async function login() {
  const res = await fetch(`${SITE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: SITE },
    body: JSON.stringify({ password: PASSWORD }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const why = res.status === 429 ? "Too many failed attempts - wait 15 minutes." : data.error || `HTTP ${res.status}`;
    throw new Error(`Sign-in failed: ${why}`);
  }
  cookie = (res.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie.startsWith("admin_session=")) throw new Error("Sign-in succeeded but no session cookie came back.");
}

async function call(method, path, body) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${SITE}${path}`, {
      method,
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: SITE },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401 && attempt === 0) { await login(); continue; }
    return res;
  }
}

async function main() {
  console.log(`Signing in to ${SITE} ...`);
  await login();
  const res = await call("GET", "/api/admin/products");
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Could not load products (HTTP ${res.status})`);
  const queue = (data.products || []).filter((p) => p.src_listing_id);
  const total = queue.length;
  console.log(`Re-pricing ${total} imported products, ${WORKERS} at a time. Ctrl+C to stop.\n`);

  let done = 0;
  let updated = 0;
  let failed = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    for (let p = queue.shift(); p && !stopping; p = queue.shift()) {
      try {
        const r = await call("POST", "/api/admin/kilimall-check", { productId: p.id, apply: true });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.success) updated++; else failed++;
      } catch {
        failed++;
      }
      done++;
      if (done % 25 === 0 || done === total) console.log(`[${done}/${total}] re-priced ${updated}, could not update ${failed}`);
      await sleep(250);
    }
  }));
  console.log(`\nDone. Re-priced ${updated} products; ${failed} could not be updated (the Kilimall listing may be gone).`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
