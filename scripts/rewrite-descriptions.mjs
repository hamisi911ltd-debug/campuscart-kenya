#!/usr/bin/env node
// Writes an ORIGINAL description for every imported product (instead of the supplier's wording),
// from a terminal. Each product gets two fresh paragraphs written by Claude from the product's
// facts; the specification lists stay as they are. Safe to re-run: finished products are skipped.
//
// One-time setup: add your Anthropic API key as a Cloudflare Pages secret named ANTHROPIC_API_KEY
// (Pages project -> Settings -> Variables and Secrets -> add as Secret), then redeploy.
//
// Usage (PowerShell):
//   $env:ADMIN_PASSWORD = "your-admin-password"
//   node scripts/rewrite-descriptions.mjs
//
// The password is read from the environment only - never written to a file or logged.
// Press Ctrl+C to stop.
const SITE = (process.env.SITE || "https://admin.campusmart.co.ke").replace(/\/$/, "");
const PASSWORD = process.env.ADMIN_PASSWORD;
const WORKERS = Math.max(1, Math.min(4, Number(process.env.WORKERS || 2)));

if (!PASSWORD) {
  console.error('Set your admin password first, e.g. in PowerShell:\n  $env:ADMIN_PASSWORD = "your-password"\n  node scripts/rewrite-descriptions.mjs');
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
  console.log(`Writing original descriptions for ${total} imported products, ${WORKERS} at a time. Ctrl+C to stop.\n`);

  let done = 0;
  let updated = 0;
  let skipped = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    for (let p = queue.shift(); p && !stopping; p = queue.shift()) {
      try {
        const r = await call("POST", "/api/admin/rewrite-description", { productId: p.id });
        const d = await r.json().catch(() => ({}));
        if (r.status === 503) { console.error(d.error); process.exit(1); }
        if (r.ok && d.success) updated++; else skipped++;
      } catch {
        skipped++;
      }
      done++;
      if (done % 25 === 0 || done === total) console.log(`[${done}/${total}] updated ${updated}, already done/skipped ${skipped}`);
      await sleep(250);
    }
  }));
  console.log(`\nDone. Wrote ${updated} descriptions; ${skipped} were already done or skipped.`);
}

main().catch((err) => { console.error(err.message); process.exit(1); });
