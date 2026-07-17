// Shared wallet top-up settlement, used by the PayHero webhook
// (functions/api/payhero/callback.ts) and the top-up status poll
// (functions/api/wallet/topup.ts GET) so there is exactly one place that
// credits a customer wallet when an M-Pesa top-up succeeds.
import type { ParsedCallback } from "./payhero";

interface Env {
  DB: D1Database;
}

export interface WalletTopupRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
}

// Defensively create the wallet tables (D1 has no migrations guarantee here).
export async function ensureWalletTables(env: Env): Promise<void> {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS user_wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT UNIQUE NOT NULL,
      balance REAL DEFAULT 0.00,
      total_earned REAL DEFAULT 0.00,
      total_spent REAL DEFAULT 0.00,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      balance_before REAL NOT NULL,
      balance_after REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS wallet_topups (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      phone_number TEXT,
      payhero_reference TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

// Returns the user's wallet row, creating it (balance 0) if it doesn't exist.
export async function getOrCreateWallet(env: Env, userId: string) {
  let wallet = await env.DB.prepare(
    "SELECT id, balance, total_earned, total_spent FROM user_wallets WHERE user_id = ?"
  ).bind(userId).first();

  if (!wallet) {
    const walletId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO user_wallets (id, user_id, balance, total_earned, total_spent)
      VALUES (?, ?, 0, 0, 0)
    `).bind(walletId, userId).run();
    wallet = { id: walletId, balance: 0, total_earned: 0, total_spent: 0 };
  }

  return wallet;
}

// Credits a customer wallet from a completed M-Pesa top-up. Idempotent: a
// top-up already marked completed/failed is ignored so repeated callbacks or a
// manual status re-check can't double-credit.
export async function settleWalletTopup(env: Env, topupId: string, parsed: ParsedCallback): Promise<boolean> {
  await ensureWalletTables(env);

  const topup = await env.DB.prepare(
    "SELECT id, user_id, amount, status FROM wallet_topups WHERE id = ?"
  ).bind(topupId).first<WalletTopupRow>();

  if (!topup) return false;
  if (topup.status === "completed" || topup.status === "failed") return false;
  if (parsed.status === "unknown") return false;

  if (parsed.status === "success") {
    const wallet = await getOrCreateWallet(env, topup.user_id);
    const amount = Number(topup.amount);
    const balanceBefore = Number(wallet.balance);
    const balanceAfter = Math.round((balanceBefore + amount) * 100) / 100;

    await env.DB.prepare(`
      UPDATE user_wallets
      SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(balanceAfter, amount, topup.user_id).run();

    await env.DB.prepare(`
      INSERT INTO wallet_transactions
        (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
      VALUES (?, ?, 'credit', ?, ?, 'topup', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      topup.user_id,
      amount,
      `M-Pesa top-up${parsed.receiptNumber ? ` · ${parsed.receiptNumber}` : ""}`,
      topup.id,
      balanceBefore,
      balanceAfter
    ).run();

    await env.DB.prepare(
      "UPDATE wallet_topups SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(topup.id).run();

    return true;
  }

  // parsed.status === "failed"
  await env.DB.prepare(
    "UPDATE wallet_topups SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id = ?"
  ).bind(topup.id).run();

  return true;
}
