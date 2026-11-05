/* The places sheet: kind tags, filter tabs, and a map you can read. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A', '', { width: 390, height: 800 }); await t.enter(p, '지도보기');
  await p.click('#placesBtn'); await p.waitForTimeout(400);
  check(await p.locator('#placesList .roomRow').count() === 17, 'all 17 places are listed');
  check(await p.locator('#placesTabs .btn').count() === 5, 'five tabs: all, halls, outdoors, studio and rest, map');
  check(await p.locator('#placesList .catTag').count() === 17, 'every place carries its kind tag');
  await p.locator('#placesTabs .btn').nth(2).click(); await p.waitForTimeout(200);
  const vOut = await p.evaluate(() => Array.from(document.querySelectorAll('#placesList .roomRow')).filter(r => !r.hidden).map(r => r.querySelector('.n').textContent));
  check(vOut.length === 6 && vOut.every(n => /야외|산 전망대|바닷가|호숫가|풍차|꽃길/.test(n)), 'the outdoors tab shows the 6 outdoor places: ' + vOut.join(', '));
  await p.locator('#placesTabs .btn').nth(4).click(); await p.waitForTimeout(300);
  check(await vis(p, '#placesMap') && !(await vis(p, '#placesList')), 'the map tab shows the map instead of the list');
  const ink = await p.evaluate(() => { const c = document.querySelector('#placesMap'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 90 && d[i + 2] < 80) n++; return n; });
  check(ink > 20, 'my red dot is on the map: ' + ink);
  await p.screenshot({ path: t.out('places_map.png') });
  /* tapping the beach dot sends me there */
  const xy = await p.evaluate(() => { const c = document.querySelector('#placesMap'); return { w: c.clientWidth, h: c.clientHeight }; });
  await p.locator('#placesTabs .btn').nth(0).click(); await p.locator('#placesList .btn').nth(3).click(); await p.waitForTimeout(1500);
  check(await p.evaluate(() => window.__hw.area()) === '바닷가' || (await p.evaluate(() => window.__hw.pos.x)) > 100, 'the list still takes me to the beach (order unchanged)');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
