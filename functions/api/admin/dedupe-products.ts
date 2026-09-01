// Cloudflare Pages Function - find & remove duplicate products (admin-only).
// "Duplicate" means same title (case/whitespace-insensitive) and same
// category - the oldest listing in each group is kept, the rest are
// deleted. GET returns a dry-run preview; POST actually deletes.
import { enforceAdminDomain } from "../_lib/adminDomain";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

interface ProductRow {
  id: string;
  title: string;
  category: string;
  image_url: string | null;
  images: string | null;
  created_at: string;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
}

function extractR2Key(url: string): string | null {
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

async function findDuplicateGroups(env: Env) {
  const { results } = await env.DB.prepare(
    "SELECT id, title, category, image_url, images, created_at FROM products ORDER BY created_at ASC"
  ).all<ProductRow>();

  const byKey = new Map<string, ProductRow[]>();
  for (const row of results || []) {
    const key = `${normalizeTitle(row.title)}|${row.category}`;
    const group = byKey.get(key) || [];
    group.push(row);
    byKey.set(key, group);
  }

  const groups: { title: string; category: string; keepId: string; removeIds: string[] }[] = [];
  for (const group of byKey.values()) {
    if (group.length < 2) continue;
    const [keep, ...rest] = group; // oldest first (ORDER BY created_at ASC)
    groups.push({
      title: keep.title,
      category: keep.category,
      keepId: keep.id,
      removeIds: rest.map((r) => r.id),
    });
  }

  const removeRows = groups.flatMap((g) => g.removeIds);
  return { groups, removeRows, allRows: results || [] };
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { groups, removeRows } = await findDuplicateGroups(env);
    return new Response(JSON.stringify({
      success: true,
      duplicateGroups: groups.length,
      productsToRemove: removeRows.length,
      groups: groups.map((g) => ({ title: g.title, category: g.category, count: g.removeIds.length + 1 })),
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking for duplicate products:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to check for duplicates",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { groups, allRows } = await findDuplicateGroups(env);
    const byId = new Map(allRows.map((r) => [r.id, r]));

    const keysToDelete: string[] = [];
    let removed = 0;

    for (const group of groups) {
      for (const id of group.removeIds) {
        const row = byId.get(id);
        if (!row) continue;

        if (row.image_url) {
          const key = extractR2Key(row.image_url);
          if (key) keysToDelete.push(key);
        }
        if (row.images) {
          try {
            for (const url of JSON.parse(row.images)) {
              const key = extractR2Key(url);
              if (key) keysToDelete.push(key);
            }
          } catch {
            // malformed images JSON - nothing to clean up for it
          }
        }

        // Same NOT NULL / ON DELETE SET NULL contradiction as elsewhere -
        // drop referencing order_items first so the delete doesn't fail
        // outright for a duplicate that was ever ordered.
        await env.DB.prepare("DELETE FROM order_items WHERE product_id = ?").bind(id).run();
        await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
        removed++;
      }
    }

    for (let i = 0; i < keysToDelete.length; i += 1000) {
      const batch = keysToDelete.slice(i, i + 1000);
      try {
        await env.STORAGE.delete(batch);
      } catch (e) {
        console.warn("Failed to delete a batch of R2 images:", e);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Removed ${removed} duplicate product(s) across ${groups.length} group(s)`,
      removed,
      groupsCleaned: groups.length,
      imagesDeleted: keysToDelete.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error removing duplicate products:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to remove duplicates",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
