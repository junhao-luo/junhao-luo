// With the site running locally:
// playwright-cli -s=performance open http://127.0.0.1:4173/
// playwright-cli -s=performance run-code --filename=tests/performance-check.js
async page => {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  const base = new URL('./', page.url()).href;
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    if (window.orbInstrumented) return;
    window.orbInstrumented = true;
    window.orbDraws = 0;
    window.orbInstances = 0;
    for (const name of ['drawArraysInstanced', 'drawElementsInstanced']) {
      const original = WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name] = function (...args) {
        window.orbDraws++;
        window.orbInstances = args[args.length - 1];
        return original.apply(this, args);
      };
    }
  });
  await page.setViewportSize({width: 1440, height: 900});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto(base);
  await page.locator('#languageSelect').selectOption('en');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const noOpMutations = await page.evaluate(async () => {
    const records = [];
    const observer = new MutationObserver(entries => records.push(...entries));
    observer.observe(document.documentElement, {subtree: true, characterData: true, childList: true, attributes: true});
    window.portfolioI18n.setLocale('en');
    await Promise.resolve();
    observer.disconnect();
    return records.length;
  });
  assert(noOpMutations === 0, 'Selecting the current language should not rewrite the DOM');
  const pausedSections = await page.evaluate(() => {
    const animations = document.getAnimations().filter(animation => animation.effect.target.closest('.is-offscreen'));
    return {total: animations.length, running: animations.filter(animation => animation.playState === 'running').length};
  });
  assert(pausedSections.total > 0 && pausedSections.running === 0, 'Offscreen section animations should pause');
  assert(await page.locator('.folder-panel .telemetry-status-pill, #liveRecTimecode, .folder-panel .card-live-bar').count() === 0, 'Capability cards should omit glowing badges and decorative telemetry');
  assert(await page.locator('.folder-panel.tilt-card > .card-specular-sheen[aria-hidden="true"]').count() === 3, 'All capability cards should share the profile card hover effect');
  for (const card of await page.locator('.folder-panel').all()) {
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await page.mouse.move(box.x + box.width * 0.75, box.y + box.height * 0.25);
    await page.waitForTimeout(400);
    assert(await card.evaluate(el => el.style.transform.includes('rotateX') && getComputedStyle(el.querySelector('.card-specular-sheen')).opacity === '1'), 'Hover should tilt the card and show its cursor glow');
    await page.mouse.move(0, 0);
    await page.waitForTimeout(400);
    assert(await card.evaluate(el => el.style.transform === '' && getComputedStyle(el.querySelector('.card-specular-sheen')).opacity === '0'), 'Leaving should reset the tilt and hide the glow');
  }
  const languages = await page.locator('.folder-panel').last().locator('.folder-detail-list li').allTextContents();
  assert(JSON.stringify(languages) === JSON.stringify(['中文', 'English', 'Filipino', 'Cebuano']), 'All four languages should be listed accurately');
  const english = await page.locator('h1').textContent();
  await page.locator('#languageSelect').selectOption('zh-Hant');
  assert(await page.locator('h1').textContent() !== english, 'Chinese translation should render');
  await page.locator('#languageSelect').selectOption('en');
  assert(await page.locator('h1').textContent() === english, 'English should be restored');

  await page.waitForFunction(() => window.orbDraws > 2, null, {timeout: 20000});
  assert(await page.evaluate(() => window.orbInstances) === 1800, 'Desktop particle count should be bounded');
  const start = await page.evaluate(() => ({draws: window.orbDraws, time: performance.now()}));
  await page.waitForTimeout(500);
  const end = await page.evaluate(() => ({draws: window.orbDraws, time: performance.now()}));
  const framesPerSecond = (end.draws - start.draws) / ((end.time - start.time) / 1000);
  assert(framesPerSecond <= 33, 'Background rendering should stay at or below 30 fps with timing tolerance');
  await page.emulateMedia({reducedMotion: 'reduce'});
  assert(await page.locator('.folder-panel').first().evaluate(el => getComputedStyle(el).transform === 'none'), 'Reduced motion should keep capability cards still');
  await page.waitForTimeout(150);
  const stoppedDraws = await page.evaluate(() => window.orbDraws);
  await page.waitForTimeout(300);
  assert(await page.evaluate(() => window.orbDraws) === stoppedDraws, 'Reduced motion should stop WebGL redraws');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.waitForFunction(draws => window.orbDraws > draws, stoppedDraws);
  const session = await page.context().newCDPSession(page);
  for (const feature of [{name: 'prefers-reduced-transparency', value: 'reduce'}, {name: 'prefers-contrast', value: 'more'}]) {
    await session.send('Emulation.setEmulatedMedia', {features: [feature]});
    await page.waitForTimeout(150);
    const draws = await page.evaluate(() => window.orbDraws);
    await page.waitForTimeout(250);
    assert(await page.evaluate(() => window.orbDraws) === draws, feature.name + ' should stop hidden background redraws');
  }
  await session.send('Emulation.setEmulatedMedia', {features: []});
  await session.detach();

  const connectorAligned = () => page.evaluate(() => {
    const canvas = document.getElementById('nodeCanvasArea').getBoundingClientRect();
    const path = document.getElementById('bezierTriggerToAi');
    if (!path.getAttribute('d')) return false;
    const points = [path.getPointAtLength(0), path.getPointAtLength(path.getTotalLength())];
    return ['socketTriggerOut', 'socketAiIn'].every((id, index) => {
      const socket = document.getElementById(id).getBoundingClientRect();
      return Math.abs(points[index].x - (socket.left + socket.width / 2 - canvas.left)) < 2 &&
        Math.abs(points[index].y - (socket.top + socket.height / 2 - canvas.top)) < 2;
    });
  });
  await page.locator('#nodeCanvasArea').scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  assert(await connectorAligned(), 'Workflow connector endpoints should align with their sockets');
  await page.locator('#languageSelect').selectOption('zh-Hant');
  await page.waitForTimeout(150);
  assert(await connectorAligned(), 'Translated workflow connector endpoints should remain aligned');
  await page.locator('#languageSelect').selectOption('en');

  const resources = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name));
  assert(!resources.some(url => /fonts\.(googleapis|gstatic)\.com|\/postprocessing\//.test(url)), 'Fonts should be local and bloom dependencies removed');
  await page.setViewportSize({width: 390, height: 844});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto(base);
  await page.waitForFunction(() => window.orbDraws > 2, null, {timeout: 20000});
  assert(await page.evaluate(() => window.orbInstances) === 700, 'Mobile particle count should be bounded');
  assert(errors.length === 0, 'Page should have no JavaScript errors: ' + errors.join(', '));
  return {noOpMutations, pausedSections, framesPerSecond: Math.round(framesPerSecond), motionPreferences: 'passed', simplifiedCards: 'passed', cardHover: 'passed', languages, translations: 'passed', connectors: 'passed', localFonts: 'passed', mobileParticles: 700, errors};
}
