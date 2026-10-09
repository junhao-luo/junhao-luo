// playwright-cli -s=contact open http://127.0.0.1:4173/
// playwright-cli -s=contact run-code --filename=tests/contact-form-check.js
// Responses are intercepted: this check never sends real email.
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  const requests = [];
  let responseStatus = 502;
  let responseBody = {error: 'send_failed'};
  let delay = 0;
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/contact', async route => {
    requests.push(route.request().postDataJSON());
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    await route.fulfill({status: responseStatus, contentType: 'application/json', body: JSON.stringify(responseBody)});
  });
  await page.reload();
  await page.locator('#languageSelect').selectOption('en');
  await page.locator('#formName').fill('Browser Test');
  await page.locator('#formEmail').fill('visitor@example.com');
  await page.locator('#formChannel').fill('@visitor');
  await page.locator('#formScope').fill('Automation');
  await page.locator('#submitBtn').click();
  assert(requests.length === 0, 'Message is required before sending');
  await page.locator('#formMessage').fill('Please connect my tools.');
  await page.locator('#submitBtn').click();
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('could not be sent'));
  assert(await page.locator('#formName').inputValue() === 'Browser Test', 'Failed sends must retain input');
  assert(!await page.locator('#submitBtn').isDisabled(), 'Failed sends must allow retry');
  assert(requests[0].kind === 'inquiry' && requests[0].channel === '@visitor' && requests[0].message === 'Please connect my tools.', 'All inquiry details should be sent');

  responseStatus = 200;
  responseBody = {ok: true};
  delay = 300;
  await page.locator('#submitBtn').click();
  await page.waitForFunction(() => document.getElementById('submitBtn').disabled);
  assert(await page.locator('#submitBtn').getAttribute('aria-busy') === 'true', 'Sending state should be accessible');
  await page.locator('#languageSelect').selectOption('zh-Hant');
  assert((await page.locator('#submitBtn').textContent()).includes('傳送中'), 'Sending label should track the selected language');
  await page.locator('#contactForm').evaluate(form => form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true})));
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('你的詢問已送出'));
  assert(requests.length === 2, 'Duplicate submissions should be blocked');
  assert(requests[0].requestId === requests[1].requestId, 'Unchanged retries should use the same idempotency key');
  assert(await page.locator('#formName').inputValue() === '', 'Success should reset the inquiry form');
  assert((await page.locator('#submitBtn').textContent()).includes('傳送詢問'), 'Button label should recover after success');

  delay = 0;
  responseStatus = 429;
  responseBody = {error: 'rate_limited'};
  await page.locator('#footerEmailInput').fill('visitor@example.com');
  await page.locator('#footerEmailInput').press('Enter');
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('請求次數過多'));
  assert(await page.locator('#footerEmailInput').inputValue() === 'visitor@example.com', 'Rate limits should preserve the footer address');
  const limitedId = requests[2].requestId;
  responseStatus = 200;
  responseBody = {ok: true};
  await page.locator('#footerConnectBtn').click();
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('你的聯絡請求已送出'));
  assert(requests[3].kind === 'connect' && requests[3].email === 'visitor@example.com', 'Footer should send a contact request');
  assert(requests[3].requestId === limitedId, 'Footer retry should reuse its idempotency key');
  assert(await page.locator('#footerEmailInput').inputValue() === '', 'Footer should reset after success');

  await page.locator('#languageSelect').selectOption('en');
  await page.locator('#formName').fill('Another Visitor');
  await page.locator('#formEmail').fill('another@example.com');
  await page.locator('#formMessage').fill('New inquiry.');
  responseStatus = 200;
  responseBody = {ok: false};
  await page.locator('#submitBtn').click();
  await page.waitForFunction(() => document.getElementById('toast').textContent.includes('could not be sent'));
  assert(await page.locator('#formMessage').inputValue() === 'New inquiry.', 'Malformed success responses should not discard the message');
  assert(requests[4].requestId !== requests[0].requestId, 'New submissions should have a new idempotency key');

  await page.unroute('**/api/contact');
  await page.route('**/api/contact', route => route.abort());
  await page.locator('#submitBtn').click();
  await page.waitForFunction(() => !document.getElementById('submitBtn').disabled);
  assert(await page.locator('#formMessage').inputValue() === 'New inquiry.', 'Network failures should preserve input');
  assert(errors.length === 0, 'No JavaScript errors expected: ' + errors.join(', '));
  await page.unroute('**/api/contact');
  await page.locator('#contactForm').evaluate(form => form.reset());
  return {inquiry: 'passed', footer: 'passed', validation: 'passed', retryProtection: 'passed', duplicateProtection: 'passed', translatedFeedback: 'passed', rateLimitFeedback: 'passed', networkFailure: 'passed', errors};
}
