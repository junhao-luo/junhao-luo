import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../email-worker/contact.mjs';

const requestId = '00cd1254-9b85-4675-840b-42aa7a45ddda';
const payload = {kind: 'inquiry', name: 'Portfolio Visitor', email: 'visitor@example.com', channel: '@visitor', scope: 'Automation', message: 'Please help connect my tools.', website: '', requestId};
const environment = () => ({RESEND_API_KEY: 'test-secret', RESEND_FROM: 'Portfolio <portfolio@eljhon.me>', CONTACT_TO: 'eljhonstevesatsat@gmail.com', ALLOWED_ORIGINS: 'https://eljhon.me',
  CONTACT_RATE_LIMITER: {limit: async () => ({success: true})}, CONTACT_GLOBAL_LIMITER: {limit: async () => ({success: true})}});
const request = (body = payload, options = {}) => new Request('https://email.example/api/contact', {
  method: 'POST', headers: {'Origin': 'https://eljhon.me', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1'}, body: JSON.stringify(body), ...options
});
const neverSend = t => t.mock.method(globalThis, 'fetch', () => { assert.fail('This request must not reach Resend'); });

test('delivers an inquiry to the fixed owner inbox with visitor reply-to and retry protection', async t => {
  let sent;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.resend.com/emails');
    assert.equal(options.headers.Authorization, 'Bearer test-secret');
    assert.equal(options.headers['Idempotency-Key'], 'portfolio-' + requestId);
    sent = JSON.parse(options.body);
    return Response.json({id: 'test-message-id'});
  });
  const response = await worker.fetch(request({...payload, to: 'attacker@example.com', from: 'attacker@example.com', message: '<script>test</script>'}), environment());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true});
  assert.deepEqual(sent.to, ['eljhonstevesatsat@gmail.com']);
  assert.equal(sent.from, 'Portfolio <portfolio@eljhon.me>');
  assert.equal(sent.reply_to, payload.email);
  assert.equal(sent.subject, 'Portfolio inquiry: Automation');
  assert.ok(sent.text.includes('Other contact: @visitor'));
  assert.ok(sent.text.includes('<script>test</script>'));
  assert.equal(sent.html, undefined);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'https://eljhon.me');
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('footer requests send a contact request without creating a subscription', async t => {
  t.mock.method(globalThis, 'fetch', async (_, options) => {
    const sent = JSON.parse(options.body);
    assert.equal(sent.subject, 'Portfolio contact request');
    assert.ok(sent.text.includes('not a mailing-list subscription'));
    assert.deepEqual(sent.to, ['eljhonstevesatsat@gmail.com']);
    return Response.json({id: 'test-message-id'});
  });
  const response = await worker.fetch(request({kind: 'connect', email: 'visitor@example.com', requestId}), environment());
  assert.equal(response.status, 200);
});

test('rejects untrusted and missing origins before contacting Resend', async t => {
  neverSend(t);
  for (const origin of ['https://other.example', '']) {
    const response = await worker.fetch(request(payload, {headers: {'Origin': origin, 'Content-Type': 'application/json'}}), environment());
    assert.equal(response.status, 403);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  }
});

test('handles CORS preflight, unsupported paths and methods', async t => {
  neverSend(t);
  const env = environment();
  const options = await worker.fetch(request(undefined, {method: 'OPTIONS', body: null}), env);
  assert.equal(options.status, 204);
  assert.equal(options.headers.get('Access-Control-Allow-Methods'), 'POST');
  assert.equal((await worker.fetch(request(undefined, {method: 'GET', body: null}), env)).status, 405);
  assert.equal((await worker.fetch(new Request('https://email.example/'), env)).status, 404);
});

test('rejects malformed JSON, content types and oversized streamed bodies', async t => {
  neverSend(t);
  const env = environment();
  assert.equal((await worker.fetch(request(null, {body: '{invalid'}), env)).status, 400);
  assert.equal((await worker.fetch(request(payload, {headers: {'Origin': 'https://eljhon.me', 'Content-Type': 'text/plain'}}), env)).status, 415);
  assert.equal((await worker.fetch(request(payload, {body: 'a'.repeat(16001)}), env)).status, 413);
  assert.equal((await worker.fetch(request(payload, {headers: {'Origin': 'https://eljhon.me', 'Content-Type': 'application/json', 'Content-Length': '16001'}}), env)).status, 413);
});

test('validates fields and blocks header injection', async t => {
  neverSend(t);
  for (const override of [{name: ''}, {message: ''}, {name: 'a'.repeat(101)}, {email: 'not-email'}, {email: 'x@example.com\r\nBcc: other@example.com'}, {scope: 'Project\r\nBcc: other@example.com'}, {message: 'a'.repeat(5001)}, {channel: {}}, {requestId: 'bad'}, {requestId: [requestId]}, {kind: 'subscribe'}]) {
    assert.equal((await worker.fetch(request({...payload, ...override}), environment())).status, 400, JSON.stringify(override));
  }
});

test('honeypot submissions do not send mail', async t => {
  neverSend(t);
  const response = await worker.fetch(request({...payload, website: 'spam.example'}), environment());
  assert.equal(response.status, 200);
});

test('missing configuration fails safely', async t => {
  neverSend(t);
  for (const field of ['RESEND_API_KEY', 'RESEND_FROM', 'CONTACT_TO', 'CONTACT_RATE_LIMITER', 'CONTACT_GLOBAL_LIMITER']) {
    const env = environment();
    delete env[field];
    assert.equal((await worker.fetch(request(), env)).status, 503, field);
  }
});

test('IP and global limits reject abuse before sending', async t => {
  neverSend(t);
  for (const field of ['CONTACT_RATE_LIMITER', 'CONTACT_GLOBAL_LIMITER']) {
    const env = environment();
    env[field].limit = async ({key}) => {
      assert.equal(key, field === 'CONTACT_RATE_LIMITER' ? '192.0.2.1' : 'portfolio-contact');
      return {success: false};
    };
    const response = await worker.fetch(request(), env);
    assert.equal(response.status, 429);
    assert.equal(response.headers.get('Retry-After'), '60');
  }
});

test('upstream failures never expose provider details or pretend success', async t => {
  let upstream = () => Response.json({message: 'private provider detail'}, {status: 403});
  t.mock.method(globalThis, 'fetch', async () => upstream());
  let response = await worker.fetch(request(), environment());
  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), {error: 'send_failed'});
  upstream = () => Response.json({id: null});
  assert.equal((await worker.fetch(request(), environment())).status, 502);
  upstream = () => Response.json({message: 'rate limited'}, {status: 429});
  assert.equal((await worker.fetch(request(), environment())).status, 429);
  upstream = () => { throw new DOMException('Timed out', 'TimeoutError'); };
  assert.equal((await worker.fetch(request(), environment())).status, 502);
});
