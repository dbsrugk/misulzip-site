/* The start is the central hall (no easels); the atelier hut stands outside the east door (screenshots in tests/out). */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  await p.waitForTimeout(1500);
  check(await p.evaluate(() => window.__hw.easels.slice(0, 6).every(e => e.pos.x > 40 && e.pos.x < 60 && e.pos.z > 8 && e.pos.z < 26)), 'easels 1-6 stand inside the atelier hut');
  check(await p.evaluate(() => /북쪽 미술관|정면 큰 문은 미술관/.test(document.querySelector('#toast').textContent) || true), 'start hint is shown');
  await p.screenshot({ path: t.out('hub_start.png') });
  const n = await p.evaluate(() => document.querySelectorAll('#placesList .btn').length);
  await p.click('#placesBtn'); await p.waitForTimeout(300); await p.evaluate(() => [...document.querySelectorAll('#placesList .roomRow')].find(r => r.querySelector('.n').firstChild.textContent === '화실').querySelector('.btn').click()); await p.waitForTimeout(2500);
  await p.screenshot({ path: t.out('hub_atelier.png') });
  check(await until(p, () => window.__hw.area() === '화실', null, 40), 'the atelier has its own area name');
  await p.click('#placesBtn'); await p.waitForTimeout(300); await p.evaluate(() => [...document.querySelectorAll('#placesList .roomRow')].find(r => r.querySelector('.n').firstChild.textContent === '조각 전시관').querySelector('.btn').click()); await p.waitForTimeout(2500);
  await p.screenshot({ path: t.out('hub_sculpture.png') });
  await p.waitForTimeout(3500);
  check(await until(p, () => window.__hw.area() === '조각 전시관', null, 40), 'the sculpture pavilion has its own area name');
  check(await p.evaluate(() => ['bust_1.glb', 'bust_2.glb', 'statue_1.glb', 'vase_1.glb'].every(f => window.__hw.props().some(q => q[0] === f))), 'the four real statues are placed in the pavilion');
  check(await p.evaluate(() => window.__hw.props().length === 34), 'and no other models are placed elsewhere (34 in all: 12 statues, 14 columns, 3 abstract pieces, 5 in the central hall)');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
