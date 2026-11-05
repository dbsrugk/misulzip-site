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
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
