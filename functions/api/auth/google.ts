// Cloudflare Pages Function - Google OAuth Handler
export async function onRequestPost({ env, request }: any) {
  const { code, redirect_uri } = await request.json();

  // Get credentials from environment variables
  const clientId = env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
  const clientSecret = env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET";

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return Response.json({ error: "Failed to exchange code" }, { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const payload = JSON.parse(atob(tokenData.id_token.split(".")[1]));
  const email = payload.email;
  const name = payload.name || email.split("@")[0];
  const picture = payload.picture || null;

  if (!email) {
    return Response.json({ error: "No email from Google" }, { status: 400 });
  }

  let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

  if (!user) {
    const id = crypto.randomUUID();
    await env.DB.prepare(
      "INSERT INTO users (id, email, password_hash, full_name, profile_image_url, is_seller, is_active, is_admin) VALUES (?, ?, '', ?, ?, 0, 1, 0)"
    ).bind(id, email, name, picture).run();

    user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();

    await env.DB.prepare(
      "INSERT INTO user_settings (id, user_id) VALUES (?, ?)"
    ).bind(crypto.randomUUID(), id).run();
  } else {
    await env.DB.prepare(
      "UPDATE users SET last_login = datetime('now'), profile_image_url = COALESCE(?, profile_image_url) WHERE id = ?"
    ).bind(picture, user.id).run();
  }

  return Response.json({
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
