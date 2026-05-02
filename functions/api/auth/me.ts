// Cloudflare Pages Function - Get Current User
export async function onRequestGet({ env, request }: any) {
  const authHeader = request.headers.get("Authorization");
  const userId = authHeader?.replace("Bearer ", "");

  if (!userId) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();

  if (!user) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      profile_image_url: user.profile_image_url,
      is_seller: user.is_seller,
      is_admin: user.is_admin,
      location: user.location,
    },
  });
}
