/* Leaving an emoji on a frame: it floats up for me and for a friend in the same room. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const a = await t.client('A', '', { width: 390, height: 800 }); await t.enter(a, '반응이');
  const b = await t.client('B'); await t.enter(b, '구경이');
  const mi = await a.evaluate(() => window.__hw.slots.findIndex(q => q.room === 'museum' && q.cat && q.cat.id === 'monalisa'));
  check(mi >= 0, 'a masterpiece frame exists');
  await a.evaluate(i => window.__hw.tapSlot(i), mi); await a.waitForTimeout(800);
  check(await vis(a, '#art'), 'the art view is open');
  check(await a.locator('#rxBarA .rxBtn').count() === 5, 'five reaction buttons under the description');
  const f0 = await b.evaluate(() => window.__hw.fx());
  await a.locator('#rxBarA .rxBtn').nth(0).click();
  check(await a.evaluate(() => window.__hw.fx()) > 0, 'the emoji floats up in front of the frame for me');
  
  check(await until(b, f => window.__hw.fx() > f, f0, 20), 'a friend in the room sees the emoji too');
  /* the fountain: tapping it tosses a coin and shows a wish */
  const f1 = await a.evaluate(() => { document.querySelector('#artClose').click(); return window.__hw.fx(); });
  await a.evaluate(() => window.__hw.wish()); await a.waitForTimeout(300);
  check(await a.evaluate(() => window.__hw.fx()) >= f1 + 3, 'a coin and sparkles fly up from the fountain');
  check(/풍덩/.test(await a.evaluate(() => document.querySelector('#toast').textContent)), 'a wish pops up');
  check(await a.evaluate(() => window.__hw.spots()) === 7, 'the Pieta, windmill, lake, lighthouse, sailboat, viewpoint and garden bust can be tapped for a note');
  /* the sculptures in the pavilion open the same docent view and take reactions */
  check(await a.evaluate(() => window.__hw.sculpts()) === 5, 'five sculpture pieces can be tapped');
  await a.evaluate(() => window.__hw.tapSculpt(0)); await a.waitForTimeout(500);
  check(await vis(a, '#art') && /피에타/.test(await a.textContent('#artTitle')) && (await a.textContent('#artText')).length > 30, 'tapping the Pieta opens its description');
  check(/미켈란젤로/.test(await a.textContent('#artMeta')), 'the artist is shown');
  const f2 = await b.evaluate(() => window.__hw.fx()); await a.locator('#rxBarA .rxBtn').nth(1).click();
  check(await until(b, f => window.__hw.fx() > f, f2, 20), 'a friend sees the reaction left on a sculpture');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
