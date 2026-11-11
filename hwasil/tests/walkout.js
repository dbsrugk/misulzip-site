/* Fast travel out of the grand gallery walks around the rotunda fountain instead of getting stuck and jumping. */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '걷는이'); await p.evaluate(() => { window.__hwInstant = false; window.__hwWalk = true; });
  for (const [from, label] of [[[0, -150], 'from deep in the gallery'], [[0, -60], 'from just north of the rotunda'], [[0, -90], 'from the second wing']]) {
    await p.evaluate(([x, z]) => { window.__hw.pos.x = x; window.__hw.pos.z = z; }, from); await p.waitForTimeout(1500);
    await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(2).click();   /* the garden: far away, through the lobby door */
    let maxJump = 0, last = await p.evaluate(() => [window.__hw.pos.x, window.__hw.pos.z]), arrived = false;
    for (let i = 0; i < 800 && !arrived; i++) {   /* the garden is 200 m further south than it was */
      await p.waitForTimeout(250);
      const q = await p.evaluate(() => [window.__hw.pos.x, window.__hw.pos.z, window.__hw.area()]);
      maxJump = Math.max(maxJump, Math.hypot(q[0] - last[0], q[1] - last[1])); last = q;
      if (q[2] === '야외 전시 정원') arrived = true;
    }
    check(arrived, 'arrived at the garden ' + label + ' (ended at ' + last.map(v => typeof v === 'number' ? v.toFixed(1) : v).join(' ') + ')');
    check(maxJump < 6, 'no jump on the way ' + label + ': biggest step ' + maxJump.toFixed(1));
  }
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
