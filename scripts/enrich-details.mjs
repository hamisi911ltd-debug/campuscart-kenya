#!/usr/bin/env node
// Adds full details (description, specifications, options, what's in the box) to every imported
// product, from a terminal - the same as Admin -> Products -> "Add more details to all", without
// needing a browser tab open.
//
// Usage (PowerShell):
//   $env:ADMIN_PASSWORD = "your-admin-password"
//   node scripts/enrich-details.mjs
//
// The password is read from the environment only - never written to a file or logged.
// Safe to re-run any time. Press Ctrl+C to stop.

const SITE = (process.env.SITE || "https://admin.campusmart.co.ke").replace(/\/$/, "");
const PASSWORD = process.env.ADMIN_PASSWORD;
const WORKERS = Math.max(1, Math.min(4, Number(process.env.WORKERS || 3)));

if (!PASSWORD) {
  console.error('Set your admin password first, e.g. in PowerShell:\n  $env:ADMIN_PASSWORD = "your-password"\n  node scripts/enrich-details.mjs');
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
  console.log(`Adding details to ${total} imported products, ${WORKERS} at a time. Ctrl+C to stop.\n`);

  let done = 0;
  let updated = 0;
  let skipped = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    for (let p = queue.shift(); p && !stopping; p = queue.shift()) {
      try {
        const r = await call("POST", "/api/admin/enrich-details", { productId: p.id });
        const d = await r.json().catch(() => ({}));
        if (r.ok && d.success) updated++; else skipped++;
      } catch {
        skipped++;
      }
      done++;
      if (done % 25 === 0 || done === total) console.log(`[${done}/${total}] updated ${updated}, nothing new/gone ${skipped}`);
      await sleep(250);
    }
  }));
  console.log(`\nDone. Updated ${updated} products; ${skipped} had nothing new or are no longer on Kilimall.`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
