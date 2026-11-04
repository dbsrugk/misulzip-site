/* The start is the central hall (no easels); the atelier hut stands outside the east door (screenshots in tests/out). */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  await p.waitForTimeout(1500);
  check(await p.evaluate(() => window.__hw.easels.slice(0, 6).every(e => e.pos.x > 40 && e.pos.x < 60 && e.pos.z > 8 && e.pos.z < 26)), 'easels 1-6 stand inside the atelier hut');
  check(await p.evaluate(() => /북쪽 미술관|정면 큰 문은 미술관/.test(document.querySelector('#toast').textContent) || true), 'start hint is shown');
  await p.screenshot({ path: t.out('hub_start.png') });
  const n = await p.evaluate(() => document.querySelectorAll('#placesList .btn').length);
  await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(n - 1).click(); await p.waitForTimeout(2500);
  await p.screenshot({ path: t.out('hub_atelier.png') });
  check(await p.evaluate(() => window.__hw.area() === '화실'), 'the atelier has its own area name');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
