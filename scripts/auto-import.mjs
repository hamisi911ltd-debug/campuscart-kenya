#!/usr/bin/env node
// Auto-import from Kilimall, run from a terminal (no browser tab needed).
//
// Signs in to your admin with your password, then repeats: find 200 new mixed products ->
// import them three at a time -> repeat, until the target is reached. Products land in
// their right categories at the fixed 10% markup, exactly like the admin page's
// "Start auto-import" button - but this keeps full speed because a terminal isn't
// throttled the way a background browser tab is.
//
// Usage (PowerShell):
//   $env:ADMIN_PASSWORD = "your-admin-password"
//   node scripts/auto-import.mjs 5000
//
// The password is read from the environment only - it is never written to a file or logged.
// Press Ctrl+C to stop cleanly. Re-run any time: products already imported are skipped.

const SITE = (process.env.SITE || "https://admin.campusmart.co.ke").replace(/\/$/, "");
const PASSWORD = process.env.ADMIN_PASSWORD;
const TARGET = Math.max(1, Number(process.argv[2] || process.env.TARGET || 5000));
const WORKERS = Math.max(1, Math.min(6, Number(process.env.WORKERS || 3)));

if (!PASSWORD) {
  console.error('Set your admin password first, e.g. in PowerShell:\n  $env:ADMIN_PASSWORD = "your-password"\n  node scripts/auto-import.mjs 5000');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let stopping = false;
process.on("SIGINT", () => {
  if (stopping) process.exit(130);
  stopping = true;
  console.log("\nStopping after the products in progress finish (press Ctrl+C again to quit now)...");
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
    const why = res.status === 429 ? "Too many failed attempts - wait 15 minutes."
      : res.status === 503 ? "Admin sign-in isn't set up (ADMIN_PASSWORD secret missing in Cloudflare)."
      : data.error || `HTTP ${res.status}`;
    throw new Error(`Sign-in failed: ${why}`);
  }
  cookie = (res.headers.get("set-cookie") || "").split(";")[0];
  if (!cookie.startsWith("admin_session=")) throw new Error("Sign-in succeeded but no session cookie came back.");
}

// POST to an admin endpoint; signs in again if the session has ended (sessions last 12 h).
async function post(path, body) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${SITE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, Origin: SITE },
      body: JSON.stringify(body),
    });
    if (res.status === 401 && attempt === 0) { await login(); continue; }
    return res;
  }
}

const started = Date.now();
let imported = 0;
let failed = 0;
let rounds = 0;
let consecutiveFails = 0;
let reason = "";

const rate = () => {
  const minutes = (Date.now() - started) / 60000;
  return minutes > 0.2 ? (imported / minutes).toFixed(1) : "-";
};

async function importOne(item) {
  try {
    const res = await post("/api/admin/kilimall-import", {
      listingId: item.listingId,
      category: item.category || "auto",
      fallbackPrice: item.price,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409) return; // already imported
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    imported++;
    consecutiveFails = 0;
    console.log(`[${imported}/${TARGET}] ${data.category.padEnd(11)} KES ${String(data.price).padStart(6)}  ${String(data.title).slice(0, 48)}   (${rate()}/min)`);
  } catch (err) {
    failed++;
    consecutiveFails++;
    console.log(`   skipped ${item.listingId}: ${err.message}`);
    if (consecutiveFails >= 5) await sleep(Math.min(30000, consecutiveFails * 1500)); // back off when things look wrong
  }
}

async function main() {
  console.log(`Signing in to ${SITE} ...`);
  await login();
  console.log(`Signed in. Target: ${TARGET} new products, ${WORKERS} at a time. Ctrl+C to stop.\n`);

  let emptyRounds = 0;
  let discoverFails = 0;

  while (!stopping && imported < TARGET) {
    rounds++;
    let fresh = [];
    try {
      const res = await post("/api/admin/kilimall-discover", { perCategory: 20 });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      fresh = data.items.filter((i) => !i.alreadyImported);
      discoverFails = 0;
      console.log(`\n-- round ${rounds}: found ${fresh.length} new products (${imported} imported so far)`);
    } catch (err) {
      console.log(`-- round ${rounds}: couldn't reach Kilimall (${err.message}); retrying in 20s`);
      if (++discoverFails >= 20) { reason = "Stopped: Kilimall kept failing."; break; }
      await sleep(20000);
      continue;
    }

    if (fresh.length === 0) {
      if (++emptyRounds >= 12) { reason = "Finished: nothing new left to find."; break; }
      continue;
    }
    emptyRounds = 0;

    const queue = fresh.slice(0, TARGET - imported);
    await Promise.all(Array.from({ length: WORKERS }, async () => {
      for (let item = queue.shift(); item && !stopping && consecutiveFails < 40; item = queue.shift()) {
        await importOne(item);
        await sleep(200);
      }
    }));
    if (consecutiveFails >= 40) { reason = "Stopped: imports kept failing (storage full? signed out?)."; break; }
    await sleep(1000);
  }

  if (!reason) reason = stopping ? "Stopped by you." : imported >= TARGET ? "Finished: target reached." : "Finished.";
  const mins = ((Date.now() - started) / 60000).toFixed(1);
  console.log(`\n${reason}\nImported ${imported} new products (${failed} skipped) in ${mins} minutes.`);
}

main().catch((err) => {
  console.error(`\n${err.message}`);
  console.log(`Imported ${imported} before stopping.`);
  process.exit(1);
});
