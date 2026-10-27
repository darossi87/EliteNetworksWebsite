# Elite Networks — Turnstile verification fix for Vercel

Replace `src/pages/api/contact.ts` in the GitHub repository with the file here. Commit to `main` and wait for Vercel to redeploy.

Changes:
- Keeps Turnstile Siteverify verification mandatory.
- Removes comparison of Turnstile verified hostname to Vercel request URL (can be different behind reverse proxies / previews).
- Logs Cloudflare Siteverify error codes in server logs on failure, without logging secrets or visitor tokens.

In Vercel Settings > Environment Variables, ensure TURNSTILE_SECRET_KEY is the **secret from the same Turnstile widget** as PUBLIC_TURNSTILE_SITE_KEY, and is not your Resend API key.

In Cloudflare Turnstile widget settings, include every site hostname you use, such as your production custom domain and any actual Vercel preview hostname.

After redeployment test again. If still failing, inspect Vercel Runtime Logs for `Turnstile Siteverify rejected token`. Common codes: `invalid-input-secret` (wrong secret), `invalid-input-response` (bad token), and `timeout-or-duplicate` (expired/reused token). A displayed widget success alone does not confirm server-side Siteverify success.
