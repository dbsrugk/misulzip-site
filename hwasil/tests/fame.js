/* Hall of fame: a button on the screen, ranked lists by reactions, and "go see it" walks to the work. */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  check(await p.isVisible('#fameBtn'), 'the hall of fame button is on the screen');
  await p.click('#fameBtn'); await p.waitForTimeout(400);
  check(await p.isVisible('#fame') && (await p.locator('#fameTabs .btn').count()) === 3, 'it opens with three tabs');
  await p.locator('#fameTabs .btn').nth(1).click(); await p.waitForTimeout(600);
  const n = await p.locator('#fameList .roomRow').count();
  check(n >= 5, 'the masterpieces tab lists works: ' + n);
  await p.locator('#fameTabs .btn').nth(2).click(); await p.waitForTimeout(600);
  check((await p.locator('#fameList .roomRow').count()) === 15, 'the sculpture tab lists the fifteen pieces');
  await p.evaluate(() => { window.__hwInstant = true; });
  const before = await p.evaluate(() => ({ x: window.__hw.pos.x, z: window.__hw.pos.z }));
  await p.locator('#fameList .roomRow .btn').first().click(); await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({ x: window.__hw.pos.x, z: window.__hw.pos.z }));
  check(!(await p.isVisible('#fame')) && Math.hypot(after.x - before.x, after.z - before.z) > 5, 'tapping "go see it" closes the list and takes me there: ' + JSON.stringify(after));
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
