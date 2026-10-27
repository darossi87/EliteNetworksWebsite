import type { APIRoute } from 'astro';

export const prerender = false;

const ALLOWED = new Set([
  'Managed IT Services', 'Cybersecurity', 'Microsoft 365 & Cloud',
  'Networks & Infrastructure', 'Backup & Disaster Recovery',
  'Business Phone Systems', 'General IT / Other'
]);

const json = (data: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
  });

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

export const POST: APIRoute = async ({ request }) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const to = process.env.CONTACT_TO_EMAIL || 'sales@elitenetworks.net';

  if (!secret || !resendKey || !from) {
    console.error('Contact form environment variables missing');
    return json({ error: 'Contact form is not configured yet. Please email us directly.' }, 503);
  }
  if (request.headers.get('content-type')?.split(';')[0] !== 'application/json')
    return json({ error: 'Expected a JSON submission.' }, 415);
  if (Number(request.headers.get('content-length') || 0) > 10000)
    return json({ error: 'Submission is too large.' }, 413);

  let body: Record<string, unknown>;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid submission.' }, 400); }

  const name = clean(body.name, 100);
  const email = clean(body.email, 254);
  const company = clean(body.company, 120);
  const message = clean(body.message, 4000);
  const service = clean(body.service, 100);
  const token = clean(body['cf-turnstile-response'], 4000);

  if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.length < 10 || !ALLOWED.has(service) || !token)
    return json({ error: 'Complete all required fields and spam verification.' }, 400);

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  const verifyBody = new FormData();
  verifyBody.set('secret', secret);
  verifyBody.set('response', token);
  if (ip) verifyBody.set('remoteip', ip);

  try {
    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', body: verifyBody
    });
    if (!result.ok) return json({ error: 'Spam verification service unavailable. Please retry.' }, 503);
    const verified = await result.json() as { success?: boolean; hostname?: string; 'error-codes'?: string[] };
    if (!verified.success) {
      console.error('Turnstile Siteverify rejected token', { codes: verified['error-codes'] || [], verifiedHostname: verified.hostname || null });
      return json({ error: 'Spam verification failed. Please retry the check.' }, 400);
    }
    // Cloudflare Turnstile already enforces the hostnames configured on the widget.
    // Do not compare Siteverify hostname to request.url: behind Vercel's proxy
    // those can legitimately differ (custom domains and preview deployments).
    // If your security policy requires a separate allowlist, compare against
    // explicit trusted hostnames instead of the incoming request URL.
  } catch (err) {
    console.error('Turnstile verification request failed', err);
    return json({ error: 'Spam verification temporarily unavailable.' }, 503);
  }

  const safe = (value: string) => value.replace(/[\r\n]/g, ' ').trim();
  const emailText = `New Elite Networks website inquiry\n\nService: ${safe(service)}\nName: ${safe(name)}\nBusiness email: ${safe(email)}\nCompany: ${safe(company) || 'Not provided'}\n\nMessage:\n${message}\n`;
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to], reply_to: email,
        subject: `Website Inquiry - ${safe(service)}`, text: emailText
      })
    });
    if (!result.ok) {
      console.error('Resend rejected email', result.status, (await result.text()).slice(0, 500));
      return json({ error: 'Unable to send email right now. Please email us directly.' }, 502);
    }
  } catch (err) {
    console.error('Resend network failure', err);
    return json({ error: 'Email delivery temporarily unavailable.' }, 503);
  }
  return json({ ok: true });
};
