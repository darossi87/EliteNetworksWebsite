# Elite Networks — Vercel contact form update

This folder matches the public GitHub repository `darossi87/EliteNetworksWebsite` and replaces the Cloudflare Worker-only contact integration with an Astro on-demand Vercel function. Keep existing `src` pages and branding.

## Upload to GitHub

Use the **patch zip** to replace these exact paths in your repository:

- `astro.config.mjs` (replace)
- `package.json` (replace)
- `src/pages/contact.astro` (replace)
- `src/pages/api/contact.ts` (new)

You can alternatively upload the **full updated site**. Do not upload any `.env` secrets to GitHub. Keep `worker.js` and `wrangler.jsonc` only if you still need the old Cloudflare deploy; neither is used by Vercel.

## Vercel Project → Settings → Environment Variables

- `RESEND_API_KEY`: Resend API key, secret
- `TURNSTILE_SECRET_KEY`: Cloudflare Turnstile secret (NOT the Resend key), secret
- `PUBLIC_TURNSTILE_SITE_KEY`: Cloudflare Turnstile *public site key*, config/text
- `CONTACT_TO_EMAIL`: `sales@elitenetworks.net`, config/text
- `CONTACT_FROM_EMAIL`: a verified sender identity in your Resend account, e.g. `Elite Networks Website <website@notifications.elitenetworks.net>` (only if you have verified that domain)

Check the Cloudflare Turnstile widget accepts the Vercel hostname(s) where testing occurs, as well as your eventual custom domain. Set variables for both Production and Preview if needed. Redeploy after adding or updating variables.

## Notes

- Astro pages remain static; `/api/contact` is the only server-rendered route.
- Vercel should auto-detect Astro; build command `npm run build`, output preset auto.
- Do not create a Vercel rewrite redirecting `/api/contact` elsewhere.
- Open Browser DevTools → Network → `contact` and examine response JSON and status. `200` means accepted by Resend; email receipt still depends on delivery.
- Form responses and backend errors never expose secrets to visitors; diagnostic specifics appear in Vercel Runtime Logs.
- The code does not implement rate limiting. Turnstile reduces spam but is not a substitute for rate limiting in a production form.
