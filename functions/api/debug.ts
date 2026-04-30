// Cloudflare Pages Function - Diagnostic Tool
interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: "production",
  };

  try {
    // Step 1: Check if DB binding exists
    results.step1_db_binding = context.env.DB ? "✅ DB binding exists" : "❌ DB binding is UNDEFINED";
    
    // Step 2: Check if STORAGE binding exists
    results.step2_storage_binding = context.env.STORAGE ? "✅ STORAGE binding exists" : "❌ STORAGE binding is UNDEFINED";

    // Step 3: If DB exists, check tables
    if (context.env.DB) {
      try {
        const tables = await context.env.DB.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        ).all();
        results.step3_tables = tables.results?.map((t: any) => t.name) || [];
        results.step3_table_count = results.step3_tables.length;
      } catch (err: any) {
        results.step3_error = err.message;
      }

      // Step 4: Check users table
      try {
        const users = await context.env.DB.prepare(
          "SELECT id, email, full_name, created_at FROM users ORDER BY created_at DESC LIMIT 5"
        ).all();
        results.step4_users_count = users.results?.length || 0;
        results.step4_users_sample = users.results || [];
      } catch (err: any) {
        results.step4_error = err.message;
      }

      // Step 5: Check products table
      try {
        const products = await context.env.DB.prepare(
          "SELECT id, title, category, price, seller_id, created_at FROM products ORDER BY created_at DESC LIMIT 5"
        ).all();
        results.step5_products_count = products.results?.length || 0;
        results.step5_products_sample = products.results || [];
      } catch (err: any) {
        results.step5_error = err.message;
      }
    } else {
      results.step3_error = "Cannot check tables - DB binding is undefined";
      results.step4_error = "Cannot check users - DB binding is undefined";
      results.step5_error = "Cannot check products - DB binding is undefined";
    }

    // Step 6: Check R2 storage
    if (context.env.STORAGE) {
      try {
        const listed = await context.env.STORAGE.list({ limit: 10 });
        results.step6_r2_objects_count = listed.objects.length;
        results.step6_r2_objects_sample = listed.objects.map(o => ({
          key: o.key,
          size: o.size,
          uploaded: o.uploaded,
        }));
      } catch (err: any) {
        results.step6_error = err.message;
      }
    } else {
      results.step6_error = "Cannot check R2 - STORAGE binding is undefined";
    }

    // Step 7: Environment info
    results.step7_request_url = context.request.url;
    results.step7_request_method = context.request.method;

  } catch (err: any) {
    results.fatal_error = err.message;
    results.fatal_stack = err.stack;
  }

  return new Response(JSON.stringify(results, null, 2), {
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};
