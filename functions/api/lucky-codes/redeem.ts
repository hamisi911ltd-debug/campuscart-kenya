// Lucky Code Redemption API

interface Env {
  DB: D1Database;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const { code, userId } = await request.json();

    if (!code || !userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Code and user ID are required'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // First, ensure all tables exist
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

    // Insert default lucky codes if none exist
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

    // Get lucky code from database
    const luckyCode = await env.DB.prepare(`
      SELECT id, code, points, description, usage_limit, used_count, expires_at, is_active
      FROM lucky_codes 
      WHERE UPPER(code) = UPPER(?) AND is_active = 1
    `).bind(code).first();

    if (!luckyCode) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid lucky code'
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Validate lucky code
    const now = new Date().toISOString();
    
    if (luckyCode.expires_at && luckyCode.expires_at < now) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This lucky code has expired'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    if (luckyCode.usage_limit && luckyCode.used_count >= luckyCode.usage_limit) {
      return new Response(JSON.stringify({
        success: false,
        error: 'This lucky code has reached its usage limit'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Check if user has already redeemed this code
    const existingRedemption = await env.DB.prepare(`
      SELECT id FROM lucky_code_redemptions 
      WHERE user_id = ? AND lucky_code_id = ?
    `).bind(userId, luckyCode.id).first();

    if (existingRedemption) {
      return new Response(JSON.stringify({
        success: false,
        error: 'You have already redeemed this lucky code'
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Get or create user wallet
    let wallet = await env.DB.prepare(`
      SELECT id, balance FROM user_wallets WHERE user_id = ?
    `).bind(userId).first();

    if (!wallet) {
      // Create wallet for user
      const walletId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO user_wallets (id, user_id, balance, total_earned, created_at)
        VALUES (?, ?, 0, 0, CURRENT_TIMESTAMP)
      `).bind(walletId, userId).run();
      
      wallet = { id: walletId, balance: 0 };
    }

    const oldBalance = parseFloat(wallet.balance.toString());
    const newBalance = oldBalance + parseFloat(luckyCode.points.toString());

    // Start transaction
    try {
      // Update wallet balance
      await env.DB.prepare(`
        UPDATE user_wallets 
        SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(newBalance, luckyCode.points, userId).run();

      // Record wallet transaction
      await env.DB.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after, created_at)
        VALUES (?, ?, 'credit', ?, ?, 'lucky_code', ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        crypto.randomUUID(),
        userId,
        luckyCode.points,
        `Lucky code redeemed: ${luckyCode.code}`,
        luckyCode.id,
        oldBalance,
        newBalance
      ).run();

      // Record redemption
      await env.DB.prepare(`
        INSERT INTO lucky_code_redemptions (id, user_id, lucky_code_id, points_earned, redeemed_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        crypto.randomUUID(),
        userId,
        luckyCode.id,
        luckyCode.points
      ).run();

      // Update lucky code usage count
      await env.DB.prepare(`
        UPDATE lucky_codes 
        SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(luckyCode.id).run();

      return new Response(JSON.stringify({
        success: true,
        points: parseFloat(luckyCode.points.toString()),
        newBalance: newBalance,
        message: `You earned ${luckyCode.points} points (KES ${(luckyCode.points / 10).toFixed(2)}) in your wallet!`
      }), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (transactionError) {
      console.error('Transaction error:', transactionError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to process redemption',
        details: transactionError.message
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

  } catch (error) {
    console.error('Lucky code redemption error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}