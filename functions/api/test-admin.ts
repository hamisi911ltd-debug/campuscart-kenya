// Simple test API to verify deployment
export async function onRequestGet() {
  return new Response(JSON.stringify({
    success: true,
    message: "Admin API is working!",
    timestamp: new Date().toISOString(),
    test: "This proves the functions are deployed correctly"
  }), {
    headers: { 
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    }
  });
}