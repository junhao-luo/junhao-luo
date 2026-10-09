const MAX_BODY_BYTES = 16_000;
const emailPattern = /^[^\s<>@,;]+@[^\s<>@,;]+\.[^\s<>@,;]+$/;
const requestIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function readBody(request) {
  if (Number(request.headers.get('content-length')) > MAX_BODY_BYTES) throw new Error('too_large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const chunks = [];
  let length = 0;
  while (true) {
    const {done, value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('origin');
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    const headers = {'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin'};
    const respond = (status, data, extra = {}) => new Response(JSON.stringify(data), {status, headers: {...headers, ...extra}});
    if (new URL(request.url).pathname !== '/api/contact') return respond(404, {error: 'not_found'});
    if (!origin || !allowed.includes(origin)) return respond(403, {error: 'forbidden'});
    headers['Access-Control-Allow-Origin'] = origin;
    if (request.method === 'OPTIONS') {
      return new Response(null, {status: 204, headers: {...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '600'}});
    }
    if (request.method !== 'POST') return respond(405, {error: 'method_not_allowed'}, {Allow: 'POST, OPTIONS'});
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return respond(415, {error: 'invalid_content_type'});

    let body;
    try {
      body = await readBody(request);
    } catch (error) {
      return respond(error.message === 'too_large' ? 413 : 400, {error: 'invalid_request'});
    }
    if (!body || typeof body !== 'object' || Array.isArray(body)) return respond(400, {error: 'invalid_request'});
    const limits = {name: 100, email: 254, channel: 200, scope: 200, message: 5000, website: 200};
    const fields = {};
    for (const [name, limit] of Object.entries(limits)) {
      const value = body[name] ?? '';
      if (typeof value !== 'string' || value.length > limit || value.includes('\0') || (name !== 'message' && /[\r\n]/.test(value))) {
        return respond(400, {error: 'invalid_fields'});
      }
      fields[name] = value.trim();
    }
    if (!['inquiry', 'connect'].includes(body.kind) || !emailPattern.test(fields.email) || typeof body.requestId !== 'string' || !requestIdPattern.test(body.requestId) ||
        (body.kind === 'inquiry' && (!fields.name || !fields.message))) return respond(400, {error: 'invalid_fields'});
    if (fields.website) return respond(200, {ok: true});
    if (!env.RESEND_API_KEY || !env.RESEND_FROM || /[\r\n]/.test(env.RESEND_FROM) || !emailPattern.test(env.CONTACT_TO || '') ||
        !env.CONTACT_RATE_LIMITER || !env.CONTACT_GLOBAL_LIMITER) return respond(503, {error: 'unavailable'});

    try {
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const perIp = await env.CONTACT_RATE_LIMITER.limit({key: ip});
      if (!perIp.success) return respond(429, {error: 'rate_limited'}, {'Retry-After': '60'});
      const global = await env.CONTACT_GLOBAL_LIMITER.limit({key: 'portfolio-contact'});
      if (!global.success) return respond(429, {error: 'rate_limited'}, {'Retry-After': '60'});
      const text = body.kind === 'inquiry'
        ? `Portfolio inquiry\n\nName: ${fields.name}\nEmail: ${fields.email}\nOther contact: ${fields.channel || 'Not provided'}\nProject type: ${fields.scope || 'Not provided'}\n\nMessage:\n${fields.message}`
        : `Portfolio contact request\n\nReply to: ${fields.email}\n\nThis visitor asked to be contacted through the website's email field. This is not a mailing-list subscription.`;
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `portfolio-${body.requestId}`},
        body: JSON.stringify({from: env.RESEND_FROM, to: [env.CONTACT_TO], reply_to: fields.email,
          subject: body.kind === 'inquiry' ? `Portfolio inquiry: ${fields.scope || fields.name}` : 'Portfolio contact request', text}),
        signal: AbortSignal.timeout(12_000)
      });
      if (!response.ok) return respond(response.status === 429 ? 429 : 502, {error: response.status === 429 ? 'rate_limited' : 'send_failed'});
      const result = await response.json();
      if (typeof result.id !== 'string' || !result.id) return respond(502, {error: 'send_failed'});
      return respond(200, {ok: true});
    } catch {
      return respond(502, {error: 'send_failed'});
    }
  }
};
