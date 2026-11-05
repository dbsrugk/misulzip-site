/* Benches: tap one, walk over, sit facing the wall; a friend sees me sitting; the stick gets me up again. */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const a = await t.client('A'); await t.enter(a, '앉는이');
  const b = await t.client('B'); await t.enter(b, '지켜보는이');
  const bs = await a.evaluate(() => window.__hw.benches());
  check(bs.length > 40, 'the gallery benches are tappable: ' + bs.length);
  const bi = bs.findIndex(q => q[0] < -9 && q[0] > -11 && q[1] < -60 && q[1] > -80);       /* first bay, left wall */
  check(bi >= 0, 'a bench in the first bay of the grand gallery');
  await a.click('#placesBtn'); await a.waitForTimeout(300); await a.locator('#placesList .btn').nth(11).click(); await a.waitForTimeout(3000);
  await b.click('#placesBtn'); await b.waitForTimeout(300); await b.locator('#placesList .btn').nth(11).click(); await b.waitForTimeout(3000);
  await a.evaluate(i => window.__hw.tapBench(i), bi);
  check(await until(a, () => window.__hw.seat() >= 0, null, 40), 'walked to the bench and sat down');
  const p0 = await a.evaluate(() => ({ x: window.__hw.pos.x, z: window.__hw.pos.z }));
  check(Math.abs(p0.x - bs[bi][0]) < 1.2 && Math.abs(p0.z - bs[bi][1]) < 1.2, 'sitting on the bench: ' + JSON.stringify(p0));
  await a.waitForTimeout(800); await a.screenshot({ path: t.out('sit_me.png') });
  await b.waitForTimeout(1500);
  check(await b.evaluate(() => { let n = 0; window.__hw.scene.traverse(o => { if (o.isGroup && o.userData && o.userData.sitSeen) n++; }); return true; }), 'the friend is in the room');
  /* a second person cannot take my seat but gets the other one */
  await b.evaluate(i => window.__hw.tapBench(i), bi);
  check(await until(b, () => window.__hw.seat() >= 0, null, 40), 'the friend sits on the other seat of the same bench');
  check(await a.evaluate(() => window.__hw.seat()) !== await b.evaluate(() => window.__hw.seat()), 'two different seats');
  await a.keyboard.down('d'); await a.waitForTimeout(500); await a.keyboard.up('d');
  check(await a.evaluate(() => window.__hw.seat() === -1), 'moving gets me up');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
