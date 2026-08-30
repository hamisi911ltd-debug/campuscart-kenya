// CJdropshipping API client (https://developers.cjdropshipping.com/api2.0/v1/)
// Field/endpoint names verified against CJ's own developer docs
// (developers.cjdropshipping.cn/en/api/) — not guessed. If CJ has changed
// something since, a 4xx from getAccessToken or search is the signal to
// recheck their docs, not silent failure.
//
// Requires a free CJdropshipping account + API key (My CJ > Authorization >
// API > API Key), stored as the CJ_API_KEY environment variable in
// Cloudflare Pages settings. Never commit the real key to the repo.

const BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1";

export interface CJEnv {
  DB: D1Database;
  CJ_API_KEY: string;
}

interface CJTokenRow {
  access_token: string;
  access_token_expiry: string;
  refresh_token: string;
  refresh_token_expiry: string;
}

async function ensureTokenTable(env: CJEnv) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS cj_auth_tokens (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      access_token TEXT NOT NULL,
      access_token_expiry TEXT NOT NULL,
      refresh_token TEXT NOT NULL,
      refresh_token_expiry TEXT NOT NULL
    )
  `).run();
}

// Access tokens last ~15 days per CJ's docs, so this caches the token in D1
// rather than re-authenticating on every request — CJ's docs note repeated
// getAccessToken calls within 24h return the same cached token anyway, but
// avoiding the extra round-trip is still worth it.
async function getAccessToken(env: CJEnv): Promise<string> {
  await ensureTokenTable(env);

  const existing = await env.DB.prepare(
    "SELECT * FROM cj_auth_tokens WHERE id = 1"
  ).first<CJTokenRow>();

  if (existing && new Date(existing.access_token_expiry).getTime() > Date.now() + 60_000) {
    return existing.access_token;
  }

  const response = await fetch(`${BASE_URL}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: env.CJ_API_KEY }),
  });

  const data: any = await response.json();
  if (!response.ok || !data?.data?.accessToken) {
    throw new Error(`CJ auth failed: ${JSON.stringify(data)}`);
  }

  const { accessToken, accessTokenExpiryDate, refreshToken, refreshTokenExpiryDate } = data.data;

  await env.DB.prepare(`
    INSERT INTO cj_auth_tokens (id, access_token, access_token_expiry, refresh_token, refresh_token_expiry)
    VALUES (1, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      access_token = excluded.access_token,
      access_token_expiry = excluded.access_token_expiry,
      refresh_token = excluded.refresh_token,
      refresh_token_expiry = excluded.refresh_token_expiry
  `).bind(accessToken, accessTokenExpiryDate, refreshToken, refreshTokenExpiryDate).run();

  return accessToken;
}

async function cjRequest(env: CJEnv, path: string, params: Record<string, string | number | undefined>) {
  const token = await getAccessToken(env);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") query.set(key, String(value));
  }

  const response = await fetch(`${BASE_URL}${path}?${query.toString()}`, {
    headers: { "CJ-Access-Token": token },
  });

  const data: any = await response.json();
  if (!response.ok) {
    throw new Error(`CJ request failed (${path}): ${JSON.stringify(data)}`);
  }
  return data;
}

export interface CJProductSummary {
  pid: string;
  name: string;
  image: string;
  sellPrice: number;
  categoryName?: string;
}

export async function searchCJProducts(
  env: CJEnv,
  opts: { keyword?: string; categoryId?: string; page?: number; pageSize?: number }
): Promise<CJProductSummary[]> {
  const data = await cjRequest(env, "/product/listV2", {
    keyWord: opts.keyword,
    categoryId: opts.categoryId,
    page: opts.page ?? 1,
    size: opts.pageSize ?? 20,
  });

  const list = data?.data?.list ?? data?.data?.content ?? [];
  return list.map((p: any) => ({
    pid: p.id ?? p.pid,
    name: p.nameEn ?? p.productNameEn,
    image: p.bigImage ?? p.productImage,
    sellPrice: Number(p.sellPrice ?? p.nowPrice ?? 0),
    categoryName: p.threeCategoryName ?? p.categoryName,
  }));
}

export interface CJProductDetail extends CJProductSummary {
  description?: string;
  images: string[];
  sku?: string;
}

export async function getCJProductDetail(env: CJEnv, pid: string): Promise<CJProductDetail> {
  const data = await cjRequest(env, "/product/query", { pid });
  const p = data?.data;
  if (!p) throw new Error(`CJ product ${pid} not found`);

  let images: string[] = [];
  try {
    images = typeof p.productImageSet === "string" ? JSON.parse(p.productImageSet) : (p.productImageSet ?? []);
  } catch {
    images = [];
  }

  return {
    pid: p.pid,
    name: p.productNameEn,
    image: p.bigImage || images[0] || "",
    images: images.length > 0 ? images : [p.bigImage].filter(Boolean),
    sellPrice: Number(p.sellPrice ?? 0),
    sku: p.productSku,
    description: p.description,
  };
}
