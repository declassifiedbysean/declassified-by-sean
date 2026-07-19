/* ==========================================================================
   DECLASSIFIED — /api/knock (Cloudflare Pages Function)
   The doorbell. A player taps "Knock" on any page; this forwards it to the
   Discord community server so Sean (and the clubhouse) hear it in real time.

   Setup (one time, free):
     1. In the Discord server: Channel settings → Integrations → Webhooks →
        New Webhook (point it at the #knocks channel) → Copy Webhook URL.
     2. Cloudflare dashboard → Pages → declassified-by-sean → Settings →
        Variables and Secrets → add secret  KNOCK_WEBHOOK  = that URL.
   Until the secret exists, this returns 503 and the widget says the bell
   isn't wired yet. No webhook URL ever lives in the repo.
   ========================================================================== */

const MAX_NOTE = 280;

export async function onRequestPost({ request, env }) {
  const json = (status, body) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  if (!env.KNOCK_WEBHOOK) return json(503, { ok: false, error: 'bell-not-wired' });

  let data;
  try { data = await request.json(); } catch { return json(400, { ok: false, error: 'bad-json' }); }

  // Honeypot: real widget never fills this field — bots do.
  if (data.website) return json(200, { ok: true });

  const clean = s => String(s || '').replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
  const note = clean(data.note).slice(0, MAX_NOTE);
  const page = clean(data.page).slice(0, 80) || '/';
  const country = request.cf && request.cf.country ? request.cf.country : '??';

  const lines = [
    `🚪 **Knock!** Someone played and wanted you to know.`,
    `📄 Page: \`${page}\`  ·  🌍 ${country}`,
  ];
  if (note) lines.push(`💬 “${note}”`);

  const res = await fetch(env.KNOCK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: lines.join('\n'),
      allowed_mentions: { parse: [] }, // notes can never ping @everyone/roles
    }),
  });

  return res.ok ? json(200, { ok: true }) : json(502, { ok: false, error: 'delivery-failed' });
}

export function onRequest({ request }) {
  // Anything but POST → 405 (GET probes, etc.)
  if (request.method === 'POST') return undefined;
  return new Response(JSON.stringify({ ok: false, error: 'method-not-allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json', Allow: 'POST' },
  });
}
