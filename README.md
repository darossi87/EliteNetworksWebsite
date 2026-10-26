# Elite Networks — new company website

A compact 4-page Astro site using the company's original SVG artwork, dark technical design, and a Cloudflare Worker contact endpoint.

## Local development

1. `npm install`
2. `npm run dev`
3. Open the local address shown by Astro. The site can be previewed locally, but the contact form **will not send mail** until deployed and configured.

## Deploy to Cloudflare Workers

1. Create/authorize a Cloudflare account and make sure you have permission to configure your domain.
2. Run `npx wrangler login`.
3. Run `npm run build` then `npx wrangler deploy`.
4. Set up Cloudflare Turnstile with a widget for your website. Edit the `PUBLIC_TURNSTILE_SITE_KEY` placeholder in `src/pages/contact.astro` to the real public site key. The site currently ships with a placeholder; do not go live without replacing it.
5. `npx wrangler secret put TURNSTILE_SECRET_KEY` — set the matching Turnstile secret.
6. Set up and verify the domain with Resend (or replace the Resend integration with your preferred email provider). Verify that `website@elitenetworks.net` can be used as a sender. `npx wrangler secret put RESEND_API_KEY`.
7. Confirm `CONTACT_FROM_EMAIL` and `CONTACT_TO_EMAIL` in `wrangler.jsonc`. Change FROM to your approved sending address if needed. `reply_to` uses the visitor's submitted email.
8. Configure a custom domain route for `elitenetworks.net` and `www.elitenetworks.net` after staging and testing. Preserve existing DNS/MX/SPF/DKIM/DMARC and other hostnames.
9. Optional but recommended: add a Cloudflare rate limiting binding `CONTACT_RATE_LIMITER` with appropriate per-IP limits before public launch. The Worker uses it when configured.
10. Test full form delivery, including Turnstile, failure handling, spam rejection, and email routing. Preserve important old URLs with redirects before cutover.

## Important launch notes

- No support portal is published: the company has not deployed one yet.
- Monitoring is 24/7; live support is during business hours, with emergency after-hours assistance for existing customers.
- Custom quotes are requested; prices are not published.
- There are no unverified testimonials, certifications, statistics, or compliance guarantees.
- The site is not currently deployed; it is source code for review and testing.
- Homepage illustrations use the original logo as the visual centerpiece, not an altered logo.
- The supplied SVGs are copied unmodified to `public/logos/`.
- For HIPAA-related services, copy says **HIPAA-related IT security and compliance support**, not 'HIPAA certification'.
- Consider a privacy notice and retention policy for contact inquiries before launch.
- Set up `www` canonical redirects and search engine 301 redirects separately during cutover.
