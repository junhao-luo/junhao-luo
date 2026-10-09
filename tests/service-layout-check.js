// Run with the site open in playwright-cli:
// playwright-cli -s=performance run-code --filename=tests/service-layout-check.js
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL('./', page.url()).href);
  await page.emulateMedia({reducedMotion: 'no-preference'});
  const results = [];
  const positions = () => page.evaluate(() => [...document.querySelectorAll('#contact, .contact-header-wrap, #contactForm, #siteFooter')]
    .map(el => el.getBoundingClientRect().top + scrollY));
  const reset = async () => {
    await page.mouse.move(0, 0);
    await page.evaluate(() => {
      document.activeElement?.blur();
      document.querySelectorAll('.staggered-action-pill').forEach(el => el.setAttribute('aria-expanded', 'false'));
    });
    await page.waitForTimeout(450);
  };
  for (const locale of ['en', 'zh-Hant']) {
    await page.locator('#languageSelect').selectOption(locale);
    for (const width of [320, 390, 768, 1024, 1440, 1920]) {
      await page.setViewportSize({width, height: 1000});
      await page.evaluate(() => document.fonts.ready);
      await reset();
      const closed = await positions();
      let maxShift = 0;
      const checkStable = async () => {
        const current = await positions();
        maxShift = Math.max(maxShift, ...current.map((value, index) => Math.abs(value - closed[index])));
        assert(maxShift < 1, `${locale} ${width}px: expanding services moved the content below by ${maxShift}px`);
      };
      const cards = await page.locator('.staggered-action-pill').all();
      for (const card of cards) {
        await card.locator('.pill-main-row').hover();
        await page.waitForTimeout(450);
        await checkStable();
        const details = card.locator('.pill-popout-desc');
        assert(await details.evaluate(el => getComputedStyle(el).opacity === '1' && el.clientHeight + 1 >= el.scrollHeight), 'Expanded description should be fully readable');
        await reset();
        await checkStable();
      }
      for (const card of cards) {
        await card.focus();
        await card.press('Enter');
        assert(await card.getAttribute('aria-expanded') === 'true', 'Enter should open the service');
        await page.waitForTimeout(450);
        await checkStable();
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Opening services must not introduce horizontal overflow');
      await reset();
      await checkStable();
      results.push({locale, width, maxShift});
    }
  }
  assert(errors.length === 0, 'Page should have no JavaScript errors: ' + errors.join(', '));
  return {results, hover: 'passed', keyboard: 'passed', descriptions: 'passed', errors};
}
