// Test Lucky Codes System

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env } = context;

  try {
    // Test if tables exist by trying to query them
    const tablesTest = await env.DB.prepare(`
      SELECT name FROM sqlite_master WHERE type='table' AND name IN ('lucky_codes', 'user_wallets', 'wallet_transactions', 'lucky_code_redemptions')
    `).all();

    const existingTables = tablesTest.results.map((row: any) => row.name);
    
    // If tables don't exist, create them
    if (existingTables.length < 4) {
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
        CREATE INDEX IF NOT EXISTS idx_lucky_codes_code ON lucky_codes(code)
      `).run();

      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_lucky_code_redemptions_user_id ON lucky_code_redemptions(user_id)
      `).run();
    }

    // Insert test lucky codes if none exist
    const existingCodes = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM lucky_codes
    `).first();

    if (!existingCodes || (existingCodes as any).count === 0) {
      const testCodes = [
        { code: 'WELCOME500', points: 500, description: 'Welcome bonus - Get 500 points (KES 50) in your wallet!' },
        { code: 'STUDENT100', points: 100, description: 'Student discount - Get 100 points (KES 10) in your wallet!' },
        { code: 'LUCKY250', points: 250, description: 'Lucky draw winner - Get 250 points (KES 25) in your wallet!' },
        { code: 'CAMPUS200', points: 200, description: 'Campus special - Get 200 points (KES 20) in your wallet!' },
        { code: 'FLASH300', points: 300, description: 'Flash sale bonus - Get 300 points (KES 30) in your wallet!' }
      ];

      for (const testCode of testCodes) {
        const id = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT OR IGNORE INTO lucky_codes (id, code, points, description, usage_limit, is_active, created_at)
          VALUES (?, ?, ?, ?, 1000, 1, CURRENT_TIMESTAMP)
        `).bind(id, testCode.code, testCode.points, testCode.description).run();
      }
    }

    // Get all lucky codes
    const allCodes = await env.DB.prepare(`
      SELECT code, points, description, usage_limit, used_count, is_active 
      FROM lucky_codes 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      message: 'Lucky codes system is ready!',
      tablesExist: existingTables,
      testCodes: allCodes.results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Test lucky codes error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      message: 'Failed to test lucky codes system'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}