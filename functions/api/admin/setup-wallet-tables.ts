// Database Setup for Wallet System

interface Env {
  DB: D1Database;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.includes("admin_session=true");
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Create user_wallets table
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

    // Create wallet_transactions table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
        amount REAL NOT NULL,
        description TEXT NOT NULL,
        reference_type TEXT,
        reference_id TEXT,
        balance_before REAL NOT NULL,
        balance_after REAL NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create lucky_codes table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lucky_codes (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        points REAL NOT NULL,
        description TEXT NOT NULL,
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        expires_at TEXT,
        is_active INTEGER DEFAULT 1,
        created_by TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create lucky_code_redemptions table
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS lucky_code_redemptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        lucky_code_id TEXT NOT NULL,
        points_earned REAL NOT NULL,
        redeemed_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lucky_code_id)
      )
    `).run();

    // Create indexes
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id)
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(type)
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_lucky_codes_code ON lucky_codes(code)
    `).run();

    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_lucky_code_redemptions_user_id ON lucky_code_redemptions(user_id)
    `).run();

    // Insert a sample lucky code for testing
    const sampleId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT OR IGNORE INTO lucky_codes (id, code, points, description, usage_limit, is_active, created_at)
      VALUES (?, 'WELCOME500', 500, 'Welcome bonus - Get 500 points (KES 50) in your wallet!', 1000, 1, CURRENT_TIMESTAMP)
    `).bind(sampleId).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Wallet system tables created successfully',
      sampleCode: 'WELCOME500 (gives 500 points = KES 50)'
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error setting up wallet tables:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to setup wallet tables",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}