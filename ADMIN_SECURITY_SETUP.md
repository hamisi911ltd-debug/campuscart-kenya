# Admin security - one-time setup (REQUIRED)

The old admin password was written in this (public) repository and in the website's
own code, and the "login" cookie could be forged by anyone. That password must be
treated as **compromised**. Sign-in now works only with a secret you set in Cloudflare.

## Do this once

1. Cloudflare dashboard -> **Workers & Pages** -> your project -> **Settings** -> **Variables and Secrets** (Production).
2. Add a **secret** named `ADMIN_PASSWORD` - a NEW password, 12+ characters, never used anywhere else.
   (Do **not** reuse the old one.)
3. Optional: add `ADMIN_EMAIL` (your admin email, used only to double-check if you type it on the login form).
4. **Deployments** -> latest deployment -> **Retry deployment** (variables only take effect on a new deployment).
5. Open `https://admin.campusmart.co.ke/admin/login`, leave the email blank, enter the new password.

Until `ADMIN_PASSWORD` is set, admin sign-in is switched off (it fails closed).

## What changed

- Server-side sessions: random 256-bit token, only its hash is stored; HttpOnly, Secure, SameSite=Strict cookie; 12 h.
- Failed logins are rate-limited (8 per 15 min per address) for both the owner and team logins.
- Team passwords: salted PBKDF2 (old accounts are upgraded on their next sign-in); session tokens stored hashed.
- Every admin endpoint now checks a real session. The old `admin_session=true` cookie and the
  `Authorization` / `X-Admin-Session` headers no longer work.
- Payment webhook: never trusted. Payments/top-ups are confirmed with PayHero's API and the amount is checked.
- SQL console is read-only and hides password/token columns. Debug, test, lucky-code and open-upload endpoints were removed.
- Security headers added (HSTS, nosniff, frame, referrer, permissions policies).

## Also recommended

- Keep Cloudflare tokens/keys only in Cloudflare secrets (never in files in the repo).
- Make the GitHub repository **private** (Settings -> General -> Danger zone) - the old password is in its history.
